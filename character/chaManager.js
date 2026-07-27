// character/chaManager.js
class ChaManager {
    constructor(game) {
        this.game = game;
        this.playerCharacters = {};
    }

    // 为指定玩家初始化角色（初始1名）
    initPlayerCharacters(playerIndex) {
        if (this.playerCharacters[playerIndex] && this.playerCharacters[playerIndex].length > 0) return;
        const templates = window.CHARACTER_TEMPLATES || [];
        if (templates.length === 0) return;
        this.playerCharacters[playerIndex] = [this._createCharacterInstance(templates[0])];
        // 主机广播角色状态（新玩家加入时使用）
        if (this.game.network.isHost()) {
            this.game.syncManager.broadcastCharacterState();
        }
    }

    // 获取指定玩家的所有角色
    getPlayerCharacters(playerIndex) {
        return this.playerCharacters[playerIndex] || [];
    }

    // 获取单个角色
    getCharacter(playerIndex, characterIndex) {
        const chars = this.playerCharacters[playerIndex];
        return chars ? chars[characterIndex] : null;
    }

    // 已招募角色数量
    getRecruitedCount(playerIndex) {
        const chars = this.playerCharacters[playerIndex];
        return chars ? chars.length : 0;
    }

    // 可用米宝总数（所有角色米宝之和）
    getTotalAvailableMeeple(playerIndex) {
        const chars = this.playerCharacters[playerIndex] || [];
        let total = 0;
        chars.forEach(c => {
            c.meeples.forEach(m => { total += m.amount; });
        });
        return total;
    }

    // 消耗指定角色的一个米宝（默认第一个角色）
    consumeMeeple(playerIndex, characterIndex = 0) {
        const chars = this.playerCharacters[playerIndex];
        if (!chars || !chars[characterIndex]) return { success: false, message: '角色不存在' };
        const char = chars[characterIndex];
        for (let j = 0; j < char.meeples.length; j++) {
            if (char.meeples[j].amount > 0) {
                char.meeples[j].amount--;
                const color = char.meeples[j].color;
                // 广播角色状态（米宝变化）
                this.game.syncManager.broadcastCharacterState();
                return { success: true, characterIndex, meepleColor: color, message: `消耗了${char.name}的一个米宝` };
            }
        }
        return { success: false, message: '该角色没有可用的米宝' };
    }

    // 提升好感度（指定角色的好感度+1，满5后奖励成就分，不重置）
    promoteAffection(playerIndex, characterIndex) {
        const chars = this.playerCharacters[playerIndex];
        if (!chars || !chars[characterIndex]) return { success: false, message: '角色不存在', pointsGained: 0 };
        const char = chars[characterIndex];
        if (char.affection >= 5) return { success: false, message: '好感度已满', pointsGained: 0 };
        char.affection = (char.affection || 0) + 1;
        let pointsGained = 0;
        if (char.affection === 5) {
            pointsGained = 5; // 满好感度时奖励 5 成就分
        }
        // 广播角色状态
        this.game.syncManager.broadcastCharacterState();
        return { success: true, message: `提升了${char.name}的好感度`, pointsGained };
    }

    // 招募新角色（最多4名）
    recruitCharacter(playerIndex) {
        const chars = this.playerCharacters[playerIndex] || [];
        if (chars.length >= 4) return { success: false, message: '角色已满（最多4名）' };
        const templates = window.CHARACTER_TEMPLATES || [];
        const recruitedIds = chars.map(c => c.templateId);
        const nextTemplate = templates.find(t => !recruitedIds.includes(t.id));
        if (!nextTemplate) return { success: false, message: '没有可招募的角色了' };

        const newChar = this._createCharacterInstance(nextTemplate);
        if (!this.playerCharacters[playerIndex]) {
            this.playerCharacters[playerIndex] = [];
        }
        this.playerCharacters[playerIndex].push(newChar);

        // 广播角色状态
        if (this.game.network.isHost()) {
            this.game.syncManager.broadcastCharacterState();
        }
        return { success: true, message: `招募了${newChar.name}` };
    }

    // 重置指定玩家的所有角色米宝为初始数量（季节更替时调用）
    resetAllMeepleForPlayer(playerIndex) {
        const chars = this.playerCharacters[playerIndex];
        if (!chars || chars.length === 0) return;

        const templates = window.CHARACTER_TEMPLATES || [];
        chars.forEach(char => {
            const template = templates.find(t => t.id === char.templateId);
            if (!template) return;
            // 用模板中的米宝数组深拷贝覆盖当前米宝
            char.meeples = template.meeples.map(m => ({ ...m }));
            // 更新初始米宝计数（确保一致）
            char.initialMeepleCount = template.meeples.reduce((sum, m) => sum + m.amount, 0);
        });

        // 广播角色状态更新
        if (this.game.network.isHost()) {
            this.game.syncManager.broadcastCharacterState();
        }
    }

    // 重置所有玩家的所有角色米宝
    resetAllMeepleForAllPlayers() {
        const g = this.game;
        Object.keys(g.players).forEach(playerId => {
            const player = g.players[playerId];
            if (player) {
                this.resetAllMeepleForPlayer(player.index);
            }
        });
    }

    // 内部：从模板创建角色实例
    _createCharacterInstance(template) {
        const initialMeepleCount = template.meeples.reduce((sum, m) => sum + m.amount, 0);
        return {
            templateId: template.id,
            name: template.name,
            portrait: template.portrait,
            title: template.title,
            description: template.description,
            affection: template.initialAffection || 0,
            meeples: template.meeples.map(m => ({ ...m })), // 深拷贝米宝数组
            initialMeepleCount,                              // 存储初始米宝总数
            tasks: [],
            skills: []
        };
    }
}