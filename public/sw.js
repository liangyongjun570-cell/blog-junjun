/**
 * 🌟 junjun.site Service Worker
 * 策略：静态资源 cache-first(后台更新)；页面 network-first；API 永不缓存
 * 离线时回退到缓存里的首页
 */

const CACHE = 'junjun-v1';
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([OFFLINE_URL])).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // 动态数据永远走网络

  const isStatic = url.pathname.startsWith('/_next/static') ||
    /\.(jpg|jpeg|png|webp|gif|svg|ico|css|js|woff2?|mp4)$/.test(url.pathname);

  if (isStatic) {
    // 静态资源：cache-first + 后台静默更新
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || network;
      })
    );
    return;
  }

  // 页面/其它：network-first，断网回退缓存
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match(OFFLINE_URL))
      )
  );
});
