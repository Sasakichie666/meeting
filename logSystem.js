class LogSystem {
    /**
     * 记录一条行动日志，同时广播给所有玩家
     * @param {string} message - 日志文本
     * @param {string} playerColor - 玩家颜色（可选，用于UI显示）
     */
    static logAction(message, playerColor = '#4a3728') {
        const game = Game.instance;
        if (!game) return;

        // 本地UI显示
        if (game.ui) {
            game.ui.addLog(message, playerColor);
        }

        // 网络广播
        if (game.network && game.network.isConnected()) {
            game.network.broadcast({
                type: 'log_message',
                message: message,
                color: playerColor
            });
        }
    }
}