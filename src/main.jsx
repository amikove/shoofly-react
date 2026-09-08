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
