# 屿航 · 架构说明

> 面向维护者的技术架构与数据管道说明。面向最终用户的项目介绍见 `README.md`。

---

## 架构总览

屿航是一个本地优先的网址导航站。前端由 6 个 UMD 模块加一个胶水层组成，全部以经典 `<script defer>` 加载，不依赖任何构建工具——双击 `web/index.html` 即可运行。

### 前端模块

| 模块 | 职责 | 全局接口 |
|------|------|----------|
| `state.js` | 应用状态收口（账户 / UI 设置 / 历史 / 视图标记）+ localStorage 持久化 | `window.YHState` |
| `tools.js` | 15 个本地小工具 + 快捷链接 | `window.YHTools` |
| `search.js` | 站内模糊搜索 + 多引擎直达 + 联想 + 搜索历史 | `window.YHSearch` |
| `cards.js` | 卡片筛选 / 推荐 / HTML / FLIP 动效 | `window.YHCards` |
| `auth.js` | 登录 / 注册 / 改密 + 收藏管理 + Supabase 云同步 | `window.YHAuth` |
| `nav.js` | 视图切换 + 全站排行 + 全网热搜 + 悬浮球 + 底部导航 | `window.YHNav` |
| `app.js` | 胶水层：分类导航 / 筛选条 / 工作区 / 弹窗 / 背景动效 / 初始化编排 | — |

模块间通过 `init(opts)` 注入依赖。`opts` 含 `S`（状态对象）、`t`（i18n）、DOM 引用、跨模块接口（如 `YHCards.render`），以及分类 / 筛选状态的 getter / setter。`app.js` 在初始化时按依赖序调用各 `YH*.init()`。

### 加载顺序（`web/index.html`）

```
sites.js → sites-lib.js → config.js → state.js → tools.js
       → search.js → cards.js → auth.js → nav.js → app.js → startpage.js
```

均带 `defer`，按文档顺序执行。`app.js` 最后加载，在其初始化段依次调用各模块的 `init()`。

---

## 数据管道

| 节点 | 说明 |
|------|------|
| `data/sites.tsv` | 权威数据源，当前构建为 4214 条站点（以 `web/data/sites.js` 的 `SITES_META.total` 和构建测试为准），8 列制表符分隔，UTF-8 |
| `web/js/sites-lib.js` | 公共数据模块（浏览器 + Node 双端，置于 `web/js` 保证站点自包含）：TSV 解析、网址修正、去重合并、多标签智能分类、序列化 |
| `scripts/build.mjs` | CLI 构建入口（复用 `sites-lib.js`），清洗 + 分类 + 生成 `web/data/sites.js` 与 `data/sites.json` |
| `web/data/sites.js` | 构建产物，主页面读取它渲染卡片 |
| `data/sites.json` | 同源派生，参考用 |

数据链路自洽：当前 TSV、`sites.js`、`sites.json` 均为 4214 条；构建元数据含 `catalogVersion`，`test-roundtrip.mjs` 会验证它们与当前 TSV 的构建结果一致。历史 1462 条基线仅在目录版本相同时参与逐字节比较，避免目录升级被误报为构建回归。

---

## 测试

| 套件 | 命令 | 覆盖 |
|------|------|------|
| 主页面冒烟 | `node scripts/smoke-app.mjs` | 启动不崩 / 侧栏入口 / 热搜视图断网降级 / 工具箱渲染 / 多引擎搜索 / 站内搜索恢复 / 视图退出 / 导出反馈 等 30+ 项 |
| 搜索回归 | `node scripts/test-search.mjs` | 精确 / 模糊 / 错别字容错 / 多标签叠加筛选 / 收藏视图 / 随机抽样 |
| 数据 roundtrip | `node scripts/test-roundtrip.mjs` | sites.js / sites.json 与基线逐字节一致 + tsv 导出再生成自洽（1462 条） |
| 管理页冒烟 | `node scripts/smoke-admin.mjs` | 列表渲染 / 搜索过滤 / 增删改 / 导出 / 撤销 / 批量操作 等 24 项 |

---

## 设计约束

- **双击即用**：经典 `<script defer>` UMD，零构建工具（不用 webpack / vite / rollup）。
- **行为不变**：重构只做解耦，不改功能；四套测试是验收门槛。
- **数据管道稳定**：`sites-lib.js` 与 `build.mjs` 不在重构范围。
- **Supabase 按需懒加载**：离线即可浏览 / 搜索 / 收藏 / 工具，登录 / 云同步 / 排行 / 反馈在使用时才动态加载 supabase-js（优先国内可达 CDN）。

---

## 邮箱与账号

| 用途 | 邮箱 | 位置 |
|------|------|------|
| 注册申请收件 | `jubei516206@163.com` | `web/js/auth.js`（注册面板 mailto） |
| 站内反馈收件 | `jubei516206@163.com` | `web/js/app.js` 的 `CONTACT_EMAIL` |
| 站长登录校验 | `xvwang99@126.com` | `web/admin/admin.js` 的 `ADMIN_EMAIL` + `scripts/supabase-schema.sql` 的站长 JWT 校验函数 |

> 反馈与注册申请发往 `jubei516206@163.com`，后台管理页用 `xvwang99@126.com` 登录才能查看反馈记录。若两者非同一人，反馈将无人可见——改任一邮箱需同步核对另一处。

---

## 部署

- `web/` 目录自包含，上传整个目录即可部署（HTTP 部署后 PWA Service Worker 生效）。
- `scripts/package.mjs` 打包为 `dist/index.html` 单文件（约 836 KB），离线可用。
- `scripts/compress.mjs` 为 `web/` 与 `dist/index.html` 生成 `.gz` / `.br`，nginx 开 `gzip_static` / `brotli_static` 后主数据约省 80%。
- 想完全零外链：下载 supabase-js 的 UMD 包保存为 `web/js/vendor/supabase.js`，再运行 `package.mjs` 会一并内联（下载地址见 README）。

---

## 后续候选

- `dist/index.html` 体积优化（gzip 实测、脚本 defer、懒加载梳理）。
- 链接实体 Schema V2：已定义公共站点、个人链接、工作区项、快捷方式、投稿的类型/可见性/状态/版本字段；下一步接入主站保存与云同步冲突策略。
- 移动端 / 无障碍真机 / 真浏览器验证（冒烟测试覆盖逻辑，不覆盖像素视觉与动效流畅度）。
- 单文件零外链（supabase UMD 内联）。
