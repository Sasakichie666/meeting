class CardActionHandler {
    constructor(game) {
        this.game = game;
    }

    // 请求打出卡牌（客户端/主机统一入口）
    requestPlayCard(slotIndex) {
        const g = this.game;
        if (!g.gameStarted) return;
        if (g.currentTurnIndex !== g.localPlayerIndex) {
            g.ui.showToast('⏳ 现在不是你的回合');
            return;
        }
        const cardId = g.cardManager.selectedCardId;
        if (!cardId) return;

        if (!g.network.isHost()) {
            g.network.sendToPeer(g.network.hostId, {
                type: 'req_play_card',
                playerIndex: g.localPlayerIndex,
                cardId,
                slotIndex
            });
            return;
        }
        // 主机执行打牌，并在成功后推进回合
        const result = this.executePlayCard(g.localPlayerIndex, cardId, slotIndex);
        if (result.success) {
            g.turnManager.advanceTurn();
        }
    }

    // 纯打牌执行（不推进回合，供网络请求或复合行动调用）
    executePlayCard(playerIndex, cardId, slotIndex) {
        return this._executePlayCard(playerIndex, cardId, slotIndex);
    }

    // 内部实现
    _executePlayCard(playerIndex, cardId, slotIndex) {
        const g = this.game;
        const player = Object.values(g.players).find(p => p.index === playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };

        if (!g.playerSlots[playerIndex]) {
            g.playerSlots[playerIndex] = [null, null, null, null];
        }
        const slots = g.playerSlots[playerIndex];

        let replacedCardId = null;
        if (slots[slotIndex] !== null && slots[slotIndex] !== undefined) {
            replacedCardId = slots[slotIndex];
            g.cardManager.discardPile.push(replacedCardId);
            slots[slotIndex] = null;
        }

        const result = g.cardManager.playCard(playerIndex, cardId, player);
        if (!result.success) {
            if (replacedCardId) g.cardManager.discardPile.pop();
            g.ui.showToast(result.message);
            return { success: false, message: result.message };
        }

        slots[slotIndex] = cardId;
        const def = g.cardManager.getCardDefinition(cardId);
        const localBoard = g.playerBoards[playerIndex];
        if (localBoard) localBoard.placeCard(slotIndex, cardId, def);
        g.cardManager.clearSelection();

        const playerResources = ResourceManager.extractPlayerResources(player);
        g.network.broadcast({
            type: 'play_card_result',
            playerIndex,
            peerId: g.playerManager._getPeerIdByIndex(playerIndex),
            cardId,
            slotIndex,
            ...playerResources,
            hands: g.cardManager.getState().hands,
            drawPileSize: g.cardManager.drawPile.length,
            discardPileSize: g.cardManager.discardPile.length,
            replacedCardId
        });

        LogSystem.logAction(`${player.name} 打出了「${def.name}」${replacedCardId ? '（替换了原有卡牌）' : ''}`, player.color);
        if (playerIndex === g.localPlayerIndex) {
            g.ui.showToast(`使用「${def.name}」成功`);
        }

        // ✅ 本地立即播放打牌音效（房主自己听到）
        if (typeof soundManager !== 'undefined' && soundManager.play) {
            soundManager.play('cardPlay');
        }

        // ✅ 广播打牌提示（非房主可见，音效由 NetworkEventHandler 的 toast 处理）
        g.network.broadcast({
            type: 'toast',
            message: `${player.name} 打出了「${def.name}」`
        });

        // 轨道推进：打出卡牌后推进卡牌轨道
        g.trackManager.advanceOnCardTrack(playerIndex);

        return { success: true };
    }

    // 请求丢弃卡牌
    requestDiscardCard(cardId) {
        const g = this.game;
        if (!g.gameStarted) return;
        if (g.currentTurnIndex !== g.localPlayerIndex) {
            g.ui.showToast('⏳ 现在不是你的回合');
            return;
        }
        if (!g.cardManager.selectedCardId || g.cardManager.selectedCardId !== cardId) {
            g.ui.showToast('请先选中要丢弃的卡牌');
            return;
        }

        if (!g.network.isHost()) {
            g.network.sendToPeer(g.network.hostId, {
                type: 'req_discard',
                playerIndex: g.localPlayerIndex,
                cardId
            });
            return;
        }
        const result = this.executeDiscard(g.localPlayerIndex, cardId);
        if (result.success) {
            g.turnManager.advanceTurn();
        }
    }

    // 纯丢弃执行（不推进回合）
    executeDiscard(playerIndex, cardId) {
        return this._executeDiscard(playerIndex, cardId);
    }

    _executeDiscard(playerIndex, cardId) {
        const g = this.game;
        const player = Object.values(g.players).find(p => p.index === playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };
        const result = g.cardManager.discardCard(playerIndex, cardId);
        if (result.success) {
            g.cardManager.clearSelection();
            const playerResources = ResourceManager.extractPlayerResources(player);
            g.network.broadcast({
                type: 'discard_result',
                playerIndex,
                peerId: g.playerManager._getPeerIdByIndex(playerIndex),
                cardId,
                ...playerResources,
                hands: g.cardManager.getState().hands,
                drawPileSize: g.cardManager.drawPile.length,
                discardPileSize: g.cardManager.discardPile.length
            });
            LogSystem.logAction(`${player.name} 丢弃了「${g.cardManager.getCardDefinition(cardId)?.name}」`, player.color);
            g.ui.showToast(`丢弃了「${g.cardManager.getCardDefinition(cardId)?.name}」`);

            // ✅ 本地立即播放丢弃音效（房主自己听到）
            if (typeof soundManager !== 'undefined' && soundManager.play) {
                soundManager.play('cardDiscard');
            }

            // ✅ 广播丢弃提示（非房主可见，音效由 NetworkEventHandler 的 toast 处理）
            g.network.broadcast({
                type: 'toast',
                message: `${player.name} 丢弃了「${g.cardManager.getCardDefinition(cardId)?.name}」`
            });

        } else {
            g.ui.showToast(result.message);
        }
        return result;
    }
}