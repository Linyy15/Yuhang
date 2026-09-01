// 导入外部网站清单（4 列制表符：序号	项目分类	网站名称	网站网址）
// 用法：
//   1) 把清单另存为 data/import.tsv（表头同上，制表符分隔）
//   2) node scripts/import-list.mjs
// 该脚本会把合法条目转换为 8 列格式追加到 data/sites.tsv，供 build.mjs 清洗/去重/分类。
// 注意：网址校验会过滤明显非法（缺协议、非法主机如 "https://.x"、空）条目，并在导入前按规范化网址去重。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const YH = require('../web/js/sites-lib.js');

const SRC = 'data/import.tsv';
const DST = 'data/sites.tsv';
if (!existsSync(SRC)) { console.error('缺少', SRC, '——请把清单保存为该文件后再运行'); process.exit(1); }

const lines = readFileSync(SRC, 'utf8').split(/\r?\n/).filter((l) => l.trim() !== '');
// 跳过表头行（首列含"序号"或"项目分类"）
const rows = lines.filter((l) => !/^序号\t/.test(l) && !/项目分类/.test(l));
console.log('读取条目:', rows.length);

function norm(u) {
  return YH.norm(u); // 复用 lib 的网址规范化（去协议/www/尾斜杠/小写）
}

const seen = new Set();   // 规范化网址去重
const out = [];
let skippedBad = 0, skippedDup = 0, empty = 0;

for (const l of rows) {
  const c = l.split('\t');
  const name = (c[2] || '').trim();
  let url = (c[3] || '').trim();
  const cat = (c[1] || '').trim() || '其他';
  if (!name || !url) { empty++; continue; }
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  // 非法主机（如 https://.weixin.qq.com）或明显残缺
  try {
    const u = new URL(url);
    if (!u.hostname || u.hostname.startsWith('.')) throw new Error('bad host');
  } catch (e) { skippedBad++; continue; }
  const key = norm(url);
  if (seen.has(key)) { skippedDup++; continue; }
  seen.add(key);
  out.push([name, name, cat, cat, '', '', url, '否'].join('\t'));
}

console.log('有效新增:', out.length, '| 跳过重复:', skippedDup, '| 跳过非法网址:', skippedBad, '| 空:', empty);

// 追加到 sites.tsv（在已有数据之后；build.mjs 会自动按 URL 合并与已有重复项）
const existing = existsSync(DST) ? readFileSync(DST, 'utf8') : '';
const sep = existing && !existing.endsWith('\n') ? '\n' : '';
writeFileSync(DST, existing + sep + out.join('\n') + (out.length ? '\n' : ''), 'utf8');
console.log('已追加到', DST, '（随后运行 node scripts/build.mjs 重建）');
