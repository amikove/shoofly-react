import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../api'
import LanguageToggle from '../ui/LanguageToggle'
import { phoneErrorKey, phonePlaceholder } from '../../utils/phoneErrors'

// Décision BOSS Q6 (2026-09-28) — compte client ou Œil existant SANS numéro de téléphone : écran
// obligatoire avant tout accès à l'application (affiché par RequireAuth, App.jsx). Mêmes règles
// qu'à l'inscription selon le rôle — le serveur (PUT /auth/me) normalise, vérifie le format et
// l'unicité ; les refus sont traduits FR/AR. Une fois le numéro enregistré, l'utilisateur mis à
// jour débloque l'application sans rechargement. Comptes admin non concernés.
export default function AddPhoneScreen() {
  const { t } = useTranslation()
  const { user, updateUser, logout } = useAuth()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (!phone.trim()) { setError(t('phone.errors.required')); return }
    setSaving(true); setError('')
    try {
      const { data } = await authAPI.update({ phone })
      const fresh = { ...user, ...data.user }
      try { localStorage.setItem('shoofly_user', JSON.stringify(fresh)) } catch { /* stockage indisponible : l'état en mémoire suffit */ }
      updateUser(data.user)
    } catch (err) {
      const key = phoneErrorKey(err.response?.data?.code, user?.role)
      setError(key ? t(key) : (err.response?.data?.error || t('phone.gate.genericError')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-sm">
        <div className="flex justify-end mb-2"><LanguageToggle /></div>
        <div className="text-3xl mb-2">📱</div>
        <h1 className="text-lg font-bold mb-1">{t('phone.gate.title')}</h1>
        <p className="text-sm text-[#AAA] mb-4 break-words">{t(user?.role === 'oeil' ? 'phone.gate.introOeil' : 'phone.gate.introClient')}</p>
        <form onSubmit={submit}>
          <label className="label" htmlFor="add-phone">{t('phone.gate.label')}</label>
          <input id="add-phone" className="input" type="tel" autoComplete="tel" dir="ltr" value={phone}
            onChange={(e) => setPhone(e.target.value)} placeholder={phonePlaceholder(user?.role)} />
          <p className="text-[11px] text-[#AAA] mt-1.5 break-words">{t('phone.help')}</p>
          {error && <p className="text-xs text-red-400 mt-3 break-words">{error}</p>}
          <button type="submit" disabled={saving} className="btn btn-primary w-full justify-center mt-4 disabled:opacity-50">
            {saving ? t('phone.gate.saving') : t('phone.gate.submit')}
          </button>
        </form>
        <button type="button" onClick={logout} className="text-xs text-[#AAA] underline mt-4 w-full text-center">
          {t('phone.gate.logout')}
        </button>
      </div>
    </div>
  )
}
