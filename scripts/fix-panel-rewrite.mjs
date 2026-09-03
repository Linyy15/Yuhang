// scripts/fix-panel-rewrite.mjs
// 重写两个下拉面板：改 position:fixed + JS 动态定位 + .open 类显隐，脱离父级堆叠上下文/裁切。
import { readFileSync, writeFileSync } from 'node:fs';

// ===== 1. CSS =====
const css = 'web/css/style.css';
let s = readFileSync(css, 'utf8');

// 1a. engine-menu：去掉 right:0（改由 .theme-panel.engine-menu 覆盖定位）
s = s.replace('.engine-menu { right: 0; min-width: 120px; }', '.engine-menu { min-width: 120px; }');
if (!s.includes('.engine-menu { min-width: 120px; }')) throw new Error('engine-menu rule not found');

// 1b. 在 .theme-panel[hidden] 后追加 engine-menu 的 fixed 覆盖（两类选择器 > 单类，压过 .theme-panel 的 absolute）
s = s.replace(
  '.theme-panel[hidden] { display: none; }\n',
  '.theme-panel[hidden] { display: none; }\n' +
  '.theme-panel.engine-menu { position: fixed; right: 0; top: 0; z-index: 95; display: none; }\n' +
  '.theme-panel.engine-menu.open { display: grid; }\n'
);
if (!s.includes('.theme-panel.engine-menu {')) throw new Error('theme-panel.engine-menu override not added');

// 1c. 替换 .fab-panel 块：absolute → fixed + z-index:95 + .open 显隐；并补 .theme-wrap 定位锚点
s = s.replace(
  '.fab-panel {\n  position: absolute; right: 0; top: calc(100% + 8px); bottom: auto;\n  min-width: 172px; padding: 8px; border-radius: var(--radius-md);\n  display: grid; gap: 4px;\n  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);\n  animation: pop 0.18s ease;\n}\n.fab-panel[hidden] { display: none; }',
  '.fab-panel {\n  position: fixed; right: 0; top: 0; bottom: auto;\n  min-width: 172px; padding: 8px; border-radius: var(--radius-md);\n  z-index: 95;\n  display: none;\n  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);\n  animation: pop 0.18s ease;\n}\n.fab-panel.open { display: flex; flex-direction: column; gap: 4px; }\n.theme-wrap { position: relative; }'
);
if (!s.includes('position: fixed; right: 0; top: 0; bottom: auto')) throw new Error('fab-panel fixed not set');
if (!s.includes('.theme-wrap { position: relative; }')) throw new Error('theme-wrap relative not set');

writeFileSync(css, s, 'utf8');
console.log('CSS 改写完成');
console.log('  theme-panel.engine-menu fixed:', s.includes('.theme-panel.engine-menu {'));
console.log('  fab-panel fixed:', s.includes('position: fixed; right: 0; top: 0; bottom: auto'));

// ===== 2. app.js：重写快捷菜单(fab)显隐 =====
const app = 'web/js/app.js';
let a = readFileSync(app, 'utf8');
const OLD_FAB = [
  "  $('fab-btn'); $('fab-panel');",
  "  var fabButtons = document.querySelectorAll('.fab-btn');",
  "  function toggleFabPanel(btn) {",
  "    var panel = btn.parentElement ? btn.parentElement.querySelector('.fab-panel') : null;",
  "    if (panel) panel.hidden = !panel.hidden;",
  "  }",
  "  function closeAllFab() {",
  "    document.querySelectorAll('.fab-panel').forEach(function (p) { p.hidden = true; });",
  "  }",
  "  fabButtons.forEach(function (btn) {",
  "    on(btn, 'click', function (e) {",
  "      e.stopPropagation();",
  "      if (!btn.parentElement.querySelector('.fab-panel')) return;",
  "      var alreadyOpen = btn.parentElement.querySelector('.fab-panel[hidden]') === null;",
  "      closeAllFab();",
  "      if (!alreadyOpen) toggleFabPanel(btn);",
  "    });",
  "  });",
  "  document.querySelectorAll('.fab-panel').forEach(function (panel) {",
  "    on(panel, 'click', function (e) {",
  "      if (!(e.target.closest && e.target.closest('.theme-wrap'))) closeAllFab();",
  "    });",
  "  });",
  "  document.addEventListener('click', function (e) {",
  "    if (!(e.target.closest && e.target.closest('.fab'))) closeAllFab();",
  "  });"
].join('\n');

const NEW_FAB = [
  "  $('fab-btn'); $('fab-panel');",
  "  var fabButtons = document.querySelectorAll('.fab-btn');",
  "  function closeAllFab() {",
  "    document.querySelectorAll('.fab-panel').forEach(function (p) {",
  "      p.classList.remove('open'); p.style.top = ''; p.style.left = '';",
  "    });",
  "  }",
  "  function openFabPanel(btn) {",
  "    var panel = btn.parentElement ? btn.parentElement.querySelector('.fab-panel') : null;",
  "    if (!panel) return;",
  "    closeAllFab();",
  "    panel.hidden = false;",
  "    panel.classList.add('open');",
  "    var rect = btn.getBoundingClientRect();",
  "    panel.style.top = (rect.bottom + 8) + 'px';",
  "    requestAnimationFrame(function () {",
  "      var pw = panel.offsetWidth;",
  "      var left = rect.right - pw;",
  "      if (left < 8) left = 8;",
  "      var maxL = window.innerWidth - pw - 8;",
  "      if (left > maxL) left = maxL;",
  "      panel.style.left = left + 'px';",
  "    });",
  "  }",
  "  fabButtons.forEach(function (btn) {",
  "    on(btn, 'click', function (e) {",
  "      e.stopPropagation();",
  "      openFabPanel(btn);",
  "    });",
  "  });",
  "  document.querySelectorAll('.fab-panel').forEach(function (panel) {",
  "    on(panel, 'click', function (e) {",
  "      if (!(e.target.closest && e.target.closest('.theme-wrap'))) closeAllFab();",
  "    });",
  "  });",
  "  document.addEventListener('click', function (e) {",
  "    if (!(e.target.closest && e.target.closest('.fab'))) closeAllFab();",
  "  });",
  "  document.addEventListener('keydown', function (e) {",
  "    if (e.key === 'Escape') closeAllFab();",
  "  });"
].join('\n');

if (!a.includes(OLD_FAB)) throw new Error('OLD_FAB block not found in app.js');
a = a.replace(OLD_FAB, NEW_FAB);
writeFileSync(app, a, 'utf8');
console.log('app.js fab 显隐改写完成');

// ===== 3. search.js：重写引擎菜单显隐 =====
const search = 'web/js/search.js';
let g = readFileSync(search, 'utf8');
const OLD_ENG = [
  "    o.engineBtn.forEach(function (b) { o.on(b, 'click', function (e) {",
  "      e.stopPropagation();",
  "      if (o.engineMenu) o.engineMenu.hidden = !o.engineMenu.hidden;",
  "    }); });"
].join('\n');

const NEW_ENG = [
  "    o.engineBtn.forEach(function (b) { o.on(b, 'click', function (e) {",
  "      e.stopPropagation();",
  "      if (!o.engineMenu) return;",
  "      var menu = o.engineMenu;",
  "      if (menu.classList.contains('open')) {",
  "        menu.classList.remove('open'); menu.style.top = ''; menu.style.left = '';",
  "      } else {",
  "        menu.hidden = false;",
  "        menu.classList.add('open');",
  "        var rect = b.getBoundingClientRect();",
  "        menu.style.top = (rect.bottom + 8) + 'px';",
  "        requestAnimationFrame(function () {",
  "          var pw = menu.offsetWidth;",
  "          var left = rect.right - pw;",
  "          if (left < 8) left = 8;",
  "          var maxL = window.innerWidth - pw - 8;",
  "          if (left > maxL) left = maxL;",
  "          menu.style.left = left + 'px';",
  "        });",
  "      }",
  "    }); });"
].join('\n');

if (!g.includes(OLD_ENG)) throw new Error('OLD_ENG block not found in search.js');
g = g.replace(OLD_ENG, NEW_ENG);

// 引擎菜单外部点击关闭：改用 .open 类判断
g = g.replace(
  "      if (o.engineMenu && !o.engineMenu.hidden && !(e.target.closest && e.target.closest('.engine-wrap'))) {",
  "      if (o.engineMenu && o.engineMenu.classList.contains('open') && !(e.target.closest && e.target.closest('.engine-wrap'))) {"
);
g = g.replace(
  "        o.engineMenu.hidden = true;",
  "        o.engineMenu.classList.remove('open'); o.engineMenu.style.top = ''; o.engineMenu.style.left = '';"
);
// 引擎菜单内点击选中的关闭行（L151 附近）也改
g = g.replace(
  "      if (o.engineMenu) o.engineMenu.hidden = true;\n      if (o.searchInput) o.searchInput.focus();",
  "      if (o.engineMenu) { o.engineMenu.classList.remove('open'); o.engineMenu.style.top = ''; o.engineMenu.style.left = ''; }\n      if (o.searchInput) o.searchInput.focus();"
);

writeFileSync(search, g, 'utf8');
console.log('search.js engine-menu 显隐改写完成');

console.log('\n所有改写完成。');
