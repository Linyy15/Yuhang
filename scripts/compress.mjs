// 静态资源预压缩：为 web/ 与 dist/index.html 生成 .gz 与 .br 版本
// 用法：node scripts/compress.mjs
// 说明：部署到支持 gzip_static / brotli_static 的服务器（如 nginx）时，
//       浏览器会直接拿到压缩版（约省 60-70%），显著提升加载速度。
//       本地 file:// 打开不需要（本地磁盘读取本就极快）。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const targets = [
  'web/index.html',
  'web/css/style.css',
  'web/js/app.js',
  'web/js/sites-lib.js',
  'web/data/sites.js',
  'web/sw.js',
  'dist/index.html',
];

let total = 0, count = 0;
for (const rel of targets) {
  const p = resolve(root, rel);
  if (!existsSync(p)) continue;
  const src = readFileSync(p);
  const gz = gzipSync(src, { level: 9 });
  const br = brotliCompressSync(src, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } });
  writeFileSync(p + '.gz', gz);
  writeFileSync(p + '.br', br);
  const pct = (1 - gz.length / src.length) * 100;
  console.log(`${rel}  ${(src.length / 1024).toFixed(1)}KB → gzip ${(gz.length / 1024).toFixed(1)}KB (${pct.toFixed(0)}%)`);
  total += src.length; count++;
}
console.log(`\n已生成 ${count} 组 .gz/.br 压缩文件（上传到服务器后开 gzip_static/brotli_static 即可生效）`);
