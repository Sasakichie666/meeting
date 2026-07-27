class PlayerManager {
    constructor(game) {
        this.game = game;
    }

    // 注册本地玩家
    registerLocalPlayer() {
        const g = this.game;
        if (g.localPlayerIndex !== null) return;
        const usedIndices = Object.values(g.players).map(p => p.index);
        let idx = 0;
        while (usedIndices.includes(idx)) idx++;
        if (idx >= 4) { g.ui.showToast('⚠️ 房间已满'); return; }
        g.localPlayerIndex = idx;
        const playerName = `冒险者${idx + 1}`;
        const playerColor = g.playerColors[idx];
        g.players[g.localPlayerId] = {
            index: idx, name: playerName, position: '冒险者公会',
            color: playerColor,
            ...ResourceManager.INITIAL_VALUES,   // 展开所有初始资源
            hasEndedSeason: false
        };
        if (!g.playerOrder.includes(g.localPlayerId)) g.playerOrder.push(g.localPlayerId);
        g.board.addPlayer(idx, playerColor, '冒险者公会');
        g.cardManager.hands[idx] = [];
        g.board.setLocalPlayerIndex(g.localPlayerIndex);
        g.initPlayerSlots(idx);

        // 初始化本地玩家的角色（初始1名）
        g.chaManager.initPlayerCharacters(g.localPlayerIndex);

        this.ensureLocalCardBoard();
        g.refreshUI();
    }

    // 添加远程玩家
    addRemotePlayer(remotePeerId) {
        const g = this.game;
        if (g.players[remotePeerId]) return;
        const usedIndices = Object.values(g.players).map(p => p.index);
        let idx = 0;
        while (usedIndices.includes(idx)) idx++;
        if (idx >= 4) return;
        const playerData = {
            index: idx, name: `冒险者${idx + 1}`, position: '冒险者公会',
            color: g.playerColors[idx],
            ...ResourceManager.INITIAL_VALUES,   // 展开初始资源
            hasEndedSeason: false
        };
        g.players[remotePeerId] = playerData;
        if (!g.playerOrder.includes(remotePeerId)) g.playerOrder.push(remotePeerId);
        g.board.addPlayer(idx, g.playerColors[idx], '冒险者公会');
        g.cardManager.hands[idx] = [];
        g.initPlayerSlots(idx);

        // 为远程玩家初始化角色（初始1名）
        g.chaManager.initPlayerCharacters(idx);

        g.syncManager.syncToNewPlayer(remotePeerId);
        g.network.broadcastExcept(remotePeerId, {
            type: 'player_joined_notify', playerId: remotePeerId, playerData: { ...playerData }
        });
        g.refreshUI();
    }

    // 移除玩家
    removePlayer(peerId) {
        const g = this.game;
        const player = g.players[peerId];
        if (player) {
            g.removePlayerSlots(player.index);
            // 清理角色数据
            delete g.chaManager.playerCharacters[player.index];
            if (peerId === g.localPlayerId && g.playerBoards[player.index]) {
                g.playerBoards[player.index].panel.remove();
                delete g.playerBoards[player.index];
            }
            g.board.removePlayer(player.index);
            delete g.cardManager.hands[player.index];
            delete g.players[peerId];
            g.playerOrder = g.playerOrder.filter(id => id !== peerId);
            g.network.broadcastExcept(peerId, {
                type: 'player_left_notify', playerId: peerId, playerIndex: player.index
            });
            this.reassignIndices();
        }
        g.refreshUI();
        if (g.gameStarted && g.playerOrder.length < 2) g.turnManager.endGameEarly();
    }

    // 重新分配索引（当玩家离开或顺序变化时）
    reassignIndices() {
        const g = this.game;
        const sorted = Object.entries(g.players).sort((a, b) => a[1].index - b[1].index);
        const oldIndexToNew = {};
        const oldSlots = { ...g.playerSlots };
        let localOldIndex = g.localPlayerIndex;

        sorted.forEach(([peerId, p], newIndex) => {
            const oldIndex = p.index;
            oldIndexToNew[oldIndex] = newIndex;
            p.index = newIndex;
            p.color = g.playerColors[newIndex];
            p.name = `冒险者${newIndex + 1}`;
            g.board.updatePlayerColor(newIndex, g.playerColors[newIndex]);
            if (g.cardManager.hands[oldIndex]) {
                g.cardManager.hands[newIndex] = g.cardManager.hands[oldIndex];
                delete g.cardManager.hands[oldIndex];
            }
        });

        // 重建玩家槽位
        g.playerSlots = {};
        Object.entries(oldIndexToNew).forEach(([oldIdx, newIdx]) => {
            g.playerSlots[newIdx] = oldSlots[oldIdx] || [null, null, null, null];
        });

        // 重建角色数据索引（可选，简单起见直接清空？不，需要保留）
        // 由于角色数据存储方式已按玩家索引，这里无需额外处理

        if (g.localPlayerId && g.players[g.localPlayerId]) {
            g.localPlayerIndex = g.players[g.localPlayerId].index;
            g.board.setLocalPlayerIndex(g.localPlayerIndex);
            if (localOldIndex !== g.localPlayerIndex || !g.playerBoards[g.localPlayerIndex]) {
                if (localOldIndex !== null && g.playerBoards[localOldIndex]) {
                    g.playerBoards[localOldIndex].panel.remove();
                    delete g.playerBoards[localOldIndex];
                }
                this.ensureLocalCardBoard();
            }
        }
        this.syncAllPlayersToBoard();
    }

    // 同步所有玩家到棋盘
    syncAllPlayersToBoard() {
        const g = this.game;
        g.board.clearAllPlayers();
        Object.values(g.players).forEach(p => g.board.addPlayer(p.index, p.color, p.position));
    }

    // 获取可序列化的玩家数据（包含 hasEndedSeason）
    getSerializablePlayers() {
        const g = this.game;
        const result = {};
        Object.entries(g.players).forEach(([pid, p]) => {
            result[pid] = {
                index: p.index, name: p.name, position: p.position,
                color: p.color,
                ...ResourceManager.extractPlayerResources(p),   // 所有资源字段
                hasEndedSeason: p.hasEndedSeason || false
            };
        });
        return result;
    }

    // 根据 playerIndex 查找 peerId
    _getPeerIdByIndex(playerIndex) {
        const g = this.game;
        return Object.keys(g.players).find(pid => g.players[pid].index === playerIndex);
    }

    // 确保本地玩家的卡牌面板已创建
    ensureLocalCardBoard() {
        const g = this.game;
        if (g.playerBoards[g.localPlayerIndex]) {
            g.playerBoards[g.localPlayerIndex].panel.remove();
            delete g.playerBoards[g.localPlayerIndex];
        }
        const player = g.players[g.localPlayerId];
        if (player) {
            g.playerBoards[g.localPlayerIndex] = new LocalCardBoard(
                '#playersBoards',
                player.name,
                player.color,
                (slotIndex) => g.cardManager.onCardSlotSelected(slotIndex),
                true
            );
        }
    }
}