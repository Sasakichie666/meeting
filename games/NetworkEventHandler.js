// games/NetworkEventHandler.js
class NetworkEventHandler {
    constructor(game) {
        this.game = game;
    }

    onDataReceived(fromPeerId, data) {
        const g = this.game;
        switch (data.type) {
            // ---------- 初始分配 ----------
            case 'assign_player':
                this._handleAssignPlayer(data);
                break;

            // ---------- 玩家加入/离开 ----------
            case 'player_joined_notify':
                this._handlePlayerJoinedNotify(data);
                break;
            case 'player_left_notify':
                if (g.players[data.playerId]) {
                    g.playerManager.removePlayer(data.playerId);
                }
                break;

            // ---------- 移动 ----------
            case 'player_move':
                if (g.players[data.peerId]) {
                    g.players[data.peerId].position = data.to;
                    g.board.movePlayer(data.playerIndex, data.to);
                    g.board.clearHighlights();
                    g.refreshUI();
                }
                break;

            // ---------- 回合转换 ----------
            case 'turn_change':
                g.currentTurnIndex = data.currentTurnIndex;
                g.board.setCurrentTurn(g.currentTurnIndex);
                if (data.drawPileSize !== undefined) g.cardManager.drawPile.length = data.drawPileSize;
                if (data.discardPileSize !== undefined) g.cardManager.discardPile.length = data.discardPileSize;
                g.refreshUI();
                if (g.currentTurnIndex === g.localPlayerIndex) {
                    g.observerManager?.forceExitIfNeeded();
                    g.ui.showToast('🎯 轮到你的回合了！');
                }
                break;

            // ---------- 资源更新 ----------
            case 'resource_update':
                if (data.players) {
                    Object.entries(data.players).forEach(([pid, res]) => {
                        if (g.players[pid]) {
                            ResourceManager.applyToPlayer(g.players[pid], res);
                        }
                    });
                } else {
                    g.syncManager._applyPlayerResources(fromPeerId, data);
                }
                g.refreshUI();
                break;

            // ---------- 打牌结果 ----------
            case 'play_card_result':
                g.syncManager._applyPlayerResources(data.peerId, data);
                if (data.hands) g.cardManager.setHands(data.hands);
                if (data.drawPileSize !== undefined) g.cardManager.drawPile.length = data.drawPileSize;
                if (data.discardPileSize !== undefined) g.cardManager.discardPile.length = data.discardPileSize;

                if (!g.playerSlots[data.playerIndex]) {
                    g.playerSlots[data.playerIndex] = [null, null, null, null];
                }
                g.playerSlots[data.playerIndex][data.slotIndex] = data.cardId;

                const board = g.playerBoards[data.playerIndex] || g.observerManager?.observedBoard;
                if (board && data.cardId && data.slotIndex !== undefined) {
                    const def = g.cardManager.getCardDefinition(data.cardId);
                    board.placeCard(data.slotIndex, data.cardId, def);
                }
                g.refreshUI();
                break;

            // ---------- 丢弃结果 ----------
            case 'discard_result':
                g.syncManager._applyPlayerResources(data.peerId, data);
                if (data.hands) g.cardManager.setHands(data.hands);
                if (data.drawPileSize !== undefined) g.cardManager.drawPile.length = data.drawPileSize;
                if (data.discardPileSize !== undefined) g.cardManager.discardPile.length = data.discardPileSize;
                g.refreshUI();
                break;

            // ---------- 手牌更新 ----------
            case 'hand_update':
                if (data.hands) g.cardManager.setHands(data.hands);
                if (data.drawPileSize !== undefined) g.cardManager.drawPile.length = data.drawPileSize;
                if (data.discardPileSize !== undefined) g.cardManager.discardPile.length = data.discardPileSize;
                g.refreshUI();
                break;

            // ---------- 游戏开始 ----------
            case 'game_start':
                g.gameStarted = true;
                g.currentTurnIndex = data.currentTurnIndex || 0;
                g.board.setCurrentTurn(g.currentTurnIndex);
                if (data.hands) g.cardManager.setHands(data.hands);
                if (data.drawPileSize !== undefined) g.cardManager.drawPile.length = data.drawPileSize;
                if (data.discardPileSize !== undefined) g.cardManager.discardPile.length = data.discardPileSize;

                if (data.allSlots) {
                    g.playerSlots = JSON.parse(JSON.stringify(data.allSlots));
                }
                if (data.characters) {
                    g.chaManager.playerCharacters = this._convertCharacterKeys(data.characters);
                }
                if (data.workspaceUsed) {
                    g.workspaceManager.applyUsedActions(data.workspaceUsed);
                }
                if (data.taskDisplay) {
                    g.taskManager.setDisplayedTasks(data.taskDisplay, data.taskDrawPileSize);
                }
                if (data.positions) {
                    g.trackManager.setPositions(data.positions);
                }
                g.playerManager.ensureLocalCardBoard();
                g.refreshUI();
                g.ui.showToast('🎲 游戏开始！');
                if (g.currentTurnIndex === g.localPlayerIndex) g.ui.showToast('🎯 你是先手！');
                break;

            // ---------- 游戏状态同步 ----------
            case 'game_state_sync':
                g.players = {};
                g.board.clearAllPlayers();
                if (g.playerBoards[g.localPlayerIndex]) {
                    g.playerBoards[g.localPlayerIndex].panel.remove();
                    delete g.playerBoards[g.localPlayerIndex];
                }
                if (data.allPlayers) {
                    Object.entries(data.allPlayers).forEach(([pid, p]) => {
                        g.players[pid] = { ...p };
                        g.board.addPlayer(p.index, p.color, p.position);
                    });
                }
                g.playerOrder = data.playerOrder || [];
                g.currentTurnIndex = data.currentTurnIndex || 0;
                g.gameStarted = data.gameStarted || false;
                if (data.hands) g.cardManager.setHands(data.hands);
                if (data.drawPileSize !== undefined) g.cardManager.drawPile.length = data.drawPileSize;
                if (data.discardPileSize !== undefined) g.cardManager.discardPile.length = data.discardPileSize;
                if (data.allSlots) {
                    g.playerSlots = JSON.parse(JSON.stringify(data.allSlots));
                }
                g.board.setCurrentTurn(g.currentTurnIndex);
                if (g.players[g.localPlayerId]) {
                    g.playerManager.ensureLocalCardBoard();
                }
                g.refreshUI();
                break;

            // ---------- 玩家离开更新 ----------
            case 'player_left_update':
                if (data.peerId) g.playerManager.removePlayer(data.peerId);
                if (data.allPlayers) {
                    g.players = {};
                    g.board.clearAllPlayers();
                    if (g.playerBoards[g.localPlayerIndex]) {
                        g.playerBoards[g.localPlayerIndex].panel.remove();
                        delete g.playerBoards[g.localPlayerIndex];
                    }
                    Object.entries(data.allPlayers).forEach(([pid, p]) => {
                        g.players[pid] = { ...p };
                        g.board.addPlayer(p.index, p.color, p.position);
                    });
                    g.playerOrder = data.playerOrder || [];
                    g.currentTurnIndex = data.currentTurnIndex || 0;
                }
                if (data.hands) g.cardManager.setHands(data.hands);
                if (g.players[g.localPlayerId]) {
                    g.playerManager.ensureLocalCardBoard();
                }
                g.refreshUI();
                break;

            // ---------- 日志消息 ----------
            case 'log_message':
                g.ui.addLog(data.message, data.color);
                break;

            // ---------- 季节相关 ----------
            case 'req_end_season':
                if (g.network.isHost()) {
                    g.seasonManager._executeEndSeason(data.playerIndex);
                }
                break;

            case 'season_ended':
                if (g.players) {
                    const endedPlayer = Object.values(g.players).find(p => p.index === data.playerIndex);
                    if (endedPlayer) {
                        endedPlayer.hasEndedSeason = true;
                        g.ui.showToast(`${endedPlayer.name} 结束了时代`);
                    }
                }
                g.refreshUI();
                break;

            case 'season_change':
                g.seasonManager.currentSeasonIndex = data.seasonIndex;
                if (data.allPlayers) {
                    Object.entries(data.allPlayers).forEach(([pid, p]) => {
                        if (g.players[pid]) {
                            g.players[pid].hasEndedSeason = p.hasEndedSeason;
                            ResourceManager.applyToPlayer(g.players[pid], p);
                        }
                    });
                }
                g.currentTurnIndex = data.currentTurnIndex;
                g.board.setCurrentTurn(g.currentTurnIndex);
                if (data.hands) g.cardManager.setHands(data.hands);
                if (data.drawPileSize !== undefined) g.cardManager.drawPile.length = data.drawPileSize;
                if (data.discardPileSize !== undefined) g.cardManager.discardPile.length = data.discardPileSize;
                if (data.allSlots) {
                    g.playerSlots = JSON.parse(JSON.stringify(data.allSlots));
                }
                if (data.workspaceUsed) {
                    g.workspaceManager.applyUsedActions(data.workspaceUsed);
                } else {
                    g.workspaceManager.resetSeason();
                }
                if (data.positions) {
                    g.trackManager.setPositions(data.positions);
                }
                const newSeason = g.seasonManager.getCurrentSeasonInfo();
                g.ui.updateSeason(newSeason.icon, newSeason.name, newSeason.desc);
                g.ui.showToast(`🌱 进入${newSeason.name}的时代！`);
                g.refreshUI();
                break;

            // ---------- 角色数据同步 ----------
            case 'character_update':
                if (data.characters) {
                    g.chaManager.playerCharacters = this._convertCharacterKeys(data.characters);
                }
                g.refreshUI();
                break;

            // ---------- 工位使用记录同步 ----------
            case 'workspace_used':
                if (data.usedActions) {
                    g.workspaceManager.applyUsedActions(data.usedActions);
                }
                g.refreshUI();
                break;

            // ---------- 任务相关 ----------
            case 'task_update':
                if (data.displayedTasks) {
                    g.taskManager.setDisplayedTasks(data.displayedTasks, data.drawPileSize);
                }
                break;

            case 'req_submit_task':
                if (g.network.isHost()) {
                    const reqPlayer = Object.values(g.players).find(p => p.index === data.playerIndex);
                    if (reqPlayer && data.playerIndex === g.currentTurnIndex) {
                        const result = g.taskManager.submitTask(data.playerIndex, data.taskId);
                        if (result.success) {
                            g.turnManager.advanceTurn();
                        }
                    }
                }
                break;

            // ---------- 轨道位置同步 ----------
            case 'track_positions':
                if (data.positions) {
                    g.trackManager.setPositions(data.positions);
                }
                break;

            // ---------- 工位行动请求 ----------
            case 'req_workspace_action':
                if (g.network.isHost()) {
                    const reqPlayer = Object.values(g.players).find(p => p.index === data.playerIndex);
                    if (reqPlayer && data.playerIndex === g.currentTurnIndex) {
                        g.locationUI._executeWorkspaceAction(data.location, data.actionKey, data.playerIndex, data.extraParams || {});
                    }
                }
                break;

            // ---------- 其他请求 ----------
            case 'req_move':
                if (g.network.isHost()) {
                    const reqPlayer = Object.values(g.players).find(p => p.index === data.playerIndex);
                    if (reqPlayer && data.playerIndex === g.currentTurnIndex) {
                        g.isStationTeleporting = data.isTeleport && data.from && data.from.startsWith('车站');
                        const result = g.moveHandler.executeMove(data.playerIndex, data.from, data.to);
                        if (result.success) {
                            g.turnManager.advanceTurn();
                        }
                    }
                }
                break;

            case 'req_play_card':
                if (g.network.isHost()) {
                    const reqPlayer = Object.values(g.players).find(p => p.index === data.playerIndex);
                    if (reqPlayer && data.playerIndex === g.currentTurnIndex) {
                        const result = g.cardActionHandler.executePlayCard(data.playerIndex, data.cardId, data.slotIndex);
                        if (result.success) {
                            g.turnManager.advanceTurn();
                        }
                    }
                }
                break;

            case 'req_discard':
                if (g.network.isHost()) {
                    const reqPlayer = Object.values(g.players).find(p => p.index === data.playerIndex);
                    if (reqPlayer && data.playerIndex === g.currentTurnIndex) {
                        const result = g.cardActionHandler.executeDiscard(data.playerIndex, data.cardId);
                        if (result.success) {
                            g.turnManager.advanceTurn();
                        }
                    }
                }
                break;
        }
    }

    // ---------- 工具方法 ----------
    _convertCharacterKeys(characters) {
        const converted = {};
        Object.keys(characters).forEach(key => {
            converted[parseInt(key)] = characters[key];
        });
        return converted;
    }

    // ---------- 私有处理方法 ----------
    _handleAssignPlayer(data) {
        const g = this.game;
        if (g.localPlayerIndex === null) {
            g.localPlayerIndex = data.playerIndex;
            g.players = {};
            g.board.clearAllPlayers();
            if (g.playerBoards[g.localPlayerIndex]) {
                g.playerBoards[g.localPlayerIndex].panel.remove();
                delete g.playerBoards[g.localPlayerIndex];
            }
            if (data.allPlayers) {
                Object.entries(data.allPlayers).forEach(([pid, p]) => {
                    g.players[pid] = { ...p };
                    g.board.addPlayer(p.index, p.color, p.position);
                });
            }
            g.playerOrder = data.playerOrder || [];
            g.currentTurnIndex = data.currentTurnIndex || 0;
            g.gameStarted = data.gameStarted || false;
            if (g.localPlayerId && !g.players[g.localPlayerId]) {
                const localPlayer = {
                    index: g.localPlayerIndex,
                    name: data.playerName || `冒险者${g.localPlayerIndex + 1}`,
                    position: '冒险者公会',
                    color: data.color || g.playerColors[g.localPlayerIndex],
                    hasEndedSeason: false
                };
                ResourceManager.applyToPlayer(localPlayer, data);
                ResourceManager.getResourceKeys().forEach(key => {
                    if (localPlayer[key] === undefined) {
                        localPlayer[key] = ResourceManager.INITIAL_VALUES[key];
                    }
                });
                g.players[g.localPlayerId] = localPlayer;
                if (!g.playerOrder.includes(g.localPlayerId)) g.playerOrder.push(g.localPlayerId);
            }
            if (data.hands) g.cardManager.setHands(data.hands);
            if (data.drawPileSize !== undefined) g.cardManager.drawPile.length = data.drawPileSize;
            if (data.discardPileSize !== undefined) g.cardManager.discardPile.length = data.discardPileSize;
            // 角色数据
            if (data.characters) {
                g.chaManager.playerCharacters = this._convertCharacterKeys(data.characters);
            } else {
                g.chaManager.initPlayerCharacters(g.localPlayerIndex);
            }
            // 工位使用状态
            if (data.workspaceUsed) {
                g.workspaceManager.applyUsedActions(data.workspaceUsed);
            }
            // 任务状态
            if (data.taskDisplay) {
                g.taskManager.setDisplayedTasks(data.taskDisplay, data.taskDrawPileSize);
            }
            // 轨道位置
            if (data.positions) {
                g.trackManager.setPositions(data.positions);
            }
            g.board.setCurrentTurn(g.currentTurnIndex);
            g.board.setLocalPlayerIndex(g.localPlayerIndex);
            g.playerManager.ensureLocalCardBoard();
            g.refreshUI();
        }
    }

    _handlePlayerJoinedNotify(data) {
        const g = this.game;
        if (!g.players[data.playerId]) {
            g.players[data.playerId] = {
                ...data.playerData,
                hasEndedSeason: false
            };
            g.board.addPlayer(data.playerData.index, data.playerData.color, data.playerData.position);
            g.playerOrder.push(data.playerId);
            g.cardManager.hands[data.playerData.index] = [];

            if (!g.playerSlots[data.playerData.index]) {
                g.playerSlots[data.playerData.index] = [null, null, null, null];
            }

            g.refreshUI();
        }
    }
}