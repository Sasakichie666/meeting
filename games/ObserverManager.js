class ObserverManager {
    constructor(game) {
        this.game = game;
        this.targetIndex = null;          // 观察目标玩家索引
        this.observedBoard = null;        // 被观察者的临时面板实例
    }

    // 设置观察目标
    setTarget(index) {
        const g = this.game;
        if (index === g.localPlayerIndex || index === null || index === undefined) {
            this.clearTarget();
            return;
        }
        this.targetIndex = index;
        // 隐藏手牌面板
        if (g.ui.handPanel) g.ui.handPanel.style.display = 'none';
        g.board.clearHighlights();
        g.refreshUI();
    }

    // 清除观察目标
    clearTarget() {
        this.targetIndex = null;
        this.destroyObservedBoard();
        this.game.refreshUI();
    }

    // 是否正在观察
    isObserving() {
        return this.targetIndex !== null;
    }

    // 获取当前渲染目标（被观察者或自己）
    getRenderTarget() {
        if (this.isObserving()) {
            return Object.values(this.game.players).find(p => p.index === this.targetIndex);
        }
        return this.game.players[this.game.localPlayerId];
    }

    // 设置玩家标签点击交互
    setupTagClickHandler() {
        this.game.ui.onPlayerTagClick = (playerIndex) => {
            if (!this.game.gameStarted) return;
            if (playerIndex === this.game.localPlayerIndex && this.isObserving()) {
                this.clearTarget();
                return;
            }
            if (playerIndex !== this.game.localPlayerIndex) {
                this.setTarget(playerIndex);
            }
        };
    }

    // 强制退出观察（回合轮到自己时调用）
    forceExitIfNeeded() {
        if (this.isObserving() && this.game.currentTurnIndex === this.game.localPlayerIndex) {
            this.clearTarget();
            this.game.ui.showToast('🎯 轮到你的回合了！已退出观察');
        }
    }

    // 渲染观察目标或本地玩家的打出区域
    renderObservedBoard() {
        const g = this.game;
        const target = this.getRenderTarget();
        this.destroyObservedBoard(); // 先清除旧的临时面板

        if (this.isObserving() && target && target.index !== g.localPlayerIndex) {
            // ---------- 观察其他玩家 ----------
            // 隐藏本地玩家的面板
            const localBoard = g.playerBoards[g.localPlayerIndex];
            if (localBoard && localBoard.panel) {
                localBoard.panel.style.display = 'none';
            }

            // 创建被观察者的只读面板
            this.observedBoard = new LocalCardBoard(
                '#playersBoards',
                target.name,
                target.color,
                null,   // 无点击回调
                false   // 不可交互
            );

            // 填充已有的槽位数据
            const slots = g.playerSlots[target.index];
            if (slots) {
                slots.forEach((cardId, idx) => {
                    if (cardId) {
                        const def = g.cardManager.getCardDefinition(cardId);
                        this.observedBoard.placeCard(idx, cardId, def);
                    }
                });
            }
        } else {
            // ---------- 未观察或观察自己 ----------
            // 恢复本地面板显示
            const localBoard = g.playerBoards[g.localPlayerIndex];
            if (localBoard && localBoard.panel) {
                localBoard.panel.style.display = '';
            }
        }
    }

    // 销毁临时面板
    destroyObservedBoard() {
        if (this.observedBoard && this.observedBoard.panel) {
            this.observedBoard.panel.remove();
            this.observedBoard = null;
        }
    }
}