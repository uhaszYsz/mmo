// Battlefield-related functions

/**
 * Allows a player to enter a battlefield
 */
function enterBattlefield(game, playerId, battlefieldId) {
    const player = game.findPlayerById(playerId);
    if (!player) return false;

    if (player.attacking) {
        game.logEvent("You cannot enter a battlefield while fighting a monster.", game.getClientByPlayerId(playerId));
        return false;
    }

    const cell = game.state.world[player.y][player.x];
    
    // Ensure battlefields array exists
    if (!cell.battlefields) {
        cell.battlefields = [];
    }
    
    let battlefield = cell.battlefields.find(bf => bf.id === battlefieldId);

    // Create battlefield if it doesn't exist
    if (!battlefield) {
        battlefield = {
            id: battlefieldId,
            players: [],
            x: player.x,
            y: player.y
        };
        cell.battlefields.push(battlefield);
        game.logEvent(`Battlefield ${parseInt(battlefieldId.split('_')[3]) + 1} has been created!`, game.getClientByPlayerId(playerId));
    }

    // If player is in a safe zone, they leave it to enter the battlefield
    if (player.inNoBattleZone) {
        game.logEvent(`${player.name} left the safe zone to enter the battlefield.`, game.getClientByPlayerId(playerId));
        player.inNoBattleZone = false;
        
        // Remove player from the safe zone's player list
        if (cell && cell.noBattleZone) {
            const index = cell.noBattleZone.players.indexOf(player.id);
            if (index > -1) {
                cell.noBattleZone.players.splice(index, 1);
            }
        }
    }

    leaveAllBattlefieldsInCell(game, player); // Leave any other battlefield first

    if (!battlefield.players.includes(playerId)) {
        battlefield.players.push(playerId);
        player.currentBattlefield = battlefield.id;
        player.battlefieldPosition = 'back'; // Default to back row
        game.logEvent(`${player.name} has entered battlefield ${parseInt(battlefield.id.split('_')[3]) + 1} in the back row!`);
        game.updateWorldState();
        return true;
    }
    
    return false;
}

/**
 * Sets a player's position in a battlefield
 */
function setBattlefieldPosition(game, playerId, position) {
    const player = game.findPlayerById(playerId);
    const client = game.getClientByPlayerId(playerId);
    
    if (!player || !player.currentBattlefield) {
        game.logEvent("You are not on a battlefield.", client);
        return false;
    }
    
    if (position !== 'front' && position !== 'back') {
        game.logEvent("Invalid position.", client);
        return false;
    }
    
    player.battlefieldPosition = position;
    game.logEvent(`${player.name} moved to the ${position} row.`, client);
    game.updateWorldState();
    return true;
}

/**
 * Removes a player from all battlefields in their current cell
 */
function leaveAllBattlefieldsInCell(game, player) {
    if (!player) return;
    
    const cell = game.state.world[player.y][player.x];
    if (cell && cell.battlefields) {
        cell.battlefields.forEach(bf => {
            const index = bf.players.indexOf(player.id);
            if (index > -1) {
                bf.players.splice(index, 1);
            }
        });
        player.currentBattlefield = null;
        player.battlefieldPosition = null;
    }
}

module.exports = {
    enterBattlefield,
    setBattlefieldPosition,
    leaveAllBattlefieldsInCell
};