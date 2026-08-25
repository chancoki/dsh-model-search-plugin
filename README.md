# DSH Model Search Plugin

为 DeepSeek Harness (DSH) Web GUI 提供模型搜索功能的插件。在以下两处弹窗中注入关键字搜索框，快速筛选模型：

| 位置 | 入口 | 说明 |
|------|------|------|
| 🔽 模型选择弹窗 | 对话界面 → 模型选择器 | 按 Ctrl+F 聚焦搜索，实时过滤模型与推理等级列表 |
| 🔽 获取可用模型弹窗 | 设置 → 模型 → 添加提供方 → 自定义设置 → 获取可用模型 | 在候选模型勾选列表上方搜索，快速定位要添加的模型 |

## 功能

- 🔍 **实时搜索**：输入关键字即时过滤，防抖 200ms
- 🎯 **双弹窗支持**：模型选择菜单 + 获取可用模型候选列表（v1.1.0 起）
- ⌨️ **快捷键**：`Ctrl+F` / `Cmd+F` 聚焦搜索框，`Esc` 清除，`↓` 跳到第一个候选项
- 🚫 **自动隐藏**：不匹配的模型、分组、候选项自动收起；无结果显示提示
- 🎨 **原生样式**：使用 DSH 设计系统 CSS 变量，自动适配明暗主题
- ⚡ **装了即用**：声明 `dsh.bundle.patch`，`dsh plugin add` 时由 DSH 自动加入 profile 层并激活——无需手动编辑任何配置文件（v1.0.7 起）
- 📦 **npm 分发**：CI 自动构建、发布、创建 GitHub Release

## 快速开始

### npm 安装（推荐）

```bash
dsh plugin --profile web add dsh-model-search-plugin
```

插件包内自带 `cordis.patch.yml`（insert 注册项）并在 package.json 声明 `dsh.bundle.patch`。`dsh plugin add` 完成依赖安装后，DSH 会自动把插件加入 profile 的 bundles 层堆栈，重启后即生效。

如果遇到 `ERR_PNPM_ADDING_TO_ROOT`（profile 目录是 pnpm workspace root），补一个 `-w` 标志：

```bash
dsh plugin --profile web add -w dsh-model-search-plugin
```

然后重启：

```bash
dsh web
```

打开模型选择弹窗或"获取可用模型"弹窗，即可看到搜索框。

### 升级已安装的版本

```bash
dsh plugin --profile web update dsh-model-search-plugin
dsh web   # 重启生效
```

### 手动激活（仅 v1.0.6 及更早版本需要）

新版不需要以下步骤。<details><summary>展开旧版流程</summary>

编辑 profile 的 `~/.dsh/profiles/web/cordis.patch.yml`，添加：

```yaml
- insert:
    - id: dsh-model-search
      name: 'dsh-model-search-plugin'
```

</details>

## 使用 API

浏览器端可通过 loader entry 配置传入参数：

```javascript
DSHModelSearchPlugin.configure({
  placeholder: '搜索模型...',    // 搜索框占位文本
  debounceDelay: 200,            // 防抖延迟(ms)
  hideUnmatched: true,           // 隐藏不匹配项
  focusHotkey: 'f',              // 快捷键（需要 Ctrl/Cmd）
  focusRequiresModifier: true,   // 是否需要 Ctrl/Cmd 修饰键
});

DSHModelSearchPlugin.activate();
DSHModelSearchPlugin.deactivate();
```

## 原理

插件是纯浏览器端 DOM 插件：宿主侧入口（`lib/index.js`）是一个空的 Cordis 载体（`apply` 空函数），让 Loader 能挂载本包；浏览器侧 bundle 通过 package.json 的 `dsh.client` 声明被发现，由 DSH 的 client-modules 机制在页面加载时执行。

运行时使用 `MutationObserver` 监听 DOM：

- **模型选择弹窗**：检测 `[role="menu"]`（aria-label 含 model/推理等级/effort）出现后，在分组容器顶部注入搜索框，过滤 `section[role="group"]` 内的 `[role="menuitemradio"]`。
- **获取可用模型弹窗**：检测 `ul[class*="candidateList"]` 出现后**立即**在其上方注入搜索框（不等下一次 DOM 变动），按候选项文本过滤 `li` 行。

弹窗关闭时自动清理注入的 DOM 与观察器，两个目标状态互相独立。

## 项目结构

```
dsh-model-search/
├── package.json              # npm 包配置，含 dsh.bundle.patch 与 dsh.client 声明
├── cordis.patch.yml          # 包自带的 loader 注册 patch（insert 本插件）
├── tsconfig.json             # TypeScript 配置
├── src/
│   ├── index.ts              # 服务端入口（桩）
│   ├── client.ts             # 客户端插件 TypeScript 源码
│   └── types.ts              # 类型定义
├── lib/
│   ├── index.js              # 编译后的服务端入口（纯载体）
│   └── client.js             # DSH __ModuleLoader__ 格式的客户端插件
├── dist/
│   └── dsh-model-search-plugin.js  # 独立脚本（可直接 <script> 加载）
├── scripts/
│   └── build-plugin.js       # 构建脚本（tsc 产物 → ModuleLoader 包装）
├── .github/workflows/
│   └── publish.yml           # tag 推送 → 构建 → npm 发布 → GitHub Release
├── test.html                 # 测试页面（模拟模型选择器）
└── example/index.html        # 完整演示
```

## 发布流程

```bash
npm version patch        # 或 minor / major
git push origin main --tags
```

推送 `v*` tag 后 CI 自动完成构建、npm 发布和 GitHub Release。

## 版本历史

- **v1.1.1** — 修复："获取可用模型"弹窗首次打开时搜索框未立即出现（需点击后才注入）；现在检测到列表即注入
- **v1.1.0** — 新增"获取可用模型"候选列表弹窗的关键字搜索
- **v1.0.7** — 声明 `dsh.bundle.patch` 并内置 `cordis.patch.yml`：`dsh plugin add` 后自动激活，免去手动注册
- **v1.0.6** — 修复 CI 构建产物导出缺失导致的 `invalid plugin` 加载失败
- **v1.0.0–1.0.5** — 初始功能迭代与构建管线打磨

## 许可

MIT
