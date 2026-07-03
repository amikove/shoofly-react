import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Spinner } from './components/ui'
import VerificationIdentite from './pages/oeil/VerificationIdentite'




// Auth pages
import Login    from './pages/auth/Login'
import Register from './pages/auth/Register'
import Landing from './pages/Landing'
import Confidentialite from './pages/legal/Confidentialite'
import CGV from './pages/legal/CGV'
import Verification from './pages/legal/Verification'

// Client pages
import ClientDashboard  from './pages/client/Dashboard'
import ClientMissions   from './pages/client/Missions'
import ClientOeils      from './pages/client/Oeils'
import ClientCompte     from './pages/client/Compte'
import AirbnbReportView from './pages/client/AirbnbReportView'
import AuditReportView from './pages/client/AuditReportView'
import ClientMessagerie from './pages/shared/Messagerie'
import ClientMesSignalements from './pages/shared/MesSignalements'

// Oeil pages
import OeilDashboard from './pages/oeil/Dashboard'
import OeilMissions  from './pages/oeil/Missions'
import OeilCompte    from './pages/oeil/Compte'
import AirbnbReport  from './pages/oeil/AirbnbReport'
import AuditReport from './pages/oeil/AuditReport'
import OeilMessagerie from './pages/shared/Messagerie'
import OeilMesSignalements from './pages/shared/MesSignalements'




// Admin pages
import AdminDashboard  from './pages/admin/Dashboard'
import AdminMissions   from './pages/admin/Missions'
import AdminOeils      from './pages/admin/Oeils'
import AdminClients    from './pages/admin/Clients'
import AdminFraude     from './pages/admin/Fraude'
import AdminReclamations from './pages/admin/Reclamations'
import AdminMessagesSuspects from './pages/admin/MessagesSuspects'
import AdminParametres from './pages/admin/Parametres'
import AdminPromos from './pages/admin/AdminPromos'
import AdminGestion from './pages/admin/AdminGestion'
import CompteSuspendu from './pages/oeil/CompteSuspendu'
import AdminFiabilite from './pages/admin/AdminFiabilite'
import AdminProblemes from './pages/admin/AdminProblemes'


// Route guard
function RequireAuth({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const routes = { client: '/client', oeil: '/oeil', admin: '/admin' }
    return <Navigate to={routes[user.role] || '/login'} replace />
  }
  return children
}

export default function App() {
  const { user, loading } = useAuth()

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
    <Routes>
      {/* Public */}

      <Route path="/confidentialite" element={<Confidentialite />} />
      <Route path="/cgv" element={<CGV />} />
      <Route path="/verification" element={<Verification />} />
    
      <Route path="/" element={user ? <Navigate to={`/${user.role}`} replace /> : <Landing />} />
      <Route path="/login"    element={user ? <Navigate to={`/${user.role}`} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={`/${user.role}`} /> : <Register />} />

      {/* Client */}
      <Route path="/client" element={<RequireAuth allowedRoles={['client']}><ClientDashboard /></RequireAuth>} />
      <Route path="/client/missions" element={<RequireAuth allowedRoles={['client']}><ClientMissions /></RequireAuth>} />
      <Route path="/client/oeils"    element={<RequireAuth allowedRoles={['client']}><ClientOeils /></RequireAuth>} />
      <Route path="/client/compte"    element={<RequireAuth allowedRoles={['client']}><ClientCompte /></RequireAuth>} />
      <Route path="/client/messages"  element={<RequireAuth allowedRoles={['client']}><ClientMessagerie /></RequireAuth>} />
      <Route path="/client/mes-signalements" element={<RequireAuth allowedRoles={['client']}><ClientMesSignalements /></RequireAuth>} />
      <Route path="/client/missions/:missionId/rapport" element={<RequireAuth allowedRoles={['client']}><AirbnbReportView /></RequireAuth>} />
      <Route path="/client/missions/:missionId/audit" element={<RequireAuth allowedRoles={['client']}><AuditReportView /></RequireAuth>} />

      {/* Oeil */}
      <Route path="/oeil"           element={<RequireAuth allowedRoles={['oeil']}><OeilDashboard /></RequireAuth>} />
      <Route path="/oeil/missions"  element={<RequireAuth allowedRoles={['oeil']}><OeilMissions /></RequireAuth>} />
     <Route path="/oeil/compte"    element={<RequireAuth allowedRoles={['oeil']}><OeilCompte /></RequireAuth>} />
      <Route path="/oeil/messages"  element={<RequireAuth allowedRoles={['oeil']}><OeilMessagerie /></RequireAuth>} />
      <Route path="/oeil/mes-signalements" element={<RequireAuth allowedRoles={['oeil']}><OeilMesSignalements /></RequireAuth>} />
      <Route path="/oeil/missions/:missionId/audit" element={<RequireAuth allowedRoles={['oeil']}><AuditReport /></RequireAuth>} />
      <Route path="/oeil/missions/:missionId/rapport" element={<RequireAuth allowedRoles={['oeil']}><AirbnbReport /></RequireAuth>} />
      <Route path="/oeil/verification-identite" element={<RequireAuth allowedRoles={['oeil']}><VerificationIdentite /></RequireAuth>} />
      <Route path="/oeil/suspendu" element={<RequireAuth allowedRoles={['oeil']}><CompteSuspendu /></RequireAuth>} />

      {/* Admin */}
      <Route path="/admin"              element={<RequireAuth allowedRoles={['admin']}><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/missions"     element={<RequireAuth allowedRoles={['admin']}><AdminMissions /></RequireAuth>} />
      <Route path="/admin/oeils"        element={<RequireAuth allowedRoles={['admin']}><AdminOeils /></RequireAuth>} />
      <Route path="/admin/clients"      element={<RequireAuth allowedRoles={['admin']}><AdminClients /></RequireAuth>} />
      <Route path="/admin/fraude"       element={<RequireAuth allowedRoles={['admin']}><AdminFraude /></RequireAuth>} />
      <Route path="/admin/reclamations" element={<RequireAuth allowedRoles={['admin']}><AdminReclamations /></RequireAuth>} />
      <Route path="/admin/messages-suspects" element={<RequireAuth allowedRoles={['admin']}><AdminMessagesSuspects /></RequireAuth>} />
      <Route path="/admin/parametres"   element={<RequireAuth allowedRoles={['admin']}><AdminParametres /></RequireAuth>} />
      <Route path="/admin/promos" element={<RequireAuth allowedRoles={['admin']}><AdminPromos /></RequireAuth>} />
      <Route path="/admin/admins" element={<RequireAuth allowedRoles={['admin']}><AdminGestion /></RequireAuth>} />
      <Route path="/admin/fiabilite" element={<RequireAuth allowedRoles={['admin']}><AdminFiabilite /></RequireAuth>} />
      <Route path="/admin/problemes" element={<RequireAuth allowedRoles={['admin']}><AdminProblemes /></RequireAuth>} />


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
