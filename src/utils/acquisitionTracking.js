// Capture les paramètres UTM présents dans l'URL au premier chargement
// et les conserve en localStorage jusqu'à l'inscription (même si l'utilisateur
// navigue sur plusieurs pages avant de créer son compte).
const STORAGE_KEY = 'shoofly_acquisition'

export function captureAcquisitionParams() {
  const params = new URLSearchParams(window.location.search)
  const source = params.get('utm_source')
  const medium = params.get('utm_medium')
  const campaign = params.get('utm_campaign')

  // On ne capture que si au moins un paramètre UTM est présent dans l'URL,
  // et on ne réécrase jamais une capture existante (on garde la toute première source vue)
  if ((source || medium || campaign) && !localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      acquisition_source: source || null,
      acquisition_medium: medium || null,
      acquisition_campaign: campaign || null,
      captured_at: new Date().toISOString(),
    }))
  }
}

// Récupère les infos capturées (à envoyer avec le formulaire d'inscription)
export function getAcquisitionParams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    return {
      acquisition_source: data.acquisition_source,
      acquisition_medium: data.acquisition_medium,
      acquisition_campaign: data.acquisition_campaign,
    }
  } catch {
    return {}
  }
}

// À appeler une fois l'inscription réussie, pour ne pas polluer une future inscription
// (ex: si quelqu'un se déconnecte et recrée un compte plus tard depuis le même navigateur)
export function clearAcquisitionParams() {
  localStorage.removeItem(STORAGE_KEY)
}