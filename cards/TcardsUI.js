class TcardsUI {
    constructor(mapWrapperSelector) {
        this.mapWrapper = document.querySelector(mapWrapperSelector);
        if (!this.mapWrapper) {
            console.error('TcardsUI: 找不到地图容器');
            return;
        }
        this.panelVisible = false;
        this.onTaskClick = null;
        this.createUI();
        this.setupGlobalClick();
    }

    createUI() {
        this.btn = document.createElement('button');
        this.btn.id = 'btnToggleTask';
        this.btn.className = 'btn btn-small';
        this.btn.textContent = '📋 任务';
        this.btn.style.cssText = 'position: absolute; right: 6px; bottom: 46px; z-index: 10;';
        this.btn.addEventListener('click', () => this.togglePanel());
        this.mapWrapper.appendChild(this.btn);

        this.panel = document.createElement('div');
        this.panel.id = 'taskPanel';
        this.panel.className = 'hand-panel';
        this.panel.style.cssText = 'display: none; position: absolute; right: 6px; bottom: 100px; z-index: 20;';
        this.panel.innerHTML = '<div class="hand-cards-container" id="taskCardsContainer"></div>';
        this.mapWrapper.appendChild(this.panel);

        this.cardsContainer = document.getElementById('taskCardsContainer');
    }

    setupGlobalClick() {
        document.addEventListener('click', (e) => {
            if (!this.panelVisible) return;
            if (e.target.closest('#btnToggleTask') || e.target.closest('#taskPanel')) {
                return;
            }
            this.hidePanel();
        });
    }

    togglePanel() {
        if (this.panelVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    showPanel() {
        this.panelVisible = true;
        this.panel.style.display = 'flex';
    }

    hidePanel() {
        this.panelVisible = false;
        this.panel.style.display = 'none';
    }

    updateDisplay(taskIds, taskDefinitions, playerResources = null) {
        if (!this.cardsContainer) return;
        this.cardsContainer.innerHTML = '';
        if (!taskIds || taskIds.length === 0) {
            this.cardsContainer.innerHTML = '<span style="font-size:0.8rem; color:var(--text-light);">暂无任务</span>';
            return;
        }
        taskIds.forEach(taskId => {
            const def = taskDefinitions.find(d => d.id === taskId);
            if (!def) return;
            const cardEl = this.createTaskCard(def, playerResources);
            this.cardsContainer.appendChild(cardEl);
        });
    }

    createTaskCard(taskDef, playerResources) {
        const card = document.createElement('div');
        card.className = 'hand-card';
        card.dataset.taskId = taskDef.id;

        let canAfford = false;
        if (playerResources && taskDef.cost) {
            canAfford = Object.entries(taskDef.cost).every(([res, amount]) => {
                return (playerResources[res] || 0) >= amount;
            });
        }
        if (canAfford) {
            card.classList.add('playable-card');
        }

        card.innerHTML = `
            <div class="card-name">${taskDef.name}</div>
            <div class="card-cost">${taskDef.costDescription || ''}</div>
            <div class="card-effect">${taskDef.description || ''}</div>
            <div class="card-discard" style="color:#3a7d44; font-size:0.55rem;">${taskDef.rewardDescription || ''}</div>
        `;

        card.addEventListener('click', () => {
            if (this.onTaskClick) {
                this.onTaskClick(taskDef.id);
            }
        });
        return card;
    }

    setTaskClickCallback(callback) {
        this.onTaskClick = callback;
    }
}