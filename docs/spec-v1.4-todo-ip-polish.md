# 屿航 · 待办 & 屿咪 IP 完善规格（Spec v1.4）

> 范围：`web/todo.html`（待办清单）与 `web/ip.html`（屿咪 IP 角色页）。
> 目标：把这两页从"能用"提升到"精致、有角色魅力、交互丰富"的成熟页面。**每页至少两轮迭代**，每轮独立备份 + 验证。

---

## 〇、todo.html 完善（多轮迭代）

### 已完成基线（上一轮重写，作为迭代起点）
- 顶栏渐变品牌字 / 统计四卡（📋✅⏳🔴 + 渐变大数字 + countUp）/ 进度条（渐变竖条 + 完成标签 + 弹性填充发光）
- 表单 focus 光环 / 筛选药丸行 + 渐变 active + 「清空已完成（N）」
- 卡片优先级色左边框 + 入场交错 / checkbox 弹跳 ✓ / 完成划线淡出
- **软删除撤销**（5s toast + 进度条 + 撤销按钮）/ 完成彩纸 24 粒子
- 备份起点：`backup-todo/todo.round1.before.html`

### 待完善的提升方向（迭代轮次在此推进）
| # | 方向 | 待办 |
|---|---|---|
| T1 | 拖拽排序 | 已完成项沉底后仍可拖拽调整待办顺序，状态持久化到 localStorage |
| T2 | 批量操作 | 完成态批量勾选 / 批量删除已完成 |
| T3 | 完成率趋势 | 7 天完成数轻量趋势（可用 sparkline 字符或小柱） |
| T4 | 添加成功反馈 | 新项滑入 + 轻提示，而非静默 |
| T5 | 暗色模式一致性 + 视觉呼吸 | 背景层次、卡片微动效、字号层级巡检 |
| T6 | 键盘/无障碍 | 方向键切项、Enter 操作、Delete 删除、`:focus-visible` 全覆盖 |
| T7 | 空状态 / 屿咪呈现丰富度 | 空态更有内容与角色互动 |

### 验证标准（每轮必过）
- CSS 括号 = 0；内联 JS `node --check` = 0；`</style>` / `</html>` 各 1 次；无真实重复 id
- 回归：原有添加/完成/删除/筛选/标签/屿咪/持久化/彩纸 全部保持工作

---

## 一、ip.html 完善（多轮迭代）

### 现状基线（迭代起点）
| 区块 | 现状 |
|---|---|
| Hero | 大字"屿咪·Yumi" + 副标题 + 240px xlarge 角色 + 漂浮/眨眼 |
| 角色卡 | Species / Role / Color / Tail 四格 info-grid + trait 标签 |
| 引言 | quote-box 一句碎碎念 |
| 表情图鉴 | 5 个表情 expr-card 网格（idle/happy/wave/surprised/sleep） |
| 互动区 | 大角色 + 5 个 interact-btn 切换表情 |
| 色卡 | 7 个主站强调色色块 |
| Footer | 屿咪一句 + 待办/主页链接 |
| 数据 | 表情数组 `EXPRESSOINS`（注意该变量名拼写为 `EXPRESSOINS`，是既有拼写，保留） |

### 待完善的提升方向（迭代轮次在此推进）
| # | 方向 | 待办 |
|---|---|---|
| IP1 | 整体视觉包装 | 让"屿咪专属页"更有角色页品质感（背景层次、极光氛围、暗色一致） |
| IP2 | 表情/互动动效 | 切换更平滑、点击反馈、图鉴卡 hover 微动 |
| IP3 | 内容层次 | 角色背景故事 / 能力特性 / 性格标签丰富化，不只是一张卡 |
| IP4 | 与主站一致性 | 玻璃拟态、accent 渐变、字号层级对齐主站 |
| IP5 | 键盘/无障碍 | 焦点管理、`aria`、`prefers-reduced-motion` 尊重 |
| IP6 | 屿咪 IP 资产复用 | ip.css 是共享样式，改它时确认不影响 todo 与主站引用 |

### 验证标准（每轮必过）
- CSS 括号 = 0；JS `node --check` = 0；结构闭合、无重复 id
- 回归：表情图鉴、互动切换、屿咪悬浮/眨眼 全部保持工作；`ip.css` 改动不破坏 todo.html 与 index.html 的引用

---

## 二、执行方式

- 两页各由独立子代理并行推进，每页 **至少两轮**迭代；每轮先备份再改，改完验证。
- 子代理交付后，我统一做 **review + 全量回归**（smoke-app / smoke-admin / JS 语法 / 结构 / ip.css 跨页影响检查）。
- 若某页在两轮后仍有明显缺漏，追加第 3 轮直到达到"完善"标准。

---

## 三、变更文件清单

| 文件 | 类型 |
|---|---|
| `web/todo.html` | 多轮迭代升级 |
| `web/ip.html` | 多轮迭代升级 |
| `web/ip/ip.css` | 如需调整共享 IP 样式（谨慎，需验证跨页影响） |
| `backup-todo/todo.roundN.before.html` | 每轮备份 |
| `backup-ip/ip.roundN.before.html` | 每轮备份 |

## 四、最终回归（全部迭代结束后执行）

- `scripts/smoke-app.mjs` ✅ · `scripts/smoke-admin.mjs` ✅
- `web/js/app.js` `node --check` ✅ · 各 CSS 括号 = 0
- `index.html` / `todo.html` / `ip.html` 结构干净、无重复 id
- `ip.css` 改动跨页影响：`todo.html` 屿咪 + `index.html` 引用处不受损

> 状态：待执行（子代理并行推进中）。
