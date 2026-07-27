class SeasonManager {
    constructor(game) {
        this.game = game;
        this.currentSeasonIndex = 0;
        this.seasons = [
            { icon: '🌸', name: '春季', desc: '万物复苏', color: '#b8d9a6' },
            { icon: '☀️', name: '夏季', desc: '烈阳高照', color: '#f5c542' },
            { icon: '🍂', name: '秋季', desc: '金风送爽', color: '#e8788a' },
            { icon: '❄️', name: '冬季', desc: '冰封千里', color: '#9bb8da' }
        ];
    }

    requestEndSeason(playerIndex) {
        const g = this.game;
        if (!g.gameStarted) return;
        if (playerIndex !== g.localPlayerIndex) return;

        const player = g.players[g.localPlayerId];
        if (!player) return;

        if (!g.network.isHost()) {
            g.network.sendToPeer(g.network.hostId, {
                type: 'req_end_season',
                playerIndex: player.index
            });
            return;
        }
        this._executeEndSeason(player.index);
    }

    _executeEndSeason(playerIndex) {
        const g = this.game;
        const player = Object.values(g.players).find(p => p.index === playerIndex);
        if (!player) return;
        if (player.hasEndedSeason) return;

        player.hasEndedSeason = true;
        LogSystem.logAction(`${player.name} 结束了时代`, player.color);

        g.network.broadcast({
            type: 'season_ended',
            playerIndex: playerIndex
        });

        const allEnded = g.playerOrder.every(pid => g.players[pid]?.hasEndedSeason);
        if (allEnded) {
            this._advanceSeason();
        } else {
            if (playerIndex === g.currentTurnIndex) {
                const nextIndex = this.getNextActivePlayerIndex(playerIndex);
                if (nextIndex !== -1) {
                    g.currentTurnIndex = nextIndex;
                    g.board.setCurrentTurn(g.currentTurnIndex);
                    g.refreshUI();
                    g.network.broadcast({
                        type: 'turn_change',
                        currentTurnIndex: g.currentTurnIndex,
                        drawPileSize: g.cardManager.drawPile.length,
                        discardPileSize: g.cardManager.discardPile.length
                    });
                }
            }
        }
        g.refreshUI();
    }

    getNextActivePlayerIndex(afterIndex) {
        const g = this.game;
        if (g.playerOrder.length === 0) return -1;
        let start = (afterIndex + 1) % g.playerOrder.length;
        let current = start;
        do {
            const peerId = g.playerOrder[current];
            const player = g.players[peerId];
            if (player && !player.hasEndedSeason) {
                return player.index;
            }
            current = (current + 1) % g.playerOrder.length;
        } while (current !== start);
        return -1;
    }

    _advanceSeason() {
        const g = this.game;
        // 1. 供给结算
        g.feastManager.performFeastCheck();

        // 2. 重置米宝
        g.chaManager.resetAllMeepleForAllPlayers();

        // 3. 切换季节
        this.currentSeasonIndex = (this.currentSeasonIndex + 1) % this.seasons.length;

        // 4. 重置结束状态
        Object.values(g.players).forEach(p => { p.hasEndedSeason = false; });

        // 5. 常规奖励：所有玩家抽2牌，恢复3体力
        const totalPlayers = g.playerOrder.length;
        for (let i = 0; i < totalPlayers; i++) {
            for (let j = 0; j < 2; j++) {
                g.cardManager.drawCard(i);
            }
        }
        Object.values(g.players).forEach(p => { p.stamina += 3; });

        // 6. 季节额外效果
        const seasonName = this.seasons[this.currentSeasonIndex].name;
        if (seasonName === '夏季') {
            Object.values(g.players).forEach(p => { p.stamina += 3; });
            g.ui.showToast('☀️ 夏季额外恢复3体力');
        } else if (seasonName === '秋季') {
            Object.values(g.players).forEach(p => { p.food = (p.food || 0) + 3; });
            g.ui.showToast('🍂 秋季额外获得3佳肴');
        } else if (seasonName === '冬季') {
            for (let i = 0; i < totalPlayers; i++) {
                for (let j = 0; j < 2; j++) {
                    g.cardManager.drawCard(i);
                }
            }
            g.network.broadcast({
                type: 'hand_update',
                hands: g.cardManager.getState().hands,
                drawPileSize: g.cardManager.drawPile.length,
                discardPileSize: g.cardManager.discardPile.length
            });
            g.ui.showToast('❄️ 冬季额外抽2张牌');
        }

        // 7. 重置回合
        g.currentTurnIndex = g.players[g.playerOrder[0]]?.index ?? 0;
        g.board.setCurrentTurn(g.currentTurnIndex);
        g.workspaceManager.resetSeason();

        // 8. 广播季节变更
        g.network.broadcast({
            type: 'season_change',
            seasonIndex: this.currentSeasonIndex,
            currentTurnIndex: g.currentTurnIndex,
            allPlayers: g.playerManager.getSerializablePlayers(),
            hands: g.cardManager.getState().hands,
            drawPileSize: g.cardManager.drawPile.length,
            discardPileSize: g.cardManager.discardPile.length,
            allSlots: g.playerSlots,
            workspaceUsed: g.workspaceManager.getSerializedState()
        });

        const season = this.seasons[this.currentSeasonIndex];
        g.ui.showToast(`🌱 进入${season.name}的时代！`);
        g.refreshUI();
    }

    getCurrentSeasonInfo() {
        return this.seasons[this.currentSeasonIndex];
    }
}