import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { paymentsAPI } from '../../api'
import { Spinner, EmptyState, toast } from '../../components/ui'
import { redirectToPaywall } from '../../utils/payzone'

const STATUS_VARIANT = {
  created:  'text-[#AAA]',
  declined: 'text-red-400',
  error:    'text-red-400',
}

export default function Paiements() {
  const { t } = useTranslation()
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [retryingId, setRetryingId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    paymentsAPI.failedAttempts()
      .then(({ data }) => setAttempts(data.attempts || []))
      .catch(() => toast(t('paiements.loadError'), 'error'))
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => { load() }, [load])

  const retry = async (attemptId) => {
    setRetryingId(attemptId)
    try {
      const { data } = await paymentsAPI.retry(attemptId)
      redirectToPaywall(data.paywallUrl, data.payload, data.signature)
      // Pas de reset ici : la page va être remplacée par la redirection vers le paywall PayZone.
    } catch (err) {
      toast(err.response?.data?.error || t('paiements.retryError'), 'error')
      setRetryingId(null)
    }
  }

  return (
    <AppLayout>
      <Topbar title={t('paiements.title')} />
      <div className="p-4 md:p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : attempts.length === 0 ? (
          <EmptyState icon="💳" title={t('paiements.emptyTitle')} description={t('paiements.emptyDesc')} />
        ) : (
          <div className="space-y-3">
            {attempts.map((a) => (
              <div key={a.attempt_id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{a.title}</div>
                    <div className="text-xs text-[#AAA] mt-0.5">
                      {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <span className="text-green-400 font-semibold text-sm">{parseFloat(a.price).toFixed(0)} MAD</span>
                    <span className={`text-xs font-semibold ${STATUS_VARIANT[a.status] || 'text-[#AAA]'}`}>
                      {t(`paiements.status.${a.status}`, a.status)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => retry(a.attempt_id)}
                  disabled={retryingId === a.attempt_id}
                  className="btn btn-primary btn-sm w-full justify-center mt-3 disabled:opacity-60"
                >
                  {retryingId === a.attempt_id ? t('paiements.retrying') : t('paiements.retryButton')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
