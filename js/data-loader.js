/**
 * 数据加载器
 * 负责加载 data/ 目录下的 JSON 聊天数据文件
 * 支持加载失败时回退到内置默认数据
 */
import { APP_CONFIG, SCENE_LIST, DEFAULT_SCENE_DATA } from './config.js';

export class DataLoader {
    constructor() {
        this.cache = new Map();
        this.sceneRegistry = new Map();
    }

    /**
     * 加载所有场景的聊天数据
     * @returns {Promise<Map<string, Object>>} sceneId -> sceneData 的映射
     */
    async loadAllScenes() {
        const promises = SCENE_LIST.map(scene => this.loadSceneData(scene));
        await Promise.allSettled(promises);
        return this.sceneRegistry;
    }

    /**
     * 加载单个场景数据
     */
    async loadSceneData(scene) {
        const url = `${APP_CONFIG.dataBasePath}${scene.file}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            // 验证并规范化数据
            const normalized = this._normalizeSceneData(data, scene.id);
            this.sceneRegistry.set(scene.id, normalized);
            this.cache.set(scene.id, normalized);

        } catch (err) {
            console.warn(`加载场景 "${scene.id}" 数据失败 (${url}):`, err.message);
            // 使用默认场景数据
            const fallback = this._createFallback(scene.id);
            this.sceneRegistry.set(scene.id, fallback);
            this.cache.set(scene.id, fallback);
        }
    }

    /**
     * 获取场景数据
     */
    getSceneData(sceneId) {
        return this.cache.get(sceneId) || this._createFallback(sceneId);
    }

    /**
     * 获取所有场景列表（用于 UI 渲染）
     */
    getSceneList() {
        const list = [];
        for (const [id, data] of this.sceneRegistry) {
            list.push({
                id,
                name: data.name,
                emoji: data.emoji,
                theme: data.theme,
                avatar: data.avatar,
            });
        }
        return list;
    }

    /**
     * 规范化场景数据，补充缺失字段
     */
    _normalizeSceneData(data, fallbackId) {
        return {
            id: data.id || fallbackId,
            name: data.name || '未命名',
            emoji: data.emoji || '💬',
            aiName: data.aiName || '小暖',
            avatar: data.avatar || DEFAULT_SCENE_DATA.avatar,
            theme: {
                bgColor: data.theme?.bgColor || DEFAULT_SCENE_DATA.theme.bgColor,
                bgGradient: data.theme?.bgGradient || null,
                accentColor: data.theme?.accentColor || DEFAULT_SCENE_DATA.theme.accentColor,
                borderColor: data.theme?.borderColor || DEFAULT_SCENE_DATA.theme.borderColor,
                textColor: data.theme?.textColor || DEFAULT_SCENE_DATA.theme.textColor,
            },
            greeting: data.greeting || '你好呀，我在呢。',
            replies: Array.isArray(data.replies) && data.replies.length > 0
                ? data.replies
                : DEFAULT_SCENE_DATA.replies,
            conversations: Array.isArray(data.conversations)
                ? data.conversations
                : [],
        };
    }

    /**
     * 创建回退场景数据
     */
    _createFallback(id) {
        return {
            ...DEFAULT_SCENE_DATA,
            id,
        };
    }
}
