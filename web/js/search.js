/*
 * 屿航 · 搜索模块（站内模糊 + 多引擎直达 + 搜索联想 + 搜索热词）
 * ------------------------------------------------------------
 * 暴露 window.YHSearch { init, renderEngineMenu, syncEngineUI }。
 * app.js 初始化时调用 init(opts) 注入依赖。与筛选逻辑共享的 keyword 经
 * opts.getKeyword / setKeyword 桥接。
 */
(function (root) {
  'use strict';
  var $ = document.getElementById.bind(document);
  var opts = null;
  var searchTimer = null;

  var ENGINE_URLS = {
    baidu: 'https://www.baidu.com/s?wd=',
    google: 'https://www.google.com/search?q=',
    bing: 'https://www.bing.com/search?q=',
    bili: 'https://search.bilibili.com/all?keyword=',
    zhihu: 'https://www.zhihu.com/search?type=content&q=',
    github: 'https://github.com/search?q=',
  };
  var ENGINE_CODES = ['local', 'baidu', 'google', 'bing', 'bili', 'zhihu', 'github'];

  function currentEngine() { return opts.S.engine; }
  function engineLabel(code) {
    return { local: opts.t('engine_local'), baidu: opts.t('engine_baidu'), google: opts.t('engine_google'), bing: opts.t('engine_bing'), bili: opts.t('engine_bili'), zhihu: opts.t('engine_zhihu'), github: opts.t('engine_github') }[code] || code;
  }
  function webSearch(q, code) {
    var base = ENGINE_URLS[code];
    if (!base || !q) return false;
    window.open(base + encodeURIComponent(q), '_blank');
    return true;
  }
  function renderEngineMenu() {
    if (!opts) return;
    var engineMenu = opts.engineMenu;
    if (!engineMenu) return;
    engineMenu.innerHTML = ENGINE_CODES.map(function (code) {
      return '<button class="theme-option' + (opts.S.engine === code ? ' active' : '') + '" data-engine="' + code + '">' +
        (code === 'local' ? '🔍 ' : '') + opts.escapeHtml(engineLabel(code)) + '</button>';
    }).join('');
  }
  function setEngine(code) {
    opts.S.engine = ENGINE_CODES.indexOf(code) === -1 ? 'local' : code;
    try { opts.S.persist.engine(); } catch (e) { /* 忽略 */ }
    renderEngineMenu();
    syncEngineUI();
    if (window.YHStartPage && YHStartPage.setEngine) YHStartPage.setEngine(opts.S.engine);
  }
  function syncEngineUI() {
    if (!opts) return;
    var eng = currentEngine();
    if (!opts.searchInput || !opts.btnSearch) return;
    opts.engineBtn.forEach(function (b) { b.innerHTML = engineLabel(eng) + ' ▾'; });
    if (eng === 'local') {
      opts.searchInput.placeholder = opts.t('search_ph');
      opts.btnSearch.innerHTML = opts.t('search_btn');
      opts.btnSearch.title = opts.t('search_btn');
    } else {
      opts.searchInput.placeholder = (opts.S.lang === 'en' ? 'Search on ' : '在 ') + engineLabel(eng) + (opts.S.lang === 'en' ? '…' : ' 中搜索…');
      opts.btnSearch.innerHTML = engineLabel(eng);
      opts.btnSearch.title = opts.t('search_btn') + ' → ' + engineLabel(eng);
    }
  }
  function doSearch() {
    clearTimeout(searchTimer);
    var kw = opts.getKeyword().trim();
    var eng = currentEngine();
    if (eng !== 'local') { webSearch(kw, eng); return; }
    if (kw) { opts.recordHotWord(kw); opts.recordSearchHistory(kw); }
    hideSearchHot();
    hideSearchAc();
    if (opts.hasActiveView()) opts.exitAllViews();
    opts.renderGrid();
  }
  function showSearchHot() {
    var searchHot = opts.searchHot;
    if (!searchHot) return;
    if (currentEngine() !== 'local' || (opts.searchInput && opts.searchInput.value)) { searchHot.hidden = true; return; }
    var html = '';
    if (opts.S.searchHistory.length) {
      html += '<div class="search-hot-title">🕘 ' + opts.t('recent_search_title') +
        ' <button class="search-hot-clear" data-clear-hist="1" title="' + opts.t('clear_search_hist_tip') + '">' + opts.t('clear_search_hist') + '</button></div>';
      html += opts.S.searchHistory.map(function (h) {
        return '<button class="search-hot-chip" data-q="' + opts.escapeHtml(h.q) + '">' + opts.escapeHtml(h.q) + '</button>';
      }).join('');
    }
    var keys = Object.keys(opts.S.hotWords).sort(function (a, b) { return opts.S.hotWords[b] - opts.S.hotWords[a]; }).slice(0, 10);
    if (keys.length) {
      html += '<div class="search-hot-title">' + opts.t('hot_search_title') + '</div>' +
        keys.map(function (k) {
          return '<button class="search-hot-chip" data-q="' + opts.escapeHtml(k) + '">' + opts.escapeHtml(k) + '</button>';
        }).join('');
    }
    if (!html) { searchHot.hidden = true; return; }
    searchHot.innerHTML = html;
    searchHot.hidden = false;
  }
  function hideSearchHot() { var searchHot = opts.searchHot; if (searchHot) searchHot.hidden = true; }
  function hideSearchAc() { var searchAc = opts.searchAc; if (searchAc) searchAc.hidden = true; }
  function renderSearchAc() {
    var searchAc = opts.searchAc;
    if (!searchAc) return;
    if (currentEngine() !== 'local' || !opts.searchInput || !opts.searchInput.value.trim()) { searchAc.hidden = true; return; }
    var q = opts.searchInput.value.trim();
    var html = '';
    if (/^(https?:\/\/|www\.)/i.test(q) || (/\./.test(q) && !/\s/.test(q) && !/[\u4e00-\u9fff]/.test(q))) {
      var u = /^https?:\/\//i.test(q) ? q : 'https://' + q;
      html += '<div class="ac-item ac-direct" data-url="' + opts.escapeHtml(u) + '"><span class="ac-ico">🔗</span><b>' + opts.t('ac_direct') + '</b> <span>' + opts.escapeHtml(q) + '</span></div>';
    }
    var kw = q.toLowerCase();
    var fuzzy = (window.YH && YH.fuzzySearch) || function (k, t) { return t.indexOf(k) !== -1 ? 100 : null; };
    var hits = [];
    opts.allSites().forEach(function (s) {
      var sc = fuzzy(kw, s.name, 'fuzzy');
      if (sc === null) sc = fuzzy(kw, s.fullName, 'fuzzy');
      if (sc !== null) hits.push({ s: s, sc: sc });
    });
    hits.sort(function (a, b) { return b.sc - a.sc; });
    hits.slice(0, 8).forEach(function (h) {
      html += '<div class="ac-item" data-id="' + h.s.id + '"><span class="ac-ico">🏝</span>' + opts.escapeHtml(opts.nameLabel(h.s)) +
        (h.s.tags && h.s.tags.length ? ' <span class="ac-tag">' + opts.escapeHtml(opts.tagLabel(h.s.tags[0])) + '</span>' : '') +
      '</div>';
    });
    if (!html) { searchAc.hidden = true; return; }
    html += '<div class="ac-item ac-more" data-q="' + opts.escapeHtml(q) + '"><span class="ac-ico">🔎</span>' + opts.t('ac_more') + ' <span>' + opts.escapeHtml(q) + '</span></div>';
    searchAc.innerHTML = html;
    searchAc.hidden = false;
  }
  function focusAcItem(el) {
    if (!el) return;
    var old = opts.searchAc.querySelectorAll('.ac-focused');
    for (var k = 0; k < old.length; k++) { old[k].classList.remove('ac-focused'); }
    el.classList.add('ac-focused');
    try { if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); } catch (e) {}
    try { el.focus(); } catch (e) {}
  }

  function init(o) {
    if (!o || !o.searchInput) return;
    opts = o;
    renderEngineMenu();
    syncEngineUI();

    o.engineBtn.forEach(function (b) { o.on(b, 'click', function (e) {
      e.stopPropagation();
      if (!o.engineMenu) return;
      var menu = o.engineMenu;
      if (menu.classList.contains('open')) {
        menu.classList.remove('open'); menu.style.top = ''; menu.style.left = '';
      } else {
        menu.hidden = false;
        menu.classList.add('open');
        var rect = b.getBoundingClientRect();
        menu.style.top = (rect.bottom + 8) + 'px';
        requestAnimationFrame(function () {
          var pw = menu.offsetWidth;
          var left = rect.right - pw;
          if (left < 8) left = 8;
          var maxL = window.innerWidth - pw - 8;
          if (left > maxL) left = maxL;
          menu.style.left = left + 'px';
        });
      }
    }); });
    o.on(o.engineMenu, 'click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-engine]') : null;
      if (!b) return;
      setEngine(b.getAttribute('data-engine'));
      if (o.engineMenu) { o.engineMenu.classList.remove('open'); o.engineMenu.style.top = ''; o.engineMenu.style.left = ''; }
      if (o.searchInput) o.searchInput.focus();
    });
    document.addEventListener('click', function (e) {
      if (o.engineMenu && o.engineMenu.classList.contains('open') && !(e.target.closest && e.target.closest('.engine-wrap'))) {
        o.engineMenu.classList.remove('open'); o.engineMenu.style.top = ''; o.engineMenu.style.left = '';
      }
    });

    o.on(o.searchInput, 'input', function () {
      o.setKeyword(o.searchInput.value);
      if (o.btnClear) o.btnClear.hidden = !o.searchInput.value;
      clearTimeout(o.searchTimer);
      if (currentEngine() === 'local') {
        if (o.searchInput.value) hideSearchHot(); else showSearchHot();
        renderSearchAc();
        o.searchTimer = setTimeout(doSearch, 120);
      }
    });
    o.on(o.searchInput, 'focus', showSearchHot);
    o.on(o.searchInput, 'blur', function () { setTimeout(function () { hideSearchHot(); hideSearchAc(); }, 150); });

    o.on(o.searchHot, 'click', function (e) {
      var clearBtn = e.target.closest ? e.target.closest('[data-clear-hist]') : null;
      if (clearBtn) {
        o.S.searchHistory = [];
        o.saveSearchHistory();
        showSearchHot();
        return;
      }
      var b = e.target.closest ? e.target.closest('[data-q]') : null;
      if (!b) return;
      var q = b.getAttribute('data-q');
      o.searchInput.value = q;
      o.setKeyword(q);
      if (o.btnClear) o.btnClear.hidden = false;
      doSearch();
    });

    o.on(o.searchAc, 'click', function (e) {
      var urlItem = e.target.closest ? e.target.closest('[data-url]') : null;
      if (urlItem) {
        window.open(urlItem.getAttribute('data-url'), '_blank');
        hideSearchAc();
        return;
      }
      var idItem = e.target.closest ? e.target.closest('[data-id]') : null;
      if (idItem) {
        var s = o.siteOf(idItem.getAttribute('data-id'));
        if (s) { if (s.url) window.open(s.url, '_blank'); if (s.id) o.addRecent(s.id); }
        hideSearchAc();
        return;
      }
      var more = e.target.closest ? e.target.closest('[data-q]') : null;
      if (more) {
        o.searchInput.value = more.getAttribute('data-q');
        o.setKeyword(o.searchInput.value);
        if (o.btnClear) o.btnClear.hidden = false;
        doSearch();
      }
    });

    o.on(o.searchInput, 'keydown', function (e) {
      var acItems = (o.searchAc && !o.searchAc.hidden) ? o.searchAc.querySelectorAll('.ac-item') : [];
      var idx = -1;
      for (var i = 0; i < acItems.length; i++) {
        if (acItems[i] === document.activeElement) { idx = i; break; }
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (acItems.length) { focusAcItem(acItems[(idx + 1) % acItems.length]); }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (acItems.length) {
          var prev = (idx - 1 + acItems.length) % acItems.length;
          if (idx === 0) { o.searchInput.focus(); } else { focusAcItem(acItems[prev]); }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        hideSearchAc(); hideSearchHot();
        o.searchInput.focus();
      } else if (e.key === 'Enter' && idx >= 0) {
        e.preventDefault();
        acItems[idx].click();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        doSearch();
        if (o.appEl && !o.appEl.classList.contains('revealed')) {
          o.appEl.classList.add('revealed');
          document.body.classList.add('entered');
        }
      }
    });

    o.on(o.btnSearch, 'click', doSearch);
    o.on(o.btnClear, 'click', function () {
      o.searchInput.value = '';
      o.setKeyword('');
      if (o.btnClear) o.btnClear.hidden = true;
      doSearch();
      o.searchInput.focus();
    });
  }

  root.YHSearch = { init: init, renderEngineMenu: renderEngineMenu, syncEngineUI: syncEngineUI };
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : window));
