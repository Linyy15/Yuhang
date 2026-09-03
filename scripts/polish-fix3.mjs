// scripts/polish-fix3.mjs
// 修：inline SVG 未写 width/height，浏览器默认 300x150 → 巨大十字星。统一 1em 尺寸约束（CSS + HTML 双保险）。
import { readFileSync, writeFileSync } from 'node:fs';

// ---- 1. style.css：给所有图标 SVG 加 1em 尺寸规则 ----
const ss = 'web/css/style.css';
let s = readFileSync(ss, 'utf8');
if (!s.includes('.q-ico svg')) {
  const rule = `\n/* inline SVG 图标统一 1em 尺寸（避免默认 300x150 巨大十字星） */\n.intro-quote .q-ico svg, .search-icon svg, .stat-icon svg, .bn-ico svg, .fab-btn svg, .sp-ico svg, .pw-eye svg, .disclaimer-icon svg, .sc-ico svg { width: 1em; height: 1em; display: inline-block; vertical-align: -0.15em; box-sizing: border-box; }\n`;
  // 插到文件末尾
  s = s + rule;
  writeFileSync(ss, s, 'utf8');
  console.log('CSS 1em 规则已加');
} else {
  console.log('CSS 规则已存在');
}

// ---- 2. index.html：给所有 inline SVG 加 width/height（双保险）----
const ih = 'web/index.html';
let h = readFileSync(ih, 'utf8');
// 替换所有 <svg viewBox="0 0 24 24" 为 <svg width="1em" height="1em" viewBox="0 0 24 24"
const before = (h.match(/<svg viewBox="0 0 24 24"/g) || []).length;
h = h.replace(/<svg viewBox="0 0 24 24"/g, '<svg width="1em" height="1em" viewBox="0 0 24 24"');
writeFileSync(ih, h, 'utf8');
console.log('HTML SVG 加了 width/height:', before, '处');

// ---- 3. 同步 dist ----
// 打包脚本会重打，这里只改源文件
