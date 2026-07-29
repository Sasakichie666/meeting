class UIManager {
    constructor(config = {}) {
        this.playerListEl = document.getElementById(config.playerListId || 'playerList');
        this.turnInfoEl = document.getElementById(config.turnInfoId || 'turnInfo');
        this.connectionStatusEl = document.getElementById(config.connectionStatusId || 'connectionStatus');
        this.roomInfoEl = document.getElementById(config.roomInfoId || 'roomInfo');
        this.roomIdDisplayEl = document.getElementById(config.roomIdDisplayId || 'roomIdDisplay');
        this.toastContainer = document.getElementById(config.toastContainerId || 'toastContainer');
        this.modalContainer = document.getElementById(config.modalContainerId || 'modalContainer');
        this.btnStartGame = config.btnStartGame;
        this.btnEndSeason = config.btnEndSeason || document.getElementById('btnEndSeason');
        this.resourceSidebarEl = document.getElementById('resourceSidebar');
        this.drawPileCountEl = document.getElementById('drawPileCount');
        this.discardPileCountEl = document.getElementById('discardPileCount');

        this.handPanel = document.getElementById('handPanel');
        this.handCardsContainer = document.getElementById('handCardsContainer');
        this.btnToggleHand = document.getElementById('btnToggleHand');
        this.logContainer = document.getElementById('logContainer');

        // 外部注入回调
        this.onPlayerTagClick = null;      // 玩家标签点击（由 ObserverManager 注入）
        this.onCardPlay = null;            // 卡牌点击（由 CardManager 注入）
        this.onDiscard = null;             // 丢弃按钮（由 CardManager 注入）
        this.selectedCardId = null;

        this.setupHandToggle();
        this.setupDiscardButton();
        this.setupPlayerTagClick();        // 启用玩家列表点击监听
    }

    // ---------- 玩家列表点击监听 ----------
    setupPlayerTagClick() {
        if (this.playerListEl) {
            this.playerListEl.addEventListener('click', (e) => {
                const tag = e.target.closest('.player-tag');
                if (!tag) return;
                const index = parseInt(tag.dataset.playerIndex);
                if (!isNaN(index) && this.onPlayerTagClick) {
                    this.onPlayerTagClick(index);
                }
            });
        }
    }

    // ---------- 手牌面板 ----------
    setupHandToggle() {
        if (this.btnToggleHand) {
            this.btnToggleHand.addEventListener('click', () => this.toggleHandPanel());
        }
        if (this.handPanel) this.handPanel.style.display = 'none';
    }

    setupDiscardButton() {
        if (!this.handPanel) return;
        this.discardBtn = document.createElement('button');
        this.discardBtn.className = 'btn btn-small';
        this.discardBtn.textContent = '🗑️ 丢弃';
        this.discardBtn.style.cssText = 'margin-top:8px; display:none;';
        this.discardBtn.addEventListener('click', () => {
            if (this.onDiscard && this.selectedCardId) {
                this.onDiscard(this.selectedCardId);
            }
        });
        this.handPanel.appendChild(this.discardBtn);
    }

    toggleHandPanel() {
        if (!this.handPanel) return;
        this.handPanel.style.display =
            (this.handPanel.style.display === 'none' || this.handPanel.style.display === '')
                ? 'flex' : 'none';
    }

    setSelectedCard(cardId) {
        this.selectedCardId = cardId;
        if (this.discardBtn) {
            this.discardBtn.style.display = cardId ? 'inline-block' : 'none';
        }
        this.handCardsContainer.querySelectorAll('.hand-card').forEach(cardEl => {
            cardEl.classList.toggle('selected-card', cardEl.dataset.cardId === cardId);
        });
    }

    setCardPlayCallback(callback) { this.onCardPlay = callback; }
    setDiscardCallback(callback) { this.onDiscard = callback; }

    // ---------- 玩家列表（支持观察高亮） ----------
    updatePlayerList(players, localPlayerId, gameStarted, currentTurnIndex, observerIndex = null) {
        const entries = Object.entries(players).sort((a, b) => a[1].index - b[1].index);
        if (entries.length === 0) {
            this.playerListEl.innerHTML = `
                <div class="player-tag">
                    <span class="player-dot" style="background:#e8788a;"></span>
                    <span style="font-size:0.7rem; margin-left:2px;">你（未就绪） 📍冒险者公会</span>
                </div>`;
            return;
        }
        this.playerListEl.innerHTML = entries.map(([peerId, p]) => {
            const isLocal = peerId === localPlayerId;
            const isCurrent = gameStarted && p.index === currentTurnIndex;
            const isObserved = (observerIndex !== null && p.index === observerIndex);
            let tagClass = 'player-tag';
            if (isCurrent) tagClass += ' current-turn';
            if (isObserved) tagClass += ' observed-player';
            const badge = isCurrent ? '<span class="turn-badge">当前回合</span>' : '';
            const name = isLocal ? `${p.name}（你）` : p.name;
            const points = p.points !== undefined ? p.points : 0;
            const endedMark = p.hasEndedSeason ? ' <span style="color:#a05050;font-size:0.6rem;">已结束</span>' : '';
            const magnifier = isObserved ? ' 🔍' : '';
            return `<div class="${tagClass}" data-player-index="${p.index}">
                <span class="player-dot" style="background:${p.color};"></span>
                <span style="font-size:0.7rem; margin-left:2px;">${name}${endedMark} 🏆${points} 📍${p.position}${magnifier}</span>
                ${badge}
            </div>`;
        }).join('');
    }

    // ---------- 回合状态 ----------
    updateTurnInfo(gameStarted, isConnected, players, currentTurnIndex, localPlayerIndex) {
        if (!gameStarted) {
            this.turnInfoEl.innerHTML = isConnected ? '💡 等待主机开始游戏...' : '💡 创建或加入房间开始冒险';
        } else {
            const cp = Object.values(players).find(p => p.index === currentTurnIndex);
            if (cp) {
                this.turnInfoEl.innerHTML = cp.index === localPlayerIndex ?
                    '🎯 <strong>轮到你了！</strong>' :
                    `⏳ 等待 <strong>${cp.name}</strong> 行动中...`;
            }
        }
    }

    // ---------- 资源面板（三行布局，含新资源） ----------
    updateResourcePanel(players, localPlayerId) {
        if (!this.resourceSidebarEl) return;
        const entries = Object.entries(players).sort((a, b) => a[1].index - b[1].index);
        let html = `<h3 style="font-family: var(--font-title); color: var(--accent2); font-size: 1rem; margin-bottom: 8px;">📦 资源</h3>`;
        if (entries.length === 0) {
            html += `<div style="font-size:0.8rem; color: var(--text-light);">暂无玩家</div>`;
        } else {
            html += entries.map(([peerId, p]) => {
                const isLocal = peerId === localPlayerId;
                const name = isLocal ? '你' : p.name;
                const handCount = p.handCount !== undefined ? p.handCount : 0;
                return `<div style="margin-bottom: 6px; padding: 4px 0; border-bottom: 1px solid #e0d5c7;">
                    <div style="font-weight:600; font-size:0.8rem; display:flex; align-items:center; gap:4px;">
                        <span class="player-dot" style="background:${p.color};"></span>${name}
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 4px; white-space: nowrap; font-size: 0.75rem; color: var(--text-light);">
                        <span title="金币">💰 ${p.gold}</span>
                        <span title="体力">⚡ ${p.stamina}</span>
                        <span title="手牌数">🃏 ${handCount}</span>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 2px; white-space: nowrap; font-size: 0.75rem; color: var(--text-light);">
                        <span title="食材">🥩 ${p.ingredient ?? 0}</span>
                        <span title="木头">🪓 ${p.wood ?? 0}</span>
                        <span title="石头">⛏️ ${p.stone ?? 0}</span>
                        <span title="矿物">💎 ${p.mineral ?? 0}</span>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 2px; white-space: nowrap; font-size: 0.75rem; color: var(--text-light);">
                        <span title="佳肴">🍲 ${p.food ?? 0}</span>
                        <span title="建材">🧱 ${p.building ?? 0}</span>
                        <span title="工具">🔧 ${p.tool ?? 0}</span>
                        <span title="知识">📚 ${p.knowledge ?? 0}</span>
                    </div>
                </div>`;
            }).join('');
        }
        this.resourceSidebarEl.innerHTML = html;
    }

    // ---------- 牌堆信息 ----------
    updateDeckInfo(drawPileSize, discardPileSize) {
        if (this.drawPileCountEl) this.drawPileCountEl.textContent = drawPileSize;
        if (this.discardPileCountEl) this.discardPileCountEl.textContent = discardPileSize;
    }

    // ---------- 手牌展示（支持可打出高亮） ----------
    updateHandDisplay(handCardIds, cardDefinitions, localPlayer) {
        if (!this.handCardsContainer) return;
        const defs = cardDefinitions || [];
        if (!handCardIds || handCardIds.length === 0) {
            this.handCardsContainer.innerHTML = '<span style="font-size:0.8rem; color:var(--text-light);">暂无手牌</span>';
            return;
        }

        const isPlayable = (cardId) => {
            if (!localPlayer) return false;
            const def = defs.find(c => c.id === cardId);
            if (!def || !def.cost) return false;
            for (const [resource, amount] of Object.entries(def.cost)) {
                if ((localPlayer[resource] || 0) < amount) return false;
            }
            return true;
        };

        this.handCardsContainer.innerHTML = handCardIds.map(cardId => {
            const def = defs.find(c => c.id === cardId);
            const name = def ? def.name : '未知';
            const desc = def ? def.description : '';
            const costDesc = def ? def.costDescription || '' : '';
            const discardDesc = def ? (def.discardDescription || '') : '';
            const playableClass = isPlayable(cardId) ? ' playable-card' : '';
            return `<div class="hand-card${playableClass}" data-card-id="${cardId}" title="${desc}">
                <div class="card-name">${name}</div>
                <div class="card-cost">${costDesc}</div>
                <div class="card-effect">${desc}</div>
                <div class="card-discard">${discardDesc}</div>
            </div>`;
        }).join('');

        this.handCardsContainer.querySelectorAll('.hand-card').forEach(cardEl => {
            cardEl.addEventListener('click', () => {
                const cardId = cardEl.dataset.cardId;
                if (this.onCardPlay) this.onCardPlay(cardId);
            });
        });

        if (this.selectedCardId) {
            this.handCardsContainer.querySelectorAll('.hand-card').forEach(cardEl => {
                if (cardEl.dataset.cardId === this.selectedCardId) {
                    cardEl.classList.add('selected-card');
                }
            });
        }

        this.handCardsContainer.querySelectorAll('.card-discard').forEach(el => {
            el.style.fontSize = '0.55rem';
            el.style.color = '#a05050';
            el.style.lineHeight = '1.1';
            el.style.marginTop = '2px';
        });
    }

    // ---------- 连接状态 ----------
    updateConnectionStatus(isConnected, roomId) {
        if (isConnected) {
            this.connectionStatusEl.className = 'status-badge status-connected';
            this.connectionStatusEl.textContent = '🟢 已连接';
            this.roomInfoEl.style.display = 'inline';
            this.roomIdDisplayEl.textContent = roomId || '已加入';
        } else {
            this.connectionStatusEl.className = 'status-badge status-disconnected';
            this.connectionStatusEl.textContent = '⚫ 未连接';
            this.roomInfoEl.style.display = 'none';
        }
    }

    // ---------- 开始按钮 ----------
    updateStartButton(isHost, playerCount, gameStarted) {
        if (!this.btnStartGame) return;
        if (isHost && playerCount >= 2 && !gameStarted) {
            this.btnStartGame.disabled = false;
            this.btnStartGame.textContent = `🎲 开始游戏（${playerCount}人）`;
        } else {
            this.btnStartGame.disabled = true;
            this.btnStartGame.textContent = gameStarted ? '🎲 游戏进行中...' : '🎲 开始游戏（需2人以上）';
        }
    }

    // ---------- 结束时代按钮 ----------
    updateEndSeasonButton(isGameStarted, isMyTurn, hasEndedSeason) {
        if (!this.btnEndSeason) return;
        if (isGameStarted && isMyTurn && !hasEndedSeason) {
            this.btnEndSeason.disabled = false;
            this.btnEndSeason.textContent = '⏳ 结束时代';
        } else if (isGameStarted && hasEndedSeason) {
            this.btnEndSeason.disabled = true;
            this.btnEndSeason.textContent = '✅ 已结束';
        } else {
            this.btnEndSeason.disabled = true;
            this.btnEndSeason.textContent = '⏳ 结束时代';
        }
    }

    // ---------- 季节面板（第四个参数 year 可选，缺省时不显示年份） ----------
    updateSeason(icon, name, desc, year) {
        const iconEl = document.getElementById('seasonIcon');
        const descEl = document.getElementById('seasonDesc');
        if (iconEl) {
            iconEl.textContent = icon;
            iconEl.title = name;
        }
        if (descEl) {
            descEl.textContent = year ? `第${year}年 · ${desc}` : desc;
        }
    }

    // ---------- 弹窗 ----------
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        this.toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }

    showConfirmModal(message, callback) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-box">
                <p>${message}</p>
                <div class="modal-buttons">
                    <button class="btn btn-primary" id="modalYes">是</button>
                    <button class="btn" id="modalNo">否</button>
                </div>
            </div>`;
        this.modalContainer.appendChild(overlay);
        overlay.querySelector('#modalYes').onclick = () => { overlay.remove(); callback(true); };
        overlay.querySelector('#modalNo').onclick = () => { overlay.remove(); callback(false); };
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) { overlay.remove(); callback(false); }
        });
    }

    showChoiceModal(message, btn1Text, btn2Text, callback) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-box">
                <p>${message}</p>
                <div class="modal-buttons">
                    <button class="btn btn-primary" id="modalChoice1">${btn1Text}</button>
                    <button class="btn" id="modalChoice2">${btn2Text}</button>
                </div>
            </div>`;
        this.modalContainer.appendChild(overlay);
        overlay.querySelector('#modalChoice1').onclick = () => { overlay.remove(); callback(true); };
        overlay.querySelector('#modalChoice2').onclick = () => { overlay.remove(); callback(false); };
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) { overlay.remove(); callback(false); }
        });
    }

    // ---------- 日志 ----------
    addLog(message, color = '#4a3728') {
        if (!this.logContainer) return;
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = message;
        logEntry.style.color = color;
        this.logContainer.appendChild(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
        while (this.logContainer.children.length > 100) {
            this.logContainer.removeChild(this.logContainer.firstChild);
        }
    }
}