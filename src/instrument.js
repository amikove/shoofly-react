// Doit être importé avant tout le reste dans main.jsx (avant App, avant les contexts) —
// convention officielle Sentry pour que les intégrations par défaut (erreurs globales,
// breadcrumbs fetch/DOM…) soient posées avant que le reste de l'app ne s'exécute.
import * as Sentry from '@sentry/react'

const SENSITIVE_KEY_PATTERN = /pass(word)?|secret|token|jwt|authoriz|api[_-]?key/i
function scrubSensitiveKeys(obj) {
  if (!obj || typeof obj !== 'object') return
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      obj[key] = '[Filtered]'
    } else if (obj[key] && typeof obj[key] === 'object') {
      scrubSensitiveKeys(obj[key])
    }
  }
}

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  // Suivi d'erreurs uniquement — pas de tracing de performance (hors périmètre de ce chantier,
  // pas de browserTracingIntegration/tracesSampleRate).

  // Vérifié dans le SDK installé (node_modules/@sentry/browser/.../integrations/breadcrumbs.js) :
  // les breadcrumbs DOM ne capturent qu'un sélecteur décrivant l'élément cliqué/touché (ex.
  // "input#password"), jamais la valeur tapée ; les breadcrumbs fetch/xhr n'attachent au
  // breadcrumb envoyé que method/url/status_code — le corps de requête/réponse (disponible en
  // interne dans `hint.input`) n'est PAS sérialisé vers Sentry sauf beforeBreadcrumb personnalisé
  // (non utilisé ici). Un mot de passe de formulaire de login/inscription n'est donc capté par
  // aucune des deux voies par défaut. beforeSend ci-dessous reste un filet de sécurité en plus,
  // au cas où un futur ajout (ex. captureException(err, { extra }) sur une erreur axios) attache
  // un jour explicitement un tel champ.
  beforeSend(event) {
    scrubSensitiveKeys(event.request?.data)
    scrubSensitiveKeys(event.extra)
    return event
  },
})

if (import.meta.env.VITE_SENTRY_DSN) {
  console.log(`🛰️ Sentry initialisé (frontend) — environment=${import.meta.env.MODE}`)
} else if (import.meta.env.DEV) {
  console.warn("⚠️ VITE_SENTRY_DSN non définie — suivi d'erreurs Sentry désactivé (normal en dev local sans DSN configuré).")
}
