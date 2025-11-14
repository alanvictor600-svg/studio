
// Define um nome e versão para o cache.
const CACHE_NAME = 'bolao-potiguar-cache-v1';

// Lista de URLs para fazer cache inicial (App Shell).
const urlsToCache = [
  '/',
  '/styles/globals.css', // Adapte para o caminho correto do seu CSS
  // Adicione aqui outros assets estáticos importantes: logos, fontes, etc.
];

// Evento de instalação do Service Worker.
self.addEventListener('install', (event) => {
  // Adia a instalação até que o cache seja preenchido.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        // Adiciona os recursos do App Shell ao cache.
        // O fetch desses recursos pode falhar, então não queremos que uma falha quebre a instalação.
        const cachePromises = urlsToCache.map(urlToCache => {
          return cache.add(urlToCache).catch(err => {
            console.warn(`Falha ao fazer cache de ${urlToCache}: ${err}`);
          });
        });
        return Promise.all(cachePromises);
      })
  );
});

// Evento de ativação do Service Worker.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Deleta caches antigos que não estão na whitelist.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento de fetch: intercepta as requisições de rede.
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET (como POST, etc.).
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignora requisições de extensões do Chrome ou outros protocolos não-HTTP.
  if (!event.request.url.startsWith('http')) {
      return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      // 1. Tenta buscar da rede primeiro (Network First).
      return fetch(event.request).then((response) => {
        // Se a resposta da rede for bem-sucedida (status 200),
        // clonamos a resposta e a armazenamos no cache para uso futuro.
        if (response.status === 200) {
          cache.put(event.request.url, response.clone());
        }
        return response;
      }).catch(() => {
        // 2. Se a rede falhar, tenta buscar do cache.
        return cache.match(event.request);
      });
    })
  );
});
