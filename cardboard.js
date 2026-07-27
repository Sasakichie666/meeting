class LocalCardBoard {
    constructor(containerSelector, playerName, playerColor, onSlotClick, isLocal = false) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error('LocalCardBoard: 找不到容器', containerSelector);
            return;
        }
        this.onSlotClick = onSlotClick;
        this.isLocal = isLocal;
        this.slots = [null, null, null, null];
        this.slotElements = [];

        this.buildUI(playerName, playerColor);
    }

    buildUI(playerName, playerColor) {
        this.panel = document.createElement('div');
        this.panel.className = 'player-board';
        this.panel.innerHTML = `
            <div class="player-board-label">
                <span class="player-dot" style="background:${playerColor};"></span>
                ${playerName}${this.isLocal ? '（你）' : ''}
            </div>
            <div class="cardboard-inline"></div>
        `;
        const slotsRow = this.panel.querySelector('.cardboard-inline');
        for (let i = 0; i < 4; i++) {
            const slot = document.createElement('div');
            slot.className = 'card-slot-mini';
            slot.dataset.slotIndex = i;
            slot.textContent = '＋';
            // 只有本地玩家且当前有选中卡牌时，点击槽位才有效（由外部高亮控制）
            slot.addEventListener('click', () => {
                if (this.isLocal && this.onSlotClick) {
                    // 不再检查槽位是否为空，直接触发打出请求
                    this.onSlotClick(i);
                }
            });
            this.slotElements.push(slot);
            slotsRow.appendChild(slot);
        }

        slotsRow.style.gap = '40px';
        this.panel.style.paddingLeft = '40px';
        this.panel.style.paddingRight = '40px';

        this.container.appendChild(this.panel);
    }

    placeCard(slotIndex, cardId, cardDef) {
        if (slotIndex < 0 || slotIndex >= 4) return;
        this.slots[slotIndex] = cardId;
        const slotEl = this.slotElements[slotIndex];
        slotEl.innerHTML = `
            <div style="font-weight:700; font-size:0.6rem; color:#4a3728; text-align:center; line-height:1.2;">${cardDef.name}</div>
            <div style="font-size:0.5rem; color:#6b5d4f; text-align:center;">${cardDef.description}</div>
        `;
        slotEl.style.border = '2px solid #c97d60';
        slotEl.style.background = '#fff8f3';
    }

    // 高亮所有槽位（包括已占用的）
    highlightAllSlots(enable = true) {
        this.slotElements.forEach(slot => {
            slot.classList.toggle('highlight-empty', enable);
        });
    }

    // 兼容旧调用，内部转向高亮全部
    highlightEmptySlots(enable = true) {
        this.highlightAllSlots(enable);
    }

    clearHighlights() {
        this.slotElements.forEach(slot => slot.classList.remove('highlight-empty'));
    }

    getEmptySlotIndex() {
        return this.slots.findIndex(s => s === null);
    }
}