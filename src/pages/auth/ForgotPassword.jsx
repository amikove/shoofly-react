import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authAPI } from '../../api'
import LanguageToggle from '../../components/ui/LanguageToggle'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.forgotPassword({ email: email.trim().toLowerCase() })
    } catch {
      // Même message affiché quel que soit le résultat (succès ou erreur) : ne jamais
      // distinguer visuellement un email existant d'un email inexistant, sous peine de
      // recréer côté frontend l'oracle d'énumération que le backend évite déjà (routes/auth.js).
    } finally {
      setLoading(false)
      setSubmitted(true)
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
          <p className="text-sm text-[#AAA] mb-7">{t('forgotPassword.subtitle')}</p>

          {submitted ? (
            <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
              {t('forgotPassword.successMessage')}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">{t('forgotPassword.emailLabel')}</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg w-full justify-center mt-2 disabled:opacity-60"
              >
                {loading ? t('forgotPassword.submitLoading') : t('forgotPassword.submitButton')}
              </button>
            </form>
          )}

          <div className="border-t border-white/10 mt-6 pt-4">
            <Link to="/login" className="block text-center text-xs text-[#AAA]">
              <span className="text-[#FF4D00]">{t('forgotPassword.backToLogin')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
