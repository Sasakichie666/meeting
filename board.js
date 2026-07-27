class Board {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.options = options;

        // 地点坐标
        this.locations = {
            '市集':       { x: 200, y: 150 },
            '图书馆':     { x: 480, y: 180 },
            '冒险者公会': { x: 390, y: 260 },
            '工坊':       { x: 170, y: 280 },
            '中心广场':   { x: 390, y: 400 },
            '纪念碑':     { x: 530, y: 450 },
            '车站A':      { x: 390, y: 520 },
            '渔场':       { x: 60, y: 250 },
            '车站C':      { x: 630, y: 180 },
            '伐木场':     { x: 80,  y: 100 },
            '矿洞':       { x: 350, y: 40 },
            '森林':       { x: 220,  y: 40 },
            '车站B':      { x: 60, y: 380 },
            '餐馆':       { x: 270, y: 240 },
            '温泉':       { x: 550, y: 270 },
            '石像遗迹':   { x: 650, y: 90 },
            '地底遗迹':   { x: 250, y: 500 },
            '森林遗迹':   { x: 550, y: 40 },
            '港口':       { x: 100, y: 500 },
            '炼金屋':     { x: 650, y: 350 },
            '花园':       { x: 250, y: 400 },
            '沙滩':       { x: 680, y: 480 },
            '酒馆':       { x: 720, y: 270 },
            '商店街':     { x: 500, y: 350 },
            '车站D':      { x: 350, y: 150 },
            '采石场':     { x: 450, y: 90 }
        };

        // 地点连通关系（已确保双向）
        this.adjacency = {
            '冒险者公会': ['图书馆', '中心广场', '餐馆', '商店街', '车站D'],
            '中心广场':   ['冒险者公会', '纪念碑', '花园', '车站A'],
            '工坊':       ['车站B', '花园', '餐馆', '渔场'],
            '纪念碑':     ['中心广场', '车站A', '沙滩', '炼金屋', '商店街'],
            '车站A':      ['纪念碑', '中心广场', '地底遗迹'],
            '市集':       ['伐木场', '餐馆', '森林', '渔场', '车站D'],
            '图书馆':     ['冒险者公会', '森林遗迹', '车站C', '温泉', '采石场'],
            '渔场':       ['市集', '工坊', '车站B', '伐木场'],
            '车站C':      ['石像遗迹', '温泉', '酒馆', '图书馆'],
            '伐木场':     ['森林', '渔场', '市集'],
            '矿洞':       ['森林', '采石场', '车站D'],
            '森林':       ['伐木场', '矿洞', '市集', '车站D'],
            '车站B':      ['港口', '工坊', '花园', '渔场'],
            '餐馆':       ['冒险者公会', '市集', '工坊', '花园'],
            '温泉':       ['图书馆', '炼金屋', '车站C', '商店街'],
            '石像遗迹':   ['车站C', '森林遗迹'],
            '地底遗迹':   ['花园', '车站A'],
            '森林遗迹':   ['采石场', '石像遗迹', '图书馆'],
            '港口':       ['车站B', '花园'],
            '炼金屋':     ['温泉', '沙滩', '纪念碑', '酒馆'],
            '花园':       ['工坊', '中心广场', '港口', '餐馆', '车站B', '地底遗迹'],
            '沙滩':       ['纪念碑', '炼金屋'],
            '酒馆':       ['炼金屋', '车站C'],
            '商店街':     ['纪念碑', '冒险者公会', '温泉'],
            '车站D':      ['市集', '冒险者公会', '矿洞', '森林', '采石场'],
            '采石场':     ['矿洞', '车站D', '图书馆', '森林遗迹']
        };

        this.players = {};
        this.highlightedLocations = [];
        this.currentTurnIndex = null;
        this.localPlayerIndex = null;
        this.selectedLocation = null;
        this.pieceCoords = {};
        this.usedLocations = new Set();   // 本季节已使用工位的地点

        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.render();
    }

    addPlayer(index, color, startLocation = '冒险者公会') {
        this.players[index] = { color, position: startLocation };
        this.render();
    }
    removePlayer(index) { delete this.players[index]; this.render(); }
    updatePlayerColor(index, color) { if (this.players[index]) { this.players[index].color = color; this.render(); } }
    movePlayer(index, newLocation) { if (this.players[index]) { this.players[index].position = newLocation; this.render(); } }
    clearAllPlayers() { this.players = {}; this.pieceCoords = {}; this.render(); }
    setCurrentTurn(index) { this.currentTurnIndex = index; this.render(); }
    setLocalPlayerIndex(index) { this.localPlayerIndex = index; }
    clearHighlights() { this.highlightedLocations = []; this.selectedLocation = null; this.render(); }

    startMoveFrom(location) {
        this.clearHighlights();
        this.selectedLocation = location;
        this.highlightedLocations = this.adjacency[location] || [];
        this.render();
    }

    prepareStationTeleport(currentStation) {
        this.clearHighlights();
        this.selectedLocation = currentStation;
        this.highlightedLocations = Object.keys(this.locations).filter(
            loc => loc.startsWith('车站') && loc !== currentStation
        );
        this.render();
    }

    /** 设置本季已使用地点（供外部调用） */
    setUsedLocations(locationsArray) {
        this.usedLocations = new Set(locationsArray);
        this.render();
    }

    handleClick(e) {
        if (this.currentTurnIndex === null || this.localPlayerIndex === null) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        // 车站传送模式
        if (this.selectedLocation && this.selectedLocation.startsWith('车站') && this.highlightedLocations.length > 0) {
            const clickedLocation = this.getLocationAt(mouseX, mouseY);
            if (clickedLocation && this.highlightedLocations.includes(clickedLocation)) {
                if (this.options.onPlayerMoveRequest) {
                    this.options.onPlayerMoveRequest(this.currentTurnIndex, this.selectedLocation, clickedLocation);
                }
                return;
            }
            this.clearHighlights();
            return;
        }

        // 棋子点击
        const clickedPieceIndex = this.getPieceAt(mouseX, mouseY);
        if (clickedPieceIndex !== null) {
            if (clickedPieceIndex !== this.localPlayerIndex || this.currentTurnIndex !== this.localPlayerIndex) {
                this.clearHighlights();
                return;
            }
            const player = this.players[clickedPieceIndex];
            if (!player) return;
            if (this.options.onPlayerPieceClick) {
                this.options.onPlayerPieceClick(clickedPieceIndex, player.position);
            }
            return;
        }

        // 移动确认
        if (this.selectedLocation && this.highlightedLocations.length > 0) {
            const clickedLocation = this.getLocationAt(mouseX, mouseY);
            if (clickedLocation && this.highlightedLocations.includes(clickedLocation)) {
                if (this.options.onPlayerMoveRequest) {
                    this.options.onPlayerMoveRequest(this.currentTurnIndex, this.selectedLocation, clickedLocation);
                }
                return;
            }
        }

        // 点击非车站地点 → 工位窗口
        const clickedLocation = this.getLocationAt(mouseX, mouseY);
        if (clickedLocation && !clickedLocation.startsWith('车站')) {
            if (this.options.onLocationClick) {
                this.options.onLocationClick(clickedLocation);
                return;
            }
        }

        this.clearHighlights();
    }

    getPieceAt(x, y) {
        const radius = 12;
        for (const [index, coords] of Object.entries(this.pieceCoords)) {
            const dx = x - coords.x;
            const dy = y - coords.y;
            if (Math.sqrt(dx * dx + dy * dy) <= radius) return parseInt(index);
        }
        return null;
    }

    getLocationAt(x, y) {
        const radius = 30;
        for (const [name, pos] of Object.entries(this.locations)) {
            const dx = x - pos.x;
            const dy = y - pos.y;
            if (Math.sqrt(dx * dx + dy * dy) <= radius) return name;
        }
        return null;
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = '#fefaf6';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.strokeStyle = '#d9c5b2';
        ctx.lineWidth = 5;
        const drawnEdges = new Set();
        for (const [loc, neighbors] of Object.entries(this.adjacency)) {
            const fromPos = this.locations[loc];
            neighbors.forEach(neighbor => {
                const edgeKey = [loc, neighbor].sort().join('-');
                if (!drawnEdges.has(edgeKey)) {
                    drawnEdges.add(edgeKey);
                    const toPos = this.locations[neighbor];
                    ctx.beginPath();
                    ctx.moveTo(fromPos.x, fromPos.y);
                    ctx.lineTo(toPos.x, toPos.y);
                    ctx.stroke();
                }
            });
        }

        for (const [name, pos] of Object.entries(this.locations)) {
            const isHighlighted = this.highlightedLocations.includes(name);
            const isUsed = this.usedLocations.has(name);

            if (isHighlighted) { ctx.shadowColor = '#f0c78e'; ctx.shadowBlur = 22; }

            // 填充色
            if (isUsed) {
                ctx.fillStyle = '#e8e0d5';   // 浅灰底色
            } else {
                ctx.fillStyle = isHighlighted ? '#fef0e0' : '#fff8f3';
            }
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
            ctx.fill();

            // 边框色
            if (isUsed) {
                ctx.strokeStyle = '#a39480';   // 暗边框
            } else {
                ctx.strokeStyle = isHighlighted ? '#c97d60' : '#d4bca6';
            }
            ctx.lineWidth = isHighlighted ? 3 : 2.5;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
            ctx.stroke();

            ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

            // 文字
            ctx.fillStyle = '#4a3728';
            ctx.font = 'bold 12px "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(name, pos.x, pos.y - 6);

            // 图标
            const icons = {
                '冒险者公会':'⚔️','市集':'🧺','图书馆':'📖','工坊':'🔨',
                '中心广场':'⛲','纪念碑':'🏛️','车站A':'🚉','车站B':'🚉','车站C':'🚉','车站D':'🚉',
                '伐木场':'🪓','矿洞':'⛏️','森林':'🌲','渔场':'🎣',
                '餐馆':'🍽️','温泉':'♨️','石像遗迹':'🗿','地底遗迹':'🕳️',
                '森林遗迹':'🌳','港口':'⚓','炼金屋':'⚗️','花园':'🌸','沙滩':'🏖️',
                '采石场':'⛰️','酒馆':'🏨','商店街':'🏬'
            };
            ctx.font = '14px sans-serif';
            ctx.fillText(icons[name] || '📍', pos.x, pos.y + 14);
        }

        // 绘制棋子
        this.pieceCoords = {};
        const offsets = {};
        for (const [index, player] of Object.entries(this.players)) {
            const pos = this.locations[player.position];
            if (!pos) continue;
            const key = player.position;
            if (!offsets[key]) offsets[key] = [];
            offsets[key].push({ index: parseInt(index), color: player.color });
        }
        for (const [loc, pieces] of Object.entries(offsets)) {
            const pos = this.locations[loc];
            const count = pieces.length;
            pieces.forEach((piece, i) => {
                const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
                const offsetX = Math.cos(angle) * 18;
                const offsetY = Math.sin(angle) * 18 - 20;
                const pieceX = pos.x + offsetX;
                const pieceY = pos.y + offsetY;
                this.pieceCoords[piece.index] = { x: pieceX, y: pieceY };

                const isCurrent = this.currentTurnIndex !== null && piece.index === this.currentTurnIndex;
                if (isCurrent) { ctx.shadowColor = '#f5c542'; ctx.shadowBlur = 12; }
                ctx.fillStyle = piece.color;
                ctx.beginPath();
                ctx.arc(pieceX, pieceY, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(piece.index + 1, pieceX, pieceY);
            });
        }
    }
}