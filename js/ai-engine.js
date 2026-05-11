/**
 * AI 引擎 —— 智能回复生成
 * 支持 本地关键词匹配、随机回复、GPT API 三种模式
 */
import { APP_CONFIG } from './config.js';

export class AIEngine {
    constructor(dataLoader) {
        this.dataLoader = dataLoader;
    }

    /**
     * 获取 AI 回复
     * @param {string} sceneId - 场景 ID
     * @param {string} userMessage - 用户消息
     * @param {Array} chatHistory - 近期聊天历史
     * @returns {Promise<string>} AI 回复文本
     */
    async getReply(sceneId, userMessage, chatHistory = []) {
        const sceneData = this.dataLoader.getSceneData(sceneId);

        // 模式1：GPT API（通过后端代理，密钥不暴露到前端）
        if (APP_CONFIG.gpt.enabled) {
            try {
                return await this._callGPT(sceneData, userMessage, chatHistory);
            } catch (err) {
                console.warn('GPT API 调用失败，回退到本地模式:', err.message);
            }
        }

        // 模式2：本地关键词匹配 + 随机
        return this._localReply(sceneData, userMessage);
    }

    /**
     * 本地回复生成
     * 优先关键词匹配对话对，其次随机从回复池选取
     */
    _localReply(sceneData, userMessage) {
        const { conversations = [], replies = [] } = sceneData;

        let reply = null;

        // 尝试关键词匹配
        if (conversations.length > 0) {
            reply = this._matchConversation(userMessage, conversations);
        }

        // 回退到随机选取
        if (!reply && replies.length > 0) {
            reply = replies[Math.floor(Math.random() * replies.length)];
        }

        return reply || '嗯嗯，我在听~';
    }

    /**
     * 关键词匹配对话对
     */
    _matchConversation(userMessage, conversations) {
        const msg = userMessage.toLowerCase().trim();

        // 按匹配度排序
        const scored = conversations.map(conv => ({
            ...conv,
            score: this._calculateSimilarity(msg, conv.user.toLowerCase().trim()),
        }));

        // 筛选有匹配的
        const matched = scored.filter(c => c.score > 0);
        if (matched.length === 0) return null;

        // 按匹配度降序，从前 60% 中随机选一条（增加变化性）
        matched.sort((a, b) => b.score - a.score);
        const poolSize = Math.max(1, Math.ceil(matched.length * 0.6));
        const pool = matched.slice(0, poolSize);

        return pool[Math.floor(Math.random() * pool.length)].ai;
    }

    /**
     * 简单相似度计算
     * 判断用户消息是否包含对话对中的关键词
     */
    _calculateSimilarity(userMsg, pattern) {
        const userWords = new Set(userMsg.split(/\s+/).filter(w => w.length > 0));
        const patternWords = pattern.split(/\s+/).filter(w => w.length > 0);

        let score = 0;
        for (const pw of patternWords) {
            if (userWords.has(pw)) score += 2;
            else if (userMsg.includes(pw)) score += 1;
        }

        // 完全匹配加分
        if (userMsg === pattern) score += 5;

        return score;
    }

    /**
     * 调用 GPT API
     */
    async _callGPT(sceneData, userMessage, chatHistory) {
        const { gpt } = APP_CONFIG;

        const messages = [
            {
                role: 'system',
                content: `${gpt.systemPrompt}\n\nAI 角色名称: ${sceneData.aiName}\n场景: ${sceneData.name}\n风格参考: ${sceneData.replies?.slice(0, 5).join(' | ') || '温暖、治愈'}`,
            },
        ];

        // 添加对话历史上下文（取最近 6 对）
        const recent = chatHistory.filter(m => m.sender !== 'system').slice(-12);
        for (const m of recent) {
            messages.push({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text,
            });
        }

        // 添加示例对话（few-shot）
        const examples = sceneData.conversations?.slice(0, 3) || [];
        if (examples.length > 0 && recent.length === 0) {
            for (const ex of examples) {
                messages.push({ role: 'user', content: ex.user });
                messages.push({ role: 'assistant', content: ex.ai });
            }
        }

        // 当前消息
        messages.push({ role: 'user', content: userMessage });

        const response = await fetch(gpt.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages,
                maxTokens: gpt.maxTokens,
                temperature: gpt.temperature,
            }),
        });

        if (!response.ok) {
            throw new Error(`GPT API 返回错误: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const reply = data.reply;

        if (!reply) {
            throw new Error('GPT API 未返回有效回复');
        }

        return reply;
    }

    /**
     * 生成随机延迟（毫秒）
     */
    getRandomDelay() {
        const { min, max } = APP_CONFIG.replyDelay;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
