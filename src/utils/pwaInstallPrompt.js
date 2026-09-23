// Capture de l'évènement `beforeinstallprompt` (Android/Chrome) — module singleton importé au
// tout début de main.jsx (avant le 1er rendu React), même motif que offlineQueueInstance.js.
// Nécessaire car les pages client/Œil (et donc InstallPwaBanner) sont lazy-loaded (App.jsx) :
// si on n'écoutait qu'au montage du bandeau, un évènement déclenché pendant l'écran de login
// (chargé, lui, avant toute connexion) serait perdu — le navigateur ne le redéclenche pas.
let deferredPrompt = null
// 'unavailable' (rien reçu depuis le chargement de la page) | 'available' (prêt) | 'dismissed'
// (l'utilisateur a refusé l'invite native) | 'installed' (appinstalled, ou acceptation de
// l'invite). Sur Android, InstallPwaBanner affiche le guide manuel dès que le statut n'est PAS
// 'available' (donc 'unavailable' ET 'dismissed') — jamais de bandeau vide en attendant l'évènement.
let status = 'unavailable'
const listeners = new Set()

function notify() { listeners.forEach((fn) => fn()) }

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    status = 'available'
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    status = 'installed'
    notify()
  })
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getSnapshot() {
  return status
}

// `deferredPrompt.prompt()` ne peut être appelé qu'une fois par évènement, quel que soit le
// choix de l'utilisateur — on efface la référence AVANT même d'attendre `userChoice` pour
// qu'un double-clic ne puisse jamais retenter `.prompt()` sur le même évènement (ce qui lèverait
// une exception). Sur refus ('dismissed') : statut basculé sur 'dismissed', qui déclenche le
// repli sur le guide manuel Android (le bouton "Ajouter le raccourci" disparaît avec lui — plus
// aucun bouton n'appelle jamais deux fois `.prompt()`). Chrome redéclenchera un nouvel évènement
// à un prochain chargement de page si l'app reste non installée.
export async function promptInstall() {
  if (!deferredPrompt) return
  const evt = deferredPrompt
  deferredPrompt = null
  try {
    evt.prompt()
    const choice = await evt.userChoice
    status = choice && choice.outcome === 'dismissed' ? 'dismissed' : 'installed'
  } catch {
    status = 'dismissed'
  }
  notify()
}
