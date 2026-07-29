class CardEffects {
    static executePlayEffect(player, effectDef) {
        const game = Game.instance;
        if (!game || !game.network.isHost()) return;
        if (!effectDef) return;

        switch (effectDef.type) {
            case 'gain':
                for (const [resource, amount] of Object.entries(effectDef.gain)) {
                    player[resource] = (player[resource] || 0) + amount;
                }
                const gainsText = Object.entries(effectDef.gain)
                    .map(([r, a]) => `${a} ${ResourceManager.RESOURCE_META[r]?.name || r}`)
                    .join('，');
                const toastMsg = `获得 ${gainsText}`;
                setTimeout(() => {
                    LogSystem.logAction(`${player.name} 获得了 ${gainsText}`, player.color);
                }, 1000);
                setTimeout(() => {
                    game.ui.showToast(toastMsg);
                    // 广播给所有客户端
                    game.network.broadcast({ type: 'toast', message: toastMsg });
                }, 2000);
                break;
        }
        game.refreshUI();
    }

    static executeDiscardEffect(player, effectDef) {
        const game = Game.instance;
        if (!game || !game.network.isHost()) return;
        if (!effectDef) return;
        const playerName = player.name || `冒险者${player.index + 1}`;

        switch (effectDef.type) {
            case 'draw_cards':
                const count = effectDef.count || 1;
                for (let i = 0; i < count; i++) {
                    game.cardManager.drawCard(player.index);
                }
                const drawMsg = `丢弃后抽了 ${count} 张牌`;
                LogSystem.logAction(`${playerName} ${drawMsg}`, player.color);
                setTimeout(() => {
                    game.ui.showToast(`🃏 丢弃后抽了 ${count} 张牌`);
                    game.network.broadcast({ type: 'toast', message: `🃏 ${playerName} 丢弃后抽了 ${count} 张牌` });
                }, 2000);
                break;

            case 'gain_resource':
                const { resource, amount } = effectDef.params;
                player[resource] = (player[resource] || 0) + amount;
                const resName = ResourceManager.RESOURCE_META[resource]?.name || resource;
                const gainMsg = `获得 ${amount} ${resName}`;
                setTimeout(() => {
                    LogSystem.logAction(`${playerName} ${gainMsg}`, player.color);
                }, 1000);
                setTimeout(() => {
                    const discardToast = `丢弃获得 ${amount} ${resName}`;
                    game.ui.showToast(discardToast);
                    game.network.broadcast({ type: 'toast', message: `${playerName} ${discardToast}` });
                }, 2000);
                break;
        }
        game.refreshUI();
    }
}