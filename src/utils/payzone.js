// Construit et soumet automatiquement un formulaire HTML caché en POST vers le paywall PayZone.
// `payload` est déjà la chaîne JSON stringifiée signée renvoyée par le backend (/init ou /retry) —
// ne jamais la re-JSON.stringify ici, elle doit être soumise telle quelle dans le champ caché.
export function redirectToPaywall(paywallUrl, payload, signature) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = paywallUrl
  form.style.display = 'none'

  const payloadField = document.createElement('input')
  payloadField.type = 'hidden'
  payloadField.name = 'payload'
  payloadField.value = payload
  form.appendChild(payloadField)

  const signatureField = document.createElement('input')
  signatureField.type = 'hidden'
  signatureField.name = 'signature'
  signatureField.value = signature
  form.appendChild(signatureField)

  document.body.appendChild(form)
  form.submit()
}
