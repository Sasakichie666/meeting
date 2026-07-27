class SyncManager {
    constructor(game) {
        this.game = game;
    }

    // 广播全量玩家资源状态
    broadcastFullPlayerState() {
        const g = this.game;
        if (!g.network.isHost()) return;

        const playersData = ResourceManager.extractAllPlayersResources(g.players);
        g.network.broadcast({
            type: 'resource_update',
            players: playersData,
            ...(playersData[g.localPlayerId] || {})
        });
    }

    // 向新加入的玩家发送完整状态（包含角色数据、工位状态、任务和轨道）
    syncToNewPlayer(remotePeerId) {
        const g = this.game;
        const player = g.players[remotePeerId];
        g.network.sendToPeer(remotePeerId, {
            type: 'assign_player',
            playerIndex: player.index,
            playerName: player.name,
            color: player.color,
            ...ResourceManager.extractPlayerResources(player),
            allPlayers: g.playerManager.getSerializablePlayers(),
            playerOrder: g.playerOrder,
            currentTurnIndex: g.currentTurnIndex,
            gameStarted: g.gameStarted,
            hands: g.cardManager.getState().hands,
            drawPileSize: g.cardManager.drawPile.length,
            discardPileSize: g.cardManager.discardPile.length,
            allSlots: g.playerSlots,
            characters: g.chaManager.playerCharacters,
            workspaceUsed: g.workspaceManager.getSerializedState(),
            taskDisplay: g.taskManager.displayedTasks,
            taskDrawPileSize: g.taskManager.drawPile.length,
            positions: g.trackManager.positions   // 新增：轨道位置
        });
    }

    // 广播所有玩家的角色数据（角色变更时调用）
    broadcastCharacterState() {
        const g = this.game;
        if (!g.network.isHost()) return;

        const characterData = {};
        Object.values(g.players).forEach(player => {
            const idx = player.index;
            const chars = g.chaManager.getPlayerCharacters(idx);
            characterData[idx] = chars;
        });

        g.network.broadcast({
            type: 'character_update',
            characters: characterData
        });
    }

    // 应用资源更新到单个玩家对象
    _applyPlayerResources(playerId, data) {
        const g = this.game;
        const player = g.players[playerId];
        if (!player) return;
        ResourceManager.applyToPlayer(player, data);
    }
}