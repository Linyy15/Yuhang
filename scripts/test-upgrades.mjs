// P1/P2/P3 核心升级模块纯 Node 回归测试。
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const schema = require('../web/js/schema.js');
const links = require('../web/js/links.js');
const index = require('../web/js/search-index.js');
const integrations = require('../web/js/integrations.js');

const sites = [
  { id: 'github', name: 'GitHub', fullName: 'GitHub 开源社区', url: 'https://www.github.com/', category: '编程开发', tags: ['编程开发', 'AI'], brief: '代码托管' },
  { id: 'game', name: 'Steam', url: 'https://store.steampowered.com', category: '游戏', tags: ['游戏'] },
  { id: 'evil', name: 'Evil', url: 'https://notgithub.com', category: '其他', tags: ['其他'] },
];
const normalized = links.fromSites(sites);
assert.equal(normalized[0].domain, 'github.com');
assert.equal(links.normalizeUrl('example.com/path#fragment'), 'https://example.com/path');
assert.equal(links.dedupe([{ name: 'A', url: 'https://example.com/' }, { name: 'B', url: 'https://example.com/' }]).length, 1);
assert.equal(links.dedupe([{ name: 'A', url: 'https://example.com/' }, { name: 'B', url: 'http://example.com' }]).length, 2);

const migrated = schema.migrate({ version: 0, sites: normalized });
assert.equal(migrated.schemaVersion, schema.schemaVersion);
assert.equal(migrated.links[0].type, 'public_site');
assert.equal(migrated.links[0].visibility, 'public');
assert.equal(migrated.links[0].revision, 1);
assert.equal(schema.validate(migrated).valid, true);
const personal = schema.migrate({ version: 1, links: [{ id: 'saved', url: 'https://example.com', tags: ['稍后阅读'] }] });
assert.equal(personal.links[0].type, 'personal_link');
assert.equal(personal.links[0].visibility, 'private');
assert.equal(personal.links[0].status, 'unknown');
assert.equal(schema.validate(personal).valid, true);
const invalid = schema.defaults({ links: [{ id: 'bad', url: 'https://example.com', type: 'not-a-type' }] });
invalid.links[0].type = 'not-a-type';
assert.equal(schema.validate(invalid).valid, false);
assert.equal(schema.diff(migrated, schema.merge(migrated, { links: [{ id: 'new', url: 'https://new.example' }] })).added.length, 1);

assert.equal(index.query('tag:AI', { sites: normalized }).length, 1);
assert.equal(index.query('in:游戏', { sites: normalized }).length, 1);
assert.equal(index.query('domain:github.com', { sites: normalized }).length, 1);
assert.equal(index.query('domain:github.com', { sites: normalized })[0].site.id, 'github');
assert.equal(index.query('domain:github.com is:fav', { sites: normalized, favorites: new Set(['github']) }).length, 1);
assert.equal(index.query('domain:github.com is:fav', { sites: normalized, favorites: new Set() }).length, 0);
assert.equal(index.parseQuery('tag:"编程开发" foo').tags[0], '编程开发');

integrations.init({ enabled: false });
const disabled = await integrations.checkLink('https://example.com');
assert.equal(disabled.error.code, 'OPT_IN_REQUIRED');
integrations.init({ enabled: true, fetch: async () => ({ ok: true, status: 204, statusText: 'No Content', headers: { get: () => null } }) });
const checked = await integrations.checkLink('https://example.com');
assert.equal(checked.ok, true);
const blocked = await integrations.checkLink('http://127.0.0.1');
assert.equal(blocked.error.code, 'INVALID_URL');
console.log('✅ P1/P2/P3 升级模块测试全部通过');
