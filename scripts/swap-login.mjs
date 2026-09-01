// 用新的 Supabase 登录区块替换 app.js 中旧的本地登录区块
import { readFileSync, writeFileSync } from 'node:fs';
const js = readFileSync('web/js/app.js', 'utf8');
const start = js.indexOf('  // ---------- 登录（Supabase 邮箱/验证码/谷歌/微软 + 本地离线兜底） ----------');
const end = js.indexOf('  // ---------- 添加个人网站 ----------');
if (start < 0 || end < 0 || end <= start) { console.error('markers not found', start, end); process.exit(1); }
const block = readFileSync('scripts/login-section.js', 'utf8');
const out = js.slice(0, start) + block.trimEnd() + '\n\n' + js.slice(end);
writeFileSync('web/js/app.js', out, 'utf8');
console.log('登录区块已替换');
