const CACHE_VERSION = "an-fitness-v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PAGE_CACHE = `pages-${CACHE_VERSION}`;

// Assets to pre-cache on install (app shell)
const PRECACHE_URLS = [
  "/assets/logos/web-app-manifest-192x192.png",
  "/assets/logos/web-app-manifest-512x512.png",
  "/assets/logos/favicon-96x96.png",
  "/assets/logos/apple-touch-icon.png",
  "/assets/logos/favicon.svg",
  "/assets/vectors/dumbbell-iron.svg",
  "/assets/hero/hero-poster.webp",
];

// ─── Lifecycle ────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("SW: precache partial failure", err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Caching helpers ──────────────────────────────────────────

const MAX_STATIC_ENTRIES = 200;
const MAX_PAGE_ENTRIES = 30;
const STATIC_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PAGE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 day

function isStaticAsset(url) {
  const path = url.pathname;
  return (
    path.startsWith("/assets/") ||
    path.startsWith("/_next/static/") ||
    path.match(/\.(png|jpg|jpeg|webp|avif|gif|svg|ico|woff2?|ttf|otf|css|js)$/i)
  );
}

function isNavigationOrPage(request, url) {
  return (
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html")
  );
}

function shouldSkipCache(url) {
  const path = url.pathname;
  return (
    path.startsWith("/api/") ||
    path.startsWith("/an-admin") ||
    path.startsWith("/sw.js") ||
    path.includes("__nextjs") ||
    path.includes("_next/data")
  );
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await Promise.all(
      keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k))
    );
  }
}

// ─── Fetch strategies ─────────────────────────────────────────

// Cache-first: great for versioned/static assets
async function cacheFirst(request, cacheName, maxAge) {
  const cached = await caches.match(request);
  if (cached) {
    const dateHeader = cached.headers.get("sw-cache-time");
    if (dateHeader && Date.now() - parseInt(dateHeader, 10) > maxAge) {
      // Stale — fetch fresh in background, return stale for now (stale-while-revalidate)
      fetchAndCache(request, cacheName).catch(() => {});
    }
    return cached;
  }
  return fetchAndCache(request, cacheName);
}

// Network-first: great for HTML pages (always fresh, offline fallback)
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      const headers = new Headers(clone.headers);
      headers.set("sw-cache-time", Date.now().toString());
      const body = await clone.arrayBuffer();
      const cached = new Response(body, {
        status: clone.status,
        statusText: clone.statusText,
        headers,
      });
      caches.open(cacheName).then((cache) => {
        cache.put(request, cached);
        trimCache(cacheName, MAX_PAGE_ENTRIES);
      });
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function fetchAndCache(request, cacheName) {
  const response = await fetch(request);
  if (response.ok) {
    const clone = response.clone();
    const headers = new Headers(clone.headers);
    headers.set("sw-cache-time", Date.now().toString());
    const body = await clone.arrayBuffer();
    const cached = new Response(body, {
      status: clone.status,
      statusText: clone.statusText,
      headers,
    });
    caches.open(cacheName).then((cache) => {
      cache.put(request, cached);
      trimCache(cacheName, MAX_STATIC_ENTRIES);
    });
  }
  return response;
}

// ─── Fetch listener ───────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin GET requests
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  // Skip API, admin, and internal Next.js routes
  if (shouldSkipCache(url)) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE, STATIC_MAX_AGE_MS));
    return;
  }

  if (isNavigationOrPage(event.request, url)) {
    event.respondWith(networkFirst(event.request, PAGE_CACHE));
    return;
  }
});

// ─── Push notifications ───────────────────────────────────────

const DEFAULT_ICON = "/assets/logos/web-app-manifest-192x192.png";
const DEFAULT_BADGE = "/assets/logos/favicon-96x96.png";

function resolveUrl(path) {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  try {
    return new URL(path, self.location.origin).href;
  } catch {
    return undefined;
  }
}

self.addEventListener("push", (event) => {
  let data = {
    title: "AN Fitness Update",
    body: "New update from AN Fitness!",
    icon: DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    url: "/events",
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const icon = resolveUrl(data.icon || DEFAULT_ICON) || resolveUrl(DEFAULT_ICON);
  const badge = resolveUrl(data.badge || DEFAULT_BADGE) || resolveUrl(DEFAULT_BADGE);
  const image = resolveUrl(data.image);

  const options = {
    body: data.body,
    icon,
    badge,
    image,
    tag: data.tag || `an-fitness-${Date.now()}`,
    renotify: true,
    data: {
      url: data.url || "/events",
    },
    vibrate: [200, 100, 200],
    requireInteraction: true,
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || "AN Fitness", options).catch(() => {
        
        const { image: _drop, ...fallback } = options;
        return self.registration.showNotification(data.title || "AN Fitness", fallback);
      }),
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({
            type: "PUSH_NOTIFICATION_RECEIVED",
            notification: { ...data, icon, badge, image },
          });
        }
      }),
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/events";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
