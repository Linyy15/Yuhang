// scripts/polish-ui3.mjs
// P3 图标去 AI 味：顶栏 / 底部导航 / 统计 / FAB / 起始页 / 开场引言 的静态 emoji 换为内联 SVG（currentColor, 24 viewBox）。
import { readFileSync, writeFileSync } from 'node:fs';

const p = 'web/index.html';
let s = readFileSync(p, 'utf8');
const before = s.length;

// 统一的 SVG 图标（24×24，描边 2，round，currentColor 继承文本/强调色）
const IC = {
  search:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="M21 21l-4.35-4.35"/></svg>',
  home:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v11h14V10"/></svg>',
  tools:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6a1.5 1.5 0 0 0 2.1 2.1l6-6a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.1-2.1 2.4-2.4z"/></svg>',
  me:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  fav:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-4.5-9.5-9C1 9 3 5 7 5c2 0 4 1.5 5 3.5C13 6.5 15 5 17 5c4 0 6 4 4.5 7-2.5 4.5-9.5 9-9.5 9z"/></svg>',
  bolt:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z"/></svg>',
  spark:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.5 6.5L20 11l-6.5 1.5L12 19l-1.5-6.5L4 11l6.5-1.5L12 3z"/></svg>',
};

// 顶栏搜索 🔍
s = s.replace('<span class="search-icon">🔍</span>', '<span class="search-icon">' + IC.search + '</span>');
// 底部导航
s = s.replace('<span class="bn-ico">🏠</span>', '<span class="bn-ico">' + IC.home + '</span>');
s = s.replace('<span class="bn-ico">🔍</span>', '<span class="bn-ico">' + IC.search + '</span>');
s = s.replace('<span class="bn-ico">🧰</span>', '<span class="bn-ico">' + IC.tools + '</span>');
s = s.replace('<span class="bn-ico">👤</span>', '<span class="bn-ico">' + IC.me + '</span>');
// 底部导航"收藏 favs" 图标（若有）
s = s.replace('<span class="bn-ico">⭐</span>', '<span class="bn-ico">' + IC.fav + '</span>');
// FAB 触发 ⚡
s = s.replace('<button id="fab-btn" class="fab-btn" title="快捷菜单" aria-label="快捷菜单">⚡</button>',
              '<button id="fab-btn" class="fab-btn" title="快捷菜单" aria-label="快捷菜单">' + IC.bolt + '</button>');
// 统计图标
s = s.replace('<span class="stat-icon">🏝️</span>', '<span class="stat-icon">' + IC.search + '</span>');
s = s.replace('<span class="stat-icon">🏷️</span>', '<span class="stat-icon">' + IC.spark + '</span>');
// 起始页搜索
s = s.replace('<span class="sp-ico" aria-hidden="true">🔍</span>', '<span class="sp-ico" aria-hidden="true">' + IC.search + '</span>');
// 开场引言 ✨
s = s.replace('<p class="intro-quote" id="intro-quote" title="点击换一句">✨ 行到水穷处，坐看云起时。</p>',
              '<p class="intro-quote" id="intro-quote" title="点击换一句">' + IC.spark + ' 行到水穷处，坐看云起时。</p>');

writeFileSync(p, s, 'utf8');

// 自检：目标 emoji 已消失，SVG 已注入
const gone = ['🔍</span>', '🏠</span>', '🧰</span>', '👤</span>', '⚡</button>', '🏝️</span>', '🏷️</span>', '✨ 行到水穷处'];
for (const g of gone) console.log((!s.includes(g) ? '✅' : '❌'), '移除', g);
for (const [k, v] of Object.entries(IC)) console.log((s.includes(v) ? '✅' : '⚠️'), 'SVG', k);
console.log('bytes:', before, '→', s.length);
