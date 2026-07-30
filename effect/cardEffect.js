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
                    game.ui.showToast(toastMsg);
                    game.network.broadcast({ type: 'toast', message: toastMsg });
                }, 2000);
                setTimeout(() => {
                    LogSystem.logAction(`${player.name} 获得了 ${gainsText}`, player.color);
                }, 1000);
                break;

            case 'gain_affection':
                // 献花效果已由 CardActionHandler 特殊处理，此处不做任何事
                break;

            case 'draw_cards':
                // ✅ 打牌抽牌效果（复用丢弃效果中的抽牌逻辑）
                const count = effectDef.count || 1;
                for (let i = 0; i < count; i++) {
                    game.cardManager.drawCard(player.index);
                }
                // 广播手牌更新
                game.network.broadcast({
                    type: 'hand_update',
                    hands: game.cardManager.getState().hands,
                    drawPileSize: game.cardManager.drawPile.length,
                    discardPileSize: game.cardManager.discardPile.length
                });
                const drawMsg = `抽了 ${count} 张牌`;
                setTimeout(() => {
                    game.ui.showToast(`🃏 ${drawMsg}`);
                    game.network.broadcast({ type: 'toast', message: `🃏 ${drawMsg}` });
                }, 2000);
                setTimeout(() => {
                    LogSystem.logAction(`${player.name} ${drawMsg}`, player.color);
                }, 1000);
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
                    game.ui.showToast(`🃏 ${drawMsg}`);
                    game.network.broadcast({ type: 'toast', message: `🃏 ${drawMsg}` });
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
                    game.ui.showToast(gainMsg);
                    game.network.broadcast({ type: 'toast', message: gainMsg });
                }, 2000);
                break;
        }
        game.refreshUI();
    }
}