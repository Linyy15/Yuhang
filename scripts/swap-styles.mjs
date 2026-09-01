// 用新的 9 套风格 CSS 替换 style.css 中旧的风格区块
import { readFileSync, writeFileSync } from 'node:fs';

const css = readFileSync('web/css/style.css', 'utf8');
const startMarker = '/* ===== 风格：深色（颜色由 data-color 提供） ===== */';
const endMarker = '/* ===== 主题颜色（仅换主题色，不换风格） ===== */';
const start = css.indexOf(startMarker);
const end = css.indexOf(endMarker);
if (start < 0 || end < 0 || end <= start) {
  console.error('markers not found:', start, end);
  process.exit(1);
}
const newBlock = readFileSync('scripts/theme-styles.css', 'utf8');
const out = css.slice(0, start) + newBlock.trimEnd() + '\n\n' + css.slice(end);
writeFileSync('web/css/style.css', out, 'utf8');
console.log('替换完成，旧风格区块长度:', end - start);
