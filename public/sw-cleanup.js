
// Este script é importado pelo nosso novo service worker (sw-v2.js)
// Sua única missão é limpar Service Workers e caches antigos.

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Obter todos os registros de Service Workers
      const registrations = await self.registration.navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        // Se o script do Service Worker não for o nosso novo script, desregistre-o!
        if (registration.active && !registration.active.scriptURL.endsWith('/sw-v2.js')) {
          console.log('SW-CLEANUP: Encontrado e removendo Service Worker antigo:', registration.active.scriptURL);
          await registration.unregister();
        }
      }

      // 2. Obter todas as chaves de cache
      const keys = await caches.keys();
      const CACHES_TO_DELETE = keys.filter((key) => {
        // Deleta qualquer cache que não seja os definidos na nova configuração
        return !['pages', 'static-resources', 'images'].includes(key);
      });

      // 3. Deletar os caches antigos
      if (CACHES_TO_DELETE.length > 0) {
        console.log('SW-CLEANUP: Encontrado e removendo caches antigos:', CACHES_TO_DELETE.join(', '));
        await Promise.all(CACHES_TO_DELETE.map(key => caches.delete(key)));
      }

      // 4. Forçar todas as abas abertas a recarregar para usar a nova versão
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => {
        console.log('SW-CLEANUP: Forçando recarregamento do cliente:', client.url);
        client.navigate(client.url);
      });

      console.log('SW-CLEANUP: Processo de limpeza concluído.');
    })()
  );
});
