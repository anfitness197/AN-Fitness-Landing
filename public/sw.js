self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "AN Fitness Update",
    body: "New update from AN Fitness!",
    icon: "/assets/logos/web-app-manifest-192x192.png",
    badge: "/assets/logos/favicon-96x96.png",
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

  const resolveUrl = (path) => {
    if (!path) return undefined;
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
    return new URL(path, self.location.origin).href;
  };

  const options = {
    body: data.body,
    icon: resolveUrl(data.icon || "/assets/logos/web-app-manifest-192x192.png"),
    badge: resolveUrl(data.badge || "/assets/logos/favicon-96x96.png"),
    image: resolveUrl(data.image),
    tag: data.tag || `an-fitness-${Date.now()}`,
    data: {
      url: data.url || "/events",
    },
    vibrate: [200, 100, 200],
    requireInteraction: true,
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, options),
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({ type: "PUSH_NOTIFICATION_RECEIVED", notification: data });
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
