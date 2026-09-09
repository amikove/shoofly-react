import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { blockAppealsAPI } from '../api'
import { Spinner, toast } from '../components/ui'
import LanguageToggle from '../components/ui/LanguageToggle'
import { CASABLANCA_TZ } from '../utils/casablancaTime'

// Écran de recours pour un compte is_active=false — chantier L4 (2026-09-09). Standalone
// (comme Login.jsx) : un compte bloqué n'a accès à aucune route de l'espace normal, donc pas
// d'AppLayout (sa nav et ses sondages échoueraient tous en 403). Pendant du CompteSuspendu.jsx
// (Œil is_suspended), mais pour un verrou plus dur et deux niveaux de canal selon le contexte.

const FMT_DATE = (d) => new Date(d).toLocaleDateString('fr-FR', { timeZone: CASABLANCA_TZ })

export default function CompteBloque() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  const [appeals, setAppeals] = useState(null)   // null = pas encore chargé
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const ctx = user?.deactivation_context || null
  // 'fraud_block' (ou contexte inconnu = blocage antérieur au chantier) → canal minimal :
  // une seule contestation, jamais rouvrable. Sinon → canal complet (re-soumissible).
  const isFraud = ctx === 'fraud_block' || ctx == null
  const isFull = ctx === 'admin_toggle' || ctx === 'noshow_strikes'

  // Pas de setLoading(true) ici : l'état initial est déjà true et l'appel post-soumission n'a
  // pas besoin de re-basculer sur le spinner (même approche que CompteSuspendu.jsx).
  const load = () => {
    blockAppealsAPI.mine()
      .then(({ data }) => setAppeals(data.appeals || []))
      .catch(() => toast(t('compteBloque.loadingError'), 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  // Réactivé entre-temps (décision admin) → on quitte l'écran.
  if (user && user.is_active !== false) {
    return <Navigate to={`/${user.role || 'client'}`} replace />
  }

  const hasPending = (appeals || []).some(a => a.status === 'pending')
  const hasAny = (appeals || []).length > 0
  // Canal minimal : formulaire visible seulement si AUCUNE contestation déposée.
  // Canal complet : visible tant qu'aucune n'est 'pending'.
  const canSubmit = isFull ? !hasPending : !hasAny

  const submit = async () => {
    if (message.trim().length < 10) { toast(t('compteBloque.messageTooShortError'), 'error'); return }
    setSubmitting(true)
    try {
      await blockAppealsAPI.create({ message })
      setMessage('')
      toast(t('compteBloque.requestSentToast'), 'success')
      load()
    } catch (err) {
      toast(err.response?.data?.error || t('compteBloque.genericError'), 'error')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg">

        <div className="flex items-center justify-between mb-6">
          <div className="font-display font-bold text-2xl tracking-tight">
            SHOOF<span className="text-[#FF4D00]">LY</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <button onClick={logout} className="text-[#AAA] hover:text-white text-xs px-2.5 py-1.5 rounded border border-white/12 hover:border-white/22 transition-all">
              {t('compteBloque.logout')}
            </button>
          </div>
        </div>

        {/* Bandeau motif */}
        <div className={`card mb-5 border ${isFraud ? 'border-red-500/40' : 'border-orange-500/30'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isFraud ? 'bg-red-500/10' : 'bg-orange-500/10'}`}>
              {isFraud ? '🚫' : '🔒'}
            </div>
            <div>
              <p className="font-bold text-base">{isFraud ? t('compteBloque.fraudHeading') : t('compteBloque.clientHeading')}</p>
              <p className="text-xs text-[#AAA]">{isFraud ? t('compteBloque.fraudSubtitle') : t('compteBloque.clientSubtitle')}</p>
            </div>
          </div>
          <div className="bg-[#222] rounded-xl p-3">
            <p className="text-xs text-white/80">
              {isFraud ? t('compteBloque.fraudBody') : t('compteBloque.clientBody')}
            </p>
          </div>
        </div>

        {loading && <div className="flex justify-center py-8"><Spinner size="lg" /></div>}

        {!loading && (
          <>
            {/* Contestations précédentes + réponses admin */}
            {hasAny && (
              <div className="card mb-5">
                <p className="font-semibold text-sm mb-3">{t('compteBloque.previousAppeals')}</p>
                <div className="space-y-3">
                  {appeals.map((a) => (
                    <div key={a.id} className={`rounded-xl p-3 border ${
                      a.status === 'approved' ? 'bg-green-500/5 border-green-500/20' :
                      a.status === 'rejected' ? 'bg-red-500/5 border-red-500/20' :
                      'bg-[#222] border-white/10'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`badge ${a.status === 'approved' ? 'badge-green' : a.status === 'rejected' ? 'badge-red' : 'badge-yellow'}`}>
                          {t(`compteBloque.status.${a.status}`)}
                        </span>
                        <span className="text-[10px] text-[#555]">{FMT_DATE(a.created_at)}</span>
                      </div>
                      <p className="text-xs text-[#AAA] mb-2">{t('compteBloque.yourMessage', { message: a.message })}</p>
                      {a.admin_response && (
                        <div className="bg-[#181818] rounded-lg p-2.5 mt-2">
                          <p className="text-[10px] text-[#777] mb-1">{t('compteBloque.teamResponseLabel')}</p>
                          <p className="text-xs text-white/80">{a.admin_response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formulaire / états terminaux */}
            {hasPending ? (
              <div className="card text-center py-8">
                <div className="text-3xl mb-2">📨</div>
                <p className="font-semibold text-sm">{t('compteBloque.inProgressTitle')}</p>
                <p className="text-xs text-[#AAA] mt-1">{t('compteBloque.inProgressDesc')}</p>
              </div>
            ) : canSubmit ? (
              <div className="card">
                <p className="font-semibold text-sm mb-2">{t('compteBloque.appealTitle')}</p>
                <p className="text-xs text-[#AAA] mb-3">
                  {isFraud ? t('compteBloque.appealDescFraud') : t('compteBloque.appealDescClient')}
                </p>
                <textarea
                  className="input resize-none h-28 w-full text-sm"
                  placeholder={t('compteBloque.messagePlaceholder')}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
                <button
                  onClick={submit}
                  disabled={submitting || message.trim().length < 10}
                  className="btn btn-primary w-full justify-center mt-3 disabled:opacity-50"
                >
                  {submitting ? t('compteBloque.sending') : t('compteBloque.submitButton')}
                </button>
              </div>
            ) : (
              /* Canal minimal, contestation déjà déposée et tranchée → plus de recours in-app */
              <div className="card text-center py-6">
                <p className="text-xs text-[#AAA]">{t('compteBloque.appealClosed')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
