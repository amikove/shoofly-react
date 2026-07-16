import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { missionsAPI } from '../../api'
import { Spinner } from '../ui'
import { useStatusConfig, formatHistoryDate } from '../../utils/missionHistoryFormat'

// Logique de récupération + rendu de l'historique d'une mission, partagée entre
// MissionHistoryModal (historique seul) et MissionDetailModal (détail + historique).
export default function MissionHistoryTimeline({ missionId }) {
  const { t } = useTranslation()
  const STATUS_CONFIG = useStatusConfig()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!missionId) return
    missionsAPI.history(missionId)
      .then(({ data }) => setHistory(data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [missionId])

  if (loading) {
    return <div className="flex justify-center py-8"><Spinner size="md" /></div>
  }

  if (history.length === 0) {
    return <div className="text-center py-8 text-[#AAA] text-sm">{t('missionHistoryModal.empty')}</div>
  }

  return (
    <div className="relative">
      {/* Ligne verticale */}
      <div className="absolute start-4 top-0 bottom-0 w-px bg-white/10" />
      <div className="space-y-4">
        {history.map((h, i) => {
          const cfg = STATUS_CONFIG[h.status] || { icon: '•', label: h.status, color: 'text-white' }
          return (
            <div key={h.id} className="flex gap-3 relative">
              <div className={`w-8 h-8 rounded-full bg-[#222] border border-white/20 flex items-center justify-center text-sm flex-shrink-0 z-10 ${i === history.length - 1 ? 'border-[#FF4D00]' : ''}`}>
                {cfg.icon}
              </div>
              <div className="flex-1 pb-1">
                <div className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</div>
                {h.note && <div className="text-xs text-[#AAA] mt-0.5">{h.note}</div>}
                {h.changed_by_name && (
                  <div className="text-xs text-[#555] mt-0.5">
                    {t('missionHistoryModal.by', { name: h.changed_by_name })}
                  </div>
                )}
                <div className="text-xs text-[#555] mt-0.5">{formatHistoryDate(h.created_at)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
