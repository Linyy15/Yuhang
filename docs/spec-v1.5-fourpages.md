# 屿航 · 四页整体完善规格（Spec v1.5 — 最终落地版）

> 范围：`index.html`（主页）· `todo.html`（待办）· `ip.html`（屿咪 IP）· `admin.html`（后台管理）。
> 状态：**全部四页验证通过**。
> 最终回归：`scripts/smoke-app.mjs` ✅ · `scripts/smoke-admin.mjs` ✅ · 6 个 CSS 括号 = 0 · 所有 JS 语法 = 0 · 4 个 HTML 结构干净无重复 id。

---

## 〇、index.html（主页）— 复检精修

**现状（Phase 1–3 已落地，本轮复检）**：4 级字号 token、卡片色编码渐变条+图标光晕、Hero 48px 大卡+count-up、星标 burst、推荐卡、空状态 SVG、cross-fade、统计页可视化、搜索面板、骨架屏、Footer 标语、设置界面。
**本轮确认**：
| # | 项 | 状态 |
|---|---|---|
| H1 | 字号/间距一致性 | ✅ 无 <11px 残留；4 级体系统一 |
| H2 | 入场动效 | ✅ `.app.revealed` + `cardEnter` 入场动画 |
| H3 | 移动端 | ✅ 顶栏/底栏/筛选窄屏折叠 |
| H4 | 无障碍 | ✅ skip-link（`skip-main`/`skip-search`）、`prefers-reduced-motion` 全覆盖、`:focus-visible` |
| H5 | 视觉一致性 | ✅ 全部渐变/卡片/统计走统一 token |
| 回归 | `index.html` 176 ids，dup NONE | ✅ |

---

## 一、todo.html（待办清单）— 多轮迭代落地

**现状基线**：完整重写 + 一轮迭代，共 1412 行（含子代理产出），43 个 id 无真实重复。
**完整能力清单**：
| 类别 | 功能 |
|---|---|
| 顶栏 | 渐变品牌字（屿航·待办清单）、屿咪 mascot、返回导航 |
| 统计四卡 | 📋✅⏳🔴 图标 + 渐变大数字（高优/完成差异化配色）+ `countUp` 滚动 + hover 浮起 |
| 进度条 | 左侧渐变竖条 + 「完成进度」标签 + 18px 渐变百分比 + 弹性填充 + accent 发光 |
| 添加表单 | 主输入 + 标签 + 优先级下拉 + 渐变按钮（btn-shine）+ focus 光环 |
| 筛选栏 | 6 个药丸筛选（全部/待办/已完成/高/中/低优）+ **药丸计数** + 动态标签筛选 + 「清空已完成（N）」 |
| 卡片视觉 | 优先级色左边框（高优发光）+ 软背景 tint + 入场交错动画 + `:focus-visible` + hover 提升 |
| 完成态 | checkbox 弹跳 ✓ + 标题划线淡出 + 已完成 hover 提亮 + 完成态装饰 `::after` |
| **软删除撤销** | 底部 toast「已删除『xxx』· 撤销」+ 5s 进度条 + 撤销按钮 + 新增/Escape 自动清 |
| 彩纸庆祝 | `confettiBurst()` 24 粒子随机角度 |
| 屿咪 IP | 表情状态联动（surprised/happy/wave/celebrate）+ 空态 stage |
| 键盘 | `/` 聚焦输入、`Enter` 添加/操作、`Escape` 关闭 toast、`Delete/Backspace` 删除选中项 |
| 无障碍 | `role="toolbar"/"list"/"status"`、`aria-live="polite"`、aria-label 全覆盖、skip-link（跳到主内容/跳到输入）|
| 视觉呼吸 | `prefers-reduced-motion` 全覆盖、暗色模式完整、背景 blob 光晕层、`.kbd-hint` 键盘提示 |
| 空态 | 屿咪 stage + 欢迎文案 + 空态 CTA「为待办加标签」 |

**本轮新增**：`skip-link`（跳到主内容/跳到输入）、`prefers-reduced-motion` 覆盖。
**备份**：`backup-todo/todo.before-polish.html`（原版 25967）、`todo.round1.before.html`（重写前 35842）。

---

## 二、ip.html（屿咪 IP 角色页）— 多轮迭代落地

**现状基线**：子代理一轮迭代 + 主进程复检精修，共 860+ 行，16 个 id 零重复。
**完整能力清单**：
| 类别 | 功能 |
|---|---|
| Hero | 「在线守岛中」hero-badge（脉动圆点）+ 40px 大字「屿咪·Yumi」+ 240px xlarge 角色 + 漂浮/眨眼 |
| 角色卡 | Species / Role / Color / Tail 四格 info-grid + 5 个性格标签（探索/猫系/极光/岛屿/治愈）|
| 角色立绘 | `avatar-status`（♥ 心情·正常 + heartBeat 动画）+ `avatar-caption`（点击触发庆祝提示）|
| 引言 | `quote-box`（❝❞ 装饰引号 + 斜体金句）|
| 技能条 | 6 个 skill-card（探索/导航/收藏/守护/学习/治愈）+ 百分比条 + hover 浮起 |
| 表情图鉴 | 5 个 expr-card（idle/happy/wave/surprised/sleep）+ 顶部渐变条 hover 显现 + tip 提示 |
| 互动区 | 大角色舞台 + 5 个表情切换按钮（active 高亮）|
| 色卡 | 7 个主站强调色色块 + hover 浮起放大 |
| 视觉包装 | 极光背景（4 层 blob 光晕）+ 玻璃拟态 + accent 渐变 + 装饰性 `section-title::before` |
| 无障碍 | 2 个 skip-link、aria-label 全覆盖、`:focus-visible`、`prefers-reduced-motion` 全覆盖（本轮新增）|
| 字号 | 本轮修正 2 处 9px → 10px（`.expr-tip`、`.color-swatch span`），无 <10px 残留 |
| 响应式 | 720px 断点（单列/2 列/4 列切换）|

**备份**：`backup-ip/ip.round1.before.html`（原版 18574）、`ip.css.round1.before`（共享样式 5289）。

---

## 三、admin.html（后台管理）— 视觉升级

**现状基线**：功能完整但视觉朴素（13.5px、plain 按钮、flat panel）。
**本轮视觉升级**：
| 类别 | 改动 |
|---|---|
| 顶栏 | 渐变品牌字 + 统计徽标药丸（渐变数字 + 图标）+ 极光背景层 |
| 工具栏 | 筛选下拉 focus 光环、按钮渐变 primary + accent 描边 + hover 阴影 |
| 数据表 | 表头渐变背景（accent-soft）+ 行斑马纹 + hover 高亮 + **红旗/黄旗行左边框强调** + 行闪动 |
| 批量栏 | accent-soft 背景 + 药丸计数 |
| Toast | 玻璃拟态 + cubic-bezier 入场 |
| 模态框 | backdrop-blur + `modalIn` 弹性入场 + focus 光环 |
| 反馈面板 | 卡片 hover 高亮 + 渐变按钮 |
| 操作按钮 | `.mini` 系列（编辑/复制/删除）颜色区分 + hover 渐变 |
| 暗色模式 | 与主站一致的 dark 变量 |
| 字号/间距 | 13.5px 起、对齐 4/8/12 token、tabular-nums |

**备份**：`backup-admin/admin.html.before.html`、`admin.style.css.before`。
**回归**：`smoke-admin.mjs` ✅ · `admin.js` 语法 ✅ · `admin/style.css` 括号 = 0。

---

## 四、最终验证矩阵

| 文件 | 大小 | JS 语法 | CSS 括号 | </style> | </html> | id dup |
|---|---|---|---|---|---|---|
| `web/index.html` | 33067 | — | — | — | — | 176 ids, NONE |
| `web/todo.html` | 55096+ | ✅ 0 | ✅ 0 | 1 | 1 | 43 ids, NONE* |
| `web/ip.html` | 33709+ | ✅ 0 | ✅ 0 | 1 | 1 | 16 ids, NONE |
| `web/admin.html` | 9048 | — | — | — | — | — |
| `web/admin/style.css` | 15828 | — | ✅ 0 | — | — | — |
| `web/ip/ip.css` | 5289 | — | ✅ 0 | — | — | — |
| `web/css/style.css` | 101787 | — | ✅ 0 | — | — | — |
| `web/js/app.js` | — | ✅ 0 | — | — | — | — |
| `web/admin/admin.js` | — | ✅ 0 | — | — | — | — |

> `*` todo.html `dup ' + escapeHtml(todo.id) + '` 是 JS 模板字符串误报，运行时生成唯一 id。

- `scripts/smoke-app.mjs` → **主页面冒烟全部通过** ✅
- `scripts/smoke-admin.mjs` → **管理页冒烟全部通过** ✅

---

## 五、变更文件清单

| 文件 | 类型 |
|---|---|
| `web/index.html` | 复检精修（验证通过，无需改动） |
| `web/todo.html` | 多轮迭代升级 + 本轮补 skip-link + reduced-motion |
| `web/ip.html` | 子代理一轮 + 本轮补 9px→10px + reduced-motion |
| `web/admin/style.css` | 视觉升级重写（结构不动） |
| `backup-todo/todo.before-polish.html` | 原版备份 |
| `backup-todo/todo.round1.before.html` | 重写前备份 |
| `backup-ip/ip.round1.before.html` | 原版备份 |
| `backup-ip/ip.css.round1.before` | 共享样式备份 |
| `backup-admin/admin.html.before.html` | 原版备份 |
| `backup-admin/admin.style.css.before` | 原版备份 |

> **状态：四页整体完善完成，全部验证通过，交付。**

---

## 六、交互视觉 + 性能优化（本轮新增）

### 交互视觉

| # | 优化 | 文件 | 说明 |
|---|---|---|---|
| UX1 | **Material 涟漪反馈** | `style.css` + `app.js` | 卡片、筛选药丸（chip）点击时白色圆从点击点扩散淡出；todo 列表项、筛选按钮同样支持；`makeRipple(el, x, y)` 工具函数；`prefers-reduced-motion` 自动降级为 0.01s |
| UX2 | **卡片涟漪层级** | `style.css` | `.card > .card-head / .card-tags` 提升 z-index，涟漪不被 `::after` 覆盖 |
| UX3 | **todo 涟漪** | `todo.html` | `makeRipple` 工具函数 + CSS `@keyframes ripple-anim`；todo-item/筛选药丸点击有涟漪反馈 |

### 性能逻辑

| # | 优化 | 文件 | 说明 |
|---|---|---|---|
| P1 | **`tagHue` 单次哈希** | `app.js:cardHTML` | 原本每卡调用 `tagHue` 两次（`card-c` 和 `tag-c`），现缓存一次，1000+ 卡减少 50% 哈希调用 |
| P2 | **懒加载 favicon** | `app.js:iconHTML` + `lazyLoadIcons` | `src` 改为 `data-src` 占位，`IntersectionObserver`（rootMargin 200px）进入视口时再设 `src`；避免 1000+ 站点同时发起全量网络请求；无 IO 时兜底立即加载全部 |
| P3 | **`content-visibility: auto`** | `style.css:.card` | 视口外卡片跳过布局/渲染计算（已有，此轮确认保留）；配合 `contain-intrinsic-size: 0 64px` 预留高度避免回流 |
| P4 | **`mousemove` 节流** | `app.js:onMouseMove` | 高频显示器 mousemove 可达 200+/s，现通过 `mouseMovePending` 标志节流至每 rAF 帧只读一次坐标，避免反复写入全局变量 |
| P5 | **`decoding="async"`** | `app.js:iconHTML` | favicon 图片解码异步，不阻塞主线程渲染 |

### 本轮备份

| 备份 | 说明 |
|---|---|
| `backup-perf/app.js.before` | 优化前 app.js |
| `backup-perf/style.css.before` | 优化前 style.css |
| `backup-perf/todo.html.before` | 优化前 todo.html |
| `backup-perf/ip.html.before` | 优化前 ip.html |

---

## 七、Phase 0–3 全部 18 项最终验收

| # | 项 | 证据 | 状态 |
|---|---|---|---|
| 0 | HTML 重复块根除 | `index.html` 539 行、176 ids 零重复、备份 `backup-html-dup/index.html.bak` | ✅ |
| 1 | 4 级字号体系 | `--fs-hero 48 / --fs-title 15 / --fs-body 14 / --fs-caption 12` | ✅ |
| 2 | 卡片图标光晕 | `.icon` 内嵌光环（`style.css`）| ✅ |
| 3 | 卡片顶部渐变条 + tagHue 哈希 | `.card::before` + `tagHue()` + `--card-c` | ✅ |
| 4 | Hero 48px 统计大卡 + countUp | `.stat-num` 48px + `countUp()` rAF 动画 | ✅ |
| 5 | 卡片 hover 玻璃高光 | `.card:hover` `::after` + translate + shadow | ✅ |
| 6 | 推荐卡大视觉 | `.card.reco` 渐变描边 + ✨ + 12.5px 标题 | ✅ |
| 7 | 标签颜色化 | `.tag[style="--tag-c"]` + `tagHue()` | ✅ |
| 8 | 星标 burst | `.star.burst` + `@keyframes starBurst` | ✅ |
| 9 | 筛选 active 状态 | `.chip.active` 渐变 + box-shadow | ✅ |
| 10 | 空状态 SVG | `.empty-svg` 岛屿/罗盘手绘 SVG | ✅ |
| 11 | 页面 cross-fade | `fadeHide`/`fadeInView`/`showNow` + 单定时器 | ✅ |
| 12 | 统计页可视化 | `.stat-cards`/`.stat-bar` + `statBar()` | ✅ |
| 13 | 搜索面板键盘 | `.ac-focused` 高亮 + 上下键 + Enter 直达 | ✅ |
| 14 | 加载骨架屏 | `.skeleton`/`.skeleton-grid` + `@keyframes shimmer` | ✅ |
| 15 | Footer 品牌标语 | `.footer-slogan` 渐变文字 + i18n `slogan` | ✅ |
| 16 | 待办 / 屿咪完善 | todo.html 18+ 项 + ip.html 角色页完善 | ✅ |
| 17 | 字号/间距一致性 | 无 <10px 残留，token 统一 | ✅ |
| 18 | 最终回归 | smoke-app ✅ · smoke-admin ✅ · JS 语法 ✅ · CSS 括号 0 | ✅ |

**回归**：`smoke-app.mjs` ✅ · `smoke-admin.mjs` ✅ · `app.js` / `admin.js` 语法 0 · 7 CSS 括号全 0 · 4 HTML 无重复 id。
