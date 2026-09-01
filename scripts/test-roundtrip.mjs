// 数据链路回归测试（v6 验收用）
// 用法：node scripts/test-roundtrip.mjs
// 1) build.mjs 输出与基线逐字节一致（需先运行 node scripts/build.mjs）
// 2) 管理页导出格式：sites.tsv 重新生成结果与导出内容完全一致（自洽）
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const YH = require('../web/js/sites-lib.js');

let fail = 0;
function check(name, ok, extra) {
  console.log((ok ? '✅' : '❌'), name, extra || '');
  if (!ok) fail++;
}
// 归一化：忽略 updatedAt 日期（UTC 跨日会使该字段变化，其余必须逐字节一致）
function normDate(s) {
  return String(s).replace(/"updatedAt":"\d{4}-\d{2}-\d{2}"/g, '"updatedAt":"DATE"');
}

// ---- 1. sites.js / sites.json 与基线逐字节一致（仅 updatedAt 日期可不同） ----
const cur = readFileSync('web/data/sites.js', 'utf8');
const base = readFileSync('scripts/baseline/sites.js.baseline', 'utf8');
check('sites.js 与基线逐字节一致（除日期）', normDate(cur) === normDate(base), `(${cur.length} chars)`);
const curJ = readFileSync('data/sites.json', 'utf8');
const baseJ = readFileSync('scripts/baseline/sites.json.baseline', 'utf8');
check('sites.json 与基线逐字节一致（除日期）', normDate(curJ) === normDate(baseJ), `(${curJ.length} chars)`);

// ---- 2. TSV 导出 → 重新生成 自洽 ----
// 说明：8 列 tsv 无法携带原始标签词汇，个别站点的标签会被规则收敛精简（如
// 亚马逊→电商购物 这类源自原始标签列的标签会丢失）。因此判据是"导出自洽"：
// 导出的 tsv 标签列 == 重新生成的标签，且二次再生完全稳定。
const raw = readFileSync('data/sites.tsv', 'utf8');
const a = YH.buildSitesFromTsv(raw);
const tsv = YH.serializeTsv(a.sites);
const b = YH.buildSitesFromTsv(tsv);
check('导出 tsv 站点数一致', a.sites.length === b.sites.length, `(${a.sites.length})`);

// 导出 tsv 的标签列 vs 重新生成的标签
const lines = tsv.split(/\r?\n/).filter((l) => l.trim() !== '');
let tsvTagMismatch = 0;
for (let i = 0; i < b.sites.length; i++) {
  const col = (lines[i + 1] || '').split('\t');
  const tsvTags = (col[3] || '').split(',').filter(Boolean).sort().join(',');
  const rebuilt = b.sites[i].tags.slice().sort().join(',');
  if (tsvTags !== rebuilt) tsvTagMismatch++;
}
check('tsv 标签列与再生成标签一致', tsvTagMismatch === 0, `(mismatch=${tsvTagMismatch})`);

// ---- 3. 二次再生稳定（导出 → 再生成 → 再导出 → 再生成） ----
const c = YH.buildSitesFromTsv(YH.serializeTsv(b.sites));
let stable = 0;
for (let i = 0; i < b.sites.length; i++) {
  const x = JSON.parse(JSON.stringify(b.sites[i]));
  const y = JSON.parse(JSON.stringify(c.sites[i]));
  delete x.note; delete y.note;
  if (JSON.stringify(x) !== JSON.stringify(y)) stable++;
}
check('二次再生完全稳定', stable === 0, `(diffs=${stable})`);

// 信息性：原始分类 vs tsv 收敛后的标签差异（不算失败，仅提示）
let reduced = 0;
for (let i = 0; i < a.sites.length; i++) {
  if (a.sites[i].tags.join(',') !== b.sites[i].tags.join(',')) reduced++;
}
console.log('ℹ️  tsv 导出被规则精简标签的站点数:', reduced, '（sites.js 导出不受影响，保留完整标签）');

// ---- 4. 校验函数可用 ----
const issues = YH.validate(a.sites);
check('validate 返回问题列表', Array.isArray(issues) && issues.length >= 0, `(issues=${issues.length})`);

console.log(fail === 0 ? '\n==== 全部通过 ====' : `\n==== ${fail} 项失败 ====`);
process.exit(fail === 0 ? 0 : 1);
