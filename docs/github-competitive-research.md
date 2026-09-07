# 屿航 GitHub 竞品调研与升级规划

> 资料获取时间：2026-09-05 16:26（UTC+8）。本报告将事实、推断和建议分开；GitHub 动态指标不作为单一判断依据。

## 1. 项目现状判断

### 1.1 已验证事实

屿航定位为“本地优先、个人主页式的网址导航站”，目标是把常用网站集中到一个可个性化、可离线、可同步的数字入口。目标用户包括工具收藏型、效率工作者、个性化表达型、多设备同步型用户以及维护公共目录的站长。来源：[`README.md`](../README.md)、[`prd.md`](../prd.md)。

当前能力包括：4214 条左右站点数据（但 [`ROADMAP.md`](../ROADMAP.md) 仍写 1462 条，版本事实需确认）、21 类标签、模糊搜索与多引擎、收藏/最近访问/工作区、15 个本地工具、9 套主题×7 色、起始页、PWA/单文件离线、数据导入导出、Manifest V3 扩展 MVP、Supabase 登录和同步、后台管理、死链检查、反馈和回归/冒烟测试。来源：[`README.md`](../README.md)；网络增强和安全边界见 [`docs/integrations.md`](integrations.md)，媒体模块边界见 [`docs/media-tools.md`](media-tools.md)。

技术栈是原生 HTML/CSS/JavaScript、多页 HTML、UMD/普通 defer 脚本、localStorage、Node 构建脚本、Supabase 和 Service Worker；核心模块为 state/tools/search/cards/auth/nav/app/startpage。来源：[`ROADMAP.md`](../ROADMAP.md)。硬约束是双击即用、零构建、离线优先、行为不变和现有测试门槛。

### 1.2 推断：优势与短板

**优势**：部署门槛和离线能力优于大多数服务器 Dashboard；视觉/IP/起始页形成明显识别度；已有数据治理、schema、去重、死链检测和导入导出，已经不是单纯静态页面。

**短板**：功能范围横跨导航、起始页、工具、热搜、待办、排行、媒体工具，首要价值容易失焦；公共目录、私人链接、快捷链接和工作区的概念需要更明确分层；云端与本地合并策略需要版本、软删除和冲突处理；全局 UMD 模块和胶水层随功能扩张会提高维护成本；现有冒烟测试不能覆盖真实视觉、动效、移动端和无障碍体验。

**资料缺口**：缺少真实 DAU/留存、搜索成功率、游客/登录比例、同步失败率、扩展安装量、移动端数据、贡献者规模和商业目标；也缺少生产数据版本的明确说明。

## 2. 候选项目与筛选理由

| 项目 | 类型 | 选择理由 |
|---|---|---|
| [gethomepage/homepage](https://github.com/gethomepage/homepage) | 自托管首页/服务 Dashboard | 服务分组、配置模型、API/Widget 集成成熟，适合研究“链接→服务组件”升级 |
| [Lissy93/dashy](https://github.com/Lissy93/dashy) | 可定制个人 Dashboard | 主题、图标、状态检查、UI 编辑器和扩展思路有代表性 |
| [ohmzi/homarr](https://github.com/ohmzi/homarr) | 可视化 Dashboard | 拖拽配置、内置图标、集成和认证，适合研究普通用户编排体验 |
| [sissbruecker/linkding](https://github.com/sissbruecker/linkding) | 极简书签管理器 | 聚焦收藏、标签、搜索、扩展、API 和低维护成本 |
| [linkwarden/linkwarden](https://github.com/linkwarden/linkwarden) | 协作/保存/归档书签 | 适合研究备注、集合、协作、网页保存和 API 的中长期方向 |
| [pawelmalak/flame](https://github.com/pawelmalak/flame) | 自托管起始页 | 内置编辑器、应用/书签管理，适合比较可视化管理模式 |
| [bastienwirtz/homer](https://github.com/bastienwirtz/homer) | 静态服务器首页 | 极简、静态、易部署，与屿航零构建约束直接可比 |

补充资料：[Homepage 配置文档](https://deepwiki.com/gethomepage/homepage/4-configuration)、[Homarr 文档术语](https://homarr.dev/docs/1.38.0/getting-started/glossary/)、[Linkwarden OpenAPI](https://raw.githubusercontent.com/linkwarden/docs/refs/heads/main/openapi/linkwarden.yaml)、[Linkwarden 扩展](https://github.com/linkwarden/browser-extension)、[awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted)。

## 3. 横向对比

| 维度 | 屿航 | Homepage/Dashy/Homarr | Linkding/Linkwarden | Flame/Homer |
|---|---|---|---|---|
| 主定位 | 本地优先个人数字入口 | 服务器服务 Dashboard | 书签、内容保存和协作 | 起始页/应用入口 |
| 部署 | 双击、静态/PWA、可单文件 | 多数偏 Docker/服务端 | 通常需后端/容器 | 静态或容器，较简单 |
| 个性化 | 极强：主题、起始页、IP | Dashy/Homarr 较强，Homepage 偏配置 | 功能优先、克制 | 中等 |
| 组织方式 | 标签、收藏、工作区、快捷链接 | 分组、页面、Widget、服务 | 标签、集合、备注、归档 | 分组、应用、书签 |
| 扩展生态 | 扩展 MVP、Supabase、可选网络增强 | 服务 API、Widget、图标和配置生态 | 浏览器扩展、API、内容保存 | 主题/配置生态较轻 |
| 离线 | 核心体验强 | 依部署和服务可用性 | 通常依赖后端 | 静态入口较强 |
| 内容深度 | 名称、简介、标签为主 | 服务状态/数据组件 | 备注、阅读、注释、快照更强 | 主要是链接入口 |
| 增长机制 | QQ 群、反馈、排行、投稿邮件 | 开源社区与集成扩散 | 高频收藏、扩展和 API | 自托管传播 |

以上判断来自各项目的 GitHub 主页/README 与公开文档，获取时间同上；不是仅按 Star 排序。

## 4. 可学习特征

### Homepage：服务组件化

它把入口抽象成名称、地址、图标、分组、状态、Widget 和可选 API，而非简单 URL。适用于常用 SaaS/家庭服务较多的用户，能提升“打开后获得信息”的价值；迁移成本中等，风险是 API 鉴权、跨域、隐私和首屏变慢。屿航应先试点无敏感权限的站点可达性、RSS 或公共 GitHub 状态，不应整体复制复杂 Widget。

### Dashy：可分享的主题与配置

Dashy 的主题、图标、状态检查和 UI 编辑器说明：个性化可以成为可交换资产。屿航已有 JSON 导入导出，应把主题/布局设为带版本号的 schema，允许导入主题和工作区模板。迁移成本低到中等；必须做外链白名单和恶意 URL 检查。来源：[Dashy README](https://raw.githubusercontent.com/lissy93/dashy/master/README.md)。

### Homarr：可视化编排

拖拽布局、非 YAML 配置、集成和 Widget 适合工作区/快捷栏，不适合直接控制 4000+公共目录。迁移成本中等，风险是用户花时间“装修”而不是访问内容。来源：[Homarr GitHub](https://github.com/ohmzi/homarr)、[Homarr 文档](https://homarr.dev/docs/1.38.0/getting-started/glossary/)。

### Linkding：最短收藏路径

它的产品边界清晰，标签/搜索和浏览器扩展围绕“快速保存”服务。屿航应把扩展 MVP 做成自动读取标题和 URL、选标签、备注、离线暂存、登录同步、重复提醒的最短链路。迁移成本低到中等。必须把 `public_site`、`personal_link` 和 `submission` 分开，不能把私人链接污染公共目录。来源：[Linkding GitHub](https://github.com/sissbruecker/linkding)。

### Linkwarden：保存内容而不只是 URL

备注、阅读、集合、注释、快照、协作和 API 是长期方向，但网页抓取/归档涉及服务器、存储、版权、隐私和恶意内容风险。建议中期先做标题、描述、备注和“稍后阅读”，暂不做网页快照。来源：[Linkwarden GitHub](https://github.com/linkwarden/linkwarden)、[OpenAPI](https://raw.githubusercontent.com/linkwarden/docs/refs/heads/main/openapi/linkwarden.yaml)。

### Flame/Homer：简单仍是竞争力

两者证明起始页的核心是快、懂、改得动。屿航应保留双击运行、静态部署和单文件能力，把热搜、工具、排行、媒体模块置于二级入口。来源：[Flame](https://github.com/pawelmalak/flame)、[Homer](https://github.com/bastienwirtz/homer)。

## 5. 差距与机会

1. **定位**：需要从“功能集合”收敛为“个人数字入口”，把导航/我的入口/工具分为三层。
2. **数据**：站点数量不是壁垒，应增加官方标识、最后验证时间、语言/地区、替代链接、来源和失效历史。
3. **保存**：扩展是高频增长入口，需支持离线队列和一键保存。
4. **同步**：需要每条记录更新时间、schema 版本、软删除、操作日志和冲突提示。
5. **社区**：把邮件投稿升级为 URL 规范化、去重、分类建议、可达性检查、人工审核、发布的闭环。
6. **工程**：先固化 schema、模块 API、事件边界和浏览器测试，再评估局部构建化，不宜立即全量迁移框架。

## 6. 升级方向排序

| 优先级 | 方向 | 用户价值 | 可行性 | 成本友好度 | 预期收益 |
|---|---|---:|---:|---:|---:|
| P0 | 首屏信息架构收敛 | 5 | 5 | 5 | 5 |
| P0 | 公共目录/私人链接分层 | 5 | 4 | 4 | 5 |
| P0 | 扩展一键保存 | 5 | 4 | 4 | 5 |
| P0 | 站点新鲜度与质量标记 | 5 | 4 | 4 | 5 |
| P1 | 同步冲突/版本机制 | 5 | 4 | 3 | 5 |
| P1 | 工作区模板和分享配置 | 4 | 4 | 3 | 4 |
| P1 | 投稿审核流程 | 4 | 3 | 3 | 5 |
| P1 | 浏览器、移动端、无障碍测试 | 4 | 4 | 3 | 4 |
| P2 | 少量无敏感权限 Widget | 3 | 3 | 2 | 4 |
| P2 | 备注/稍后阅读 | 4 | 3 | 3 | 4 |
| P3 | 网页快照/全文归档 | 3 | 2 | 1 | 3 |

## 7. 分阶段行动方案

### 短期（0–2 个月）

- 默认突出搜索、分类、收藏；热搜/工具/排行降为二级入口；首次使用提供三步引导。
- 建立 `public_site`、`personal_link`、`workspace_item`、`shortcut` 四种实体。
- 扩展完成标题/URL/标签/备注/离线暂存/重复提示。
- 公共站点增加 `lastCheckedAt`、`status`、`official`、`source`、`alternativeUrls`。
- 增加 Playwright 或同类浏览器测试，覆盖搜索、键盘、移动端、离线和扩展主流程。

### 中期（2–6 个月）

- 工作区模板、布局和主题的版本化导入导出。
- 脱敏的只读导航空间分享。
- 结构化投稿、自动去重/校验、审核和发布状态。
- 同步版本号、软删除、本地备份和冲突提示。
- 站点备注、稍后阅读；试点 RSS 或公共 GitHub 状态。

### 长期（6–18 个月）

- 形成“每天打开的个人数字工作台”。
- 建设可信的中文公共数字资源目录：官方认证、专题、替代站点、失效历史和维护记录。
- 开放稳定 JSON schema、简单 API、扩展、主题包和工作区模板生态。
- 只有在用户数据证明需求后，才评估服务端归档、团队协作和商业化。

## 8. 首批执行任务

1. 解决 README/ROADMAP 站点数量冲突并加构建时版本标记。
2. 画出“找网站 / 我的入口 / 我的工具”信息架构并删减首屏干扰项。
3. 完成四类链接实体和 schema 迁移测试。
4. 为扩展增加一键保存、标签、备注和离线队列。
5. 为后台增加最后检测时间、失效状态、复核和变更记录。
6. 明确本地—云端合并与删除规则，增加导入前自动备份。
7. 建立核心指标：搜索成功率、首次点击时间、收藏率、扩展保存成功率、死链发现时间、同步冲突率。
8. 完成真实浏览器、移动端、减少动态效果和无障碍验收。

## 9. 不建议照搬

- 不要照搬 Homepage/Homarr 的完整服务器、Docker 和大量 Widget 体系，否则破坏屿航的双击即用和离线差异化。
- 不要立即做 Linkwarden 级网页抓取、快照和全文归档，先做备注和稍后阅读。
- 不要以堆 Widget、热搜或排行榜替代核心导航价值。
- 不要只按 Star 判断竞品，不要未经用户数据验证扩张商业化机制。
- 不要过早全面迁移 React/Vite；先治理 schema、状态边界、测试和数据质量。

## 10. 评估指标、范围与局限

建议持续观察：首屏到首次点击时间、搜索成功率、搜索后点击率、收藏后 7 日回访、移动端占比、公共站点可达率、死链发现时间、重复率、同步冲突率、扩展首次保存率、有效投稿率和审核时长。

搜索范围覆盖 GitHub 上的自托管首页、Dashboard、书签管理、浏览器扩展、网页保存和相关文档；样本标准是定位直接相关、资料可验证、具有产品或工程代表性，而非仅凭 Star。页面和仓库会持续变化，以上时间点是本次获取时间。未能验证真实活跃用户、留存、商业收入、部署规模、生产同步成功率和所有项目近期提交质量；也未进行统一部署、性能基准和用户访谈，因此结论是方向性研究，不是定量竞品排名。

## 11. 需要项目方补充的问题

1. 4214 与 1462 哪个是生产数据版本？
2. 首要目标是普通用户增长、个人效率还是公共目录建设？
3. 游客/登录用户比例、DAU、留存、搜索成功率和同步失败率是多少？
4. 扩展是核心增长入口还是辅助工具？
5. 私人链接与公共目录的权限边界是什么？
6. 是否有稳定的数据编辑和审核人员？
7. 是否必须长期保持纯前端、双击运行？
8. 是否计划多语言、海外用户或团队版？
9. 哪些现有模块可以隐藏、降级或移除？
10. 是否愿意通过主题、工作区模板、托管版或团队能力探索商业化？
