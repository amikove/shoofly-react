import { useState } from 'react'
import { missionsAPI } from '../../api'
import { toast } from '../ui'

const CRITERIA = [
  { key: 'accessibility', label: 'Accessibilité'       },
  { key: 'conformity',    label: 'Conformité au brief'  },
  { key: 'condition',     label: 'État général'         },
  { key: 'cleanliness',   label: 'Propreté'             },
  { key: 'security',      label: 'Sécurité'             },
]

export default function ReportModal({ mission, onClose, onSubmitted }) {
  const [summary, setSummary]   = useState('')
  const [risks, setRisks]       = useState('')
  const [score, setScore]       = useState(75)
  const [crits, setCrits]       = useState({})
  const [loading, setLoading]   = useState(false)

  const submit = async () => {
    if (!summary.trim()) { toast('Le résumé est obligatoire', 'error'); return }
    setLoading(true)
    try {
      await missionsAPI.report(mission.id, {
        summary,
        risk_points: risks.split('\n').filter(r => r.trim()),
        score: parseInt(score),
        criteria_scores: crits,
      })
      toast('Rapport soumis avec succès 📄', 'success')
      onSubmitted?.()
      onClose()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setLoading(false) }
  }

  if (!mission) return null

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_24px_60px_rgba(0,0,0,0.6)]">

        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-base">Soumettre le rapport</h2>
            <p className="text-xs text-[#AAA] mt-0.5">{mission.title}</p>
          </div>
          <button onClick={onClose} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        {/* Résumé */}
        <div className="mb-4">
          <label className="label">Résumé de la mission *</label>
          <textarea
            className="input resize-none h-28"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Décrivez ce que vous avez observé, l'état général du lieu, les points importants..."
          />
        </div>

        {/* Critères */}
        <div className="mb-4">
          <label className="label mb-3">Évaluation des critères</label>
          {CRITERIA.map((c) => (
            <div key={c.key} className="flex items-center justify-between py-2.5 px-3 bg-[#222] rounded-xl mb-2">
              <span className="text-sm font-medium">{c.label}</span>
              <div className="flex gap-1.5">
                {[1,2,3,4,5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCrits(prev => ({ ...prev, [c.key]: n }))}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      crits[c.key] >= n
                        ? 'bg-[#FF4D00] text-white'
                        : 'bg-[#2A2A2A] text-[#AAA] hover:bg-[#333]'
                    }`}
                  >{n}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Risques */}
        <div className="mb-4">
          <label className="label">Points de vigilance / risques</label>
          <textarea
            className="input resize-none h-20"
            value={risks}
            onChange={(e) => setRisks(e.target.value)}
            placeholder="Ex: Humidité salle de bain&#10;Stock limité&#10;Voisinage bruyant"
          />
          <p className="text-[11px] text-[#AAA] mt-1">Un point par ligne</p>
        </div>

        {/* Score global */}
        <div className="mb-6">
          <label className="label">
            Score global — <span className="text-white font-bold">{score}/100</span>
          </label>
          <input
            type="range"
            min="0" max="100"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-full accent-[#FF4D00]"
          />
          <div className="flex justify-between text-xs text-[#AAA] mt-1">
            <span>0 — Très mauvais</span>
            <span>50 — Moyen</span>
            <span>100 — Excellent</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={submit} disabled={loading}
            className="btn btn-primary btn-lg flex-1 justify-center disabled:opacity-60">
            {loading ? 'Envoi...' : 'Soumettre le rapport →'}
          </button>
          <button onClick={onClose} className="btn btn-ghost btn-lg">Annuler</button>
        </div>
      </div>
    </div>
  )
}
