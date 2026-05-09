# 恋爱AI聊天模拟器

> 温暖治愈风格的 AI 聊天网页应用，支持多场景切换、本地数据驱动、GPT API 扩展。

---

## 功能特性

- **密码保护**：前端密码验证（可自定义）
- **多场景切换**：日常 / 哄哄 / 早安 / 晚安 / 想你，每个场景独立主题色、头像、回复风格
- **AI 智能回复**：
  - 本地模式：关键词匹配 + 随机回复（无需 API）
  - GPT 模式：接入 OpenAI API，根据聊天数据做风格迁移
- **聊天体验**：AI 回复带随机延迟、打字指示器、消息淡入动画
- **数据持久化**：聊天记录和设置自动保存到 localStorage
- **格子纸聊天背景**：可随场景变化
- **响应式布局**：移动端/桌面端适配
- **温柔治愈风格**：暖色系、手绘线条、圆角气泡、可爱动画

---

## 快速开始

### 1. 本地运行

```bash
# 方式一：使用 Python
cd love-ai-chat
python3 -m http.server 3000

# 方式二：使用 Node.js
npx serve love-ai-chat

# 然后打开浏览器访问 http://localhost:8080
```

> **注意**：请勿直接双击 `index.html` 打开（file:// 协议下 fetch 可能被浏览器阻止）。

### 2. 部署到服务器

将整个 `love-ai-chat/` 文件夹上传到任意静态文件服务器（Nginx / Apache / Vercel / Netlify 等）即可。

---

## 项目结构

```
love-ai-chat/
├── index.html          # 主入口页面（密码验证 + 聊天界面）
├── css/
│   └── style.css       # 全局样式（CSS 变量、动画、响应式）
├── js/
│   ├── config.js       # 应用配置（密码、API、场景列表）
│   ├── storage.js      # localStorage 存储封装
│   ├── data-loader.js  # JSON 聊天数据加载器
│   ├── ai-engine.js    # AI 回复引擎（本地匹配 + GPT）
│   ├── chat-ui.js      # 聊天界面管理器
│   ├── scene-manager.js # 场景切换管理器
│   └── app.js          # 主应用入口
├── data/               # 聊天数据目录
│   ├── daily.json      # 日常场景
│   ├── comfort.json    # 哄哄场景
│   ├── morning.json    # 早安场景
│   ├── goodnight.json  # 晚安场景
│   └── miss-you.json   # 想你场景
└── README.md           # 本文档
```

---

## 配置指南

### 修改密码

编辑 `js/config.js`：

```javascript
export const APP_CONFIG = {
    password: '你的密码', // 修改此处
    // ...
};
```

> ⚠️ **安全提示**：密码明文存储在前端代码中，仅提供基础保护。生产环境请使用后端认证。

### 添加新场景

**步骤 1**：在 `js/config.js` 的 `SCENE_LIST` 中添加条目：

```javascript
export const SCENE_LIST = [
    // ... 现有场景
    { id: 'travel', file: 'travel.json' },  // 新增
];
```

**步骤 2**：在 `data/` 目录下创建 `travel.json`：

```json
{
  "id": "travel",
  "name": "旅行",
  "emoji": "✈️",
  "aiName": "小暖",
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Travel",
  "theme": {
    "bgColor": "#f0fdf4",
    "accentColor": "#bbf7d0",
    "borderColor": "#6b8b7d",
    "bgGradient": null
  },
  "greeting": "世界很大，想和你一起去看看~✈️",
  "replies": [
    "下一站你想去哪里？我陪你。",
    "旅行的意义就是和你在一起。",
    "收拾行李，我们出发吧！"
  ],
  "conversations": [
    {"user": "想去哪里玩", "ai": "有你的地方哪里都是好风景~你想去哪里？"}
  ]
}
```

### 修改头像

头像使用 [DiceBear Avatars](https://www.dicebear.com/styles/avataaars)，修改 JSON 中的 `seed` 参数即可换头像：

```
https://api.dicebear.com/7.x/avataaars/svg?seed=你的名字
```

也可以替换为你自己的图片 URL，或本地 `assets/` 图片路径。

### 启用 GPT API

1. 打开应用，点击右上角 ⚙️ 设置
2. 开启 GPT API 开关
3. 填入你的 OpenAI API Key（格式：`sk-...`）
4. 可自定义 API URL（支持兼容接口）和模型名称

GPT 工作流程：
- 将当前场景的对话数据作为 few-shot 示例
- 结合最近聊天历史作为上下文
- 调用 API 生成风格一致的温柔回复
- API 失败时自动回退到本地模式

---

## 聊天数据格式

每个 JSON 文件包含一个场景的完整数据：

```json
{
  "id": "场景ID（英文）",
  "name": "场景名称（中文）",
  "emoji": "场景图标",
  "aiName": "AI 角色名",
  "avatar": "头像图片URL",
  "theme": {
    "bgColor": "背景色",
    "bgGradient": "渐变色（可选，优先级高于 bgColor）",
    "accentColor": "强调色",
    "borderColor": "边框色"
  },
  "greeting": "场景切换时的开场白",
  "replies": ["AI回复1", "AI回复2", "..."],
  "conversations": [
    {"user": "用户可能说的话", "ai": "对应的AI回复"}
  ]
}
```

- `replies`：随机回复池，必填
- `conversations`：对话对，用于关键词匹配（可选但推荐，提高回复相关性）
- `theme.bgGradient`：支持 CSS gradient 语法，如 `"linear-gradient(180deg, #e8eeff, #dce3f5)"`

---

## 浏览器兼容性

| 浏览器 | 版本 |
|--------|------|
| Chrome | 90+ |
| Edge   | 90+ |
| Firefox| 88+ |
| Safari | 15+ |

需要支持 ES Modules (`<script type="module">`) 和 CSS 自定义属性。

---

## 自定义样式

所有主题色定义在 `css/style.css` 开头的 `:root` 变量中：

```css
:root {
    --bg-body: #f9f6f2;        /* 页面背景 */
    --bg-card: #ffffff;         /* 卡片背景 */
    --border-color: #7d6e61;   /* 手绘边框色 */
    --accent-pink: #ffcfd2;    /* 粉色强调 */
    --radius-lg: 40px;         /* 大圆角 */
    --radius-md: 20px;         /* 中圆角 */
}
```

修改这些变量即可全局调整风格。

---

## 常见问题

**Q: 打开后一直显示"场景数据加载失败"？**  
A: 请确保通过 HTTP 服务器访问（不要直接双击 HTML），需要 fetch 加载 JSON 文件。

**Q: 如何导入自己的聊天记录？**  
A: 将聊天记录整理成上述 JSON 格式，放入 `data/` 目录，然后在 `js/config.js` 的 `SCENE_LIST` 中注册。

**Q: 如何使用其他 GPT 兼容 API？**  
A: 修改 `gpt.apiUrl` 即可（如 Azure OpenAI、本地 Ollama 等），确保接口兼容 `/v1/chat/completions` 格式。

**Q: 密码忘记了怎么办？**  
A: 直接在 `js/config.js` 中查看或修改 `password` 字段，或清除浏览器 localStorage 后修改。

---

## 许可证

MIT License — 自由使用和修改。

---

*💕 愿你被温柔以待，每一天都甜甜蜜蜜。*
