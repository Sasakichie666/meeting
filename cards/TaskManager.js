// cards/TaskManager.js
class TaskManager {
    constructor(game) {
        this.game = game;
        this.drawPile = [];
        this.displayedTasks = [];
    }

    init() {
        const templates = window.TASK_CARD_DEFINITIONS || TASK_CARD_DEFINITIONS;
        this.drawPile = [];
        templates.forEach(def => {
            for (let i = 0; i < 3; i++) {
                this.drawPile.push(def.id);
            }
        });
        this.shuffle();
        this.displayedTasks = [];
        this.refillDisplay();
        if (this.game.network.isHost()) {
            this.broadcastState();
        }
    }

    shuffle() {
        for (let i = this.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
        }
    }

    refillDisplay() {
        while (this.displayedTasks.length < 3 && this.drawPile.length > 0) {
            this.displayedTasks.push(this.drawPile.pop());
        }
    }

    completeTask(taskId) {
        const index = this.displayedTasks.indexOf(taskId);
        if (index !== -1) {
            this.displayedTasks.splice(index, 1);
            this.refillDisplay();
            if (this.game.network.isHost()) {
                this.broadcastState();
            }
            return true;
        }
        return false;
    }

    getTaskDefinition(taskId) {
        const templates = window.TASK_CARD_DEFINITIONS || TASK_CARD_DEFINITIONS;
        return templates.find(t => t.id === taskId);
    }

    broadcastState() {
        const g = this.game;
        g.network.broadcast({
            type: 'task_update',
            displayedTasks: [...this.displayedTasks],
            drawPileSize: this.drawPile.length
        });
    }

    setDisplayedTasks(tasks, drawPileSize) {
        this.displayedTasks = [...tasks];
        if (drawPileSize !== undefined) {
            this.drawPile.length = drawPileSize;
        }
        this.game.refreshUI();
    }

    /**
     * 提交一个任务（主机端调用）
     */
    submitTask(playerIndex, taskId) {
        const g = this.game;
        const player = Object.values(g.players).find(p => p.index === playerIndex);
        if (!player) return { success: false, message: '玩家不存在' };

        const taskDef = this.getTaskDefinition(taskId);
        if (!taskDef) return { success: false, message: '任务不存在' };

        if (!this.displayedTasks.includes(taskId)) {
            return { success: false, message: '任务不在可提交列表' };
        }

        if (taskDef.cost) {
            for (const [res, amount] of Object.entries(taskDef.cost)) {
                if ((player[res] || 0) < amount) {
                    return { success: false, message: `资源不足，需要 ${amount} ${res}` };
                }
            }
        }

        if (taskDef.cost) {
            for (const [res, amount] of Object.entries(taskDef.cost)) {
                player[res] -= amount;
            }
        }

        if (taskDef.reward) {
            for (const [res, amount] of Object.entries(taskDef.reward)) {
                player[res] = (player[res] || 0) + amount;
            }
        }

        g.syncManager.broadcastFullPlayerState();
        this.completeTask(taskId); // 内部会调用 broadcastState
        g.refreshUI();            // ✅ 主机本地强制刷新界面

        LogSystem.logAction(`${player.name} 完成了任务「${taskDef.name}」`, player.color);
        g.ui.showToast(`${player.name} 完成任务，获得奖励`);

        return { success: true, message: '任务完成' };
    }
}