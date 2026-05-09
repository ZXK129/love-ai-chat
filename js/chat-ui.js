/**
 * 聊天 UI 管理器
 * 负责消息渲染、显示控制、打字指示器、输入处理
 */
export class ChatUI {
    constructor() {
        this.chatBox = document.getElementById('chatBox');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.charImg = document.getElementById('charImg');
        this.avatarName = document.getElementById('avatarName');
        this.sceneTitle = document.getElementById('appTitle');

        this.onSendCallback = null;
        this._isInputDisabled = false;

        this._initEvents();
    }

    /**
     * 绑定输入事件
     */
    _initEvents() {
        // 发送按钮点击
        this.sendBtn.addEventListener('click', () => this._handleSend());

        // 回车发送（Shift+Enter 换行）
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this._handleSend();
            }
        });

        // 输入框自动调整高度
        this.userInput.addEventListener('input', () => {
            this.userInput.style.height = 'auto';
            this.userInput.style.height = Math.min(this.userInput.scrollHeight, 100) + 'px';
        });
    }

    /**
     * 处理发送
     */
    _handleSend() {
        const text = this.userInput.value.trim();
        if (!text || this._isInputDisabled) return;

        if (this.onSendCallback) {
            this.onSendCallback(text);
        }

        this.userInput.value = '';
        this.userInput.style.height = 'auto';
    }

    /**
     * 注册发送回调
     * @param {function} callback - (text: string) => Promise<void> | void
     */
    onSend(callback) {
        this.onSendCallback = callback;
    }

    /**
     * 添加消息到聊天区
     * @param {string} text - 消息文本
     * @param {'user'|'bot'|'system'} sender - 发送者
     * @param {boolean} animate - 是否动画
     */
    addMessage(text, sender = 'bot', animate = true) {
        const div = document.createElement('div');
        div.className = `msg msg-${sender}`;
        div.textContent = text;

        // 添加时间戳
        const time = document.createElement('span');
        time.className = 'msg-time';
        time.textContent = this._formatTime(new Date());
        div.appendChild(time);

        if (!animate) {
            div.style.animation = 'none';
        }

        this.chatBox.appendChild(div);
        this._scrollToBottom();
    }

    /**
     * 批量渲染历史消息
     */
    renderHistory(messages) {
        this.chatBox.innerHTML = '';
        for (const msg of messages) {
            this.addMessage(msg.text, msg.sender, false);
        }
    }

    /**
     * 清空聊天区
     */
    clearChat() {
        this.chatBox.innerHTML = '';
    }

    /**
     * 显示打字指示器
     */
    showTyping() {
        this.typingIndicator.style.display = 'flex';
        this._scrollToBottom();
    }

    /**
     * 隐藏打字指示器
     */
    hideTyping() {
        this.typingIndicator.style.display = 'none';
    }

    /**
     * 禁用输入
     */
    disableInput() {
        this._isInputDisabled = true;
        this.userInput.disabled = true;
        this.sendBtn.disabled = true;
    }

    /**
     * 启用输入
     */
    enableInput() {
        this._isInputDisabled = false;
        this.userInput.disabled = false;
        this.sendBtn.disabled = false;
        this.userInput.focus();
    }

    /**
     * 更新头像
     */
    updateAvatar(url) {
        this.charImg.style.backgroundImage = `url('${url}')`;
    }

    /**
     * 更新 AI 名称
     */
    updateAIName(name) {
        this.avatarName.textContent = name;
    }

    /**
     * 更新场景标题
     */
    updateSceneTitle(title) {
        this.sceneTitle.textContent = `💕 ${title}`;
    }

    /**
     * 添加系统消息
     */
    addSystemMessage(text) {
        const div = document.createElement('div');
        div.className = 'msg msg-system';
        div.textContent = text;
        this.chatBox.appendChild(div);
        this._scrollToBottom();
    }

    /**
     * 滚动到底部
     */
    _scrollToBottom() {
        requestAnimationFrame(() => {
            this.chatBox.scrollTop = this.chatBox.scrollHeight;
        });
    }

    /**
     * 格式化时间
     */
    _formatTime(date) {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    }
}
