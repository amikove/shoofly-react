import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authAPI } from '../../api'
import LanguageToggle from '../../components/ui/LanguageToggle'
import PasswordInput from '../../components/ui/PasswordInput'

const REDIRECT_DELAY_MS = 3000

export default function ResetPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Bouton "Se connecter" laissé disponible en plus de la redirection auto, pour l'utilisateur
  // qui ne veut pas attendre.
  useEffect(() => {
    if (!success) return
    const id = setTimeout(() => navigate('/login'), REDIRECT_DELAY_MS)
    return () => clearTimeout(id)
  }, [success, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    // Mêmes règles que Register.jsx (step2) : longueur minimale 6, confirmation identique.
    if (password.length < 6) { setError(t('register.errors.passwordMinLength')); return }
    if (password !== confirm) { setError(t('register.errors.passwordMismatch')); return }

    setLoading(true)
    try {
      await authAPI.resetPassword({ token, newPassword: password })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || t('resetPassword.errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF4D00]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-[400px] mx-4">
        <div className="bg-[#181818] border border-white/20 rounded-2xl p-9">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <div className="font-display font-bold text-2xl tracking-tight">
              SHOOF<span className="text-[#FF4D00]">LY</span>
            </div>
            <LanguageToggle />
          </div>
          <p className="text-sm text-[#AAA] mb-7">{t('resetPassword.subtitle')}</p>

          {!token ? (
            <>
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
                {t('resetPassword.errors.missingToken')}
              </p>
              <Link to="/forgot-password" className="btn btn-primary btn-lg w-full justify-center">
                {t('resetPassword.errors.missingTokenButton')}
              </Link>
            </>
          ) : success ? (
            <>
              <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 mb-4">
                {t('resetPassword.successMessage')}
              </p>
              <Link to="/login" className="btn btn-primary btn-lg w-full justify-center">
                {t('resetPassword.loginButton')}
              </Link>
            </>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <PasswordInput
                    label={t('resetPassword.passwordLabel')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('resetPassword.passwordPlaceholder')}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <PasswordInput
                    label={t('resetPassword.confirmLabel')}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder={t('resetPassword.confirmPlaceholder')}
                    required
                    autoComplete="new-password"
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
                  {loading ? t('resetPassword.submitLoading') : t('resetPassword.submitButton')}
                </button>
              </form>

              <div className="border-t border-white/10 mt-6 pt-4">
                <Link to="/forgot-password" className="block text-center text-xs text-[#AAA]">
                  {t('resetPassword.requestNewLinkText')} <span className="text-[#FF4D00]">{t('resetPassword.requestNewLink')}</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
