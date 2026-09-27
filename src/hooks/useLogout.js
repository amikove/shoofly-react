import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Déconnexion explicite : même geste partout (barre latérale / barre admin d'AppLayout, bas de la
// page Compte client et Œil) — vide la session puis renvoie vers /login.
export function useLogout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return () => { logout(); navigate('/login') }
}
