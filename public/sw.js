self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

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
