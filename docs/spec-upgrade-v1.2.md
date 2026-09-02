# 屿航 · 升级规格说明书（Spec v1.2）

> 基于「诊断完成」三步走方案落地。**Phase 1、Phase 2 已完成并验证**；Phase 3 待开发。
> 冒烟测试 `scripts/smoke-app.mjs`：全部通过。JS 语法 / CSS 括号平衡 / HTML 结构（176 id 零重复）均已校验。

---

## 一、已完成的修复（Bug 0）

**根因**：`web/index.html` 整个 body 被重复粘贴一遍（第 540–1017 行是乱码化重复副本）。

| 用户现象 | 根因 | 修复 |
|---|---|---|
| 不止一个导航栏 | 两个 `<header>` / `#bottom-nav` / 所有元素叠两份 | 截断回干净 539 行 |
| 搜索框 / 快捷菜单点不动 | `#search-input`/`#fab-btn`/`#engine-btn` 等 id 重复，事件静默错位 | id 去重，`getElementById` 唯一命中 |

- 备份：`backup-html-dup/index.html.bak`
- 验证：`<html>×1`、`<body>×1`、`<script>×5`、**176 个 id 零重复**。

---

## 二、Phase 1 — 视觉速效（✅ 完成）

| 项 | 实现 | 文件 |
|---|---|---|
| 1. 字号 4 级体系 | token：`--fs-hero 48px / --fs-title 15px / --fs-body 14px / --fs-caption 12px` | `css/style.css` `:root` |
| 2. 卡片图标光晕环 | `.icon::before` 内嵌呼吸光环（随主题 `--accent`） | `css/style.css` |
| 3. 卡片顶部渐变条 | 按首个标签色编码；新增 `tagHue()` 哈希（同标签全站同色），注入 `--card-c` | `js/app.js` + `css/style.css` `.card::before` |
| 4. Hero 统计 48px 大卡 | 三栏 `grid`：图标 🏝️/🏷️/⭐ + 48px 渐变大数字 + 副标题；count-up 动画保留 | `index.html` `.hero-stats` / `css` `.stat` |
| 5. 卡片 hover | 玻璃高光扫过 `::after` + 阴影加深 + 微倾 `rotate(-0.5deg)` | `css/style.css` `.card:hover` |

副作用防护：色值改用单变量 `--card-c`(hue sat%) + `color-mix`，避免 `hsl` 多参数拼接在旧环境失效；`style.setProperty` 改纯 `style=` 字符串，兼容冒烟桩。

---

## 三、Phase 2 — 骨架升级（✅ 完成）

| 项 | 实现 | 文件 |
|---|---|---|
| 6. 推荐卡视觉焦点 | `.card.reco`：渐变描边 + 柔和高光 + ✨ 标记 + 12.5px 标题 | `js` `cardHTML` `.replace` / `css` `.card.reco` |
| 7. 标签颜色化 | 每个 `.tag` 按自身名着色：色点 + 浅色底（注入 `--tag-c`） | `js/app.js` `cardHTML` / `css` `.tag[style*="--tag-c"]` |
| 8. 星标 burst | 点收藏触发 `.star.burst` 爆发 + 光晕（450ms） | `js` grid click / `css` `@keyframes starBurst` |
| 9. 筛选 active 状态 | 渐变背景 + 浮起 + 类目色点提亮为白 + box-shadow 过渡 | `css` `.chip.active` |
| 10. 空状态 SVG | `🔭` → 手绘岛屿/罗盘 SVG 插画（随主题色） | `js` `renderGrid` empty / `css` `.empty-svg` |
| 附. 页面 cross-fade | 旧视图淡出 + 目标视图淡入（`fadeHide`/`fadeInView`，单定时器可取消） | `js` `enterView/exitAllViews` / `css` `.rank-view/.grid` opacity transition |

---

## 四、下一步开发计划（Phase 3 — 精修，进行中）

> 目标：把成熟产品感补齐，并覆盖用户点名要纳入 spec 的 **待办(屿咪)** 与 **设置界面**。

| # | 项 | 验收标准 |
|---|---|---|
| 11 | 统计页数据可视化增强 | 收藏/点击/标签分布：渐变填充柱 + 数字 count-up；Top6 榜单更醒目 |
| 12 | 搜索面板视觉层级 + 键盘导航高亮 | 联想下拉项 hover/focus 高亮更清晰；`/` 聚焦反馈；直达项视觉区分 |
| 13 | 加载骨架屏 | 替换「加载中…」为玻璃卡片骨架占位（网格状闪烁） |
| 14 | Footer 品牌标语升级 | 标语渐变文字 + 群号/免责层级更清晰 |
| 15 | **设置界面（settings）** 视觉升级 | 分组间距/字号层级统一；开关(switch)动效；导出/导入按钮视觉重点；风格预览更精致 |
| 16 | **待办清单（todo.html / 屿咪）** 升级 | 卡片视觉深度（按优先级色编码）；屿咪表情状态更丰富；完成庆祝动画 + 进度可视化 |
| 17 | 全局字号/间距一致性巡检 | 卡片标题 ≥12.5px、标签 ≥10px、统计数字 48px；统一 4/8/12/16/24 间距 |
| 18 | 最终回归 | `smoke-app.mjs` 全过 + HTML 结构无重复 + 关键交互（搜索/收藏/筛选/视图切换）逐项点验 |

**流程**：每做完一小块 → 跑 `node --check` + CSS 括号 + `smoke-app.mjs` 验证 → 再进入下一项。全部结束后做**两轮最终 review**（一轮功能点验、一轮视觉一致性），并根据推进情况动态调整。

---

## 五、文件结构（本次变更涉及）

- `web/index.html` — hero-stats 大卡、空状态由 JS 注入
- `web/css/style.css` — token、卡片/图标/标签/统计/hero/空状态/推荐卡/视图过渡
- `web/js/app.js` — `tagHue()`、卡片色注入、星标 burst、cross-fade、空状态 SVG

未改动（保持原功能）：数据管线、Supabase 云同步、登录/收藏/点击统计/热搜/工具箱/搜索联想/快捷键/拖拽/FLIP 等全部原逻辑。
