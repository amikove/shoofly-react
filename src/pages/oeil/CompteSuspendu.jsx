import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { reliabilityAPI } from '../../api'
import { Spinner, toast } from '../../components/ui'

export default function CompteSuspendu() {
  const { t } = useTranslation()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)


  const load = () => {
    reliabilityAPI.me()
      .then(({ data: d }) => setData(d))
      .catch(() => toast(t('compteSuspendu.loadingError'), 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const submit = async () => {
    if (message.trim().length < 10) { toast(t('compteSuspendu.messageTooShortError'), 'error'); return }
    setSubmitting(true)
    try {
      await reliabilityAPI.requestReview({ message })
      load()
      setMessage('')
      toast(t('compteSuspendu.requestSentToast'), 'success')
    } catch (err) {
      toast(err.response?.data?.error || t('compteSuspendu.genericError'), 'error')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <AppLayout>
      <Topbar title={t('compteSuspendu.title')} />
      <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <Topbar title={t('compteSuspendu.title')} />
      <div className="p-4 md:p-6 max-w-lg mx-auto">

        <div className="card mb-6 border border-red-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-2xl">🔴</div>
            <div>
              <p className="font-bold text-base">{t('compteSuspendu.heading')}</p>
              <p className="text-xs text-[#AAA]">{t('compteSuspendu.reliabilityScore', { score: data?.score })}</p>
            </div>
          </div>
          <div className="bg-[#222] rounded-xl p-3">
            <p className="text-xs text-[#AAA]">
              {t('compteSuspendu.scoreBelowThreshold')}
              {data?.suspended_at && ` ${t('compteSuspendu.suspendedSince', { date: new Date(data.suspended_at).toLocaleDateString('fr-FR') })}`}
            </p>
          </div>
        </div>

        {/* Historique détaillé */}
        <div className="card mb-6">
          <p className="font-semibold text-sm mb-3">{t('compteSuspendu.historySummary')}</p>
          {data?.events?.length === 0 ? (
            <p className="text-xs text-[#555] text-center py-4">{t('compteSuspendu.noEvents')}</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data?.events?.map((e, i) => (
                <div key={i} className={`flex items-start justify-between gap-3 p-2.5 rounded-xl ${
                  e.is_grave ? 'bg-red-500/5 border border-red-500/10' : 'bg-[#222]'
                }`}>
                  <div>
                    <p className="text-xs text-white/80">{e.reason}</p>
                    <p className="text-[10px] text-[#555] mt-0.5">{new Date(e.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap ${e.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {t('compteSuspendu.pointsValue', { value: `${e.points >= 0 ? '+' : ''}${e.points}` })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demandes précédentes avec réponses admin */}
        {data?.review_requests?.length > 0 && (
          <div className="card mb-6">
            <p className="font-semibold text-sm mb-3">{t('compteSuspendu.previousRequests')}</p>
            <div className="space-y-3">
              {data.review_requests.map((r) => (
                <div key={r.id} className={`rounded-xl p-3 border ${
                  r.status === 'approved' ? 'bg-green-500/5 border-green-500/20' :
                  r.status === 'rejected' ? 'bg-red-500/5 border-red-500/20' :
                  'bg-[#222] border-white/10'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`badge ${r.status === 'approved' ? 'badge-green' : r.status === 'rejected' ? 'badge-red' : 'badge-yellow'}`}>
                      {r.status === 'approved' ? t('compteSuspendu.status.approved') : r.status === 'rejected' ? t('compteSuspendu.status.rejected') : t('compteSuspendu.status.pending')}
                    </span>
                    <span className="text-[10px] text-[#555]">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="text-xs text-[#AAA] mb-2">{t('compteSuspendu.yourMessage', { message: r.message })}</p>
                  {r.admin_response && (
                    <div className="bg-[#181818] rounded-lg p-2.5 mt-2">
                      <p className="text-[10px] text-[#777] mb-1">{t('compteSuspendu.teamResponseLabel')}</p>
                      <p className="text-xs text-white/80">{r.admin_response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demande d'examen */}
        {data?.review_requests?.some(r => r.status === 'pending') ? (
          <div className="card text-center py-8">
            <div className="text-3xl mb-2">📨</div>
            <p className="font-semibold text-sm">{t('compteSuspendu.reviewInProgressTitle')}</p>
            <p className="text-xs text-[#AAA] mt-1">{t('compteSuspendu.reviewInProgressDesc')}</p>
          </div>
        ) : data?.is_suspended ? (
          <div className="card">
            <p className="font-semibold text-sm mb-2">{t('compteSuspendu.requestReviewTitle')}</p>
            <p className="text-xs text-[#AAA] mb-3">{t('compteSuspendu.requestReviewDesc')}</p>
            <textarea
              className="input resize-none h-28 w-full text-sm"
              placeholder={t('compteSuspendu.messagePlaceholder')}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            <button
              onClick={submit}
              disabled={submitting || message.trim().length < 10}
              className="btn btn-primary w-full justify-center mt-3 disabled:opacity-50"
            >
              {submitting ? t('compteSuspendu.sending') : t('compteSuspendu.submitButton')}
            </button>
          </div>
        ) : null}
      </div>
    </AppLayout>
  )
}