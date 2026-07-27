class Game {
    constructor(network, board, ui) {
        this.network = network;
        this.board = board;
        this.ui = ui;

        // UI组件
        this.chaUI = new ChaUI('#characterPanel');
        this.trackUI = new PublicTrackUI('#trackContainer');
        this.tcardsUI = new TcardsUI('.map-wrapper');

        // 核心管理器
        this.chaManager = new ChaManager(this);
        this.workspaceManager = new WorkspaceManager(this);
        this.feastManager = new FeastManager(this);
        this.taskManager = new TaskManager(this);
        this.taskActionHandler = new TaskActionHandler(this);
        this.trackManager = new TrackManager(this);

        this.cardManager = new CardManager(network, ui, this);
        this.locationEffects = new LocationEffects(this);
        this.locationUI = new LocationUI(this);

        // 基础属性
        this.localPlayerId = null;
        this.localPlayerIndex = null;
        this.gameStarted = false;
        this.currentTurnIndex = 0;
        this.players = {};
        this.playerOrder = [];
        this.isStationTeleporting = false;
        this.playerBoards = {};
        this.playerSlots = {};

        this.playerColors = ['#e8788a', '#5b9bd5', '#4caf84', '#e8a840'];

        Game.instance = this;

        // 子模块（注意依赖顺序）
        this.syncManager = new SyncManager(this);
        this.playerManager = new PlayerManager(this);
        this.turnManager = new TurnManager(this);
        this.moveHandler = new MoveHandler(this);
        this.cardActionHandler = new CardActionHandler(this);
        this.seasonManager = new SeasonManager(this);
        this.networkEventHandler = new NetworkEventHandler(this);

        this.observerManager = new ObserverManager(this);
        this.observerManager.setupTagClickHandler();

        // 绑定任务点击回调
        this.tcardsUI.setTaskClickCallback((taskId) => {
            this.taskActionHandler.requestSubmitTask(taskId);
        });

        this.setupBoardCallbacks();
        this.setupNetworkCallbacks();
    }

    // ---------- 玩家槽位管理 ----------
    initPlayerSlots(playerIndex) {
        if (!this.playerSlots[playerIndex]) {
            this.playerSlots[playerIndex] = [null, null, null, null];
        }
    }
    removePlayerSlots(playerIndex) {
        delete this.playerSlots[playerIndex];
    }

    // ---------- 观察者代理 ----------
    isObserving() { return this.observerManager.isObserving(); }

    // ---------- 棋盘回调 ----------
    setupBoardCallbacks() {
        this.board.options.onPlayerMoveRequest = (playerIndex, from, to) => {
            this.cardManager.clearSelection();
            this.moveHandler.requestMove(playerIndex, from, to);
        };
        this.board.options.onPlayerPieceClick = (playerIndex, location) => {
            if (this.isObserving()) {
                this.ui.showToast('🔍 观察模式下无法操作');
                this.board.clearHighlights();
                return;
            }
            this.locationUI.handlePieceClick(playerIndex, location);
        };
        this.board.options.onLocationClick = (location) => {
            this.locationUI.handleLocationClick(location);
        };
    }

    setupNetworkCallbacks() {
        this.network.callbacks = {
            onConnected: (peerId) => this.onConnected(peerId),
            onPlayerJoined: (remotePeerId) => this.playerManager.addRemotePlayer(remotePeerId),
            onPlayerLeft: (remotePeerId) => this.playerManager.removePlayer(remotePeerId),
            onDataReceived: (fromPeerId, data) =>
                this.networkEventHandler.onDataReceived(fromPeerId, data),
            onHostAssigned: () => this.onHostAssigned(),
            onError: (msg) => this.ui.showToast('⚠️ ' + msg),
            onDisconnected: () => this.handleDisconnect()
        };
    }

    onConnected(peerId) {
        this.localPlayerId = peerId;
        this.refreshUI();
        if (this.network.isHost()) {
            this.playerManager.registerLocalPlayer();
            this.chaManager.initPlayerCharacters(this.localPlayerIndex);
            this.ui.showToast('🏰 房间已创建！');
        }
    }

    onHostAssigned() {
        this.refreshUI();
        this.ui.showToast('👑 你成为了新的主机');
        if (this.gameStarted && this.currentTurnIndex === this.localPlayerIndex) {
            this.turnManager.startTurnDraw(this.localPlayerIndex);
        }
    }

    handleDisconnect() {
        this.gameStarted = false;
        this.players = {};
        this.playerOrder = [];
        this.localPlayerIndex = null;
        this.localPlayerId = null;
        this.currentTurnIndex = 0;
        this.isStationTeleporting = false;
        this.board.clearAllPlayers();
        this.board.clearHighlights();
        this.board.setCurrentTurn(null);
        this.cardManager.hands = {};
        this.cardManager.clearSelection();
        Object.values(this.playerBoards).forEach(b => { if (b.panel) b.panel.remove(); });
        this.playerBoards = {};
        this.playerSlots = {};
        this.observerManager.clearTarget();
        this.refreshUI();
    }

    // ---------- 快捷方法 ----------
    startGame() {
        if (!this.network.isHost() || this.gameStarted) return;
        this.taskManager.init();                     // 初始化任务牌堆
        this.trackManager.initPlayerPositions();     // 初始化轨道位置（全0）
        this.turnManager.startGame();                // 处理补偿、发牌、广播 game_start（包含轨道位置、角色、工位等）
        this.taskManager.broadcastState();           // 广播任务面板
        // 轨道位置已在 game_start 中同步，无需重复广播
    }

    requestPlayCard(slotIndex) {
        if (this.isObserving()) { this.ui.showToast('🔍 观察模式下无法操作'); return; }
        this.cardActionHandler.requestPlayCard(slotIndex);
    }

    requestDiscardCard(cardId) {
        if (this.isObserving()) { this.ui.showToast('🔍 观察模式下无法操作'); return; }
        this.cardActionHandler.requestDiscardCard(cardId);
    }

    endSeason() {
        if (!this.gameStarted) return;
        if (this.isObserving()) { this.ui.showToast('🔍 观察模式下无法操作'); return; }
        if (this.currentTurnIndex !== this.localPlayerIndex) {
            this.ui.showToast('⏳ 现在不是你的回合');
            return;
        }
        this.seasonManager.requestEndSeason(this.localPlayerIndex);
    }

    // ---------- UI 刷新 ----------
    refreshUI() {
        const playersWithHand = {};
        Object.entries(this.players).forEach(([peerId, p]) => {
            const handCount = (this.cardManager.hands[p.index] || []).length;
            playersWithHand[peerId] = { ...p, handCount: handCount };
        });

        const renderTarget = this.observerManager.getRenderTarget();
        const isObserving = this.observerManager.isObserving();

        // 玩家列表（高亮观察目标）
        this.ui.updatePlayerList(playersWithHand, this.localPlayerId, this.gameStarted,
            this.currentTurnIndex, this.observerManager.targetIndex);

        // 回合信息
        this.ui.updateTurnInfo(this.gameStarted, this.network.isConnected(), playersWithHand,
            this.currentTurnIndex, this.localPlayerIndex);

        // 资源面板：始终显示所有玩家的资源
        this.ui.updateResourcePanel(playersWithHand, this.localPlayerId);

        this.ui.updateDeckInfo(this.cardManager.drawPile.length, this.cardManager.discardPile.length);

        // 手牌显示（观察模式下隐藏）
        if (isObserving) {
            if (this.ui.handPanel) this.ui.handPanel.style.display = 'none';
        } else {
            const hand = renderTarget ? this.cardManager.getHand(renderTarget.index) : [];
            this.ui.updateHandDisplay(hand, this.cardManager.cardDefinitions, renderTarget);
        }

        // 打出区域（观察者或自己）
        this.observerManager.renderObservedBoard();

        // 角色面板
        const targetPlayerIndex = isObserving ? this.observerManager.targetIndex : this.localPlayerIndex;
        const targetCharacters = this.chaManager.getPlayerCharacters(targetPlayerIndex);
        this.chaUI.renderAll(targetPlayerIndex, targetCharacters);

        // 任务面板（传入本地玩家资源以高亮可完成任务）
        const localPlayer = this.players[this.localPlayerId];
        this.tcardsUI.updateDisplay(
            this.taskManager.displayedTasks,
            window.TASK_CARD_DEFINITIONS,
            localPlayer
        );

        // 更新地图上本玩家已使用工位的地点标记
        if (this.workspaceManager) {
            const usedLocs = this.workspaceManager.getPlayerUsedLocations(this.localPlayerIndex);
            this.board.setUsedLocations(usedLocs);
        }

        this.ui.updateStartButton(this.network.isHost(), Object.keys(this.players).length, this.gameStarted);
        this.ui.updateConnectionStatus(this.network.isConnected(), this.network.getRoomId());

        if (this.seasonManager) {
            const season = this.seasonManager.getCurrentSeasonInfo();
            this.ui.updateSeason(season.icon, season.name, season.desc);
        }

        const lp = this.players[this.localPlayerId];
        const isMyTurn = this.gameStarted && this.currentTurnIndex === this.localPlayerIndex && !isObserving;
        const hasEnded = lp ? lp.hasEndedSeason : false;
        this.ui.updateEndSeasonButton(this.gameStarted, isMyTurn, hasEnded);
    }
}