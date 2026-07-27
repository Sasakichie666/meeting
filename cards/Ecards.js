const cardDefinitions = [
    {
        id: 'card1',
        name: '打工赚钱',
        description: '获得8金币',
        cost: { stamina: 3 },
        costDescription: '花费3体力',
        effect: { type: 'gain', gain: { gold: 8 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'gold', amount: 2 } },
        discardDescription: '丢弃：获得2金币'
    },
    {
        id: 'card2',
        name: '温泉旅行',
        description: '获得4体力',
        cost: { gold: 6 },
        costDescription: '花费6金币',
        effect: { type: 'gain', gain: { stamina: 4 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'stamina', amount: 1 } },
        discardDescription: '丢弃：获得1体力'
    },
    {
        id: 'card3',
        name: '饱餐一顿',
        description: '获得4佳肴',
        cost: { gold: 6 },
        costDescription: '花费6金币',
        effect: { type: 'gain', gain: { food: 4 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'ingredient', amount: 2 } },
        discardDescription: '丢弃：获得2食材'
    },
    {
        id: 'card4',
        name: '温泉旅行',           // 原购买建材，现改为温泉旅行变体
        description: '获得6体力',
        cost: { gold: 8 },
        costDescription: '花费8金币',
        effect: { type: 'gain', gain: { stamina: 6 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'stamina', amount: 1 } },
        discardDescription: '丢弃：获得1体力'
    },
    {
        id: 'card5',
        name: '伐木',
        description: '获得8木头',
        cost: { stamina: 3 },
        costDescription: '花费3体力',
        effect: { type: 'gain', gain: { wood: 8 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'wood', amount: 2 } },
        discardDescription: '丢弃：获得2木头'
    },
    {
        id: 'card6',
        name: '采集',
        description: '获得4木头，1石头，2食材',
        cost: { stamina: 4 },
        costDescription: '花费4体力',
        effect: { type: 'gain', gain: { wood: 4, stone: 1, ingredient: 2 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'ingredient', amount: 1 } },
        discardDescription: '丢弃：获得1食材'
    },
    {
        id: 'card7',
        name: '采矿',
        description: '获得2矿物，1石头',
        cost: { stamina: 3 },
        costDescription: '花费3体力',
        effect: { type: 'gain', gain: { mineral: 2, stone: 1 } },
        discardEffect: { type: 'draw_cards', count: 1 },
        discardDescription: '丢弃：抽1张牌'
    },
    {
        id: 'card8',
        name: '采石',
        description: '获得4石头',
        cost: { stamina: 3 },
        costDescription: '花费3体力',
        effect: { type: 'gain', gain: { stone: 4 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'stone', amount: 1 } },
        discardDescription: '丢弃：获得1石头'
    },
    {
        id: 'card9',
        name: '捕鱼',
        description: '获得6食材',
        cost: { stamina: 3 },
        costDescription: '花费3体力',
        effect: { type: 'gain', gain: { ingredient: 6 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'ingredient', amount: 2 } },
        discardDescription: '丢弃：获得2食材'
    },
    {
        id: 'card10',
        name: '码头搬运',
        description: '获得8金币，2木头，1石头',
        cost: { stamina: 4 },
        costDescription: '花费4体力',
        effect: { type: 'gain', gain: { gold: 8, wood: 2, stone: 1 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'gold', amount: 2 } },
        discardDescription: '丢弃：获得2金币'
    },
    {
        id: 'card11',
        name: '烹饪',
        description: '获得4佳肴',
        cost: { stamina: 1, ingredient: 4 },
        costDescription: '花费1体力，4食材',
        effect: { type: 'gain', gain: { food: 4 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'ingredient', amount: 2 } },
        discardDescription: '丢弃：获得2食材'
    },
    {
        id: 'card12',
        name: '木材加工',
        description: '获得2建材',
        cost: { stamina: 1, wood: 4 },
        costDescription: '花费1体力，4木头',
        effect: { type: 'gain', gain: { building: 2 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'wood', amount: 2 } },
        discardDescription: '丢弃：获得2木头'
    },
    {
        id: 'card13',
        name: '石材加工',
        description: '获得3建材',
        cost: { stamina: 1, stone: 3 },
        costDescription: '花费1体力，3石头',
        effect: { type: 'gain', gain: { building: 3 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'stone', amount: 1 } },
        discardDescription: '丢弃：获得1石头'
    },
    {
        id: 'card14',
        name: '混合加工',
        description: '获得3建材',
        cost: { stamina: 1, wood: 2, stone: 2 },
        costDescription: '花费1体力，2木头，2石头',
        effect: { type: 'gain', gain: { building: 3 } },
        discardEffect: { type: 'draw_cards', count: 1 },
        discardDescription: '丢弃：抽1张牌'
    },
    {
        id: 'card15',
        name: '工具加工',
        description: '获得2工具',
        cost: { stamina: 1, mineral: 2 },
        costDescription: '花费1体力，2矿物',
        effect: { type: 'gain', gain: { tool: 2 } },
        discardEffect: { type: 'draw_cards', count: 1 },
        discardDescription: '丢弃：抽1张牌'
    },
    {
        id: 'card16',
        name: '机械时代',
        description: '获得3工具',
        cost: { mineral: 4 },
        costDescription: '花费4矿物',
        effect: { type: 'gain', gain: { tool: 3 } },
        discardEffect: { type: 'draw_cards', count: 1 },
        discardDescription: '丢弃：抽1张牌'
    },
    {
        id: 'card17',
        name: '工具研发',
        description: '获得3工具',
        cost: { knowledge: 2, mineral: 3 },
        costDescription: '花费2知识，3矿物',
        effect: { type: 'gain', gain: { tool: 3 } },
        discardEffect: { type: 'draw_cards', count: 1 },
        discardDescription: '丢弃：抽1张牌'
    },
    {
        id: 'card18',
        name: '贸易',
        description: '获得5食材，6木头，2石头',
        cost: { gold: 10 },
        costDescription: '花费10金币',
        effect: { type: 'gain', gain: { ingredient: 5, wood: 6, stone: 2 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'gold', amount: 2 } },
        discardDescription: '丢弃：获得2金币'
    },
    {
        id: 'card19',
        name: '矿物业务',
        description: '获得4木头，1石头，3矿物',
        cost: { gold: 10 },
        costDescription: '花费10金币',
        effect: { type: 'gain', gain: { wood: 4, stone: 1, mineral: 3 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'gold', amount: 2 } },
        discardDescription: '丢弃：获得2金币'
    },
    {
        id: 'card20',
        name: '丰收',
        description: '获得15食材',
        cost: { stamina: 5 },
        costDescription: '花费5体力',
        effect: { type: 'gain', gain: { ingredient: 15 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'ingredient', amount: 2 } },
        discardDescription: '丢弃：获得2食材'
    },
    {
        id: 'card21',
        name: '蓝图',
        description: '获得3建材',
        cost: { knowledge: 4 },
        costDescription: '花费4知识',
        effect: { type: 'gain', gain: { building: 3 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'knowledge', amount: 1 } },
        discardDescription: '丢弃：获得1知识'
    },
    {
        id: 'card22',
        name: '发明',
        description: '获得2工具',
        cost: { knowledge: 4 },
        costDescription: '花费4知识',
        effect: { type: 'gain', gain: { tool: 2 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'knowledge', amount: 1 } },
        discardDescription: '丢弃：获得1知识'
    },
    {
        id: 'card23',
        name: '知识之泉',
        description: '获得4知识',
        cost: { gold: 6 },
        costDescription: '花费6金币',
        effect: { type: 'gain', gain: { knowledge: 4 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'knowledge', amount: 1 } },
        discardDescription: '丢弃：获得1知识'
    },
    {
        id: 'card24',
        name: '宴会',
        description: '获得6佳肴',
        cost: { gold: 8 },
        costDescription: '花费8金币',
        effect: { type: 'gain', gain: { food: 6 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'ingredient', amount: 2 } },
        discardDescription: '丢弃：获得2食材'
    },
    {
        id: 'card25',
        name: '下午茶',
        description: '获得4体力',
        cost: { food: 3 },
        costDescription: '花费3佳肴',
        effect: { type: 'gain', gain: { stamina: 4 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'stamina', amount: 1 } },
        discardDescription: '丢弃：获得1体力'
    },
    {
        id: 'card26',
        name: '日光浴',
        description: '获得6体力',
        cost: { gold: 6, food: 1 },
        costDescription: '花费6金币，1佳肴',
        effect: { type: 'gain', gain: { stamina: 6 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'stamina', amount: 1 } },
        discardDescription: '丢弃：获得1体力'
    },
    {
        id: 'card27',
        name: '阅读',
        description: '获得4体力',
        cost: { knowledge: 3 },
        costDescription: '花费3知识',
        effect: { type: 'gain', gain: { stamina: 4 } },
        discardEffect: { type: 'gain_resource', params: { resource: 'stamina', amount: 1 } },
        discardDescription: '丢弃：获得1体力'
    }
];

window.cardDefinitions = cardDefinitions;