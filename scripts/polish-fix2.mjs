// scripts/polish-fix2.mjs
// 修：desc 重刷位置错误(在 setLang 体内→只在切语言时生效) 移到 init 处；SW v5→v6 + 加版本日志便于核对。
import { readFileSync, writeFileSync } from 'node:fs';

// ---- 1. app.js：把 desc 重刷从 setLang 体内移到 init 的 applyLang() 之后 ----
const aj = 'web/js/app.js';
let a = readFileSync(aj, 'utf8');

// 从 setLang 体内移除（紧跟 applyLang(); 之后那两行，缩进与 syncThemeUI 不一致）
a = a.replace(
  '    applyLang();\n  if (descTotal) descTotal.textContent = allSites().length;\n  if (descTags) descTags.textContent = (META.tags || []).length;\n    syncThemeUI();',
  '    applyLang();\n    syncThemeUI();'
);

// 在 init 顶层 applyLang() 之后插入（init 处才真正修好开场页 0 计数）
a = a.replace(
  '  YHCards.render();\n  applyLang();\n  initSupabase();',
  '  YHCards.render();\n  applyLang();\n  if (descTotal) descTotal.textContent = allSites().length;\n  if (descTags) descTags.textContent = (META.tags || []).length;\n  initSupabase();'
);

writeFileSync(aj, a, 'utf8');
console.log('setLang 体内移除:', !a.includes('  if (descTotal) descTotal.textContent'));
console.log('init 处插入:', a.includes('applyLang();\n  if (descTotal) descTotal.textContent = allSites()'));

// ---- 2. sw.js：v5 → v6 ----
const sw = 'web/sw.js';
let w = readFileSync(sw, 'utf8');
w = w.replace("const CACHE = 'yuhang-v5';", "const CACHE = 'yuhang-v6';");
writeFileSync(sw, w, 'utf8');
console.log('SW 版本:', w.includes("'yuhang-v6'"));

// ---- 3. app.js 加版本日志，便于 F12 核对 ----
if (!a.includes('APP_BUILD')) {
  a = a.replace(
    "  var S = window.YHState;",
    "  var S = window.YHState;\n  console.log('[屿航] app v6 已加载（SW 缓存命中时仍为旧版请强刷）');"
  );
  writeFileSync(aj, a, 'utf8');
  console.log('版本日志已加');
}
