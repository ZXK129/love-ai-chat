/**
 * 应用配置文件
 * 可在此修改密码、数据路径、GPT API 等配置
 */
export const APP_CONFIG = {
    // 前端密码（注意：仅为基础保护，密码明文存在于前端代码中）
    password: 'xl2006114',

    // 应用信息
    appName: '恋爱AI聊天模拟器',
    version: '1.0.0',

    // 数据文件路径
    dataBasePath: 'data/',

    // 本地存储 key 前缀
    storagePrefix: 'love_ai_chat_',

    // GPT API 配置
    gpt: {
        enabled: false,
        apiKey: '',
        apiUrl: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        systemPrompt: '你是一个温柔、体贴的恋爱对象。请根据提供的参考对话历史模仿其语气和风格进行回复。回复要温暖、治愈、简短，富有情感，适合恋爱聊天体验。不要使用过于正式的语体，就像普通恋人发消息一样自然。',
        maxTokens: 300,
        temperature: 0.8,
    },

    // AI 回复延迟范围 (毫秒)
    replyDelay: {
        min: 800,
        max: 2500,
    },

    // 聊天记录最大保存条数
    maxHistory: 500,

    // 自动保存间隔 (毫秒)
    autoSaveInterval: 5000,
};

/**
 * 场景配置列表
 * 每个场景对应 data/ 目录下的 JSON 数据文件
 * 添加新场景：在此数组新增对象，并在 data/ 目录添加对应 JSON 文件
 */
export const SCENE_LIST = [
    { id: 'daily',     file: 'daily.json' },
    { id: 'comfort',   file: 'comfort.json' },
    { id: 'morning',   file: 'morning.json' },
    { id: 'goodnight', file: 'goodnight.json' },
    { id: 'miss-you',  file: 'miss-you.json' },
];

/**
 * 默认场景数据（当 JSON 加载失败时使用）
 */
export const DEFAULT_SCENE_DATA = {
    id: 'default',
    name: '日常',
    emoji: '💬',
    aiName: '小暖',
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
