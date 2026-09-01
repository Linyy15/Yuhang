// 链接健康检测：批量探测 web/data/sites.js 中所有网址的可达性
// 用法：node scripts/linkcheck.mjs [并发数] [超时毫秒]   （需联网环境运行）
// 产出：data/linkcheck-report.json（可在后台管理页"🔗 导入链接报告"查看）
import { readFileSync, writeFileSync } from 'node:fs';

global.window = {};
eval(readFileSync('web/data/sites.js', 'utf8'));
const SITES = window.SITES;

const LIMIT = parseInt(process.argv[2] || '6', 10);
const TIMEOUT = parseInt(process.argv[3] || '8000', 10);

const results = [];
async function probe(s) {
  const t0 = Date.now();
  const url = s.url;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), TIMEOUT);
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctl.signal });
    clearTimeout(t);
    results.push({
      id: s.id, name: s.name, url, vpn: !!s.vpn,
      status: res.status, ms: Date.now() - t0,
      redirect: res.url && res.url !== url ? res.url : '',
    });
  } catch (e) {
    results.push({
      id: s.id, name: s.name, url, vpn: !!s.vpn,
      status: 0, ms: Date.now() - t0,
      error: e && e.name === 'AbortError' ? 'timeout' : (e && e.cause && e.cause.code ? String(e.cause.code) : (e ? e.message : 'unknown')),
    });
  }
}

(async () => {
  const queue = SITES.slice();
  const workers = Array.from({ length: LIMIT }, async () => {
    while (queue.length) {
      const s = queue.shift();
      if (s) await probe(s);
    }
  });
  await Promise.all(workers);
  writeFileSync('data/linkcheck-report.json', JSON.stringify(results, null, 2), 'utf8');
  const dead = results.filter((r) => r.status === 0 || r.status >= 400);
  const redir = results.filter((r) => r.redirect);
  const slow = results.filter((r) => r.ms > TIMEOUT * 0.8 && r.status !== 0);
  console.log('==== 链接检测完成 ====');
  console.log('总数:', results.length, '| 异常:', dead.length, '| 重定向:', redir.length, '| 超时:', results.filter((r) => r.error === 'timeout').length);
  console.log('--- 异常站点 ---');
  dead.forEach((r) => console.log('  ✗', r.name, '|', r.status || r.error, '|', r.url, r.vpn ? '（⚡需加速器）' : ''));
  console.log('已生成: data/linkcheck-report.json');
})();
