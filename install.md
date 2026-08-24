# DSH 模型搜索插件 - 安装指南

## 前提条件

- DeepSeek Harness (DSH) 已安装并运行
- DSH Web GUI 可通过 http://127.0.0.1:3080 访问

## 安装方式

### 方式一：浏览器书签（Bookmarklet）——最简单

创建一个浏览器书签，URL 设置为以下 JavaScript：

```javascript
javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/your-username/dsh-model-search-plugin@latest/dist/dsh-model-search-plugin.js';document.head.appendChild(s);setTimeout(function(){if(window.DSHModelSearchPlugin){DSHModelSearchPlugin.activate();console.log('DSH Model Search Plugin activated!');}},500);})();
```

然后点击该书签即可在任何 DSH 页面激活搜索功能。

### 方式二：浏览器控制台——快速测试

1. 打开 DSH Web GUI (http://127.0.0.1:3080)
2. 按 F12 打开开发者工具
3. 在 Console 面板中执行：

```javascript
// 方法A：加载本地插件文件（需要文件可通过 HTTP 访问）
fetch('/dist/dsh-model-search-plugin.js')
  .then(r => r.text())
  .then(code => { eval(code); DSHModelSearchPlugin.activate(); });

// 方法B：如果插件文件在本地文件系统
// 直接在控制台粘贴 dist/dsh-model-search-plugin.js 的内容
// 然后执行：DSHModelSearchPlugin.activate();
```

### 方式三：Tampermonkey / Greasemonkey 用户脚本

创建用户脚本：

```javascript
// ==UserScript==
// @name         DSH Model Search Plugin
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  为 DSH Web GUI 添加模型搜索功能
// @author       You
// @match        http://127.0.0.1:3080/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function loadPlugin() {
        if (window.DSHModelSearchPlugin) {
            DSHModelSearchPlugin.activate();
            return;
        }

        var s = document.createElement('script');
        s.src = '/dist/dsh-model-search-plugin.js';  // 或者使用完整 URL
        s.onload = function() {
            if (window.DSHModelSearchPlugin) {
                DSHModelSearchPlugin.activate();
                console.log('DSH Model Search Plugin activated via userscript');
            }
        };
        document.head.appendChild(s);
    }

    // 等待页面加载完成后启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPlugin);
    } else {
        loadPlugin();
    }
})();
```

### 方式四：作为 DSH 客户端插件（进阶）

要作为正式的 DSH 客户端插件集成，需要：

1. 将插件包添加到 DSH profile 目录：

```bash
# 如果使用 dsh web 的默认 profile
dsh plugin --profile web add ./path/to/dsh-model-search-plugin
```

2. 或者在 DSH 仓库目录的 package.json 中添加依赖：

```bash
cd F:\software\nodejs\node_cache\_npx\1e7f6d9597241db0
pnpm add ./path/to/dsh-model-search-plugin
```

3. 插件发布到 npm 后，可以直接通过包名安装：

```bash
dsh plugin --profile web add dsh-model-search-plugin
```

## 验证安装

1. 打开或刷新 DSH Web GUI (http://127.0.0.1:3080)
2. 点击模型选择器（当前模型名称的按钮）
3. 在弹窗的模型列表中，顶部应该出现搜索输入框
4. 输入关键字（如 "gpt"、"claude"），模型列表应实时过滤
5. 按 `Ctrl+F` 或 `Cmd+F` 可聚焦搜索框，按 `Esc` 可清除搜索

## 故障排除

| 问题 | 原因 | 解决方法 |
|------|------|----------|
| 搜索框不显示 | 插件未激活 | 执行 `DSHModelSearchPlugin.activate()` |
| 搜索无效果 | DOM 结构不匹配 | 检查 DSH 版本，可能需要调整选择器 |
| 快捷键无效 | 被浏览器或其他插件拦截 | 检查快捷键冲突 |
| 样式不匹配 | CSS 变量名变更 | 更新 CSS_VARS 配置 |

## 卸载

### 方法A：Tampermonkey 用户
- 在 Tampermonkey 管理面板中删除该脚本

### 方法B：控制台注入
- 执行 `DSHModelSearchPlugin.deactivate()`
- 刷新页面

### 方法C：DSH 客户端插件
- 从 profile 的 package.json 和 pnpm-workspace.yaml 中移除依赖
- 运行 `pnpm install` 更新