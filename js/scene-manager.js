/**
 * 场景管理器 —— 场景切换与 UI 联动
 */
export class SceneManager {
    constructor(chatUI) {
        this.chatUI = chatUI;
        this.dataLoader = null;
        this.currentSceneId = null;
        this.sceneList = [];
        this.onSceneChangeCallback = null;
    }

    /**
     * 设置数据加载器引用
     */
    setDataLoader(dataLoader) {
        this.dataLoader = dataLoader;
    }

    /**
     * 初始化场景选择按钮
     */
    initSceneButtons(sceneList) {
        this.sceneList = sceneList;
        const selector = document.getElementById('sceneSelector');
        selector.innerHTML = '';

        for (const scene of sceneList) {
            const btn = document.createElement('button');
            btn.className = 'scene-btn';
            btn.dataset.scene = scene.id;
            btn.textContent = `${scene.emoji} ${scene.name}`;
            btn.addEventListener('click', () => {
                if (this.currentSceneId !== scene.id) {
                    this.switchScene(scene.id);
                }
            });
            selector.appendChild(btn);
        }
    }

    /**
     * 切换场景
     * @param {string} sceneId
     * @returns {Promise<Object|null>} 场景数据
     */
    async switchScene(sceneId) {
        const sceneData = this.dataLoader?.getSceneData(sceneId);
        if (!sceneData) {
            console.warn(`场景 "${sceneId}" 数据不存在`);
            return null;
        }

        // 更新当前场景
        const previousSceneId = this.currentSceneId;
        this.currentSceneId = sceneId;

        // 更新按钮状态
        document.querySelectorAll('.scene-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.scene === sceneId);
        });

        // 更新 UI
        this._updateGameContainer(sceneData);

        // 延迟更新头像（动画效果）
        const previousData = previousSceneId
            ? this.dataLoader?.getSceneData(previousSceneId)
            : null;

        if (previousData?.avatar !== sceneData.avatar) {
            // 头像过渡动画
            const img = document.getElementById('charImg');
            img.style.opacity = '0';
            img.style.transform = 'scale(0.8)';

            setTimeout(() => {
                this.chatUI.updateAvatar(sceneData.avatar);
                img.style.opacity = '1';
                img.style.transform = 'scale(1)';
            }, 200);
        }

        this.chatUI.updateAIName(sceneData.aiName);
        this.chatUI.updateSceneTitle(`${sceneData.emoji} ${sceneData.name}`);

        // 触发回调
        if (this.onSceneChangeCallback) {
            this.onSceneChangeCallback(sceneId, sceneData);
        }

        return sceneData;
    }

    /**
     * 获取当前场景 ID
     */
    getCurrentSceneId() {
        return this.currentSceneId;
    }

    /**
     * 获取当前场景数据
     */
    getCurrentSceneData() {
        return this.currentSceneId
            ? this.dataLoader?.getSceneData(this.currentSceneId)
            : null;
    }

    /**
     * 注册场景切换回调
     */
    onSceneChange(callback) {
        this.onSceneChangeCallback = callback;
    }

    /**
     * 更新游戏容器样式
     */
    _updateGameContainer(sceneData) {
        const container = document.getElementById('gameWindow');
        const theme = sceneData.theme || {};

        container.setAttribute('data-scene', sceneData.id);

        if (theme.bgGradient) {
            container.style.background = theme.bgGradient;
        } else if (theme.bgColor) {
            container.style.background = theme.bgColor;
        }

        if (theme.borderColor) {
            container.style.borderColor = theme.borderColor;
        }
    }
}
