import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// ── F1 (audit perf 2026-09-07) — chargement dynamique de la langue active uniquement ──
// Avant : `import fr from './locales/fr.json'` ET `import ar` → les deux locales (~168 + ~199 ko
// brut ; ~44 + ~48 ko gzip une fois émises) étaient inlinées dans le bundle de TOUT visiteur.
// Un utilisateur FR embarquait ~48 ko gzip d'arabe inutile (et inversement).
// Après : chaque locale est un chunk séparé, chargé à la demande via import(). L'init i18n
// devient donc asynchrone — `i18nReady` (exporté) doit être attendu avant le 1er rendu
// (voir main.jsx) pour qu'aucun composant ne s'affiche avec des clés brutes.

const LOCALE_LOADERS = {
  fr: () => import('./locales/fr.json'),
  ar: () => import('./locales/ar.json'),
}
const SUPPORTED_LNGS = ['fr', 'ar']
const FALLBACK_LNG = 'fr'
const STORAGE_KEY = 'shoofly_lang'

// Même logique que i18next-browser-languagedetector (ordre localStorage → navigator), mais
// exécutée AVANT init pour ne télécharger que la ou les locale(s) réellement nécessaires.
function detectInitialLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && SUPPORTED_LNGS.includes(stored)) return stored
  } catch {
    /* localStorage inaccessible (Safari mode privé strict) — on retombe sur navigator */
  }
  const nav = (navigator.language || '').slice(0, 2).toLowerCase()
  if (SUPPORTED_LNGS.includes(nav)) return nav
  return FALLBACK_LNG
}

async function fetchBundle(lng) {
  const mod = await LOCALE_LOADERS[lng]()
  return mod.default
}

// Ajoute une locale au store i18next si absente. Idempotent. Utilisé au démarrage ET à chaque
// changement de langue en cours de session (voir le wrap de changeLanguage plus bas).
async function ensureLanguageLoaded(lng) {
  if (!SUPPORTED_LNGS.includes(lng)) return
  if (i18n.hasResourceBundle(lng, 'translation')) return
  const bundle = await fetchBundle(lng)
  i18n.addResourceBundle(lng, 'translation', bundle, true, true)
}

const initialLng = detectInitialLanguage()

// Au démarrage on charge la langue active + la langue de repli (pour que le fallback des clés
// manquantes fonctionne dès le 1er rendu). Un utilisateur FR ne charge donc que fr.json ;
// un utilisateur AR charge ar.json + fr.json (repli).
const startupLngs = initialLng === FALLBACK_LNG ? [FALLBACK_LNG] : [initialLng, FALLBACK_LNG]

export const i18nReady = Promise.all(startupLngs.map(fetchBundle))
  .catch((err) => {
    // Échec réseau du chargement des locales : on initialise quand même i18n (sans ressources)
    // pour ne pas laisser react-i18next suspendre indéfiniment. L'app monte en mode dégradé.
    console.error('i18n — échec du chargement des locales au démarrage :', err?.message)
    return []
  })
  .then((bundles) => {
    const resources = {}
    bundles.forEach((bundle, i) => {
      if (bundle) resources[startupLngs[i]] = { translation: bundle }
    })
    return i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        resources,
        lng: initialLng,
        fallbackLng: FALLBACK_LNG,
        supportedLngs: SUPPORTED_LNGS,
        detection: {
          order: ['localStorage', 'navigator'],
          caches: ['localStorage'],
          lookupLocalStorage: STORAGE_KEY,
        },
        interpolation: {
          escapeValue: false,
        },
      })
  })
  .then(() => {
    // Changement de langue EN COURS DE SESSION — LanguageToggle (pages publiques) et le toggle
    // du menu authentifié (AppLayout) appellent tous i18n.changeLanguage(). On enrobe cette
    // méthode pour charger la locale AVANT de basculer : pas de flash de clés brutes ni de
    // repli FR transitoire. Point de branchement unique → couvre tous les appelants, présents
    // et futurs.
    const nativeChangeLanguage = i18n.changeLanguage.bind(i18n)
    i18n.changeLanguage = async (lng, ...rest) => {
      try {
        await ensureLanguageLoaded(lng)
      } catch (err) {
        console.error('i18n — échec du chargement de la locale', lng, ':', err?.message)
      }
      return nativeChangeLanguage(lng, ...rest)
    }
  })

export default i18n
