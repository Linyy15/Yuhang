// 管理页冒烟测试：用最小 DOM 桩在 Node 里真实执行 web/admin/admin.js，
// 验证 列表渲染 / 搜索过滤 / 导出 sites.js / 导出 sites.tsv 全链路。
// 用法：node scripts/smoke-admin.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

let fail = 0;
function check(name, ok, extra) {
  console.log((ok ? '✅' : '❌'), name, extra || '');
  if (!ok) fail++;
}

// ---------- 最小 DOM 桩 ----------
function makeEl(id) {
  return {
    id, _listeners: {}, hidden: false, value: '', innerHTML: '', textContent: '', checked: false,
    className: '', href: '', download: '', title: '', dataset: {},
    addEventListener(type, fn) { (this._listeners[type] = this._listeners[type] || []).push(fn); },
    click() {}, focus() {}, appendChild() {}, remove() {}, setAttribute() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    getAttribute() { return null; }, hasAttribute() { return false; }, closest() { return null; },
  };
}
const elements = {};
const lastA = {};
const documentStub = {
  getElementById(id) { if (!elements[id]) elements[id] = makeEl(id); return elements[id]; },
  createElement(tag) { const el = makeEl(tag); lastA[tag] = el; return el; },
  addEventListener() {},
  body: makeEl('body'),
};
global.document = documentStub;
global.window = global;
global.confirm = () => true;
global.URL.createObjectURL = (b) => { lastA.__blob = b; return 'blob:fake'; };
global.URL.revokeObjectURL = () => {};

// ---------- 装载依赖 + 管理页 ----------
const YH = require('../web/js/sites-lib.js');
global.YH = YH;
eval(readFileSync('web/data/sites.js', 'utf8')); // 设置 window.SITES / SITES_META
eval(readFileSync('web/admin/admin.js', 'utf8')); // 执行管理页逻辑

// ---------- 1. 列表渲染（分页：每页 10） ----------
const TOTAL = window.SITES.length; // 动态取数（避免随数据增改而失效）
const PS = 10;
const tbody = elements['tbody'];
const rowCount = (tbody.innerHTML.match(/<tr/g) || []).length;
check('列表分页渲染（≤10 行）', rowCount <= PS && String(elements['count-total'].textContent) === String(TOTAL),
  `(rows=${rowCount}, total=${elements['count-total'].textContent})`);
check('统计面板更新', String(elements['stat-sites'].textContent) === String(TOTAL), `(stat=${elements['stat-sites'].textContent})`);
check('校验已运行（当前数据集 0 红旗 0 黄旗）',
  String(elements['stat-red'].textContent) === '0' && String(elements['stat-yellow'].textContent) === '0',
  `(red=${elements['stat-red'].textContent}, yellow=${elements['stat-yellow'].textContent})`);
check('后台分页器可见', elements['admin-pager'].hidden === false && elements['admin-pager'].innerHTML.includes('pg-btn'), '');
const page1Html = tbody.innerHTML;
(elements['admin-pager']._listeners.click || []).forEach((fn) => fn({ target: { closest: () => ({ disabled: false, getAttribute: () => 'next' }) } }));
check('后台翻页内容变化', tbody.innerHTML !== page1Html, '');

// ---------- 2. 搜索过滤（模糊增强） ----------
const expectedChat = window.SITES.filter((s) => {
  const fields = [s.name, s.fullName, (s.tags || []).join(' '), s.category, s.brief, s.detail, s.url];
  const modes = ['fuzzy', 'fuzzy', 'fuzzy', 'fuzzy', 'exact', 'exact', 'exact'];
  return fields.some((f, i) => YH.fuzzySearch('chat', f, modes[i]) !== null);
}).length;
elements['search'].value = 'chat';
elements['search']._listeners.input.forEach((fn) => fn());
let n = (elements['tbody'].innerHTML.match(/<tr/g) || []).length;
check('搜索 "chat" 模糊过滤', n === Math.min(expectedChat, PS) && String(elements['count-show'].textContent) === String(expectedChat),
  `(rows=${n}, expected=${expectedChat})`);
elements['search'].value = '';
elements['search']._listeners.input.forEach((fn) => fn());
n = (elements['tbody'].innerHTML.match(/<tr/g) || []).length;
check('清空搜索恢复', n <= PS && String(elements['count-total'].textContent) === String(TOTAL), `(rows=${n})`);

// ---------- 3. 问题筛选（新增站缺详细简介 → 黄旗） ----------
elements['btn-add']._listeners.click.forEach((fn) => fn());
check('新增弹窗打开', elements['editor'].hidden === false, '');
elements['f-name'].value = '冒烟测试站';
elements['f-cat'].value = '测试';
elements['f-tags'].value = '测试';
elements['f-url'].value = ''; // 缺网址 → 红旗
elements['f-brief'].value = '冒烟';
elements['editor-save']._listeners.click.forEach((fn) => fn());
check('缺网址被拦截', elements['editor'].hidden === false, '(保存被阻止，弹窗未关闭)');
elements['f-url'].value = 'https://smoke.example.com';
elements['editor-save']._listeners.click.forEach((fn) => fn());
check('补齐网址后保存成功', elements['editor'].hidden === true, '');
n = (elements['tbody'].innerHTML.match(/<tr/g) || []).length;
check('新增后总数 +1', String(elements['count-total'].textContent) === String(TOTAL + 1) && String(elements['stat-sites'].textContent) === String(TOTAL + 1), `(rows=${n})`);
elements['filter-issue'].value = 'yellow'; // 新增站缺详细简介 → 黄旗
elements['filter-issue']._listeners.change.forEach((fn) => fn());
n = (elements['tbody'].innerHTML.match(/<tr/g) || []).length;
check('仅黄旗筛选命中新增站', n === 1, `(rows=${n})`);
elements['filter-issue'].value = 'red';
elements['filter-issue']._listeners.change.forEach((fn) => fn());
n = (elements['tbody'].innerHTML.match(/<tr/g) || []).length;
check('仅红旗筛选为空', n === 0, `(rows=${n})`);
elements['filter-issue'].value = '';
elements['filter-issue']._listeners.change.forEach((fn) => fn());

// ---------- 4. 删除 ----------
elements['tbody']._listeners.click.forEach((fn) => fn({ target: { closest: () => null } })); // 无操作
const delBtns = elements['tbody'].innerHTML.match(/data-del="([^"]+)"/g) || [];
const delId = (delBtns[0] || '').match(/"([^"]+)"/)[1];
elements['tbody']._listeners.click.forEach((fn) => fn({ target: { closest: (sel) => ({ hasAttribute: (a) => a === 'data-del', getAttribute: (a) => a === 'data-del' ? delId : null }) } }));
n = (elements['tbody'].innerHTML.match(/<tr/g) || []).length;
check('删除后恢复', String(elements['count-total'].textContent) === String(TOTAL) && String(elements['stat-sites'].textContent) === String(TOTAL), `(rows=${n})`);

// ---------- 5. 导出 sites.js ----------
elements['btn-export-js']._listeners.click.forEach((fn) => fn());
const jsBlob = lastA.__blob;
let jsText = '';
await jsBlob.text().then((t) => { jsText = t; });
check('导出文件名 sites.js', lastA['a'].download === 'sites.js', `(file=${lastA['a'].download})`);
check('sites.js 头尾格式正确', jsText.startsWith('window.SITES_META = ') && jsText.includes(';\nwindow.SITES = '), '');
global.window = {};
eval(jsText);
check('导出的 sites.js 可执行', window.SITES && window.SITES.length === TOTAL, `(sites=${window.SITES.length})`);
check('导出 meta 统计正确', window.SITES_META.total === TOTAL && window.SITES_META.tags.length > 0, `(tags=${window.SITES_META.tags.length})`);
const ids = new Set(window.SITES.map((s) => s.id));
check('导出 id 唯一且连续', ids.size === TOTAL && ids.has('s001') && ids.has('s' + String(TOTAL).padStart(3, '0')), '');
const adminSrc = require('fs').readFileSync('web/admin/admin.js', 'utf8');
check('导出支持直接保存(File System Access)', adminSrc.includes('showSaveFilePicker') && adminSrc.includes('suggestedName'), '');

// ---------- 6. 导出 sites.tsv ----------
elements['btn-export-tsv']._listeners.click.forEach((fn) => fn());
const tsvBlob = lastA.__blob;
let tsvText = '';
await tsvBlob.text().then((t) => { tsvText = t; });
check('导出文件名 sites.tsv', lastA['a'].download === 'sites.tsv', `(file=${lastA['a'].download})`);
const tsvLines = tsvText.split(/\r?\n/).filter((l) => l.trim() !== '');
check('tsv 行数 +表头', tsvLines.length === TOTAL + 1, `(lines=${tsvLines.length})`);
const rebuilt = YH.buildSitesFromTsv(tsvText);
check('导出 tsv 可再生成', rebuilt.sites.length === TOTAL, `(sites=${rebuilt.sites.length})`);

// ---------- 7. 批量选择 + 批量删除 + 撤销 ----------
function fakeChkChange(id, checked) {
  (elements['tbody']._listeners.change || []).forEach((fn) => fn({
    target: { closest: (sel) => (sel === 'input[data-chk]' ? { getAttribute: () => id, checked, closest: () => ({ classList: { toggle() {} } }) } : null) },
  }));
}
fakeChkChange('s001', true);
fakeChkChange('s002', true);
check('批量栏显示', elements['batch-bar'].hidden === false && String(elements['batch-n'].textContent) === '2', `(n=${elements['batch-n'].textContent})`);
elements['batch-del']._listeners.click.forEach((fn) => fn());
n = (elements['tbody'].innerHTML.match(/<tr/g) || []).length;
check('批量删除后 -2', String(elements['count-total'].textContent) === String(TOTAL - 2), `(rows=${n})`);
// 撤销（toast 按钮）
const undoBtn = lastA['button'];
check('删除 Toast 带撤销按钮', !!undoBtn && (undoBtn._listeners.click || []).length >= 1, '');
if (undoBtn) (undoBtn._listeners.click || []).forEach((fn) => fn());
n = (elements['tbody'].innerHTML.match(/<tr/g) || []).length;
check('撤销后恢复', String(elements['count-total'].textContent) === String(TOTAL), `(rows=${n})`);
// 排序切换不崩溃
elements['sort-by'].value = 'name';
(elements['sort-by']._listeners.change || []).forEach((fn) => fn());
n = (elements['tbody'].innerHTML.match(/<tr/g) || []).length;
check('按名称排序渲染', n <= PS, `(rows=${n})`);

// ---------- 8. 链接报告导入按钮 ----------
check('链接报告导入按钮存在', !!elements['btn-linkreport'] && !!elements['linkreport-file'], '');

console.log(fail === 0 ? '\n==== 管理页冒烟全部通过 ====' : `\n==== ${fail} 项失败 ====`);
process.exit(fail === 0 ? 0 : 1);
