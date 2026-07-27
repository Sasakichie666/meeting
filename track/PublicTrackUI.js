class PublicTrackUI {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;
        this.columns = 5;
        this.rows = 10;
        this.trackRows = 9;
        this.icons = ['🃏', '🍲', '🧱', '🔧', '📚'];
        this.markers = {};
        // 扩展后的奖励图标映射
        this.rewardIcons = {
            wood: '🪓',
            stone: '⛏️',
            mineral: '💎',
            points: '🏆',
            card: '🃏',
            food: '🍲',
            building: '🧱',
            tool: '🔧',
            knowledge: '📚',
            stamina: '⚡'
        };
        this.buildTrack();
        this.displayAllRewards();
    }

    buildTrack() {
        this.container.innerHTML = '';
        this.container.style.display = 'flex';
        this.container.style.gap = '4px';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'flex-start';

        const cellSize = 54;

        for (let c = 0; c < this.columns; c++) {
            const column = document.createElement('div');
            column.className = 'track-column';
            column.style.display = 'flex';
            column.style.flexDirection = 'column';
            column.style.gap = '0';

            for (let r = 0; r < this.rows; r++) {
                const cell = document.createElement('div');
                cell.className = 'track-cell';
                cell.dataset.row = this.rows - r;
                cell.dataset.column = c + 1;

                cell.style.width = cellSize + 'px';
                cell.style.height = cellSize + 'px';
                cell.style.border = '1px solid rgba(181, 164, 139, 0.6)';
                cell.style.borderRadius = '3px';
                cell.style.display = 'flex';
                cell.style.alignItems = 'center';
                cell.style.justifyContent = 'center';
                cell.style.fontSize = '0.65rem';
                cell.style.fontWeight = '500';
                cell.style.color = '#b5a48b';
                cell.style.margin = '0';
                cell.style.boxSizing = 'border-box';
                cell.style.position = 'relative';
                cell.style.transition = 'all 0.15s ease';
                cell.style.flexWrap = 'wrap';

                if (r === this.rows - 1) {
                    cell.textContent = this.icons[c];
                    cell.style.fontSize = '1rem';
                    cell.style.background = '#faf5ee';
                    cell.style.cursor = 'default';
                    cell.dataset.icon = 'true';
                } else {
                    cell.style.background = (r % 2 === 0) ? '#fdf8f3' : '#faf5ee';
                    cell.textContent = '';
                }

                column.appendChild(cell);
            }
            this.container.appendChild(column);
        }
    }

    setCellContent(column, position, text) {
        if (position < 1 || position > this.trackRows) return;
        const columnEl = this.container.children[column];
        if (!columnEl) return;
        const row = this.rows - 1 - position;
        const cell = columnEl.children[row];
        if (!cell || cell.dataset.icon === 'true') return;
        cell.textContent = text;
    }

    displayAllRewards() {
        // 卡牌列 (0) – 奇数格更新：1:2木头，3:2石头，7:2矿物，5和9保留原成就分
        this._displayColRewards(0, {
            1: { wood: 2 },
            3: { stone: 2 },
            5: { points: 2 },
            7: { mineral: 2 },
            9: { points: 5 }
        });

        // 佳肴列 (1)
        this._displayColRewards(1, {
            1: { points: 1 },
            2: { stamina: 2 },
            3: { points: 2 },
            4: { stamina: 4 },
            5: { points: 3 },
            6: { building: 4 },
            7: { points: 5 },
            8: { tool: 4 },
            9: { points: 10 }
        });

        // 建材列 (2)
        this._displayColRewards(2, {
            1: { points: 2 },
            2: { card: 2 },
            3: { points: 4 },
            4: { mineral: 2 },
            5: { points: 5 },
            6: { food: 8 },
            7: { points: 8 },
            8: { tool: 4 },
            9: { points: 12 }
        });

        // 工具列 (3)
        this._displayColRewards(3, {
            1: { points: 3 },
            2: { wood: 8 },
            3: { points: 5 },
            4: { stone: 6 },
            5: { points: 7 },
            6: { knowledge: 12 },
            7: { points: 10 },
            8: { building: 8 },
            9: { points: 15 }
        });

        // 知识列 (4)
        this._displayColRewards(4, {
            1: { points: 2 },
            2: { mineral: 1 },
            3: { points: 4 },
            4: { mineral: 2 },
            5: { points: 5 },
            6: { mineral: 4 },
            7: { points: 8 },
            8: { mineral: 8 },
            9: { points: 12 }
        });
    }

    _displayColRewards(column, rewards) {
        for (const [pos, reward] of Object.entries(rewards)) {
            const posInt = parseInt(pos);
            const parts = [];
            for (const [res, amount] of Object.entries(reward)) {
                if (amount === 0) continue;
                const icon = this.rewardIcons[res] || res;
                parts.push(`${amount}${icon}`);
            }
            const text = parts.join(' ');
            if (text) {
                this.setCellContent(column, posInt, text);
            }
        }
    }

    setPlayerMarker(column, playerIndex, position, color) {
        this.removePlayerMarker(column, playerIndex);
        if (position <= 0 || position > this.trackRows) return;

        const columnEl = this.container.children[column];
        if (!columnEl) return;

        const row = this.rows - 1 - position;
        const cell = columnEl.children[row];
        if (!cell || cell.dataset.icon === 'true') return;

        const dot = document.createElement('span');
        dot.className = 'track-player-dot';
        dot.style.width = '16px';
        dot.style.height = '16px';
        dot.style.borderRadius = '50%';
        dot.style.background = color;
        dot.style.display = 'inline-flex';
        dot.style.alignItems = 'center';
        dot.style.justifyContent = 'center';
        dot.style.fontSize = '0.55rem';
        dot.style.color = '#fff';
        dot.style.fontWeight = 'bold';
        dot.style.border = '1px solid rgba(255,255,255,0.8)';
        dot.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
        dot.style.position = 'relative';
        dot.dataset.playerIndex = playerIndex;
        dot.textContent = playerIndex + 1;

        cell.appendChild(dot);
        const key = `${column}_${playerIndex}`;
        this.markers[key] = dot;
    }

    removePlayerMarker(column, playerIndex) {
        const key = `${column}_${playerIndex}`;
        if (this.markers[key]) {
            this.markers[key].remove();
            delete this.markers[key];
        }
    }

    clearAllMarkers() {
        Object.values(this.markers).forEach(dot => dot.remove());
        this.markers = {};
    }
}