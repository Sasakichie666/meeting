// character/chaUi.js
class ChaUI {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error('ChaUI: 找不到容器', containerSelector);
            return;
        }
        this.maxAffection = 5;
        this.cardElements = [];
        this.onCharacterClick = null;
    }

    renderAll(playerIndex, charactersData) {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.cardElements = [];

        if (!charactersData || charactersData.length === 0) {
            this.container.innerHTML = '<div style="font-size:0.7rem;color:var(--text-light);">暂无角色</div>';
            return;
        }

        charactersData.forEach((char, i) => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.characterIndex = i;
            card.style.width = '180px';
            card.style.height = '128px';
            card.style.marginBottom = '10px';
            card.style.borderRadius = '10px';
            card.style.background = '#fffaf5';
            card.style.border = '2px solid #e0d5c7';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'center';
            card.style.justifyContent = 'center';
            card.style.boxShadow = '0 2px 8px rgba(120,80,60,0.1)';
            card.style.cursor = 'pointer';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'char-name';
            nameDiv.style.fontSize = '1rem';
            nameDiv.style.fontWeight = '600';
            nameDiv.style.color = '#4a3728';
            nameDiv.textContent = char.name;

            const affectionDiv = document.createElement('div');
            affectionDiv.className = 'char-affection';
            affectionDiv.style.fontSize = '0.75rem';
            affectionDiv.style.color = '#c97d60';
            affectionDiv.style.marginTop = '4px';
            affectionDiv.textContent = `❤️ ${char.affection || 0}/${this.maxAffection}`;

            const meepleContainer = document.createElement('div');
            meepleContainer.className = 'char-meeple-container';
            meepleContainer.style.marginTop = '4px';
            meepleContainer.style.display = 'flex';
            meepleContainer.style.gap = '4px';
            meepleContainer.style.padding = '4px';
            meepleContainer.style.background = '#f5f0e8';
            meepleContainer.style.border = '1px dashed #c9b89a';
            meepleContainer.style.borderRadius = '6px';

            if (char.meeples && Array.isArray(char.meeples)) {
                char.meeples.forEach(meepleGroup => {
                    for (let j = 0; j < meepleGroup.amount; j++) {
                        const dot = document.createElement('span');
                        dot.className = 'meeple-dot';
                        dot.style.width = '12px';
                        dot.style.height = '12px';
                        dot.style.borderRadius = '50%';
                        dot.style.background = meepleGroup.color || '#d3c1b0';
                        dot.style.display = 'inline-block';
                        dot.style.border = '1px solid rgba(0,0,0,0.1)';
                        meepleContainer.appendChild(dot);
                    }
                });
            }

            card.appendChild(nameDiv);
            card.appendChild(affectionDiv);
            card.appendChild(meepleContainer);

            card.addEventListener('click', () => {
                if (this.onCharacterClick) {
                    this.onCharacterClick(i);
                }
            });

            this.container.appendChild(card);
            this.cardElements.push(card);
        });
    }

    updateCard(index, data) {
        if (index < 0 || index >= this.cardElements.length) return;
        const card = this.cardElements[index];
        if (!card) return;

        const nameEl = card.querySelector('.char-name');
        const affectionEl = card.querySelector('.char-affection');
        const meepleContainer = card.querySelector('.char-meeple-container');

        if (nameEl && data.name) nameEl.textContent = data.name;
        if (affectionEl && data.affection !== undefined) {
            affectionEl.textContent = `❤️ ${data.affection}/${this.maxAffection}`;
        }

        if (meepleContainer && data.meeples) {
            meepleContainer.innerHTML = '';
            data.meeples.forEach(meepleGroup => {
                for (let j = 0; j < meepleGroup.amount; j++) {
                    const dot = document.createElement('span');
                    dot.className = 'meeple-dot';
                    dot.style.width = '12px';
                    dot.style.height = '12px';
                    dot.style.borderRadius = '50%';
                    dot.style.background = meepleGroup.color || '#d3c1b0';
                    dot.style.display = 'inline-block';
                    dot.style.border = '1px solid rgba(0,0,0,0.1)';
                    meepleContainer.appendChild(dot);
                }
            });
        }
    }

    highlightAllCharacters(enable) {
        this.cardElements.forEach(card => {
            if (enable) {
                card.classList.add('highlight-meeple');
            } else {
                card.classList.remove('highlight-meeple');
            }
        });
    }

    /** 只高亮有米宝的角色（通用） */
    highlightAvailableCharacters(charactersData) {
        this.highlightCharactersByCondition((char, idx) => {
            if (!char) return false;
            return char.meeples && char.meeples.some(m => m.amount > 0);
        }, charactersData);
    }

    /**
     * 根据自定义条件高亮角色卡牌
     * @param {function} conditionFn - 接收 (characterData, index)，返回是否高亮
     * @param {Array} charactersData - 与卡牌顺序对应的角色实例数组
     */
    highlightCharactersByCondition(conditionFn, charactersData) {
        this.cardElements.forEach((card, i) => {
            const char = charactersData ? charactersData[i] : null;
            const shouldHighlight = char && conditionFn(char, i);
            if (shouldHighlight) {
                card.classList.add('highlight-meeple');
            } else {
                card.classList.remove('highlight-meeple');
            }
        });
    }
}