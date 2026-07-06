import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { captureAcquisitionParams } from '../../utils/acquisitionTracking'
import LanguageToggle from '../../components/ui/LanguageToggle'

const ROLES = [
  { id: 'client', icon: '👤', labelKey: 'login.roles.client' },
  { id: 'oeil',   icon: '👁️', labelKey: 'login.roles.oeil'    },
  { id: 'admin',  icon: '⚙️', labelKey: 'login.roles.admin'  },
]

const DEMO = {
  client: { email: 'karim@gmail.com',    pw: 'client123' },
  oeil:   { email: 'yassine@gmail.com',  pw: 'oeil123'   },
  admin:  { email: 'admin@shoofly.ma',   pw: 'admin123'  },
}

export default function Login() {
  const { t } = useTranslation()
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
      setError(err.response?.data?.error || t('login.errorDefault'))
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
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <div className="font-display font-bold text-2xl tracking-tight">
              SHOOF<span className="text-[#FF4D00]">LY</span>
            </div>
            <LanguageToggle />
          </div>
          <p className="text-sm text-[#AAA] mb-7">{t('login.subtitle')}</p>

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
                <span>{t(r.labelKey)}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">{t('login.emailLabel')}</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                required
              />
            </div>
            <div>
              <label className="label">{t('login.passwordLabel')}</label>
              <input
                type="password"
                className="input"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
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
              {loading ? t('login.submitLoading') : t('login.submitButton')}
            </button>
          </form>

          <div className="border-t border-white/10 mt-6 pt-4 flex flex-col gap-2">
            <Link to="/register" className="text-xs text-center text-[#AAA]">
              {t('login.noAccount')} <span className="text-[#FF4D00]">{t('login.registerLink')}</span>
            </Link>
            <Link to="/" className="text-xs text-center text-[#555] hover:text-[#AAA]">
              {t('login.backHome')}
            </Link>
          </div>

          {/* Demo hint */}
          <div className="mt-4 p-3 bg-[#222] rounded-lg text-[11px] text-[#AAA] leading-relaxed">
            <strong className="text-white block mb-1">{t('login.demo.title')}</strong>
            {t('login.demo.client', { email: DEMO.client.email, pw: DEMO.client.pw })}<br/>
            {t('login.demo.oeil', { email: DEMO.oeil.email, pw: DEMO.oeil.pw })}<br/>
            {t('login.demo.admin', { email: DEMO.admin.email, pw: DEMO.admin.pw })}
          </div>
        </div>
      </div>
    </div>
  )
}
