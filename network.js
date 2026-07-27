class Network {
    constructor(callbacks = {}) {
        this.peer = null;
        this.connections = {};      // { peerId: DataConnection }
        this.hostId = null;
        this.isHostFlag = false;
        this.roomId = null;
        this.callbacks = callbacks;
    }

    /** 生成4位随机大写字母 */
    generateRoomId() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 4; i++) {
            result += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return result;
    }

    /** 创建房间（主机） */
    createGame() {
        this.cleanup();
        this.isHostFlag = true;
        const tryCreate = () => {
            const id = this.generateRoomId();
            this.roomId = id;
            this.peer = new Peer(id, { debug: 0 });
            this.setupPeerEvents(tryCreate);
        };
        tryCreate();
    }

    /** 加入已有房间 */
    joinGame(roomId) {
        this.cleanup();
        this.isHostFlag = false;
        this.roomId = roomId.toUpperCase();
        this.peer = new Peer(undefined, { debug: 0 });
        this.setupPeerEvents();
    }

    setupPeerEvents(retryCreateCallback = null) {
        this.peer.on('open', (id) => {
            if (!this.isHostFlag && this.roomId) {
                this.connectToHost(this.roomId);
            }
            if (this.callbacks.onConnected) {
                this.callbacks.onConnected(this.isHostFlag ? this.roomId : id);
            }
        });

        // 主机收到新连接
        this.peer.on('connection', (conn) => {
            this.setupConnection(conn, true); // isIncoming = true
        });

        this.peer.on('error', (err) => {
            console.error('PeerJS error:', err);
            if (this.isHostFlag && retryCreateCallback && err.type === 'unavailable-id') {
                console.warn('房间号被占用，重新生成...');
                this.peer.destroy();
                retryCreateCallback();
                return;
            }
            if (this.callbacks.onError) {
                this.callbacks.onError(err.message || '连接错误');
            }
        });

        this.peer.on('disconnected', () => {
            if (this.callbacks.onDisconnected) this.callbacks.onDisconnected();
        });
    }

    connectToHost(hostId) {
        const conn = this.peer.connect(hostId, { reliable: true });
        this.setupConnection(conn, false); // isIncoming = false
        this.hostId = hostId;
    }

    /**
     * 配置连接
     * @param {DataConnection} conn
     * @param {boolean} isIncoming - 主机接收时为true，客户端发起时为false
     */
    setupConnection(conn, isIncoming) {
        conn.on('open', () => {
            this.connections[conn.peer] = conn;
            // 只有主机接收新玩家时才触发 onPlayerJoined
            if (isIncoming && this.callbacks.onPlayerJoined) {
                this.callbacks.onPlayerJoined(conn.peer);
            }
        });

        conn.on('data', (data) => {
            if (this.callbacks.onDataReceived) {
                this.callbacks.onDataReceived(conn.peer, data);
            }
        });

        conn.on('close', () => {
            delete this.connections[conn.peer];
            if (this.callbacks.onPlayerLeft) {
                this.callbacks.onPlayerLeft(conn.peer);
            }
            if (!this.isHostFlag && conn.peer === this.hostId) {
                this.becomeHost();
            }
        });

        conn.on('error', () => {
            delete this.connections[conn.peer];
            if (this.callbacks.onPlayerLeft) {
                this.callbacks.onPlayerLeft(conn.peer);
            }
        });
    }

    becomeHost() {
        this.isHostFlag = true;
        this.hostId = null;
        if (this.callbacks.onHostAssigned) {
            this.callbacks.onHostAssigned();
        }
    }

    sendToPeer(peerId, data) {
        const conn = this.connections[peerId];
        if (conn && conn.open) conn.send(data);
    }

    /** 广播给所有已连接玩家 */
    broadcast(data) {
        Object.values(this.connections).forEach(conn => {
            if (conn.open) conn.send(data);
        });
    }

    /** 广播给除指定玩家外的所有连接（供主机转发使用） */
    broadcastExcept(excludePeerId, data) {
        Object.entries(this.connections).forEach(([peerId, conn]) => {
            if (peerId !== excludePeerId && conn.open) {
                conn.send(data);
            }
        });
    }

    isConnected() {
        return this.peer !== null && !this.peer.destroyed;
    }

    isHost() {
        return this.isHostFlag;
    }

    getRoomId() {
        return this.roomId;
    }

    cleanup() {
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.connections = {};
        this.hostId = null;
        this.isHostFlag = false;
        this.roomId = null;
    }
}