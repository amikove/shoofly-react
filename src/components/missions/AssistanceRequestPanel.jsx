import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { missionsAPI } from '../../api'
import { toast } from '../ui'

// Écran de validation client du flux "Demander assistance" catégorie MISSION
// (POST /missions/:id/assistance puis /:id/assistance/respond). Rendu dans
// MissionDetailModal — pas de nouvel écran de liste, cohérent avec le composant hôte.
//
// Aucune route GET n'expose mission_assistance_requests (backend-only, périmètre gelé) : la
// détection d'une déclaration en attente se fait donc à partir de données déjà exposées par
// GET /missions/:id — le message système du chat (content_key='assistanceMissionRequestSystemMessage',
// params.reason posé verbatim par le backend) couplé à mission.status='sous_reclamation'.
// mission.under_surveillance distingue une contestation déjà déposée (passe à true uniquement
// au moment de /assistance/respond{action:'dispute'}) d'une déclaration encore en attente.
// Ceci ne confond pas avec l'ancien flux de réclamation classique (POST /:id/claim) : celui-ci
// n'est atteignable que depuis une mission déjà 'completed' et n'écrit jamais ce content_key.
export default function AssistanceRequestPanel({ mission, onUpdated }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [pendingReason, setPendingReason] = useState(null)
  const [disputedAlready, setDisputedAlready] = useState(false)
  const [disputing, setDisputing] = useState(false)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resolved, setResolved] = useState(null) // null | 'validated' | 'disputed'

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setResolved(null)
    setDisputing(false)
    setComment('')
    missionsAPI.get(mission.id)
      .then(({ data }) => {
        if (cancelled) return
        const m = data.mission || data
        const messages = data.messages || []
        const lastAssistanceMsg = [...messages].reverse()
          .find((msg) => msg.content_key === 'assistanceMissionRequestSystemMessage')

        if (m.status === 'sous_reclamation' && lastAssistanceMsg) {
          setDisputedAlready(!!m.under_surveillance)
          setPendingReason(m.under_surveillance ? null : (lastAssistanceMsg.params?.reason || ''))
        } else {
          setPendingReason(null)
          setDisputedAlready(false)
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [mission.id])

  if (loading) return null
  if (!pendingReason && !disputedAlready && !resolved) return null

  const validate = async () => {
    if (!window.confirm(t('assistanceRequestPanel.validateConfirm'))) return
    setSubmitting(true)
    try {
      await missionsAPI.assistanceRespond(mission.id, { action: 'validate' })
      toast(t('assistanceRequestPanel.validatedToast'), 'success')
      setPendingReason(null)
      setResolved('validated')
      onUpdated?.()
    } catch (err) {
      toast(err.response?.data?.error || t('assistanceRequestPanel.genericError'), 'error')
    } finally { setSubmitting(false) }
  }

  const submitDispute = async () => {
    if (!comment.trim()) { toast(t('assistanceRequestPanel.disputeCommentRequired'), 'error'); return }
    setSubmitting(true)
    try {
      const { data } = await missionsAPI.assistanceRespond(mission.id, { action: 'dispute', comment: comment.trim() })
      toast(t('assistanceRequestPanel.disputedToast', { reference: data.ticket_reference }), 'success')
      setPendingReason(null)
      setResolved('disputed')
      onUpdated?.()
    } catch (err) {
      toast(err.response?.data?.error || t('assistanceRequestPanel.genericError'), 'error')
    } finally { setSubmitting(false) }
  }

  const showDisputedNotice = disputedAlready || resolved === 'disputed'

  return (
    <div className="bg-orange-500/5 border border-orange-500/30 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold">{t('assistanceRequestPanel.title')}</h3>

      {resolved === 'validated' && (
        <p className="text-xs text-green-400">{t('assistanceRequestPanel.validatedToast')}</p>
      )}

      {showDisputedNotice && (
        <p className="text-xs text-white/80">{t('assistanceRequestPanel.alreadyDisputedNotice')}</p>
      )}

      {pendingReason && !resolved && (
        <>
          <div>
            <div className="text-[11px] text-[#AAA] mb-0.5">{t('assistanceRequestPanel.reasonLabel')}</div>
            <div className="text-sm text-white">{t(`assistanceReasons.${pendingReason}`, pendingReason)}</div>
          </div>
          <p className="text-xs text-[#AAA]">{t('assistanceRequestPanel.hint')}</p>

          {!disputing ? (
            <div className="flex gap-2">
              <button
                onClick={validate}
                disabled={submitting}
                className="btn btn-sm flex-1 justify-center bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
              >
                {submitting ? t('assistanceRequestPanel.validating') : t('assistanceRequestPanel.validate')}
              </button>
              <button
                onClick={() => setDisputing(true)}
                disabled={submitting}
                className="btn btn-sm flex-1 justify-center bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {t('assistanceRequestPanel.dispute')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="label">{t('assistanceRequestPanel.disputeCommentLabel')}</label>
              <textarea
                className="input resize-none h-24 w-full"
                placeholder={t('assistanceRequestPanel.disputeCommentPlaceholder')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={() => setDisputing(false)} disabled={submitting} className="btn btn-ghost flex-1 justify-center">
                  {t('assistanceRequestPanel.cancel')}
                </button>
                <button
                  onClick={submitDispute}
                  disabled={submitting || !comment.trim()}
                  className="btn btn-sm flex-1 justify-center bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {submitting ? t('assistanceRequestPanel.disputeSubmitting') : t('assistanceRequestPanel.disputeSubmit')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
