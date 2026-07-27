// effect/locationUI.js
class LocationUI {
    constructor(game) {
        this.game = game;
        this.currentWorkspaceOverlay = null;
    }

    handlePieceClick(playerIndex, location) {
        const g = this.game;
        if (playerIndex !== g.localPlayerIndex || playerIndex !== g.currentTurnIndex) {
            g.board.clearHighlights();
            return;
        }

        let actionLabel = '⚙️ 工位行动';
        if (location && location.startsWith('车站')) {
            actionLabel = '🚆 乘坐列车';
        }

        g.ui.showChoiceModal(
            `你位于「${location}」，想要做什么？`,
            actionLabel,
            '🚶 移动',
            (chooseAction) => {
                if (chooseAction) {
                    this._executeLocationAction(playerIndex, location);
                } else {
                    g.isStationTeleporting = false;
                    g.board.startMoveFrom(location);
                }
            }
        );
    }

    handleLocationClick(location) {
        const g = this.game;
        if (location.startsWith('车站')) return;
        this._showWorkspaceWindow(location, g.localPlayerIndex);
    }

    _executeLocationAction(playerIndex, location) {
        const g = this.game;
        if (location && location.startsWith('车站')) {
            g.ui.showConfirmModal(
                `是否花费 5 金币乘坐列车，前往其他车站？`,
                (confirmed) => {
                    if (confirmed) {
                        g.isStationTeleporting = true;
                        g.board.prepareStationTeleport(location);
                    } else {
                        g.board.clearHighlights();
                    }
                }
            );
        } else {
            this._showWorkspaceWindow(location, playerIndex);
        }
    }

    _getLocationActions(location) {
        const g = this.game;
        const actions = {
            // 市集
            '市集': [
                { key: 'marketBuyWood',       label: '购买木头 (6金 → 8木头)',        costCheck: (pl) => pl.gold >= 6 },
                { key: 'marketBuyStone',      label: '购买石头 (6金 → 4石头)',        costCheck: (pl) => pl.gold >= 6 },
                { key: 'marketBuyIngredient', label: '购买食材 (6金 → 8食材)',        costCheck: (pl) => pl.gold >= 6 },
                { key: 'marketBuyMineral',    label: '购买矿物 (8金 → 4矿物)',        costCheck: (pl) => pl.gold >= 8 }
            ],
            // 伐木场
            '伐木场': [
                { key: 'lumber1', label: '伐木 (3体力 → 8木头)',        costCheck: (pl) => pl.stamina >= 3 },
                { key: 'lumber2', label: '大量伐木 (4体力 → 10木头)',    costCheck: (pl) => pl.stamina >= 4 }
            ],
            // 矿洞
            '矿洞': [
                { key: 'mine1', label: '采矿 (3体力 → 2矿物+1石头)',    costCheck: (pl) => pl.stamina >= 3 },
                { key: 'mine2', label: '深采 (4体力 → 4矿物)',          costCheck: (pl) => pl.stamina >= 4 }
            ],
            // 森林
            '森林': [
                { key: 'forest1', label: '采摘 (3体力 → 8食材)',        costCheck: (pl) => pl.stamina >= 3 },
                { key: 'forest2', label: '伐木采石 (3体力 → 6木头+1石头)', costCheck: (pl) => pl.stamina >= 3 }
            ],
            // 渔场
            '渔场': [
                { key: 'fish1', label: '捕鱼 (3体力 → 8食材)',          costCheck: (pl) => pl.stamina >= 3 },
                { key: 'fish2', label: '远洋捕捞 (4体力 → 12食材)',     costCheck: (pl) => pl.stamina >= 4 }
            ],
            // 餐馆
            '餐馆': [
                { key: 'restaurant1', label: '大餐 (6金 → 4体力)',      costCheck: (pl) => pl.gold >= 6 },
                { key: 'restaurant2', label: '外卖 (6金 → 4佳肴)',      costCheck: (pl) => pl.gold >= 6 },
                { key: 'restaurant3', label: '烹饪 (6食材 → 4佳肴)',    costCheck: (pl) => (pl.ingredient || 0) >= 6 }
            ],
            // 温泉
            '温泉': [
                { key: 'hotspring1', label: '泡汤 (8金 → 6体力)',       costCheck: (pl) => pl.gold >= 8 },
                { key: 'hotspring2', label: '礼物 (8金 → 1好感度)',     costCheck: (pl) => pl.gold >= 8 }
            ],
            // 遗迹系列
            '石像遗迹': [ { key: 'relic1', label: '探索 (3体力 → 3知识)', costCheck: (pl) => pl.stamina >= 3 } ],
            '地底遗迹': [ { key: 'relic1', label: '探索 (3体力 → 3知识)', costCheck: (pl) => pl.stamina >= 3 } ],
            '森林遗迹': [ { key: 'relic1', label: '探索 (3体力 → 3知识)', costCheck: (pl) => pl.stamina >= 3 } ],
            // 港口
            '港口': [
                { key: 'port1', label: '搬运 (3体力 → 8金币)',          costCheck: (pl) => pl.stamina >= 3 },
                { key: 'port2', label: '重货 (4体力 → 12金币)',        costCheck: (pl) => pl.stamina >= 4 }
            ],
            // 炼金屋
            '炼金屋': [
                { key: 'alchemy1', label: '炼金 (2矿物 → 1工具+2木头)',   costCheck: (pl) => (pl.mineral || 0) >= 2 },
                { key: 'alchemy2', label: '高级炼金 (4矿物 → 2工具+2石头)', costCheck: (pl) => (pl.mineral || 0) >= 4 }
            ],
            // 花园
            '花园': [ { key: 'garden1', label: '赏花 (8金 → 1好感度)',    costCheck: (pl) => pl.gold >= 8 } ],
            // 沙滩
            '沙滩': [ { key: 'beach1', label: '度假 (8金 → 1好感度)',    costCheck: (pl) => pl.gold >= 8 } ],
            // 工坊（新）
            '工坊': [
                { key: 'workshopBuildWood',  label: '木工 (6木头 → 2建材)',            costCheck: (pl) => (pl.wood || 0) >= 6 },
                { key: 'workshopBuildStone', label: '石工 (4石头 → 3建材)',            costCheck: (pl) => (pl.stone || 0) >= 4 },
                { key: 'workshopBuildMixed', label: '混筑 (6木头+3石头 → 4建材)',      costCheck: (pl) => (pl.wood || 0) >= 6 && (pl.stone || 0) >= 3 }
            ],
            // 图书馆（新）
            '图书馆': [
                { key: 'libraryResearchWood',  label: '木研 (6木头 → 4知识)',         costCheck: (pl) => (pl.wood || 0) >= 6 },
                { key: 'libraryResearchStone', label: '石研 (3石头 → 4知识)',         costCheck: (pl) => (pl.stone || 0) >= 3 },
                { key: 'libraryResearchMineral',label: '矿研 (2矿物 → 4知识)',        costCheck: (pl) => (pl.mineral || 0) >= 2 },
                { key: 'libraryLearn',          label: '学习 (2知识 → 抽2张牌)',      costCheck: (pl) => (pl.knowledge || 0) >= 2 }
            ],
            // 纪念碑（方尖碑）
            '纪念碑': [
                { key: 'contribute_food',      label: '贡献佳肴 (3佳肴 → 佳肴轨道+1)',    costCheck: (pl) => (pl.food || 0) >= 3 },
                { key: 'contribute_building',  label: '贡献建材 (2建材 → 建材轨道+1)',    costCheck: (pl) => (pl.building || 0) >= 2 },
                { key: 'contribute_tool',      label: '贡献工具 (1工具 → 工具轨道+1)',    costCheck: (pl) => (pl.tool || 0) >= 1 },
                { key: 'contribute_knowledge', label: '贡献知识 (3知识 → 知识轨道+1)',    costCheck: (pl) => (pl.knowledge || 0) >= 3 }
            ],
            // 中心广场
            '中心广场': [
                { key: 'promote', label: '提升好感度 (8金)', costCheck: (pl) => pl.gold >= 4 && g.chaManager.getPlayerCharacters(g.localPlayerIndex).length > 0 }
            ],
            // 冒险者公会
            '冒险者公会': [
                { key: 'recruit',      label: '招募新角色 (8金)',        costCheck: (pl) => pl.gold >= 8 && g.chaManager.getRecruitedCount(g.localPlayerIndex) < 4 },
                { key: 'recruitDraw',  label: '佣兵市场 (6金 → 抽2牌)',  costCheck: (pl) => pl.gold >= 6 },
                { key: 'recruitRest',  label: '休整 (恢复2体力)',        costCheck: () => true }
            ],

            '酒馆': [
                { key: 'innBuyFood',    label: '大餐 (8金 → 6佳肴)', costCheck: (pl) => pl.gold >= 8 },
                { key: 'innBuyStamina', label: '休息 (6金 → 4体力)', costCheck: (pl) => pl.gold >= 6 }
            ],
            '商店街': [
                { key: 'shopBuyFood',      label: '采购 (12金 → 9佳肴)', costCheck: (pl) => pl.gold >= 12 },
                { key: 'shopBuyAffection', label: '送礼 (8金 → 1好感度)', costCheck: (pl) => pl.gold >= 8 }
            ],
            '采石场': [
                { key: 'quarry1', label: '采石 (3体力 → 4石头)', costCheck: (pl) => pl.stamina >= 3 },
                { key: 'quarry2', label: '大量采石 (4体力 → 6石头)', costCheck: (pl) => pl.stamina >= 4 }
            ]
        };
        return actions[location] || [];
    }

    _showWorkspaceWindow(location, playerIndex) {
        const g = this.game;
        const mapWrapper = document.querySelector('.map-wrapper');
        if (!mapWrapper) return;

        this._closeWorkspaceWindow();

        const isMyTurn = g.currentTurnIndex === playerIndex;
        const isAtLocation = g.players[g.localPlayerId]?.position === location;
        const canInteract = isMyTurn && isAtLocation;
        const player = g.players[g.localPlayerId];

        const overlay = document.createElement('div');
        overlay.className = 'workspace-overlay';
        Object.assign(overlay.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: '100', borderRadius: 'var(--radius)', overflow: 'hidden'
        });

        const panel = document.createElement('div');
        panel.className = 'workspace-panel';
        Object.assign(panel.style, {
            background: '#fff8f3', borderRadius: '14px', padding: '24px 30px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.25)', minWidth: '500px', maxWidth: '600px',
            textAlign: 'center', position: 'relative'
        });

        const title = document.createElement('h3');
        title.textContent = `${location} · 工位行动`;
        title.style.margin = '0 0 16px';
        title.style.fontSize = '1.1rem';
        title.style.color = '#4a3728';
        title.style.fontFamily = 'var(--font-title)';
        panel.appendChild(title);

        const actionList = this._getLocationActions(location);
        if (actionList.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.textContent = '暂无可用行动';
            emptyMsg.style.color = '#6b5d4f';
            panel.appendChild(emptyMsg);
        } else {
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.flexDirection = 'column';
            buttonContainer.style.gap = '10px';
            buttonContainer.style.margin = '12px 0';

            actionList.forEach(action => {
                const btn = document.createElement('button');
                btn.textContent = action.label;
                btn.className = 'btn';
                btn.style.width = '100%';
                btn.style.padding = '10px 18px';
                btn.style.fontSize = '0.85rem';
                btn.style.borderRadius = '12px';

                let canUse = false;
                let reason = '';
                if (canInteract) {
                    const permCheck = g.workspaceManager.canUseAction(playerIndex, location, action.key);
                    const costCheck = action.costCheck(player);
                    if (!permCheck.canUse) {
                        reason = permCheck.reason;
                    } else if (!costCheck) {
                        reason = '资源不足';
                    } else {
                        canUse = true;
                    }
                } else {
                    reason = '非当前回合或不在该地点（查询模式）';
                }

                if (!canUse) {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.title = reason;
                    if (reason) {
                        const reasonSpan = document.createElement('span');
                        reasonSpan.textContent = ` (${reason})`;
                        reasonSpan.style.fontSize = '0.7rem';
                        reasonSpan.style.color = '#a05050';
                        reasonSpan.style.marginLeft = '4px';
                        btn.appendChild(reasonSpan);
                    }
                } else {
                    btn.onclick = () => {
                        this._executeAction(location, action.key, playerIndex);
                        this._closeWorkspaceWindow();
                    };
                }

                buttonContainer.appendChild(btn);
            });

            panel.appendChild(buttonContainer);
        }

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.className = 'btn btn-small';
        closeBtn.style.marginTop = '12px';
        closeBtn.style.padding = '8px 16px';
        closeBtn.style.fontSize = '0.8rem';
        closeBtn.onclick = () => this._closeWorkspaceWindow();
        panel.appendChild(closeBtn);

        overlay.appendChild(panel);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this._closeWorkspaceWindow();
        });

        mapWrapper.appendChild(overlay);
        this.currentWorkspaceOverlay = overlay;
    }

    _executeAction(location, actionKey, playerIndex) {
        const g = this.game;
        this._selectCharacterForAction(location, actionKey, playerIndex);
    }

    _selectCharacterForAction(location, actionKey, playerIndex) {
        const g = this.game;
        const chars = g.chaManager.getPlayerCharacters(playerIndex);
        if (!chars || chars.length === 0) {
            g.ui.showToast('没有可用的角色');
            return;
        }

        // 需要提升好感度的行动特殊处理：只显示未满好感的角色（且必须有米宝）
        if (['promote', 'hotspring2', 'garden1', 'beach1'].includes(actionKey)) {
            g.chaUI.highlightCharactersByCondition((char) => {
                return char.meeples.some(m => m.amount > 0) && (char.affection || 0) < 5;
            }, chars);
        } else {
            // 普通工位行动：只显示有米宝的角色
            g.chaUI.highlightAvailableCharacters(chars);
        }

        const onSelect = (charIndex) => {
            const char = chars[charIndex];
            if (!char || char.meeples.every(m => m.amount <= 0)) {
                g.ui.showToast('该角色没有可用的米宝');
                return;
            }
            if (['promote', 'hotspring2', 'garden1', 'beach1'].includes(actionKey) && (char.affection || 0) >= 5) {
                g.ui.showToast('该角色好感度已满');
                return;
            }
            cleanup();
            // 所有行动均将消耗的角色作为目标（提升好感度类同样）
            this._sendWorkspaceRequest(location, actionKey, playerIndex, {
                characterIndex: charIndex,
                targetCharacterIndex: charIndex
            });
        };

        const cleanup = () => {
            g.chaUI.highlightAllCharacters(false);
            g.chaUI.onCharacterClick = null;
            document.removeEventListener('click', outsideClickHandler);
        };

        g.chaUI.onCharacterClick = (charIndex) => {
            onSelect(charIndex);
        };

        const outsideClickHandler = (e) => {
            if (!e.target.closest('.character-card')) {
                cleanup();
            }
        };
        setTimeout(() => document.addEventListener('click', outsideClickHandler), 10);
    }

    _sendWorkspaceRequest(location, actionKey, playerIndex, extraParams) {
        const g = this.game;
        if (!g.network.isHost()) {
            g.network.sendToPeer(g.network.hostId, {
                type: 'req_workspace_action',
                location,
                actionKey,
                playerIndex,
                extraParams
            });
        } else {
            this._executeWorkspaceAction(location, actionKey, playerIndex, extraParams);
        }
    }

    _executeWorkspaceAction(location, actionKey, playerIndex, extraParams = {}) {
        const g = this.game;
        const meepleResult = g.chaManager.consumeMeeple(playerIndex, extraParams.characterIndex || 0);
        if (!meepleResult.success) {
            g.ui.showToast('米宝扣除失败');
            return;
        }

        switch (actionKey) {
            // 市集
            case 'marketBuyWood':       LocationActions.marketBuyWood(g, playerIndex); break;
            case 'marketBuyStone':      LocationActions.marketBuyStone(g, playerIndex); break;
            case 'marketBuyIngredient': LocationActions.marketBuyIngredient(g, playerIndex); break;
            case 'marketBuyMineral':    LocationActions.marketBuyMineral(g, playerIndex); break;
            // 伐木场
            case 'lumber1': LocationActions.lumber1(g, playerIndex); break;
            case 'lumber2': LocationActions.lumber2(g, playerIndex); break;
            // 矿洞
            case 'mine1': LocationActions.mine1(g, playerIndex); break;
            case 'mine2': LocationActions.mine2(g, playerIndex); break;
            // 森林
            case 'forest1': LocationActions.forest1(g, playerIndex); break;
            case 'forest2': LocationActions.forest2(g, playerIndex); break;
            // 渔场
            case 'fish1': LocationActions.fish1(g, playerIndex); break;
            case 'fish2': LocationActions.fish2(g, playerIndex); break;
            // 餐馆
            case 'restaurant1': LocationActions.restaurant1(g, playerIndex); break;
            case 'restaurant2': LocationActions.restaurant2(g, playerIndex); break;
            case 'restaurant3': LocationActions.restaurant3(g, playerIndex); break;
            // 温泉
            case 'hotspring1': LocationActions.hotspring1(g, playerIndex); break;
            case 'hotspring2': LocationActions.hotspring2(g, playerIndex, extraParams.targetCharacterIndex || 0); break;
            // 遗迹
            case 'relic1': LocationActions.relicKnowledge(g, playerIndex); break;
            // 港口
            case 'port1': LocationActions.port1(g, playerIndex); break;
            case 'port2': LocationActions.port2(g, playerIndex); break;
            // 炼金屋
            case 'alchemy1': LocationActions.alchemy1(g, playerIndex); break;
            case 'alchemy2': LocationActions.alchemy2(g, playerIndex); break;
            // 花园/沙滩
            case 'garden1': LocationActions.gardenAffection(g, playerIndex, extraParams.targetCharacterIndex || 0); break;
            case 'beach1':  LocationActions.gardenAffection(g, playerIndex, extraParams.targetCharacterIndex || 0); break;
            // 工坊
            case 'workshopBuildWood':  LocationActions.workshopBuildWood(g, playerIndex); break;
            case 'workshopBuildStone': LocationActions.workshopBuildStone(g, playerIndex); break;
            case 'workshopBuildMixed': LocationActions.workshopBuildMixed(g, playerIndex); break;
            // 图书馆
            case 'libraryResearchWood':   LocationActions.libraryResearchWood(g, playerIndex); break;
            case 'libraryResearchStone':  LocationActions.libraryResearchStone(g, playerIndex); break;
            case 'libraryResearchMineral':LocationActions.libraryResearchMineral(g, playerIndex); break;
            case 'libraryLearn':          LocationActions.libraryLearn(g, playerIndex); break;
            // 纪念碑
            case 'contribute_food':      LocationActions.contribute(g, playerIndex, 'food'); break;
            case 'contribute_building':  LocationActions.contribute(g, playerIndex, 'building'); break;
            case 'contribute_tool':      LocationActions.contribute(g, playerIndex, 'tool'); break;
            case 'contribute_knowledge': LocationActions.contribute(g, playerIndex, 'knowledge'); break;
            // 中心广场
            case 'promote': LocationActions.promoteAffection(g, playerIndex, extraParams.targetCharacterIndex || 0); break;
            // 冒险者公会
            case 'recruit':      LocationActions.recruitCharacter(g, playerIndex); break;
            case 'recruitDraw':  LocationActions.recruitDraw(g, playerIndex); break;
            case 'recruitRest':  LocationActions.recruitRest(g, playerIndex); break;
            // 酒馆
            case 'innBuyFood':        LocationActions.innBuyFood(g, playerIndex); break;
            case 'innBuyStamina':     LocationActions.innBuyStamina(g, playerIndex); break;
            // 商店街
            case 'shopBuyFood':       LocationActions.shopBuyFood(g, playerIndex); break;
            case 'shopBuyAffection':  LocationActions.shopBuyAffection(g, playerIndex, extraParams.targetCharacterIndex || 0); break;
            // 采石场
            case 'quarry1': LocationActions.quarry1(g, playerIndex); break;
            case 'quarry2': LocationActions.quarry2(g, playerIndex); break;
            default: return;
        }
        g.workspaceManager.markActionUsed(playerIndex, location, actionKey);
    }

    _closeWorkspaceWindow() {
        if (this.currentWorkspaceOverlay) {
            this.currentWorkspaceOverlay.remove();
            this.currentWorkspaceOverlay = null;
        }
    }
}
