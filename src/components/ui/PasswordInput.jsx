import { useState } from 'react'
import { useTranslation } from 'react-i18next'

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

// ── Champ mot de passe avec bascule afficher/masquer ────────
// Toujours masqué au montage — aucune persistance entre pages/sessions.
export default function PasswordInput({ label, value, onChange, placeholder, required = false, autoComplete }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          className="input pe-10"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}
          className="absolute end-0 top-0 h-full px-3 flex items-center text-[#AAA] hover:text-white transition-colors"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  )
}
