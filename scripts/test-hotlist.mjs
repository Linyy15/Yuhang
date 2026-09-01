// 热搜榜解析测试：lib/sites-lib.js parseHotlist（兼容 vvhan 等聚合接口）
// 用法：node scripts/test-hotlist.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const YH = require('../web/js/sites-lib.js');

let fail = 0;
function check(name, ok, extra) {
  console.log((ok ? '✅' : '❌'), name, extra || '');
  if (!ok) fail++;
}

// 1. vvhan 标准格式
const vvhan = {
  success: true,
  data: [
    { title: '第一条热搜', url: 'https://weibo.com/1', hot: '1250000' },
    { title: '第二条', url: 'https://weibo.com/2', hot: '980000' },
  ],
};
let r = YH.parseHotlist(vvhan);
check('vvhan 格式解析', r.length === 2 && r[0].title === '第一条热搜' && r[0].url === 'https://weibo.com/1' && r[0].hot === '1250000', JSON.stringify(r));

// 2. 字段名差异兼容（name/mobil_url/hotValue）
const alt = { data: [{ name: '备选字段', mobil_url: 'https://x.com/1', hotValue: 66 }] };
r = YH.parseHotlist(alt);
check('备选字段兼容', r.length === 1 && r[0].title === '备选字段' && r[0].url === 'https://x.com/1' && r[0].hot === '66', JSON.stringify(r));

// 2.1 60s API v2 格式（data.list + hotValue）
const s60 = {
  code: 200,
  data: {
    id: 'weibo',
    title: '微博热搜',
    updatedAt: '2025-02-01',
    list: [
      { index: 1, title: '第一条热搜', url: 'https://weibo.com/1', hotValue: '1250000' },
      { index: 2, title: '第二条', url: 'https://weibo.com/2', hotValue: '980000' },
    ],
  },
};
r = YH.parseHotlist(s60);
check('60s 格式解析', r.length === 2 && r[0].title === '第一条热搜' && r[0].url === 'https://weibo.com/1' && r[0].hot === '1250000', JSON.stringify(r));

// 2.2 data 非数组但有 list 时兼容；无 title 条目过滤
const s60dirty = { data: { list: [{ hotValue: '9' }, { title: 'ok', hot_word: '备用', url: 'https://ok.com', value: 7 }] } };
r = YH.parseHotlist(s60dirty);
check('60s 脏数据过滤', r.length === 1 && r[0].title === 'ok' && r[0].hot === '7', JSON.stringify(r));

// 3. 空 / 非法输入
check('空数据返回 []', YH.parseHotlist({}).length === 0);
check('null 返回 []', YH.parseHotlist(null).length === 0);
check('data 非数组返回 []', YH.parseHotlist({ data: 'oops' }).length === 0);

// 4. 过滤无标题条目
const dirty = { data: [{ url: 'https://x.com' }, { title: 'ok', url: 'https://ok.com' }, null] };
r = YH.parseHotlist(dirty);
check('过滤无标题/空条目', r.length === 1 && r[0].title === 'ok', JSON.stringify(r));

// 5. 长列表截断（渲染侧取前 50，这里只验证解析保留）
const big = { data: Array.from({ length: 60 }, (_, i) => ({ title: 'T' + i, url: 'u' + i, hot: String(i) })) };
r = YH.parseHotlist(big);
check('60 条完整解析', r.length === 60 && r[59].title === 'T59');

console.log(fail === 0 ? '\n==== 热搜解析全部通过 ====' : `\n==== ${fail} 项失败 ====`);
process.exit(fail === 0 ? 0 : 1);
