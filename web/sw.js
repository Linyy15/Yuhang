/* 屿航 · Service Worker（PWA 离线缓存）
 * 应用外壳：缓存优先 + 网络回退；跨域请求（热搜/登录等）不拦截。
 * 数据文件（data/sites.js 等）：网络优先，后台管理修改后刷新即可生效，离线时回退缓存。
 * 网站图标（favicon.im / DuckDuckGo / Google）：cache-first，缓存已见过的图标 → 离线也能显示图标（首字兜底）。
 * 发布更新后请提升版本号（CACHE），下次访问自动更新缓存。
 */
const CACHE = 'yuhang-v8';
const ICON_CACHE = 'yuhang-icons-v1';
const SHELL = [
  './',
  './index.html',
  './js/sites-lib.js',
  './js/schema.js',
  './js/links.js',
  './js/search-index.js',
  './js/integrations.js',
  './js/media-tools.js',
  './js/app.js',
  './js/startpage.js',
  './css/style.css',
  './css/startpage.css',
  './css/startpage-polish.css',
  './icon.svg',
  './manifest.webmanifest',
];
// 网站图标域名（cache-first，离线可用）
const ICON_HOSTS = ['favicon.im', 'icons.duckduckgo.com', 'www.google.com'];
// 图标缓存上限（约 2000 个 16px 图标 ≈ 几 MB），防缓存无限膨胀
const ICON_MAX = 2000;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== ICON_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 图标缓存超限时删除最旧条目
function trimIconCache() {
  caches.open(ICON_CACHE).then((c) => c.keys().then((keys) => {
    if (keys.length <= ICON_MAX) return;
    const overflow = keys.length - ICON_MAX;
    const toDel = keys.slice(0, overflow);
    Promise.all(toDel.map((k) => c.delete(k))).catch(() => {});
  })).catch(() => {});
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }

  // 网站图标：cache-first → 命中即用（离线可用）；未命中走网络并缓存
  if (ICON_HOSTS.indexOf(url.hostname) !== -1) {
    e.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(ICON_CACHE).then((c) => {
              c.put(req, copy);
              trimIconCache();
            }).catch(() => {});
          }
          return res;
        }).catch(() => hit || Response.error());
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return; // 其余跨域不拦截

  // 数据文件（sites.js / sites.json）：网络优先 → 后台修改即时生效；离线时回退缓存
  if (/\/data\/sites\.(js|json)$/.test(url.pathname)) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 应用外壳：缓存优先 + 网络回退（离线可用）
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
