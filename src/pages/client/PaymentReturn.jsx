import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { paymentsAPI } from '../../api'
import { Spinner, toast } from '../../components/ui'
import { useNotif } from '../../context/NotifContext'

const POLL_INTERVAL_MS = 3000
const MAX_ATTEMPTS = 30

// La redirection du navigateur vers cette page (via successUrl/failureUrl/cancelUrl) n'est jamais
// une preuve de paiement — seul le statut renvoyé par GET /payments/payzone/status fait foi, le
// webhook serveur-à-serveur PayZone pouvant arriver après la redirection du client.
export default function PaymentReturn() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setPending } = useNotif()
  const attemptId = searchParams.get('attemptId')
  // Indice UX uniquement : sert à adapter le message affiché pendant l'attente, jamais à
  // décider du résultat du paiement — voir le commentaire au-dessus du composant.
  const isCancelHint = searchParams.get('result') === 'cancel'

  const [phase, setPhase] = useState('polling') // polling | charged | declined | error | timeout | invalid
  const [result, setResult] = useState(null)
  const [rechecking, setRechecking] = useState(false)

  useEffect(() => {
    if (!attemptId) { setPhase('invalid'); return }

    let attempts = 0
    let intervalId

    const tick = () => {
      attempts += 1
      paymentsAPI.status(attemptId)
        .then(({ data }) => {
          if (data.status === 'charged' || data.status === 'declined' || data.status === 'error') {
            clearInterval(intervalId)
            setResult(data)
            setPhase(data.status)
          } else if (attempts >= MAX_ATTEMPTS) {
            clearInterval(intervalId)
            setPhase('timeout')
          }
          // status === 'created' : on continue le polling
        })
        .catch((err) => {
          // 403/404 = tentative introuvable ou n'appartenant pas à ce client : pas la peine de réessayer.
          if (err.response?.status === 403 || err.response?.status === 404) {
            clearInterval(intervalId)
            setPhase('invalid')
          } else if (attempts >= MAX_ATTEMPTS) {
            clearInterval(intervalId)
            setPhase('timeout')
          }
        })
    }

    tick()
    intervalId = setInterval(tick, POLL_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [attemptId])

  const viewMission = () => {
    setPending('mission_detail', result.missionId)
    navigate('/client/missions')
  }

  // Re-vérification manuelle depuis l'état "timeout" : le webhook PayZone peut arriver après
  // la fenêtre de polling (90s) sans que ça veuille dire que le paiement a échoué — seul un
  // nouvel appel à /status fait foi, jamais une supposition basée sur l'attente écoulée.
  const recheck = () => {
    if (!attemptId || rechecking) return
    setRechecking(true)
    paymentsAPI.status(attemptId)
      .then(({ data }) => {
        if (data.status === 'charged' || data.status === 'declined' || data.status === 'error') {
          setResult(data)
          setPhase(data.status)
        } else {
          toast(t('paymentReturn.timeout.stillPending'), 'info')
        }
      })
      .catch(() => toast(t('paymentReturn.timeout.recheckError'), 'error'))
      .finally(() => setRechecking(false))
  }

  return (
    <AppLayout>
      <Topbar title={t('paymentReturn.title')} />
      <div className="p-4 md:p-6 flex justify-center">
        <div className="card max-w-md w-full text-center py-10">

          {phase === 'polling' && (
            <>
              <div className="flex justify-center mb-4"><Spinner size="lg" /></div>
              <h2 className="font-bold text-base mb-2">
                {t(isCancelHint ? 'paymentReturn.polling.cancelledTitle' : 'paymentReturn.polling.title')}
              </h2>
              <p className="text-sm text-[#AAA]">
                {t(isCancelHint ? 'paymentReturn.polling.cancelledMessage' : 'paymentReturn.polling.message')}
              </p>
            </>
          )}

          {phase === 'charged' && (
            <>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-2xl mx-auto mb-4">✅</div>
              <h2 className="font-bold text-base mb-2">{t('paymentReturn.success.title')}</h2>
              <p className="text-sm text-[#AAA] mb-5">{t('paymentReturn.success.message')}</p>
              <button onClick={viewMission} className="btn btn-primary w-full justify-center">
                {t('paymentReturn.success.button')}
              </button>
            </>
          )}

          {isCancelHint && (phase === 'declined' || phase === 'error') && (
            <>
              <div className="w-12 h-12 rounded-xl bg-gray-500/10 flex items-center justify-center text-2xl mx-auto mb-4">🚫</div>
              <h2 className="font-bold text-base mb-2">{t('paymentReturn.cancelled.title')}</h2>
              <p className="text-sm text-[#AAA] mb-5">{t('paymentReturn.cancelled.message')}</p>
              <button onClick={() => navigate('/client/paiements')} className="btn btn-primary w-full justify-center">
                {t('paymentReturn.cancelled.button')}
              </button>
            </>
          )}

          {!isCancelHint && (phase === 'declined' || phase === 'error') && (
            <>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-2xl mx-auto mb-4">❌</div>
              <h2 className="font-bold text-base mb-2">{t(`paymentReturn.failure.${phase}Title`)}</h2>
              <p className="text-sm text-[#AAA] mb-5">{t(`paymentReturn.failure.${phase}Message`)}</p>
              <button onClick={() => navigate('/client/paiements')} className="btn btn-primary w-full justify-center">
                {t('paymentReturn.failure.button')}
              </button>
            </>
          )}

          {/* Statut jamais confirmé après 90s de polling — le webhook peut encore arriver,
              ne jamais affirmer qu'aucune mission n'a été créée. S'applique que le client ait
              ou non tenté d'annuler côté PayZone (isCancelHint) : dans les deux cas la vraie
              réponse serveur reste inconnue à ce stade. */}
          {phase === 'timeout' && (
            <>
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-2xl mx-auto mb-4">⏳</div>
              <h2 className="font-bold text-base mb-2">{t('paymentReturn.timeout.title')}</h2>
              <p className="text-sm text-[#AAA] mb-5">{t('paymentReturn.timeout.message')}</p>
              <div className="flex flex-col gap-2">
                <button onClick={recheck} disabled={rechecking} className="btn btn-primary w-full justify-center disabled:opacity-50">
                  {rechecking ? '...' : t('paymentReturn.timeout.recheckButton')}
                </button>
                <button onClick={() => navigate('/client/missions')} className="btn btn-ghost w-full justify-center">
                  {t('paymentReturn.timeout.missionsButton')}
                </button>
                <button onClick={() => navigate('/client/paiements')} className="btn btn-ghost w-full justify-center">
                  {t('paymentReturn.timeout.button')}
                </button>
              </div>
            </>
          )}

          {phase === 'invalid' && (
            <>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-2xl mx-auto mb-4">⚠️</div>
              <h2 className="font-bold text-base mb-2">{t('paymentReturn.invalid.title')}</h2>
              <p className="text-sm text-[#AAA] mb-5">{t('paymentReturn.invalid.message')}</p>
              <button onClick={() => navigate('/client')} className="btn btn-primary w-full justify-center">
                {t('paymentReturn.invalid.button')}
              </button>
            </>
          )}

        </div>
      </div>
    </AppLayout>
  )
}
