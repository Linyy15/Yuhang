// 搜索/筛选逻辑测试（使用真实生成的数据 + 公共模块的模糊搜索）
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const YH = require('../web/js/sites-lib.js');
global.window = {};
eval(readFileSync('web/data/sites.js', 'utf8'));
const SITES = window.SITES;

// 与管理页 app.js filterSites 保持一致的筛选逻辑（含模糊搜索）
function filter(keyword, activeCat, selectedTags, favs, clicks) {
  const kw = (keyword || '').trim().toLowerCase();
  let list;
  if (activeCat === '⭐ 收藏') list = SITES.filter((s) => favs.has(s.id));
  else if (activeCat === '🔥 最常') list = SITES.filter((s) => (clicks[s.id] || 0) > 0).slice(0, 12);
  else if (selectedTags.size) list = SITES.filter((s) => s.tags.some((t) => selectedTags.has(t)));
  else list = SITES;
  if (kw) {
    const scored = [];
    list.forEach((s) => {
      let best = null;
      const bump = (sc) => { if (sc !== null && (best === null || sc > best)) best = sc; };
      bump(YH.fuzzySearch(kw, s.name, 'fuzzy'));
      bump(YH.fuzzySearch(kw, s.fullName, 'fuzzy'));
      bump(YH.fuzzySearch(kw, (s.tags || []).join(' '), 'fuzzy'));
      bump(YH.fuzzySearch(kw, s.category, 'fuzzy'));
      bump(YH.fuzzySearch(kw, s.brief, 'fuzzy'));
      bump(YH.fuzzySearch(kw, s.detail, 'fuzzy'));
      bump(YH.fuzzySearch(kw, s.url, 'exact'));
      if (best !== null) scored.push({ s, score: best });
    });
    scored.sort((a, b) => b.score - a.score);
    list = scored.map((x) => x.s);
  }
  return list;
}

const favs = new Set();
const clicks = {};

console.log('搜索 "chat":', filter('chat', '全部', new Set(), favs, clicks).map((s) => s.name).join(', ') || '(无结果!)');
console.log('搜索 "视频":', filter('视频', '全部', new Set(), favs, clicks).length, '个结果');
console.log('搜索 "gpt":', filter('gpt', '全部', new Set(), favs, clicks).map((s) => s.name).join(', ') || '(无结果!)');
console.log('标签 [AI]:', filter('', '', new Set(['AI']), favs, clicks).length, '个');
console.log('标签 [AI]+[设计与创意]:', filter('', '', new Set(['AI', '设计与创意']), favs, clicks).length, '个');
console.log('搜索 "steam" 且在标签[游戏]中:', filter('steam', '', new Set(['游戏']), favs, clicks).map((s) => s.name).join(', ') || '(无)');
console.log('搜索 "bilibili":', filter('bilibili', '全部', new Set(), favs, clicks).map((s) => s.name).join(', '));
console.log('收藏视图(空收藏):', filter('', '⭐ 收藏', new Set(), favs, clicks).length, '个');
console.log('随机抽样: ', filter('', '全部', new Set(), favs, clicks).length, '个(全部)');

// ---- 模糊搜索用例 ----
console.log('--- 模糊搜索 ---');
console.log('错别字 "chagpt":', filter('chagpt', '全部', new Set(), favs, clicks).slice(0, 3).map((s) => s.name).join(', ') || '(无结果!)');
console.log('错别字 "星露股":', filter('星露股', '全部', new Set(), favs, clicks).map((s) => s.name).join(', ') || '(无结果!)');
console.log('子序列 "谷语":', filter('谷语', '全部', new Set(), favs, clicks).map((s) => s.name).join(', ') || '(无结果!)');
console.log('子序列 "B站":', filter('B站', '全部', new Set(), favs, clicks).map((s) => s.name).join(', ') || '(无结果!)');
console.log('模糊 "bili":', filter('bili', '全部', new Set(), favs, clicks).slice(0, 5).map((s) => s.name).join(', ') || '(无结果!)');
console.log('模糊 "油管":', filter('油管', '全部', new Set(), favs, clicks).map((s) => s.name).join(', ') || '(无结果!)');
