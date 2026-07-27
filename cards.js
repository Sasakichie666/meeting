class CardManager {
    constructor(network, ui, gameRef) {
        this.network = network;
        this.ui = ui;
        this.game = gameRef;

        const sourceDefs = window.cardDefinitions || cardDefinitions || [];
        this.cardDefinitions = JSON.parse(JSON.stringify(sourceDefs));

        this.drawPile = [];
        this.discardPile = [];
        this.hands = {};
        this.selectedCardId = null;

        this.initDrawPile();
        this.setupUICallbacks();
        this.initDeselectOnOutsideClick();   // 全局点击取消选中
    }

    // ---------- 全局点击取消选中 ----------
    initDeselectOnOutsideClick() {
        document.addEventListener('click', (e) => {
            if (!this.selectedCardId) return;

            const target = e.target;
            const isHandCard = target.closest('.hand-card');
            const isCardSlot = target.closest('.card-slot-mini');
            const isHandPanel = target.closest('#handPanel');
            const isHandToggle = target.closest('#btnToggleHand');

            if (!isHandCard && !isCardSlot && !isHandPanel && !isHandToggle) {
                this.clearSelection();
            }
        });
    }

    // ---------- 牌堆管理 ----------
    initDrawPile() {
        this.drawPile = [];
        this.cardDefinitions.forEach(def => {
            for (let i = 0; i < 3; i++) this.drawPile.push(def.id);
        });
        this.shuffleDrawPile();
    }

    shuffleDrawPile() {
        for (let i = this.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
        }
    }

    checkReshuffle() {
        if (this.drawPile.length === 0) {
            if (this.discardPile.length === 0) return false;
            this.drawPile = [...this.discardPile];
            this.discardPile = [];
            this.shuffleDrawPile();
            return true;
        }
        return true;
    }

    drawCard(playerIndex) {
        if (!this.hands[playerIndex]) this.hands[playerIndex] = [];
        if (!this.checkReshuffle()) return null;
        const cardId = this.drawPile.pop();
        this.hands[playerIndex].push(cardId);
        const def = this.getCardDefinition(cardId);
        return { id: cardId, name: def ? def.name : cardId };
    }

    getHand(playerIndex) {
        return this.hands[playerIndex] || [];
    }

    getCardDefinition(cardId) {
        return this.cardDefinitions.find(c => c.id === cardId);
    }

    removeCardFromHand(playerIndex, cardId) {
        const hand = this.hands[playerIndex];
        if (!hand) return false;
        const index = hand.indexOf(cardId);
        if (index === -1) return false;
        hand.splice(index, 1);
        return true;
    }

    getState() {
        return {
            drawPileSize: this.drawPile.length,
            discardPileSize: this.discardPile.length,
            hands: this.hands
        };
    }

    getDeckState() {
        return {
            drawPileSize: this.drawPile.length,
            discardPileSize: this.discardPile.length
        };
    }

    setHands(handsData) {
        this.hands = {};
        Object.entries(handsData).forEach(([playerIndex, cards]) => {
            this.hands[parseInt(playerIndex)] = [...cards];
        });
    }

    // ---------- UI 回调设置 ----------
    setupUICallbacks() {
        this.ui.setCardPlayCallback((cardId) => this.selectCard(cardId));
        this.ui.setDiscardCallback((cardId) => this.discardSelectedCard(cardId));
    }

    // ---------- 选中卡牌 ----------
    selectCard(cardId) {
        const g = this.game;
        if (!g.gameStarted) { this.ui.showToast('⚠️ 游戏尚未开始'); return; }
        if (g.currentTurnIndex !== g.localPlayerIndex) {
            this.ui.showToast('⏳ 现在不是你的回合');
            return;
        }
        if (this.selectedCardId === cardId) {
            this.selectedCardId = null;
            this.ui.setSelectedCard(null);
            const localBoard = g.playerBoards[g.localPlayerIndex];
            if (localBoard) localBoard.clearHighlights();
            return;
        }
        this.selectedCardId = cardId;
        this.ui.setSelectedCard(cardId);
        const localBoard = g.playerBoards[g.localPlayerIndex];
        if (localBoard) localBoard.highlightEmptySlots(true);  // 注意：此方法需要在 cardboard.js 中改为高亮所有槽位
        this.ui.showToast(`已选中「${this.getCardDefinition(cardId)?.name}」，可打出或丢弃`);
    }

    // ---------- 打出卡牌 ----------
    onCardSlotSelected(slotIndex) {
        // 不再检查槽位是否为空，直接请求打出（覆盖逻辑由 CardActionHandler 处理）
        if (!this.selectedCardId) return;
        this.game.requestPlayCard(slotIndex);
    }

    // 核心打出逻辑（仅由主机调用）
    playCard(playerIndex, cardId, playerResources) {
        const hand = this.hands[playerIndex];
        if (!hand || !hand.includes(cardId)) {
            return { success: false, message: '你没有这张牌' };
        }
        const def = this.getCardDefinition(cardId);
        if (!def) return { success: false, message: '未知卡牌' };

        for (const [resource, amount] of Object.entries(def.cost)) {
            if ((playerResources[resource] || 0) < amount) {
                return { success: false, message: `资源不足，需要 ${amount} ${resource}` };
            }
        }
        for (const [resource, amount] of Object.entries(def.cost)) {
            playerResources[resource] -= amount;
        }

        if (def.effect) {
            CardEffects.executePlayEffect(playerResources, def.effect);
        }

        this.removeCardFromHand(playerIndex, cardId);
        return { success: true, message: `使用「${def.name}」成功` };
    }

    // ---------- 丢弃卡牌 ----------
    discardSelectedCard(cardId) {
        this.game.requestDiscardCard(cardId);
    }

    // 核心丢弃逻辑（仅由主机调用）
    discardCard(playerIndex, cardId) {
        const hand = this.hands[playerIndex];
        if (!hand || !hand.includes(cardId)) {
            return { success: false, message: '你没有这张牌' };
        }
        const def = this.getCardDefinition(cardId);
        if (!def) return { success: false, message: '未知卡牌' };

        this.removeCardFromHand(playerIndex, cardId);
        this.discardPile.push(cardId);

        const players = this.game.players;
        let player = null;
        for (const pid in players) {
            if (players[pid].index === playerIndex) {
                player = players[pid];
                break;
            }
        }
        if (player && def.discardEffect) {
            CardEffects.executeDiscardEffect(player, def.discardEffect);
        }

        return { success: true, message: `丢弃了「${def.name}」` };
    }

    // ---------- 清除选中 ----------
    clearSelection() {
        this.selectedCardId = null;
        this.ui.setSelectedCard(null);
        const localBoard = this.game.playerBoards[this.game.localPlayerIndex];
        if (localBoard) localBoard.clearHighlights();
    }
}