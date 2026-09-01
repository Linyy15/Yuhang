/* ===== 青柠风格·整屏起始页（Yuhang-native）=====
 * 独立新增功能，IIFE 自包含。只通过 DOM + localStorage 与主站协作：
 *  - 引擎：自建同款下拉，选引擎时写 nav_engine_v1 + 触发主站 setEngine（若其引擎菜单已渲染），
 *          主站 setEngine 反过来通过 window.YHStartPage.setEngine 同步本页（app.js 加一行钩子）。
 *  - 数据：从 nav_favs_v1 / nav_click_count_v1（读 JSON）+ window.SITES 映射，只读投影收藏/最常。
 *  - 数据/壁纸 存 nav_startpage_v1（nav_ 前缀，与主站同构）。
 *  - 全部 try/catch，单元素缺失不崩溃。
 */
(function () {
  'use strict';

  var SP_KEY = 'nav_startpage_v1';
  var ENGINE_KEY = 'nav_engine_v1';
  var FAVS_KEY = 'nav_favs_v1';
  var CLICKS_KEY = 'nav_click_count_v1';
  var LANG_KEY = 'nav_lang_v1';

  function $(id) { return document.getElementById(id); }
  function on(el, evt, fn) { if (el) el.addEventListener(evt, fn); }
  function readLS(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function writeLS(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
  function readJSON(key, fb) { var v = readLS(key); try { return (v && JSON.parse(v)) || fb; } catch (e) { return fb; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }
  function hostOf(url) {
    try { return new URL(url).hostname; } catch (e) {
      var m = /^https?:\/\/([^/]+)/i.exec(url); return m ? m[1] : '';
    }
  }
  function lookUrl(s) { return /^(https?:\/\/|\/\/)/i.test(s) || /^[\w-]+(\.[\w-]+)+/.test(s); }
  function isEn() { return readLS(LANG_KEY) === 'en'; }

  // favicon 多源回退（favicon.im → DuckDuckGo → Google，全失败移除图片露出首字/占位）
  // opts.letter: 前置首字节点时，加载成功后隐藏它（onload 隐藏 previousSibling）
  function favIcon(host, opts) {
    opts = opts || {};
    var lazy = opts.lazy === false ? '' : ' loading="lazy"';
    var onload = opts.letter
      ? 'onload="var l=this.previousSibling;if(l&&l.classList)l.classList.add(\'hide\');" '
      : '';
    var onerror = 'var e=this;var h=e.getAttribute(\'data-host\');var i=parseInt(e.getAttribute(\'data-src\')||\'0\',10)+1;var ls=[\'https://favicon.im/\'+h,\'https://icons.duckduckgo.com/ip3/\'+h+\'.ico\',\'https://www.google.com/s2/favicons?domain=\'+h+\'&sz=64\'];if(i<ls.length){e.setAttribute(\'data-src\',String(i));e.src=ls[i];}else{e.parentNode.removeChild(e);}';
    return '<img src="https://favicon.im/' + esc(host) + '" alt=""' + lazy + ' data-host="' + esc(host) + '" data-src="0" ' + onload + 'onerror="' + onerror + '">';
  }

  // ---------- 搜索引擎（与主站 ENGINE_URLS 一致） ----------
  var ENGINES = [
    { code: 'local', labelZh: '站内', labelEn: 'Local', url: null },
    { code: 'baidu', labelZh: '百度', labelEn: 'Baidu', url: 'https://www.baidu.com/s?wd=' },
    { code: 'google', labelZh: '谷歌', labelEn: 'Google', url: 'https://www.google.com/search?q=' },
    { code: 'bing', labelZh: '必应', labelEn: 'Bing', url: 'https://www.bing.com/search?q=' },
    { code: 'bili', labelZh: 'B站', labelEn: 'Bili', url: 'https://search.bilibili.com/all?keyword=' },
    { code: 'zhihu', labelZh: '知乎', labelEn: 'Zhihu', url: 'https://www.zhihu.com/search?type=content&q=' },
    { code: 'github', labelZh: 'GitHub', labelEn: 'GitHub', url: 'https://github.com/search?q=' },
  ];

  // 兜底链接（仅当从 SITES 找不到足够真实站点时填充）
  var FALLBACK_LINKS = [
    { name: '哔哩哔哩', url: 'https://www.bilibili.com' },
    { name: '知乎', url: 'https://www.zhihu.com' },
    { name: '微博', url: 'https://weibo.com' },
    { name: '百度', url: 'https://www.baidu.com' },
    { name: '淘宝', url: 'https://www.taobao.com' },
    { name: '京东', url: 'https://www.jd.com' },
    { name: '腾讯视频', url: 'https://v.qq.com' },
    { name: '网易云音乐', url: 'https://music.163.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'CSDN', url: 'https://www.csdn.net' },
    { name: '豆瓣', url: 'https://www.douban.com' },
    { name: '抖音', url: 'https://www.douyin.com' },
  ];
  // 优先从网站自己的 SITES 数据取真实条目（名称匹配），快捷链接与导航站强关联
  function buildDefaultLinks() {
    var names = ['哔哩哔哩', '知乎', '微博', '百度', '淘宝', '京东', '腾讯视频', '网易云音乐', 'GitHub', 'CSDN', '豆瓣', '抖音'];
    var out = [];
    if (window.SITES && window.SITES.length) {
      for (var i = 0; i < names.length; i++) {
        for (var j = 0; j < window.SITES.length; j++) {
          var s = window.SITES[j];
          if (s && s.name === names[i]) { out.push({ name: s.name, url: s.url }); break; }
        }
      }
    }
    // 用兜底补齐到 12 个（去掉已存在的 URL）
    for (var k = 0; k < FALLBACK_LINKS.length && out.length < 12; k++) {
      var exists = out.some(function (x) { return x.url === FALLBACK_LINKS[k].url; });
      if (!exists) out.push(FALLBACK_LINKS[k]);
    }
    return out.length ? out : cloneLinks(FALLBACK_LINKS);
  }

  var WALLS = [
    { code: 'aurora', labelZh: '极光', labelEn: 'Aurora' },
    { code: 'ocean', labelZh: '海蓝', labelEn: 'Ocean' },
    { code: 'bing', labelZh: '必应壁纸', labelEn: 'Bing' },
    { code: 'dark', labelZh: '暗夜', labelEn: 'Dark' },
  ];
  var BING_URLS = ['https://bing.img.run/1920x1080.php', 'https://api.dujin.org/bing/1920.php'];

  var QUOTES = [
    '行到水穷处，坐看云起时。', '凡是过往，皆为序章。',
    '星光不问赶路人，时光不负有心人。', '博观而约取，厚积而薄发。',
    '大鹏一日同风起，扶摇直上九万里。', '长风破浪会有时，直挂云帆济沧海。',
    '不驰于空想，不骛于虚声。', 'Stay hungry, stay foolish.',
    'Less, but better.', '知不足而奋进，望远山而前行。',
    '博观约取，厚积薄发。', '落其实者思其树，饮其流者怀其源。',
  ];

  // ---------- 状态 ----------
  var state = { links: [], engine: 'local', wall: 'aurora', bingOk: true };
  var dragIdx = -1;

  function cloneLinks(a) { return a.map(function (l) { return { name: l.name, url: l.url }; }); }
  function loadState() {
    var d = { links: buildDefaultLinks(), engine: 'local', wall: 'aurora', bingOk: true };
    try {
      var raw = JSON.parse(localStorage.getItem(SP_KEY) || 'null');
      if (raw) {
        if (Array.isArray(raw.links) && raw.links.length) d.links = raw.links;
        if (raw.engine) d.engine = raw.engine;
        if (raw.wall) d.wall = raw.wall;
        if (raw.bingOk === false) d.bingOk = false;
      }
    } catch (e) {}
    var en = readLS(ENGINE_KEY);
    if (en) d.engine = en;
    return d;
  }
  function saveState() { try { localStorage.setItem(SP_KEY, JSON.stringify(state)); } catch (e) {} }

  // ---------- 站点映射（window.SITES，sites.js 写入全局） ----------
  function siteMap() {
    var out = {};
    if (!window.SITES) return out;
    for (var i = 0; i < window.SITES.length; i++) { if (window.SITES[i] && window.SITES[i].id) out[window.SITES[i].id] = window.SITES[i]; }
    return out;
  }

  // ---------- 引擎 ----------
  function engineLabel(code) {
    var e = ENGINES.filter(function (x) { return x.code === code; })[0];
    return e ? (isEn() ? e.labelEn : e.labelZh) : code;
  }

  function renderEngines() {
    var btn = $('sp-engine-btn'), menu = $('sp-engine-menu');
    if (btn) btn.textContent = engineLabel(state.engine) + ' ▾';
    if (menu) {
      menu.innerHTML = ENGINES.map(function (e) {
        return '<button type="button" data-engine="' + e.code + '" class="' + (state.engine === e.code ? 'active' : '') + '">' + esc(engineLabel(e.code)) + '</button>';
      }).join('');
    }
  }

  function closeEngineMenu() { var m = $('sp-engine-menu'); if (m) m.classList.add('hidden'); }
  function toggleEngineMenu() { var m = $('sp-engine-menu'); if (m) m.classList.toggle('hidden'); }

  // 触发主站 setEngine（若主站引擎菜单已渲染）：点击其对应项 → app.setEngine → 双向同步
  function nudgeMainEngine(code) {
    var item = document.querySelector('#engine-menu [data-engine="' + code + '"]');
    if (item && item.click) { try { item.click(); } catch (e) {} return; }
    var btn = $('engine-btn');
    if (btn) try { btn.innerHTML = esc(engineLabel(code)) + ' ▾'; } catch (e) {}
  }

  function selectEngine(code) {
    state.engine = code;
    writeLS(ENGINE_KEY, code);
    saveState();
    renderEngines();
    nudgeMainEngine(code);
    renderSugg();
  }

  // 主站 setEngine 回调（app.js 在 setEngine 内加一行调用），仅同步本页 UI，不再回写（避免循环）
  window.YHStartPage = {
    setEngine: function (code) { if (code) { state.engine = code; renderEngines(); renderSugg(); } },
    open: openStartPage,
    close: function () { closeStartPage(false); },
  };

  // ---------- 壁纸 ----------
  function renderWallPanel() {
    var p = $('sp-wallpanel');
    if (!p) return;
    p.innerHTML = '<div class="ph">' + (isEn() ? 'Wallpaper' : '壁纸') + '</div>' +
      WALLS.map(function (w) {
        return '<button type="button" data-wall="' + w.code + '" class="' + (state.wall === w.code ? 'active' : '') + '">' +
          '<span class="sw sw-' + w.code + '"></span>' +
          (isEn() ? w.labelEn : w.labelZh) + '</button>';
      }).join('');
  }
  function applyWall() {
    var sp = $('startpage'); if (sp) sp.setAttribute('data-sp-wall', state.wall);
    var w = $('sp-wall'); if (!w) return;
    w.onload = null; w.onerror = null;
    w.style.backgroundImage = 'none'; w.classList.remove('on');
    if (state.wall === 'bing' && state.bingOk) {
      var idx = 0;
      w.onload = function () { w.classList.add('on'); };
      w.onerror = function () {
        idx++;
        if (idx < BING_URLS.length) { w.style.backgroundImage = 'url(' + BING_URLS[idx] + ')'; }
        else {
          state.bingOk = false; state.wall = 'aurora'; saveState(); applyWall();
          renderWallPanel();
          toast(isEn() ? 'Wallpaper failed, fallback to aurora' : '壁纸加载失败，已回落极光');
        }
      };
      w.style.backgroundImage = 'url(' + BING_URLS[0] + ')';
    }
  }

  // ---------- 时钟 / 问候 / 一言 ----------
  var WEEK_ZH = ['日', '一', '二', '三', '四', '五', '六'];
  var WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tickClock() {
    var t = $('sp-time'), d = $('sp-date'), g = $('sp-greet');
    if (!t && !d && !g) return;
    var now = new Date();
    if (t) t.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    if (d) d.textContent = isEn()
      ? (now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + WEEK_EN[now.getDay()])
      : (now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 星期' + WEEK_ZH[now.getDay()]);
    if (g) {
      var h = now.getHours();
      g.textContent = isEn()
        ? (h < 6 ? '🌙 Good night' : h < 12 ? '☀️ Good morning' : h < 14 ? '🌤 Good noon' : h < 18 ? '🌤 Good afternoon' : '🌙 Good evening')
        : (h < 6 ? '🌙 夜深了，注意休息' : h < 9 ? '🌤 早上好' : h < 12 ? '☀️ 上午好' : h < 14 ? '🌤 中午好' : h < 18 ? '🌤 下午好' : '🌙 晚上好');
    }
  }

  function reduceMotion() {
    return (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      || document.documentElement.getAttribute('data-perf') === 'low';
  }
  function pickQuote() {
    var el = $('sp-quote');
    if (!el) return;
    var q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    if (reduceMotion()) { el.innerHTML = '✨ ' + esc(q); return; }
    el.innerHTML = '✨ ' + q.split('').map(function (ch) {
      return '<span class="sp-quote-letter" style="opacity:0;display:inline-block;transform:translateY(8px)">' + esc(ch) + '</span>';
    }).join('');
    var spans = el.querySelectorAll('.sp-quote-letter');
    for (var i = 0; i < spans.length; i++) {
      (function (s, i) { setTimeout(function () {
        s.style.transition = 'opacity .4s ease, transform .5s cubic-bezier(.34,1.56,.64,1)';
        s.offsetWidth; // 强制回流，确保 transition 与属性变更分开两个帧，动画才生效
        s.style.opacity = '1'; s.style.transform = 'none';
      }, 320 + i * 40); })(spans[i], i);
    }
  }

  // ---------- 快捷链接（增删 / 拖拽排序） ----------
  function renderLinks() {
    var box = $('sp-links'); if (!box) return;
    var editing = box.classList.contains('editing');
    var html = '';
    for (var i = 0; i < state.links.length; i++) {
      var l = state.links[i];
      var host = hostOf(l.url);
      html += '<a class="sp-link" href="' + esc(l.url) + '" target="_blank" rel="noopener" ' +
        'draggable="' + (editing ? 'true' : 'false') + '" data-idx="' + i + '" title="' + esc(l.name) + '">' +
        '<span class="sp-link-ico">' +
        '<span class="sp-link-letter">' + esc(l.name.slice(0, 1)) + '</span>' +
        favIcon(host, { letter: true }) +
        '</span>' +
        '<span class="sp-link-name">' + esc(l.name) + '</span>' +
        (editing ? '<button class="sp-link-del" data-del="' + i + '" type="button">✕</button>' : '') + '</a>';
    }
    if (editing) html += '<button class="sp-link add-tile" id="sp-add-tile" type="button">＋</button>';
    box.innerHTML = html;
  }

  function toggleEdit() {
    var box = $('sp-links'), man = $('sp-manage'), hint = $('sp-links-hint');
    var on = box.classList.toggle('editing');
    if (man) man.classList.toggle('hidden', !on);
    if (hint) hint.textContent = on ? (isEn() ? 'Drag to sort · ✕ delete · ＋ add' : '拖动排序，✕ 删除，＋ 添加') : (isEn() ? 'Tap ✎ to manage' : '点「✎ 管理」可增删排序');
    renderLinks();
    if (on) { var ni = $('sp-add-name'); if (ni) ni.focus(); }
  }
  function addLink(name, url) {
    name = (name || '').trim(); url = (url || '').trim();
    if (!name || !url) { toast(isEn() ? 'Name and URL required' : '名称和网址都要填哦'); return; }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    state.links.push({ name: name.slice(0, 30), url: url });
    saveState(); renderLinks();
    var ni = $('sp-add-name'), ui = $('sp-add-url');
    if (ni) ni.value = ''; if (ui) ui.value = ''; if (ni) ni.focus();
    toast((isEn() ? 'Added: ' : '已添加：') + name);
  }
  function removeLink(idx) {
    state.links.splice(idx, 1); saveState(); renderLinks();
    toast(isEn() ? 'Removed' : '已删除');
  }

  function bindDrag() {
    var box = $('sp-links'); if (!box) return;
    on(box, 'dragstart', function (e) {
      var a = e.target.closest ? e.target.closest('.sp-link') : null;
      if (!a) return;
      dragIdx = parseInt(a.getAttribute('data-idx'), 10);
      a.classList.add('dragging');
    });
    on(box, 'dragend', function (e) {
      var a = e.target.closest ? e.target.closest('.sp-link') : null;
      if (a) a.classList.remove('dragging');
      dragIdx = -1;
    });
    on(box, 'dragover', function (e) { e.preventDefault(); });
    on(box, 'drop', function (e) {
      e.preventDefault();
      var a = e.target.closest ? e.target.closest('.sp-link') : null;
      if (!a || dragIdx < 0) return;
      var to = parseInt(a.getAttribute('data-idx'), 10);
      if (to === dragIdx) { renderLinks(); return; }
      var item = state.links.splice(dragIdx, 1)[0];
      state.links.splice(to, 0, item);
      saveState(); renderLinks();
    });
  }

  // ---------- 只读投影：收藏 / 最常访问 ----------
  function gatherFavIds() {
    var fa = readJSON(FAVS_KEY, {}); if (!fa) return [];
    var out = [];
    if (Array.isArray(fa)) out = out.concat(fa);
    else {
      for (var k in fa) { if (Array.isArray(fa[k])) out = out.concat(fa[k]); }
    }
    // 去重保序
    var seen = {}, r = [];
    for (var i = 0; i < out.length; i++) { if (!seen[out[i]]) { seen[out[i]] = 1; r.push(out[i]); } }
    return r;
  }
   function gatherClickTop() {
    var c = readJSON(CLICKS_KEY, {}); if (!c) return [];
    // nav_click_count_v1 结构为 { 账号: { 网址: 次数 } }，需两层遍历并按网址累加（跨账号合并投影）
    var summed = {};
    for (var acc in c) {
      var map = c[acc];
      if (!map) continue;
      for (var sid in map) { summed[sid] = (summed[sid] || 0) + (map[sid] || 0); }
    }
    var arr = [];
    for (var k in summed) { arr.push({ id: k, n: summed[k] }); }
    arr.sort(function (a, b) { return b.n - a.n; });
    return arr.slice(0, 8);
  }
  function renderProjection() {
    var sm = siteMap();
    var favs = gatherFavIds().slice(0, 8).map(function (id) { return sm[id]; }).filter(Boolean);
    var hot = gatherClickTop().map(function (x) { return sm[x.id]; }).filter(Boolean).slice(0, 8);

    function row(list, tag, hint) {
      var wrap = document.querySelector('.sp-proj-row.' + tag);
      if (!wrap) return;
      if (!list.length) { wrap.innerHTML = ''; return; }
      var html = '<span class="sp-proj-head" style="font-size:12px;color:var(--text-faint);">' + esc(hint) + '</span>';
      for (var i = 0; i < list.length; i++) {
        var s = list[i];
        html += '<a class="sp-proj-chip" href="' + esc(s.url || '') + '" target="_blank" rel="noopener">' +
          '<span class="ico">' + favIcon(hostOf(s.url || '')) + '</span>' +
          esc(s.name) + '</a>';
      }
      wrap.innerHTML = html;
    }
    row(favs, 'favs', isEn() ? 'Favorites' : '⭐ 收藏');
    row(hot, 'hot', isEn() ? 'Most visited' : '🔥 最常访问');
  }

  // ---------- 分类直达（快捷链接与网站分类强关联） ----------
  function renderCatChips() {
    var box = $('sp-cats');
    if (!box) return;
    var tags = (window.SITES_META && window.SITES_META.tags) || [];
    if (!tags.length) { box.innerHTML = ''; box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    var html = '<span class="sp-cat-label">' + (isEn() ? 'Category' : '分类') + '</span>';
    // 优先展示收录数量多的前 12 个分类
    var top = tags.slice().sort(function (a, b) { return (b.count || 0) - (a.count || 0); }).slice(0, 12);
    for (var i = 0; i < top.length; i++) {
      html += '<button type="button" class="sp-cat-chip" data-cat="' + esc(top[i].name) + '">' + esc(top[i].name) + '</button>';
    }
    box.innerHTML = html;
  }
  // 点击分类 → 触发主站分类栏对应 chip（data-cat 即分类名）
  function gotoCategory(name) {
    if (!name) return;
    var chips = document.querySelectorAll('#cat-bar .chip, #cat-dropdown .chip');
    var clicked = false;
    for (var i = 0; i < chips.length; i++) {
      var label = chips[i].querySelector('span:not(.chip-count)');
      var txt = (label && label.textContent) || '';
      if (txt.trim() === name) { try { chips[i].click(); clicked = true; } catch (e) {} break; }
    }
    closeStartPage(true);
  }

  // ---------- 搜索 / 联想 / 直达 ----------
  function renderSugg() {
    var box = $('sp-sugg'), input = $('sp-input');
    if (!box || !input) return;
    var q = input.value.trim();
    if (!q) { box.classList.add('hidden'); return; }
    var html = '';
    if (lookUrl(q)) {
      var u = /^https?:\/\//i.test(q) ? q : 'https://' + q;
      html += '<button type="button" data-direct="' + esc(u) + '"><span class="sp-sugg-ico">➡️</span>' +
        (isEn() ? 'Open' : '直达') + ' ' + esc(hostOf(u)) +
        '<span class="sp-sugg-url">' + esc(u) + '</span></button>';
    }
    if (state.engine === 'local' && window.SITES && window.SITES.length) {
      var kw = q.toLowerCase();
      var hits = [];
      for (var i = 0; i < window.SITES.length && hits.length < 6; i++) {
        var s = window.SITES[i];
        if (s && (s.name || '').toLowerCase().indexOf(kw) !== -1) hits.push(s);
      }
      hits.forEach(function (s) {
        var h = hostOf(s.url || '');
        html += '<button type="button" data-site="' + esc(s.id || s.name) + '">' +
          '<span class="sp-sugg-ico">' + favIcon(h) + '</span>' +
          esc(s.name) + '<span class="sp-sugg-url">' + esc(h) + '</span></button>';
      });
    }
    box.innerHTML = html;
    if (html) box.classList.remove('hidden'); else box.classList.add('hidden');
  }

  function doSearch(q) {
    q = (q || '').trim(); if (!q) return;
    if (lookUrl(q)) { window.open(/^https?:\/\//i.test(q) ? q : 'https://' + q, '_blank'); return; }
    var e = ENGINES.filter(function (x) { return x.code === state.engine; })[0];
    if (e && e.url) { window.open(e.url + encodeURIComponent(q), '_blank'); return; }
    // 站内：交给主站搜索框，关闭起始页，回主站
    var inp = $('search-input');
    if (inp) {
      inp.value = q;
      try { inp.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) {}
    }
    closeStartPage(true);
  }

  // ---------- 打开 / 关闭 ----------
  function openStartPage() {
    var sp = $('startpage'); if (!sp) return;
    state = loadState();
    applyWall();
    renderEngines();
    renderWallPanel();
    renderLinks();
    renderProjection();
    renderCatChips();
    pickQuote();
    tickClock();
    var inp = $('sp-input'); if (inp) inp.value = '';
    var sug = $('sp-sugg'); if (sug) sug.classList.add('hidden');
    var man = $('sp-manage'); if (man) man.classList.add('hidden');
    var box = $('sp-links'); if (box) box.classList.remove('editing');
    closeEngineMenu();
    closeWallPanel();
    // 移除 hidden（display:flex，此时容器 opacity:0 仍不可见）→ 强制回流 → 加 .open 触发 opacity 0→1 平滑淡入
    sp.removeAttribute('hidden'); sp.setAttribute('aria-hidden', 'false');
    void sp.offsetWidth;
    sp.classList.add('open');
    document.body.classList.add('sp-open');
    setTimeout(function () { if (inp) { try { inp.focus(); } catch (e) {} } }, 60);
  }
  function closeStartPage(goNav) {
    var sp = $('startpage');
    // 去 .open：opacity 1→0 平滑淡出，随后 visibility 自动变 hidden；主站内容同时淡入
    sp.classList.remove('open');
    document.body.classList.remove('sp-open');
    if (goNav) {
      var appEl = $('app');
      if (appEl) {
        var top = (appEl.getBoundingClientRect ? (appEl.getBoundingClientRect().top + window.pageYOffset - 8) : 0) || 0;
        try { window.scrollTo({ top: top, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, top); }
      }
    }
    // 过渡结束后把 startpage 重新置为 hidden，彻底退出布局
    setTimeout(function () { if (sp && !sp.classList.contains('open')) { sp.setAttribute('hidden', ''); sp.setAttribute('aria-hidden', 'true'); } }, 320);
  }
  function closeWallPanel() { var p = $('sp-wallpanel'); if (p) p.classList.add('hidden'); }

  // ---------- Toast ----------
  var toastTimer = null;
  function toast(text) {
    var old = document.querySelector('#startpage .sp-toast');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var el = document.createElement('div');
    el.className = 'sp-toast'; el.textContent = text;
    $('startpage').appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1800);
  }

  // ---------- 初始化 ----------
  function init() {
    var sp = $('startpage'); if (!sp) return;
    tickClock();
    setInterval(tickClock, 1000);

    on($('btn-startpage'), 'click', function (e) {
      e.preventDefault(); e.stopPropagation();
      openStartPage();
      var fp = $('fab-panel'); if (fp) fp.hidden = true;
    });
    on($('sp-close'), 'click', function () { closeStartPage(false); });
    on(sp, 'click', function (e) {
      if (e.target === sp) { closeStartPage(false); return; }
      // 引擎下拉 / 壁纸面板 / 联想：点外部关闭
      var eng = $('sp-engine-menu');
      if (eng && !eng.classList.contains('hidden') && !e.target.closest('.sp-engine')) closeEngineMenu();
      var wp = $('sp-wallpanel');
      if (wp && !wp.classList.contains('hidden') && !e.target.closest('.sp-wallpanel') && e.target.id !== 'sp-wallset') closeWallPanel();
      var sug = $('sp-sugg');
      if (sug && !sug.classList.contains('hidden') && !e.target.closest('#sp-sugg') && !e.target.closest('#sp-input')) sug.classList.add('hidden');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !sp.hidden) {
        closeWallPanel(); closeEngineMenu(); closeStartPage(false);
      }
    });

    on($('sp-search'), 'submit', function (e) { e.preventDefault(); doSearch(($('sp-input') || {}).value); });
    on($('sp-input'), 'input', renderSugg);
    on($('sp-engine-btn'), 'click', function (e) { e.stopPropagation(); toggleEngineMenu(); });
    on($('sp-engine-menu'), 'click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-engine]') : null;
      if (b) { selectEngine(b.getAttribute('data-engine')); closeEngineMenu(); }
    });

    on($('sp-sugg'), 'click', function (e) {
      var b = e.target.closest ? e.target.closest('button') : null;
      if (!b) return;
      var direct = b.getAttribute('data-direct');
      var site = b.getAttribute('data-site');
      if (direct) { window.open(direct, '_blank'); closeStartPage(false); }
      else if (site && window.SITES) {
        var sm = siteMap();
        if (sm[site] && sm[site].url) { window.open(sm[site].url, '_blank'); closeStartPage(false); }
      }
    });

    on($('sp-links'), 'click', function (e) {
      var del = e.target.closest ? e.target.closest('.sp-link-del') : null;
      if (del) { e.preventDefault(); e.stopPropagation(); removeLink(parseInt(del.getAttribute('data-del'), 10)); return; }
      var add = e.target.closest ? e.target.closest('#sp-add-tile') : null;
      if (add) { e.preventDefault(); var man = $('sp-manage'); if (man) man.classList.remove('hidden'); if ($('sp-add-name')) $('sp-add-name').focus(); }
    });
    on($('sp-cats'), 'click', function (e) {
      var b = e.target.closest ? e.target.closest('.sp-cat-chip') : null;
      if (b) gotoCategory(b.getAttribute('data-cat'));
    });
    bindDrag();

    on($('sp-manage-btn'), 'click', toggleEdit);
    on($('sp-add-ok'), 'click', function () { addLink(($('sp-add-name') || {}).value, ($('sp-add-url') || {}).value); });
    on($('sp-add-name'), 'keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); ($('sp-add-ok') || {}).click && $('sp-add-ok').click(); } });
    on($('sp-add-url'), 'keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); ($('sp-add-ok') || {}).click && $('sp-add-ok').click(); } });

    on($('sp-wallset'), 'click', function (e) { e.stopPropagation(); var p = $('sp-wallpanel'); if (p) p.classList.toggle('hidden'); });
    on($('sp-wallpanel'), 'click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-wall]') : null;
      if (b) { state.wall = b.getAttribute('data-wall'); saveState(); applyWall(); renderWallPanel(); }
    });
    on($('sp-quote'), 'click', pickQuote);
    on($('sp-nav'), 'click', function () { closeStartPage(true); });

    if (location && location.hash === '#startpage') setTimeout(openStartPage, 400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
