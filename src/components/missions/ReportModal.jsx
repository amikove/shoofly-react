import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { missionsAPI } from '../../api'
import { toast } from '../ui'

const CRITERIA = [
  { key: 'accessibility', labelKey: 'accessibility' },
  { key: 'conformity',    labelKey: 'conformity'    },
  { key: 'condition',     labelKey: 'condition'      },
  { key: 'cleanliness',   labelKey: 'cleanliness'    },
  { key: 'security',      labelKey: 'security'       },
]

export default function ReportModal({ mission, onClose, onSubmitted }) {
  const { t } = useTranslation()
  const [summary, setSummary]   = useState('')
  const [risks, setRisks]       = useState('')
  const [score, setScore]       = useState(75)
  const [crits, setCrits]       = useState({})
  const [loading, setLoading]   = useState(false)

  const submit = async () => {
    if (!summary.trim()) { toast(t('reportModal.errors.summaryRequired'), 'error'); return }
    setLoading(true)
    try {
      await missionsAPI.report(mission.id, {
        summary,
        risk_points: risks.split('\n').filter(r => r.trim()),
        score: parseInt(score),
        criteria_scores: crits,
      })
      toast(t('reportModal.submittedToast'), 'success')
      onSubmitted?.()
      onClose()
    } catch (err) {
      toast(err.response?.data?.error || t('reportModal.errors.generic'), 'error')
    } finally { setLoading(false) }
  }

  if (!mission) return null

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_24px_60px_rgba(0,0,0,0.6)]">

        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-base">{t('reportModal.title')}</h2>
            <p className="text-xs text-[#AAA] mt-0.5">{mission.title}</p>
          </div>
          <button onClick={onClose} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        {/* Résumé */}
        <div className="mb-4">
          <label className="label">{t('reportModal.summaryLabel')}</label>
          <textarea
            className="input resize-none h-28"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={t('reportModal.summaryPlaceholder')}
          />
        </div>

        {/* Critères */}
        <div className="mb-4">
          <label className="label mb-3">{t('reportModal.criteriaLabel')}</label>
          {CRITERIA.map((c) => (
            <div key={c.key} className="flex items-center justify-between py-2.5 px-3 bg-[#222] rounded-xl mb-2">
              <span className="text-sm font-medium">{t(`reportModal.criteria.${c.labelKey}`)}</span>
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
          <label className="label">{t('reportModal.risksLabel')}</label>
          <textarea
            className="input resize-none h-20"
            value={risks}
            onChange={(e) => setRisks(e.target.value)}
            placeholder={t('reportModal.risksPlaceholder')}
          />
          <p className="text-[11px] text-[#AAA] mt-1">{t('reportModal.risksHint')}</p>
        </div>

        {/* Score global */}
        <div className="mb-6">
          <label className="label">
            {t('reportModal.globalScoreLabel')} <span className="text-white font-bold">{score}/100</span>
          </label>
          <input
            type="range"
            min="0" max="100"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-full accent-[#FF4D00]"
          />
          <div className="flex justify-between text-xs text-[#AAA] mt-1">
            <span>{t('reportModal.scoreScale.veryBad')}</span>
            <span>{t('reportModal.scoreScale.average')}</span>
            <span>{t('reportModal.scoreScale.excellent')}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={submit} disabled={loading}
            className="btn btn-primary btn-lg flex-1 justify-center disabled:opacity-60">
            {loading ? t('reportModal.sending') : t('reportModal.submit')}
          </button>
          <button onClick={onClose} className="btn btn-ghost btn-lg">{t('reportModal.cancel')}</button>
        </div>
      </div>
    </div>
  )
}
