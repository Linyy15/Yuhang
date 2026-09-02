/*
 * 屿航 · 卡片模块（筛选 + 为你推荐 + 卡片渲染 + FLIP 入场 + FLIP-out 飞出）
 * ------------------------------------------------------------
 * 暴露 window.YHCards { init, render, getFilteredSites }。
 * 筛选状态（activeCat / activeWs / selectedTags / keyword）由 app.js 拥有，
 * 本模块经 opts.getActiveCat / getActiveWs / getSelectedTags / getKeyword getter 读取，
 * 只负责渲染侧。keyword 与 search.js 共享。
 */
(function (root) {
  'use strict';
  var opts = null;
  var flyLayer = null;

  // ---------- 筛选状态（由 app.js 拥有，本模块经 opts getter 读取） ----------

  // ---------- 排序 ----------
  function byName(a, b) {
    return String(a.name || '').localeCompare(String(b.name || ''), 'zh');
  }
  function filterSites() {
    var activeCat = opts.getActiveCat(), activeWs = opts.getActiveWs(), selectedTags = opts.getSelectedTags();
    var kw = opts.getKeyword().trim().toLowerCase();
    var base;
    if (activeWs) {
      var ws = opts.S.workspaces[activeWs];
      base = (ws ? ws.ids : []).map(function (id) { return opts.siteOf(id); }).filter(Boolean);
    } else if (activeCat === opts.MY_CAT) {
      base = opts.S.currentUser ? (opts.S.personalSites[opts.S.currentUser] || []) : [];
    } else if (activeCat === opts.FAV_CAT) {
      base = opts.allSites().filter(function (s) { return opts.S.favs.has(s.id); }).sort(byName);
    } else if (activeCat === opts.HOT_CAT) {
      base = opts.allSites()
        .filter(function (s) { return (opts.S.clicks[s.id] || 0) > 0; })
        .sort(function (a, b) { return (opts.S.clicks[b.id] || 0) - (opts.S.clicks[a.id] || 0); })
        .slice(0, 12);
    } else if (activeCat === opts.RECENT_CAT) {
      base = opts.S.recentIds.map(function (id) { return opts.siteOf(id); }).filter(Boolean);
    } else if (selectedTags.size) {
      base = opts.allSites().filter(function (s) {
        return (s.tags || []).some(function (tn) { return selectedTags.has(tn); });
      }).sort(byName);
    } else {
      base = opts.allSites().sort(byName);
    }
    if (kw) {
      var fuzzy = (opts.YH && opts.YH.fuzzySearch) ||
        function (q, t) { return t.indexOf(q) !== -1 ? 100 : null; };
      var scored = [];
      base.forEach(function (s) {
        var best = null;
        function bump(sc) { if (sc !== null && (best === null || sc > best)) best = sc; }
        bump(fuzzy(kw, s.name, 'fuzzy'));
        bump(fuzzy(kw, s.fullName, 'fuzzy'));
        bump(fuzzy(kw, (s.tags || []).join(' '), 'fuzzy'));
        bump(fuzzy(kw, s.category, 'fuzzy'));
        bump(fuzzy(kw, s.brief, 'fuzzy'));
        bump(fuzzy(kw, s.detail, 'fuzzy'));
        bump(fuzzy(kw, s.url, 'exact'));
        if (best !== null) scored.push({ s: s, score: best });
      });
      scored.sort(function (a, b) { return b.score - a.score || byName(a.s, b.s); });
      base = scored.map(function (x) { return x.s; });
    }
    return base;
  }
  function getRecommendations() {
    var clicked = opts.SITES.filter(function (s) { return (opts.S.clicks[s.id] || 0) > 0; });
    if (clicked.length < 3) return [];
    var pool = {};
    clicked.forEach(function (s) {
      var w = opts.S.clicks[s.id] || 1;
      (s.tags || []).forEach(function (tn) { pool[tn] = (pool[tn] || 0) + w; });
    });
    var scored = [];
    opts.SITES.forEach(function (s) {
      if (opts.S.clicks[s.id] > 0 || opts.S.favs.has(s.id)) return;
      var score = 0;
      (s.tags || []).forEach(function (tn) { if (pool[tn]) score += pool[tn]; });
      if (score > 0) scored.push({ s: s, score: score });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, 8).map(function (x) { return x.s; });
  }
  function emptyMessage() {
    var activeCat = opts.getActiveCat(), activeWs = opts.getActiveWs(), selectedTags = opts.getSelectedTags();
    if (activeWs) return opts.t('empty_ws');
    if (activeCat === opts.MY_CAT) return opts.t('empty_my');
    if (activeCat === opts.FAV_CAT) return opts.t('empty_fav');
    if (activeCat === opts.HOT_CAT) return opts.t('empty_hot');
    if (selectedTags.size) return opts.t('empty_tags');
    return opts.t('empty_all');
  }

  // ---------- 卡片 HTML ----------
  function cardHTML(s, showCount) {
    var isFav = opts.S.favs.has(s.id);
    var star = '<button class="star' + (isFav ? ' on' : '') + '" data-id="' + opts.escapeHtml(s.id) + '" title="' + (isFav ? opts.t('un_fav') : opts.t('add_fav')) + '">' + (isFav ? '★' : '☆') + '</button>';
    var more = '<button class="more" data-id="' + opts.escapeHtml(s.id) + '" title="⋯">⋯</button>';
    var primaryTag = (s.tags && s.tags[0]) || s.category || '';
    var cardHue = primaryTag ? opts.tagHue(primaryTag) : '';
    var tag = primaryTag ? '<span class="tag" style="--tag-c ' + cardHue + '">' + opts.escapeHtml(opts.tagLabel(primaryTag)) + '</span>' : '';
    var srcTag = s.source === 'personal' ? '<span class="tag tag-me">' + opts.t('personal') + '</span>' : '';
    var count = showCount && opts.S.clicks[s.id] ? '<span class="card-count">👁' + opts.S.clicks[s.id] + '</span>' : '';
    var cs = cardHue ? 'style="--card-c ' + cardHue + '"' : '';
    return (
      '<div class="card" role="link" tabindex="0" data-id="' + opts.escapeHtml(s.id) + '" data-url="' + opts.escapeHtml(s.url || '') + '" title="' + opts.escapeHtml(s.detail || s.brief || '') + '" ' + cs + '">' +
        '<div class="card-head">' +
          opts.iconHTML(s) +
          '<span class="card-title">' + opts.escapeHtml(opts.nameLabel(s)) + '</span>' +
          '<span class="card-badges">' + star + more + '</span>' +
        '</div>' +
        '<div class="card-tags">' + srcTag + tag + count + '</div>' +
      '</div>'
    );
  }

  // ---------- 渲染（FLIP） ----------
  function renderGrid() {
    if (!opts) return;
    var activeCat = opts.getActiveCat(), activeWs = opts.getActiveWs(), selectedTags = opts.getSelectedTags();
    var kw = opts.getKeyword().trim();
    var recs = (opts.S.currentUser && activeCat === '全部' && !kw && !selectedTags.size && !activeWs) ? getRecommendations() : [];
    var list = filterSites();
    var doFlip = opts.perfLevel !== 'low' && list.length <= 200;
    var first = {};
    var oldEls = [];
    var grid = opts.grid;
    if (doFlip) {
      var oldCards = grid.querySelectorAll('.card');
      for (var i = 0; i < oldCards.length; i++) {
        var oid = oldCards[i].getAttribute('data-id');
        if (!oid) continue;
        var or = oldCards[i].getBoundingClientRect();
        first[oid] = { x: or.left, y: or.top };
        oldEls.push({ id: oid, el: oldCards[i], rect: or });
      }
    }
    var html = '';
    if (recs.length) {
      html += '<div class="section-head"><span class="section-title">' + opts.t('reco') + '</span><span class="section-sub">' + opts.t('reco_sub') + '</span></div>';
      recs.forEach(function (s) { html += cardHTML(s, false).replace('class="card"', 'class="card reco"'); });
    }
    if (!list.length && !recs.length) {
      var addBtnHtml = (activeCat === opts.MY_CAT && opts.S.currentUser)
        ? '<br><br><button class="btn btn-primary empty-add" data-empty-add="1">＋ ' + opts.t('add_site') + '</button>'
        : '';
      html = '<div class="empty"><span class="empty-svg" aria-hidden="true"><svg viewBox="0 0 120 90" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M60 78c-18 0-32-3-40-7 4-4 12-7 22-8 6-6 14-10 18-10s12 4 18 10c10 1 18 4 22 8-8 4-22 7-40 7Z" opacity="0.55"/><circle cx="60" cy="34" r="20" stroke-width="2.6"/><circle cx="60" cy="34" r="3.5" fill="currentColor" stroke="none"/><path d="M60 18v7M60 43v7M44 34h7M69 34h7"/><path d="M60 18l5 6M60 50l-5-6"/><path d="M78 16l4-2M84 22l5 0M78 28l4 3" opacity="0.8"/><path d="M42 28l-4 3M36 22l-5 0M42 16l-4-2" opacity="0.8"/></svg></span><span class="empty-text">' + opts.escapeHtml(emptyMessage()) + '</span>' + addBtnHtml + '</div>';
    } else if (list.length) {
      list.forEach(function (s) { html += cardHTML(s, activeCat === opts.HOT_CAT); });
    }
    grid.className = 'grid ' + opts.S.gridSize;
    grid.innerHTML = html;
    opts.lazyLoadIcons();
    var newCards = grid.querySelectorAll('.card');
    if (doFlip) {
      requestAnimationFrame(function () {
        for (var j = 0; j < newCards.length; j++) {
          var c = newCards[j];
          var nid = c.getAttribute('data-id');
          var nr = c.getBoundingClientRect();
          if (nid && first[nid]) {
            var dx = first[nid].x - nr.left;
            var dy = first[nid].y - nr.top;
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
              c.style.transition = 'none';
              c.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
              void c.offsetWidth;
              c.style.transition = 'transform 0.38s cubic-bezier(0.2, 0.7, 0.3, 1)';
              c.style.transform = '';
              (function (el) {
                setTimeout(function () { el.style.transition = ''; el.style.transform = ''; }, 420);
              })(c);
            }
          } else {
            c.classList.add('enter');
          }
        }
      });
    } else {
      for (var j2 = 0; j2 < newCards.length; j2++) {
        if (newCards[j2].getAttribute('data-id') && !first[newCards[j2].getAttribute('data-id')]) {
          newCards[j2].classList.add('enter');
        }
      }
    }
    if (doFlip && oldEls.length) {
      var newIds = {};
      for (var k = 0; k < newCards.length; k++) {
        var nk = newCards[k].getAttribute('data-id');
        if (nk) newIds[nk] = 1;
      }
      var removed = [];
      for (var m = 0; m < oldEls.length; m++) {
        if (!newIds[oldEls[m].id]) removed.push(oldEls[m]);
      }
      if (opts.perfLevel !== 'low' && removed.length && removed.length <= 60) flyOutCards(removed);
    }
    var searchResult = opts.searchResult;
    if (searchResult) {
      searchResult.hidden = !opts.getKeyword();
      searchResult.textContent = opts.getKeyword() ? list.length + (opts.S.lang === 'en' ? ' results' : ' 个结果') : '';
    }
    if (opts.footerInfo) opts.footerInfo.textContent = (opts.S.lang === 'en'
      ? opts.allSites().length + ' sites · showing ' + list.length + ' · ' + opts.S.favs.size + ' favorites'
      : '共收录 ' + opts.allSites().length + ' 个网站 · 当前显示 ' + list.length + ' 个 · 已收藏 ' + opts.S.favs.size + ' 个');
    if (opts.footerUpdated) opts.footerUpdated.textContent = opts.META.updatedAt || '';
    if (opts.statTotal) opts.statTotal.textContent = opts.allSites().length;
    if (opts.statTags) opts.statTags.textContent = (opts.META.tags || []).length;
    if (opts.statFavs) opts.statFavs.textContent = opts.S.favs.size;
    if (opts.descTotal) opts.descTotal.textContent = opts.allSites().length;
    if (opts.descTags) opts.descTags.textContent = (opts.META.tags || []).length;
  }

  // ---------- 卡片飞出（FLIP-out） ----------
  function flyOutCards(removed) {
    if (!removed.length) return;
    if (!flyLayer) {
      flyLayer = document.createElement('div');
      flyLayer.className = 'fly-layer';
      flyLayer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(flyLayer);
    }
    removed.forEach(function (item) {
      var el = item.el;
      if (!el || !el.classList || el.parentNode === flyLayer) return;
      el.classList.add('card-out');
      el.style.position = 'fixed';
      el.style.left = item.rect.left + 'px';
      el.style.top = item.rect.top + 'px';
      el.style.width = item.rect.width + 'px';
      el.style.height = item.rect.height + 'px';
      el.style.margin = '0';
      el.style.zIndex = '60';
      flyLayer.appendChild(el);
      (function (e) {
        setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 400);
      })(el);
    });
  }

  // ---------- 公共接口（筛选状态由 app.js 拥有，本模块只渲染 + 取过滤列表） ----------
  function render() { if (opts) renderGrid(); }
  function getFilteredSites() { return opts ? filterSites() : []; }

  function init(o) {
    opts = o;
    renderGrid();
  }

  root.YHCards = { init: init, render: render, getFilteredSites: getFilteredSites };
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : window));

