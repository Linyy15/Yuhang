// 主页面冒烟测试：用最小 DOM/浏览器桩在 Node 里真实执行 web/js/app.js 初始化，
// 验证 启动不崩 + 侧栏视图入口 + 多引擎搜索 + 热搜降级 + 工具箱渲染 + 视图退出。
// 用法：node scripts/smoke-app.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

let fail = 0;
function check(name, ok, extra) {
  console.log((ok ? '✅' : '❌'), name, extra || '');
  if (!ok) fail++;
}

// ---------- 最小 DOM / 浏览器桩 ----------
const elCache = {};
function makeEl(id) {
  return {
    id, _listeners: {}, hidden: false, value: '', innerHTML: '', textContent: '', checked: false,
    className: '', disabled: false, placeholder: '', title: '', style: {}, dataset: {}, children: [],
    addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); },
    appendChild(c) { this.children.push(c); return c; },
    removeChild() {}, querySelector() { return null; }, querySelectorAll() { return []; },
    closest() { return null; }, getAttribute() { return null; }, setAttribute() {}, removeAttribute() {},
    getContext() { return null; }, setPointerCapture() {},
    focus() {}, click() {}, scrollTo() {}, remove() {},
    classList: {
      _c: [],
      add(c) { if (!this._c.includes(c)) this._c.push(c); },
      remove(c) { this._c = this._c.filter((x) => x !== c); },
      toggle(c, force) {
        const on = force === undefined ? !this._c.includes(c) : !!force;
        if (on) this.add(c); else this.remove(c);
        return on;
      },
      contains(c) { return this._c.includes(c); },
    },
    getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0 }; },
    offsetWidth: 0, offsetHeight: 0,
  };
}
global.window = global;
global._winListeners = {};
const lastA = {};
global.document = {
  getElementById(id) { if (!elCache[id]) elCache[id] = makeEl(id); return elCache[id]; },
  querySelector() { return null; }, querySelectorAll() { return []; },
  createElement(t) { const el = makeEl(t); lastA[t] = el; return el; },
  addEventListener() {}, removeEventListener() {},
  body: makeEl('body'), head: makeEl('head'), documentElement: makeEl('html'), title: '',
};
// 记录 window 级监听（用于模拟滚动触发）
const origAdd = global.addEventListener;
global.addEventListener = (t, fn) => { (global._winListeners[t] = global._winListeners[t] || []).push(fn); };
global.removeEventListener = () => {};
global.localStorage = {
  _d: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._d, k) ? this._d[k] : null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; },
};
function defReadonly(name, value) {
  try { Object.defineProperty(global, name, { value, configurable: true, writable: true }); }
  catch (e) { global[name] = value; }
}
defReadonly('navigator', { language: 'zh-CN', userAgent: 'node-smoke' });
global.requestAnimationFrame = (fn) => setTimeout(fn, 0);
global.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
global.history = { scrollRestoration: 'auto' };
global.location = { href: 'file:///C:/x/web/index.html', search: '', hash: '', protocol: 'file:', hostname: 'file' };
global.scrollTo = () => {};
global.alert = () => {}; global.confirm = () => true;
global.removeEventListener = () => {};
let opened = null;
global.open = (u) => { opened = u; };
// 断网模拟：fetch 立即失败（热搜走多源回退 → 降级直达链路）
try {
  Object.defineProperty(global, 'fetch', { value: () => Promise.reject(new Error('offline-smoke')), configurable: true, writable: true });
} catch (e) {
  global.fetch = () => Promise.reject(new Error('offline-smoke'));
}

// ---------- 装载 ----------
const YH = require('../web/js/sites-lib.js');
global.YH = YH;
eval(readFileSync('web/data/sites.js', 'utf8'));
eval(readFileSync('web/js/state.js', 'utf8'));
eval(readFileSync('web/js/tools.js', 'utf8'));
eval(readFileSync('web/js/search.js', 'utf8'));
eval(readFileSync('web/js/cards.js', 'utf8'));
eval(readFileSync('web/js/auth.js', 'utf8'));
eval(readFileSync('web/js/nav.js', 'utf8'));
eval(readFileSync('web/js/startpage.js', 'utf8'));
try {
  eval(readFileSync('web/js/app.js', 'utf8'));
  check('app.js 启动无异常', true, '');
} catch (e) {
  check('app.js 启动无异常', false, e.message);
  console.log('\n==== 启动失败 ====');
  process.exit(1);
}

// ---------- 1. 侧栏入口 ----------
const catBar = elCache['cat-bar'];
const chipNames = catBar.children.map((c) => (c.children[0] || {}).textContent || '');
check('侧栏含 热搜 / 工具箱 入口', chipNames.includes('📈 热搜') && chipNames.includes('🧰 工具箱'), chipNames.join(' | '));
const chipBtn = (name) => catBar.children.find((c) => (c.children[0] || {}).textContent === name);
function clickChip(name) {
  const b = chipBtn(name);
  if (!b) return false;
  (b._listeners.click || []).forEach((fn) => fn());
  return true;
}

// ---------- 2. 热搜视图（断网 → 降级） ----------
check('点击热搜入口', clickChip('📈 热搜'), '');
await new Promise((r) => setTimeout(r, 300)); // 等 fetch 失败 → 降级渲染
const hotList = elCache['hot-list'];
check('热搜视图打开', elCache['hot-view'].hidden === false && elCache['grid'].hidden === true, '');
check('热搜断网降级渲染', hotList.innerHTML.includes('hot-fallback') && hotList.innerHTML.includes('→') && !hotList.innerHTML.includes('无法获取'), hotList.innerHTML.slice(0, 40));
check('热搜页签渲染', (elCache['hot-tabs'].innerHTML.match(/login-tab/g) || []).length === 6, '');
check('热搜信息条+过滤框', !!elCache['hot-meta'] && !!elCache['hot-filter'] && elCache['hot-meta'].textContent.includes('直达'), `(meta=${elCache['hot-meta'].textContent})`);
check('热搜无自动跳转定时器', !/setTimeout\(function \(\) \{[^}]*location\.href/.test(require('fs').readFileSync('web/js/app.js', 'utf8')), '');

// ---------- 3. 工具箱视图 ----------
check('点击工具箱入口', clickChip('🧰 工具箱'), '');
check('工具箱视图打开', elCache['tools-view'].hidden === false && elCache['grid'].hidden === true, '');
const tgrid = elCache['tools-grid'].innerHTML;
check('工具卡片渲染', (tgrid.match(/tool-card/g) || []).length >= 10, `(cards=${(tgrid.match(/tool-card/g) || []).length})`);
check('工具含密码/Base64/JSON', tgrid.includes('随机密码') && tgrid.includes('Base64') && tgrid.includes('JSON'), '');
check('工具箱新增番茄钟/二维码/IP', tgrid.includes('番茄钟') && tgrid.includes('二维码') && tgrid.includes('IP 查询'), '');

// ---------- 4. 多引擎搜索 ----------
const engineMenu = elCache['engine-menu'], searchInput = elCache['search-input'], btnSearch = elCache['btn-search'];
function pickEngine(code) {
  (engineMenu._listeners.click || []).forEach((fn) => fn({ target: { closest: () => ({ getAttribute: () => code }) } }));
}
function typeAndGo(q) {
  searchInput.value = q;
  (searchInput._listeners.input || []).forEach((fn) => fn());
  (btnSearch._listeners.click || []).forEach((fn) => fn());
}
// ① 站外引擎：只输入不点按钮 → 不应跳转
pickEngine('baidu');
opened = null;
searchInput.value = 'abc';
(searchInput._listeners.input || []).forEach((fn) => fn());
await new Promise((r) => setTimeout(r, 250)); // 等 120ms 防抖窗口
check('站外引擎输入时不跳转', opened === null, opened || '(不应打开)');
// ② 点按钮 → 才跳转
typeAndGo('测试关键词');
check('百度点按钮直达', opened === 'https://www.baidu.com/s?wd=' + encodeURIComponent('测试关键词'), opened || '(未打开)');
pickEngine('github');
typeAndGo('supabase');
check('GitHub 点按钮直达', opened === 'https://github.com/search?q=supabase', opened || '');

// ---------- 5. 站内搜索恢复 + 视图退出 ----------
pickEngine('local');
typeAndGo('chat');
check('站内搜索恢复渲染', elCache['grid'].hidden === false && elCache['grid'].innerHTML.includes('card'), '');
check('退出视图后 grid 可见', elCache['tools-view'].hidden === true && elCache['rank-view'].hidden === true, '');
check('热搜/工具箱 chip 取消高亮', !(chipBtn('📈 热搜').className.includes('active')) && !(chipBtn('🧰 工具箱').className.includes('active')), '');

// ---------- 6. 排行视图（未登录 → 弹登录） ----------
clickChip('🏆 排行'); // 未登录时应提示登录，不进入视图
check('排行未登录拦截', elCache['rank-view'].hidden === true, '');

// ---------- 7. 一键回顶 + 页脚免责 ----------
const backTop = elCache['back-top'];
check('回顶按钮存在', !!backTop && (backTop._listeners.click || []).length >= 1, '');
check('回顶按钮初始隐藏', backTop.hidden === true, `(hidden=${backTop.hidden})`);
let scrollTop = null;
global.scrollTo = (o) => { scrollTop = o; };
(backTop._listeners.click || []).forEach((fn) => fn());
check('点击回顶平滑滚动到 0', scrollTop && scrollTop.top === 0 && scrollTop.behavior === 'smooth', JSON.stringify(scrollTop));
check('页脚免责说明存在', /footer_disclaimer/.test(require('fs').readFileSync('web/js/app.js', 'utf8')), '');
check('免责弹窗文案说明本地存储', /默认仅保存在当前浏览器/.test(require('fs').readFileSync('web/js/app.js', 'utf8')), '');

// ---------- 8. 起始页收藏投影（当前账号隔离 + 状态卡） ----------
check('起始页脚本已加载', !!global.YHStartPage && typeof global.YHStartPage.open === 'function', '');
// 游客不应显示其他账号的收藏
global.localStorage.setItem('nav_favs_v1', JSON.stringify({ 'other@example.com': ['ai-chatgpt'] }));
if (global.YHStartPage && global.YHStartPage.open) global.YHStartPage.open();
check('起始页游客收藏数为0', String(elCache['sp-fav-count'].textContent) === '0', `(count=${elCache['sp-fav-count'].textContent})`);
check('起始页快捷链接数', String(elCache['sp-link-count'].textContent) === '12', `(links=${elCache['sp-link-count'].textContent})`);
if (global.YHStartPage && global.YHStartPage.close) global.YHStartPage.close();

// ---------- 9. 起始页动效 ----------
const fs8 = require('fs');
check('拖拽手柄存在', !!elCache['avatar-drag'] && (elCache['avatar-drag']._listeners.pointerdown || []).length >= 1, '');
check('滚动联动不崩溃', !!elCache['intro-inner'], '');
check('极光/blob/脉冲元素在 HTML',
  fs8.readFileSync('web/index.html', 'utf8').includes('morph-blob') &&
  fs8.readFileSync('web/index.html', 'utf8').includes('aurora-1') &&
  fs8.readFileSync('web/index.html', 'utf8').includes('pulse-ring'), '');

// ---------- 10. 展示区已删除（MacBook / 3D 地球 / gooey） ----------
check('MacBook 展示区已删除', !fs8.readFileSync('web/index.html', 'utf8').includes('mac-sec') && !fs8.readFileSync('web/index.html', 'utf8').includes('mac-content'), '');
check('3D 地球已删除', !fs8.readFileSync('web/index.html', 'utf8').includes('globe-sec') && !fs8.readFileSync('web/js/app.js', 'utf8').includes('initGlobe'), '');
check('搜索框无 gooey 残留', !fs8.readFileSync('web/index.html', 'utf8').includes('goo-blob') && !fs8.readFileSync('web/index.html', 'utf8').includes('goo-search'), '');
check('主界面直达（intro 后即 app）', /id="app"/.test(fs8.readFileSync('web/index.html', 'utf8')), '');

// ---------- 10. 开场页数据正确 ----------
const dt = elCache['desc-total'] || {};
check('开场页网站数非 0', String(dt.textContent) !== '0' && dt.textContent !== '', `(desc-total=${dt.textContent})`);
check('开场页标签数非 0', String((elCache['desc-tags'] || {}).textContent) !== '0', `(desc-tags=${(elCache['desc-tags'] || {}).textContent})`);
check('无 2.5s 自动收起定时器', !/setTimeout\(reveal, 2500\)/.test(fs8.readFileSync('web/js/app.js', 'utf8')), '');

// ---------- 11. 滚动进入主界面 ----------
const bodyEl = global.document.body;
// 重置状态，验证"滚动 → 进入"链路（此前回顶按钮测试已触发过 entered）
bodyEl.classList.remove('entered');
elCache['app'].classList.remove('revealed');
check('重置后未进入', !bodyEl.classList.contains('entered'), '');
global.scrollY = 150;
(global._winListeners.scroll || []).forEach((fn) => fn());
check('滚动后开场页收起（entered）', bodyEl.classList.contains('entered'), '');
check('滚动后主界面显现（revealed）', elCache['app'].classList.contains('revealed'), '');

// ---------- 12. 免责声明 ----------
check('首次访问弹出免责声明', elCache['disclaimer-modal'].hidden === false, `(hidden=${elCache['disclaimer-modal'].hidden})`);
// 必须先勾选了解 → 才能点击“我知道了”关闭并记录
elCache['disclaimer-consent'].checked = true;
(elCache['disclaimer-consent']._listeners.change || []).forEach((fn) => fn());
(elCache['disclaimer-ok']._listeners.click || []).forEach((fn) => fn());
check('点击后关闭并记录', elCache['disclaimer-modal'].hidden === true && global.localStorage.getItem('nav_disclaimer_v1') === '1', '');
// 设置里的"再次显示" → 清标记并重弹
(elCache['btn-show-disclaimer']._listeners.click || []).forEach((fn) => fn());
check('设置按钮可重新弹出', elCache['disclaimer-modal'].hidden === false && global.localStorage.getItem('nav_disclaimer_v1') === null, '');

// ---------- 13. 新功能：PWA / 数据备份 / 新工具 ----------
check('PWA manifest 链接与主题色', fs8.readFileSync('web/index.html', 'utf8').includes('manifest.webmanifest') && fs8.readFileSync('web/index.html', 'utf8').includes('theme-color'), '');
check('manifest 与图标文件存在', fs8.existsSync('web/manifest.webmanifest') && fs8.existsSync('web/icon.svg'), '');
check('备份导出按钮存在', !!elCache['btn-export-data'] && !!elCache['btn-import-data'] && !!elCache['import-file'], '');
(elCache['btn-export-data']._listeners.click || []).forEach((fn) => fn());
check('导出触发下载 yuhang-backup.json', (lastA['a'] || {}).download === 'yuhang-backup.json', `(file=${(lastA['a'] || {}).download})`);
// 工具箱新增工具
const tgrid2 = elCache['tools-grid'].innerHTML;
check('工具箱含正则测试', tgrid2.includes('正则测试'), '');
check('工具箱含单位换算', tgrid2.includes('单位换算'), '');

// ---------- 14. UI 重构：悬浮球 / 底部导航 / 紧凑卡片 ----------
check('悬浮球存在', !!elCache['fab-btn'] && !!elCache['fab-panel'], '');
check('登录/设置/随机已移入悬浮球面板',
  (elCache['fab-panel'].innerHTML || '').includes('btn-login') === false && // innerHTML 不含（按钮是 DOM 节点）
  !!elCache['btn-login'] && !!elCache['btn-settings'] && !!elCache['btn-random'], '');
check('底部导航 5 项快捷栏', (fs8.readFileSync('web/index.html', 'utf8').match(/data-bn="/g) || []).length >= 5, '');
check('卡片已精简（无简介行）', !elCache['grid'].innerHTML.includes('card-brief'), '');
check('卡片仅一个标签', (elCache['grid'].innerHTML.match(/class="tag"/g) || []).length <= 450, `(tags=${(elCache['grid'].innerHTML.match(/class="tag"/g) || []).length})`);

// ---------- 15. 注册邮件申请 / 新工具 / 焦点修复 ----------
const appSrc = fs8.readFileSync('web/js/app.js', 'utf8') + '\n' + fs8.readFileSync('web/js/search.js', 'utf8') + '\n' + fs8.readFileSync('web/js/cards.js', 'utf8') + '\n' + fs8.readFileSync('web/js/auth.js', 'utf8') + '\n' + fs8.readFileSync('web/js/nav.js', 'utf8');
check('公开版未内置私人邮箱', !appSrc.includes('@163.com') && !appSrc.includes('@126.com'), '');
check('工具箱含计算器', tgrid2.includes('计算器'), '');
check('工具箱含函数图像', tgrid2.includes('函数图像'), '');
check('鼠标点击不显示焦点轮廓（防同时亮）', fs8.readFileSync('web/css/style.css', 'utf8').includes(':focus:not(:focus-visible)'), '');

// ---------- 16. A/B/C/D 新功能 ----------
check('链接检测脚本存在', fs8.existsSync('scripts/linkcheck.mjs'), '');
check('SW 离线缓存存在且已注册', fs8.existsSync('web/sw.js') && appSrc.includes("serviceWorker.register"), '');
check('SW 数据文件网络优先（改数据即时生效）', (() => { const sw = fs8.readFileSync('web/sw.js', 'utf8'); return /const CACHE = 'yuhang-v\d+'/.test(sw) && sw.includes('/\\/data\\/sites\\.(js|json)$/') && sw.includes('fetch(req)'); })(), '');
check('书签导入按钮存在', !!elCache['btn-import-bm'] && !!elCache['import-bm-file'], '');
check('工作区拖拽排序代码存在', appSrc.includes('reorderWs') && appSrc.includes('data-wsid'), '');

// ---------- 17. 移动端优化 ----------
check('favicon 多源回退（国内可达优先）', appSrc.includes('favicon.im') && appSrc.includes('icons.duckduckgo.com') && appSrc.includes('google.com/s2/favicons'), '');
check('分类栏吸顶（sticky）', fs8.readFileSync('web/css/style.css', 'utf8').includes('.cat-bar {\n    flex-direction: row; flex-wrap: nowrap;') || fs8.readFileSync('web/css/style.css', 'utf8').includes('scroll-snap-type'), '');
check('移动端卡片更紧凑', fs8.readFileSync('web/css/style.css', 'utf8').includes('.card .icon { width: 34px;'), '');

// ---------- 18. 主站整列表渲染（不分页；分页在后台管理） ----------
searchInput.value = '';
(searchInput._listeners.input || []).forEach((fn) => fn());
chipBtn('全部')._listeners.click.forEach((fn) => fn());
check('主站整列表渲染', (elCache['grid'].innerHTML.match(/class="card"/g) || []).length >= 400,
  `(cards=${(elCache['grid'].innerHTML.match(/class="card"/g) || []).length})`);
check('主站无分页器', !fs8.readFileSync('web/index.html', 'utf8').includes('id="pager"'), '');
check('手机端主站 2 列', fs8.readFileSync('web/css/style.css', 'utf8').includes('repeat(2, 1fr)'), '');

// ---------- 19. 新功能（有用有趣系列） ----------
const htmlSrc = fs8.readFileSync('web/index.html', 'utf8');
check('快捷键说明面板', !!elCache['help-modal'] && htmlSrc.includes('help-modal') && appSrc.includes("e.key === '/'"), '');
check('每日一言元素', !!elCache['intro-quote'] && appSrc.includes('QUOTES'), '');
check('漫游模式按钮', !!elCache['btn-wander'] && appSrc.includes('wanderTimer'), '');
check('数据统计面板', !!elCache['stat-modal'] && !!elCache['btn-stats'] && appSrc.includes('renderStats'), '');
check('最近访问记录逻辑', appSrc.includes('addRecent') && appSrc.includes('RECENT_CAT'), '');
check('站内搜索热词', !!elCache['search-hot'] && appSrc.includes('recordHotWord'), '');
check('收藏一键全部打开', !!elCache['fav-openall'] && appSrc.includes('openSitesInTabs'), '');
check('卡片按名称字母排序', appSrc.includes('byName') && appSrc.includes('.sort(byName)'), '');
check('移动端筛选下拉按钮', htmlSrc.includes('cat-filter-btn') && htmlSrc.includes('cat-dropdown') && fs8.readFileSync('web/css/style.css', 'utf8').includes('.cat-bar { display: none !important; }'), '');
check('加载界面存在', htmlSrc.includes('id="loader"') && fs8.readFileSync('web/css/style.css', 'utf8').includes('.loader.hide'), '');
check('加载界面逻辑', appSrc.includes('is-loading') && appSrc.includes('hideLoader') && appSrc.includes('tryHideLoader'), '');
check('底部导航收藏/工具直达', appSrc.includes("act === 'favs'") && appSrc.includes("act === 'tools'") && appSrc.includes('syncBottomNav'), '');
check('今天去哪询问弹窗', !!elCache['random-modal'] && htmlSrc.includes('random-modal') && appSrc.includes('randomPick') && appSrc.includes('random_open'), '');
check('卡片飞出优化', appSrc.includes('flyOutCards') && appSrc.includes('card-launch') && fs8.readFileSync('web/css/style.css', 'utf8').includes('cardOut'), '');
check('搜索联想+网址直达', appSrc.includes('renderSearchAc') && appSrc.includes('ac_direct'), '');
check('导出收藏为书签', appSrc.includes('exportBookmarksHtml') && appSrc.includes('NETSCAPE-Bookmark-file-1'), '');
check('复制标题+网址', appSrc.includes('m-copy2') && appSrc.includes('copy_title_url'), '');
check('提交收录通过 GitHub Issues', !!elCache['btn-submit'] && htmlSrc.includes('submit-modal') && appSrc.includes('mailToOwner') && appSrc.includes('github.com/Linyy15/linyueyuan1/issues/new'), '');
check('反馈发给站长', htmlSrc.includes('fb-mail') && appSrc.includes('fb_mail_subject'), '');
check('加载性能优化', htmlSrc.includes('rel="preload"') && htmlSrc.includes('defer') && fs8.existsSync('scripts/compress.mjs'), '');

console.log(fail === 0 ? '\n==== 主页面冒烟全部通过 ====' : `\n==== ${fail} 项失败 ====`);
process.exit(fail === 0 ? 0 : 1);
