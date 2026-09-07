# 🏝️ 屿航 · 探索每一座数字岛屿

屿航是一个**本地优先、零构建**的网址导航站。它把常用网站整理成带标签的「数字岛屿」，支持搜索、收藏、个人链接、工作区、待办与屿咪互动页面。

> 默认不要求后端服务：下载后可直接双击 `web/index.html` 使用。

## 功能

- 多标签网站导航、模糊搜索与网址直达
- 收藏、最近访问、工作区和个人链接（浏览器本地保存）
- 9 套主题 × 7 种强调色，四个页面同步主题
- 屿事待办：优先级、标签、筛选、日历/看板/时间轴等视图
- 屿咪角色页与成长互动
- 整屏起始页、快捷链接、壁纸和多搜索引擎
- 纯前端工具箱、站内热搜、PWA 离线外壳
- 浏览器扩展 MVP：将当前页面生成「保存到屿航」链接

## 页面入口

| 页面 | 路径 | 用途 |
| --- | --- | --- |
| 屿航主站 | `web/index.html` | 网站导航、搜索和收藏 |
| 屿事 | `web/todo.html` | 本地待办清单 |
| 屿咪 | `web/ip.html` | 角色图鉴和互动 |
| 世界观 | `web/story.html` | 屿咪故事 |
| 后台管理 | `web/admin.html` | 本地编辑与导出站点目录 |

## 快速开始

### 直接使用

用 Chrome 或 Edge 直接打开 `web/index.html`。

### 本地预览

如果要测试 PWA、Service Worker 或后台写入能力，可以在项目根目录运行：

```bash
npx serve web
# 或
python -m http.server 8080 -d web
```

然后访问本地地址。

## 数据管理

- `data/sites.tsv`：原始站点目录数据。
- `web/data/sites.js`：主站直接加载的数据文件。
- `web/js/sites-lib.js`：TSV 解析、去重、分类、校验和序列化逻辑。
- 在后台管理页编辑后可导出 `sites.js`；也可编辑 TSV 后运行构建脚本。

```bash
node scripts/build.mjs
```

## 测试

```bash
node scripts/smoke-app.mjs
node scripts/smoke-admin.mjs
node scripts/test-search.mjs
node scripts/test-roundtrip.mjs
node scripts/test-upgrades.mjs
```

## 项目结构

```text
web/                  静态站点（部署此目录）
  index.html          主站
  todo.html           屿事待办
  ip.html             屿咪角色页
  story.html          世界观故事
  css/                页面与主题样式
  js/                 原生 JavaScript 模块
  data/sites.js       已构建的网站目录
scripts/              构建、校验与回归测试脚本
data/sites.tsv        原始站点数据
extension/            Manifest V3 浏览器扩展 MVP
docs/                 模块使用和数据 schema 文档
```

## 部署

这是静态项目。将 `web/` 目录内容发布到 GitHub Pages、Netlify、Vercel、对象存储静态网站或任意静态托管即可。部署细节参见 `DEPLOY.md`。

## 隐私与公开信息

- 项目不包含服务端密钥、个人邮箱、私有 API 配置或用户数据。
- 收藏、待办、浏览记录、个人链接等默认保存在用户自己的浏览器 `localStorage` 中。
- `web/js/integrations.js` 的网络检查默认关闭；只有调用方显式启用并传入公开 URL 时才会请求。
- 本仓库不追踪 `.env`、私钥或本地构建产物；如需接入自己的后端，请使用本地环境变量或托管平台的机密配置，不要提交到仓库。

## 社区

官方 QQ 群：**1001012133**

## 许可证

本项目中的站点目录仅供学习、整理与个人导航使用。访问第三方网站时请遵守其服务条款、许可协议与适用法律。
