class WorkspaceManager {
    constructor(game) {
        this.game = game;
        // 结构：{ [playerIndex]: Set<locationName> }
        this.usedLocations = {};
    }

    /** 季节更替时清空所有记录 */
    resetSeason() {
        this.usedLocations = {};
        if (this.game.network.isHost()) {
            this._broadcastUsedLocations();
        }
    }

    /**
     * 检查玩家是否可以使用某个地点的任意工位行动
     * @param {number} playerIndex
     * @param {string} location - 地点名称
     * @param {string} actionKey - 忽略，保留兼容
     * @returns {{ canUse: boolean, reason: string }}
     */
    canUseAction(playerIndex, location, actionKey = null) {
        // 1. 米宝检查（通用）
        const chaManager = this.game.chaManager;
        const totalMeeple = chaManager ? chaManager.getTotalAvailableMeeple(playerIndex) : 0;
        if (totalMeeple <= 0) {
            return { canUse: false, reason: '没有可用的米宝' };
        }

        // 2. 检查该地点是否已被使用
        if (this.usedLocations[playerIndex] && this.usedLocations[playerIndex].has(location)) {
            return { canUse: false, reason: '本季节已在该地点执行过行动' };
        }

        return { canUse: true, reason: '' };
    }

    /**
    * 获取某玩家本季节已使用的所有地点名称列表
    * @param {number} playerIndex
    * @returns {string[]}
    */
    getPlayerUsedLocations(playerIndex) {
        if (!this.usedLocations[playerIndex]) return [];
        return Array.from(this.usedLocations[playerIndex]);
    }


    /**
     * 标记某玩家在某地点使用了行动（忽略具体行动类型）
     */
    markActionUsed(playerIndex, location, actionKey = null) {
        if (!this.usedLocations[playerIndex]) {
            this.usedLocations[playerIndex] = new Set();
        }
        this.usedLocations[playerIndex].add(location);

        if (this.game.network.isHost()) {
            this._broadcastUsedLocations();
        }
    }

    /**
     * 获取某玩家在某地点是否已使用（返回非空数组表示已用）
     */
    getUsedActions(playerIndex, location) {
        if (!this.usedLocations[playerIndex] || !this.usedLocations[playerIndex].has(location)) {
            return [];
        }
        return ['used']; // 用于兼容旧代码
    }

    /** 获取可序列化的状态 */
    getSerializedState() {
        const serialized = {};
        for (const playerIndex in this.usedLocations) {
            serialized[playerIndex] = Array.from(this.usedLocations[playerIndex]);
        }
        return serialized;
    }

    /** 广播当前状态 */
    _broadcastUsedLocations() {
        this.game.network.broadcast({
            type: 'workspace_used',
            usedActions: this.getSerializedState()   // 注意字段名保持 'usedActions' 以兼容网络事件
        });
    }

    /** 从序列化数据恢复状态 */
    applyUsedActions(data) {
        this.usedLocations = {};
        if (!data) return;
        for (const playerIndex in data) {
            this.usedLocations[playerIndex] = new Set(data[playerIndex]);
        }
    }
}