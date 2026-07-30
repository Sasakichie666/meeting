// cards/TaskManager.js
class TaskManager {
    constructor(game) {
        this.game = game;
        this.drawPile = [];         // 待抽取的任务卡ID
        this.displayedTasks = [];   // 当前展示的任务卡ID（最多3张）
        this.completedPile = [];    // 已完成的任务卡ID（用于循环利用）
    }

    // 初始化牌堆，洗牌，抽取展示任务
    init() {
        const templates = window.TASK_CARD_DEFINITIONS || TASK_CARD_DEFINITIONS;
        this.drawPile = [];
        this.completedPile = [];
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

    // 洗牌
    shuffle() {
        for (let i = this.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
        }
    }

    // 补充展示任务至3张，如果抽牌堆空则回收已完成的任务卡
    refillDisplay() {
        // 如果抽牌堆为空，将已完成的任务卡回收并洗牌
        if (this.drawPile.length === 0 && this.completedPile.length > 0) {
            this.drawPile = [...this.completedPile];
            this.completedPile = [];
            this.shuffle();
        }

        while (this.displayedTasks.length < 3 && this.drawPile.length > 0) {
            this.displayedTasks.push(this.drawPile.pop());
        }
    }

    // 完成一个任务（提交资源后调用），返回是否成功移除
    completeTask(taskId) {
        const index = this.displayedTasks.indexOf(taskId);
        if (index !== -1) {
            this.displayedTasks.splice(index, 1);
            // 将已完成的任务卡加入回收堆
            this.completedPile.push(taskId);
            this.refillDisplay();
            if (this.game.network.isHost()) {
                this.broadcastState();
            }
            return true;
        }
        return false;
    }

    // 根据ID获取任务卡定义
    getTaskDefinition(taskId) {
        const templates = window.TASK_CARD_DEFINITIONS || TASK_CARD_DEFINITIONS;
        return templates.find(t => t.id === taskId);
    }

    // 广播当前任务状态
    broadcastState() {
        const g = this.game;
        g.network.broadcast({
            type: 'task_update',
            displayedTasks: [...this.displayedTasks],
            drawPileSize: this.drawPile.length
        });
    }

    // 客户端接收同步
    setDisplayedTasks(tasks, drawPileSize) {
        this.displayedTasks = [...tasks];
        if (drawPileSize !== undefined) {
            this.drawPile.length = drawPileSize; // 仅设置长度，内容由主机维护，客户端无需实际牌堆内容
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
        this.completeTask(taskId); // 内部会调用 refillDisplay 和 broadcastState
        g.refreshUI();

        LogSystem.logAction(`${player.name} 完成了任务「${taskDef.name}」`, player.color);
        g.ui.showToast(`${player.name} 完成任务，获得奖励`);

        return { success: true, message: '任务完成' };
    }
}