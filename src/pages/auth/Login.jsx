import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { captureAcquisitionParams } from '../../utils/acquisitionTracking'

const ROLES = [
  { id: 'client', icon: '👤', label: 'Client' },
  { id: 'oeil',   icon: '👁️', label: 'Œil'    },
  { id: 'admin',  icon: '⚙️', label: 'Admin'  },
]

const DEMO = {
  client: { email: 'karim@gmail.com',    pw: 'client123' },
  oeil:   { email: 'yassine@gmail.com',  pw: 'oeil123'   },
  admin:  { email: 'admin@shoofly.ma',   pw: 'admin123'  },
}

export default function Login() {
  useEffect(() => { captureAcquisitionParams() }, [])
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [role, setRole]     = useState('client')
  const [email, setEmail]   = useState('karim@gmail.com')
  const [pwd, setPwd]       = useState('client123')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const selectRole = (r) => {
    setRole(r)
    setEmail(DEMO[r].email)
    setPwd(DEMO[r].pw)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email.trim().toLowerCase(), pwd)
      const routes = { client: '/client', oeil: '/oeil', admin: '/admin' }
      navigate(routes[user.role] || '/client')
    } catch (err) {
      setError(err.response?.data?.error || 'Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF4D00]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-[400px] mx-4">
        <div className="bg-[#181818] border border-white/20 rounded-2xl p-9">
          {/* Logo */}
          <div className="font-display font-bold text-2xl tracking-tight mb-0.5">
            SHOOF<span className="text-[#FF4D00]">LY</span>
          </div>
          <p className="text-sm text-[#AAA] mb-7">Connectez-vous à votre espace</p>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => selectRole(r.id)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold border transition-all ${
                  role === r.id
                    ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-white'
                    : 'border-white/12 bg-[#222] text-[#AAA] hover:border-white/22'
                }`}
              >
                <span className="text-xl">{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@email.com"
                required
              />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input
                type="password"
                className="input"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full justify-center mt-2 disabled:opacity-60"
            >
              {loading ? 'Connexion...' : 'Se connecter →'}
            </button>
          </form>

          <div className="border-t border-white/10 mt-6 pt-4 flex flex-col gap-2">
            <Link to="/register" className="text-xs text-center text-[#AAA]">
              Pas encore de compte ? <span className="text-[#FF4D00]">S'inscrire</span>
            </Link>
            <Link to="/" className="text-xs text-center text-[#555] hover:text-[#AAA]">
              ← Retour à l'accueil
            </Link>
          </div>

          {/* Demo hint */}
          <div className="mt-4 p-3 bg-[#222] rounded-lg text-[11px] text-[#AAA] leading-relaxed">
            <strong className="text-white block mb-1">Comptes démo :</strong>
            Client → karim@gmail.com / client123<br/>
            Œil → yassine@gmail.com / oeil123<br/>
            Admin → admin@shoofly.ma / admin123
          </div>
        </div>
      </div>
    </div>
  )
}
