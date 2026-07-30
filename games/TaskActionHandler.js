// games/TaskActionHandler.js
class TaskActionHandler {
    constructor(game) {
        this.game = game;
    }

    requestSubmitTask(taskId) {
        const g = this.game;

        if (g.isObserving()) {
            g.ui.showToast('🔍 观察模式下无法操作');
            return;
        }
        if (!g.gameStarted) return;
        if (g.currentTurnIndex !== g.localPlayerIndex) {
            g.ui.showToast('⏳ 现在不是你的回合');
            return;
        }

        const taskDef = g.taskManager.getTaskDefinition(taskId);
        if (!taskDef) return;

        const player = g.players[g.localPlayerId];
        if (!player) return;

        if (taskDef.cost) {
            for (const [res, amount] of Object.entries(taskDef.cost)) {
                if ((player[res] || 0) < amount) {
                    g.ui.showToast('资源不足');
                    return;
                }
            }
        }

        if (!g.network.isHost()) {
            g.network.sendToPeer(g.network.hostId, {
                type: 'req_submit_task',
                playerIndex: g.localPlayerIndex,
                taskId
            });
            return;
        }

        const result = g.taskManager.submitTask(g.localPlayerIndex, taskId);
        if (result.success) {
            g.turnManager.advanceTurn();
            // ✅ 广播完成任务的 toast
            const taskName = taskDef.name;
            const msg = `${player.name} 完成了任务「${taskName}」`;
            g.ui.showToast(msg);
            g.network.broadcast({ type: 'toast', message: msg });
            if (typeof soundManager !== 'undefined' && soundManager.play) {
                soundManager.play('taskComplete');
            }
        } else {
            g.ui.showToast(result.message);
        }
    }
}

