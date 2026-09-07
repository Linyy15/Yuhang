/* Yuhang data schema (UMD, browser + Node). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else if (typeof define === 'function' && define.amd) define([], factory);
  else root.YHSchema = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var schemaVersion = 2;
  var LINK_TYPES = ['public_site', 'personal_link', 'workspace_item', 'shortcut', 'submission'];
  var VISIBILITIES = ['public', 'private'];
  var LINK_STATUSES = ['unknown', 'active', 'degraded', 'inactive'];
  var DEFAULT_SCHEMA = {
    schemaVersion: schemaVersion,
    links: [],
    sites: [], // Legacy alias. Keep it during the V1 -> V2 transition.
    settings: {},
    meta: { createdAt: null, updatedAt: null, catalogVersion: null }
  };
  function clone(v) {
    if (v === undefined) return v;
    return JSON.parse(JSON.stringify(v));
  }
  function isObject(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function asArray(v) { return Array.isArray(v) ? v : []; }
  function hasValue(v) { return v !== undefined && v !== null && v !== ''; }
  function isIsoOrNull(v) { return v == null || (typeof v === 'string' && !isNaN(Date.parse(v))); }
  function defaultType(link, legacySource) {
    if (LINK_TYPES.indexOf(link.type) !== -1) return link.type;
    // Catalog-shaped records were historically called `sites`; generic saved links are private.
    if (legacySource === 'sites' || hasValue(link.category) || hasValue(link.fullName)) return 'public_site';
    return 'personal_link';
  }
  function normalizeLink(link, legacySource) {
    var out = isObject(link) ? clone(link) : {};
    out.type = defaultType(out, legacySource);
    if (VISIBILITIES.indexOf(out.visibility) === -1) out.visibility = out.type === 'public_site' ? 'public' : 'private';
    if (!Array.isArray(out.tags)) out.tags = [];
    if (!Array.isArray(out.alternativeUrls)) out.alternativeUrls = [];
    if (LINK_STATUSES.indexOf(out.status) === -1) out.status = 'unknown';
    if (!Number.isInteger(out.revision) || out.revision < 1) out.revision = 1;
    if (!Object.prototype.hasOwnProperty.call(out, 'source')) out.source = null;
    if (!Object.prototype.hasOwnProperty.call(out, 'official')) out.official = null;
    if (!Object.prototype.hasOwnProperty.call(out, 'createdAt')) out.createdAt = null;
    if (!Object.prototype.hasOwnProperty.call(out, 'updatedAt')) out.updatedAt = null;
    if (!Object.prototype.hasOwnProperty.call(out, 'deletedAt')) out.deletedAt = null;
    if (!Object.prototype.hasOwnProperty.call(out, 'lastCheckedAt')) out.lastCheckedAt = null;
    return out;
  }
  function migrate(input) {
    var data = isObject(input) ? clone(input) : {};
    var from = Number(data.schemaVersion || data.version || 0);
    var legacySource = Array.isArray(data.links) ? 'links' : (Array.isArray(data.sites) ? 'sites' : 'links');
    // Accept the legacy sites.js shape ({meta, sites}) and old link aliases.
    if (!Array.isArray(data.links) && Array.isArray(data.sites)) data.links = data.sites;
    if (!Array.isArray(data.links)) data.links = [];
    data.links = data.links.map(function (link) { return normalizeLink(link, legacySource); });
    if (!isObject(data.settings)) data.settings = {};
    if (!isObject(data.meta)) data.meta = {};
    data.schemaVersion = schemaVersion;
    delete data.version;
    data.sites = data.links;
    data.meta.migratedFrom = from || schemaVersion;
    if (!Object.prototype.hasOwnProperty.call(data.meta, 'catalogVersion')) data.meta.catalogVersion = null;
    return data;
  }
  function defaults(overrides) {
    var out = clone(DEFAULT_SCHEMA);
    if (isObject(overrides)) {
      Object.keys(overrides).forEach(function (k) { out[k] = clone(overrides[k]); });
    }
    return migrate(out);
  }
  function validate(value) {
    var errors = [];
    if (!isObject(value)) return { valid: false, errors: ['schema must be an object'] };
    if (Number(value.schemaVersion) !== schemaVersion) errors.push('schemaVersion must be ' + schemaVersion);
    if (!Array.isArray(value.links) && !Array.isArray(value.sites)) errors.push('links must be an array');
    var links = Array.isArray(value.links) ? value.links : value.sites;
    asArray(links).forEach(function (link, i) {
      var key = 'links[' + i + ']';
      if (!isObject(link)) { errors.push(key + ' must be an object'); return; }
      if (!link.id) errors.push(key + '.id is required');
      if (!link.url) errors.push(key + '.url is required');
      if (LINK_TYPES.indexOf(link.type) === -1) errors.push(key + '.type is invalid');
      if (VISIBILITIES.indexOf(link.visibility) === -1) errors.push(key + '.visibility is invalid');
      if (link.tags != null && !Array.isArray(link.tags)) errors.push(key + '.tags must be an array');
      if (link.alternativeUrls != null && !Array.isArray(link.alternativeUrls)) errors.push(key + '.alternativeUrls must be an array');
      if (LINK_STATUSES.indexOf(link.status) === -1) errors.push(key + '.status is invalid');
      if (!Number.isInteger(link.revision) || link.revision < 1) errors.push(key + '.revision must be a positive integer');
      ['createdAt', 'updatedAt', 'deletedAt', 'lastCheckedAt'].forEach(function (field) {
        if (!isIsoOrNull(link[field])) errors.push(key + '.' + field + ' must be an ISO date string or null');
      });
    });
    return { valid: errors.length === 0, errors: errors };
  }
  function deepMerge(left, right) {
    var out = isObject(left) ? clone(left) : {};
    if (!isObject(right)) return out;
    Object.keys(right).forEach(function (key) {
      if (isObject(out[key]) && isObject(right[key])) out[key] = deepMerge(out[key], right[key]);
      else out[key] = clone(right[key]);
    });
    return out;
  }
  function merge(base, patch) {
    var out = migrate(base);
    patch = isObject(patch) ? patch : {};
    Object.keys(patch).forEach(function (key) {
      if (key === 'links' || key === 'sites') return;
      if (isObject(out[key]) && isObject(patch[key])) out[key] = deepMerge(out[key], patch[key]);
      else out[key] = clone(patch[key]);
    });
    var incoming = Array.isArray(patch.links) ? patch.links : (Array.isArray(patch.sites) ? patch.sites : []);
    var byId = {}; out.links.forEach(function (x, i) { if (x && x.id != null) byId[String(x.id)] = i; });
    incoming.forEach(function (x) {
      if (!x) return;
      var key = x.id == null ? null : String(x.id);
      if (key != null && byId[key] != null) out.links[byId[key]] = normalizeLink(Object.assign({}, out.links[byId[key]], clone(x)), 'links');
      else { out.links.push(normalizeLink(x, 'links')); if (key != null) byId[key] = out.links.length - 1; }
    });
    out.sites = out.links;
    out.schemaVersion = schemaVersion;
    return out;
  }
  function diff(a, b) {
    a = migrate(a); b = migrate(b);
    var am = {}, bm = {};
    a.links.forEach(function (x) { if (x && x.id != null) am[String(x.id)] = x; });
    b.links.forEach(function (x) { if (x && x.id != null) bm[String(x.id)] = x; });
    var added = [], removed = [], updated = [];
    Object.keys(bm).forEach(function (id) { if (!am[id]) added.push(clone(bm[id])); else if (JSON.stringify(am[id]) !== JSON.stringify(bm[id])) updated.push({ id: id, before: clone(am[id]), after: clone(bm[id]) }); });
    Object.keys(am).forEach(function (id) { if (!bm[id]) removed.push(clone(am[id])); });
    return { added: added, removed: removed, updated: updated };
  }
  return { schemaVersion: schemaVersion, LINK_TYPES: LINK_TYPES, VISIBILITIES: VISIBILITIES, LINK_STATUSES: LINK_STATUSES, DEFAULT_SCHEMA: DEFAULT_SCHEMA, defaults: defaults, normalizeLink: normalizeLink, migrate: migrate, validate: validate, merge: merge, diff: diff, clone: clone };
}));
