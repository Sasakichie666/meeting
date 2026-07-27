class TrackManager {
    constructor(game) {
        this.game = game;
        this.columns = { card: 0, food: 1, building: 2, tool: 3, knowledge: 4 };
        // 奖励定义（与 PublicTrackUI 显示一致）
        this.rewards = {
            card: {
                1: { wood: 2 },
                3: { stone: 2 },
                5: { points: 2 },
                7: { mineral: 2 },
                9: { points: 5 }
            },
            food: {
                1: { points: 1 },
                2: { stamina: 2 },
                3: { points: 2 },
                4: { stamina: 4 },
                5: { points: 3 },
                6: { building: 4 },
                7: { points: 5 },
                8: { tool: 4 },
                9: { points: 10 }
            },
            building: {
                1: { points: 2 },
                2: { card: 2 },
                3: { points: 4 },
                4: { mineral: 2 },
                5: { points: 5 },
                6: { food: 8 },
                7: { points: 8 },
                8: { tool: 4 },
                9: { points: 12 }
            },
            tool: {
                1: { points: 3 },
                2: { wood: 8 },
                3: { points: 5 },
                4: { stone: 6 },
                5: { points: 7 },
                6: { knowledge: 12 },
                7: { points: 10 },
                8: { building: 8 },
                9: { points: 15 }
            },
            knowledge: {
                1: { points: 2 },
                2: { mineral: 1 },
                3: { points: 4 },
                4: { mineral: 2 },
                5: { points: 5 },
                6: { mineral: 4 },
                7: { points: 8 },
                8: { mineral: 8 },
                9: { points: 12 }
            }
        };
        this.positions = {};
    }

    initPlayerPositions() {
        const g = this.game;
        Object.values(g.players).forEach(p => {
            this.positions[p.index] = {
                card: 0, food: 0, building: 0, tool: 0, knowledge: 0
            };
        });
    }

    advanceOnTrack(playerIndex, columnName) {
        const g = this.game;
        const pos = this.positions[playerIndex];
        if (!pos) return;

        const colIdx = this.columns[columnName];
        const current = pos[columnName] || 0;
        const maxPos = 9;
        if (current >= maxPos) return;

        const newPos = current + 1;
        pos[columnName] = newPos;

        const player = Object.values(g.players).find(p => p.index === playerIndex);
        if (player) {
            g.trackUI.setPlayerMarker(colIdx, playerIndex, newPos, player.color);
        }

        this.applyReward(playerIndex, columnName, newPos);

        if (g.network.isHost()) {
            this.broadcastPositions();
        }
    }

    advanceOnCardTrack(playerIndex) {
        this.advanceOnTrack(playerIndex, 'card');
    }

    applyReward(playerIndex, column, position) {
        const reward = this.rewards[column]?.[position];
        if (!reward) return;

        const g = this.game;
        const player = Object.values(g.players).find(p => p.index === playerIndex);
        if (!player) return;

        // 处理抽卡
        const cardReward = reward.card || 0;
        if (cardReward > 0) {
            for (let i = 0; i < cardReward; i++) {
                g.cardManager.drawCard(playerIndex);
            }
        }

        for (const [res, amount] of Object.entries(reward)) {
            if (res === 'card') continue;
            player[res] = (player[res] || 0) + amount;
        }

        g.syncManager.broadcastFullPlayerState();
        if (cardReward > 0) {
            g.network.broadcast({
                type: 'hand_update',
                hands: g.cardManager.getState().hands,
                drawPileSize: g.cardManager.drawPile.length,
                discardPileSize: g.cardManager.discardPile.length
            });
        }

        const rewardText = Object.entries(reward)
            .map(([r, a]) => {
                if (r === 'card') return `抽${a}张牌`;
                return `${a} ${ResourceManager.RESOURCE_META[r]?.name || r}`;
            })
            .join('，');
        LogSystem.logAction(`${player.name} 在${this.getColumnName(column)}轨道获得了 ${rewardText}`, player.color);
        g.ui.showToast(`${player.name} 获得轨道奖励: ${rewardText}`);
    }

    getColumnName(column) {
        const names = { card: '卡牌', food: '佳肴', building: '建材', tool: '工具', knowledge: '知识' };
        return names[column] || column;
    }

    broadcastPositions() {
        const g = this.game;
        g.network.broadcast({
            type: 'track_positions',
            positions: JSON.parse(JSON.stringify(this.positions))
        });
    }

    setPositions(data) {
        this.positions = data;
        const g = this.game;
        g.trackUI.clearAllMarkers();
        Object.entries(data).forEach(([playerIndex, cols]) => {
            const pIdx = parseInt(playerIndex);
            const player = Object.values(g.players).find(p => p.index === pIdx);
            const color = player ? player.color : '#ccc';
            Object.entries(cols).forEach(([colName, pos]) => {
                const colIdx = this.columns[colName];
                if (pos > 0) {
                    g.trackUI.setPlayerMarker(colIdx, pIdx, pos, color);
                }
            });
        });
    }
}