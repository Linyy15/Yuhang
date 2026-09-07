# 屿航浏览器扩展（最小入口）

这是一个 Manifest V3 浏览器扩展：从当前活动标签页读取标题和 URL，并以**只含查询参数的链接**打开屿航 Web。它不会读取浏览器书签，也不会写入、覆盖屿航现有数据。

## 安装（Chrome / Edge）

1. 打开扩展管理页（Chrome：`chrome://extensions`；Edge：`edge://extensions`）。
2. 开启「开发者模式」。
3. 选择「加载已解压的扩展程序」。
4. 选择本 `extension/` 目录。

## 使用

1. 打开要收录的网页，点击浏览器工具栏中的「保存到屿航」。
2. 弹窗自动带入当前标签的标题与 URL。
3. 在「屿航 Web URL」输入你的部署地址（例如 `https://example.com/index.html`）；该地址会通过 `chrome.storage.sync` 保存，后续自动带入。
4. 点击：
   - **保存到屿航**：在新标签打开配置的屿航地址，并附加 `title`、`url` 查询参数。
   - **复制 JSON**：将 `{ "title": "…", "url": "…" }` 复制到剪贴板。
   - **打开屿航链接**：不改变数据，只打开同一条带参数的链接。

## Web 端接入约定

扩展仅生成 URL，例如：

```text
https://example.com/index.html?title=Example&url=https%3A%2F%2Fexample.com
```

屿航 Web 若需接收，可自行读取 `URLSearchParams` 的 `title` 与 `url`，展示确认界面后再由用户决定是否新增；本扩展不会自动提交或覆盖站点数据。

## 权限与安全

- `activeTab`：仅在用户打开弹窗时读取当前标签的 `title`、`url`。
- `storage`：仅保存用户配置的屿航 Web URL。
- 不申请 bookmarks 权限，因而不读取浏览器书签。
- Popup 使用 `textContent` 更新状态，不将页面标题或 URL 注入 HTML，避免不受信任文本导致 XSS。
- 当前版本不包含远程脚本、新标签页替换或批量书签导入；这些能力应在主站链接实体和冲突策略稳定后再单独迭代。
