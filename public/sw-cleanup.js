
// Este script é injetado no novo service worker.
// Sua única missão é encontrar e remover versões antigas do service worker e seus caches.

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      
      // Lista de nomes de caches antigos que queremos remover.
      const oldCacheNames = cacheNames.filter(name => {
        // Adicione aqui padrões de nomes de caches antigos, se souber.
        // Por exemplo, se a versão anterior usava caches com "workbox" ou nomes específicos.
        // Vamos ser genéricos e remover caches que não sejam os atuais do PWA.
        return !name.startsWith('pages') && !name.startsWith('static-resources') && !name.startsWith('images');
      });

      // Deleta todos os caches antigos.
      await Promise.all(oldCacheNames.map(name => caches.delete(name)));

      // Encontra e cancela o registro de service workers antigos.
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        // Força o cliente a recarregar para usar o novo service worker.
        client.navigate(client.url);
      }
    })()
  );
});
