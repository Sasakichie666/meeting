class FeastManager {
    constructor(game) {
        this.game = game;
    }

    performFeastCheck() {
        const g = this.game;
        if (!g.network.isHost()) return;  // 仅主机结算

        const results = [];
        for (const player of Object.values(g.players)) {
            const playerIndex = player.index;
            const chars = g.chaManager.getPlayerCharacters(playerIndex);
            let totalHunger = 0;
            if (chars && chars.length > 0) {
                chars.forEach(char => {
                    const initialCount = char.initialMeepleCount || 4;
                    const currentCount = char.meeples.reduce((sum, m) => sum + (m.amount || 0), 0);
                    const used = initialCount - currentCount;
                    totalHunger += used;
                });
            }
            const foodBefore = player.food || 0;
            const foodAfter = Math.max(0, foodBefore - totalHunger);
            player.food = foodAfter;
            const deficit = Math.max(0, totalHunger - foodBefore);
            let pointsLost = 0;
            if (deficit > 0) {
                pointsLost = deficit;
                player.points = (player.points || 0) - pointsLost;   // 允许负分
            }
            results.push({ playerIndex, name: player.name, totalHunger, foodBefore, foodAfter, deficit, pointsLost });
            if (totalHunger > 0 || pointsLost > 0) {
                const msg = deficit > 0
                    ? `${player.name} 的冒险团消耗了 ${totalHunger} 佳肴，佳肴不足，扣除 ${pointsLost} 成就分`
                    : `${player.name} 的冒险团消耗了 ${totalHunger} 佳肴`;
                LogSystem.logAction(msg, player.color);
            }
        }

        g.syncManager.broadcastFullPlayerState();
        g.refreshUI();
        return results;
    }
}