class TurnManager {
    constructor(game) {
        this.game = game;
    }

    advanceTurn() {
        const g = this.game;
        if (!g.network.isHost()) return;
        if (g.playerOrder.length === 0) return;

        const nextIndex = g.seasonManager.getNextActivePlayerIndex(g.currentTurnIndex);
        if (nextIndex === -1) return;
        g.currentTurnIndex = nextIndex;
        g.board.setCurrentTurn(g.currentTurnIndex);
        g.cardManager.clearSelection();
        g.refreshUI();

        g.network.broadcast({
            type: 'turn_change',
            currentTurnIndex: g.currentTurnIndex,
            drawPileSize: g.cardManager.drawPile.length,
            discardPileSize: g.cardManager.discardPile.length
        });

        if (g.currentTurnIndex === g.localPlayerIndex) {
            g.ui.showToast('🎯 轮到你的回合了！');
        }
    }

    startGame() {
        const g = this.game;
        if (!g.network.isHost() || g.gameStarted) return;
        if (Object.keys(g.players).length < 2) {
            g.ui.showToast('⚠️ 至少需要2名玩家');
            return;
        }

        Object.values(g.players).forEach(p => { p.hasEndedSeason = false; });

        g.gameStarted = true;
        g.currentTurnIndex = 0;
        g.board.setCurrentTurn(g.currentTurnIndex);

        g.playerOrder.forEach((pid, idx) => { g.cardManager.hands[idx] = []; });
        g.cardManager.initDrawPile();

        const totalPlayers = g.playerOrder.length;
        for (let i = 0; i < totalPlayers; i++) {
            for (let j = 0; j < 4; j++) {
                g.cardManager.drawCard(i);
            }
        }

        g.playerOrder.forEach((pid, idx) => {
            const player = g.players[pid];
            if (!player) return;
            if (idx === 1) {
                player.gold += 5;
                g.ui.showToast(`${player.name} 获得后手补偿 5 金币`);
            } else if (idx === 2) {
                player.gold += 10;
                g.ui.showToast(`${player.name} 获得后手补偿 10 金币`);
            } else if (idx === 3) {
                player.gold += 15;
                g.ui.showToast(`${player.name} 获得后手补偿 15 金币`);
            }
        });

        g.refreshUI();

        g.network.broadcast({
            type: 'game_start',
            currentTurnIndex: g.currentTurnIndex,
            currentYear: g.seasonManager.getCurrentYear(),   // ✅ 传递年份
            playerOrder: g.playerOrder,
            allPlayers: g.playerManager.getSerializablePlayers(),
            hands: g.cardManager.getState().hands,
            drawPileSize: g.cardManager.drawPile.length,
            discardPileSize: g.cardManager.discardPile.length,
            characters: g.chaManager.playerCharacters,
            positions: g.trackManager.positions,
            workspaceUsed: g.workspaceManager.getSerializedState()
        });

        g.ui.showToast('🎲 游戏开始！每位冒险者获得4张手牌');
        // ✅ 播放温馨 BGM
        if (typeof soundManager !== 'undefined' && soundManager.startBgm) {
            soundManager.startBgm();
        }
        if (g.currentTurnIndex === g.localPlayerIndex) {
            g.ui.showToast('🎯 你是先手！');
        }
    }

    endGameEarly() {
        const g = this.game;
        g.gameStarted = false;
        g.board.clearHighlights();
        g.board.setCurrentTurn(null);
        g.isStationTeleporting = false;
        g.cardManager.clearSelection();
        g.refreshUI();
        g.network.broadcast({
            type: 'game_state_sync',
            allPlayers: g.playerManager.getSerializablePlayers(),
            playerOrder: g.playerOrder,
            currentTurnIndex: 0,
            gameStarted: false,
            hands: g.cardManager.getState().hands,
            drawPileSize: g.cardManager.drawPile.length,
            discardPileSize: g.cardManager.discardPile.length
        });
    }
}