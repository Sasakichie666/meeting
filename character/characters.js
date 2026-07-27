const CHARACTER_TEMPLATES = [
    {
        id: 'cecilia',
        name: '塞西莉亚',
        portrait: '🌾',
        title: '农业专家',
        description: '温柔善良的农场少女，擅长种植各种作物。',
        // 红色农民米宝 x4
        meeples: [
            { color: '#e8788a', label: '红色农民', amount: 4 }
        ],
        initialAffection: 0,
        tasks: [],
        skills: []
    },
    {
        id: 'olivia',
        name: '奥莉薇娅',
        portrait: '💼',
        title: '商业精英',
        description: '精明干练的商会千金，对贸易和市场了如指掌。',
        meeples: [
            { color: '#5b9bd5', label: '蓝色商人', amount: 4 }
        ],
        initialAffection: 0,
        tasks: [],
        skills: []
    },
    {
        id: 'vera',
        name: '薇拉',
        portrait: '⛏️',
        title: '矿业专家',
        description: '活泼好动的矿工少女，挖矿时比谁都认真。',
        meeples: [
            { color: '#e8a840', label: '黄色矿工', amount: 4 }
        ],
        initialAffection: 0,
        tasks: [],
        skills: []
    },
    {
        id: 'fiona',
        name: '菲欧娜',
        portrait: '🍳',
        title: '烹饪大师',
        description: '天真可爱的料理少女，做出的料理让人幸福。',
        meeples: [
            { color: '#4caf84', label: '绿色厨师', amount: 4 }
        ],
        initialAffection: 0,
        tasks: [],
        skills: []
    }
];

window.CHARACTER_TEMPLATES = CHARACTER_TEMPLATES;