// 数据质量分析脚本：读取 sites.tsv，输出统计报告
import { readFileSync, writeFileSync } from 'node:fs';

const raw = readFileSync('data/sites.tsv', 'utf8');
const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== '');
const header = lines[0].split('\t');
const rows = lines.slice(1).map((l, i) => {
  const c = l.split('\t');
  return {
    row: i + 2,
    short: (c[0] || '').trim(),
    name: (c[1] || '').trim(),
    cat: (c[2] || '').trim(),
    tags: (c[3] || '').trim(),
    brief: (c[4] || '').trim(),
    detail: (c[5] || '').trim(),
    url: (c[6] || '').trim(),
    vpn: (c[7] || '').trim(),
  };
});

const report = {};
report.totalRows = rows.length;
report.columns = header;

// 大类分布
report.categories = {};
for (const r of rows) report.categories[r.cat] = (report.categories[r.cat] || 0) + 1;

// 缺失网址
report.missingUrl = rows
  .filter((r) => !r.url)
  .map((r) => ({ row: r.row, short: r.short, cat: r.cat }));

// 网址规范化（去协议、www、结尾斜杠）
const norm = (u) =>
  u
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '')
    .toLowerCase();

// 同网址重复
const byUrl = new Map();
for (const r of rows) {
  if (!r.url) continue;
  const key = norm(r.url);
  if (!byUrl.has(key)) byUrl.set(key, []);
  byUrl.get(key).push({ short: r.short, row: r.row, cat: r.cat, vpn: r.vpn });
}
report.dupByUrl = [...byUrl.entries()]
  .filter(([, v]) => v.length > 1)
  .map(([url, items]) => ({ url, count: items.length, items }));

// 简称重复（可能同名不同站）
const byName = new Map();
for (const r of rows) {
  if (!byName.has(r.short)) byName.set(r.short, []);
  byName.get(r.short).push({ url: r.url || '(无网址)', row: r.row, cat: r.cat });
}
report.dupByName = [...byName.entries()]
  .filter(([, v]) => v.length > 1)
  .map(([name, items]) => ({ name, count: items.length, items }));

// 非 http/https 网址
report.nonHttpUrls = rows
  .filter((r) => r.url && !/^https?:\/\//i.test(r.url))
  .map((r) => ({ row: r.row, short: r.short, url: r.url }));

// 可疑网址关键词
const suspicious = /(&|dict\.yandex|steamspy|192\.168|edge:\/\/|flyingwin|fakeuk|meiguodizhi)/i;
report.suspiciousUrls = rows
  .filter((r) => r.url && suspicious.test(r.url))
  .map((r) => ({ row: r.row, short: r.short, url: r.url }));

// 加速器字段值分布
report.vpnValues = {};
for (const r of rows) {
  const v = r.vpn || '(空)';
  report.vpnValues[v] = (report.vpnValues[v] || 0) + 1;
}

// 数据日期/统计小结
report.summary = {
  totalRows: rows.length,
  categoryCount: Object.keys(report.categories).length,
  missingUrlCount: report.missingUrl.length,
  dupByUrlGroups: report.dupByUrl.length,
  dupByUrlExtraRows: report.dupByUrl.reduce((s, g) => s + g.count - 1, 0),
  dupByNameGroups: report.dupByName.length,
  nonHttpUrlCount: report.nonHttpUrls.length,
  suspiciousUrlCount: report.suspiciousUrls.length,
};

writeFileSync('data/analysis-report.json', JSON.stringify(report, null, 2), 'utf8');

console.log('==== 数据体检结果 ====');
console.log('总行数(不含表头):', report.totalRows);
console.log('大类数量:', report.summary.categoryCount);
console.log('--- 大类分布 ---');
for (const [k, v] of Object.entries(report.categories).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v}`);
}
console.log('缺失网址:', report.summary.missingUrlCount, '条');
console.log('同网址重复:', report.summary.dupByUrlGroups, '组，多出', report.summary.dupByUrlExtraRows, '条');
console.log('简称重复:', report.summary.dupByNameGroups, '组');
console.log('非http网址:', report.summary.nonHttpUrlCount, '条');
console.log('可疑网址:', report.summary.suspiciousUrlCount, '条');
console.log('加速器字段分布:', JSON.stringify(report.vpnValues));
console.log('完整报告已写入 data/analysis-report.json');
