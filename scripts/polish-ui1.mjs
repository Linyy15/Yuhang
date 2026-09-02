// scripts/polish-ui1.mjs
// P0 视觉去 AI 味：糖果渐变→干净中性背景 / 3 blob 收敛 / 落樱停止 / 光标拖尾隐藏。
import { readFileSync, writeFileSync } from 'node:fs';

const p = 'web/css/style.css';
let s = readFileSync(p, 'utf8');

const before = s.length;

// 1. 背景基调：糖果三色渐变 → 干净中性浅底
s = s.replace(
  '--bg-base: linear-gradient(165deg, #eef1ff 0%, #f7efff 48%, #eaf6ff 100%);',
  '--bg-base: #f5f7fc;'
);

// 2. 3 blob 从糖果色收敛为极淡中性蓝
s = s.replace('--blob-1: rgba(140, 158, 255, 0.4);', '--blob-1: rgba(205, 215, 238, 0.30);');
s = s.replace('--blob-2: rgba(226, 160, 255, 0.36);', '--blob-2: rgba(205, 215, 238, 0.16);');
s = s.replace('--blob-3: rgba(128, 222, 255, 0.34);', '--blob-3: rgba(205, 215, 238, 0.10);');

// 3. 落樱停止（动态 .fx-petal 继承该类，动画与透明度置零）
s = s.replace(
  '  background: var(--petal);\n  opacity: 0.55;\n  will-change: transform;\n  animation: petalFall linear infinite;',
  '  background: var(--petal);\n  opacity: 0;\n  will-change: transform;\n  animation: none;'
);

// 4. 光标光晕/拖尾：功能与观感无关，隐藏
if (!s.includes('/* 屿航 · 视觉克制 · P0 打磨 */')) {
  // 在 body 规则附近插入克制规则
  const marker = 'body {\n  font-family:';
  const css = '\n/* 屿航 · 视觉克制 · P0 打磨 */\n.cursor-glow, .cursor-trail { display: none !important; }\n.fx-petal { animation: none !important; opacity: 0 !important; }\n\n';
  s = s.replace(marker, css + 'body {\n  font-family:');
}

writeFileSync(p, s, 'utf8');
console.log('polish-ui1 applied. bytes:', before, '→', s.length);

// 自检：确认关键替换命中
const checks = [
  ['--bg-base: #f5f7fc;', 'bg-base 改为中性浅底'],
  ['--blob-1: rgba(205, 215, 238, 0.30);', 'blob-1 收敛'],
  ['animation: none !important', '落樱/动效克制'],
  ['.cursor-glow, .cursor-trail { display: none', '光标拖尾隐藏'],
];
for (const [needle, label] of checks) {
  console.log((s.includes(needle) ? '✅' : '❌'), label);
}
