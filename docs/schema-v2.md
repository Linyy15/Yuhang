# 屿航链接实体 Schema V2

> 状态：第一批升级工作的基础数据契约。实现位置：[web/js/schema.js](../web/js/schema.js)。

## 目标

V2 用显式的链接类型、可见范围、状态、版本和可审计时间字段，替换历史上只把所有记录视为 `links/sites` 的模糊模型。它为以下后续工作保留稳定接口：

- 浏览器扩展确认保存到“我的链接”；
- 公共目录质量字段和审核流；
- 本地—云端同步、软删除和冲突提示；
- 工作区和起始页快捷方式引用同一链接实体。

V2 **不改变既有主站读取的站点字段和行为**；`sites` 继续作为 `links` 的兼容别名。

## 顶层结构

```js
{
  schemaVersion: 2,
  links: [],
  sites: [],       // V1 兼容别名，迁移后与 links 指向同一组记录
  settings: {},
  meta: {
    createdAt: null,
    updatedAt: null,
    catalogVersion: null,
    migratedFrom: 1
  }
}
```

## 链接实体

所有记录继续要求 `id` 与 `url`。V2 新增/规范以下字段：

| 字段 | 类型/可选值 | 说明 |
|---|---|---|
| `type` | `public_site` / `personal_link` / `workspace_item` / `shortcut` / `submission` | 记录在产品中的业务角色。 |
| `visibility` | `public` / `private` | 数据可见范围；公共目录必须显式为 public。 |
| `status` | `unknown` / `active` / `degraded` / `inactive` | 链接健康状态；不能把网络失败直接等同死链。 |
| `revision` | 正整数 | 后续同步冲突检测的记录版本。 |
| `source` | string 或 null | 来源，例如手工录入、扩展、投稿渠道或数据源。 |
| `official` | boolean 或 null | 是否已人工/规则确认官方站点；`null` 表示未核验。 |
| `alternativeUrls` | string 数组 | 用户可见的候选替代地址。 |
| `createdAt` / `updatedAt` | ISO 时间字符串或 null | 创建与最后修改时间。 |
| `deletedAt` | ISO 时间字符串或 null | 软删除墓碑；后续同步不得直接丢弃。 |
| `lastCheckedAt` | ISO 时间字符串或 null | 最近一次健康检查的时间。 |

## 迁移规则

`YHSchema.migrate()` 接受 V0/V1 和历史 `{ meta, sites }` 形状：

1. `sites` 自动转换为 `links`，并保留 `sites` 兼容别名；
2. 由历史 `sites` 来的目录型记录默认迁移为 `public_site` + `public`；
3. 历史 `links` 来的保存记录默认迁移为 `personal_link` + `private`；
4. 标签、候选替代链接默认为空数组；状态默认为 `unknown`；版本默认为 `1`；
5. 不生成伪造时间，未知时间保留为 `null`；
6. `meta.migratedFrom` 记录来源版本，`meta.catalogVersion` 为目录构建版本预留。

## 校验与合并边界

- `YHSchema.validate()` 会校验类型、可见性、状态、数组字段、revision 和日期字段。
- `YHSchema.merge()` 仍是**兼容性合并工具**，按 id 覆盖并规范 V2 字段；它不是冲突解决器。
- 后续同步实现必须基于 `revision`、`updatedAt`、`deletedAt` 给出可见的冲突选择，不能把 merge 的覆盖行为当作最终同步策略。

## 标签分类调整

分类规则已将原先过于宽泛的“工具 → 效率工具”兜底拆开：增加“文件与格式”“系统与网络”“查询服务”“在线工具”四个用途标签，未命中明确规则的工具站点先按“在线工具”承接，避免“效率工具”成为垃圾桶标签。这样可以避免效率工具成为超过半数目录条目的泛化标签；AI 仍需以明确产品/模型关键词命中，不能只凭“在线服务”等泛化描述判断。

## 目录版本

站点构建产物的 `SITES_META` 已包含：

```js
{
  total: 4214,
  updatedAt: 'YYYY-MM-DD',
  catalogVersion: 'catalog-4214-YYYYMMDD'
}
```

`catalogVersion` 是供 `sites.tsv`、`sites.json`、`sites.js` 对照的构建标识，不是内容哈希，也不替代版本控制提交号。

## 验证

运行：

```bash
node scripts/build.mjs
node scripts/test-upgrades.mjs
node scripts/test-roundtrip.mjs
```

其中 `test-upgrades.mjs` 覆盖 V1/V2 迁移和非法类型校验；`test-roundtrip.mjs` 验证当前 TSV 与两个生成产物保持一致，并在历史基线条目数不同的时候明确跳过不适用的逐字节比较。
