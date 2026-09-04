# 屿航 · 竞品功能拆解与用户调研报告

> 角色：项目经理 + 用户调研员
> 调研对象：屿航（个人导航站）· 屿事（待办清单）· 屿咪（虚拟角色 IP 页）
> 方法：公开资料检索 + 竞品功能逐项拆解 + 用户研究文献/调研数据引用
> 说明：文末统一标注来源。标 ✓ 的数字/结论有可追溯来源；标（经验判断）的是基于同类产品通用形态的分析，未经单一来源证实。

---

## 一、调研范围与品类划分

屿航是一个复合系统，横跨三个互相重叠的品类。调研必须分品类进行，否则会漏掉各自赛道用户的真实期待：

| 品类 | 屿航对应模块 | 对标产品 |
|---|---|---|
| A. 个人导航站 / 浏览器新标签页 | 主站（搜索、站点收藏、分类标签、热度筛选） | 8xuu、Infinity、iTab、Quick Tabs、Tabliss、Fossify Startpage、极空间 HomePage |
| B. 待办清单 / 任务管理 | 屿事（todo.html） | Todoist、TickTick、Tody、taskcafe、Any.do、Wekan、Things |
| C. 虚拟角色 / IP 形象页 | 屿咪（ip.html） | Chiikawa 官方角色站、泡泡玛特官网、参与型角色生态站、互动 WebGL 角色站 |

---

## 二、品类 A：个人导航站 / 浏览器新标签页

### A1. 竞品清单

| 产品 | 形态 | 定位 |
|---|---|---|
| 8xuu（8xbbs） | 网页主页 | 国内老牌浏览器主页导航，海量免费导航站可自选 |
| Infinity | 浏览器扩展 | 国内最流行的新标签页，搜索 + 插件（日历/书签/便签/番茄钟） |
| iTab | 浏览器扩展 | 与 Infinity 同类，强调极简 + 搜索聚合 |
| AItab | 浏览器扩展 | 搜索聚合 + 壁纸 + 资讯 |
| Quick Tabs | Chrome 扩展 | 轻量快捷标签页（已下架/不可用） |
| WeTab | Chrome 扩展 | 新标签页，用户评论可查 |
| X New Tab Page | Chrome 扩展 | 新标签页，评论区可见 |
| Tabliss | 开源网页 | 高度可定制，支持本地/自建 |
| Fossify Startpage | 开源安卓应用 | 极简主页，本地优先 |
| 极空间 HomePage | NAS 应用 | 家庭/私人网络导航站，强调自托管 |

### A2. 功能拆解矩阵

| 功能 | 8xuu | Infinity/iTab | Tabliss | Quick Tabs | Fossify | 极空间 HomePage | **屿航现状** |
|---|---|---|---|---|---|---|---|
| 核心搜索框 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 多搜索引擎切换 | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓（站内/百度/谷歌/必应/B站/知乎/GitHub） |
| 收藏站点网格 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 站点分类 | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| 站点标签 | ✗ | ✗ | 部分 | ✗ | ✗ | ✓ | ✓ |
| 热度/访问频次排序 | ✓ | 部分 | ✗ | ✗ | ✗ | 部分 | ✓（热度筛选） |
| 时钟/日期组件 | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | 缺口 |
| 天气组件 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | 缺口 |
| 书签一键导入（从浏览器） | ✗ | ✓ | 部分 | ✗ | ✗ | ✗ | 缺口 |
| 壁纸/背景换肤 | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | 缺口 |
| 暗色模式 | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ |
| 多语言 | 部分 | 部分 | ✓ | ✗ | ✓ | 部分 | ✓（中/EN） |
| 键盘快捷键 | ✗ | 部分 | ✗ | ✗ | ✗ | ✗ | ✓（/ 聚焦、Esc 等） |
| 待办/便签内置 | ✗ | ✓（便签） | ✓ | ✗ | ✗ | ✗ | ✓（屿事 + 屿咪联动） |
| 登录 / 跨设备同步 | ✗ | ✗ | 部分 | ✗ | ✗ | ✓ | ✓（Supabase） |
| 数据导出/备份 | ✗ | 部分 | ✓ | ✗ | ✓ | ✓ | ✓（本地数据备份 favsAll/clicksAll/workspacesAll/personalSites/settings + 屿事独立备份） |
| 隐私（本地/自托管） | 一般 | 弱（第三方主页） | ✓ 可自建 | 弱 | ✓ 本地 | ✓ 自托管 | ✓（本地 + 可选云同步） |

### A3. 差距结论（按用户价值排序）

1. **书签一键导入** —— 这是导航站类用户最先卡住的门槛。所有自建导航页都面临"从 0 建库"，同类产品里只有 Infinity 类做成熟。屿航当前只能手动添加。
2. **访问频次/使用率统计** —— 用户会想知道"我这个月最常打开哪个站"。这是站点数据的自然延伸，也是"我的主页"区别于"通用导航站"的关键。
3. **时钟 / 天气 / 日历小组件** —— 行业标配（8xuu、Infinity、Tabliss 全有）。屿航顶部只有搜索，视觉上偏空。
4. **已核查（原判断作废）**：主站的本地数据备份/恢复已实现——`btn-export-data` / `btn-import-data` 覆盖 `favsAll`、`clicksAll`、`workspacesAll`、`personalSites`、`settings`；且已支持 Netscape HTML 格式的浏览器书签双向互通（`btn-import-bm` 导入、`exportBookmarksHtml` 导出）。数据资产不对称的问题**不存在**。剩余小缺口仅是：书签导入时 `brief`/`category` 为空，只能靠标签 `['书签']` 归类。
5. **壁纸/背景** —— 审美层需求，优先级低但用户呼声高。

### A4. 用户调研与研究发现

- **✓ 新标签页推荐会显著抑制探索性浏览。** Bae 等基于实验的研究发现，新标签页上的推荐会把用户浏览强烈集中到"熟悉来源"，明显压制探索性浏览行为。→ 对屿航的启示：**站点热度排序是把双刃剑**，长期只看热点会收窄用户的信息面；建议保留"新/冷门"入口，热度作为可选视图而非唯一视图。来源：[arXiv 1812.06525](https://ar5iv.labs.arxiv.org/html/1812.06525) / [ACM WebSci 2019](https://dl.acm.org/doi/10.1145/3292522.3326011)
- **✓ 第三方主页插件存在安全信任危机。** V2EX 上出现"用了多年的 Infinity 新标签页疑似被投毒"的公开讨论。→ 这是"自托管个人主页"赛道的核心卖点：屿航是可自管的，用户数据与代码都在自己手里。来源：[V2EX](https://global.v2ex.co/t/1176399?p=1)
- **✓ 行业史脉络：新标签页经历了三代演化（Infinity → iTab → AItab），竞争核心始终是"搜索聚合 + 个性化组件"。** 来源：[极客公园](https://www.geekpark.net/news/368506)
- **✓ 用户调研数据渠道可查：Quick Tabs、WeTab、X New Tab Page 的 Chrome 评论区都能拉到真实用户抱怨（性能、广告、隐私）。** 来源：[Quick Tabs](https://chromewebstore.google.com/detail/quick-tabs/jnjfeinjfmenlddahdjdmgpbokiacbbb) / [WeTab reviews](https://chrome-stats.com/d/aikflfpejipbpjdlfabpgclhblkpaafo/reviews) / [X New Tab reviews](https://chrome-stats.com/d/cbmbfafhdccfgdgnbkgogehiklmemkoh/reviews)
- **✓ 竞品对比文章集中批评点：功能臃肿、广告多、数据上传、加载慢。** 来源：[unstore.io 桌面新标签页扩展对比](https://unstore.io/discover/best-apps-for-browser-new-tab-customization-desktop) / [startpagehq Tabliss alternative](https://startpagehq.com/alternatives/tabliss)
- **✓ NAS/自托管导航站（极空间 HomePage）正在成为家庭与个人私有导航的主流形态，强调"私有部署 + 全家共享"。** 来源：[什么值得买](https://post.smzdm.com/p/al80g920/)
- **✓ 需求侧研究采用 Kano 模型对导航系统功能分级（基本型/期望型/兴奋型）。** → 方法可借鉴：屿航后续调研也可用 Kano 模型给功能分级。来源：[KCI 论文](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002038933)
- **✓ 国内导航站用户需求已有公开调研资料可参考。** 来源：[导航网站用户需求调研](https://ln.zx.zbj.com/baike/24469.html)

---

## 三、品类 B：待办清单 / 任务管理

### B1. 竞品清单

| 产品 | 形态 | 定位 |
|---|---|---|
| Todoist | SaaS + 多端 | 任务管理标杆，自然语言输入、快捷键体系完整 |
| TickTick（滴答清单） | SaaS + 多端 | 中文市场主流，日历 + 番茄钟 + 清单一体 |
| Tody | 移动应用 | 极简、无广告、轻量 |
| taskcafe | 开源看板 | 看板式任务管理，自托管 |
| Any.do | SaaS | 自然语言 + 日程提醒 |
| Microsoft To Do / Google Tasks | 平台内置 | 生态绑定 |
| Wekan | 开源自托管 | 团队看板 |

### B2. 功能拆解矩阵

| 功能 | Todoist | TickTick | Tody | taskcafe | **屿事现状** |
|---|---|---|---|---|---|
| 添加（标题） | ✓ | ✓ | ✓ | ✓ | ✓ |
| 优先级 | ✓（!1/!2/!3） | ✓ | ✓ | ✓ | ✓（高/中/低） |
| 标签 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 截止日期 | ✓ | ✓ | ✓ | ✓ | ✓（已新增） |
| 重复任务（每天/每周） | ✓ | ✓ | ✗ | ✗ | 缺口 |
| 编辑任务 | ✓ | ✓ | ✓ | ✓ | ✓（已新增） |
| 软删除 + 撤销 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 筛选（全部/待办/已完成/优先级） | ✓ | ✓ | ✓ | ✓ | ✓ |
| 搜索 | ✓ | ✓ | 部分 | 部分 | ✓（已新增） |
| 项目/子任务 | ✓ | ✓ | ✗ | 部分（看板列） | 缺口 |
| 自然语言输入 | ✓ | ✓ | ✗ | ✗ | ✓（已新增：!1/!高、#标签、今天/明天/周X/M月D日） |
| 提醒/通知推送 | ✓ | ✓ | ✗ | ✗ | 缺口 |
| 日历视图 | ✓ | ✓ | ✗ | 部分 | 缺口 |
| 番茄钟 / 时间追踪 | ✗（第三方） | ✓ 内置 | ✗ | ✗ | 缺口 |
| 完成率/统计面板 | ✓ | ✓ | ✗ | 部分 | ✓（已新增：本周完成 / 连续打卡 / 已逾期） |
| 数据导入/导出/备份 | ✓ | ✓ | ✗ | ✓ | ✓（已新增） |
| 多端同步 | ✓ | ✓ | ✗ | ✓（自建） | 部分（Supabase） |
| 键盘快捷键体系 | ✓ 完整 | ✓ | ✗ | ✗ | 部分（/、Esc、Enter） |
| 数据可视化（趋势图） | ✓ | ✓ | ✗ | ✗ | 缺口 |

### B3. 差距结论（按用户价值排序）

1. ~~**自然语言输入**~~ ✅ **已交付** —— 支持 `!1`/`!2`/`!3` 与 `!高`/`!中`/`!低`（优先级）、`#标签`/`@标签`、`今天`/`明天`/`后天`/`大后天`、`下周一`~`下周日`、`YYYY-MM-DD`、`M月D日`。解析后自动从标题中剥离语法标记，并通过 toast 回报"已识别到 X"。注意：不支持时间分量（`due` 为 date-only），"明天 10:00"中的时间会被当作标题残留。
2. **重复任务** —— 每日/每周/自定义周期。屿事缺这个，用户每天要手动重复添加。
3. ~~**完成率统计面板**~~ ✅ **已交付** —— "本周完成 X 项 / 连续打卡 N 天 / 已逾期 Y"。实现依赖新增的 `completedAt` 时间戳字段（完成时写入、取消完成时清空）；连续打卡从今天向前数，今天未完成则从昨天起算，避免"今天还没做"就清零。
4. **提醒** —— 逾期/临近截止提醒。屿事能标出逾期，但不会主动提醒。
5. **日历视图** —— 中优先级；屿事有截止日期字段，具备改造条件。
6. **番茄钟** —— TickTick 的招牌；对屿航这种"个人主页"定位，属于增强而非必需。

### B4. 用户调研与研究发现（重点）

- **✓ 待办清单的"失败率"是本品类最关键的洞察：约 41% 的待办事项永远得不到完成。** 这是本品类所有竞品设计的出发点——用户要的不是"列清单"，而是"提高完成率"。→ 屿事的"屿咪表情联动 + 彩纸庆祝 + 进度条"方向是对的，属于把"完成率"游戏化。来源：[selfmanager.ai 分析](https://selfmanager.ai/articles/same-day-vs-someday-task-completion)
- **✓ 学术研究：待办清单的"承诺-执行"落差是普遍现象。** 论文《"I'll Finish It This Week" And Other Lies》系统讨论了任务延期与自我欺骗。→ 启示：**屿事应该暴露真实完成率，而不是让用户觉得自己在高效**。来源：[arXiv 2103.16574](https://ar5iv.labs.arxiv.org/html/2103.16574)
- **✓ 任务管理市场处于上升期：俄罗斯用户对规划类服务的关注度同比近乎翻倍。** → 待办清单品类仍在增长，值得继续投入。来源：[Rambler 新闻](https://news.rambler.ru/tech/56217242-s-nachala-goda-interes-rossiyan-k-servisam-dlya-planirovaniya-vyros-pochti-v-dva-raza/)
- **✓ 任务完成率的统计汇总数据可参考（完成率、延期率、平均存活期等）。** 来源：[agiled.app 任务管理统计（2026）](https://agiled.app/statistics/task-management-statistics)
- **✓ 忙碌者更能从错过截止日期中恢复。** → 启示：屿事的"逾期"状态不该做成羞辱式设计（红得刺眼 + 情绪化文案），而应是提示性设计。来源：[BPS Research Digest](https://www.bps.org.uk/research-digest/busy-people-are-especially-good-bouncing-back-missed-deadlines)
- **✓ 休息节律（自我调节 / 番茄钟 / Flowtime）对学生任务完成率的解释力约 8.7%（模型 R²≈0.087）。** → 番茄钟与任务完成率有关，但不是决定性因素；屿航做番茄钟属于加分项，不必押注。来源：[MDPI Behavioral Sciences](https://www.mdpi.com/2076-328X/15/7/861)
- **✓ 社区测评中 Todoist 在"易用性 + 快捷键体系"上显著胜出。** → 屿事已实现 /、Esc、Enter，可以继续补全（快捷键速查表也是 Todoist 官方就有的能力）。来源：[Slant: Todoist vs Wekan 2024](https://www.slant.co/versus/4409/6315/~todoist_vs_wekan) / [Todoist 官方快捷键](https://www.todoist.com/zh-CN/help/articles/use-keyboard-shortcuts-in-todoist-Wyovn2) / [hotkeyguru 速查表](https://hotkeyguru.com/zh/todoist-hotkeys/)
- **✓ 开源看板方案（taskcafe）代表"自托管 + 看板视图"方向，用户看重免费与可自管。** → 屿航自托管定位与 taskcafe 受众高度重叠。来源：[taskcafe releases](https://github.com/JordanKnott/taskcafe/releases)
- **（经验判断）屿事当前定位（个人主页 + 角色陪伴 + 轻量清单）与 Tody 的"极简无广告轻量清单"最接近**，但多了角色情感层——这是差异化，也意味着不应追求 Todoist 的功能完整度，而应追求"完成率"这一指标。

---

## 四、品类 C：虚拟角色 / IP 形象页

### C1. 竞品清单

| 产品 | 形态 | 定位 |
|---|---|---|
| Chiikawa 官方角色站 | 角色介绍站 | 世界观 + 角色档案 + 周边导流 |
| Spiralcute 角色页 | 角色介绍站 | 英文角色设定页 |
| 泡泡玛特官网 | 电商 + 会员 | IP 会员积分体系 + 商城 |
| 参与型角色生态站（페포월드닷컴） | 粉丝平台 | UGC + 粉丝参与 |
| BreachBunny | 互动 WebGL | 品牌 + 游戏化互动 |
| ionos Mission Game | 网页游戏化 | 品牌活动游戏 |
| AI-talk / ai-avatar-bot | AI 角色扮演 | 语音 + 知识库 + 实时驱动 |

### C2. 功能拆解矩阵

| 功能 | Chiikawa 官方站 | 泡泡玛特 | 参与型角色生态站 | 互动 WebGL 角色站 | AI 角色扮演站 | **屿咪现状** |
|---|---|---|---|---|---|---|
| 角色立绘 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓（SVG） |
| 多表情/动效 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓（5 表情） |
| 档案卡（设定） | ✓ | ✓ | ✓ | 部分 | 部分 | ✓ |
| 性格标签 | ✓ | 部分 | 部分 | ✗ | 部分 | ✓ |
| 技能/属性条 | 部分 | ✗ | ✗ | 部分 | ✗ | ✓ |
| 语录/台词互动 | ✓ | ✗ | ✓ | ✗ | ✓ | ✓（10 条语录池 + 点击换一句 + 同步切表情） |
| 点击互动动作 | 部分 | ✗ | ✓ | ✓ | ✓ | ✓（点击庆祝） |
| 世界观/故事 | ✓ 强 | ✓ | ✓ | 部分 | 部分 | 缺口 |
| 语音合成/语音聊天 | ✗ | ✗ | 部分 | 部分 | ✓ | 缺口 |
| AI 对话（角色扮演） | ✗ | ✗ | ✗ | ✗ | ✓ | 缺口 |
| 与主站功能联动（角色即助手） | ✗ | ✗ | 部分 | ✗ | ✗ | ✓（读屿事 todos：进度条 / 剩余数 / 逾期提醒 / 全完成庆祝） |
| 粉丝社区/UGC | 部分 | ✓ | ✓ 强 | ✗ | ✗ | 缺口 |
| 周边商城/积分会员 | ✓ | ✓ 强 | ✗ | ✗ | ✗ | 缺口 |
| 主题色板/品牌一致性展示 | 部分 | ✓ | 部分 | ✗ | ✗ | ✓ |

### C3. 差距结论

1. **世界观 / 角色故事** —— Chiikawa 的核心吸引力就是世界观（世界观与世界观设定构成 IP 的长期黏性）。屿咪目前是"设定卡"，缺一段完整的角色故事/世界观。
2. **角色成长系统** —— 等级、成就、解锁表情。让用户与角色有长期关系，而不是一次性展示。
3. **与主站深度联动** —— 屿咪读屿事数据、感知待办完成度并改变表情与台词。这是屿航独有的差异化（上表中没有任何竞品把角色绑定到功能数据上），应作为最高优先级。
4. **AI 对话 / 语音** —— 门槛高（需要模型与合规），且用户研究提示阻力大（见下），建议暂缓。
5. **粉丝社区/UGC 与商城** —— 属于商业化阶段，与屿航个人主页定位不符，可不做。

### C4. 用户调研与研究发现

- **✓ 世界观是 IP 长期热度的核心。以 Chiikawa 为例，公开分析指出其吸引力来自"10 大角色物种 + 完整世界观 + 9 大魅力点"，治愈系情感是主线。** → 屿咪缺世界观叙事，是最大的内容短板。来源：[Marie Claire 分析](https://www.marieclaire.com.tw/lifestyle/news/81242) / [Spiralcute 角色页](https://spiralcute.com/characters/chiikawa/en/) / [Chiikawa 官方信息站](https://chiikawa-info.jp/index)
- **✓ 参与型角色生态（粉丝可参与平台）是近年 IP 运营方向：三星애니 上线 페포월드닷컴，构建"参与型角色生态"。** → 若屿航未来考虑开放，UGC 参与是方向。来源：[news1](https://star.news1.kr/articles/?6205229) / [edaily](https://www2.edaily.co.kr/News/Read?newsId=03047126645484672&mediaCodeNo=257)
- **✓ 官网正在成为营销阵地，"内容与互动"是吸引用户的关键手段（案例：LOST MARY、OXVA）。** → 屿咪页的互动元素（点击庆祝、表情切换）方向正确。来源：[2Firsts 观察](https://cn.2firsts.com/news/detail?menu=editorial&id=14825)
- **✓ 泡泡玛特代表"IP + 会员积分体系"，积分规则是官网重要组成部分。** → 若屿航要做成长系统，积分/勋章可参考其结构。来源：[POP MART Points Rules](https://www.popmart.com/hk/help/Points%20Rules)
- **✓ 互动式品牌站已大量使用 WebGL 与游戏化（如 BreachBunny、ionos mission game）。** → 技术可行，但属于品牌活动场景，屿航个人主页场景不必复刻。来源：[demodern BreachBunny](https://www.demodern.de/en/projects/breachbunny-cyber-insurance) / [demodern ionos](https://www.demodern.de/en/projects/ionos-mission-game)
- **⚠️ AI 陪伴类产品存在明显用户阻力。哈佛商学院工作论文《Why Most Resist AI Companions》讨论了多数用户对 AI 陪伴的抗拒原因（含心理不适与信任问题）。** → 屿咪**不应做成 AI 陪伴**，保持"角色化提示 + 情绪反馈"是更安全的路线。来源：[HBS 工作论文 25-030](https://www.hbs.edu/ris/Publication%20Files/25-030_db6440b2-3d17-42cd-b474-29fb1c424a48.pdf)
- **✓ 情感陪伴市场确实在爆发，且已有针对美国 AI 情感产品的用户洞察报告。** → 说明需求真实存在，但落地形式需谨慎。来源：[霞光智库 × Trooly《美国AI情感产品用户洞察报告》](https://www.donews.com/article/detail/5132/104041.html)
- **✓ 学术研究支持"拟社会互动"路径：以拟社会互动为中介的研究显示，网红打造的 AI 虚拟伴侣能创造更忠诚的粉丝。** → 角色与用户建立"准社会关系"是有理论依据的，屿咪用表情/台词回应用户行为属于这条路径。来源：[台科大硕士论文](https://etheses.lib.ntust.edu.tw/thesis/detail/5b2aebed9e1e69d1aa97a239af07160b/)
- **✓ VR/AI 角色研究中，"亲密度"与"沉浸感"是关键体验指标。** → 屿咪页可测量：用户停留时长、互动次数（点击角色/切换表情次数）。来源：[KCI 论文](https://www.kci.go.kr/kciportal/landing/article.kci?arti_id=ART003280828)
- **✓ AI 角色扮演/语音数字人技术栈已有开源参考（AI-talk、ai-avatar-bot，含知识库、口型同步、运营面板）。** → 若未来要做语音或对话，有成熟参考。来源：[AI-talk](https://github.com/HStar02/AI-talk) / [ai-avatar-bot](https://github.com/YuriCrystal/ai-avatar-bot)

---

## 五、横向结论：优先级排序建议

### P0（已完成）

| 项 | 归属 | 状态 | 依据 |
|---|---|---|---|
| 屿咪 × 屿事联动（读 todos，进度条 + 表情 + 台词 + 逾期提醒） | 屿咪 | ✅ 已交付 | 唯一无竞品对标的差异化；把"陪伴"落到真实功能数据上 |
| 屿事：自然语言输入（日期/优先级/标签解析） | 屿事 | ✅ 已交付 | Todoist 标杆能力；屿事最明显的体验差距 |
| 屿事：完成率/统计面板（本周完成数、连续打卡、逾期数） | 屿事 | ✅ 已交付 | 直接对齐"41% 待办永不完成"这个品类核心矛盾 |
| ~~主站：书签一键导入 + 站点数据备份导出~~ | 屿航 | ✅ 原有实现 | 已具备书签双向互通 + 五类账户数据备份，原报告误判，见 A3-4 |

### P1（下个周期）

- 屿事：重复任务、临近截止/逾期提醒
- 屿事：日历视图
- 屿航：时钟/天气/日历小组件、访问频次统计
- 屿咪：世界观故事、角色成长（等级/成就/解锁表情）

### P2（观察，暂不做）

- 屿事：番茄钟（研究解释力仅约 8.7%，属加分项）
- 屿航：壁纸/背景换肤
- 屿咪：AI 对话 / 语音（用户阻力大，合规成本高）
- 屿咪：粉丝社区 / UGC / 商城（超出个人主页定位）

### 风险提示

1. **热度排序的收敛效应**：长期只按热度排序会压制用户探索性浏览，应保留"新站/冷门"入口。
2. **逾期状态避免羞辱式设计**：研究显示忙碌者更能从错过截止日恢复，逾期提示应是中性的，不要过度使用红色与情绪化文案（屿事目前的逾期红徽标建议保留功能性、弱化情绪）。
3. **不要把屿咪做成 AI 陪伴**：有明确的用户阻力研究支撑这一判断；角色化提示 + 情绪反馈是更稳的路线。
4. **安全信任是自建主页的核心卖点**：第三方主页插件的投毒事件说明"自管 + 本地优先"值得在首页明示。

---

## 六、来源清单

**个人导航站 / 新标签页**
- [arXiv 1812.06525：New tab page recommendations suppress exploratory browsing](https://ar5iv.labs.arxiv.org/html/1812.06525)
- [ACM WebSci 2019：New Tab Page Recommendations Concentrate Web Browsing](https://dl.acm.org/doi/10.1145/3292522.3326011)
- [V2EX：Infinity 新标签页疑似被投毒](https://global.v2ex.co/t/1176399?p=1)
- [极客公园：浏览器新标签页三代演化（Infinity / iTab / AItab）](https://www.geekpark.net/news/368506)
- [Quick Tabs（Chrome 商店）](https://chromewebstore.google.com/detail/quick-tabs/jnjfeinjfmenlddahdjdmgpbokiacbbb)
- [WeTab 用户评论](https://chrome-stats.com/d/aikflfpejipbpjdlfabpgclhblkpaafo/reviews)
- [X New Tab Page 用户评论](https://chrome-stats.com/d/cbmbfafhdccfgdgnbkgogehiklmemkoh/reviews)
- [unstore.io：桌面新标签页扩展对比](https://unstore.io/discover/best-apps-for-browser-new-tab-customization-desktop)
- [startpagehq：Tabliss alternative](https://startpagehq.com/alternatives/tabliss)
- [什么值得买：极空间 HomePage](https://post.smzdm.com/p/al80g920/)
- [导航网站用户需求调研](https://ln.zx.zbj.com/baike/24469.html)
- [KCI：基于 Kano 模型的导航系统功能需求用户中心分析](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002038933)
- [客厅 Livingroom 导航页（社区）](https://forum.trae.cn/t/topic/37275)

**待办清单 / 任务管理**
- [selfmanager.ai：41% 的待办永远完不成](https://selfmanager.ai/articles/same-day-vs-someday-task-completion)
- [arXiv 2103.16574：I'll Finish It This Week and Other Lies](https://ar5iv.labs.arxiv.org/html/2103.16574)
- [agiled.app：Task Management Statistics 2026](https://agiled.app/statistics/task-management-statistics)
- [BPS：Busy people bounce back from missed deadlines](https://www.bps.org.uk/research-digest/busy-people-are-especially-good-bouncing-back-missed-deadlines)
- [MDPI Behavioral Sciences：休息节律与任务完成率](https://www.mdpi.com/2076-328X/15/7/861)
- [Slant：Todoist vs Wekan 2024](https://www.slant.co/versus/4409/6315/~todoist_vs_wekan)
- [Todoist 官方：键盘快捷键](https://www.todoist.com/zh-CN/help/articles/use-keyboard-shortcuts-in-todoist-Wyovn2)
- [hotkeyguru：Todoist 快捷键速查表](https://hotkeyguru.com/zh/todoist-hotkeys/)
- [GitHub：taskcafe releases](https://github.com/JordanKnott/taskcafe/releases)
- [Todoist 简介（Wikipedia）](https://ja.wikipedia.org/wiki/Todoist)
- [Rambler：俄罗斯用户对规划服务兴趣同比近翻倍](https://news.rambler.ru/tech/56217242-s-nachala-goda-interes-rossiyan-k-servisam-dlya-planirovaniya-vyros-pochti-v-dva-raza/)
- [Globe and Mail：Why you fail the to-do list test](https://www.theglobeandmail.com/report-on-business/careers/management/why-you-fail-the-to-do-list-test/article33517158/)
- [NMI FlexList User Research](https://projects.nmi.cool/2022/nmc/flexlist/assets/files/checkpoint-two/user-research.pdf)

**虚拟角色 / IP 形象页**
- [Marie Claire：Chiikawa 10 大角色物种与世界观](https://www.marieclaire.com.tw/lifestyle/news/81242)
- [Spiralcute：Chiikawa 角色页](https://spiralcute.com/characters/chiikawa/en/)
- [Chiikawa 官方信息站](https://chiikawa-info.jp/index)
- [news1：삼양애니 페포월드닷컴 参与型角色生态](https://star.news1.kr/articles/?6205229)
- [edaily：参与型角色生态构建](https://www2.edaily.co.kr/News/Read?newsId=03047126645484672&mediaCodeNo=257)
- [2Firsts：官网成营销阵地（LOST MARY / OXVA）](https://cn.2firsts.com/news/detail?menu=editorial&id=14825)
- [POP MART：Points Rules](https://www.popmart.com/hk/help/Points%20Rules)
- [demodern：BreachBunny 互动 WebGL](https://www.demodern.de/en/projects/breachbunny-cyber-insurance)
- [demodern：ionos Mission Game](https://www.demodern.de/en/projects/ionos-mission-game)
- [HBS 工作论文 25-030：Why Most Resist AI Companions](https://www.hbs.edu/ris/Publication%20Files/25-030_db6440b2-3d17-42cd-b474-29fb1c424a48.pdf)
- [霞光智库 × Trooly：美国 AI 情感产品用户洞察报告](https://www.donews.com/article/detail/5132/104041.html)
- [台科大硕士论文：网红 AI 虚拟伴侣与粉丝忠诚度（拟社会互动中介）](https://etheses.lib.ntust.edu.tw/thesis/detail/5b2aebed9e1e69d1aa97a239af07160b/)
- [KCI：AI 角色 VR 沉浸内容（亲密度与沉浸感）](https://www.kci.go.kr/kciportal/landing/article.kci?arti_id=ART003280828)
- [GitHub：AI-talk（AI 角色扮演）](https://github.com/HStar02/AI-talk)
- [GitHub：ai-avatar-bot（Live2D/VRM 语音数字人）](https://github.com/YuriCrystal/ai-avatar-bot)
- [界面新闻：主流厂牌收编语音厅偶像](https://www.jiemian.com/article/14579027.html)

---

*报告版本：v2*

**v2 变更（基于代码复核）**
1. 修正 A3-4 与 P0 表：主站的书签导入导出 + 五类账户数据备份**已存在**，v1 误判为缺口。
2. 标记 P0 三项已交付：屿咪×屿事联动、屿事自然语言输入、屿事完成率统计面板。
3. B3 差距结论重排：自然语言输入与统计面板由"差距"改为"已交付"，并记录实现约束（`due` 不支持时间分量）。
4. B2 / C2 矩阵中屿事、屿咪的对应行同步更新为 ✓。
5. 剩余缺口收敛为：屿事重复任务、屿事提醒、屿航小组件与访问频次、屿咪世界观与成长系统。
