class MoveHandler {
    constructor(game) {
        this.game = game;
    }

    // 移动请求入口（客户端/主机统一调用）
    requestMove(playerIndex, from, to) {
        const g = this.game;
        // 单机模式
        if (!g.gameStarted) {
            if (!g.network.isConnected()) {
                this.executeMove(playerIndex, from, to);
                // 单机模式直接推进回合
                g.turnManager.advanceTurn();
            }
            return;
        }
        if (playerIndex !== g.localPlayerIndex) return;
        if (playerIndex !== g.currentTurnIndex) {
            g.ui.showToast('⏳ 请等待你的回合...');
            g.board.clearHighlights();
            return;
        }

        // 非车站传送时体力预检
        if (!g.isStationTeleporting) {
            const player = g.players[g.localPlayerId];
            if (player && player.stamina < 1) {
                g.ui.showToast('⚠️ 体力不足，无法移动');
                g.board.clearHighlights();
                return;
            }
        }

        // 车站传送金币预检
        if (g.isStationTeleporting && from && from.startsWith('车站') && to && to.startsWith('车站')) {
            const player = g.players[g.localPlayerId];
            if (player.gold < 5) {
                g.ui.showToast('⚠️ 金币不足，需要5金币！');
                g.board.clearHighlights();
                g.isStationTeleporting = false;
                return;
            }
        }

        if (!g.network.isHost()) {
            g.network.sendToPeer(g.network.hostId, {
                type: 'req_move',
                playerIndex,
                from,
                to,
                isTeleport: g.isStationTeleporting
            });
            g.board.clearHighlights();
            return;
        }

        // 主机直接执行，并在成功后推进回合
        const result = this.executeMove(playerIndex, from, to);
        if (result.success) {
            g.turnManager.advanceTurn();
        } else {
            g.ui.showToast(result.message);
        }
    }

    /**
     * 纯移动执行方法（不推进回合，供复合行动或单独调用）
     * @param {number} playerIndex
     * @param {string} from
     * @param {string} to
     * @returns {object} { success: boolean, message: string }
     */
    executeMove(playerIndex, from, to) {
        const g = this.game;
        const player = Object.values(g.players).find(p => p.index === playerIndex);
        if (!player) {
            return { success: false, message: '玩家不存在' };
        }

        const isTeleport = g.isStationTeleporting; // 保存传送状态

        // 车站传送扣费
        if (g.isStationTeleporting && from && from.startsWith('车站') && to && to.startsWith('车站')) {
            if (player.gold < 5) {
                g.isStationTeleporting = false;
                return { success: false, message: '金币不足' };
            }
            player.gold -= 5;
            g.isStationTeleporting = false;
        } else {
            // 普通移动消耗 1 体力
            if (player.stamina < 1) {
                return { success: false, message: '体力不足' };
            }
            player.stamina -= 1;
        }

        g.board.movePlayer(playerIndex, to);
        g.board.clearHighlights();
        player.position = to;

        g.network.broadcast({
            type: 'player_move',
            playerIndex,
            from,
            to,
            peerId: g.playerManager._getPeerIdByIndex(playerIndex)
        });

        g.locationEffects.triggerEffect(playerIndex, to);
        g.syncManager.broadcastFullPlayerState();

        // 日志（纯文本，不附加传送标记）
        LogSystem.logAction(`${player.name} 移动到「${to}」`, player.color);

        if (playerIndex === g.localPlayerIndex) {
            g.ui.showToast(`📍 移动到了「${to}」——回合结束`);
        }

        return { success: true, message: '移动成功' };
    }

    // 原有内部方法（供旧代码或需要自动推进回合的场景使用，已废弃，保留兼容）
    // 实际现在 requestMove 直接调用 executeMove + advanceTurn
}