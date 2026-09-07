/* Link entities (UMD, browser + Node). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else if (typeof define === 'function' && define.amd) define([], factory);
  else root.YHLinks = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function text(v) { return v == null ? '' : String(v).trim(); }
  function normalizeUrl(value) {
    var raw = text(value);
    if (!raw) return '';
    if (/^(javascript|data|file):/i.test(raw)) return raw;
    if (!/^[a-z][a-z\d+.-]*:\/\//i.test(raw)) raw = 'https://' + raw;
    try {
      var u = new URL(raw);
      u.hash = '';
      u.hostname = u.hostname.toLowerCase();
      if ((u.protocol === 'https:' && u.port === '443') || (u.protocol === 'http:' && u.port === '80')) u.port = '';
      return u.toString().replace(/\/$/, '');
    } catch (e) { return raw.replace(/\s/g, ''); }
  }
  function domain(value) {
    try { return new URL(normalizeUrl(value)).hostname.toLowerCase().replace(/^www\./, ''); }
    catch (e) { return ''; }
  }
  function idFor(url, name) { return domain(url) || text(name).toLowerCase().replace(/\s+/g, '-'); }
  function create(input) {
    input = input || {};
    var url = normalizeUrl(input.url || input.href || '');
    var out = Object.assign({}, input);
    out.id = text(input.id) || idFor(url, input.name || input.title);
    out.name = text(input.name || input.title) || domain(url) || '未命名链接';
    out.url = url;
    out.domain = domain(url);
    out.tags = Array.isArray(input.tags) ? input.tags.filter(Boolean).map(text) : (input.category ? [text(input.category)] : []);
    out.createdAt = input.createdAt || new Date().toISOString();
    out.updatedAt = new Date().toISOString();
    return out;
  }
  function dedupe(items) {
    var map = {}, result = [];
    (Array.isArray(items) ? items : []).forEach(function (item) {
      if (!item) return;
      var link = item.url !== undefined || item.href !== undefined ? create(item) : item;
      // URL/domain is the canonical identity; legacy ids remain a fallback.
      var key = normalizeUrl(link.url) || text(link.id) || text(link.name).toLowerCase();
      if (!key) return;
      if (map[key] == null) { map[key] = result.length; result.push(link); }
      else result[map[key]] = merge(result[map[key]], link);
    });
    return result;
  }
  function merge(a, b) {
    var left = create(a || {}), right = b || {};
    var out = Object.assign({}, left, right);
    out.url = normalizeUrl(right.url || left.url);
    out.domain = domain(out.url);
    out.name = text(right.name || left.name);
    out.tags = Array.from(new Set((left.tags || []).concat(right.tags || []).filter(Boolean)));
    out.updatedAt = new Date().toISOString();
    return out;
  }
  function fromSite(site) {
    if (!site) return null;
    var link = create({ id: site.id, name: site.name || site.fullName, fullName: site.fullName, url: site.url, tags: site.tags, category: site.category, brief: site.brief, detail: site.detail, vpn: site.vpn, internal: site.internal });
    link.source = 'site';
    return link;
  }
  function fromSites(sites) { return dedupe((Array.isArray(sites) ? sites : []).map(fromSite)); }
  return { normalizeUrl: normalizeUrl, domain: domain, getDomain: domain, create: create, createLink: create, dedupe: dedupe, unique: dedupe, merge: merge, fromSite: fromSite, fromSites: fromSites };
}));
