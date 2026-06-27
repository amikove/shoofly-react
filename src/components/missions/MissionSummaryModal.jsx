import { useState, useEffect } from 'react'
import { missionsAPI, reportsAPI } from '../../api'
import { Spinner, Stars } from '../ui'
import { useNavigate } from 'react-router-dom'

const STATUS_CONFIG = {
  pending:          { icon: '📋', label: 'En attente',               color: 'text-yellow-400' },
  assigned:         { icon: '🤝', label: 'Œil assigné',              color: 'text-blue-400'   },
  en_route:         { icon: '🚗', label: 'En route',                 color: 'text-blue-400'   },
  active:           { icon: '▶️', label: 'Démarrée',                 color: 'text-[#FF4D00]'  },
  completed:        { icon: '✅', label: 'Terminée',                  color: 'text-green-400'  },
  validated:        { icon: '💰', label: 'Validée — Payée',          color: 'text-green-400'  },
  cancelled:        { icon: '❌', label: 'Annulée',                   color: 'text-red-400'    },
  sous_reclamation: { icon: '🚨', label: 'En réclamation',           color: 'text-orange-400' },
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function MissionSummaryModal({ mission, onClose }) {
  const navigate = useNavigate()
  const [history, setHistory]   = useState([])
  const [rating, setRating]     = useState(null)
  const [hasReport, setHasReport] = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!mission?.id) return
    Promise.all([
      missionsAPI.history(mission.id).catch(() => ({ data: { history: [] } })),
      reportsAPI.get(mission.id).catch(() => ({ data: { report: null } })),
      missionsAPI.get(mission.id).catch(() => ({ data: {} })),
    ]).then(([hRes, rRes, mRes]) => {
      setHistory(hRes.data.history || [])
      setHasReport(!!rRes.data.report?.submitted)
      setRating(mRes.data.rating || null)
    }).finally(() => setLoading(false))
  }, [mission?.id])

  if (!mission) return null

  const isAirbnb = ['airbnb','booking'].some(s => mission.subcategory?.toLowerCase().includes(s.toLowerCase()))
  const isAudit  = mission.type === 'audit'
  const isValidated = !!mission.validated_at
  const statusCfg = isValidated
    ? STATUS_CONFIG['validated']
    : STATUS_CONFIG[mission.status] || { icon: '•', label: mission.status, color: 'text-white' }

  return (
    <div className="fixed inset-0 bg-black/75 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-5 w-full max-w-sm max-h-[85vh] flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-sm">{mission.title}</h2>
            <p className="text-xs text-[#AAA] mt-0.5">📍 {mission.city} {mission.quartier ? `· ${mission.quartier}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">

          {/* Statut + Paiement */}
          <div className="bg-[#222] rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-[#AAA] mb-1">Statut</div>
              <div className={`text-sm font-semibold ${statusCfg.color}`}>
                {statusCfg.icon} {statusCfg.label}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#AAA] mb-1">Votre gain</div>
              <div className={`text-xl font-bold ${isValidated ? 'text-green-400' : 'text-[#AAA]'}`}>
                {parseFloat(mission.oeil_earning || 0).toFixed(0)} MAD
              </div>
              {!isValidated && (
                  <div className="text-[10px] text-orange-400 mt-1">⏳ En attente de validation client</div>
                )}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#AAA]">📅 Date mission</span>
              <span className="text-white">{formatDate(mission.scheduled_at)}</span>
            </div>
            {mission.completed_by_oeil_at && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#AAA]">✅ Terminée le</span>
                <span className="text-white">{formatDate(mission.completed_by_oeil_at)}</span>
              </div>
            )}
            {mission.validated_at && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#AAA]">💰 Validée le</span>
                <span className="text-green-400">{formatDate(mission.validated_at)}</span>
              </div>
            )}
          </div>

          {/* Note client */}
          {!loading && rating && (
            <div className="bg-[#222] rounded-xl p-3">
              <div className="text-xs text-[#AAA] mb-2">Note reçue du client</div>
              <div className="flex items-center gap-2">
                <Stars value={rating.score} />
                <span className="text-sm font-semibold text-yellow-400">{rating.score}/5</span>
              </div>
              {rating.comment && (
                <p className="text-xs text-[#AAA] mt-2 italic">"{rating.comment}"</p>
              )}
            </div>
          )}
          {!loading && !rating && (
            <div className="text-xs text-[#555] text-center py-1">Pas encore noté par le client</div>
          )}

          {/* Lien rapport */}
          {hasReport && (isAirbnb || isAudit) && (
            <button
              onClick={() => { onClose(); navigate(`/oeil/missions/${mission.id}/${isAudit ? 'audit' : 'rapport'}`) }}
              className="btn btn-ghost btn-sm w-full justify-center"
            >
              📋 Voir le rapport soumis
            </button>
          )}

          {/* Historique */}
          {!loading && history.length > 0 && (
            <div>
              <div className="text-xs text-[#AAA] mb-3">Historique</div>
              <div className="relative">
                <div className="absolute left-3.5 top-0 bottom-0 w-px bg-white/10" />
                <div className="space-y-3">
                  {history.map((h) => {
                    const cfg = STATUS_CONFIG[h.status] || { icon: '•', label: h.status, color: 'text-white' }
                    return (
                      <div key={h.id} className="flex gap-3 relative">
                        <div className="w-7 h-7 rounded-full bg-[#2A2A2A] border border-white/20 flex items-center justify-center text-xs flex-shrink-0 z-10">
                          {cfg.icon}
                        </div>
                        <div className="flex-1">
                          <div className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</div>
                          <div className="text-[11px] text-[#555]">{formatDate(h.created_at)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {loading && <div className="flex justify-center py-4"><Spinner size="sm" /></div>}
        </div>

          {!isValidated && mission.completed_by_oeil_at && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mt-2 text-xs text-orange-400 text-center">
              ⏳ En attente de la validation du client 😉
            </div>
          )}

        <button onClick={onClose} className="btn btn-ghost btn-sm mt-4 flex-shrink-0 w-full justify-center">
          Fermer
        </button>
      </div>
    </div>
  )
}