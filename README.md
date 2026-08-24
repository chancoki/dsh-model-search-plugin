# DSH Model Search Plugin

为 DeepSeek Harness (DSH) Web GUI 提供模型搜索功能的插件——在模型选择弹窗中添加关键字搜索框，快速筛选模型。

## 功能

- 🔍 **实时搜索**：在模型选择弹窗中输入关键字，实时过滤模型列表
- 🎯 **多字段匹配**：搜索模型名称、提供商、描述等信息
- ⌨️ **快捷键**：`Ctrl+F` 或 `Cmd+F` 聚焦搜索框，`Esc` 清除搜索，`↓` 移动到模型列表
- 🚫 **自动隐藏**：不匹配的模型和提供商组自动隐藏
- 🎨 **原生样式**：使用 DSH 设计系统 CSS 变量，完美适配明暗主题
- 📦 **双重安装**：支持作为 DSH 客户端插件安装，也支持直接通过 `<script>` 加载

## 快速开始

### 方式一：浏览器控制台（立即测试）

打开 DSH Web GUI (http://127.0.0.1:3080)，在浏览器开发者工具控制台中执行：

```javascript
// 加载插件脚本
var s = document.createElement('script');
s.src = '/dist/dsh-model-search-plugin.js';
document.head.appendChild(s);

// 稍后激活
setTimeout(function() { DSHModelSearchPlugin.activate(); }, 500);
```

### 方式二：加载本地脚本文件

将 `dist/dsh-model-search-plugin.js` 放置到能被 DSH 服务器访问的位置，然后在 DSH 页面中通过 `dsh web` 启动参数或浏览器插件注入。

### 方式三：通过 npm 安装（推荐）

插件已发布到 npm：**https://www.npmjs.com/package/dsh-model-search-plugin**

**1. 安装依赖**

```bash
# 在 DSH profile 目录下（通常是 ~/.dsh/profiles/web）
dsh plugin --profile web add dsh-model-search-plugin
```

或手动在 DSH profile 的 `package.json` 中添加：

```json
{
  "dependencies": {
    "dsh-model-search-plugin": "^1.0.0"
  }
}
```

然后在 profile 目录运行 `pnpm install`。

**2. 注册为客户端插件**

编辑 DSH profile 的 `cordis.patch.yml`（`~/.dsh/profiles/web/cordis.patch.yml`），添加：

```yaml
- insert:
    - id: dsh-model-search
      name: 'dsh-model-search-plugin'
```

**3. 重启 DSH**

```bash
# 停止并重新启动 dsh web
dsh web
```

重启后打开模型选择弹窗，顶部即可看到搜索输入框。

## 使用 API

```javascript
// 配置
DSHModelSearchPlugin.configure({
  placeholder: '搜索模型...',    // 搜索框占位文本
  debounceDelay: 200,            // 防抖延迟(ms)
  hideUnmatched: true,           // 隐藏不匹配项
  focusHotkey: 'f',              // 快捷键（需要 Ctrl/Cmd）
  focusRequiresModifier: true,   // 是否需要 Ctrl/Cmd 修饰键
});

// 激活
DSHModelSearchPlugin.activate();

// 停用
DSHModelSearchPlugin.deactivate();

// 检查状态
var active = DSHModelSearchPlugin.isActive();
```

## 原理

插件使用 `MutationObserver` 监听 DOM 变化，自动检测 DSH Web GUI 的模型选择弹窗。当模型列表出现时，在列表顶部注入一个搜索输入框，输入时实时过滤 `<section role="group">` 中的 `<button role="menuitemradio">` 元素。

## 项目结构

```
dsh-model-search/
├── package.json              # npm 包配置，含 dsh.client 声明
├── tsconfig.json             # TypeScript 配置
├── src/
│   ├── index.ts              # 服务端入口（桩）
│   ├── client.ts             # 客户端插件 TypeScript 源码
│   └── types.ts              # 类型定义
├── lib/
│   ├── index.js              # 编译后的服务端入口
│   └── client.js             # DSH __ModuleLoader__ 格式的客户端插件
├── dist/
│   ├── dsh-model-search-plugin.js  # 独立脚本（可直接通过 <script> 加载）
│   └── index.js              # ESM 重新导出
├── scripts/
│   └── build-plugin.js       # 构建脚本
├── test.html                 # 测试页面（模拟模型选择器）
├── example/
│   └── index.html            # 完整演示
├── README.md
└── install.md
```

## 开发

```bash
# 构建
node scripts/build-plugin.js

# 运行测试页面
npx serve .
# 打开 http://localhost:3000/test.html
```

## 许可

MIT