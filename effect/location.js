class LocationEffects {
    constructor(gameRef) {
        this.game = gameRef;
    }

    handleStationClick(playerIndex, stationName) {
        const g = this.game;
        if (!g.gameStarted) return;
        if (playerIndex !== g.localPlayerIndex) {
            g.board.clearHighlights();
            return;
        }
        if (playerIndex !== g.currentTurnIndex) {
            g.ui.showToast('⏳ 请等待你的回合...');
            g.board.clearHighlights();
            return;
        }

        // 第一步：选择移动还是乘坐列车
        g.ui.showChoiceModal(
            `你位于${stationName}，想要做什么？`,
            '🚆 乘坐列车',
            '🚶 移动到相邻地点',
            (chooseTrain) => {
                if (chooseTrain) {
                    // 选择乘坐列车 → 弹出费用确认
                    g.ui.showConfirmModal(
                        `是否花费 5 金币乘坐列车，前往其他车站？`,
                        (confirmed) => {
                            if (confirmed) {
                                g.isStationTeleporting = true;
                                g.board.prepareStationTeleport(stationName);
                            } else {
                                g.board.clearHighlights();
                            }
                        }
                    );
                } else {
                    // 选择移动 → 高亮相邻地点（复用普通移动逻辑）
                    g.isStationTeleporting = false;
                    const board = g.board;
                    board.selectedLocation = stationName;
                    board.highlightedLocations = board.adjacency[stationName] || [];
                    board.render();
                }
            }
        );
    }

    triggerEffect(playerIndex, location) {
        const g = this.game;
        if (!g.network.isHost()) return;

        const player = Object.values(g.players).find(p => p.index === playerIndex);
        if (!player) return;

        switch (location) {
            case '图书馆':
                player.knowledge = (player.knowledge || 0) + 1;
                setTimeout(() => {
                    LogSystem.logAction(`${player.name} 在图书馆获得了 1 点知识`, player.color);
                }, 1000);
                setTimeout(() => {
                    g.ui.showToast(`📚 在图书馆获得了 1 点知识！`);
                }, 2000);
                break;
            default:
                break;
        }
        g.refreshUI();
    }
}