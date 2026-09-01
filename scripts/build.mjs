// 构建脚本 v3：清洗 data/sites.tsv → 多标签分类 → 生成 web/data/sites.js 和 data/sites.json
// 用法：node scripts/build.mjs （在项目根目录运行）
// 说明：清洗/去重/分类/序列化逻辑已抽到 web/js/sites-lib.js（与浏览器共用，web/ 目录自包含），
//       本脚本只负责文件读写与构建报告，行为与 v2 完全一致。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const YH = require('../web/js/sites-lib.js');

const raw = readFileSync('data/sites.tsv', 'utf8');
const { meta, sites, stats } = YH.buildSitesFromTsv(raw);

mkdirSync('web/data', { recursive: true });
writeFileSync('data/sites.json', YH.serializeJson(meta, sites), 'utf8');
writeFileSync('web/data/sites.js', YH.serializeSitesJs(meta, sites), 'utf8');

// ============ 构建报告 ============
console.log('==== 构建完成 ====');
console.log('输入行数:', stats.inputRows, '| 重复合并组数:', stats.mergedGroups, '| 删除灰色/错误站点:', stats.deleted.length, '| 最终站点数:', sites.length);
for (const d of stats.deleted) console.log('  · 已删除:', d);
console.log('无标签站点:', stats.noTagSites.length === 0 ? '无' : stats.noTagSites.join('、'));
console.log('标签数:', stats.tags.length, '（一个网站最多可属于多个标签）');
console.log('--- 标签分布（前 20） ---');
for (const t of stats.tags.slice(0, 20)) console.log('  ', t.name, t.count);
console.log('已生成: data/sites.json, web/data/sites.js');
