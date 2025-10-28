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
    // Use the pathname only as cache key (ignore query string)
    const cacheKey = url.pathname.split(["?"][0]);

    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) return cachedResponse;

        // Fetch the request normally
        const response = await fetch(event.request);

        // Store in cache using the pathname only
        cache.put(cacheKey, response.clone());

        return response;
      })
    );
  }
});
