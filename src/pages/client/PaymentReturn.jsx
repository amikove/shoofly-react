import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { paymentsAPI } from '../../api'
import { Spinner } from '../../components/ui'
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

  const [phase, setPhase] = useState('polling') // polling | charged | declined | error | timeout | invalid
  const [result, setResult] = useState(null)

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

  return (
    <AppLayout>
      <Topbar title={t('paymentReturn.title')} />
      <div className="p-4 md:p-6 flex justify-center">
        <div className="card max-w-md w-full text-center py-10">

          {phase === 'polling' && (
            <>
              <div className="flex justify-center mb-4"><Spinner size="lg" /></div>
              <h2 className="font-bold text-base mb-2">{t('paymentReturn.polling.title')}</h2>
              <p className="text-sm text-[#AAA]">{t('paymentReturn.polling.message')}</p>
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

          {(phase === 'declined' || phase === 'error') && (
            <>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-2xl mx-auto mb-4">❌</div>
              <h2 className="font-bold text-base mb-2">{t(`paymentReturn.failure.${phase}Title`)}</h2>
              <p className="text-sm text-[#AAA] mb-5">{t(`paymentReturn.failure.${phase}Message`)}</p>
              <button onClick={() => navigate('/client/paiements')} className="btn btn-primary w-full justify-center">
                {t('paymentReturn.failure.button')}
              </button>
            </>
          )}

          {phase === 'timeout' && (
            <>
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-2xl mx-auto mb-4">⏳</div>
              <h2 className="font-bold text-base mb-2">{t('paymentReturn.timeout.title')}</h2>
              <p className="text-sm text-[#AAA] mb-5">{t('paymentReturn.timeout.message')}</p>
              <button onClick={() => navigate('/client/paiements')} className="btn btn-primary w-full justify-center">
                {t('paymentReturn.timeout.button')}
              </button>
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
