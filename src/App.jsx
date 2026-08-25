import { useEffect, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { trackPageView } from './utils/googleAnalytics'
import { Spinner } from './components/ui'
import VerificationIdentite from './pages/oeil/VerificationIdentite'




// Auth pages
import Login    from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword  from './pages/auth/ResetPassword'
import Landing from './pages/Landing'
import Confidentialite from './pages/legal/Confidentialite'
import CGV from './pages/legal/CGV'
import MentionsLegales from './pages/legal/MentionsLegales'
import Verification from './pages/legal/Verification'

// Client pages
import ClientDashboard  from './pages/client/Dashboard'
import ClientMissions   from './pages/client/Missions'
import ClientCompte     from './pages/client/Compte'
import AirbnbReportView from './pages/client/AirbnbReportView'
import AuditReportView from './pages/client/AuditReportView'
import ClientMessagerie from './pages/shared/Messagerie'
import ClientMesSignalements from './pages/shared/MesSignalements'
import ClientMesTickets from './pages/shared/MesTickets'
import ClientPaiements from './pages/client/Paiements'
import PaymentReturn from './pages/client/PaymentReturn'

// Oeil pages
import OeilDashboard from './pages/oeil/Dashboard'
import OeilMissions  from './pages/oeil/Missions'
import OeilCompte    from './pages/oeil/Compte'
import AirbnbReport  from './pages/oeil/AirbnbReport'
import AuditReport from './pages/oeil/AuditReport'
import OeilMessagerie from './pages/shared/Messagerie'
import OeilMesSignalements from './pages/shared/MesSignalements'
import OeilMesTickets from './pages/shared/MesTickets'
import OeilGains from './pages/oeil/Gains'




import CompteSuspendu from './pages/oeil/CompteSuspendu'

// Admin pages — lazy-loaded : ces 16 pages (dont AdminDashboard, qui embarque toute la librairie
// de graphiques `recharts`) ne sont jamais utilisées par un client/oeil, inutile de les faire
// télécharger à tout le monde (audit perf 2026-07-26 — voir backend/_audit/RAPPORT_AUDIT_PERFORMANCE.md).
const AdminDashboard  = lazy(() => import('./pages/admin/Dashboard'))
const AdminMissions   = lazy(() => import('./pages/admin/Missions'))
const AdminOeils      = lazy(() => import('./pages/admin/Oeils'))
const AdminClients    = lazy(() => import('./pages/admin/Clients'))
const AdminFraude     = lazy(() => import('./pages/admin/Fraude'))
const AdminReclamations = lazy(() => import('./pages/admin/Reclamations'))
const AdminMessagesSuspects = lazy(() => import('./pages/admin/MessagesSuspects'))
const AdminParametres = lazy(() => import('./pages/admin/Parametres'))
const AdminPromos = lazy(() => import('./pages/admin/AdminPromos'))
const AdminGestion = lazy(() => import('./pages/admin/AdminGestion'))
const AdminFiabilite = lazy(() => import('./pages/admin/AdminFiabilite'))
const AdminProblemes = lazy(() => import('./pages/admin/AdminProblemes'))
const AdminTickets = lazy(() => import('./pages/admin/AdminTickets'))
const AdminFinance = lazy(() => import('./pages/admin/AdminFinance'))
const AdminWalletReconciliation = lazy(() => import('./pages/admin/WalletReconciliation'))
const AdminClientsSuspendus = lazy(() => import('./pages/admin/ClientsSuspendus'))
const AdminMissionsProchesValidation = lazy(() => import('./pages/admin/MissionsProchesValidation'))
const UserProfile = lazy(() => import('./pages/admin/UserProfile'))


// Route guard
function RequireAuth({ children, allowedRoles, requiredPermission }) {
  const { user, loading, hasPermission, isSuperAdmin } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  const roleDenied = allowedRoles && !allowedRoles.includes(user.role)
  const permissionDenied = requiredPermission && !(isSuperAdmin || hasPermission(requiredPermission))
  if (roleDenied || permissionDenied) {
    const routes = { client: '/client', oeil: '/oeil', admin: '/admin' }
    return <Navigate to={routes[user.role] || '/login'} replace />
  }
  return children
}

function RouteTracker() {
  const location = useLocation()
  useEffect(() => {
    trackPageView(location.pathname)
  }, [location.pathname])
  return null
}

export default function App() {
  const { user, loading } = useAuth()
  const { i18n } = useTranslation()

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F]">
      <div className="text-center">
        <div className="font-display font-bold text-2xl mb-4">
          SHOOF<span className="text-[#FF4D00]">LY</span>
        </div>
        <Spinner size="lg" />
      </div>
    </div>
  )

  return (
    <>
      <RouteTracker />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>}>
      <Routes>
      {/* Public */}

      <Route path="/confidentialite" element={<Confidentialite />} />
      <Route path="/cgv" element={<CGV />} />
      <Route path="/mentions-legales" element={<MentionsLegales />} />
      <Route path="/verification" element={<Verification />} />
    
      <Route path="/" element={user ? <Navigate to={`/${user.role}`} replace /> : <Landing />} />
      <Route path="/login"    element={user ? <Navigate to={`/${user.role}`} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={`/${user.role}`} /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      {/* Client */}
      <Route path="/client" element={<RequireAuth allowedRoles={['client']}><ClientDashboard /></RequireAuth>} />
      <Route path="/client/missions" element={<RequireAuth allowedRoles={['client']}><ClientMissions /></RequireAuth>} />
        <Route path="/client/compte"    element={<RequireAuth allowedRoles={['client']}><ClientCompte /></RequireAuth>} />
      <Route path="/client/messages"  element={<RequireAuth allowedRoles={['client']}><ClientMessagerie /></RequireAuth>} />
      <Route path="/client/mes-signalements" element={<RequireAuth allowedRoles={['client']}><ClientMesSignalements /></RequireAuth>} />
      <Route path="/client/tickets" element={<RequireAuth allowedRoles={['client']}><ClientMesTickets /></RequireAuth>} />
      <Route path="/client/missions/:missionId/rapport" element={<RequireAuth allowedRoles={['client']}><AirbnbReportView /></RequireAuth>} />
      <Route path="/client/missions/:missionId/audit" element={<RequireAuth allowedRoles={['client']}><AuditReportView /></RequireAuth>} />
      <Route path="/client/paiements" element={<RequireAuth allowedRoles={['client']}><ClientPaiements /></RequireAuth>} />

      {/* Retour PayZone — successUrl/failureUrl/cancelUrl construites côté backend (src/services/payzone.js) */}
      <Route path="/payment/return" element={<RequireAuth allowedRoles={['client']}><PaymentReturn /></RequireAuth>} />

      {/* Oeil */}
      <Route path="/oeil"           element={<RequireAuth allowedRoles={['oeil']}><OeilDashboard /></RequireAuth>} />
      <Route path="/oeil/missions"  element={<RequireAuth allowedRoles={['oeil']}><OeilMissions /></RequireAuth>} />
     <Route path="/oeil/compte"    element={<RequireAuth allowedRoles={['oeil']}><OeilCompte /></RequireAuth>} />
      <Route path="/oeil/messages"  element={<RequireAuth allowedRoles={['oeil']}><OeilMessagerie /></RequireAuth>} />
      <Route path="/oeil/mes-signalements" element={<RequireAuth allowedRoles={['oeil']}><OeilMesSignalements /></RequireAuth>} />
      <Route path="/oeil/tickets" element={<RequireAuth allowedRoles={['oeil']}><OeilMesTickets /></RequireAuth>} />
      <Route path="/oeil/gains" element={<RequireAuth allowedRoles={['oeil']}><OeilGains /></RequireAuth>} />
      <Route path="/oeil/missions/:missionId/audit" element={<RequireAuth allowedRoles={['oeil']}><AuditReport /></RequireAuth>} />
      <Route path="/oeil/missions/:missionId/rapport" element={<RequireAuth allowedRoles={['oeil']}><AirbnbReport /></RequireAuth>} />
      <Route path="/oeil/verification-identite" element={<RequireAuth allowedRoles={['oeil']}><VerificationIdentite /></RequireAuth>} />
      <Route path="/oeil/suspendu" element={<RequireAuth allowedRoles={['oeil']}><CompteSuspendu /></RequireAuth>} />

      {/* Admin */}
      {/* /admin (dash) volontairement sans requiredPermission : c'est la cible de repli de
          RequireAuth pour le rôle admin (voir routes[user.role] ci-dessus) — la gater sur
          'dash' créerait une boucle de redirection pour un admin sans cette permission. */}
      <Route path="/admin"              element={<RequireAuth allowedRoles={['admin']}><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/missions"     element={<RequireAuth allowedRoles={['admin']} requiredPermission="missions"><AdminMissions /></RequireAuth>} />
      <Route path="/admin/oeils"        element={<RequireAuth allowedRoles={['admin']} requiredPermission="users"><AdminOeils /></RequireAuth>} />
      <Route path="/admin/clients"      element={<RequireAuth allowedRoles={['admin']} requiredPermission="users"><AdminClients /></RequireAuth>} />
      <Route path="/admin/fraude"       element={<RequireAuth allowedRoles={['admin']} requiredPermission="moderation"><AdminFraude /></RequireAuth>} />
      <Route path="/admin/reclamations" element={<RequireAuth allowedRoles={['admin']} requiredPermission="claims"><AdminReclamations /></RequireAuth>} />
      <Route path="/admin/messages-suspects" element={<RequireAuth allowedRoles={['admin']} requiredPermission="moderation"><AdminMessagesSuspects /></RequireAuth>} />
      <Route path="/admin/parametres"   element={<RequireAuth allowedRoles={['admin']} requiredPermission="settings"><AdminParametres /></RequireAuth>} />
      <Route path="/admin/promos" element={<RequireAuth allowedRoles={['admin']} requiredPermission="finance"><AdminPromos /></RequireAuth>} />
      <Route path="/admin/admins" element={<RequireAuth allowedRoles={['admin']}><AdminGestion /></RequireAuth>} />
      <Route path="/admin/fiabilite" element={<RequireAuth allowedRoles={['admin']} requiredPermission="identity"><AdminFiabilite /></RequireAuth>} />
      <Route path="/admin/problemes" element={<RequireAuth allowedRoles={['admin']} requiredPermission="moderation"><AdminProblemes /></RequireAuth>} />
      <Route path="/admin/tickets" element={<RequireAuth allowedRoles={['admin']} requiredPermission="moderation"><AdminTickets /></RequireAuth>} />
      <Route path="/admin/finance" element={<RequireAuth allowedRoles={['admin']} requiredPermission="finance"><AdminFinance /></RequireAuth>} />
      <Route path="/admin/wallet-reconciliation" element={<RequireAuth allowedRoles={['admin']} requiredPermission="finance"><AdminWalletReconciliation /></RequireAuth>} />
      <Route path="/admin/clients-suspendus" element={<RequireAuth allowedRoles={['admin']} requiredPermission="users"><AdminClientsSuspendus /></RequireAuth>} />
      <Route path="/admin/missions-proches-validation" element={<RequireAuth allowedRoles={['admin']} requiredPermission="missions"><AdminMissionsProchesValidation /></RequireAuth>} />
      <Route path="/admin/users/:userId" element={<RequireAuth allowedRoles={['admin']}><UserProfile /></RequireAuth>} />


      <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
      </Suspense>
    </>
  )
}