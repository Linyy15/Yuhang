/*
 * 屿航 · P2 搜索索引（浏览器 + Node）
 * ------------------------------------------------------------
 * 经典 UMD：浏览器暴露 window.YHSearchIndex，Node 使用 require()。
 * build(sites) 按数组引用缓存可搜索字段；query() 返回按分数降序的结果。
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(root);
  } else if (typeof define === 'function' && define.amd) {
    define([], function () { return factory(root); });
  } else {
    root.YHSearchIndex = factory(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function (root) {
  'use strict';

  var cachedSites = null;
  var cachedIndex = [];
  var FIELD_NAMES = { name: 1, fullname: 1, tag: 1, tags: 1, category: 1, brief: 1, detail: 1, url: 1, domain: 1 };

  function string(value) { return value == null ? '' : String(value); }
  function normalize(value) {
    return string(value).toLowerCase().replace(/[\u3000\s_-]+/g, '').replace(/[：:，,。.!！?？/\\]+/g, '');
  }
  function domainOf(url) {
    var text = string(url).trim();
    if (!text) return '';
    try { return new URL(/^https?:\/\//i.test(text) ? text : 'https://' + text).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) {
      return text.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].toLowerCase();
    }
  }
  function splitValues(value) {
    return string(value).split(',').map(function (item) { return item.trim(); }).filter(Boolean);
  }
  function tokenize(input) {
    var tokens = [], text = String(input == null ? '' : input), buf = '', quote = false, escaped = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (escaped) { buf += ch; escaped = false; continue; }
      if (ch === '\\' && quote) { escaped = true; continue; }
      if (ch === '"') { quote = !quote; continue; }
      if (/\s/.test(ch) && !quote) { if (buf) { tokens.push(buf); buf = ''; } }
      else buf += ch;
    }
    if (buf) tokens.push(buf);
    return tokens;
  }

  /**
   * Parse supported operators. Bare words become text terms.
   * in:name/tag/category/brief/detail/url/fullname limits text matching fields;
   * any other in:<value> is treated as a category filter.
   */
  function parseQuery(input) {
    var parsed = { text: [], tags: [], in: [], domains: [], isFav: null };
    tokenize(input).forEach(function (token) {
      var match = /^([a-z]+):(.*)$/i.exec(token);
      if (!match) { parsed.text.push(token); return; }
      var key = match[1].toLowerCase();
      var value = match[2].trim();
      if (key === 'tag' && value) parsed.tags = parsed.tags.concat(splitValues(value));
      else if (key === 'domain' && value) parsed.domains = parsed.domains.concat(splitValues(value));
      else if (key === 'in' && value) parsed.in = parsed.in.concat(splitValues(value));
      else if (key === 'is' && /^fav(?:orite)?$/i.test(value)) parsed.isFav = true;
      else parsed.text.push(token);
    });
    parsed.text = parsed.text.filter(Boolean);
    return parsed;
  }

  function makeEntry(site, order) {
    site = site || {};
    var tags = Array.isArray(site.tags) ? site.tags : splitValues(site.tags);
    return {
      site: site,
      order: order,
      fields: {
        name: string(site.name),
        fullname: string(site.fullName || site.fullname),
        tag: tags.join(' '),
        category: string(site.category),
        brief: string(site.brief),
        detail: string(site.detail),
        url: string(site.url),
        domain: domainOf(site.url)
      },
      tags: tags.map(normalize),
      domain: domainOf(site.url)
    };
  }

  /** Build (or reuse) the singleton cached index for a sites array. */
  function build(sites) {
    sites = Array.isArray(sites) ? sites : [];
    if (sites === cachedSites) return api;
    cachedSites = sites;
    cachedIndex = sites.map(makeEntry);
    return api;
  }

  function fuzzyScore(query, value, mode) {
    if (!query || !value) return null;
    var yh = root && root.YH;
    if (yh && typeof yh.fuzzySearch === 'function') {
      var external = yh.fuzzySearch(query, value, mode || 'fuzzy');
      if (external !== null && external !== undefined) return Number(external) || 0;
      return null;
    }
    var q = normalize(query), text = normalize(value);
    if (!q || !text) return null;
    if (text === q) return 115;
    if (text.indexOf(q) === 0) return 108;
    if (text.indexOf(q) !== -1) return 100;
    if (mode === 'exact' || q.length < 2) return null;
    var pos = -1, first = -1;
    for (var i = 0; i < q.length; i++) {
      pos = text.indexOf(q.charAt(i), pos + 1);
      if (pos === -1) return null;
      if (first === -1) first = pos;
    }
    var span = pos - first + 1;
    return span <= q.length * 2 + 2 ? Math.max(50, 78 - span) : null;
  }

  function favoriteTest(site, options) {
    if (typeof options.isFavorite === 'function') return !!options.isFavorite(site);
    if (options.favorites && typeof options.favorites.has === 'function') return options.favorites.has(site.id) || options.favorites.has(site);
    if (Array.isArray(options.favorites)) return options.favorites.indexOf(site.id) !== -1 || options.favorites.indexOf(site) !== -1;
    return !!(site.fav || site.favorite || site.isFav);
  }
  function matchesAll(values, source) {
    return values.every(function (value) {
      var needle = normalize(value);
      return source.some(function (item) { return item === needle; });
    });
  }
  function fieldList(inFilters) {
    if (!inFilters.length) return ['name', 'fullname', 'tag', 'category', 'url', 'brief', 'detail'];
    var fields = inFilters.filter(function (value) { return FIELD_NAMES[value.toLowerCase()]; })
      .map(function (value) { value = value.toLowerCase(); return value === 'tags' ? 'tag' : value; });
    return fields.length ? fields : ['name', 'fullname', 'tag', 'category', 'url', 'brief', 'detail'];
  }

  /**
   * Search the cached index. options: { limit=50, offset=0, favorites, isFavorite,
   * sites, fields, weights }. `sites` builds/reuses that array before querying.
   */
  function query(input, options) {
    options = options || {};
    if (options.sites) build(options.sites);
    var parsed = typeof input === 'object' && input ? input : parseQuery(input);
    var textTerms = parsed.text || [];
    var inFilters = parsed.in || [];
    var categoryFilters = inFilters.filter(function (value) { return !FIELD_NAMES[value.toLowerCase()]; });
    var fields = options.fields || fieldList(inFilters);
    var defaults = { name: 1.00, fullname: 0.94, tag: 0.78, category: 0.72, url: 0.88, domain: 0.88, brief: 0.52, detail: 0.35 };
    var weights = options.weights || {};
    var hits = [];

    cachedIndex.forEach(function (entry) {
      if (parsed.isFav && !favoriteTest(entry.site, options)) return;
      if (!matchesAll(parsed.tags || [], entry.tags)) return;
      if (!matchesAll(categoryFilters, [normalize(entry.fields.category)])) return;
      if (!(parsed.domains || []).every(function (wanted) {
        wanted = string(wanted).trim().toLowerCase().replace(/^www\./, '');
        return entry.domain === wanted || entry.domain.slice(-(wanted.length + 1)) === '.' + wanted;
      })) return;

      var total = 0;
      for (var i = 0; i < textTerms.length; i++) {
        var best = null;
        for (var f = 0; f < fields.length; f++) {
          var field = String(fields[f]).toLowerCase();
          field = field === 'tags' ? 'tag' : field;
          if (!entry.fields[field]) continue;
          var score = fuzzyScore(textTerms[i], entry.fields[field], field === 'brief' || field === 'detail' || field === 'url' ? 'exact' : 'fuzzy');
          if (score === null) continue;
          score *= weights[field] == null ? (defaults[field] == null ? 1 : defaults[field]) : weights[field];
          if (best === null || score > best) best = score;
        }
        if (best === null) return;
        total += best;
      }
      // Filters-only queries remain deterministic and score-neutral.
      hits.push({ site: entry.site, score: total, matches: textTerms.slice() });
    });

    hits.sort(function (a, b) { return b.score - a.score || String(a.site.name || '').localeCompare(String(b.site.name || ''), 'zh') || cachedIndex.findIndex(function (x) { return x.site === a.site; }) - cachedIndex.findIndex(function (x) { return x.site === b.site; }); });
    var offset = Math.max(0, Number(options.offset) || 0);
    var limit = options.limit == null ? 50 : Math.max(0, Number(options.limit) || 0);
    return hits.slice(offset, offset + limit);
  }

  var api = { build: build, query: query, parseQuery: parseQuery };
  return api;
});
