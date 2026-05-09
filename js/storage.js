/**
 * localStorage 存储封装
 * 负责聊天记录、设置、场景状态的持久化
 */
import { APP_CONFIG } from './config.js';

const PREFIX = APP_CONFIG.storagePrefix;

export const Storage = {
    getKey(name) {
        return PREFIX + name;
    },

    /** 保存聊天记录 */
    saveHistory(sceneId, messages) {
        try {
            const key = this.getKey(`history_${sceneId}`);
            // 限制保存数量
            const trimmed = messages.slice(-APP_CONFIG.maxHistory);
            localStorage.setItem(key, JSON.stringify(trimmed));
        } catch (e) {
            console.warn('保存聊天记录失败:', e.message);
        }
    },

    /** 加载聊天记录 */
    loadHistory(sceneId) {
        try {
            const key = this.getKey(`history_${sceneId}`);
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('加载聊天记录失败:', e.message);
            return [];
        }
    },

    /** 保存当前场景 */
    saveCurrentScene(sceneId) {
        try {
            localStorage.setItem(this.getKey('currentScene'), sceneId);
        } catch (e) {
            console.warn('保存场景失败:', e.message);
        }
    },

    /** 加载当前场景 */
    loadCurrentScene() {
        try {
            return localStorage.getItem(this.getKey('currentScene')) || 'daily';
        } catch (e) {
            return 'daily';
        }
    },

    /** 保存设置 */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.getKey('settings'), JSON.stringify(settings));
        } catch (e) {
            console.warn('保存设置失败:', e.message);
        }
    },

    /** 加载设置 */
    loadSettings() {
        try {
            const data = localStorage.getItem(this.getKey('settings'));
            if (!data) return null;

            const parsed = JSON.parse(data);
            // 验证基本结构
            if (typeof parsed === 'object' && parsed !== null) {
                return parsed;
            }
            return null;
        } catch (e) {
            console.warn('加载设置失败:', e.message);
            return null;
        }
    },

    /** 清除所有数据 */
    clearAll() {
        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
            keys.forEach(k => localStorage.removeItem(k));
        } catch (e) {
            console.warn('清除数据失败:', e.message);
        }
    },

    /** 清除指定场景的聊天记录 */
    clearHistory(sceneId) {
        try {
            localStorage.removeItem(this.getKey(`history_${sceneId}`));
        } catch (e) {
            console.warn('清除历史记录失败:', e.message);
        }
    },
};
