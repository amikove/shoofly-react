import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI } from '../../api'
import { Spinner, EmptyState } from '../../components/ui'

const STATUS_LABEL_KEYS = {
  open:        { key: 'open',       variant: 'text-orange-400' },
  in_progress: { key: 'inProgress', variant: 'text-amber-400' },
  resolved:    { key: 'resolved',   variant: 'text-green-400' },
  dismissed:   { key: 'dismissed', variant: 'text-[#555]' },
}

export default function MesSignalements() {
  const { t } = useTranslation()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    missionsAPI.myReports()
      .then(({ data }) => setReports(data.reports || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      <Topbar title={t('mesSignalements.title')} />
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : reports.length === 0 ? (
          <EmptyState icon="✅" title={t('mesSignalements.emptyTitle')} description={t('mesSignalements.emptyDesc')} />
        ) : (
          <div className="space-y-4">
            {reports.map((r) => {
              const statusInfo = STATUS_LABEL_KEYS[r.status]
              const statusLabel = statusInfo ? t(`mesSignalements.status.${statusInfo.key}`) : r.status
              const statusVariant = statusInfo?.variant || 'text-[#AAA]'
              return (
                <div key={r.id} className="card">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-sm">{r.type}</p>
                      <p className="text-xs text-[#AAA] mt-0.5">📋 {r.mission_title}</p>
                    </div>
                    <span className={`text-xs font-semibold ${statusVariant}`}>{statusLabel}</span>
                  </div>

                  {r.description && (
                    <div className="bg-[#222] rounded-xl p-3 mb-3">
                      <p className="text-xs text-[#AAA] mb-1">{t('mesSignalements.yourMessage')}</p>
                      <p className="text-sm text-white/80">{r.description}</p>
                    </div>
                  )}

                  {r.admin_note && (
                    <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/20 rounded-xl p-3 mb-3">
                      <p className="text-xs text-[#FF4D00] mb-1">{t('mesSignalements.teamResponse')}</p>
                      <p className="text-sm text-white/80">{r.admin_note}</p>
                    </div>
                  )}

                  <p className="text-[10px] text-[#555]">
                    {t('mesSignalements.reportedOn', { date: new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) })}
                    {r.resolved_at && t('mesSignalements.processedOn', { date: new Date(r.resolved_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}