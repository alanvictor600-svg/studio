
const CACHE_NAME = 'bolao-potiguar-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
];

// Only cache requests from our own origin
const shouldCache = (request) => {
    const url = new URL(request.url);
    return url.origin === self.location.origin;
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        
        const cachePromises = urlsToCache.map(urlToCache => {
            const request = new Request(urlToCache);
            return fetch(request).then(response => {
                if (response.ok) {
                    return cache.put(request, response);
                }
                return Promise.resolve();
            }).catch(error => {
                console.error(`Failed to fetch and cache ${urlToCache}:`, error);
            });
        });

        return Promise.all(cachePromises);
      })
  );
});


self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
    // We only want to cache GET requests that are from our origin
    if (event.request.method !== 'GET' || !shouldCache(event.request)) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response; // Serve from cache
                }

                // Not in cache, fetch from network
                return fetch(event.request).then(
                    (networkResponse) => {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                ).catch(error => {
                    // Network request failed, and it's not in the cache.
                    // You could return a generic fallback page here if you want.
                    console.error('Fetch failed; returning offline page instead.', error);
                    // e.g., return caches.match('/offline.html');
                });
            })
    );
});
