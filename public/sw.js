// self.addEventListener('install', (event) => {
//   console.log('Service worker installing...');
//   // Add a call to skipWaiting here
// });

// self.addEventListener('activate', (event) => {
//   console.log('Service worker activating...');
// });

self.addEventListener('fetch', (event) => {
  // Check if the request is for a chrome-extension. If so, do not handle it.
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // IMPORTANT: Clone the request. A request is a stream and
      // can only be consumed once. Since we are consuming this
      // once by cache and once by the browser for fetch, we need
      // to clone the response.
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the cache consuming the response, we need
        // to clone it so we have two streams.
        const responseToCache = response.clone();

        caches.open('bolao-potiguar-cache-v1').then((cache) => {
           // We only want to cache GET requests
          if (event.request.method === 'GET') {
            cache.put(event.request, responseToCache);
          }
        });

        return response;
      });
    })
  );
});
