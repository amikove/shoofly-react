import './instrument'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { NotifProvider } from './context/NotifContext'
import ToastContainer from './components/ui/ToastContainer'
import { i18nReady } from './i18n/config'
import './index.css'
// v2

function mount() {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <NotifProvider>
              <App />
              <ToastContainer />
            </NotifProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  )
}

// F1 (audit perf 2026-09-07) : l'init i18n est désormais asynchrone (locale active chargée à
// la demande via import()). On attend `i18nReady` avant le 1er rendu pour qu'aucun composant
// ne s'affiche avec des clés brutes non traduites. `i18nReady` est déjà résilient (il résout
// même si le chargement des locales échoue, en initialisant i18n sans ressources) ; le
// .catch ici n'est qu'une ceinture de sécurité pour garantir le montage en toutes circonstances.
i18nReady.catch(() => {}).then(mount)

// Service worker Web Push (chantier notifications push, Phase 2). Enregistrement non bloquant,
// après `load` : n'impacte ni le 1er rendu ni le TTI. Le SW (public/sw.js) ne fait QUE du push
// (aucun cache, aucun handler fetch) — aucun risque de servir un bundle périmé. Échec
// d'enregistrement (navigateur sans SW, iOS Safari hors PWA installée, contexte non sécurisé)
// avalé silencieusement : le canal push est simplement indisponible, l'app fonctionne.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[push] Enregistrement du service worker échoué :', err && err.message)
    })
  })
}
