/* SHOOFLY — service worker Web Push (chantier notifications push, Phase 2).
 *
 * PÉRIMÈTRE VOLONTAIREMENT MINIMAL : uniquement le push. Aucun handler `fetch`, aucun cache —
 * la SPA continue de se charger et de se mettre à jour exactement comme avant (pas de risque
 * de servir un vieux bundle). Si un besoin réel de cache/hors-ligne apparaît un jour, ce sera
 * un chantier dédié.
 *
 *   push              -> showNotification (payload JSON chiffré envoyé par backend services/push.js)
 *   notificationclick -> focus d'un onglet SHOOFLY existant (+ navigation vers l'URL) ou openWindow
 */

self.addEventListener('install', () => {
  // Nouvelle version active immédiatement, sans attendre la fermeture des onglets.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'SHOOFLY', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'SHOOFLY';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag || 'shoofly',           // dédup : un même évènement ne s'empile pas
    renotify: false,
    requireInteraction: !!data.urgent,
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of wins) {
      // Un onglet SHOOFLY est déjà ouvert : on le focus, et on l'amène sur l'URL cible si
      // elle est plus précise que la racine (deep-link). `navigate` n'existe pas sur tous les
      // navigateurs -> try/catch silencieux, le focus seul reste utile.
      if ('focus' in client) {
        await client.focus();
        if (targetUrl !== '/' && 'navigate' in client) {
          try { await client.navigate(targetUrl); } catch (e) { /* no-op */ }
        }
        return;
      }
    }
    await self.clients.openWindow(targetUrl);
  })());
});
