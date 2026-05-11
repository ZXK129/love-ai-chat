/**
 * 应用配置文件
 * 可在此修改密码、数据路径、GPT API 等配置
 * 注意：API Key 存放在 .env 文件中，由后端 server.js 读取，不会暴露到前端
 */
export const APP_CONFIG = {
    password: 'x12006114',

    appName: '恋爱AI聊天模拟器',
    version: '1.0.0',

    dataBasePath: 'data/',

    storagePrefix: 'love_ai_chat_',

    gpt: {
        enabled: true,
        apiKey: '',
        apiUrl: '/api/chat',
        maxTokens: 300,
        temperature: 0.8,
    },

    replyDelay: {
        min: 800,
        max: 2500,
    },

    maxHistory: 500,

    autoSaveInterval: 5000,
};

export const SCENE_LIST = [
    { id: 'daily',     file: 'daily.json' },
    { id: 'comfort',   file: 'comfort.json' },
    { id: 'morning',   file: 'morning.json' },
    { id: 'goodnight', file: 'goodnight.json' },
    { id: 'miss-you',  file: 'miss-you.json' },
];

export const DEFAULT_SCENE_DATA = {
    id: 'default',
    name: '日常',
    emoji: '💬',
    aiName: '可利欧',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    theme: {
        bgColor: '#ffffff',
        bgGradient: null,
        accentColor: '#ffcfd2',
        borderColor: '#7d6e61',
        textColor: '#5a4a42',
    },
    greeting: '嘿，今天过得开心吗？我在想你。',
    replies: ['只要你在身边，空气都是甜的。', '过来，想抱抱你。', '你笑起来最好看了。'],
    conversations: [],
};
