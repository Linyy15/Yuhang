// 列出可疑/有问题的站点条目，供用户确认删除
import { readFileSync } from 'node:fs';
global.window = {};
eval(readFileSync('web/data/sites.js', 'utf8'));
const SITES = window.SITES;

const suspects = [
  '喜得胜', 'Edge新标签页', '路由器后台', '联通路由器', 'MC皮肤壁纸',
  '英国地址生成器', '台词搜电影', '图吧工具箱', '米粒工作室', 'PCL2启动器',
  '番茄时钟', 'Steam卡牌交易', 'Steam库存查看', '万能命令', 'SeedHub', 'LKs推荐站',
];
for (const n of suspects) {
  const s = SITES.find((x) => x.name === n);
  console.log(
    s
      ? `[${n}] url=${s.url} | 标签: ${s.tags.join(',')} | 简介: ${(s.brief || '').slice(0, 24)}`
      : `[${n}] (不存在)`
  );
}
console.log('---');
console.log('内网/特殊地址条目:');
SITES.filter((x) => x.internal).forEach((s) => console.log(`  ${s.name} -> ${s.url}`));
console.log('总站点数:', SITES.length);
