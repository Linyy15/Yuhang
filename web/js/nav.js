/*
 * 屿航 · 导航模块（视图切换 + 全站排行 + 全网热搜 + 悬浮操作球 + 移动端底部导航）
 * ------------------------------------------------------------
 * 暴露 window.YHNav {
 *   init, enterView, exitAllViews, fadeHide, showNow, fadeInView,
 *   openRank, openHot, syncBottomNav,
 *   get isRankActive(), get isHotActive(), get isToolsActive()
 * }
 * 拥有互斥整页视图（rank / hot / tools）的进入与退出、全站排行（领奖台 + 表格）、
 * 全网热搜（6 平台多源竞速 + 断网降级直达）、悬浮操作球（桌面/移动各一套）、
 * 移动端底部导航点击处理。app.js 的分类切换 / ESC / 弹窗关闭经 exitAllViews() 退出视图。
 * init(opts) 注入：S, t, escapeHtml, nameLabel, siteOf, YHAuth, YHTools, YHCards,
 *   YHSearch, renderCats, renderFilterBar, searchInput, 各视图 DOM, grid/filterBar, on,
 *   getActiveCat/setActiveCat/getActiveWs/setActiveWs/getSelectedTags, 分类常量。
 */
(function (root) {
  'use strict';

  var opts = null;

  // 排行当前 tab（fav/click）
  var rankMode = 'fav';
  var hideTimer = null;
  var hotPlatform = 'wbHot';
  var hotCache = {};
  var hotUpdatedAt = {};
  var hotRows = [];

  var HOT_PLATFORMS = [
    { code: 'wbHot', key: 'hot_weibo', label: '微博', icon: '◉' },
    { code: 'zhihuHot', key: 'hot_zhihu', label: '知乎', icon: '知' },
    { code: 'baiduRD', key: 'hot_baidu', label: '百度', icon: '度' },
    { code: 'douyinHot', key: 'hot_douyin', label: '抖音', icon: '♪' },
    { code: 'bili', key: 'hot_bili', label: 'B站', icon: '▶' },
    { code: 'toutiao', key: 'hot_toutiao', label: '头条', icon: '今' },
  ];
  var HOT_APIS = {
    wbHot: ['https://api.vvhan.com/api/hotlist/wbHot', 'https://60s.viki.moe/v2/hot?type=weibo', 'https://api.oioweb.cn/api/common/HotList?type=wbHot'],
    zhihuHot: ['https://api.vvhan.com/api/hotlist/zhihuHot', 'https://60s.viki.moe/v2/hot?type=zhihu', 'https://api.oioweb.cn/api/common/HotList?type=zhihuHot'],
    baiduRD: ['https://api.vvhan.com/api/hotlist/baiduRD', 'https://60s.viki.moe/v2/hot?type=baidu', 'https://api.oioweb.cn/api/common/HotList?type=baiduRD'],
    douyinHot: ['https://api.vvhan.com/api/hotlist/douyinHot', 'https://60s.viki.moe/v2/hot?type=douyin', 'https://api.oioweb.cn/api/common/HotList?type=douyinHot'],
    bili: ['https://api.vvhan.com/api/hotlist/bili', 'https://60s.viki.moe/v2/hot?type=bilibili', 'https://api.oioweb.cn/api/common/HotList?type=bili'],
    toutiao: ['https://api.vvhan.com/api/hotlist/toutiao', 'https://60s.viki.moe/v2/hot?type=toutiao', 'https://api.oioweb.cn/api/common/HotList?type=toutiao'],
  };
  var HOT_FALLBACK_URL = {
    wbHot: 'https://weibo.com/hot/search',
    zhihuHot: 'https://www.zhihu.com/hot',
    baiduRD: 'https://top.baidu.com/board?tab=realtime',
    douyinHot: 'https://www.douyin.com/hot',
    bili: 'https://www.bilibili.com/v/popular/rank/all',
    toutiao: 'https://www.toutiao.com/hot/',
  };

  function fmtTime(ts) {
    if (!ts) return '--';
    var d = new Date(ts);
    return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
  }

  function fadeHide(el) {
    if (!el) return;
    el.classList.add('fading');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      hideTimer = null;
      if (el) { el.hidden = true; el.classList.remove('fading'); }
    }, 280);
  }
  function showNow(el) {
    if (!el) return;
    clearTimeout(hideTimer);
    el.hidden = false;
    el.classList.remove('fading');
  }
  function fadeInView(el) {
    if (!el) return;
    el.hidden = false;
    el.classList.add('fading');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (el) el.classList.remove('fading');
      });
    });
  }

  function exitAllViews() {
    opts.S.rankActive = opts.S.hotActive = opts.S.toolsActive = false;
    if (opts.rankView) opts.rankView.hidden = true;
    if (opts.hotView) opts.hotView.hidden = true;
    if (opts.toolsView) opts.toolsView.hidden = true;
    if (opts.grid) { clearTimeout(hideTimer); opts.grid.hidden = false; opts.grid.classList.remove('fading'); }
    if (opts.filterBar) opts.filterBar.hidden = false;
    opts.renderCats();
  }
  function enterView(mode) {
    exitAllViews();
    if (opts.grid) { opts.grid.hidden = true; opts.grid.classList.remove('fading'); }
    if (opts.filterBar) opts.filterBar.hidden = true;
    if (mode === 'rank') { opts.S.rankActive = true; fadeInView(opts.rankView); }
    else if (mode === 'hot') { opts.S.hotActive = true; fadeInView(opts.hotView); }
    else if (mode === 'tools') { opts.S.toolsActive = true; fadeInView(opts.toolsView); }
    opts.renderCats();
  }

  // --------- 全站排行 ---------
  function openRank() {
    if (!opts.S.currentUser) { opts.YHAuth.openLogin(opts.t('need_login_fav')); return; }
    enterView('rank');
    opts.rankView.hidden = false;
    fadeInView(opts.rankView);
    renderRankTabs();
  }
  function exitRank() { fadeHide(opts.rankView); exitAllViews(); }
  function renderRankTabs() {
    if (!opts.rankTabs) return;
    opts.rankTabs.innerHTML =
      '<button class="login-tab' + (rankMode === 'fav' ? ' active' : '') + '" data-rank="fav">' + opts.t('rank_fav') + '</button>' +
      '<button class="login-tab' + (rankMode === 'click' ? ' active' : '') + '" data-rank="click">' + opts.t('rank_click') + '</button>';
    renderRankView();
  }
  function renderRankView() {
    if (!opts.rankPodium || !opts.rankTable) return;
    opts.rankPodium.innerHTML = '<div class="ws-empty">' + opts.t('rank_empty') + '</div>';
    opts.rankTable.innerHTML = '';
    opts.YHAuth.ensureSupabase().then(function (client) {
      if (!client) { opts.rankPodium.innerHTML = '<div class="ws-empty">' + opts.t('rank_empty') + '</div>'; return; }
      client.rpc('get_site_stats').then(function (res) {
        if (res.error) { opts.rankPodium.innerHTML = '<div class="ws-empty">' + opts.t('rank_empty') + '</div>'; return; }
        var rows = (res.data || []).slice();
        rows.sort(function (a, b) {
          return rankMode === 'click' ? (b.click_total - a.click_total) : (b.favorite_count - a.favorite_count);
        });
        if (!rows.length) { opts.rankPodium.innerHTML = '<div class="ws-empty">' + opts.t('rank_empty') + '</div>'; return; }
        renderPodium(rows.slice(0, 3));
        renderRankTable(rows.slice(3));
      });
    });
  }
  function siteCountOf(r) {
    return rankMode === 'click' ? (r.click_total || 0) : (r.favorite_count || 0);
  }
  function renderPodium(top3) {
    var places = [
      { idx: 1, place: 2 },
      { idx: 0, place: 1 },
      { idx: 2, place: 3 }
    ];
    var bars = { 1: 150, 2: 110, 3: 76 };
    opts.rankPodium.innerHTML = '<div class="podium">' + places.map(function (p) {
      var r = top3[p.idx];
      if (!r) return '';
      var s = opts.siteOf(r.site_id);
      var nm = s ? opts.nameLabel(s) : r.site_id;
      var count = siteCountOf(r);
      return '<div class="podium-item place-' + p.place + '">' +
        '<div class="podium-crown">' + (p.place === 1 ? opts.t('crown') : '') + '</div>' +
        '<div class="podium-medal" title="' + opts.t('medal_' + p.place) + '">' + p.place + '</div>' +
        '<div class="podium-name" title="' + opts.escapeHtml(nm) + '">' + opts.escapeHtml(nm) + '</div>' +
        '<div class="podium-count">' + (rankMode === 'click' ? '👁' : '⭐') + count + '</div>' +
        '<div class="podium-place">' + opts.t('medal_' + p.place) + '</div>' +
        '<div class="podium-bar" style="height:' + bars[p.place] + 'px"></div>' +
      '</div>';
    }).join('') + '</div>';
  }
  function renderRankTable(rest) {
    if (!rest.length) { opts.rankTable.innerHTML = ''; return; }
    opts.rankTable.innerHTML = rest.map(function (r, i) {
      var s = opts.siteOf(r.site_id);
      var nm = s ? opts.nameLabel(s) : r.site_id;
      var fav = r.favorite_count || 0, clk = r.click_total || 0;
      var active = rankMode === 'click';
      return '<div class="trow">' +
        '<span class="trank">' + (i + 4) + '</span>' +
        '<span class="tname" title="' + opts.escapeHtml(nm) + '">' + opts.escapeHtml(nm) + '</span>' +
        '<span class="tcount">' + (active ? '👁' + clk : '⭐' + fav) + '</span>' +
        '<span class="tmeta">⭐' + fav + ' · 👁' + clk + '</span>' +
      '</div>';
    }).join('');
  }

  // --------- 全网热搜 ---------
  function openHot() {
    enterView('hot');
    opts.hotView.hidden = false;
    fadeInView(opts.hotView);
    renderHotTabs();
    loadHot();
  }
  function renderHotTabs() {
    if (!opts.hotTabs) return;
    opts.hotTabs.innerHTML = HOT_PLATFORMS.map(function (p) {
      return '<button class="login-tab hot-platform-tab' + (hotPlatform === p.code ? ' active' : '') + '" data-hot="' + p.code + '" aria-label="' + opts.escapeHtml(opts.t(p.key)) + '"><span class="hot-platform-icon" aria-hidden="true">' + p.icon + '</span><span>' + opts.escapeHtml(opts.t(p.key)) + '</span></button>';
    }).join('');
  }
  function setHotMeta(text) {
    if (opts.hotMeta) opts.hotMeta.textContent = text || '';
  }
  function loadHot(force) {
    if (!opts.hotList) return;
    if (!force && hotCache[hotPlatform]) {
      hotRows = hotCache[hotPlatform];
      renderHotList(hotRows);
      return;
    }
    hotRows = [];
    if (opts.hotFilter) opts.hotFilter.value = '';
    var skeleton = '';
    for (var i = 0; i < 5; i++) {
      skeleton += '<div class="skeleton"><div class="skeleton-row tall"></div><div class="skeleton-row w90"></div><div class="skeleton-row w40"></div></div>';
    }
    opts.hotList.innerHTML = '<div class="skeleton-grid">' + skeleton + '</div>';
    setHotMeta(opts.t('hot_fetching'));
    if (typeof fetch !== 'function') { renderHotFail(); return; }
    fetchHotRace((HOT_APIS[hotPlatform] || []).slice());
  }
  function fetchHotRace(urls) {
    if (!urls.length) { renderHotFail(); return; }
    var TIMEOUT = 5000;
    var done = false;
    var remaining = urls.length;
    var ctrls = [];
    var clearAll = function () {
      for (var c = 0; c < ctrls.length; c++) {
        if (ctrls[c]) { try { ctrls[c].abort(); } catch (e) {} }
      }
    };
    var finish = function (rows) {
      if (done) return;
      done = true;
      clearAll();
      hotCache[hotPlatform] = rows;
      hotUpdatedAt[hotPlatform] = Date.now();
      hotRows = rows;
      renderHotList(rows);
    };
    var allFailed = function () {
      if (done) return;
      done = true;
      clearAll();
      renderHotFail();
    };
    for (var i = 0; i < urls.length; i++) {
      (function (url) {
        var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        ctrls.push(ctrl);
        var timer = null;
        if (ctrl) timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT);
        fetch(url, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
          .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
          .then(function (payload) {
            if (timer) clearTimeout(timer);
            var rows = (window.YH && YH.parseHotlist) ? YH.parseHotlist(payload) : [];
            if (rows.length) finish(rows);
          })
          .catch(function () {
            if (timer) clearTimeout(timer);
            if (--remaining <= 0) allFailed();
          });
      })(urls[i]);
    }
    setTimeout(function () {
      if (!done) { done = true; renderHotFail(); }
    }, TIMEOUT + 200);
  }
  function renderHotList(rows) {
    var kw = (opts.hotFilter ? opts.hotFilter.value : '').trim().toLowerCase();
    var shown = rows;
    if (kw) {
      shown = rows.filter(function (r) {
        return (r.title || '').toLowerCase().indexOf(kw) !== -1 || (r.hot || '').indexOf(kw) !== -1;
      });
    }
    var html = shown.slice(0, 50).map(function (r, i) {
      var topCls = i < 3 ? ' hot-top hot-top-' + (i + 1) : '';
      var no = i < 3 ? '' : (i + 1);
      var noCls = i < 3 ? 'hot-no med' : 'hot-no';
      return '<a class="hot-item' + topCls + '" href="' + opts.escapeHtml(r.url) + '" target="_blank" rel="noopener" title="' + opts.escapeHtml(r.title) + '">' +
        '<span class="' + noCls + '">' + no + '</span>' +
        '<span class="hot-title">' + opts.escapeHtml(r.title) + '</span>' +
        (r.hot ? '<span class="hot-val">' + opts.escapeHtml(r.hot) + '</span>' : '') +
      '</a>';
    }).join('');
    opts.hotList.innerHTML = html || '<div class="ws-empty">' + opts.t('hot_none') + '</div>';
    var meta = hotPlatformLabel() + ' · ' + opts.t('hot_updated') + ' ' + fmtTime(hotUpdatedAt[hotPlatform] || Date.now());
    if (kw) meta += ' · ' + opts.t('hot_hits') + ' ' + shown.length + '/' + rows.length;
    else meta += ' · ' + rows.length + ' ' + opts.t('hot_count');
    setHotMeta(meta);
  }
  function hotPlatformLabel() {
    for (var i = 0; i < HOT_PLATFORMS.length; i++) {
      if (HOT_PLATFORMS[i].code === hotPlatform) return opts.t(HOT_PLATFORMS[i].key);
    }
    return hotPlatform;
  }
  function renderHotFail() {
    var links = HOT_PLATFORMS.map(function (p) {
      return '<a class="hot-item hot-fallback" href="' + HOT_FALLBACK_URL[p.code] + '" target="_blank" rel="noopener">' +
        '<span class="hot-no med"></span><span class="hot-title">' + opts.t(p.key) + ' →</span></a>';
    }).join('');
    opts.hotList.innerHTML = links;
    setHotMeta(opts.t('hot_direct'));
  }

  // --------- 悬浮操作球 ---------
  function closeAllFab() {
    document.querySelectorAll('.fab-panel').forEach(function (p) { p.hidden = true; });
  }

  // --------- 移动端底部导航 ---------
  function syncBottomNav() {
    document.querySelectorAll('.bottom-nav').forEach(function (nav) {
      var items = nav.querySelectorAll ? nav.querySelectorAll('.bn-item') : [];
      for (var i = 0; i < items.length; i++) {
        var bn = items[i].getAttribute('data-bn');
        var on = false;
        if (bn === 'home') on = !opts.S.rankActive && !opts.S.hotActive && !opts.S.toolsActive && opts.getActiveCat() === '全部' && opts.getSelectedTags().size === 0;
        else if (bn === 'favs') on = opts.getActiveCat() === opts.FAV_CAT;
        else if (bn === 'tools') on = opts.S.toolsActive;
        else if (bn === 'me') on = opts.getActiveCat() === opts.MY_CAT;
        items[i].classList.toggle('active', on);
      }
    });
  }
  function handleBottomNav(act) {
    if (act === 'home') {
      exitAllViews();
      opts.setActiveCat('全部');
      opts.getSelectedTags().clear();
      opts.setActiveWs(null);
      opts.renderCats();
      opts.renderFilterBar();
      opts.YHCards.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (act === 'search') {
      exitAllViews();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(function () { if (opts.searchInput) opts.searchInput.focus(); }, 350);
    } else if (act === 'favs') {
      exitAllViews();
      if (!opts.S.currentUser) { opts.YHAuth.openLogin(opts.t('need_login_fav')); return; }
      opts.setActiveCat(opts.FAV_CAT);
      opts.getSelectedTags().clear();
      opts.setActiveWs(null);
      opts.renderCats();
      opts.renderFilterBar();
      opts.YHCards.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (act === 'tools') {
      if (opts.S.toolsActive) { exitAllViews(); return; }
      opts.YHTools.open();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (act === 'me') {
      exitAllViews();
      if (opts.S.currentUser) {
        opts.setActiveCat(opts.MY_CAT);
        opts.getSelectedTags().clear();
        opts.setActiveWs(null);
        opts.renderCats();
        opts.renderFilterBar();
        opts.YHCards.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        opts.YHAuth.openLogin(opts.t('need_login_fav'));
      }
    }
  }

  // --------- init ---------
  function init(o) {
    opts = o;
    // 排行 tab 切换
    if (o.rankTabs) o.on(o.rankTabs, 'click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-rank]') : null;
      if (!b) return;
      rankMode = b.getAttribute('data-rank');
      renderRankTabs();
    });
    if (o.rankBack) o.on(o.rankBack, 'click', exitRank);

    // 热搜 tab / back / refresh / filter
    if (o.hotTabs) o.on(o.hotTabs, 'click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-hot]') : null;
      if (!b) return;
      hotPlatform = b.getAttribute('data-hot');
      if (o.hotFilter) o.hotFilter.value = '';
      renderHotTabs();
      loadHot();
    });
    if (o.hotBack) o.on(o.hotBack, 'click', function () { fadeHide(o.hotView); exitAllViews(); });
    if (o.hotRefresh) o.on(o.hotRefresh, 'click', function () { loadHot(true); });
    if (o.hotFilter) o.on(o.hotFilter, 'input', function () {
      if (hotRows.length) renderHotList(hotRows);
    });

    // FAB 桌面 + 移动：用 querySelectorAll 拿两套（不依赖 app.js 注入）
    document.querySelectorAll('.fab-btn').forEach(function (btn) {
      o.on(btn, 'click', function (e) {
        e.stopPropagation();
        if (!btn.parentElement || !btn.parentElement.querySelector('.fab-panel')) return;
        var panel = btn.parentElement.querySelector('.fab-panel');
        if (!panel) return;
        var alreadyOpen = !panel.hidden;
        closeAllFab();
        if (!alreadyOpen) panel.hidden = false;
      });
    });
    document.querySelectorAll('.fab-panel').forEach(function (panel) {
      o.on(panel, 'click', function (e) {
        if (!(e.target.closest && e.target.closest('.theme-wrap'))) closeAllFab();
      });
    });
    document.addEventListener('click', function (e) {
      if (!(e.target.closest && e.target.closest('.fab'))) closeAllFab();
    });

    // 底部导航由 app.js 统一绑定：它同时协调“更多”抽屉、工作区和个人链接状态。
    // nav.js 仍提供 syncBottomNav/视图 API，避免同一次触控被重复处理。
  }

  root.YHNav = {
    init: init,
    enterView: enterView,
    exitAllViews: exitAllViews,
    fadeHide: fadeHide,
    showNow: showNow,
    fadeInView: fadeInView,
    openRank: openRank,
    openHot: openHot,
    get isRankActive() { return opts && opts.S ? opts.S.rankActive : false; },
    get isHotActive() { return opts && opts.S ? opts.S.hotActive : false; },
    get isToolsActive() { return opts && opts.S ? opts.S.toolsActive : false; },
    syncBottomNav: syncBottomNav,
  };
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : window));
