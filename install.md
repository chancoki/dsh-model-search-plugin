# DSH 模型搜索插件 - 安装指南

## 前提条件

- DeepSeek Harness (DSH) 已安装
- 插件版本 **≥ 1.0.7**（自动激活）；建议直接使用最新版

## 安装（npm，推荐）

一条命令完成依赖安装与激活：

```bash
dsh plugin --profile web add dsh-model-search-plugin
```

> 如果报 `ERR_PNPM_ADDING_TO_ROOT`，说明 profile 目录是 pnpm workspace root，补一个 `-w`：
>
> ```bash
> dsh plugin --profile web add -w dsh-model-search-plugin
> ```

插件包内自带 `cordis.patch.yml` 并声明 `dsh.bundle.patch`，`dsh plugin add` 时 DSH 会**自动**把插件加入 profile 的 bundles 层——无需手动编辑任何配置文件。

然后重启：

```bash
dsh web
```

### 升级

```bash
dsh plugin --profile web update dsh-model-search-plugin
dsh web   # 重启生效
```

## 验证安装

1. 打开或强制刷新 DSH Web GUI（http://127.0.0.1:3080，Ctrl+Shift+R）
2. **模型选择弹窗**：点击对话界面的模型选择器，弹窗顶部出现搜索框；输入关键字实时过滤
3. **获取可用模型弹窗**：设置 → 模型 → 添加提供方 → 自定义设置 → 获取可用模型，候选列表上方出现搜索框（占位符"搜索可用模型…"）
4. 按 `Ctrl+F` / `Cmd+F` 聚焦搜索框，按 `Esc` 清除

## 备用方式：浏览器控制台注入（不走 DSH 插件系统）

适合临时测试。在 DSH 页面的开发者工具控制台执行：

```javascript
fetch('/plugins/dsh-model-search-plugin/client.js')
  .then(r => r.text())
  .then(code => { new Function('require', code)({}); });
```

> 前提：插件已作为 profile 依赖安装（client.js 由 DSH 服务）。纯脚本加载请使用 `dist/dsh-model-search-plugin.js`。

## 故障排除

| 问题 | 原因 | 解决方法 |
|------|------|----------|
| 安装报 `ERR_PNPM_ADDING_TO_ROOT` | profile 是 pnpm workspace root | 加 `-w` 标志重新执行 |
| 装了但搜索框不显示 | 未重启 `dsh web`（bundle 在启动时载入） | 重启后强刷页面 |
| 报 `invalid plugin ... received object` | 安装了有导出缺陷的旧版（1.0.2/1.0.3） | 升级到 ≥ 1.0.6 |
| 弹窗打开时没有立即出现搜索框 | 旧版 bug（< 1.1.1） | 升级到 ≥ 1.1.1 |
| 搜索无效果 | DOM 结构不匹配 | 检查 DSH 版本，可能需要调整选择器 |

## 卸载

```bash
dsh plugin --profile web remove dsh-model-search-plugin
```

（等效于 pnpm remove；DSH 会在 reconcile 时自动把它从 bundles 层移除。）然后重启 `dsh web`。
