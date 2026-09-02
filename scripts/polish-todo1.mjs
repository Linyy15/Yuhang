// scripts/polish-todo1.mjs
// P1: todo 并入共享设计系统——引入 base.css，删独立 :root + dark 块，字体改统一 token。
import { readFileSync, writeFileSync } from 'node:fs';

const p = 'web/todo.html';
let s = readFileSync(p, 'utf8');
const before = s.length;

// 1. 在 ip.css 前引入共享基础 token
s = s.replace(
  '<link rel="stylesheet" href="ip/ip.css">',
  '<link rel="stylesheet" href="css/base.css">\n<link rel="stylesheet" href="ip/ip.css">'
);

// 2. 删除 <style> 后的独立 :root + dark-mode :root 块（保留 * / html / body 等后续规则）
const anchor = '\n* { box-sizing: border-box; margin: 0; padding: 0; }';
const ai = s.indexOf(anchor);
if (ai < 0) throw new Error('anchor not found');
const head = s.slice(0, ai);
// head 末尾是 <style>\n:root{...} @media{...} \n —— 截断到 <style>
const stylePos = head.indexOf('<style>');
const tail = s.slice(ai);
const newHead = head.slice(0, stylePos) + '<style>\n';
s = newHead + tail;

// 3. body 字体改统一 token
s = s.replace(
  'font-family: "Segoe UI", "Microsoft YaHei", system-ui, -apple-system, sans-serif;',
  'font-family: var(--font);'
);

writeFileSync(p, s, 'utf8');

// 自检
const checks = [
  ['<link rel="stylesheet" href="css/base.css">', '引入 base.css'],
  ['font-family: var(--font);', 'body 字体统一'],
];
for (const [n, l] of checks) console.log((s.includes(n) ? '✅' : '❌'), l);
const hasRoot = /<style>\s*\n:root\s*{/.test(s);
console.log((!hasRoot ? '✅' : '❌'), '删除了独立 :root 块', `(still:${hasRoot})`);
console.log('bytes:', before, '→', s.length);
