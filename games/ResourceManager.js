class ResourceManager {
    static RESOURCE_META = {
        gold:      { icon: '💰', name: '金币' },
        stamina:   { icon: '⚡', name: '体力' },
        ingredient:{ icon: '🥩', name: '食材' },
        wood:      { icon: '🪓', name: '木头' },
        stone:     { icon: '⛏️', name: '石头' },
        mineral:   { icon: '💎', name: '矿物' },
        food:      { icon: '🍲', name: '佳肴' },
        building:  { icon: '🧱', name: '建材' },
        tool:      { icon: '🔧', name: '工具' },
        knowledge: { icon: '📚', name: '知识' },
        points:    { icon: '🏆', name: '成就分' }
    };

    static INITIAL_VALUES = {
        gold:       25,
        stamina:    5,
        ingredient: 0,
        wood:       0,
        stone:      0,
        mineral:    0,
        food:       0,
        building:   0,
        tool:       0,
        knowledge:  0,
        points:     0
    };

    static getResourceKeys() {
        return Object.keys(ResourceManager.RESOURCE_META);
    }

    static applyToPlayer(player, data) {
        if (!player || !data) return;
        ResourceManager.getResourceKeys().forEach(key => {
            if (data[key] !== undefined) {
                player[key] = data[key];  // 直接覆盖，不使用 ?? 避免旧值残留
            }
        });
    }

    static extractPlayerResources(player) {
        const result = {};
        ResourceManager.getResourceKeys().forEach(key => {
            result[key] = player[key] ?? ResourceManager.INITIAL_VALUES[key];
        });
        return result;
    }

    static extractAllPlayersResources(players) {
        const data = {};
        Object.entries(players).forEach(([pid, p]) => {
            data[pid] = ResourceManager.extractPlayerResources(p);
        });
        return data;
    }
}