// Construction-related functions

const { CONFIG } = require('./config');

/**
 * Creates a new construction site
 */
function buildConstructionSite(game, playerId) {
    const player = game.findPlayerById(playerId);
    const client = game.getClientByPlayerId(playerId);
    
    if (!player || player.isDead || !player.team) {
        game.logEvent("You must be in a team to build.", client);
        return false;
    }
    
    if (player.team === CONFIG.DEFAULT_TEAM_ID) {
        game.logEvent("The Noobs team cannot build construction sites.", client);
        return false;
    }
    
    const { x, y } = player;
    const cell = game.state.world[y][x];

    if (cell.objects.some(o => o.type === CONFIG.ENTITY_TYPES.CONSTRUCTION_SITE)) {
        game.logEvent("A construction site already exists here.", client);
        return false;
    }

    const siteId = `site_t${player.team}_${x}_${y}`;
    game.state.objects.push({
        id: siteId, x, y, level: 1,
        stats: { 
            hp: CONFIG.CONSTRUCTION_BASE_HP, 
            maxHp: CONFIG.CONSTRUCTION_BASE_HP, 
            dmg: 0, 
            speed: 0 
        },
        type: CONFIG.ENTITY_TYPES.CONSTRUCTION_SITE, 
        team: player.team,
        materials: { bricks: 0 },
        requiredMaterials: { bricks: CONFIG.CONSTRUCTION_BASE_BRICKS_REQUIRED },
        constructionCompleteUntil: null,
        buildings: [],
        attackers: [],
        maxAttackers: CONFIG.MAX_ATTACKERS
    });
    
    game.logEvent(`${player.name} started a construction site at (${x}, ${y}).`);
    game.updateWorldState();
    return true;
}

/**
 * Adds a building to a construction site
 */
function buildBuilding(game, playerId, buildingName) {
    const player = game.findPlayerById(playerId);
    const client = game.getClientByPlayerId(playerId);
    
    if (!player) return false;

    const site = game.state.world[player.y][player.x].objects.find(o => 
        o.type === CONFIG.ENTITY_TYPES.CONSTRUCTION_SITE && o.team === player.team
    );

    if (!site) {
        game.logEvent("You must be at your team's construction site to build.", client);
        return false;
    }

    const buildingTemplate = game.state.buildingTemplates[buildingName];
    if (!buildingTemplate) {
        game.logEvent(`Building '${buildingName}' does not exist.`, client);
        return false;
    }
    
    const brickItem = player.inventory.find(item => item.name === 'Brick');
    const requiredBricks = buildingTemplate.bricks;

    if (!brickItem || brickItem.quantity < requiredBricks) {
        game.logEvent(`You need ${requiredBricks} bricks to build a ${buildingName}.`, client);
        return false;
    }

    brickItem.quantity -= requiredBricks;
    if (brickItem.quantity <= 0) {
        player.inventory = player.inventory.filter(item => item.name !== 'Brick');
    }

    const newBuilding = {
        name: buildingName,
        level: 1,
        type: buildingTemplate.type,
    };

    // Initialize storage for new buildings
    if (newBuilding.type === 'storage') {
        newBuilding.inventory = [];
        newBuilding.log = [];
    } else if (newBuilding.type === 'personal_storage') {
        newBuilding.playerInventories = {};
    } else if (newBuilding.type === 'crafting') {
        newBuilding.recipeIds = buildingTemplate.recipeIds || [];
    }

    site.buildings.push(newBuilding);
    game.logEvent(`${player.name} built a new ${buildingName} at the construction site!`);
    game.updateWorldState();
    return true;
}

/**
 * Donates bricks to a construction site
 */
function donateToSite(game, playerId) {
    const player = game.findPlayerById(playerId);
    if (!player) return false;
    
    const site = game.state.world[player.y][player.x].objects.find(o => 
        o.type === CONFIG.ENTITY_TYPES.CONSTRUCTION_SITE && o.team === player.team
    );
    
    if (!site) {
        game.logEvent("No friendly construction site in this area.", game.getClientByPlayerId(playerId));
        return false;
    }
    
    const brickItem = player.inventory.find(item => item.name === 'Brick');
    if (!brickItem || brickItem.quantity <= 0) {
        game.logEvent("No bricks to donate.", game.getClientByPlayerId(playerId));
        return false;
    }

    const needed = site.requiredMaterials.bricks - site.materials.bricks;
    const toDonate = Math.min(brickItem.quantity, needed);
    
    if (toDonate <= 0) {
        game.logEvent("Site does not need more bricks for the current upgrade.", game.getClientByPlayerId(playerId));
        return false;
    }

    brickItem.quantity -= toDonate;
    site.materials.bricks += toDonate;
    game.logEvent(`${player.name} donated ${toDonate} bricks.`);

    if (site.materials.bricks >= site.requiredMaterials.bricks) {
        const timeAdded = site.requiredMaterials.bricks * CONFIG.CONSTRUCTION_TIME_PER_BRICK;
        const now = Date.now();
        const currentEndTime = site.constructionCompleteUntil && site.constructionCompleteUntil > now 
            ? site.constructionCompleteUntil 
            : now;
        
        site.constructionCompleteUntil = currentEndTime + timeAdded;
        game.logEvent(`Construction for next level has begun! Time remaining: ${Math.ceil((site.constructionCompleteUntil - now) / 1000)}s`);
    }

    if (brickItem.quantity <= 0) {
        player.inventory = player.inventory.filter(item => item.name !== 'Brick');
    }
    
    game.updateWorldState();
    return true;
}

/**
 * Deploys a siege machine to attack an enemy construction site
 */
function deploySiegeMachine(game, playerId) {
    const player = game.findPlayerById(playerId);
    const client = game.getClientByPlayerId(playerId);
    
    if (!player || !player.team) {
        game.logEvent("You must be in a team to deploy siege engines.", client);
        return false;
    }
    
    const enemySite = game.state.world[player.y][player.x].objects.find(o => 
        o.type === CONFIG.ENTITY_TYPES.CONSTRUCTION_SITE && o.team !== player.team
    );
    
    if (!enemySite) { 
        game.logEvent("There is no enemy construction site here to attack.", client); 
        return false; 
    }

    const cell = game.state.world[player.y][player.x];
    const currentBattlefield = cell.battlefields.find(bf => bf.players.includes(playerId));

    if (!currentBattlefield) {
        game.logEvent("You must be on a battlefield to deploy a siege engine.", client);
        return false;
    }

    const defendingTeamId = enemySite.team;
    const isDefenderPresent = currentBattlefield.players.some(pId => {
        const p = game.findPlayerById(pId);
        return p && p.team === defendingTeamId;
    });

    if (isDefenderPresent) {
        game.logEvent("You cannot deploy a siege engine while defenders are on this battlefield.", client);
        return false;
    }

    const brickItem = player.inventory.find(item => item.name === 'Brick');
    if (!brickItem || brickItem.quantity < CONFIG.SIEGE_MACHINE_COST) { 
        game.logEvent(`You need ${CONFIG.SIEGE_MACHINE_COST} bricks to deploy a siege machine.`, client); 
        return false; 
    }

    brickItem.quantity -= CONFIG.SIEGE_MACHINE_COST;
    if (brickItem.quantity <= 0) {
        player.inventory = player.inventory.filter(item => item.name !== 'Brick');
    }

    const newMachineId = `siege_${player.team}_${Date.now()}`;
    game.state.objects.push({
        id: newMachineId, 
        x: player.x, 
        y: player.y, 
        team: player.team,
        type: CONFIG.ENTITY_TYPES.SIEGE_MACHINE,
        stats: { 
            hp: CONFIG.SIEGE_MACHINE_HP, 
            maxHp: CONFIG.SIEGE_MACHINE_HP, 
            dmg: CONFIG.SIEGE_MACHINE_DAMAGE, 
            selfDmg: CONFIG.SIEGE_MACHINE_SELF_DAMAGE 
        },
        targetId: enemySite.id,
        nextAttackTime: Date.now() + 1000,
    });
    
    game.logEvent(`${player.name} deployed a siege machine!`);
    game.updateWorldState();
    return true;
}

module.exports = {
    buildConstructionSite,
    buildBuilding,
    donateToSite,
    deploySiegeMachine
};