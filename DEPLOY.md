# 屿航 · 部署指引（Cloud Studio / 静态托管）

> 本项目是**纯前端、零构建工具**的静态站点。`web/` 目录自包含，上传整个目录即可部署。
> 4 个页面：`index.html`（屿航主站）/ `todo.html`（屿事待办）/ `ip.html`（屿咪 IP）/ `story.html`（世界观长文）。

## 一、要部署什么

- **推荐**：部署 `web/` 整个目录（4 页 + `css/` `js/` `data/` `ip/` `icon.svg` `manifest.webmanifest`）。
- **可选单文件**：`dist/index.html`（仅主站，约 836KB，离线可开）—— 由 `node scripts/package.mjs` 生成，把主站本地 CSS/JS 全部内联。**注意**：单文件只含主站，屿事/屿咪/世界观仍是独立页面，所以完整站点请用 `web/` 目录。

## 二、Cloud Studio 部署步骤

1. 登录 [Cloud Studio](https://cloudstudio.net/)，新建工作空间 → 选「预置环境：Node.js」或空环境均可（运行期不需要 Node，仅本地预览可选）。
2. 把本项目的 `web/` 目录上传到工作空间根目录（或 `git clone` 你的仓库后保留 `web/`）。
3. 预览/托管（任选其一）：
   - **A. Cloud Studio 内置预览**：在工作空间开终端，`npx serve web`（或 `python -m http.server 8080 -d web`），点 Cloud Studio 的「预览」按钮即可获得可访问 URL。
   - **B. 静态托管**：把 `web/` 目录内容推送到你的静态托管（Cloud Studio 关联的 Coding/腾讯云 COS 静态网站、Vercel、Netlify、GitHub Pages 均可）。托管根目录 = `web/` 内容。
4. 访问站点根 URL，应看到屿航主站；点右下快捷菜单的「📋 屿事」「🐱 屿咪」可跳到对应页面，移动端底部导航在四页间统一。

## 三、主题/配色一致性

四页共用 `css/theme.css` + `js/theme-sync.js`：主题与强调色存于 `localStorage` 键 `nav_theme_v1` / `nav_color_v1`，任一页切换，其余页实时/刷新后跟随。9 主题 × 7 强调色与主站完全一致。

## 四、可选：构建单文件 / 压缩

```
node scripts/package.mjs          # 生成 dist/index.html（主站单文件）
node scripts/compress.mjs         # 为 web/ 与 dist 生成 .gz/.br
```

## 五、回归测试（部署前自检）

```
node scripts/smoke-app.mjs        # 主站冒烟
node scripts/smoke-admin.mjs      # 后台冒烟
node scripts/test-search.mjs      # 搜索回归
node scripts/test-roundtrip.mjs   # 数据往返
```

> 注：`test-roundtrip` 中 `sites.json` 与当前 TSV 一致性一项在基线即已失败（数据管道历史问题，与本次 UI/功能改造无关），其余均应通过。

## 六、本次「屿事/屿咪扩展 + 与屿航统一 UI」改动清单

- 新增 `web/css/theme.css`、`web/js/theme-sync.js`、`web/js/yh-shared.js`（四页共享主题层、移动导航、主题选择器、Toast、待办桥、成长 XP 桥、屿咪伴随小组件）。
- `web/todo.html`：接入 9 主题×7 色；新增「标签分组」「时间轴」视图；快捷键与主站统一（`/` `Esc` `?`）；接入统一移动端底部导航；读取屿航待办收件箱并一键导入。
- `web/ip.html`：接入主题体系；接入统一移动端导航；成就新增「群岛探索者」「收藏家」并与主站浏览/收藏行为打通。
- `web/story.html`：接入主题体系；新增玻璃顶栏与返回入口；接入统一移动端导航。
- `web/index.html` / `js/app.js` / `js/cards.js`：屿咪伴随小组件进驻主站右下角；浏览/收藏行为授予 XP（与 ip.html 成就共用 `yuhang_yumi_grow_v1`）；卡片详情弹窗新增「📋 加入屿事」按钮（写入 `yuhang_todo_inbox_v1` 供屿事导入）。
