class SeasonManager {
    constructor(game) {
        this.game = game;
        this.currentSeasonIndex = 0;
        this.currentYear = 1;                    // ✅ 年份从1开始
        this.seasons = [
            { icon: '🌸', name: '春季', desc: '', color: '#b8d9a6' },
            { icon: '☀️', name: '夏季', desc: '获得3体力', color: '#f5c542' },
            { icon: '🍂', name: '秋季', desc: '获得3佳肴', color: '#e8788a' },
            { icon: '❄️', name: '冬季', desc: '获得2手牌', color: '#9bb8da' }
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

        g.network.broadcast({ type: 'season_ended', playerIndex });

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

    // ✅ 安全的回合推进：基于 playerOrder 顺序，不受玩家索引值影响
    getNextActivePlayerIndex(afterIndex) {
        const g = this.game;
        if (g.playerOrder.length === 0) return -1;

        // 找到当前回合玩家在 playerOrder 中的位置
        const currentPeerId = Object.keys(g.players).find(pid => g.players[pid].index === afterIndex);
        if (!currentPeerId) return -1;
        const currentPos = g.playerOrder.indexOf(currentPeerId);
        if (currentPos === -1) return -1;

        let start = (currentPos + 1) % g.playerOrder.length;
        let pos = start;
        do {
            const peerId = g.playerOrder[pos];
            const player = g.players[peerId];
            if (player && !player.hasEndedSeason) {
                return player.index;                // 返回玩家索引（0-3）
            }
            pos = (pos + 1) % g.playerOrder.length;
        } while (pos !== start);
        return -1;
    }

    _advanceSeason() {
        const g = this.game;
        g.feastManager.performFeastCheck();
        g.chaManager.resetAllMeepleForAllPlayers();

        this.currentSeasonIndex = (this.currentSeasonIndex + 1) % this.seasons.length;
        if (this.currentSeasonIndex === 0) {
            this.currentYear++;                     // ✅ 年份递增
        }

        Object.values(g.players).forEach(p => { p.hasEndedSeason = false; });

        const totalPlayers = g.playerOrder.length;
        for (let i = 0; i < totalPlayers; i++) {
            for (let j = 0; j < 2; j++) {
                g.cardManager.drawCard(i);
            }
        }
        Object.values(g.players).forEach(p => { p.stamina += 3; });

        const seasonName = this.seasons[this.currentSeasonIndex].name;
        if (seasonName === '夏季') {
            Object.values(g.players).forEach(p => { p.stamina += 3; });
            const msg = '☀️ 夏季额外恢复3体力';
            g.ui.showToast(msg);
            g.network.broadcast({ type: 'toast', message: msg });
        } else if (seasonName === '秋季') {
            Object.values(g.players).forEach(p => { p.food = (p.food || 0) + 3; });
            const msg = '🍂 秋季额外获得3佳肴';
            g.ui.showToast(msg);
            g.network.broadcast({ type: 'toast', message: msg });
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
            const msg = '❄️ 冬季额外抽2张牌';
            g.ui.showToast(msg);
            g.network.broadcast({ type: 'toast', message: msg });
        }

        g.currentTurnIndex = g.players[g.playerOrder[0]]?.index ?? 0;
        g.board.setCurrentTurn(g.currentTurnIndex);
        g.workspaceManager.resetSeason();

        g.network.broadcast({
            type: 'season_change',
            seasonIndex: this.currentSeasonIndex,
            currentYear: this.currentYear,           // ✅ 广播年份
            currentTurnIndex: g.currentTurnIndex,
            allPlayers: g.playerManager.getSerializablePlayers(),
            hands: g.cardManager.getState().hands,
            drawPileSize: g.cardManager.drawPile.length,
            discardPileSize: g.cardManager.discardPile.length,
            allSlots: g.playerSlots,
            workspaceUsed: g.workspaceManager.getSerializedState()
        });

        const season = this.seasons[this.currentSeasonIndex];
        const seasonMsg = `🌱 进入第${this.currentYear}年·${season.name}的时代！`;
        g.ui.showToast(seasonMsg);
        g.network.broadcast({ type: 'toast', message: seasonMsg });
        if (typeof soundManager !== 'undefined' && soundManager.play) {
            soundManager.play('seasonChange');
        }
        g.refreshUI();
    }

    getCurrentSeasonInfo() { return this.seasons[this.currentSeasonIndex]; }
    getCurrentYear() { return this.currentYear; }
}