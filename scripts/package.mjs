// 打包脚本：把 web/ 下依赖的本地 CSS / JS 全部内联，输出单文件 index.html
// 用法：node scripts/package.mjs  →  生成 dist/index.html
// 说明：仅内联本地相对路径资源（css/style.css, data/sites.js, js/*.js），
//       若存在 web/js/vendor/supabase.js（下载的 supabase-js UMD 包），也会一并内联，
//       从而做到完全零外链、可离线打开。否则 Supabase 按需懒加载（需联网）。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webDir = resolve(root, 'web');
const htmlPath = resolve(webDir, 'index.html');
const outPath = resolve(root, 'dist', 'index.html');

let html = readFileSync(htmlPath, 'utf8');

// 可选：内联本地 vendor 的 supabase-js（若存在）→ 实现零外链
const vendorSupabase = resolve(webDir, 'js', 'vendor', 'supabase.js');
if (existsSync(vendorSupabase)) {
  let sdk = readFileSync(vendorSupabase, 'utf8').replace(/<\/script/gi, '<\\/script');
  // 插入到首个 <script> 之前（让 window.supabase 先就绪）
  html = html.replace(/<script>/i, '<script>\n' + sdk + '\n</script>\n<script>');
  console.log('已内联 web/js/vendor/supabase.js（零外链）');
}

// 内联 JS：<script src="本地路径"></script> → <script>内容</script>；外链保留（兼容 defer 等属性）
html = html.replace(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g, (m, src) => {
  if (/^https?:\/\//i.test(src) || /^\/\//.test(src)) return m; // 外链保留
  const p = resolve(webDir, src);
  let code = readFileSync(p, 'utf8');
  code = code.replace(/<\/script/gi, '<\\/script'); // 防意外闭合
  return '<script>\n' + code + '\n</script>';
});

// 剔除指向本地文件的 preload 链接（这些资源已内联，避免单文件里请求不存在的文件）
html = html.replace(/<link[^>]+rel="preload"[^>]+href="([^"]+)"[^>]*>/gi, (m, href) => {
  if (/^https?:\/\//i.test(href) || /^\/\//.test(href)) return m; // 外部 preload 保留
  return '';
});

// 内联 CSS：<link rel="stylesheet" href="本地.css"> → <style>内容</style>
html = html.replace(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/gi, (m, href) => {
  const p = resolve(webDir, href);
  let css = readFileSync(p, 'utf8');
  css = css.replace(/<\/style/gi, '<\\/style');
  return '<style>\n' + css + '\n</style>';
});

// 内联 PWA manifest（图标一并转 data URI），单文件也可"添加到主屏幕"
const manPath = resolve(webDir, 'manifest.webmanifest');
if (existsSync(manPath)) {
  let man = readFileSync(manPath, 'utf8');
  const iconPath = resolve(webDir, 'icon.svg');
  if (existsSync(iconPath)) {
    const iconB64 = Buffer.from(readFileSync(iconPath, 'utf8'), 'utf8').toString('base64');
    man = man.replace('"icon.svg"', '"data:image/svg+xml;base64,' + iconB64 + '"');
  }
  const manB64 = Buffer.from(man, 'utf8').toString('base64');
  html = html.replace(
    /<link rel="manifest" href="[^"]*">/i,
    '<link rel="manifest" href="data:application/manifest+json;base64,' + manB64 + '">'
  );
}

mkdirSync(resolve(root, 'dist'), { recursive: true });
writeFileSync(outPath, html, 'utf8');
console.log('已生成单文件: dist/index.html');
console.log('大小:', (html.length / 1024).toFixed(1) + ' KB');
