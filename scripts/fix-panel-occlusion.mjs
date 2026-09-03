// scripts/fix-panel-occlusion.mjs
// 修：弹出面板（引擎菜单 engine-menu z-index:60、快捷菜单 fab-panel）被 .app 的 transform
// 堆叠上下文压住。让顶栏成为高层堆叠上下文（position:relative + z-index:9000），把面板罩住。
import { readFileSync, writeFileSync } from 'node:fs';

const ss = 'web/css/style.css';
let s = readFileSync(ss, 'utf8');

// .topbar 当前 position:static（L1210）→ 提权为 relative + z-index:9000
s = s.replace(
  '.topbar { position: static; padding: 10px 14px; }',
  '.topbar { position: relative; z-index: 9000; padding: 10px 14px; }'
);
writeFileSync(ss, s, 'utf8');

console.log('topbar 提权:', s.includes('position: relative; z-index: 9000; padding: 10px 14px'));
