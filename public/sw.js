// Inert service worker to prevent 404 console errors from localhost service worker residue
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});
