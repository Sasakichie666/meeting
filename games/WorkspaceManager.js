class WorkspaceManager {
    constructor(game) {
        this.game = game;
        // 结构：{ [playerIndex]: { [location]: Set<actionKey> } }
        // 非纪念碑地点使用特殊键 '*' 表示已使用
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
     * 检查玩家是否可以使用某个地点的某个工位行动
     * @param {number} playerIndex
     * @param {string} location - 地点名称
     * @param {string} actionKey - 行动标识（纪念碑等特殊地点使用）
     * @returns {{ canUse: boolean, reason: string }}
     */
    canUseAction(playerIndex, location, actionKey = null) {
        // 1. 米宝检查
        const chaManager = this.game.chaManager;
        const totalMeeple = chaManager ? chaManager.getTotalAvailableMeeple(playerIndex) : 0;
        if (totalMeeple <= 0) {
            return { canUse: false, reason: '没有可用的米宝' };
        }

        // 2. 获取该玩家在该地点已使用的行动集合
        const playerUsed = this.usedLocations[playerIndex] || {};
        const locationUsed = playerUsed[location] || new Set();

        // 3. 纪念碑特例：检查是否已使用过该具体行动
        if (location === '纪念碑') {
            if (actionKey && locationUsed.has(actionKey)) {
                return { canUse: false, reason: '该轨道行动本季节已使用过' };
            }
            return { canUse: true, reason: '' };
        }

        // 4. 其他地点：整个地点只能使用一次（用 '*' 标记）
        if (locationUsed.has('*')) {
            return { canUse: false, reason: '本季节已在该地点执行过行动' };
        }

        return { canUse: true, reason: '' };
    }

    /**
     * 标记某玩家在某地点使用了某个行动
     * @param {number} playerIndex
     * @param {string} location
     * @param {string} actionKey - 行动标识（纪念碑必须传入）
     */
    markActionUsed(playerIndex, location, actionKey = null) {
        if (!this.usedLocations[playerIndex]) {
            this.usedLocations[playerIndex] = {};
        }
        if (!this.usedLocations[playerIndex][location]) {
            this.usedLocations[playerIndex][location] = new Set();
        }

        if (location === '纪念碑') {
            if (actionKey) {
                this.usedLocations[playerIndex][location].add(actionKey);
            }
        } else {
            // 非纪念碑地点统一标记为 '*'
            this.usedLocations[playerIndex][location].clear();
            this.usedLocations[playerIndex][location].add('*');
        }

        if (this.game.network.isHost()) {
            this._broadcastUsedLocations();
        }
    }

    /**
     * 获取某玩家在某地点已使用的行动列表（用于 UI 显示）
     * 对于纪念碑，返回具体 actionKey 数组；其他地点返回空数组或 ['*']
     */
    getUsedActions(playerIndex, location) {
        const playerUsed = this.usedLocations[playerIndex] || {};
        const locationUsed = playerUsed[location];
        return locationUsed ? Array.from(locationUsed) : [];
    }

    /**
     * 获取某玩家本季节已使用的所有地点名称列表（用于地图标记）
     * 只要该地点有任意记录，即视为已使用
     */
    getPlayerUsedLocations(playerIndex) {
        const playerUsed = this.usedLocations[playerIndex] || {};
        return Object.keys(playerUsed).filter(loc => {
            const actions = playerUsed[loc];
            return actions && actions.size > 0;
        });
    }

    /** 获取可序列化的状态 */
    getSerializedState() {
        const serialized = {};
        for (const playerIndex in this.usedLocations) {
            const locMap = this.usedLocations[playerIndex];
            serialized[playerIndex] = {};
            for (const loc in locMap) {
                serialized[playerIndex][loc] = Array.from(locMap[loc]);
            }
        }
        return serialized;
    }

    /** 广播当前状态 */
    _broadcastUsedLocations() {
        this.game.network.broadcast({
            type: 'workspace_used',
            usedActions: this.getSerializedState()
        });
    }

    /** 从序列化数据恢复状态 */
    applyUsedActions(data) {
        this.usedLocations = {};
        if (!data) return;
        for (const playerIndex in data) {
            const locMap = data[playerIndex];
            this.usedLocations[playerIndex] = {};
            for (const loc in locMap) {
                this.usedLocations[playerIndex][loc] = new Set(locMap[loc]);
            }
        }
    }
}