const CACHE_NAME = "project-images-cache-v1";
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const ext = url.pathname.split(".").pop();

  if (ext && IMAGE_EXTENSIONS.includes(ext.toLowerCase())) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;

        const response = await fetch(event.request);
        cache.put(event.request, response.clone());
        return response;
      })
    );
  }
});
