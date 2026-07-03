import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI } from '../../api'
import { Spinner, EmptyState } from '../../components/ui'

const STATUS_LABELS = {
  open:        { label: '🟠 Ouvert',       variant: 'text-orange-400' },
  in_progress: { label: '🔄 En cours',     variant: 'text-amber-400' },
  resolved:    { label: '✅ Résolu',       variant: 'text-green-400' },
  dismissed:   { label: '🙈 Classé sans suite', variant: 'text-[#555]' },
}

export default function MesSignalements() {
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
      <Topbar title="📋 Mes signalements" />
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : reports.length === 0 ? (
          <EmptyState icon="✅" title="Aucun signalement" description="Vous n'avez fait aucun signalement pour le moment." />
        ) : (
          <div className="space-y-4">
            {reports.map((r) => {
              const statusInfo = STATUS_LABELS[r.status] || { label: r.status, variant: 'text-[#AAA]' }
              return (
                <div key={r.id} className="card">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-sm">{r.type}</p>
                      <p className="text-xs text-[#AAA] mt-0.5">📋 {r.mission_title}</p>
                    </div>
                    <span className={`text-xs font-semibold ${statusInfo.variant}`}>{statusInfo.label}</span>
                  </div>

                  {r.description && (
                    <div className="bg-[#222] rounded-xl p-3 mb-3">
                      <p className="text-xs text-[#AAA] mb-1">Votre message :</p>
                      <p className="text-sm text-white/80">{r.description}</p>
                    </div>
                  )}

                  {r.admin_note && (
                    <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/20 rounded-xl p-3 mb-3">
                      <p className="text-xs text-[#FF4D00] mb-1">Réponse de l'équipe Shoofly :</p>
                      <p className="text-sm text-white/80">{r.admin_note}</p>
                    </div>
                  )}

                  <p className="text-[10px] text-[#555]">
                    Signalé le {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {r.resolved_at && ` · Traité le ${new Date(r.resolved_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`}
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