class ActionExecutor {
    constructor(game) {
        this.game = game;
    }

    /**
     * 执行一组行动，全部成功后推进回合
     * @param {number} playerIndex - 玩家索引
     * @param {Array} actions - 行动数组，每个行动为 { type: 'move'|'playCard'|'discard', params }
     *   移动: { type: 'move', from, to }
     *   打牌: { type: 'playCard', cardId, slotIndex }
     *   弃牌: { type: 'discard', cardId }
     * @returns {object} { success: boolean, message: string }
     */
    runActions(playerIndex, actions) {
        const g = this.game;
        // 权限与基本校验
        if (!g.gameStarted) return { success: false, message: '游戏尚未开始' };
        if (playerIndex !== g.currentTurnIndex) return { success: false, message: '不是你的回合' };
        if (playerIndex !== g.localPlayerIndex) return { success: false, message: '只能对自己进行操作' };
        if (!actions || actions.length === 0) return { success: false, message: '没有行动' };

        // 依次执行每个行动
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            let result;
            switch (action.type) {
                case 'move':
                    result = this._doMove(playerIndex, action.from, action.to);
                    break;
                case 'playCard':
                    result = this._doPlayCard(playerIndex, action.cardId, action.slotIndex);
                    break;
                case 'discard':
                    result = this._doDiscard(playerIndex, action.cardId);
                    break;
                default:
                    return { success: false, message: `未知行动类型: ${action.type}` };
            }
            if (!result.success) {
                // 将来可以在这里添加回滚逻辑
                return result;   // 立即终止，不再执行后续行动
            }
        }

        // 所有行动成功，推进回合
        g.turnManager.advanceTurn();
        g.ui.showToast('🎯 复合行动完成，回合结束');
        g.refreshUI();
        return { success: true, message: '行动完成' };
    }

    // ---------- 基础行动适配（调用已剥离回合推进的纯函数） ----------
    _doMove(playerIndex, from, to) {
        const g = this.game;
        // 检查体力等客户端预检，实际执行委托给 MoveHandler
        const player = g.players[g.localPlayerId];
        if (!g.isStationTeleporting && player.stamina < 1) {
            return { success: false, message: '体力不足，无法移动' };
        }
        // 调用纯执行方法（需要 MoveHandler 提供 executeMove）
        return g.moveHandler.executeMove(playerIndex, from, to);
    }

    _doPlayCard(playerIndex, cardId, slotIndex) {
        // 调用 CardActionHandler 的纯执行方法
        return this.game.cardActionHandler.executePlayCard(playerIndex, cardId, slotIndex);
    }

    _doDiscard(playerIndex, cardId) {
        // 调用 CardActionHandler 的纯执行方法
        return this.game.cardActionHandler.executeDiscard(playerIndex, cardId);
    }
}