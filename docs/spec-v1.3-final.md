# 屿航 · 升级最终规格说明书（Spec v1.3 Final）

> **基于实际交付结果生成**（非计划稿）。三步走方案 100% 落地：Bug 修复 + Phase 1/2/3 共 18 项全部完成。
> 最终回归：`scripts/smoke-app.mjs` ✅ 全过 · `scripts/smoke-admin.mjs` ✅ 全过 · `app.js` 语法 ✅ · 4 个 CSS 括号平衡 ✅ · `index.html` 176 个 id 零重复 ✅。

---

## 〇、Bug 修复（根因修复）

`web/index.html` 整段 body 被重复粘贴一遍（第 540–1017 行为乱码化副本）。

| 用户现象 | 根因 | 修复 |
|---|---|---|
| 不止一个导航栏 | 两个 `<header>` / `#bottom-nav` / 所有元素叠两份 | 截断回干净 539 行 |
| 搜索框 / 快捷菜单点不动 | `#search-input`/`#fab-btn`/`#engine-btn` 等 id 重复，事件静默错位 | id 唯一，`getElementById` 精确命中 |

- 备份：`backup-html-dup/index.html.bak`
- 验证：`<html>×1`、`<body>×1`、`<script>×5`、**176 id 零重复**。

---

## 一、Phase 1 — 视觉速效（✅ 1–5）

| # | 项 | 实现 |
|---|---|---|
| 1 | 4 级字号体系 | `:root` token：`--fs-hero 48px / --fs-title 15px / --fs-body 14px / --fs-caption 12px` |
| 2 | 卡片图标光晕环 | `.icon::before` 内嵌呼吸光环（随主题 `--accent`） |
| 3 | 卡片顶部渐变条 | 按首个标签色编码；新增 `tagHue()` 哈希（同标签全站同色），注入 `--card-c` |
| 4 | Hero 统计 48px 大卡 | 三栏 grid：图标 🏝️/🏷️/⭐ + 48px 渐变大数字 + 副标题；`animateCount` count-up 保留 |
| 5 | 卡片 hover | 玻璃高光扫过 `::after` + 阴影加深 + 微倾 `rotate(-0.5deg)` |

---

## 二、Phase 2 — 骨架升级（✅ 6–10 + 附）

| # | 项 | 实现 |
|---|---|---|
| 6 | 推荐卡视觉焦点 | `.card.reco`：渐变描边 + 柔和高光 + ✨ 标记 + 12.5px 标题 |
| 7 | 标签颜色化 | 每个 `.tag` 按自身名着色：色点 + 浅色底（注入 `--tag-c`） |
| 8 | 星标 burst | 点收藏触发 `.star.burst` 爆发 + 光晕（450ms） |
| 9 | 筛选 active 状态 | 渐变背景 + 浮起 + 类目色点提亮为白 + box-shadow 过渡 |
| 10 | 空状态 SVG | `🔭` → 手绘岛屿/罗盘 SVG 插画（随主题色），`.empty-svg` |
| 附 | 页面 cross-fade | 旧视图淡出 + 目标视图淡入（`fadeHide`/`fadeInView`，单定时器可取消，`exitAllViews` 立即显形防滞留） |

---

## 三、Phase 3 — 精修（✅ 11–18）

| # | 项 | 实现 |
|---|---|---|
| 11 | 统计页可视化 | 四卡图标 ⭐👁📁🗂 + 26px 渐变大数字 + `countUp` 滚动；Top6 加 🥇🥈🥉 序号勋章；标签柱按自身色渐变填充；分节左侧渐变竖条 |
| 12 | 搜索面板视觉层级 + 键盘高亮 | 联想项图标槽 `.ac-ico`；直达项 `.ac-direct` 渐变徽章；`.ac-focused` 键盘高亮（accent 描边 + 阴影 + 平移） |
| 13 | 加载骨架屏 | 通用 `.skeleton`/`.skeleton-grid` shimmer 组件（200% 背景位移扫光）；热搜加载态替换为 5 列骨架 |
| 14 | Footer 品牌标语 | 渐变文字标语行 `屿航 · IsleSail · 探索每一座数字岛屿`（`background-clip:text`），新增 `slogan` i18n |
| 15 | 设置界面 | 分组 `.s-group` 玻璃卡片 + 标签左侧渐变竖条；`.switch` 弹跳小球（cubic-bezier 1.56）；`.color-dot` 激活环 + ✓ 标记 + 缩放；`.style-opt` 更精致（激活 accent 描边阴影） |
| 16 | 待办 / 屿咪（全面升级） | ① 顶栏渐变品牌字；② 统计四卡图标 📋✅⏳🔴 + 渐变大数字 + 高优/完成差异化配色 + hover 浮起；③ 进度条左侧渐变竖条 + 完成进度标签 + 弹性填充 + accent 发光；④ 表单 focus 光环；⑤ 筛选药丸行 + 渐变 active + 分隔线 + 「清空已完成（N）」；⑥ 卡片优先级色左边框（高优发光）+ 软背景 tint + 入场交错动画 + focus-visible；⑦ checkbox 弹跳✓；⑧ 完成划线淡出；⑨ **软删除撤销**（5s toast + 进度条 + 撤销按钮）；⑩ `countUp` 数字滚动；⑪ 完成触发 `confettiBurst()` 彩纸（24 粒子）；屿咪表情状态保留 |
| 17 | 字号/间距一致性 | 全表巡检：无 <10px 残留字号；卡片标题 ≥12.5px、标签 ≥10px、统计 48px 达标 |
| 18 | 最终回归 | `smoke-app.mjs` ✅ · `smoke-admin.mjs` ✅ · 4 HTML 结构干净 · 5 JS 语法 ✅ · 4 CSS 括号平衡 ✅ |

---

## 四、新增 / 改动的共享工具

| 工具 | 用途 |
|---|---|
| `tagHue(name)` | 标签名 → 稳定 `"hue sat%"` 字符串（同标签全站同色） |
| `tagHsl(name, light)` | 返回完整 `hsl(...)` 字符串 |
| `countUp(el)` | 统计页数字滚动（cubic-bezier easeOut，900ms） |
| `.skeleton` / `.skeleton-grid` | 通用加载骨架 shimmer 组件 |
| `confettiBurst(x,y)` | 待办完成彩纸庆祝 |
| `fadeHide` / `fadeInView` | 视图 cross-fade（单定时器可取消） |
| `softDeleteTodo` / `showUndo` / `purgeTrash` | 待办软删除撤销（5s toast） |
| `countUp`（todo 版） | 待办统计数字滚动（500ms） |

---

## 五、变更文件清单

| 文件 | 变更类型 |
|---|---|
| `web/index.html` | 修复重复块；hero-stats 大卡；footer 标语 |
| `web/css/style.css` | token、卡片/图标/标签/统计/hero/空状态/推荐卡/搜索面板/骨架/视图过渡/设置页/统计页/footer |
| `web/js/app.js` | tagHue/tagHsl/countUp/fadeHide/fadeInView；卡片色注入；星标 burst；cross-fade；空状态 SVG；统计页可视化；搜索 ac 图标槽；slogan i18n |
| `web/todo.html` | 全面升级：顶栏渐变字、统计四卡图标+差异化配色+countUp、进度条标签+发光、表单 focus 环、筛选药丸行+「清空已完成」、卡片优先级色边框+入场交错+focus-visible、checkbox 弹跳✓、软删除撤销 toast、confettiBurst 彩纸 |
| `docs/spec-upgrade-v1.2.md` | 过程稿（已 supersede 由本文件替代） |
| `backup-html-dup/index.html.bak` | 损坏 index.html 备份 |
| `backup-todo/todo.before-polish.html` | todo 升级前备份 |

**未改动**：数据管线、Supabase 云同步、登录/收藏/点击统计/热搜/工具箱/搜索联想/快捷键/拖拽/FLIP 等全部原逻辑。

---

## 六、验证记录

- `node --check web/js/app.js` → 0
- `scripts/smoke-app.mjs` → 主页面冒烟全部通过
- `scripts/smoke-admin.mjs` → 管理页冒烟全部通过
- `web/css/style.css` / `startpage.css` / `ip/ip.css` / `admin/style.css` → 括号均 0
- `web/index.html` → 176 id，dup NONE；`<html>×1`、`<body>×1`、`<script>×5`
- `todo.html` → 内联 JS 语法 0，CSS 括号 0，`</style>` 闭合 1

> **状态：三步走方案全部完成，交付。**
