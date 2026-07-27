// effect/LocationActions.js
class LocationActions {
    static _getPlayer(game, playerIndex) {
        return Object.values(game.players).find(p => p.index === playerIndex);
    }

    // ---------- 市集 ----------
    static marketBuyWood(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.gold < 6) return { success: false, message: '金币不足' };
        player.gold -= 6;
        player.wood = (player.wood || 0) + 8;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '花费6金币，获得8木头' };
    }

    static marketBuyStone(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.gold < 6) return { success: false, message: '金币不足' };
        player.gold -= 6;
        player.stone = (player.stone || 0) + 4;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '花费6金币，获得4石头' };
    }

    static marketBuyIngredient(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.gold < 6) return { success: false, message: '金币不足' };
        player.gold -= 6;
        player.ingredient = (player.ingredient || 0) + 8;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '花费6金币，获得8食材' };
    }

    static marketBuyMineral(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.gold < 8) return { success: false, message: '金币不足' };
        player.gold -= 8;
        player.mineral = (player.mineral || 0) + 4;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '花费8金币，获得4矿物' };
    }

    // ---------- 伐木场 ----------
    static lumber1(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.stamina < 3) return { success: false, message: '体力不足' };
        player.stamina -= 3;
        player.wood = (player.wood || 0) + 8;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得8木头' };
    }

    static lumber2(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.stamina < 4) return { success: false, message: '体力不足' };
        player.stamina -= 4;
        player.wood = (player.wood || 0) + 10;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得10木头' };
    }

    // ---------- 矿洞 ----------
    static mine1(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.stamina < 3) return { success: false, message: '体力不足' };
        player.stamina -= 3;
        player.mineral = (player.mineral || 0) + 2;
        player.stone = (player.stone || 0) + 1;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得2矿物、1石头' };
    }

    static mine2(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.stamina < 4) return { success: false, message: '体力不足' };
        player.stamina -= 4;
        player.mineral = (player.mineral || 0) + 4;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得4矿物' };
    }

    // ---------- 森林 ----------
    static forest1(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.stamina < 3) return { success: false, message: '体力不足' };
        player.stamina -= 3;
        player.ingredient = (player.ingredient || 0) + 8;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得8食材' };
    }

    static forest2(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.stamina < 3) return { success: false, message: '体力不足' };
        player.stamina -= 3;
        player.wood = (player.wood || 0) + 6;
        player.stone = (player.stone || 0) + 1;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得6木头、1石头' };
    }

    // ---------- 渔场 ----------
    static fish1(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.stamina < 3) return { success: false, message: '体力不足' };
        player.stamina -= 3;
        player.ingredient = (player.ingredient || 0) + 8;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得8食材' };
    }

    static fish2(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.stamina < 4) return { success: false, message: '体力不足' };
        player.stamina -= 4;
        player.ingredient = (player.ingredient || 0) + 12;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得12食材' };
    }

    // ---------- 餐馆 ----------
    static restaurant1(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.gold < 6) return { success: false, message: '金币不足' };
        player.gold -= 6;
        player.stamina += 4;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得4体力' };
    }

    static restaurant2(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.gold < 6) return { success: false, message: '金币不足' };
        player.gold -= 6;
        player.food = (player.food || 0) + 4;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得4佳肴' };
    }

    static restaurant3(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if ((player.ingredient || 0) < 6) return { success: false, message: '食材不足' };
        player.ingredient -= 6;
        player.food = (player.food || 0) + 4;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得4佳肴' };
    }

    // ---------- 温泉 ----------
    static hotspring1(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.gold < 8) return { success: false, message: '金币不足' };
        player.gold -= 8;
        player.stamina += 6;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得6体力' };
    }

    static hotspring2(game, playerIndex, characterIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.gold < 8) return { success: false, message: '金币不足' };
        player.gold -= 8;
        const result = game.chaManager.promoteAffection(playerIndex, characterIndex);
        if (!result.success) return result;
        if (result.pointsGained) player.points = (player.points || 0) + result.pointsGained;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '好感度提升' };
    }

    // ---------- 遗迹 ----------
    static relicKnowledge(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.stamina < 3) return { success: false, message: '体力不足' };
        player.stamina -= 3;
        player.knowledge = (player.knowledge || 0) + 3;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得3知识' };
    }

    // ---------- 港口 ----------
    static port1(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.stamina < 3) return { success: false, message: '体力不足' };
        player.stamina -= 3;
        player.gold += 8;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得8金币' };
    }

    static port2(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.stamina < 4) return { success: false, message: '体力不足' };
        player.stamina -= 4;
        player.gold += 12;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得12金币' };
    }

    // ---------- 炼金屋 ----------
    static alchemy1(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if ((player.mineral || 0) < 2) return { success: false, message: '矿物不足' };
        player.mineral -= 2;
        player.tool = (player.tool || 0) + 1;
        player.wood = (player.wood || 0) + 2;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得1工具、2木头' };
    }

    static alchemy2(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if ((player.mineral || 0) < 4) return { success: false, message: '矿物不足' };
        player.mineral -= 4;
        player.tool = (player.tool || 0) + 2;
        player.stone = (player.stone || 0) + 2;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得2工具、2石头' };
    }

    // ---------- 花园/沙滩（提升好感度） ----------
    static gardenAffection(game, playerIndex, characterIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.gold < 8) return { success: false, message: '金币不足' };
        player.gold -= 8;
        const result = game.chaManager.promoteAffection(playerIndex, characterIndex);
        if (!result.success) return result;
        if (result.pointsGained) player.points = (player.points || 0) + result.pointsGained;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '好感度提升' };
    }

    // 沙滩与花园完全一致，使用同一个方法即可

    // ---------- 冒险者公会 ----------
    static recruitDraw(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.gold < 6) return { success: false, message: '金币不足' };
        player.gold -= 6;
        for (let i = 0; i < 2; i++) game.cardManager.drawCard(playerIndex);
        game.network.broadcast({
            type: 'hand_update',
            hands: game.cardManager.getState().hands,
            drawPileSize: game.cardManager.drawPile.length,
            discardPileSize: game.cardManager.discardPile.length
        });
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '抽取2张手牌' };
    }

    static recruitRest(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        player.stamina += 2;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '恢复2体力' };
    }

    // 保留原有招募角色（如果需要）
    static recruitCharacter(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.gold < 8) return { success: false, message: '金币不足' };
        const result = game.chaManager.recruitCharacter(playerIndex);
        if (!result.success) return result;
        player.gold -= 8;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: result.message };
    }

    // ---------- 纪念碑 ----------
    static contribute(game, playerIndex, resourceType) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        const costMap = { food: 3, building: 2, tool: 1, knowledge: 3 };
        const trackMap = { food: 'food', building: 'building', tool: 'tool', knowledge: 'knowledge' };
        const resName = { food: '佳肴', building: '建材', tool: '工具', knowledge: '知识' };
        if (!costMap[resourceType]) return { success: false, message: '无效贡献类型' };
        if ((player[resourceType] || 0) < costMap[resourceType]) return { success: false, message: '资源不足' };
        player[resourceType] -= costMap[resourceType];
        game.syncManager.broadcastFullPlayerState();
        game.trackManager.advanceOnTrack(playerIndex, trackMap[resourceType]);
        game.turnManager.advanceTurn();
        game.refreshUI();
        return { success: true, message: `贡献成功，推进${resName[resourceType]}轨道` };
    }

    // ---------- 工坊（新） ----------
    static workshopBuildWood(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if ((player.wood || 0) < 6) return { success: false, message: '木头不足' };
        player.wood -= 6;
        player.building = (player.building || 0) + 2;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得2建材' };
    }

    static workshopBuildStone(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if ((player.stone || 0) < 4) return { success: false, message: '石头不足' };
        player.stone -= 4;
        player.building = (player.building || 0) + 3;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得3建材' };
    }

    static workshopBuildMixed(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if ((player.wood || 0) < 6 || (player.stone || 0) < 3) return { success: false, message: '材料不足' };
        player.wood -= 6;
        player.stone -= 3;
        player.building = (player.building || 0) + 4;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得4建材' };
    }

    // ---------- 图书馆（新） ----------
    static libraryResearchWood(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if ((player.wood || 0) < 6) return { success: false, message: '木头不足' };
        player.wood -= 6;
        player.knowledge = (player.knowledge || 0) + 4;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得4知识' };
    }

    static libraryResearchStone(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if ((player.stone || 0) < 3) return { success: false, message: '石头不足' };
        player.stone -= 3;
        player.knowledge = (player.knowledge || 0) + 4;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得4知识' };
    }

    static libraryResearchMineral(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if ((player.mineral || 0) < 2) return { success: false, message: '矿物不足' };
        player.mineral -= 2;
        player.knowledge = (player.knowledge || 0) + 4;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得4知识' };
    }

    static libraryLearn(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if ((player.knowledge || 0) < 2) return { success: false, message: '知识不足' };
        player.knowledge -= 2;
        for (let i = 0; i < 2; i++) game.cardManager.drawCard(playerIndex);
        game.network.broadcast({
            type: 'hand_update',
            hands: game.cardManager.getState().hands,
            drawPileSize: game.cardManager.drawPile.length,
            discardPileSize: game.cardManager.discardPile.length
        });
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '抽取2张手牌' };
    }

    // ---------- 中心广场 ----------
    static promoteAffection(game, playerIndex, characterIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.gold < 8) return { success: false, message: '金币不足' };
        const result = game.chaManager.promoteAffection(playerIndex, characterIndex);
        if (!result.success) return result;
        player.gold -= 8;
        if (result.pointsGained) player.points = (player.points || 0) + result.pointsGained;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: result.message };
    }

    // ---------- 酒馆 ----------
    static innBuyFood(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.gold < 8) return { success: false, message: '金币不足' };
        player.gold -= 8;
        player.food = (player.food || 0) + 6;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '花费8金币，获得6佳肴' };
    }

    static innBuyStamina(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.gold < 6) return { success: false, message: '金币不足' };
        player.gold -= 6;
        player.stamina += 4;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '花费6金币，获得4体力' };
    }

    // ---------- 商店街 ----------
    static shopBuyFood(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.gold < 12) return { success: false, message: '金币不足' };
        player.gold -= 12;
        player.food = (player.food || 0) + 9;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '花费12金币，获得9佳肴' };
    }

    static shopBuyAffection(game, playerIndex, characterIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.gold < 8) return { success: false, message: '金币不足' };
        player.gold -= 8;
        const result = game.chaManager.promoteAffection(playerIndex, characterIndex);
        if (!result.success) return result;
        if (result.pointsGained) player.points = (player.points || 0) + result.pointsGained;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '好感度提升' };
    }

    // ---------- 采石场 ----------
    static quarry1(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.stamina < 3) return { success: false, message: '体力不足' };
        player.stamina -= 3;
        player.stone = (player.stone || 0) + 4;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得4石头' };
    }

    static quarry2(game, playerIndex) {
        const player = LocationActions._getPlayer(game, playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        if (player.stamina < 4) return { success: false, message: '体力不足' };
        player.stamina -= 4;
        player.stone = (player.stone || 0) + 6;
        game.syncManager.broadcastFullPlayerState();
        game.refreshUI();
        game.turnManager.advanceTurn();
        return { success: true, message: '获得6石头' };
    }
   
}