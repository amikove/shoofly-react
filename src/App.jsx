import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Spinner } from './components/ui'



// Auth pages
import Login    from './pages/auth/Login'
import Register from './pages/auth/Register'

// Client pages
import ClientDashboard from './pages/client/Dashboard'
import ClientMissions  from './pages/client/Missions'
import ClientOeils     from './pages/client/Oeils'
import ClientCompte    from './pages/client/Compte'
import AirbnbReportView from './pages/client/AirbnbReportView'


// Oeil pages
import OeilDashboard from './pages/oeil/Dashboard'
import OeilMissions  from './pages/oeil/Missions'
import OeilCompte    from './pages/oeil/Compte'
import AirbnbReport from './pages/oeil/AirbnbReport'

// Admin pages
import AdminDashboard  from './pages/admin/Dashboard'
import AdminMissions   from './pages/admin/Missions'
import AdminOeils      from './pages/admin/Oeils'
import AdminClients    from './pages/admin/Clients'
import AdminFraude     from './pages/admin/Fraude'
import AdminParametres from './pages/admin/Parametres'

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
      <Route path="/login"    element={user ? <Navigate to={`/${user.role}`} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={`/${user.role}`} /> : <Register />} />

      {/* Client */}
      <Route path="/client" element={<RequireAuth allowedRoles={['client']}><ClientDashboard /></RequireAuth>} />
      <Route path="/client/missions" element={<RequireAuth allowedRoles={['client']}><ClientMissions /></RequireAuth>} />
      <Route path="/client/oeils"    element={<RequireAuth allowedRoles={['client']}><ClientOeils /></RequireAuth>} />
      <Route path="/client/compte"   element={<RequireAuth allowedRoles={['client']}><ClientCompte /></RequireAuth>} />
      <Route path="/client/missions/:missionId/rapport" element={<RequireAuth allowedRoles={['client']}><AirbnbReportView /></RequireAuth>} />

      {/* Oeil */}
      <Route path="/oeil"           element={<RequireAuth allowedRoles={['oeil']}><OeilDashboard /></RequireAuth>} />
      <Route path="/oeil/missions"  element={<RequireAuth allowedRoles={['oeil']}><OeilMissions /></RequireAuth>} />
      <Route path="/oeil/compte"    element={<RequireAuth allowedRoles={['oeil']}><OeilCompte /></RequireAuth>} />
      <Route path="/oeil/missions/:missionId/rapport" element={<RequireAuth allowedRoles={['oeil']}><AirbnbReport /></RequireAuth>} />

      {/* Admin */}
      <Route path="/admin"              element={<RequireAuth allowedRoles={['admin']}><AdminDashboard /></RequireAuth>} />
      <Route path="/admin/missions"     element={<RequireAuth allowedRoles={['admin']}><AdminMissions /></RequireAuth>} />
      <Route path="/admin/oeils"        element={<RequireAuth allowedRoles={['admin']}><AdminOeils /></RequireAuth>} />
      <Route path="/admin/clients"      element={<RequireAuth allowedRoles={['admin']}><AdminClients /></RequireAuth>} />
      <Route path="/admin/fraude"       element={<RequireAuth allowedRoles={['admin']}><AdminFraude /></RequireAuth>} />
      <Route path="/admin/parametres"   element={<RequireAuth allowedRoles={['admin']}><AdminParametres /></RequireAuth>} />

      {/* Redirect */}
      <Route path="/" element={
        user
          ? <Navigate to={`/${user.role}`} replace />
          : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
