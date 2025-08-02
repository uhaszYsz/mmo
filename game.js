const { SeededRandom, structuredClone } = require('./utils');
const { CONFIG } = require('./config');
const bcrypt = require('bcryptjs');

// ===================================================================================
// --- GAME CLASS (CORE LOGIC) ---
// ===================================================================================
class Game {
    constructor(broadcastCallback, sendToClientCallback, getWssCallback) {
        this.broadcast = broadcastCallback;
        this.sendToClient = sendToClientCallback;
        this.getWss = getWssCallback; // Function to get the WebSocket server instance
        this.state = this.initializeGameState();
        this.nextTeamColorIndex = 0;
        this.adminAssigned = false;
    }

    // --- INITIALIZATION ---
    initializeGameState() {
        return {
            players: [], // Now stores all created players, online or offline
            teams: {},
            objects: [],
            entityLookup: new Map(), // O(1) entity lookup
            world: this.createEmptyWorld(),
            chatMessages: [],
            noobsTeamId: CONFIG.DEFAULT_TEAM_ID,
            enemyTemplates: CONFIG.ENEMY_TEMPLATES,
            buildingTemplates: CONFIG.BUILDING_TEMPLATES,
            craftingRecipes: CONFIG.CRAFTING_RECIPES,
            biomeMap: null // Will be initialized in gameplay.js
        };
    }

    createEmptyWorld() {
        return Array(CONFIG.MAP_SIZE).fill(0).map((_, y) => 
            Array(CONFIG.MAP_SIZE).fill(0).map((_, x) => ({
                players: [],
                objects: [],
                info: {},
                battlefields: Array(CONFIG.BATTLEFIELDS_PER_CELL).fill(0).map((_, i) => ({
                    id: `battlefield_${x}_${y}_${i}`,
                    players: []
                })),
                noBattleZone: {
                    id: `no_battle_zone_${x}_${y}`,
                    players: [],
                    x: x,
                    y: y
                }
            }))
        );
    }

    init() {
        this.logEvent("Game server started. Waiting for players...");
        this.createNoobsTeam();
        this.initializeEnemies();
        
        // OPTIMIZATION: Initialize world grid once instead of updating every tick
        const worldSystem = require('./world');
        worldSystem.initializeWorldGrid(this);
        
        this.updateWorldState();
        setInterval(() => this.update(), CONFIG.GAME_TICK);
    }

    // --- UTILITY & LOGGING ---
    logEvent(message, targetClient = null) {
        const payload = { type: 'log', message: `[${new Date().toLocaleTimeString()}] ${message}` };
        if (targetClient) {
            this.sendToClient(targetClient, payload);
        } else {
            this.broadcast(payload);
        }
        
        // Check if quiet mode is enabled and filter out spam messages
        const isQuietMode = typeof global !== 'undefined' && global.quietMode !== undefined ? global.quietMode : false;
        if (!isQuietMode || !this.isSpamMessage(message)) {
            console.log(payload.message);
        }
    }
    
    // Send static data once on login
    sendStaticData(client) {
        this.sendToClient(client, {
            type: 'staticData',
            data: {
                enemyTemplates: this.state.enemyTemplates,
                buildingTemplates: this.state.buildingTemplates,
                craftingRecipes: this.state.craftingRecipes,
                biomeMap: this.state.biomeMap,
                teams: this.state.teams,
                noobsTeamId: this.state.noobsTeamId
            }
        });
    }
    
    isSpamMessage(message) {
        // Define what constitutes spam messages
        const spamPatterns = [
            'started attacking',
            'joined the attack on',
            'Chat message added:',
            'World grid populated:',
            'defeated',
            'received',
            'has been defeated',
            'moved to',
            'has respawned',
            'is already being fully engaged'
        ];
        return spamPatterns.some(pattern => message.includes(pattern));
    }

    logCombat(message) {
        this.broadcast({ type: 'combatLog', message });
        
        // Check if quiet mode is enabled and filter out combat spam
        const isQuietMode = typeof global !== 'undefined' && global.quietMode !== undefined ? global.quietMode : false;
        if (!isQuietMode || !this.isCombatSpamMessage(message)) {
            console.log(`[Combat] ${message}`);
        }
    }
    
    isCombatSpamMessage(message) {
        // Define what constitutes combat spam messages
        const combatSpamPatterns = [
            'deals',
            'damage to',
            'dodges an attack from',
            'moved to'
        ];
        return combatSpamPatterns.some(pattern => message.includes(pattern));
    }

    findPlayerById(playerId) {
        // Use optimized entity lookup first (O(1) instead of O(n))
        if (this.state.entityLookup.has(playerId)) {
            const entity = this.state.entityLookup.get(playerId);
            // Only return if it's a player
            if (entity && entity.type === CONFIG.ENTITY_TYPES.PLAYER) {
                return entity;
            }
        }
        
        // Fallback to array search (should rarely happen)
        return this.state.players.find(p => p.id === playerId);
    }
    
    findEntityById(id) {
        // Use optimized lookup first
        if (this.state.entityLookup.has(id)) {
            return this.state.entityLookup.get(id);
        }
        
        // Fallback to array search (should rarely happen)
        return this.findPlayerById(id) || this.state.objects.find(o => o.id === id);
    }
    
    // Add entity to lookup
    addEntityToLookup(entity) {
        this.state.entityLookup.set(entity.id, entity);
    }
    
    // Remove entity from lookup
    removeEntityFromLookup(id) {
        this.state.entityLookup.delete(id);
    }
    
    // Update entity in lookup
    updateEntityInLookup(entity) {
        this.state.entityLookup.set(entity.id, entity);
    }
    
    getClientByPlayerId(playerId) {
        const wss = this.getWss();
        for (const client of wss.clients) {
            if (client.playerId === playerId) {
                return client;
            }
        }
        return null;
    }

    // --- PLAYER & AUTHENTICATION ---
    async loginOrCreatePlayer(client, { name, password }) {
        if (!this.validatePlayerName(name)) {
            this.logEvent("Player name must be 3-15 characters.", client);
            return;
        }

        const existingPlayer = this.state.players.find(p => p.name.toLowerCase() === name.toLowerCase());

        if (existingPlayer) {
            return this.loginExistingPlayer(client, existingPlayer, password);
        } else {
            return this.createNewPlayer(client, name, password);
        }
    }

    validatePlayerName(name) {
        return name && 
               name.length >= CONFIG.PLAYER_NAME_MIN_LENGTH && 
               name.length <= CONFIG.PLAYER_NAME_MAX_LENGTH;
    }

    async loginExistingPlayer(client, player, password) {
        const passwordMatch = await bcrypt.compare(password, player.passwordHash);
        if (!passwordMatch) {
            this.logEvent("Incorrect password.", client);
            return false;
        }
        
        if (player.isOnline) {
            this.logEvent("This player is already logged in.", client);
            return false;
        }
        
        player.isOnline = true;
        // Ensure player has type property for combat system
        if (!player.type) {
            player.type = CONFIG.ENTITY_TYPES.PLAYER;
        }
        client.playerId = player.id;
        this.logEvent(`Welcome back, ${player.name}!`);
        this.sendToClient(client, { 
            type: 'loginSuccess', 
            player: this.getSanitizedPlayer(player) 
        });
        
        // Send static data once on login
        this.sendStaticData(client);
        
        // Send initial game state
        const scopedState = this.getScopedStateForPlayer(player);
        this.sendToClient(client, { type: 'gameState', state: scopedState });
        
        return true;
    }

    async createNewPlayer(client, name, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const player = {
            id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name,
            passwordHash: hashedPassword,
            x: Math.floor(Math.random() * CONFIG.MAP_SIZE),
            y: Math.floor(Math.random() * CONFIG.MAP_SIZE),
            team: CONFIG.DEFAULT_TEAM_ID,
            isOnline: true,
            isDead: false,
            isAdmin: false,
            type: CONFIG.ENTITY_TYPES.PLAYER,
            baseStats: { ...CONFIG.PLAYER_DEFAULT_STATS },
            stats: { 
                hp: CONFIG.PLAYER_DEFAULT_STATS.hp, 
                maxHp: CONFIG.PLAYER_DEFAULT_STATS.maxHp,
                mp: CONFIG.PLAYER_DEFAULT_STATS.mp,
                maxMp: CONFIG.PLAYER_DEFAULT_STATS.maxMp,
                stamina: CONFIG.PLAYER_DEFAULT_STATS.stamina,
                maxStamina: CONFIG.PLAYER_DEFAULT_STATS.maxStamina,
                dmg: CONFIG.PLAYER_DEFAULT_STATS.dmg,
                speed: CONFIG.PLAYER_DEFAULT_STATS.speed,
                critical: CONFIG.PLAYER_DEFAULT_STATS.critical,
                dodge: CONFIG.PLAYER_DEFAULT_STATS.dodge
            },
            skills: structuredClone(CONFIG.PLAYER_DEFAULT_SKILLS),
            inventory: structuredClone(CONFIG.PLAYER_DEFAULT_INVENTORY),
            equipment: { hand: null, chest: null },
            buffs: [],
            attacking: null,
            attackingPlayer: null,
            nextAttackTime: Date.now(),
            currentBattlefield: null,
            battlefieldPosition: null,
            statsDirty: true // Mark for initial calculation
        };

        this.state.players.push(player);
        this.addEntityToLookup(player); // Add to lookup
        
        // Add player to noobs team
        if (this.state.teams[CONFIG.DEFAULT_TEAM_ID]) {
            this.state.teams[CONFIG.DEFAULT_TEAM_ID].members.push(player.id);
        }
        
        this.recalculatePlayerStats(player);
        
        client.playerId = player.id;
        this.logEvent(`New player ${name} has joined the game!`, client);
        
        const sanitizedPlayer = this.getSanitizedPlayer(player);
        this.sendToClient(client, { type: 'loginSuccess', player: sanitizedPlayer });
        
        // Send static data once on login
        this.sendStaticData(client);
        
        // Send initial game state
        const worldSystem = require('./world');
        const scopedState = worldSystem.getScopedStateForPlayer(this, player);
        this.sendToClient(client, { type: 'gameState', state: scopedState });
    }

    handleDisconnect(playerId) {
        if (!playerId) return;
        
        const player = this.findPlayerById(playerId);
        if (player) {
            this.logEvent(`Player ${player.name} has disconnected.`);
            player.isOnline = false; // Mark as offline, don't delete
            this.stopCombat(player);
            this.leaveAllBattlefieldsInCell(player);

            const team = this.state.teams[player.team];
            // If the disconnecting player is the admin, the team becomes leaderless.
            if (team && team.adminId === playerId && team.id !== CONFIG.DEFAULT_TEAM_ID) {
                team.adminId = null; 
                this.logEvent(`Admin ${player.name} of team '${team.name}' has disconnected. The team is now leaderless.`);
            }
        }
        this.updateWorldState();
    }

    // --- TEAM MANAGEMENT ---
    createNoobsTeam() {
        this.state.teams[CONFIG.DEFAULT_TEAM_ID] = {
            id: CONFIG.DEFAULT_TEAM_ID, 
            name: CONFIG.DEFAULT_TEAM_NAME, 
            members: [],
            color: CONFIG.DEFAULT_TEAM_COLOR, 
            adminId: null, 
            description: 'The default team for new and teamless players.',
            joinPolicy: CONFIG.JOIN_POLICIES.CLOSED, 
            isDefault: true
        };
        this.logEvent(`Default team '${CONFIG.DEFAULT_TEAM_NAME}' has been created.`);
    }

    createTeam(playerId, teamName) {
        const player = this.findPlayerById(playerId);
        const client = this.getClientByPlayerId(playerId);
        
        if (!player) return false;
        
        if (!this.validateTeamName(teamName)) {
            this.logEvent("Team name must be between 3 and 15 characters.", client);
            return false;
        }
        
        if (this.teamNameExists(teamName)) {
            this.logEvent(`A team named '${teamName}' already exists.`, client);
            return false;
        }

        const newTeamId = `team_${Date.now()}`;
        const color = this.getNextTeamColor();

        this.state.teams[newTeamId] = {
            id: newTeamId, 
            name: teamName, 
            members: [], 
            color: color,
            adminId: playerId, 
            description: '', 
            joinPolicy: CONFIG.JOIN_POLICIES.OPEN, 
            requests: []
        };
        
        this.logEvent(`Team '${teamName}' has been founded by ${player.name}!`);
        this.joinTeam(playerId, newTeamId);
        return true;
    }

    validateTeamName(teamName) {
        return teamName && 
               teamName.length >= CONFIG.TEAM_NAME_MIN_LENGTH && 
               teamName.length <= CONFIG.TEAM_NAME_MAX_LENGTH;
    }

    teamNameExists(teamName) {
        return Object.values(this.state.teams).some(t => 
            t.name.toLowerCase() === teamName.toLowerCase()
        );
    }

    getNextTeamColor() {
        const color = CONFIG.TEAM_COLORS[this.nextTeamColorIndex % CONFIG.TEAM_COLORS.length];
        this.nextTeamColorIndex++;
        return color;
    }

    joinTeam(playerId, teamId, isForced = false) {
        const player = this.findPlayerById(playerId);
        const newTeam = this.state.teams[teamId];
        const client = this.getClientByPlayerId(playerId);
        
        if (!player || !newTeam) {
            this.logEvent("Player or Team not found.", client);
            return false;
        }
        
        if (newTeam.id === CONFIG.DEFAULT_TEAM_ID) {
            this.logEvent("You cannot join the Noobs team directly.", client);
            return false;
        }
        
        if (newTeam.joinPolicy === CONFIG.JOIN_POLICIES.REQUEST && !isForced) {
            this.logEvent(`This team requires a request to join.`, client);
            return false;
        }

        // Leave current team if any
        if (player.team) {
            this.removePlayerFromTeam(player);
        }

        // Join new team
        player.team = teamId;
        newTeam.members.push(playerId);
        this.logEvent(`${player.name} has joined team '${newTeam.name}'.`);
        this.updateWorldState();
        return true;
    }

    removePlayerFromTeam(player) {
        const oldTeam = this.state.teams[player.team];
        if (oldTeam) {
            oldTeam.members = oldTeam.members.filter(id => id !== player.id);
            
            // Handle team disbanding or admin changes
            if (oldTeam.members.length === 0 && oldTeam.id !== CONFIG.DEFAULT_TEAM_ID) {
                delete this.state.teams[player.team];
                this.logEvent(`Team '${oldTeam.name}' has been disbanded.`);
            } else if (oldTeam.adminId === player.id) {
                // If the leaving player was the admin, the team becomes leaderless.
                oldTeam.adminId = null;
                this.logEvent(`Admin ${player.name} has left team '${oldTeam.name}'. The team is now leaderless.`);
            }
        }
    }

    leaveTeam(playerId) {
        const player = this.findPlayerById(playerId);
        const client = this.getClientByPlayerId(playerId);
        
        if (!player || !player.team || player.team === CONFIG.DEFAULT_TEAM_ID) {
            this.logEvent("You cannot leave this team.", client);
            return false;
        }
        
        this.leaveAllBattlefieldsInCell(player);
        const oldTeamId = player.team;
        const oldTeam = this.state.teams[oldTeamId];
        
        if (oldTeam) {
            this.removePlayerFromTeam(player);
            this.logEvent(`${player.name} has left team '${oldTeam.name}'.`);
        }

        player.team = CONFIG.DEFAULT_TEAM_ID;
        this.state.teams[CONFIG.DEFAULT_TEAM_ID].members.push(playerId);
        this.logEvent(`${player.name} has been moved to the '${CONFIG.DEFAULT_TEAM_NAME}' team.`);
        this.updateWorldState();
        return true;
    }

    updateTeamSettings(adminId, data) {
        const team = this.state.teams[data.teamId];
        const client = this.getClientByPlayerId(adminId);
        
        if (!team) {
            this.logEvent("Team not found.", client);
            return false;
        }
        
        if (team.adminId !== adminId) {
            this.logEvent("You are not the admin of this team.", client);
            return false;
        }

        team.description = data.description.slice(0, 100);
        team.joinPolicy = data.joinPolicy === CONFIG.JOIN_POLICIES.REQUEST 
            ? CONFIG.JOIN_POLICIES.REQUEST 
            : CONFIG.JOIN_POLICIES.OPEN;

        this.logEvent(`Team '${team.name}' settings have been updated.`, client);
        this.updateWorldState();
        return true;
    }

    requestToJoin(playerId, teamId) {
        const team = this.state.teams[teamId];
        const client = this.getClientByPlayerId(playerId);
        
        if (!team) {
            this.logEvent("Team not found.", client);
            return false;
        }
        
        if (team.requests.includes(playerId) || team.members.includes(playerId)) {
            this.logEvent("You have already sent a request or are a member.", client);
            return false;
        }

        team.requests.push(playerId);
        this.logEvent(`Your request to join '${team.name}' has been sent.`, client);
        this.updateWorldState();
        return true;
    }

    resolveJoinRequest(adminId, data) {
        const { teamId, requesterId, decision } = data;
        const team = this.state.teams[teamId];
        const adminClient = this.getClientByPlayerId(adminId);
        
        if (!team) {
            this.logEvent("Team not found.", adminClient);
            return false;
        }
        
        if (team.adminId !== adminId) {
            this.logEvent("You are not the admin of this team.", adminClient);
            return false;
        }

        team.requests = team.requests.filter(id => id !== requesterId);

        const requesterClient = this.getClientByPlayerId(requesterId);
        if (decision === 'accept') {
            this.logEvent(`Your request to join '${team.name}' was accepted.`, requesterClient);
            this.joinTeam(requesterId, teamId, true);
        } else {
            this.logEvent(`Your request to join '${team.name}' was declined.`, requesterClient);
            this.updateWorldState();
        }
        return true;
    }

    getSanitizedPlayer(player) {
        const playerCopy = structuredClone(player);
        delete playerCopy.passwordHash;
        return playerCopy;
    }

    // Import from gameplay.js
    initializeEnemies() {
        console.log('Game.initializeEnemies() called');
        try {
        const gameplaySystem = require('./gameplay');
            console.log('Gameplay system loaded successfully');
        gameplaySystem.initializeEnemies(this);
            console.log('Gameplay system.initializeEnemies() completed');
        } catch (error) {
            console.error('Error in initializeEnemies:', error);
        }
    }

    updateWorldState() {
        const worldSystem = require('./world');
        worldSystem.updateWorldState(this);
    }

    getScopedStateForPlayer(player) {
        const worldSystem = require('./world');
        return worldSystem.getScopedStateForPlayer(this, player);
    }

    recalculatePlayerStats(player) {
        // Only recalculate if stats are dirty
        if (!player.statsDirty) return;
        
        const gameplaySystem = require('./gameplay');
        gameplaySystem.recalculatePlayerStats(player);
        player.statsDirty = false; // Mark as clean
    }
    
    // Mark player stats as needing recalculation
    markPlayerStatsDirty(playerId) {
        const player = this.findPlayerById(playerId);
        if (player) {
            player.statsDirty = true;
        }
    }

    scaleEnemyStats(enemy) {
        const gameplaySystem = require('./gameplay');
        gameplaySystem.scaleEnemyStats(enemy);
    }

    respawnPlayer(playerId) {
        const gameplaySystem = require('./gameplay');
        return gameplaySystem.respawnPlayer(this, playerId);
    }

    movePlayer(playerId, x, y) {
        const gameplaySystem = require('./gameplay');
        return gameplaySystem.movePlayer(this, playerId, x, y);
    }

    startCombat(playerId, targetId) {
        const combatSystem = require('./combat');
        return combatSystem.startCombat(this, playerId, targetId);
    }

    stopCombat(player) {
        const combatSystem = require('./combat');
        combatSystem.stopCombat(this, player);
    }

    equipItem(playerId, itemIndex) {
        const inventorySystem = require('./inventory');
        return inventorySystem.equipItem(this, playerId, itemIndex);
    }

    unequipItem(playerId, slot) {
        const inventorySystem = require('./inventory');
        return inventorySystem.unequipItem(this, playerId, slot);
    }

    useItem(playerId, itemIndex) {
        const inventorySystem = require('./inventory');
        return inventorySystem.useItem(this, playerId, itemIndex);
    }

    useConsumableItem(player, item, client) {
        const inventorySystem = require('./inventory');
        return inventorySystem.useConsumableItem(this, player, item, client);
    }

    useScrollItem(player, item, client) {
        const inventorySystem = require('./inventory');
        return inventorySystem.useScrollItem(this, player, item, client);
    }

    enterBattlefield(playerId, battlefieldId) {
        const battlefieldSystem = require('./battlefield');
        return battlefieldSystem.enterBattlefield(this, playerId, battlefieldId);
    }

    setBattlefieldPosition(playerId, position) {
        const battlefieldSystem = require('./battlefield');
        return battlefieldSystem.setBattlefieldPosition(this, playerId, position);
    }

    leaveAllBattlefieldsInCell(player) {
        const battlefieldSystem = require('./battlefield');
        return battlefieldSystem.leaveAllBattlefieldsInCell(this, player);
    }

    buildConstructionSite(playerId) {
        const constructionSystem = require('./construction');
        return constructionSystem.buildConstructionSite(this, playerId);
    }

    buildBuilding(playerId, buildingName) {
        const constructionSystem = require('./construction');
        return constructionSystem.buildBuilding(this, playerId, buildingName);
    }

    donateToSite(playerId) {
        const constructionSystem = require('./construction');
        return constructionSystem.donateToSite(this, playerId);
    }

    deploySiegeMachine(playerId) {
        const constructionSystem = require('./construction');
        return constructionSystem.deploySiegeMachine(this, playerId);
    }

    handleChatMessage(playerId, data) {
        const chatSystem = require('./chat');
        return chatSystem.handleChatMessage(this, playerId, data);
    }

    handleAdminCommand(adminId, data) {
        const adminSystem = require('./admin');
        return adminSystem.handleAdminCommand(this, adminId, data);
    }

    craftItem(playerId, buildingIndex, recipeId) {
        const craftingSystem = require('./crafting');
        return craftingSystem.craftItem(this, playerId, buildingIndex, recipeId);
    }

    depositToStorage(playerId, buildingIndex, itemIndex, storageType, quantity = 1) {
        const storageSystem = require('./storage');
        return storageSystem.depositToStorage(this, playerId, buildingIndex, itemIndex, storageType, quantity);
    }

    withdrawFromStorage(playerId, buildingIndex, itemIndex, storageType) {
        const storageSystem = require('./storage');
        return storageSystem.withdrawFromStorage(this, playerId, buildingIndex, itemIndex, storageType);
    }

    summonBoss(playerId) {
        const player = this.findPlayerById(playerId);
        const client = this.getClientByPlayerId(playerId);
        
        if (!player || player.isDead) return false;
        
        // Find available boss templates
        const bossTemplates = CONFIG.ENEMY_TEMPLATES.filter(template => template.isBoss);
        if (bossTemplates.length === 0) {
            this.logEvent("No boss templates available.", client);
            return false;
        }
        
        // Get biome at player's location
        const biomeSystem = require('./biomes');
        const biomeKey = this.state.biomeMap ? biomeSystem.getBiomeAt(player.x, player.y, this.state.biomeMap) : 'FOREST';
        
        // Find bosses that can spawn in this biome
        const availableBosses = bossTemplates.filter(boss => boss.biome === biomeKey || boss.biome === 'ALL');
        
        if (availableBosses.length === 0) {
            this.logEvent(`No bosses can spawn in the ${CONFIG.BIOMES[biomeKey].name} biome.`, client);
            return false;
        }
        
        // Choose a random boss
        const rng = new SeededRandom(CONFIG.GAME_SEED + Date.now());
        const chosenBoss = availableBosses[Math.floor(rng.next() * availableBosses.length)];
        
        // Find the actual template index
        const actualTemplateIndex = CONFIG.ENEMY_TEMPLATES.findIndex(t => 
            t.name === chosenBoss.name && t.biome === chosenBoss.biome
        );
        
        // Create the boss
        const boss = {
            id: `${chosenBoss.name.replace(/\s/g, '')}_BOSS_${Date.now()}`,
            x: player.x,
            y: player.y,
            level: 1,
            templateId: actualTemplateIndex,
            baseStats: structuredClone(chosenBoss.baseStats),
            stats: structuredClone(chosenBoss.baseStats),
            weakness: chosenBoss.weakness,
            biome: biomeKey,
            isBoss: true,
            respawnUntil: null,
            type: CONFIG.ENTITY_TYPES.MOB,
            attackers: [],
            maxAttackers: CONFIG.MAX_ATTACKERS,
            nextAttackTime: Date.now(),
        };
        
        // Apply boss stats (3x HP, 2x DMG)
        boss.stats.hp *= 3;
        boss.stats.maxHp = boss.stats.hp;
        boss.stats.dmg *= 2;
        
        this.scaleEnemyStats(boss);
        this.state.objects.push(boss);
        
        this.logEvent(`${player.name} has summoned a boss ${chosenBoss.name} in the ${CONFIG.BIOMES[biomeKey].name}!`, client);
        this.updateWorldState();
        return true;
    }

    update() {
        const tickStart = Date.now();
        const updateSystem = require('./update');
        updateSystem.update(this);
        const tickEnd = Date.now();
        const tickDuration = tickEnd - tickStart;
        
        // Track tick performance for averaging
        if (!this.tickPerformance) {
            this.tickPerformance = {
                times: [],
                lastReportTime: Date.now()
            };
        }
        
        this.tickPerformance.times.push(tickDuration);
        
        // Warn if individual tick processing takes longer than the tickrate
        if (tickDuration > CONFIG.GAME_TICK) {
            console.warn(`[PERFORMANCE WARNING] Tick processing took ${tickDuration}ms, which exceeds the tickrate of ${CONFIG.GAME_TICK}ms. This may cause game lag.`);
        }
    }
    
    // Method to get current performance stats
    getPerformanceStats() {
        if (!this.tickPerformance || this.tickPerformance.times.length === 0) {
            return "No performance data available yet.";
        }
        
        const avgTime = this.tickPerformance.times.reduce((sum, time) => sum + time, 0) / this.tickPerformance.times.length;
        const maxTime = Math.max(...this.tickPerformance.times);
        const minTime = Math.min(...this.tickPerformance.times);
        
        return `[TICK STATS] Avg: ${avgTime.toFixed(1)}ms, Min: ${minTime}ms, Max: ${maxTime}ms, Ticks: ${this.tickPerformance.times.length}`;
    }
    
    // Method to reset performance tracking
    resetPerformanceTracking() {
        if (this.tickPerformance) {
            this.tickPerformance.times = [];
            this.tickPerformance.lastReportTime = Date.now();
        }
    }



    handleTargetDefeated(killer, target) {
        const combatSystem = require('./combat');
        combatSystem.handleTargetDefeated(this, killer, target);
    }

    examinePlayer(playerId, targetId) {
        const player = this.findPlayerById(playerId);
        const target = this.findPlayerById(targetId);
        const client = this.getClientByPlayerId(playerId);
        
        if (!player || !target) {
            this.logEvent("Player not found.", client);
            return false;
        }
        
        // Create a sanitized version of the target player for examination
        const examineData = {
            id: target.id,
            name: target.name,
            level: target.level || 1,
            team: target.team,
            stats: target.stats ? {
                hp: target.stats.hp || 0,
                maxHp: target.stats.maxHp || 100,
                mp: target.stats.mp || 0,
                maxMp: target.stats.maxMp || 100,
                stamina: target.stats.stamina || 0,
                maxStamina: target.stats.maxStamina || 100,
                dmg: target.stats.dmg || 0,
                speed: target.stats.speed || 0,
                critical: target.stats.critical || 0,
                dodge: target.stats.dodge || 0
            } : {},
            equipment: target.equipment || {},
            skills: target.skills || {},
            isDead: target.isDead || false,
            currentBattlefield: target.currentBattlefield,
            battlefieldPosition: target.battlefieldPosition
        };
        
        this.sendToClient(client, { 
            type: 'examine-player', 
            data: examineData 
        });
        return true;
    }

    examineItem(playerId, itemIndex, itemType) {
        const player = this.findPlayerById(playerId);
        const client = this.getClientByPlayerId(playerId);
        
        if (!player) {
            this.logEvent("Player not found.", client);
            return false;
        }
        
        let item = null;
        
        if (itemType === 'inventory') {
            if (!player.inventory || itemIndex >= player.inventory.length) {
                this.logEvent("Invalid item index.", client);
                return false;
            }
            item = player.inventory[itemIndex];
        } else if (itemType === 'equipment') {
            const slots = ['hand', 'chest'];
            if (itemIndex >= slots.length) {
                this.logEvent("Invalid equipment slot.", client);
                return false;
            }
            const slot = slots[itemIndex];
            item = player.equipment[slot];
            if (!item) {
                this.logEvent("No item equipped in that slot.", client);
                return false;
            }
        }
        
        if (!item) {
            this.logEvent("Item not found.", client);
            return false;
        }
        
        this.sendToClient(client, { 
            type: 'examine-item', 
            data: item 
        });
        return true;
    }

    enterNoBattleZone(playerId, x, y) {
        const player = this.findPlayerById(playerId);
        const client = this.getClientByPlayerId(playerId);
        
        if (!player) {
            this.logEvent("Player not found.", client);
            return false;
        }
        
        // Stop any ongoing combat when entering safe zone
        if (player.attacking) {
            this.stopCombat(player);
            this.logEvent("Combat stopped as you entered the safe zone.", client);
        }
        
        // Leave any battlefield
        this.leaveAllBattlefieldsInCell(player);
        
        // Move player to the no-battle zone
        player.x = x;
        player.y = y;
        player.inNoBattleZone = true;
        
        // Add player to the no-battle zone
        const cell = this.state.world[y][x];
        if (cell && cell.noBattleZone) {
            if (!cell.noBattleZone.players.includes(playerId)) {
                cell.noBattleZone.players.push(playerId);
            }
        }
        
        this.logEvent(`${player.name} has entered the safe zone.`, client);
        this.updateWorldState();
        return true;
    }
}

module.exports = { Game };