// scripts/fix-panel-occlusion2.mjs
// 修：弹出面板被遮挡。主 .topbar 规则 z-index:50（桌面）+ 移动端覆盖 position:static（破坏堆叠上下文）
// → 两处统一 position:sticky/relative + z-index:90（在 .app transform 之上，在 modal z-index:100 之下）。
import { readFileSync, writeFileSync } from 'node:fs';

const ss = 'web/css/style.css';
let s = readFileSync(ss, 'utf8');

// 1. 主规则：z-index:50 → 90
s = s.replace(
  '  position: sticky;\n  top: 0;\n  z-index: 50;',
  '  position: sticky;\n  top: 0;\n  z-index: 90;'
);

// 2. 移动端覆盖：上次误改 z-index:9000（会盖过 modal 100）→ 回到 90，position:static → relative（保持堆叠上下文）
s = s.replace(
  '  .topbar { position: relative; z-index: 9000; padding: 10px 14px; }',
  '  .topbar { position: relative; z-index: 90; padding: 10px 14px; }'
);

writeFileSync(ss, s, 'utf8');
console.log('主规则 z-index:90:', s.includes('z-index: 90;'));
console.log('移动端 z-index:90:', s.includes('position: relative; z-index: 90; padding: 10px 14px'));
console.log('无 9000 残留:', !s.includes('z-index: 9000'));
