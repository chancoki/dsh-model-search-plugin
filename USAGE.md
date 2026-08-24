# DSH Model Search Plugin - 使用指南

## 概述

DSH Model Search Plugin 为 DeepSeek Harness Web GUI 的模型选择弹窗添加关键字搜索功能。

## 快速使用

### 方式一：浏览器控制台直接注入

1. 打开 DSH 页面后，按 F12 打开开发者工具
2. 切换到 Console（控制台）面板
3. 粘贴以下代码执行：

```javascript
// 加载插件脚本并激活
(function() {
    function init() {
        if (window.DSHModelSearchPlugin) {
            DSHModelSearchPlugin.activate();
            console.log('[Model Search] 插件已激活！');
        } else {
            console.warn('[Model Search] 插件未找到，请先加载脚本。');
        }
    }
    
    // 如果已经加载
    if (window.DSHModelSearchPlugin) { init(); return; }
    
    // 添加 script 标签加载
    var s = document.createElement('script');
    s.src = '/dist/dsh-model-search-plugin.js';
    s.onload = init;
    document.head.appendChild(s);
})();
```

### 方式二：Tampermonkey 用户脚本

创建新脚本，匹配 DSH 页面 URL，脚本内容在 `install.md` 中提供。

### 方式三：在 HTML 中直接引入

```html
<script src="/path/to/dsh-model-search-plugin.js"></script>
<script>
    DSHModelSearchPlugin.configure({
        placeholder: '搜索模型...',
        hideUnmatched: true
    }).activate();
</script>
```

## API 参考

### `DSHModelSearchPlugin.configure(options)`

配置插件选项（可在激活前后调用）：

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `placeholder` | string | `"搜索模型..."` | 搜索框占位符 |
| `debounceDelay` | number | `200` | 输入防抖延迟(ms) |
| `hideUnmatched` | boolean | `true` | 隐藏不匹配的模型 |
| `focusHotkey` | string | `"f"` | 快捷键按键 |
| `focusRequiresModifier` | boolean | `true` | 是否需要 Ctrl/Cmd |
| `minQueryLength` | number | `0` | 最小搜索长度 |
| `containerClass` | string | `"dsh-model-search-container"` | 容器 CSS 类 |
| `inputClass` | string | `"dsh-model-search-input"` | 输入框 CSS 类 |
| `showNoResults` | boolean | `true` | 显示无结果提示 |

### `DSHModelSearchPlugin.activate()`

激活插件：注入 CSS 样式，启动 MutationObserver 监听 DOM。

### `DSHModelSearchPlugin.deactivate()`

停用插件：移除所有注入的 DOM 元素和样式，断开观察器。

### `DSHModelSearchPlugin.isActive()`

返回当前激活状态 (boolean)。

### `DSHModelSearchPlugin.apply(ctx, options)`

DSH 客户端插件入口函数（与 Cordis Loader 兼容）。

## 快捷键

- **Ctrl+F** 或 **Cmd+F**：聚焦搜索框
- **Esc**：清除搜索内容 / 移除搜索框焦点
- **↓**：从搜索框移动到第一个模型选项
- **Enter**：立即执行搜索（绕过防抖）

## 工作原理

1. 插件注入 CSS 样式到页面头部
2. 启动 `MutationObserver` 监听 `document.body` 的 DOM 变化
3. 检测到 `role="menu"` 且 `aria-label` 包含 "model"/"推理等级"/"effort" 的元素时，识别为模型选择弹窗
4. 在弹窗内部监听 DOM 变化，等待模型列表（`role="group"` 区段）出现
5. 在模型列表上方注入搜索输入框
6. 搜索时过滤 `role="menuitemradio"` 的按钮元素
7. 弹窗关闭时自动清理注入的元素和事件监听

## 兼容性

- 适用于 DSH Web GUI (http://127.0.0.1:3080)
- 支持现代浏览器（Chrome, Firefox, Edge, Safari）
- 自动适配 DSH 明暗主题