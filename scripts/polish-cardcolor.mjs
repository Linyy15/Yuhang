// scripts/polish-cardcolor.mjs
// P2: 卡片色收敛——tagHue 饱和从 58-83%（糖果色）降到 28-37%（柔和）。
import { readFileSync, writeFileSync } from 'node:fs';

const p1 = 'web/js/app.js';
let s = readFileSync(p1, 'utf8');
s = s.replace("return '228 70%';", "return '228 28%';");
s = s.replace('var sat = 58 + (h % 26);', 'var sat = 28 + (h % 10);');
writeFileSync(p1, s, 'utf8');

const p2 = 'web/css/style.css';
let c = readFileSync(p2, 'utf8');
c = c.replace('--card-c: 228 70%;', '--card-c: 228 28%;');
writeFileSync(p2, c, 'utf8');

console.log('app.js 228 28%:', s.includes("return '228 28%'"));
console.log('app.js sat:', s.includes('var sat = 28 + (h % 10);'));
console.log('style.css card-c:', c.includes('--card-c: 228 28%;'));
