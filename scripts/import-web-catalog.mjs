// 屿航 · GitHub 网站目录导入器
// 用法：node scripts/import-web-catalog.mjs [候选 Markdown URL ...]
// 默认读取 curated awesome-sites 类目录，提取 Markdown 链接后生成 data/web-catalog-candidates.tsv。
// 这是候选导入，不会直接污染 sites.tsv；通过 linkcheck 后再合并。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SOURCES = process.argv.slice(2).length ? process.argv.slice(2) : [
  'https://raw.githubusercontent.com/atakanaltok/awesome-useful-websites/main/README.md',
  'https://raw.githubusercontent.com/jnv/lists/master/README.md',
  'https://raw.githubusercontent.com/websealevel/awesome-fr/master/README.md',
];
const existing = new Set();
try {
  for (const line of readFileSync('data/web-catalog-candidates.tsv', 'utf8').split(/\r?\n/).slice(1)) {
    const c = line.split('\t');
    if (c[6]) existing.add(normalize(c[6]));
  }
} catch {}
try {
  for (const line of readFileSync('data/sites.tsv', 'utf8').split(/\r?\n/).slice(1)) {
    const c = line.split('\t');
    if (c[6]) existing.add(normalize(c[6]));
  }
} catch {}

function normalize(raw) {
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!['http:', 'https:'].includes(u.protocol)) return '';
    u.hash = ''; u.search = '';
    return u.href.replace(/\/$/, '').toLowerCase();
  } catch { return ''; }
}
function host(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } }
function label(h) { return h.split('.')[0].replace(/[-_]+/g, ' ').replace(/\b\w/g, x => x.toUpperCase()).slice(0, 40); }
function category(h) {
  if (/(ai|openai|huggingface|replicate|model|llm)/i.test(h)) return ['AI', 'AI'];
  if (/(learn|edu|course|school|academy|university|khan|mooc)/i.test(h)) return ['教育', '在线学习'];
  if (/(design|figma|penpot|canvas|font|icon|photo|image|draw)/i.test(h)) return ['设计', '设计与创意'];
  if (/(git|code|dev|api|npm|docker|cloud|stack|program)/i.test(h)) return ['开发', '编程开发'];
  if (/(todo|note|task|calendar|product|work|mail|chat|meet)/i.test(h)) return ['工具', '效率工具'];
  return ['工具', '其他'];
}
function extract(text) {
  const out = [];
  const re = /\[[^\]]{1,100}\]\((https?:\/\/[^\s)]+)\)/g;
  let m;
  while ((m = re.exec(text))) {
    const url = normalize(m[1]);
    if (!url || existing.has(url) || out.some(x => x.url === url)) continue;
    const h = host(url);
    if (!h || /github\.com|gitlab\.com|raw\.githubusercontent\.com|twitter\.com|x\.com/i.test(h)) continue;
    const [cat, tag] = category(h);
    out.push({ name: label(h), full: label(h), cat, tag, brief: `${label(h)}在线服务`, detail: `从公开精选目录发现的 ${label(h)} 官方网站，建议人工确认后收录。`, url, vpn: '是' });
  }
  return out;
}
const all = [];
for (const source of SOURCES) {
  try {
    const res = await fetch(source, { headers: { 'user-agent': 'yuhang-catalog-importer' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = extract(await res.text());
    all.push(...rows);
    console.log(`来源 ${source}: ${rows.length} 个候选`);
  } catch (e) { console.warn(`跳过 ${source}: ${e.message}`); }
}
mkdirSync('data', { recursive: true });
const header = '网站简称\t网站详细名称\t网站所属大类\t网站详细标签\t网站简介\t网站详细简介\t网站官网网址\t是否需要加速器';
const body = all.map(x => [x.name, x.full, x.cat, x.tag, x.brief, x.detail, x.url, x.vpn].join('\t'));
writeFileSync('data/web-catalog-candidates.tsv', [header, ...body].join('\n') + '\n', 'utf8');
writeFileSync('data/web-catalog-import-report.json', JSON.stringify({ sources: SOURCES, existingCount: existing.size, candidateCount: all.length, generatedAt: new Date().toISOString() }, null, 2), 'utf8');
console.log(`已生成候选 ${all.length} 个：data/web-catalog-candidates.tsv`);
