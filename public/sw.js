/* SHOOFLY — service worker Web Push (chantier notifications push, Phase 2).
 *
 * PÉRIMÈTRE VOLONTAIREMENT MINIMAL : uniquement le push. Aucun handler `fetch`, aucun cache —
 * la SPA continue de se charger et de se mettre à jour exactement comme avant (pas de risque
 * de servir un vieux bundle). Si un besoin réel de cache/hors-ligne apparaît un jour, ce sera
 * un chantier dédié.
 *
 *   push              -> showNotification (payload JSON chiffré envoyé par backend services/push.js)
 *                        + accusé de réception (POST /api/push/ack, event 'delivered')
 *   notificationclick -> accusé de clic (event 'clicked') + focus d'un onglet SHOOFLY existant
 *                        (+ navigation vers l'URL) ou openWindow
 *
 * Accusés (chantier 2 lot 1 bis — mesure) : le contenu du push porte nid (notification), sid
 * (abonnement) et ack (jeton signé par le backend). Le SW n'a pas le JWT de l'app : le jeton suffit
 * à la route. Adresse de l'API passée à l'enregistrement (main.jsx : /sw.js?api=...). Sans ces
 * champs (ancien backend, notification locale) : aucun accusé, comportement d'avant. Un accusé
 * qui échoue est ignoré en silence — jamais bloquant pour l'affichage ni pour l'ouverture.
 */

const API_BASE = (() => {
  try {
    const api = new URL(self.location.href).searchParams.get('api') || '';
    return /^https?:\/\//.test(api) ? api.replace(/\/+$/, '') : '';
  } catch {
    return '';
  }
})();

function ack(data, event) {
  if (!API_BASE || !data || !data.nid || !data.sid || !data.ack) return Promise.resolve();
  return fetch(API_BASE + '/api/push/ack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    body: JSON.stringify({ notificationId: data.nid, subscriptionId: data.sid, event, token: data.ack }),
  }).catch(() => {});
}

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
    data: { url: data.url || '/', nid: data.nid, sid: data.sid, ack: data.ack },
  };

  event.waitUntil(Promise.all([
    self.registration.showNotification(title, options),
    ack(data, 'delivered'),
  ]));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  // Accusé de clic lancé AVANT l'ouverture, sans l'attendre : attendre le réseau avant
  // openWindow ferait perdre l'activation utilisateur (Firefox refuse alors l'ouverture).
  const clickAck = ack(event.notification.data, 'clicked');

  event.waitUntil(Promise.all([clickAck, (async () => {
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
  })()]));
});
