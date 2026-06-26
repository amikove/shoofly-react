import { useState, useEffect } from 'react'
import { missionsAPI } from '../../api'
import { Spinner } from '../ui'

const STATUS_CONFIG = {
  pending:          { icon: '📋', label: 'Mission créée',              color: 'text-yellow-400'  },
  assigned:         { icon: '🤝', label: 'Œil assigné',               color: 'text-blue-400'    },
  en_route:         { icon: '🚗', label: 'En route',                  color: 'text-blue-400'    },
  active:           { icon: '▶️', label: 'Mission démarrée',           color: 'text-[#FF4D00]'   },
  completed:        { icon: '✅', label: 'Mission terminée par l\'Œil', color: 'text-green-400'   },
  validated:        { icon: '💰', label: 'Validée par le client',      color: 'text-green-400'   },
  cancelled:        { icon: '❌', label: 'Mission annulée',            color: 'text-red-400'     },
  sous_reclamation: { icon: '🚨', label: 'Réclamation client',         color: 'text-orange-400'  },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function MissionHistoryModal({ mission, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!mission?.id) return
    missionsAPI.history(mission.id)
      .then(({ data }) => setHistory(data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [mission?.id])

  if (!mission) return null

  return (
    <div className="fixed inset-0 bg-black/75 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-5 w-full max-w-sm max-h-[80vh] flex flex-col shadow-xl">

        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-sm">Historique de la mission</h2>
            <p className="text-xs text-[#AAA] mt-0.5">{mission.title}</p>
          </div>
          <button onClick={onClose} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner size="md" /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-[#AAA] text-sm">Aucun historique disponible</div>
          ) : (
            <div className="relative">
              {/* Ligne verticale */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
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
                            par {h.changed_by_name}
                          </div>
                        )}
                        <div className="text-xs text-[#555] mt-0.5">{formatDate(h.created_at)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <button onClick={onClose} className="btn btn-ghost btn-sm mt-4 flex-shrink-0 w-full justify-center">
          Fermer
        </button>
      </div>
    </div>
  )
}