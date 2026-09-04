import { Component } from 'react'
import * as Sentry from '@sentry/react'

// Filet de dernier recours pour les erreurs de RENDU (une exception levée pendant le rendu d'un
// composant fait, sans ce garde, disparaître tout l'arbre React → écran blanc). React n'expose pas
// d'équivalent hook : il faut une classe avec getDerivedStateFromError / componentDidCatch.
// Monté dans App.jsx autour du <Suspense> des routes : couvre donc aussi bien un échec de
// import() paresseux (chunk manquant après un déploiement, réseau coupé) qu'une exception de
// rendu classique dans n'importe quelle page ou bannière globale.

// Un import() paresseux qui échoue ne lève pas une erreur applicative « normale » : selon le
// navigateur c'est un TypeError « Failed to fetch dynamically imported module », un
// « error loading dynamically imported module », ou un name === 'ChunkLoadError'. On les
// regroupe pour proposer un simple rechargement (le nouveau HTML référencera les bons chunks).
function isChunkLoadError(error) {
  if (!error) return false
  if (error.name === 'ChunkLoadError') return true
  const msg = String(error.message || '')
  return (
    /failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /importing a module script failed/i.test(msg) ||
    /loading chunk [\d]+ failed/i.test(msg) ||
    /loading css chunk/i.test(msg)
  )
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    // Message + pile de composants uniquement (jamais l'objet d'erreur brut) — même prudence que
    // le reste du code de journalisation du projet.
    console.error(
      'ErrorBoundary — erreur de rendu interceptée :',
      error?.message,
      errorInfo?.componentStack,
    )
    // captureReactException (plutôt que captureException) attache correctement le
    // componentStack — API Sentry dédiée aux erreurs remontées à un ErrorBoundary React. Vient
    // en plus du console.error ci-dessus, ne le remplace pas.
    Sentry.captureReactException(error, errorInfo)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const chunk = isChunkLoadError(error)

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] p-6">
        <div className="text-center max-w-sm">
          <div className="font-display font-bold text-2xl mb-4">
            SHOOF<span className="text-[#FF4D00]">LY</span>
          </div>
          <p className="text-sm text-white/90 font-medium mb-1">
            {chunk ? 'Nouvelle version disponible' : 'Une erreur est survenue'}
          </p>
          <p className="text-xs text-[#AAA] leading-relaxed mb-5">
            {chunk
              ? 'Le chargement d’un élément de l’application a échoué. Cela arrive généralement après une mise à jour ou lors d’une coupure réseau. Rechargez la page pour continuer.'
              : 'Un problème inattendu a interrompu l’affichage de cette page. Rechargez la page ; si le problème persiste, réessayez plus tard.'}
          </p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Recharger la page
          </button>
        </div>
      </div>
    )
  }
}
