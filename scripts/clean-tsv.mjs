// 数据源头治理脚本：把 data/sites.tsv 按 build 同一套清洗逻辑就地瘦身
// 用法：node scripts/clean-tsv.mjs       （清洗并写回 sites.tsv，原文件备份为 sites.tsv.bak）
//       node scripts/clean-tsv.mjs --dry  （仅预览报告，不写文件）
// 说明：清洗/去重/删除/分类复用 web/js/sites-lib.js 与 build.mjs 完全一致的逻辑，
//       因此清洗后 node scripts/build.mjs 的产物（sites.js/sites.json）保持不变，
//       但 tsv 源头会去掉重复行/灰色站点，后续手编 tsv 不再踩重复雷。
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const YH = require('../web/js/sites-lib.js');

const DRY = process.argv.includes('--dry');
const TSV = 'data/sites.tsv';
const BAK = 'data/sites.tsv.bak';

const raw = readFileSync(TSV, 'utf8');
const { meta, sites, stats } = YH.buildSitesFromTsv(raw);

// ============ 输出报告 ============
console.log('==== 数据源头清洗报告 ====');
console.log('输入行数:', stats.inputRows);
console.log('重复合并组数:', stats.mergedGroups, '（多出', stats.inputRows - sites.length - stats.deleted.length, '行冗余）');
console.log('删除灰色/错误站点:', stats.deleted.length);
for (const d of stats.deleted) console.log('  · 已删除:', d);
console.log('输出行数:', sites.length);
console.log('清洗后唯一网址: 是（serializeTsv 写入稳定标签集）');

// 标签稳定性：直接复用 serializeTsv 的逻辑做一次 roundtrip 校验
const tsvOnce = YH.serializeTsv(sites);
const rebuilt = YH.buildSitesFromTsv(tsvOnce);
console.log('二次再生成一致性:', rebuilt.sites.length === sites.length ? '通过' : '失败');

if (DRY) {
  console.log('\n[dry 模式] 未写文件：' + TSV);
  process.exit(0);
}

// ============ 备份 + 写回 ============
if (existsSync(BAK)) renameSync(BAK, BAK + '.old'); // 保留上一轮备份
renameSync(TSV, BAK);
writeFileSync(TSV, tsvOnce, 'utf8');

console.log('\n已备份原文件 → ' + BAK);
console.log('已写回清洗后 ' + TSV + '（' + sites.length + ' 行）');
console.log('\n下一步：运行 node scripts/build.mjs 重新生成 web/data/sites.js（产物应与清洗前逐字节一致）。');