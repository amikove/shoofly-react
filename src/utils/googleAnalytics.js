// Envoie une "vue de page" à Google Analytics à chaque changement de route.
// Nécessaire car GA ne détecte pas automatiquement la navigation interne
// d'une Single Page Application (React Router) — seulement les vrais rechargements.
export function trackPageView(path) {
  if (typeof window.gtag !== 'function') return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.origin + path,
  })
}