import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { missionsAPI } from '../../api'
import { toast } from '../ui'
import { URGENCE_REASONS, MISSION_REASONS } from '../../constants/assistanceReasons'

// Flux "Demander assistance" (URGENCE / MISSION) partagé entre oeil/Missions.jsx et
// oeil/Dashboard.jsx — un seul mécanisme, POST /:id/assistance, pas de redirection vers la
// liste générale de tickets. Extrait de Missions.jsx (prompt frontend consolidation Dashboard).
export default function AssistanceModal({ mission, onClose, onSuccess }) {
  const { t } = useTranslation()
  const [view, setView] = useState('choice') // 'choice' | 'urgence' | 'mission'
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!mission) return null

  const submit = async (category) => {
    if (!reason) { toast(t('oeilMissions.toasts.selectReasonShort'), 'error'); return }
    setSubmitting(true)
    try {
      await missionsAPI.assistance(mission.id, { category, reason })
      toast(
        category === 'urgence' ? t('oeilMissions.toasts.assistanceUrgenceSent') : t('oeilMissions.toasts.assistanceMissionSent'),
        'info'
      )
      onSuccess()
    } catch (err) {
      toast(err.response?.data?.error || t('oeilMissions.toasts.genericError'), 'error')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#181818] border border-orange-500/30 rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto">

        {/* Choix initial : URGENCE ou MISSION — pas de redirection vers la liste générale de tickets */}
        {view === 'choice' && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl">🆘</div>
              <div>
                <h2 className="font-bold text-base">{t('oeilMissions.assistanceModal.title')}</h2>
                <p className="text-xs text-[#AAA]">{mission.title}</p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => { setView('urgence'); setReason('') }}
                className="w-full bg-[#222] hover:bg-[#2A2A2A] rounded-xl p-4 text-start transition-colors border border-white/5"
              >
                <p className="text-sm font-semibold text-red-400 mb-1">{t('oeilMissions.assistanceModal.categoryChoice.urgence.label')}</p>
                <p className="text-xs text-[#AAA]">{t('oeilMissions.assistanceModal.categoryChoice.urgence.desc')}</p>
              </button>
              <button
                onClick={() => { setView('mission'); setReason('') }}
                className="w-full bg-[#222] hover:bg-[#2A2A2A] rounded-xl p-4 text-start transition-colors border border-white/5"
              >
                <p className="text-sm font-semibold text-orange-400 mb-1">{t('oeilMissions.assistanceModal.categoryChoice.mission.label')}</p>
                <p className="text-xs text-[#AAA]">{t('oeilMissions.assistanceModal.categoryChoice.mission.desc')}</p>
              </button>
            </div>
            <button onClick={onClose} className="btn btn-ghost w-full justify-center mt-4">{t('oeilMissions.assistanceModal.cancel')}</button>
          </>
        )}

        {/* URGENCE — aucune validation requise, remplacement recherché immédiatement */}
        {view === 'urgence' && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => { setView('choice'); setReason('') }} className="text-[#AAA] hover:text-white">←</button>
              <div>
                <h2 className="font-bold text-base">{t('oeilMissions.assistanceModal.urgenceView.title')}</h2>
                <p className="text-xs text-[#AAA]">{mission.title}</p>
              </div>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4">
              <p className="text-xs text-white/80">{t('oeilMissions.assistanceModal.urgenceView.warning')}</p>
            </div>
            <div className="bg-[#222] rounded-xl p-3 mb-4 space-y-1">
              <p className="text-xs text-[#AAA]">{t('oeilMissions.assistanceModal.urgenceView.consequencesLabel')}</p>
              <p className="text-xs text-white/70">
                {mission.status === 'assigned'
                  ? t('oeilMissions.assistanceModal.urgenceView.consequenceBefore')
                  : t('oeilMissions.assistanceModal.urgenceView.consequenceDuring')}
              </p>
            </div>
            <div className="mb-5">
              <label className="label">{t('oeilMissions.assistanceModal.reasonLabel')}</label>
              <div className="space-y-2 mt-1">
                {URGENCE_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`w-full text-start px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                      reason === r
                        ? 'bg-red-500/20 border-red-500 text-white'
                        : 'bg-[#222] border-white/12 text-[#AAA] hover:text-white hover:border-white/22'
                    }`}
                  >
                    {t(`assistanceReasons.${r}`, r)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setView('choice'); setReason('') }} className="btn btn-ghost flex-1 justify-center">{t('oeilMissions.assistanceModal.back')}</button>
              <button
                onClick={() => submit('urgence')}
                disabled={submitting || !reason}
                className="btn btn-sm flex-1 justify-center bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {submitting ? t('oeilMissions.assistanceModal.urgenceView.confirming') : t('oeilMissions.assistanceModal.urgenceView.confirm')}
              </button>
            </div>
          </>
        )}

        {/* MISSION — gèle la mission en attente de la réponse du client (valider/contester) */}
        {view === 'mission' && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => { setView('choice'); setReason('') }} className="text-[#AAA] hover:text-white">←</button>
              <div>
                <h2 className="font-bold text-base">{t('oeilMissions.assistanceModal.missionView.title')}</h2>
                <p className="text-xs text-[#AAA]">{mission.title}</p>
              </div>
            </div>
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-4">
              <p className="text-xs text-white/80">{t('oeilMissions.assistanceModal.missionView.warning')}</p>
            </div>
            <div className="mb-5">
              <label className="label">{t('oeilMissions.assistanceModal.reasonLabel')}</label>
              <div className="space-y-2 mt-1">
                {MISSION_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`w-full text-start px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                      reason === r
                        ? 'bg-orange-500/20 border-orange-500 text-white'
                        : 'bg-[#222] border-white/12 text-[#AAA] hover:text-white hover:border-white/22'
                    }`}
                  >
                    {t(`assistanceReasons.${r}`, r)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setView('choice'); setReason('') }} className="btn btn-ghost flex-1 justify-center">{t('oeilMissions.assistanceModal.back')}</button>
              <button
                onClick={() => submit('mission')}
                disabled={submitting || !reason}
                className="btn btn-sm flex-1 justify-center bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {submitting ? t('oeilMissions.assistanceModal.missionView.confirming') : t('oeilMissions.assistanceModal.missionView.confirm')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
