class Network {
    constructor(callbacks = {}) {
        this.peer = null;
        this.connections = {};
        this.hostId = null;
        this.isHostFlag = false;
        this.roomId = null;
        this.callbacks = callbacks;
    }

    generateRoomId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 4; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    createGame() {
        this.cleanup();
        this.isHostFlag = true;
        const tryCreate = () => {
            const id = this.generateRoomId();
            this.roomId = id;
            this.peer = new Peer('hanafuda-' + id, {
                debug: 0,
                secure: true,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        {
                            urls: 'turn:openrelay.metered.ca:80',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        },
                        {
                            urls: 'turn:openrelay.metered.ca:443',
                            username: 'openrelayproject',
                            credential: 'openrelayproject'
                        }
                    ],
                    iceCandidatePoolSize: 2
                }
            });
            this.setupPeerEvents(tryCreate);
        };
        tryCreate();
    }

    joinGame(roomId) {
        this.cleanup();
        this.isHostFlag = false;
        this.roomId = roomId.toUpperCase();
        this.peer = new Peer({
            debug: 0,
            secure: true,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    {
                        urls: 'turn:openrelay.metered.ca:80',
                        username: 'openrelayproject',
                        credential: 'openrelayproject'
                    },
                    {
                        urls: 'turn:openrelay.metered.ca:443',
                        username: 'openrelayproject',
                        credential: 'openrelayproject'
                    }
                ],
                iceCandidatePoolSize: 2
            }
        });
        this.setupPeerEvents();
    }

    setupPeerEvents(retryCreateCallback = null) {
        this.peer.on('open', (id) => {
            if (!this.isHostFlag && this.roomId) {
                this.connectToHost(this.roomId);
            }
            if (this.callbacks.onConnected) {
                // 主机返回房间码，客户端返回自己的 peerId
                this.callbacks.onConnected(this.isHostFlag ? this.roomId : id);
            }
        });

        this.peer.on('connection', (conn) => {
            this.setupConnection(conn, true);
        });

        this.peer.on('error', (err) => {
            console.error('PeerJS error:', err);
            if (this.isHostFlag && retryCreateCallback && err.type === 'unavailable-id') {
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
        const conn = this.peer.connect('hanafuda-' + hostId, { reliable: true });
        this.setupConnection(conn, false);
        this.hostId = 'hanafuda-' + hostId; // 保存对端 peerId
    }

    setupConnection(conn, isIncoming) {
        conn.on('open', () => {
            this.connections[conn.peer] = conn;
            // 主机收到新连接 → 触发玩家加入
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

    broadcast(data) {
        Object.values(this.connections).forEach(conn => {
            if (conn.open) conn.send(data);
        });
    }

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