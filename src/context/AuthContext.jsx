import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)

  // Restaurer la session au démarrage
  useEffect(() => {
    const token = localStorage.getItem('shoofly_token')
    if (!token) { setLoading(false); return }

    authAPI.me()
        .then(({ data }) => {
          setUser({ ...data.user, ...data.profile })
        })
        .catch((err) => {
          // Ne déconnecter que si le token est vraiment invalide/expiré (401) —
          // une simple erreur réseau (coupure, changement de connexion) ne doit
          // jamais effacer la session de l'utilisateur.
          if (err.response?.status === 401) {
            localStorage.removeItem('shoofly_token')
            localStorage.removeItem('shoofly_user')
          }
        })
        .finally(() => setLoading(false))
    }, [])

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    const mergedUser = { ...data.user, ...data.profile }
    localStorage.setItem('shoofly_token', data.token)
    localStorage.setItem('shoofly_user', JSON.stringify(mergedUser))
    setUser(mergedUser)
    return mergedUser
  }

  const logout = () => {
    localStorage.removeItem('shoofly_token')
    localStorage.removeItem('shoofly_user')
    setUser(null)
  }

const updateUser = (updates) => setUser((u) => ({ ...u, ...updates }))

  const hasPermission = (permission) => {
    if (!user || user.role !== 'admin') return false
    if (user.is_super_admin) return true
    return Array.isArray(user.permissions) && user.permissions.includes(permission)
  }

  const isSuperAdmin = user?.is_super_admin || false

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, hasPermission, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
