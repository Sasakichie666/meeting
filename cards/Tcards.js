// cards/Tcards.js
const TASK_CARD_DEFINITIONS = [
    {
        id: 'task1',
        name: '佳肴订单',
        description: '提交3佳肴，获得8金币',
        cost: { food: 3 },
        costDescription: '提交3佳肴',
        reward: { gold: 8 },
        rewardDescription: '获得8金币'
    },
    {
        id: 'task2',
        name: '建材订单A',
        description: '提交2建材，获得12金币',
        cost: { building: 2 },
        costDescription: '提交2建材',
        reward: { gold: 12 },
        rewardDescription: '获得12金币'
    },
    {
        id: 'task3',
        name: '工具订单A',
        description: '提交2工具，获得18金币',
        cost: { tool: 2 },
        costDescription: '提交2工具',
        reward: { gold: 18 },
        rewardDescription: '获得18金币'
    },
    {
        id: 'task4',
        name: '知识订单',
        description: '提交3知识，获得8金币',
        cost: { knowledge: 3 },
        costDescription: '提交3知识',
        reward: { gold: 8 },
        rewardDescription: '获得8金币'
    },
    {
        id: 'task5',
        name: '混合订单A',
        description: '提交1建材，1工具，获得15金币',
        cost: { building: 1, tool: 1 },
        costDescription: '提交1建材，1工具',
        reward: { gold: 15 },
        rewardDescription: '获得15金币'
    },
    {
        id: 'task6',
        name: '佳肴建材订单',
        description: '提交2佳肴，1建材，获得12金币',
        cost: { food: 2, building: 1 },
        costDescription: '提交2佳肴，1建材',
        reward: { gold: 12 },
        rewardDescription: '获得12金币'
    },
    {
        id: 'task7',
        name: '建材订单B',
        description: '提交3建材，获得18金币',
        cost: { building: 3 },
        costDescription: '提交3建材',
        reward: { gold: 18 },
        rewardDescription: '获得18金币'
    },
    {
        id: 'task8',
        name: '建材知识订单',
        description: '提交2建材，2知识，获得18金币',
        cost: { building: 2, knowledge: 2 },
        costDescription: '提交2建材，2知识',
        reward: { gold: 18 },
        rewardDescription: '获得18金币'
    },
    {
        id: 'task9',
        name: '佳肴建材订单B',
        description: '提交2佳肴，2建材，获得18金币',
        cost: { food: 2, building: 2 },
        costDescription: '提交2佳肴，2建材',
        reward: { gold: 18 },
        rewardDescription: '获得18金币'
    },
    // ==================== 新增任务卡 ====================
    {
        id: 'task10',
        name: '佳肴知识订单',
        description: '提交2佳肴，2知识，获得12金币',
        cost: { food: 2, knowledge: 2 },
        costDescription: '提交2佳肴，2知识',
        reward: { gold: 12 },
        rewardDescription: '获得12金币'
    },
    {
        id: 'task11',
        name: '知识订单B',
        description: '提交4知识，获得12金币',
        cost: { knowledge: 4 },
        costDescription: '提交4知识',
        reward: { gold: 12 },
        rewardDescription: '获得12金币'
    },
    {
        id: 'task12',
        name: '佳肴订单B',
        description: '提交4佳肴，获得12金币',
        cost: { food: 4 },
        costDescription: '提交4佳肴',
        reward: { gold: 12 },
        rewardDescription: '获得12金币'
    },
    {
        id: 'task13',
        name: '建材工具订单',
        description: '提交2建材，1工具，获得21金币',
        cost: { building: 2, tool: 1 },
        costDescription: '提交2建材，1工具',
        reward: { gold: 21 },
        rewardDescription: '获得21金币'
    },
    {
        id: 'task14',
        name: '佳肴知识订单A',
        description: '提交2佳肴，3知识，获得15金币',
        cost: { food: 2, knowledge: 3 },
        costDescription: '提交2佳肴，3知识',
        reward: { gold: 15 },
        rewardDescription: '获得15金币'
    },
    {
        id: 'task15',
        name: '佳肴知识订单B',
        description: '提交3佳肴，2知识，获得15金币',
        cost: { food: 3, knowledge: 2 },
        costDescription: '提交3佳肴，2知识',
        reward: { gold: 15 },
        rewardDescription: '获得15金币'
    }
];

window.TASK_CARD_DEFINITIONS = TASK_CARD_DEFINITIONS;