const CACHE_NAME = "project-images-cache-v1";
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "tiff"];

const BUCKET_URL = `https://${process.env.NEXT_PUBLIC_TEMP_BUCKET}.s3.eu-west-1.amazonaws.com/`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const ext = url.pathname.split(".").pop()?.toLowerCase();

  // Check if request is for an image and from the allowed bucket
  const isImage = ext && IMAGE_EXTENSIONS.includes(ext);
  const isBucketUrl = url.href.startsWith(BUCKET_URL);

  if (isImage && isBucketUrl) {
    // Use pathname as cache key (ignore query params)
    const cacheKey = url.origin + url.pathname;

    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) return cachedResponse;

        try {
          const response = await fetch(event.request);
          if (response.ok) {
            // Store clone in cache
            cache.put(cacheKey, response.clone());
          }
          return response;
        } catch (error) {
          console.error("Image fetch failed:", error);
          throw error;
        }
      })
    );
  }
});
