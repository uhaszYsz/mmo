// Game mechanics and player-related functions

const { CONFIG } = require('./config');
const { SeededRandom, structuredClone } = require('./utils');
const biomeSystem = require('./biomes');

/**
 * Initializes enemies across the world based on biomes
 */
function initializeEnemies(game) {
    console.log('Starting enemy initialization...');
    
    // Initialize biome map
    const biomeSystem = require('./biomes');
    game.state.biomeMap = biomeSystem.generateBiomeMap();
    console.log('Biome map generated with', Object.keys(game.state.biomeMap).length, 'tiles');
    
    // Spawn enemies based on biomes
    biomeSystem.spawnBiomeEnemies(game, game.state.biomeMap);
    
    // Initialize entity lookup
    game.state.players.forEach(player => {
        game.addEntityToLookup(player);
    });
    
    game.state.objects.forEach(obj => {
        game.addEntityToLookup(obj);
    });
    
    const mobCount = game.state.objects.filter(obj => obj.type === 'mob').length;
    console.log('Enemies have been spawned across the world based on biomes.');
    console.log('Total mobs in game state:', mobCount);
}

/**
 * Recalculates a player's stats based on equipment, skills, and buffs
 */
function recalculatePlayerStats(player) {
    if (!player) return;
    const currentHp = player.stats.hp;
    const currentMp = player.stats.mp;
    const currentStamina = player.stats.stamina;

    // Ensure baseStats exists, fallback to current stats if not
    const baseStats = player.baseStats || { ...player.stats };
    const finalStats = { ...baseStats };

    // Apply equipment bonuses
    for (const slot in player.equipment) {
        const item = player.equipment[slot];
        if (item?.stats) {
            for (const stat in item.stats) {
                if (finalStats[stat] !== undefined) {
                    finalStats[stat] += item.stats[stat];
                }
            }
        }
    }

    // Apply skill bonuses (e.g., HP boost from HP skill)
    if (player.skills.hp) {
        const hpMultiplier = 1 + (player.skills.hp.level / 100);
        finalStats.maxHp = Math.floor(finalStats.maxHp * hpMultiplier);
    }

    // Apply buffs
    player.buffs.forEach(buff => {
        if (finalStats[buff.stat] !== undefined) {
            const bonus = finalStats[buff.stat] * (buff.percentage / 100);
            finalStats[buff.stat] += bonus;
        }
    });

    player.stats = finalStats;
    player.stats.hp = Math.min(currentHp, player.stats.maxHp);
    player.stats.mp = Math.min(currentMp, player.stats.maxMp);
    player.stats.stamina = Math.min(currentStamina, player.stats.maxStamina);
}

/**
 * Scales enemy stats based on their level
 */
function scaleEnemyStats(enemy) {
    const levelMultiplier = 1 + (enemy.level - 1) * CONFIG.ENEMY_STAT_SCALING_PER_LEVEL;
    enemy.stats.maxHp = Math.floor(enemy.baseStats.hp * levelMultiplier);
    enemy.stats.dmg = Math.floor(enemy.baseStats.dmg * levelMultiplier);
    enemy.stats.speed = enemy.baseStats.speed * levelMultiplier;
    enemy.stats.hp = enemy.stats.maxHp;
    enemy.nextAttackTime = Date.now(); // Initialize attack timestamp
}

/**
 * Respawns a dead player
 * OPTIMIZED: Updates grid position efficiently
 */
function respawnPlayer(game, playerId) {
    const player = game.findPlayerById(playerId);
    if (player && player.isDead) {
        player.isDead = false;
        // Ensure stats exist with safe defaults
        if (!player.stats) player.stats = {};
        player.stats.hp = player.stats.maxHp || 100;
        player.stats.mp = player.stats.maxMp || 50;
        player.stats.stamina = player.stats.maxStamina || 500;
        
        // OPTIMIZATION: Store old position before updating
        const oldX = player.x;
        const oldY = player.y;
        
        player.x = 0;
        player.y = 0;
        
        // OPTIMIZATION: Update grid position efficiently
        const worldSystem = require('./world');
        worldSystem.updatePlayerPosition(game, player, oldX, oldY, 0, 0);
        
        game.markPlayerStatsDirty(playerId);
        game.recalculatePlayerStats(player);
        game.logEvent(`${player.name} has respawned!`);
        game.updateWorldState();
        return true;
    }
    return false;
}

/**
 * Moves a player to a new position if valid
 * OPTIMIZED: Only updates the specific grid cells involved in the move
 */
function movePlayer(game, playerId, x, y) {
    const player = game.findPlayerById(playerId);
    const client = game.getClientByPlayerId(playerId);
    const worldSystem = require('./world');
    
    if (!player || player.isDead) return false;
    
    if (!worldSystem.isValidPosition(x, y)) {
        game.logEvent("Cannot move outside the map boundaries.", client);
        return false;
    }
    
    if (!worldSystem.isAdjacentPosition(player.x, player.y, x, y)) {
        game.logEvent("You can only travel to adjacent cells.", client);
        return false;
    }

    game.leaveAllBattlefieldsInCell(player);
    game.stopCombat(player);

    // OPTIMIZATION: Store old position before updating
    const oldX = player.x;
    const oldY = player.y;

    game.logEvent(`${player.name} moved to (${x}, ${y}).`);
    player.x = x;
    player.y = y;
    
    // OPTIMIZATION: Update only the specific grid cells involved in the move
    worldSystem.updatePlayerPosition(game, player, oldX, oldY, x, y);
    
    // Still call updateWorldState for client updates, but grid is already updated
    game.updateWorldState();
    return true;
}

module.exports = {
    initializeEnemies,
    recalculatePlayerStats,
    scaleEnemyStats,
    respawnPlayer,
    movePlayer
};