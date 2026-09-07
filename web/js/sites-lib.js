/*
 * 屿航 · 站点数据公共库（浏览器 + Node 双端可用）
 * ------------------------------------------------------------
 * 抽取自 scripts/build.mjs 的清洗 / 去重 / 分类 / 序列化逻辑，
 * 保证 CLI 构建与浏览器后台管理页使用同一套实现、输出一致。
 * 浏览器以经典 <script> 加载，暴露 window.YH；Node 以 require 使用。
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    root.YH = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ============ 1. 网址修正（网上查证结果） ============
  var FIX_URL = {
    'SteamPY交易': 'https://www.steampy.com',         // 原 steamspy.com 是数据统计站，非饰品交易站
    '风灵修改器': 'https://flingtrainer.com',         // 原 flyingwin.cn 疑似山寨，正牌是 flingtrainer.com
    '小鸡词典': 'https://jikipedia.com',              // 原指向 jixi.dict.yandex.com（俄罗斯翻译站），错误
    '晨光': 'https://www.mg-pen.com.cn',              // 原 m&g.com.cn 含非法字符 &，点不开
    '万能命令': 'https://wannengrun.net/zh/',         // 补网址
    'MC皮肤壁纸': 'https://www.minecraftskins.com/',  // 补网址（待用户确认是否此站）
    'LKs推荐站': 'https://github.com/xiangjianan/lks',// 补网址（B站UP主LKs网站推荐合集）
    'SeedHub': 'https://www.seedhub.cc',              // 补网址
  };

  // 内网 / 浏览器内部地址（不是公开网页）
  var INTERNAL = new Set(['Edge新标签页', '路由器后台', '联通路由器']);

  // 无网址/错位条目 → 并入同站条目
  var MERGE_INTO = {
    'CS2贴纸编辑': 'CS2贴纸编辑器',
    '龙族5小说': '龙族5',
    '英国身份生成': '英国地址生成器',
    '腾讯文档(在线)': '腾讯文档',
  };

  var PREFER_NAME = {
    'steamdb.info': 'SteamDB',
    'weibo.com': '微博',
    'bilibili.com': '哔哩哔哩',
    'mail.163.com': '网易邮箱',
    'lilithgames.com': 'Lilith Games',
    'csinspect.com': 'CSInspect',
    'nvidia.cn': 'NVIDIA商店',
    'mooub.github.io': 'MoeUB服列表',
    'wuying.aliyun.com': '无影云电脑',
    'icloud.com': 'iCloud',
    'douyin.com': '抖音网页版',
    '777zw.net': '龙族5',
    'steampy.com': 'SteamPY',
    'flingtrainer.com': '风灵月影',
  };

  // ============ 2.5 删除错误/灰色网站（用户确认） ============
  var DELETE_NAMES = new Set([
    '喜得胜',            // 数据标错（实为自行车品牌，与喜德盛重复）
    'Edge新标签页',      // 浏览器内部页面，非网站
    '路由器后台',        // 内网地址 192.168.1.1
    '联通路由器',        // 内网地址 192.168.101.1
    'MC皮肤壁纸',        // 网址未确认
    '英国身份生成',      // 虚拟身份生成站（灰色）
    '风灵月影',          // 游戏修改器（作弊工具）
    'SeedHub',           // 影视资源分享站（灰色）
    '视频解析下载',      // 盗版视频解析下载
    'VlogDownloader',    // 盗版视频解析下载
    '龙族5',             // 盗版小说阅读
    '茶杯狐',            // 盗版影视搜索
    '茶杯狐影视',        // 盗版影视搜索
  ]);
  var DELETE_URL_RE = /(bige7|biquge|777zw|cupfox|jx\.sb|vlogdownload|flingtrainer|flyingwin|seedhub)/i;

  // ============ 3. 多标签智能分类 ============
  // 简化后的 21 个分类标签；一个网站可命中多个标签（命中即添加，多分类机制）
  // hay = 简称 + 详细名称 + 原大类 + 原标签，转小写
  var RULES = [
    // 政务
    { tag: '政务', re: /中国政府网|gov\.cn|国务院|民政部|mca\.gov|12345|政务|外交部|mfa\.gov|统计局|stats\.gov|税务总局|chinatax|人民法院|court\.gov|人民检察院|spp\.gov|公安部|mps\.gov|发改委|ndrc|教育部|moe\.gov|卫健委|nhc|市场监管|samr|人社|mohrss|社会保障|医保|公积金|办事大厅/ },
    // AI
    { tag: 'AI', re: /chatgpt|claude|gemini|kimi|deepseek|文心|豆包|智谱|通义|天工|百川|混元|星火|盘古|小米ai|coze|扣子|perplexity|大模型|人工智能|midjourney|dall-e|dalle|stable diffusion|leonardo|ai绘画|图像生成|copilot|ai编程|代码助手|runway|ai视频|视频生成/ },
    // 游戏（含平台/资讯/二次元/竞技/小游戏等）
    { tag: '游戏', re: /minecraft|我的世界|mc百科|mc维基|mc皮肤|mc种子|hmcl|pcl2|hcm启动|mooub|种子地图|chunkbase|cs2|csgo|饰品|贴纸|csinspect|steampy|\bbuff\b|inventory simulator|stash|hades|哈迪斯|stardew|星露谷|terraria|泰拉瑞亚|hollow knight|空洞骑士|饥荒|supergiant|re-logic|原神|genshin|崩坏|星穹铁道|异环|明日方舟|arknights|绝区零|鸣潮|米哈游|mihoyo|hoyolab|zenless|kurogame|和平精英|永劫无间|王者荣耀|英雄联盟|valorant|瓦罗兰特|金铲铲|\blol\b|4399|7k7k|小游戏|gamemini|epic games|gog|itch\.io|battle\.net|playstation|nintendo switch|\bxbox\b|game pass|origin|ubisoft|riot games|\bplati\b|战网|steamdb|steam db|steam卡牌|steam库存|steamcard|gta|rockstar|怪物猎人|monster hunter|黑神话|赛博朋克|cyberpunk|艾尔登|elden|lilith|莉莉丝|\bsteam\b/ },
    // 设计与创意（设计工具/素材/图片/剪辑/趣味创意）
    { tag: '设计与创意', re: /figma|sketch|adobe xd|framer|webflow|photoshop|illustrator|canva|创客贴|图怪兽|稿定|gaoding|photopea|fotor|behance|dribbble|站酷|zcool|花瓣|huaban|unsplash|pexels|pixabay|flaticon|iconfont|freepik|wallhaven|adobe stock|视觉中国|vcg|toools|undraw|光厂|vjshi|素材|插画|壁纸|图标|模板|remove\.bg|bigjpg|去背景|抠图|放大|剪映|capcut|达芬奇|davinci|premiere|after effects|blackmagic|新片场|xinpianchang|剪辑|window-swap|windows swap|斗图啦|doutula|yaytext|花体|lks推荐/ },
    // 视频与直播（含短视频/动漫/视频搜索）
    { tag: '视频与直播', re: /youtube|netflix|disney|hbo max|prime video|优酷|youku|爱奇艺|iqiyi|腾讯视频|芒果tv|mgtv|搜狐视频|pptv|西瓜|抖音|douyin|快手|kuaishou|bilibili|哔哩哔哩|acfun|央视网|cctv|梨视频|pearvideo|微博视频|斗鱼|douyu|虎牙|huya|twitch|台词|the-vault|视频解析|savetwitter|推特下载|twittervideo|justwatch|漫画|manga|saucenao|sauce|动漫/ },
    // 音乐
    { tag: '音乐', re: /music|spotify|apple music|网易云|qq音乐|酷狗|酷我|咪咕|汽水|波点|deezer|joox|kkbox|soundcloud|bandcamp|last\.fm|豆瓣fm|radio garden/ },
    // 社交媒体
    { tag: '社交媒体', re: /微博|weibo|web\.wechat|微信网页版|im\.qq|腾讯qq|小红书|xiaohongshu|贴吧|tieba|豆瓣|知乎|zhihu|bilibili|哔哩哔哩|抖音|douyin|快手|kuaishou/ },
    // 新闻资讯
    { tag: '新闻资讯', re: /人民日报|people\.com|新华网|xinhuanet|央视网|cctv|今日头条|toutiao|澎湃|thepaper|虎嗅|huxiu|36氪|36kr|少数派|sspai|中国新闻网|chinanews|环球网|huanqiu|参考消息|界面|jiemian|财新|caixin|第一财经|yicai|南方周末|infzm|网易新闻|news\.163|腾讯新闻|新浪新闻|凤凰网|ifeng|新闻资讯/ },
    // 在线学习（课程 + 阅读 + 百科）
    { tag: '在线学习', re: /coursera|edx|udemy|mooc|可汗|khan|学堂在线|慕课|imooc|云课堂|study\.163|公开课|open\.163|腾讯课堂|ke\.qq|极客时间|geekbang|得到|dedao|知网|cnki|微信读书|weread|起点|qidian|晋江|jjwxc|古腾堡|gutenberg|喜马拉雅|ximalaya|听书|有声|小说|电子书|在线阅读|维基百科|wikipedia|百度百科|baike\.baidu|新华字典|zidian|小鸡词典|jikipedia|百科/ },
    // 办公协作
    { tag: '办公协作', re: /notion|wps|石墨|shimo|语雀|yuque|腾讯文档|飞书|feishu|钉钉|dingtalk|microsoft 365|微软365|zoom|\boffice\b/ },
    // 效率工具（含系统工具/邮箱/搜索/浏览器）
         { tag: '效率工具', re: /万能命令|wannengrun|mikutools|miku\.tools|work tools|worktools|nosignups|倒数日|daysmatter|番茄|forestapp|xmind|思维导图|微信网页传输|file\.weixin|海明威|hemingway|日历|日程|待办|时间管理|密码管理|password manager|邮箱|mail\.163|mail\.qq|网易邮箱|qq邮箱|yandex|夸克|chrome|google chrome|microsoft edge|edge浏览器|浏览器|新标签页/ },
     { tag: '文件与格式', re: /tinywow|草料|cli\.im|convertio|ilovepdf|pdf24|pdf|base64|json|二维码|qr code|压缩|解压|zip|7-zip|7zip|格式转换|文件转换|图片压缩|图片转换|去背景|抠图|remove\.bg|bigjpg|url编解码|url encode|正则/ },
     { tag: '系统与网络', re: /英国地址|地址生成|meiguodizhi|fakeuk|lanerc|老弟|ld1y|360安全|火绒|huorong|卡巴斯基|kaspersky|图吧|tubixiangtong|迅雷|xunlei|uu加速|uu远程|remote\.163|前行者|ehubs|魔极客|monsgeek|麦高|mchose|mg-driver|驱动|路由器|192\.168|网络诊断|ping|dns|远程控制/ },
     { tag: '查询服务', re: /快递|kuaidi|航班|flight|汇率|exchange rate|天气|tianqi|地图|amap|ditu|ip查询|黑猫|tousu/ },
     // 其他在线工具：无法归入效率、文件、系统或查询时的中性工具分类。
     { tag: '在线工具', re: /在线工具|web tool|toolbox|工具箱|测试工具/ },
    // 编程开发
    { tag: '编程开发', re: /csdn|博客园|cnblogs|廖雪峰|liaoxuefeng|菜鸟教程|runoob|掘金|juejin|v2ex|stack overflow|stackoverflow|github|gitee|vs code|visual studio|node\.js|python|\bnpm\b|docker hub|devdocs|carbon|explainshell|\bshell\b|米粒|miligong|codepen|jsfiddle/ },
    // 云盘与云服务
    { tag: '云盘与云服务', re: /123云盘|123pan|百度网盘|pan\.baidu|阿里云盘|alipan|腾讯微云|weiyun|坚果云|jianguoyun|icloud|苹果云服务|京东云|jdcloud|腾讯云|cloud\.tencent|阿里云|aliyun|无影|wuying/ },
    // 电商购物（含二手/时尚）
    { tag: '电商购物', re: /淘宝|taobao|天猫|tmall|拼多多|pinduoduo|苏宁|suning|唯品会|vip\.com|考拉|kaola|亚马逊|amazon(?! prime)|优衣库|uniqlo|新华书店|xhsd|\bmlb\b|闲鱼|xianyu|转转|zhuanzhuan|爱回收|aihuishou|二手/ },
    // 生活服务（出行/本地生活/电动车）
    { tag: '生活服务', re: /12306|携程|ctrip|飞猪|fliggy|滴滴|didiglobal|美团|meituan|饿了么|ele\.me|高德|amap|百度地图|ditu\.baidu|快递100|kuaidi100|墨迹天气|tianqi|黑猫|tousu\.sina|哈啰|hellobike|外卖|地图|雅迪|yadea|爱玛|aima|台铃|tailg|绿源|luyuan|小牛|niu\.com|九号|ninebot|电动/ },
    // 数码硬件
    { tag: '数码硬件', re: /\boppo\b|\bvivo\b|华为|huawei|小米|mi\.com|三星|samsung|英特尔|intel|\bamd\b|英伟达|nvidia|七彩虹|colorful|影驰|galaxy|铭瑄|maxsun|微星|msi|\brog\b|海盗船|corsair|佳能|canon|尼康|nikon|索尼|sony|哈苏|hasselblad|徕卡|leica|卡西欧|casio|嘉立创|jlc\.com|正点原子|openedv|希捷|seagate|西数|westerndigital|美光|micron|高通|qualcomm|联发科|mediatek|博世|bosch|劳力士|rolex|哈曼|harman|马歇尔|marshall|松下|panasonic/ },
    // 汽车
    { tag: '汽车', re: /汽车之家|autohome|懂车帝|dongchedi|太平洋汽车|pcauto|易车|yiche|瓜子|guazi|人人车|二手车/ },
    // 运动户外
    { tag: '运动户外', re: /耐克|nike|安踏|anta|李宁|lining|鸿星尔克|erke|迪卡侬|decathlon|始祖鸟|arcteryx|骆驼|camel|凯乐石|kailas|优尼克斯|yonex|胜利|victor|捷安特|\bgiant\b|喜德盛|xds|闪电|specialized|永久|yongjiu|梅花|colnago|羽毛球|(?<!电动)自行车|户外/ },
    // 文具
    { tag: '文具', re: /晨光|得力|百乐|pilot|斑马|zebra|国誉|kokuyo|三菱|mitsubishi|书写/ },
    // 金融理财
    { tag: '金融理财', re: /东方财富|eastmoney|同花顺|10jqka|新浪财经|finance\.sina|金投|jinjia|白银|sjbaiyin|股票|雪球|xueqiu|天天基金|fund\.eastmoney|支付宝|alipay|微信支付|pay\.weixin|招商银行|cmbchina|工商银行|icbc|建设银行|ccb|中国银行|boc\.cn|农业银行|abchina|交通银行|bankcomm|理财/ },
  ];

  // 原大类兜底（仅当上面规则一个都没命中时使用，保证每个网站至少一个标签）
  var CAT_FALLBACK = {
    AI: 'AI', 游戏: '游戏', 设计: '设计与创意', 教育: '在线学习',
    工具: '在线工具', 电商: '电商购物', 电子: '数码硬件', 硬件: '数码硬件',
    媒体: '新闻资讯', 社交: '社交媒体', 出行: '生活服务',
    科技: '其他', 时尚: '电商购物', 开发: '编程开发', 政务: '政务',
  };

  // 整个大类必然归属的标签（如汽车类全部打"汽车"标签）
  var CAT_ALWAYS = {
    视频: '视频与直播', 音乐: '音乐', 汽车: '汽车', 运动: '运动户外', 文具: '文具', 金融: '金融理财', 政务: '政务',
  };

  // ---------- 基础工具 ----------
  function norm(u) {
    return (u || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '').toLowerCase();
  }

  // ---------- 1. TSV 解析 ----------
  // raw: sites.tsv 全文 → 原始条目数组（带 row 行号，对应 Excel 行号）
  function parseTsv(raw) {
    var lines = raw.split(/\r?\n/).filter(function (l) { return l.trim() !== ''; });
    return lines.slice(1).map(function (l, i) {
      var c = l.split('\t');
      return {
        row: i + 2, // 对应 Excel 行号
        short: (c[0] || '').trim(),
        name: (c[1] || '').trim(),
        cat: (c[2] || '').trim(),
        tags: (c[3] || '').trim(),
        brief: (c[4] || '').trim(),
        detail: (c[5] || '').trim(),
        url: (c[6] || '').trim(),
        vpn: (c[7] || '').trim(),
      };
    });
  }

  // ---------- 2. 网址修正 / 内网标记 / 错位并入 ----------
  function cleanRows(rows) {
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (FIX_URL[r.short]) r.url = FIX_URL[r.short];
      r.internal = INTERNAL.has(r.short);
    }
    var keys = Object.keys(MERGE_INTO);
    for (var k = 0; k < keys.length; k++) {
      var src = keys[k], dst = MERGE_INTO[src];
      var target = null, srcRow = null;
      for (var j = 0; j < rows.length; j++) {
        if (rows[j].short === dst) target = rows[j];
        if (rows[j].short === src) srcRow = rows[j];
      }
      if (target && target.url && srcRow) srcRow.url = target.url;
    }
    return rows;
  }

  // ---------- 3. 按规范化网址去重合并 ----------
  function dedupe(rows) {
    var groups = new Map();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!r.url) continue;
      var key = norm(r.url);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }
    var mergedStats = [];
    var finalRows = [];
    groups.forEach(function (items, url) {
      if (items.length === 1) { finalRows.push(items[0]); return; }
      items.sort(function (a, b) { return a.row - b.row; });
      var main = items[0];
      if (PREFER_NAME[url]) {
        for (var p = 0; p < items.length; p++) {
          if (items[p].short === PREFER_NAME[url]) { main = items[p]; break; }
        }
      }
      var tags = new Set();
      for (var t1 = 0; t1 < items.length; t1++) {
        var itemTags = (items[t1].tags || '').split(',');
        for (var t2 = 0; t2 < itemTags.length; t2++) {
          var tv = itemTags[t2].trim();
          if (tv) tags.add(tv);
        }
      }
      main.tags = Array.from(tags).join(',');
      main.vpn = items.some(function (i) { return i.vpn === '否'; }) ? '否' : (main.vpn || '否');
      if (!main.detail) {
        var bestD = items.slice().sort(function (a, b) { return b.detail.length - a.detail.length; })[0];
        main.detail = (bestD && bestD.detail) || '';
      }
      if (!main.brief) {
        var bestB = items.slice().sort(function (a, b) { return b.brief.length - a.brief.length; })[0];
        main.brief = (bestB && bestB.brief) || '';
      }
      main.note = '合并自: ' + items.map(function (i) { return i.short + '(第' + i.row + '行)'; }).join('、');
      finalRows.push(main);
      mergedStats.push({ url: url, names: items.map(function (i) { return i.short; }) });
    });
    return { finalRows: finalRows, mergedStats: mergedStats };
  }

  // ---------- 4. 删除错误/灰色网站 ----------
  function deleteGray(finalRows) {
    var deletedList = [];
    for (var i = finalRows.length - 1; i >= 0; i--) {
      var r = finalRows[i];
      if (DELETE_NAMES.has(r.short) || DELETE_URL_RE.test(r.url || '')) {
        deletedList.push(r.short + ' -> ' + (r.url || '(无网址)'));
        finalRows.splice(i, 1);
      }
    }
    return { finalRows: finalRows, deletedList: deletedList };
  }

  // ---------- 5. 多标签智能分类 ----------
  function classify(r) {
    var hay = [r.short, r.name, r.cat, r.tags].join(' ').toLowerCase();
    var found = new Set();
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i].re.test(hay)) found.add(RULES[i].tag);
    }
    if (r.short === '谷歌') found.add('效率工具');
    if (r.short === 'Steam') found.add('游戏');
    if (r.short === '苹果' || r.short === '苹果官网') found.add('数码硬件');
    if (CAT_ALWAYS[r.cat]) found.add(CAT_ALWAYS[r.cat]);
    // 音乐类网站不打"社交媒体"标签（防误伤豆瓣FM等）
    if (r.cat === '音乐') found.delete('社交媒体');
    if (found.size === 0 && CAT_FALLBACK[r.cat]) found.add(CAT_FALLBACK[r.cat]);
    if (found.size === 0) found.add('其他');
    return Array.from(found);
  }

  // ---------- 6. 汇总构建 ----------
  // 输入：清洗+去重+删除后的行（含 classifiedTags），输出 { meta, sites, stats }
  // 注意：就地排序 finalRows（与原 build.mjs 行为一致），按大类 + 原行号排序
  function buildSites(finalRows) {
    finalRows.sort(function (a, b) {
      return a.cat === b.cat ? a.row - b.row : a.cat.localeCompare(b.cat, 'zh');
    });
    var sites = finalRows.map(function (r, i) {
      var s = {
        id: 's' + String(i + 1).padStart(3, '0'),
        name: r.short,
        fullName: r.name,
        category: r.cat,
        tags: r.classifiedTags,
        brief: r.brief,
        detail: r.detail,
        url: r.url,
        vpn: r.vpn === '是',
        internal: !!r.internal,
      };
      if (r.note) s.note = r.note;
      return s;
    });

    var categories = {};
    for (var i = 0; i < sites.length; i++) {
      var c = sites[i].category;
      categories[c] = (categories[c] || 0) + 1;
    }

    var tagCounts = {};
    for (var j = 0; j < sites.length; j++) {
      var st = sites[j].tags;
      for (var t = 0; t < st.length; t++) tagCounts[st[t]] = (tagCounts[st[t]] || 0) + 1;
    }
    var tagList = Object.keys(tagCounts).sort(function (a, b) {
      return tagCounts[b] - tagCounts[a] || a.localeCompare(b, 'zh');
    }).map(function (name) { return { name: name, count: tagCounts[name] }; });

    var meta = {
      name: '屿航',
      slogan: '探索每一座数字岛屿',
      total: sites.length,
      tags: tagList,
      categories: categories,
      updatedAt: new Date().toISOString().slice(0, 10),
      // A stable, human-readable identity for matching generated catalog artifacts.
      catalogVersion: 'catalog-' + sites.length + '-' + new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    };
    return {
      meta: meta,
      sites: sites,
      stats: { tags: tagList },
    };
  }

  // ---------- 7. 一键：TSV 原文 → 清洗 → 站点数据 ----------
  function buildSitesFromTsv(raw) {
    var rows = parseTsv(raw);
    cleanRows(rows);
    var d = dedupe(rows);
    var g = deleteGray(d.finalRows);
    var finalRows = g.finalRows;
    for (var i = 0; i < finalRows.length; i++) {
      finalRows[i].classifiedTags = classify(finalRows[i]);
    }
    var built = buildSites(finalRows);
    built.stats.inputRows = rows.length;
    built.stats.mergedGroups = d.mergedStats.length;
    built.stats.deleted = g.deletedList;
    built.stats.noTagSites = built.sites.filter(function (s) { return !s.tags.length; }).map(function (s) { return s.name; });
    return built;
  }

  // ---------- 8. 序列化 ----------
  // → web/data/sites.js（主页面读取）
  function serializeSitesJs(meta, sites) {
    return 'window.SITES_META = ' + JSON.stringify(meta) + ';\nwindow.SITES = ' + JSON.stringify(sites) + ';\n';
  }
  // → data/sites.json（参考用）
  function serializeJson(meta, sites) {
    return JSON.stringify({ meta: meta, sites: sites }, null, 2);
  }
  // 标签不动点：classify 对自身输出不幂等（原始标签词汇在 8 列 tsv 中无法保留），
  // 迭代 classify 直到稳定（分类规则单调递减，必收敛），保证 tsv 再生成时标签一致。
  function fixTags(short, name, cat, tagsArr) {
    var cur = (tagsArr || []).slice();
    for (var iter = 0; iter < 50; iter++) {
      var next = classify({ short: short, name: name, cat: cat, tags: cur.join(',') });
      var same = next.length === cur.length;
      if (same) {
        for (var i = 0; i < next.length; i++) {
          if (next[i] !== cur[i]) { same = false; break; }
        }
      }
      if (same) return next;
      cur = next;
    }
    return cur;
  }
  // → sites.tsv（8 列，兼容 build.mjs 再生；标签列写入稳定集，重新生成结果一致）
  function serializeTsv(sites) {
    var header = '网站简称\t网站详细名称\t网站所属大类\t网站详细标签\t网站简介\t网站详细简介\t网站官网网址\t是否需要加速器';
    var lines = sites.map(function (s) {
      return [
        s.name || '',
        s.fullName || '',
        s.category || '',
        fixTags(s.name, s.fullName, s.category, s.tags).join(','),
        s.brief || '',
        s.detail || '',
        s.url || '',
        s.vpn ? '是' : '否',
      ].join('\t');
    });
    return [header].concat(lines).join('\n') + '\n';
  }

  // ---------- 9. 数据完整性校验（管理页红旗/黄旗） ----------
  // 返回 [{ level: 'red'|'yellow', siteId, name, message }]
  function validate(sites) {
    var issues = [];
    var seen = new Map();
    for (var i = 0; i < sites.length; i++) {
      var s = sites[i];
      var nm = s.name || s.fullName || s.id;
      if (!s.name || !s.name.trim()) {
        issues.push({ level: 'red', siteId: s.id, name: nm, message: '缺少名称' });
      }
      if (!s.url || !s.url.trim()) {
        issues.push({ level: 'red', siteId: s.id, name: nm, message: '缺少网址' });
      } else {
        var key = norm(s.url);
        if (seen.has(key)) {
          issues.push({ level: 'red', siteId: s.id, name: nm, message: '网址与「' + seen.get(key) + '」重复' });
        } else {
          seen.set(key, nm);
        }
        if (/^(https?:\/\/)?(192\.168\.|10\.|127\.|localhost|edge:\/\/|about:)/i.test(s.url) || s.internal) {
          issues.push({ level: 'yellow', siteId: s.id, name: nm, message: '疑似内网/浏览器内部地址' });
        }
      }
      if (!s.brief || !s.brief.trim()) {
        issues.push({ level: 'yellow', siteId: s.id, name: nm, message: '缺少简介' });
      }
      if (!s.detail || !s.detail.trim()) {
        issues.push({ level: 'yellow', siteId: s.id, name: nm, message: '缺少详细简介' });
      }
      if (!s.tags || !s.tags.length) {
        issues.push({ level: 'yellow', siteId: s.id, name: nm, message: '没有标签' });
      }
    }
    return issues;
  }

  // 便捷：单行自动分类（管理页"自动分类"按钮用）
  function classifyRow(short, name, cat, tags) {
    return classify({ short: short || '', name: name || '', cat: cat || '', tags: tags || '' });
  }

  // ---------- 模糊搜索（typo 容错 + 紧凑子序列） ----------
  function editDistLimited(a, b, cap) {
    var m = a.length, n = b.length;
    if (Math.abs(m - n) > cap) return cap + 1;
    var prev = [], cur = [];
    for (var j = 0; j <= n; j++) prev[j] = j;
    for (var i = 1; i <= m; i++) {
      cur[0] = i;
      var rowMin = cur[0];
      for (var j = 1; j <= n; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        if (cur[j] < rowMin) rowMin = cur[j];
      }
      if (rowMin > cap) return cap + 1; // 提前退出
      var tmp = prev; prev = cur; cur = tmp;
    }
    return prev[n];
  }
  // mode: 'exact'（仅精确子串，用于简介/详情长文本）
  //       'partial'（+紧凑子序列）
  //       'fuzzy'（+编辑距离，错别字容错，用于名称/全名/标签）
  // 返回 0-100 分数（越高越匹配），不匹配返回 null。
  // 搜索输入和数据字段统一做轻量规范化，并兼容少量高频错拼。
  var SEARCH_ALIASES = {
    chagpt: 'chatgpt', chatgpt: 'chatgpt', gpt: 'gpt',
    bilibili: '哔哩哔哩', bili: '哔哩哔哩', youtube: '油管',
    google: '谷歌', github: 'github', douyin: '抖音',
  };
  function searchText(v) {
    return String(v == null ? '' : v).toLowerCase()
      .replace(/[\u3000\s_-]+/g, '')
      .replace(/[：:，,。.!！?？/\\]+/g, '');
  }
  function fuzzySearch(query, text, mode) {
    var q = searchText(query);
    var t = searchText(text);
    var alias = SEARCH_ALIASES[q];
    if (alias && searchText(t).indexOf(searchText(alias)) !== -1) return 98;
    if (!q || !t) return null;
    if (t.indexOf(q) !== -1) return 100; // 1. 精确子串
    if (mode === 'exact') return null;
    if (q.length <= 1) return null;      // 单字符只做精确
    // 2. 紧凑子序列：q 的字符按顺序出现，且跨度紧凑
    var first = -1, last = -1, qi = 0;
    for (var i = 0; i < t.length && qi < q.length; i++) {
      if (t[i] === q[qi]) {
        if (first === -1) first = i;
        last = i;
        qi++;
      }
    }
    if (qi === q.length) {
      var span = last - first + 1;
      if (span <= q.length * 2 + 2) return Math.max(50, 78 - span);
    }
    // 3. 错别字容错（仅 fuzzy 模式）：编辑距离，窗口锚定字段开头，且要求首字符相同
    if (mode !== 'fuzzy') return null;
    var hasCJK = /[\u4e00-\u9fff]/.test(q);
    if (hasCJK ? q.length < 3 : q.length < 4) return null; // 过短不做，避免误报（gpt≈git）
    var cap = q.length <= 4 ? 1 : (q.length <= 8 ? 2 : 3);
    var best = cap + 1;
    var minLen = Math.max(1, q.length - 1);
    var maxLen = Math.min(t.length, q.length + 1);
    for (var off = 0; off <= 1 && off < t.length; off++) {
      for (var len = minLen; len <= maxLen && off + len <= t.length; len++) {
        if (t[off] !== q[0]) continue; // 首字符必须一致，过滤 1-edit 误报
        var d = editDistLimited(q, t.substr(off, len), cap);
        if (d < best) best = d;
      }
    }
    if (best <= cap) return Math.max(40, 70 - best * 12);
    return null;
  }

  // 综合站点排序：标题/域名优先，简介只作弱匹配，避免“视频”等宽泛词淹没精确结果。
  function searchSiteScore(query, site) {
    var q = searchText(query);
    if (!q || !site) return null;
    var best = null;
    function score(value, weight, mode) {
      var hit = fuzzySearch(q, value, mode);
      if (hit === null) return;
      var valueText = searchText(value);
      var exact = valueText === q ? 115 : (valueText.indexOf(q) === 0 ? 108 : hit);
      var result = Math.min(120, exact * weight);
      if (best === null || result > best) best = result;
    }
    score(site.name, 1.00, 'fuzzy');
    score(site.fullName, 0.94, 'fuzzy');
    score((site.tags || []).join(' '), 0.78, 'fuzzy');
    score(site.category, 0.72, 'fuzzy');
    score(site.url, 0.88, 'exact');
    score(site.brief, 0.52, 'exact');
    score(site.detail, 0.35, 'exact');
    return best;
  }

  // ---------- 热搜榜解析（兼容 vvhan / 60s / oioweb 等聚合接口） ----------
  // payload: { success, data: [...] } 或 { code, data: { list: [...] } }
  // 返回 [{ title, url, hot }]，空/非法输入返回 []
  function parseHotlist(payload) {
    if (!payload) return [];
    var rows = payload.data;
    // 兼容 60s 等接口的 { data: { list: [...] } } 结构
    if (rows && !Array.isArray(rows) && Array.isArray(rows.list)) rows = rows.list;
    if (!Array.isArray(rows)) return [];
    return rows.map(function (r) {
      if (!r) return null;
      var title = r.title || r.name || r.word || r.hot_word || r.hotword || '';
      var url = r.url || r.mobil_url || r.mobile_url || r.link || r.hot_url || '';
      var hot = r.hot != null ? String(r.hot)
        : (r.hotValue != null ? String(r.hotValue)
        : (r.hotvalue != null ? String(r.hotvalue)
        : (r.value != null ? String(r.value)
        : (r.num != null ? String(r.num) : ''))));
      return { title: title, url: url, hot: hot };
    }).filter(function (x) { return x && x.title; });
  }

  // 管理页：从最终站点数组重新生成 meta（统计 + 更新日期）
  function metaFromSites(sites) {
    var categories = {};
    for (var i = 0; i < sites.length; i++) {
      var c = sites[i].category;
      categories[c] = (categories[c] || 0) + 1;
    }
    var tagCounts = {};
    for (var j = 0; j < sites.length; j++) {
      var st = sites[j].tags || [];
      for (var t = 0; t < st.length; t++) tagCounts[st[t]] = (tagCounts[st[t]] || 0) + 1;
    }
    var tags = Object.keys(tagCounts).sort(function (a, b) {
      return tagCounts[b] - tagCounts[a] || a.localeCompare(b, 'zh');
    }).map(function (name) { return { name: name, count: tagCounts[name] }; });
    return {
      name: '屿航',
      slogan: '探索每一座数字岛屿',
      total: sites.length,
      tags: tags,
      categories: categories,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
  }

  // 管理页：按 大类 + 原顺序 排序并重新编号 s001…（与 build.mjs 编号约定一致，不修改入参）
  function renumberSites(sites) {
    var idx = {};
    for (var i = 0; i < sites.length; i++) idx[sites[i].id] = i;
    var sorted = sites.slice().sort(function (a, b) {
      return a.category === b.category
        ? (idx[a.id] - idx[b.id])
        : a.category.localeCompare(b.category, 'zh');
    });
    return sorted.map(function (s, i) {
      var c = JSON.parse(JSON.stringify(s));
      c.id = 's' + String(i + 1).padStart(3, '0');
      return c;
    });
  }

  return {
    FIX_URL: FIX_URL,
    INTERNAL: INTERNAL,
    MERGE_INTO: MERGE_INTO,
    PREFER_NAME: PREFER_NAME,
    DELETE_NAMES: DELETE_NAMES,
    DELETE_URL_RE: DELETE_URL_RE,
    RULES: RULES,
    CAT_FALLBACK: CAT_FALLBACK,
    CAT_ALWAYS: CAT_ALWAYS,
    norm: norm,
    parseTsv: parseTsv,
    cleanRows: cleanRows,
    dedupe: dedupe,
    deleteGray: deleteGray,
    classify: classify,
    buildSites: buildSites,
    buildSitesFromTsv: buildSitesFromTsv,
    serializeSitesJs: serializeSitesJs,
    serializeJson: serializeJson,
    serializeTsv: serializeTsv,
    validate: validate,
    classifyRow: classifyRow,
    fuzzySearch: fuzzySearch,
    searchSiteScore: searchSiteScore,
    parseHotlist: parseHotlist,
    metaFromSites: metaFromSites,
    renumberSites: renumberSites,
  };
});
