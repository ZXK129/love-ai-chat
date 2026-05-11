/**
 * 主应用入口 —— 恋爱AI聊天模拟器
 * 负责初始化、密码验证、消息流程、设置管理
 */
import { APP_CONFIG, SCENE_LIST } from './config.js';
import { Storage } from './storage.js';
import { DataLoader } from './data-loader.js';
import { AIEngine } from './ai-engine.js';
import { ChatUI } from './chat-ui.js';
import { SceneManager } from './scene-manager.js';

class App {
    constructor() {
        this.chatUI = new ChatUI();
        this.sceneManager = new SceneManager(this.chatUI);
        this.dataLoader = new DataLoader();
        this.aiEngine = new AIEngine(this.dataLoader);

        this.chatHistory = {};
        this.isProcessing = false;
        this.autoSaveTimer = null;
    }

    /**
     * 启动应用
     */
    async init() {
        this._setupPassword();
        this._setupSettings();
        this._setupToast();
    }

    /* ==================== 密码验证 ==================== */
    _setupPassword() {
        const screen = document.getElementById('passwordScreen');
        const input = document.getElementById('passwordInput');
        const submitBtn = document.getElementById('passwordSubmit');
        const errorEl = document.getElementById('passwordError');

        const tryPassword = () => {
            const entered = input.value.trim();
            if (entered === APP_CONFIG.password) {
                screen.classList.add('hidden');
                setTimeout(() => this._startApp(), 500);
            } else {
                errorEl.style.display = 'block';
                input.value = '';
                input.focus();
                // 重新触发 shake 动画
                errorEl.style.animation = 'none';
                errorEl.offsetHeight;
                errorEl.style.animation = 'shake 0.5s ease';
            }
        };

        submitBtn.addEventListener('click', tryPassword);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') tryPassword();
            else errorEl.style.display = 'none';
        });

        input.focus();
    }

    /**
     * 密码验证通过，启动主应用
     */
    async _startApp() {
        // 显示应用容器
        document.getElementById('appContainer').style.display = 'flex';

        // 从持久化存储恢复设置
        this._restoreSettings();

        // 加载聊天数据
        await this.dataLoader.loadAllScenes();
        const sceneList = this.dataLoader.getSceneList();

        if (sceneList.length === 0) {
            console.warn('没有可用的场景数据');
            this.chatUI.addSystemMessage('⚠️ 场景数据加载失败，使用内置默认数据');
            return;
        }

        // 初始化场景管理器
        this.sceneManager.setDataLoader(this.dataLoader);
        this.sceneManager.initSceneButtons(sceneList);
        this.sceneManager.onSceneChange((sceneId, sceneData) => {
            this._onSceneChanged(sceneId, sceneData);
        });

        // 绑定发送事件
        this.chatUI.onSend((text) => this._handleUserMessage(text));

        // 恢复上次的场景
        const savedSceneId = Storage.loadCurrentScene();
        const validScene = this.dataLoader.getSceneData(savedSceneId) ? savedSceneId : sceneList[0].id;

        // 切换到初始场景
        await this.sceneManager.switchScene(validScene);

        // 启动自动保存
        this._startAutoSave();

        // 聚焦输入框
        this.chatUI.enableInput();
    }

    /**
     * 场景切换处理
     */
    _onSceneChanged(sceneId, sceneData) {
        // 保存当前场景
        Storage.saveCurrentScene(sceneId);

        // 清空聊天显示
        this.chatUI.clearChat();

        // 显示场景切换提示
        this.chatUI.addSystemMessage(`✨ 已切换到「${sceneData.emoji} ${sceneData.name}」场景`);

        // 显示开场白（延迟，更有真实感）
        setTimeout(() => {
            this.chatUI.addMessage(sceneData.greeting, 'bot');
        }, 400);

        // 恢复该场景的聊天历史
        const history = Storage.loadHistory(sceneId);
        this.chatHistory[sceneId] = history;

        // 渲染历史消息（开场白之后添加）
        setTimeout(() => {
            if (history.length > 0) {
                for (const msg of history) {
                    this.chatUI.addMessage(msg.text, msg.sender, false);
                }
            }
        }, 100);
    }

    /**
     * 处理用户发送消息
     */
    async _handleUserMessage(text) {
        if (this.isProcessing) {
            this._showToast('请等待 AI 回复后再发送~');
            return;
        }

        const sceneId = this.sceneManager.getCurrentSceneId();
        if (!sceneId) return;

        // 显示用户消息
        this.chatUI.addMessage(text, 'user');

        // 保存到历史
        const history = this.chatHistory[sceneId] || [];
        history.push({ sender: 'user', text, time: Date.now() });
        this.chatHistory[sceneId] = history;

        // 进入处理状态
        this.isProcessing = true;
        this.chatUI.disableInput();

        // 显示打字指示器
        const delay = this.aiEngine.getRandomDelay();
        setTimeout(() => this.chatUI.showTyping(), 300);

        try {
            // 获取 AI 回复
            const aiReply = await this.aiEngine.getReply(
                sceneId,
                text,
                history.filter(m => m.sender !== 'system').slice(-20)
            );

            // 等待延迟后显示
            const remainingDelay = Math.max(300, delay - 300);
            await new Promise(resolve => setTimeout(resolve, remainingDelay));

            // 隐藏打字指示器
            this.chatUI.hideTyping();

            // 显示 AI 回复
            this.chatUI.addMessage(aiReply, 'bot');

            // 保存 AI 回复到历史
            history.push({ sender: 'bot', text: aiReply, time: Date.now() });
            this.chatHistory[sceneId] = history;

        } catch (err) {
            console.error('获取 AI 回复失败:', err);
            this.chatUI.hideTyping();
            this.chatUI.addSystemMessage('💔 回复生成失败，请稍后再试');
        } finally {
            this.isProcessing = false;
            this.chatUI.enableInput();
        }
    }

    /* ==================== 设置管理 ==================== */
    _setupSettings() {
        const modal = document.getElementById('settingsModal');
        const settingsBtn = document.getElementById('settingsBtn');
        const closeBtn = document.getElementById('closeSettings');

        // 打开/关闭设置
        settingsBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
            this._loadSettingsToForm();
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            this._saveSettingsFromForm();
        });

        // 点击遮罩关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                this._saveSettingsFromForm();
            }
        });

        // GPT 开关
        const gptToggle = document.getElementById('gptToggle');
        const gptSettings = document.getElementById('gptSettings');
        gptToggle.addEventListener('change', () => {
            gptSettings.style.display = gptToggle.checked ? 'block' : 'none';
        });

        // 延迟滑块
        ['delayMin', 'delayMax'].forEach(id => {
            const slider = document.getElementById(id);
            const valEl = document.getElementById(id + 'Val');
            slider.addEventListener('input', () => {
                valEl.textContent = slider.value;
            });
        });

        // 清空聊天记录
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            if (confirm('确定要清除所有聊天记录吗？此操作不可撤销。')) {
                Storage.clearAll();
                this.chatUI.clearChat();
                this.chatHistory = {};
                this._showToast('🗑️ 聊天记录已清除');
            }
        });

        // 恢复默认设置
        document.getElementById('resetSettingsBtn').addEventListener('click', () => {
            if (confirm('确定要恢复默认设置吗？')) {
                Storage.clearAll();
                this._resetSettings();
                this._loadSettingsToForm();
                this._showToast('🔄 设置已恢复默认');
            }
        });
    }

    /**
     * 从表单加载设置到全局配置
     */
    _loadSettingsToForm() {
        document.getElementById('gptToggle').checked = APP_CONFIG.gpt.enabled;
        document.getElementById('gptSettings').style.display =
            APP_CONFIG.gpt.enabled ? 'block' : 'none';

        document.getElementById('gptApiKey').value = APP_CONFIG.gpt.apiKey || '';
        document.getElementById('gptApiUrl').value = APP_CONFIG.gpt.apiUrl;
        document.getElementById('gptModel').value = APP_CONFIG.gpt.model;

        document.getElementById('delayMin').value = APP_CONFIG.replyDelay.min;
        document.getElementById('delayMinVal').textContent = APP_CONFIG.replyDelay.min;
        document.getElementById('delayMax').value = APP_CONFIG.replyDelay.max;
        document.getElementById('delayMaxVal').textContent = APP_CONFIG.replyDelay.max;
    }

    /**
     * 从表单保存设置
     */
    _saveSettingsFromForm() {
        APP_CONFIG.gpt.enabled = document.getElementById('gptToggle').checked;
        APP_CONFIG.gpt.apiKey = document.getElementById('gptApiKey').value.trim();
        APP_CONFIG.gpt.apiUrl = document.getElementById('gptApiUrl').value.trim();
        APP_CONFIG.gpt.model = document.getElementById('gptModel').value.trim();

        APP_CONFIG.replyDelay.min = parseInt(document.getElementById('delayMin').value);
        APP_CONFIG.replyDelay.max = parseInt(document.getElementById('delayMax').value);

        // 持久化设置
        Storage.saveSettings({
            gpt: {
                enabled: APP_CONFIG.gpt.enabled,
                apiKey: APP_CONFIG.gpt.apiKey,
                apiUrl: APP_CONFIG.gpt.apiUrl,
                model: APP_CONFIG.gpt.model,
            },
            replyDelay: APP_CONFIG.replyDelay,
        });
    }

    /**
     * 从 localStorage 恢复设置
     */
    _restoreSettings() {
        const saved = Storage.loadSettings();
        if (!saved) return;

        if (saved.gpt) {
            if (typeof saved.gpt.enabled === 'boolean')
                APP_CONFIG.gpt.enabled = saved.gpt.enabled;
            if (saved.gpt.apiKey)
                APP_CONFIG.gpt.apiKey = saved.gpt.apiKey;
            if (saved.gpt.apiUrl)
                APP_CONFIG.gpt.apiUrl = saved.gpt.apiUrl;
            if (saved.gpt.model)
                APP_CONFIG.gpt.model = saved.gpt.model;
        }

        if (saved.replyDelay) {
            APP_CONFIG.replyDelay = { ...APP_CONFIG.replyDelay, ...saved.replyDelay };
        }
    }

    /**
     * 重置所有设置
     */
    _resetSettings() {
        APP_CONFIG.gpt.enabled = false;
        APP_CONFIG.gpt.apiKey = '';
        APP_CONFIG.gpt.apiUrl = '/api/chat';
        APP_CONFIG.gpt.model = 'gpt-3.5-turbo';
        APP_CONFIG.replyDelay = { min: 800, max: 2500 };
    }

    /* ==================== 自动保存 ==================== */
    _startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            const sceneId = this.sceneManager.getCurrentSceneId();
            if (sceneId && this.chatHistory[sceneId]) {
                Storage.saveHistory(sceneId, this.chatHistory[sceneId]);
            }
        }, APP_CONFIG.autoSaveInterval);
    }

    /* ==================== Toast 提示 ==================== */
    _setupToast() {
        this._toastEl = document.getElementById('toast');
        this._toastTimer = null;
    }

    _showToast(message, duration = 2200) {
        if (!this._toastEl) return;

        this._toastEl.textContent = message;
        this._toastEl.style.display = 'block';
        this._toastEl.style.animation = 'none';
        this._toastEl.offsetHeight;
        this._toastEl.style.animation = 'toastIn 0.35s ease, toastOut 0.35s ease 2s forwards';

        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            this._toastEl.style.display = 'none';
        }, duration);
    }
}

// 启动应用
const app = new App();
app.init();
