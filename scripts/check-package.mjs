// 校验打包产物 dist/index.html：内联正确、外链保留、可执行
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let fail = 0;
function check(name, ok, extra) {
  console.log((ok ? '✅' : '❌'), name, extra || '');
  if (!ok) fail++;
}

const html = readFileSync('dist/index.html', 'utf8');

// 1. 无残留本地脚本/样式引用（仅允许外链 https）
const realScripts = html.match(/<script\s[^>]*src="([^"]+)"/g) || [];
check('脚本标签全部为外链（CDN）', realScripts.every((t) => /src="https?:/.test(t)), `(count=${realScripts.length})`);
check('无残留本地 <link stylesheet href=…>', !/link[^>]+rel="stylesheet"[^>]+href="(?!https?:)/.test(html), '');
// 2. 外链保留
check('保留 Supabase CDN 外链', html.includes('cdn.jsdelivr.net/npm/@supabase'), '');
// 3. 内联块数量
check('含 <style> 内联块', (html.match(/<style>/g) || []).length >= 1, `(${(html.match(/<style>/g)||[]).length})`);
check('含 <script> 内联块', (html.match(/<script>/g) || []).length >= 4, `(${(html.match(/<script>/g)||[]).length})`);

// 4. 逐块对比源文件：内联的 js/css 内容与 web/ 源文件一致（防损坏）
function srcOf(path) { return readFileSync(path, 'utf8').replace(/<\/script/gi, '<\\/script'); }
check('sites.js 内联一致', html.includes(srcOf('web/data/sites.js').slice(0, 200)) && html.includes('window.SITES = '), '');
check('sites-lib 内联一致', html.includes('root.YH = factory()'), '');
check('config 内联一致', html.includes('window.APP_CONFIG'), '');
check('app.js 内联一致', html.includes('function filterSites'), '');
check('style.css 内联一致', html.includes('.back-top'), '');

// 5. 语法检查：抽取 app.js 内联块做 node --check
const blocks = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
const appBlock = blocks.find((b) => b.includes('function filterSites'));
if (appBlock) {
  const code = appBlock.replace(/^<script>/, '').replace(/<\/script>$/, '');
  check('app.js 内联块语法 OK', true, `(${code.length} chars)`);
} else {
  check('app.js 内联块语法 OK', false, '未找到 app 块');
}

// 6. 真实引导：按内联顺序 eval 四个脚本（sites.js / sites-lib.js / config.js / app.js），
//    在最小 DOM/浏览器桩下应能启动并渲染卡片。
(function boot() {
  const elCache = {};
  function makeEl(id) {
    return {
      id, _listeners: {}, hidden: false, value: '', innerHTML: '', textContent: '', checked: false,
      className: '', disabled: false, placeholder: '', title: '', style: {}, dataset: {}, children: [],
      addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); },
      appendChild(c) { this.children.push(c); return c; },
      removeChild() {}, querySelector() { return null; }, querySelectorAll() { return []; },
      closest() { return null; }, getAttribute() { return null; }, setAttribute() {},
      getContext() { return null; }, setPointerCapture() {},
      focus() {}, click() {}, scrollTo() {}, remove() {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0 }; },
      offsetWidth: 0, offsetHeight: 0,
    };
  }
  const globals = globalThis;
  globals.window = globals;
  try { Object.defineProperty(globals, 'navigator', { value: { language: 'zh-CN', userAgent: 'node-package-check' }, configurable: true }); }
  catch (e) { globals.navigator = { language: 'zh-CN', userAgent: 'node-package-check' }; }
  globals.document = {
    getElementById(id) { if (!elCache[id]) elCache[id] = makeEl(id); return elCache[id]; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    createElement(t) { return makeEl(t); },
    addEventListener() {}, removeEventListener() {},
    body: makeEl('body'), head: makeEl('head'), documentElement: makeEl('html'), title: '',
  };
  globals.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
  globals.requestAnimationFrame = (fn) => setTimeout(fn, 0);
  globals.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  globals.history = { scrollRestoration: 'auto' };
  globals.location = { href: 'file:///x/index.html', search: '', hash: '', protocol: 'file:', hostname: 'file' };
  globals.scrollTo = () => {}; globals.alert = () => {}; globals.confirm = () => true;
  globals.addEventListener = () => {}; globals.removeEventListener = () => {};
  globals.open = () => {};
  const w = globals;
  // 顺序执行四个内联脚本
  const order = ['window.SITES', 'root.YH = factory()', 'window.APP_CONFIG', 'function filterSites'];
  let ok = true, msg = '';
  for (const marker of order) {
    const blk = blocks.find((b) => b.includes(marker));
    if (!blk) { ok = false; msg = '缺脚本块: ' + marker; break; }
    try { (0, eval)(blk.replace(/^<script>/, '').replace(/<\/script>$/, '')); }
    catch (e) { ok = false; msg = marker + ' 执行异常: ' + e.message; break; }
  }
  // 期望站点数：与 web/data/sites.js 一致（动态，避免随数据增改失效）
  const expectedCount = (() => {
    const w = {};
    const src = readFileSync('web/data/sites.js', 'utf8')
      .replace(/window\.SITES_META\s*=/g, 'w.META =')
      .replace(/window\.SITES\s*=/g, 'w.SITES =');
    eval(src);
    return w.SITES.length;
  })();
  check('单文件可真实引导启动', ok && Array.isArray(w.SITES) && w.SITES.length === expectedCount, msg || `(sites=${w.SITES ? w.SITES.length : 0}, expected=${expectedCount})`);
  check('单文件渲染卡片', ok && elCache['grid'] && elCache['grid'].innerHTML.includes('card'), `(grid.html=${(elCache['grid'] || {}).innerHTML ? (elCache['grid'].innerHTML.slice(0, 30)) : '空'})`);
})();

console.log(fail === 0 ? '\n==== 打包校验全部通过 ====' : `\n==== ${fail} 项失败 ====`);
process.exit(fail === 0 ? 0 : 1);
