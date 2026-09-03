// scripts/polish-fixintro.mjs
// 修开场页 2 个 bug：
// 1) applyLang() 在 YHCards.init 之后运行，用含 "0" 的 i18n 串覆盖 desc-total/desc-tags → 在 applyLang 后重刷真实计数。
// 2) pickQuote 用 textContent 整段覆盖、强塞 ✨，抹掉 SVG → 把 SVG/文字分置两 span，轮换只改文字、不带 ✨。
import { readFileSync, writeFileSync } from 'node:fs';

// ---- 1. index.html：intro-quote 把 SVG 与文字分置两 span ----
const ih = 'web/index.html';
let s = readFileSync(ih, 'utf8');
const spark = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.5 6.5L20 11l-6.5 1.5L12 19l-1.5-6.5L4 11l6.5-1.5L12 3z"/></svg>';
const old = 'id="intro-quote" title="点击换一句">';
const sparkLine = s.indexOf(old);
if (sparkLine < 0) throw new Error('intro-quote anchor not found');
// 整行替换：保留开头缩进
const lineStart = s.lastIndexOf('\n', sparkLine) + 1;
const lineEnd = s.indexOf('\n', sparkLine);
const prefix = s.slice(lineStart, sparkLine + old.length);
const rest = s.slice(lineEnd < 0 ? s.length : lineEnd);
const newQuote = prefix + '<span class="q-ico" aria-hidden="true">' + spark + '</span><span id="q-text">行到水穷处，坐看云起时。</span></p>';
s = s.slice(0, lineStart) + newQuote + rest;
writeFileSync(ih, s, 'utf8');
console.log('index.html q-ico 分置:', s.includes('id="q-text"'));

// ---- 2. app.js：pickQuote 只改 q-text、不带 ✨；applyLang 后重刷 desc 计数 ----
const aj = 'web/js/app.js';
let a = readFileSync(aj, 'utf8');

a = a.replace(
  '  function pickQuote() {\n    if (!introQuote) return;\n    introQuote.textContent = \'✨ \' + QUOTES[Math.floor(Math.random() * QUOTES.length)];\n  }',
  '  function pickQuote() {\n    if (!introQuote) return;\n    var qText = $(\'q-text\');\n    if (qText) qText.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];\n  }'
);
a = a.replace(
  '  applyLang();',
  '  applyLang();\n  if (descTotal) descTotal.textContent = allSites().length;\n  if (descTags) descTags.textContent = (META.tags || []).length;'
);
writeFileSync(aj, a, 'utf8');

console.log('pickQuote 去掉 ✨:', !a.includes("'\u2728 ' + QUOTES"));
console.log('qText:', a.includes("'q-text'"));
console.log('desc 重刷:', a.includes('descTotal) descTotal.textContent = allSites()'));
