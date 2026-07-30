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
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 4; i++) {
            result += letters.charAt(Math.floor(Math.random() * letters.length));
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
                    iceServers: this._getIceServers(),
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
                iceServers: this._getIceServers(),
                iceCandidatePoolSize: 2
            }
        });
        this.setupPeerEvents();
    }

    /**
     * 返回增强的 ICE 服务器列表（更多免费 TURN）
     */
    _getIceServers() {
        return [
            // STUN 服务器（帮助发现公网 IP）
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },

            // Metered TURN (UDP + TCP)
            {
                urls: [
                    'turn:openrelay.metered.ca:80?transport=udp',
                    'turn:openrelay.metered.ca:80?transport=tcp'
                ],
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: [
                    'turn:openrelay.metered.ca:443?transport=udp',
                    'turn:openrelay.metered.ca:443?transport=tcp'
                ],
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            // Metered 的备用域名
            {
                urls: [
                    'turn:openrelay.metered.ca:443',
                    'turns:openrelay.metered.ca:443?transport=tcp'
                ],
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },

            // Numb TURN
            {
                urls: 'turn:numb.viagenie.ca',
                username: 'webrtc@live.com',
                credential: 'muazkh'
            },

            // 额外免费 TURN (freeturn.net)
            {
                urls: 'turn:freeturn.net:3478',
                username: 'free',
                credential: 'free'
            },
            {
                urls: 'turns:freeturn.net:5349',
                username: 'free',
                credential: 'free'
            },

            // 公共 TURN (openrelay 的另一个实例)
            {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },

            // Twilio 公共 TURN (无需账号，仅供测试)
            {
                urls: 'turn:global.turn.twilio.com:3478?transport=udp',
                username: 'f4b7c1e5c8b3a2d6e0f9a8b7c6d5e4f3',
                credential: 'kI7wG5vP3sX9tR2eL0mN6bQ8vC4xZ1aA='
            },
            {
                urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
                username: 'f4b7c1e5c8b3a2d6e0f9a8b7c6d5e4f3',
                credential: 'kI7wG5vP3sX9tR2eL0mN6bQ8vC4xZ1aA='
            },
            {
                urls: 'turns:global.turn.twilio.com:443?transport=tcp',
                username: 'f4b7c1e5c8b3a2d6e0f9a8b7c6d5e4f3',
                credential: 'kI7wG5vP3sX9tR2eL0mN6bQ8vC4xZ1aA='
            }
        ];
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
        this.hostId = 'hanafuda-' + hostId;
    }

    setupConnection(conn, isIncoming) {
        conn.on('open', () => {
            this.connections[conn.peer] = conn;
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