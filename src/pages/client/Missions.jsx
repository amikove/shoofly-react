import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, toast } from '../../components/ui'
import NewMissionModal from '../../components/missions/NewMissionModal'
import RateModal from '../../components/missions/RateModal'
import ChatModal from '../../components/missions/ChatModal'
import { useAuth } from '../../context/AuthContext'
import { useNotif } from '../../context/NotifContext'
import { useNavigate } from 'react-router-dom'
import MissionHistoryModal from '../../components/missions/MissionHistoryModal'
import InterestsModal from '../../components/missions/InterestsModal'
import NewTicketModal from '../../components/tickets/NewTicketModal'

const TYPE_ICONS = { immobilier:'🏠', file_attente:'⏳', audit:'🔎', personnalisee:'🎯' }

const STATUS_OPTIONS = [
  { value: '', key: 'allStatuses' },
  { value: 'pending', key: 'pending' },
  { value: 'assigned', key: 'assigned' },
  { value: 'en_route', key: 'enRoute' },
  { value: 'active', key: 'active' },
  { value: 'completed', key: 'completed' },
  { value: 'cancelled', key: 'cancelled' },
]

const TYPE_OPTIONS = [
  { value: '', key: 'allTypes' },
  { value: 'immobilier', key: 'immobilier' },
  { value: 'file_attente', key: 'fileAttente' },
  { value: 'audit', key: 'audit' },
  { value: 'personnalisee', key: 'personnalisee' },
]


function ReportViewer({ mission, onClose }) {
  const { t } = useTranslation()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    missionsAPI.get(mission.id)
      .then(({ data }) => setReport(data.report || null))
      .catch(() => toast(t('clientMissions.reportViewer.errorLoading'), 'error'))
      .finally(() => setLoading(false))
  }, [mission.id])

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-base">{t('clientMissions.reportViewer.title')}</h2>
            <p className="text-xs text-[#AAA] mt-0.5">{mission.title}</p>
          </div>
          <button onClick={onClose} aria-label={t('common.close')} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : !report ? (
          <div className="text-center py-12 text-[#AAA]">
            <div className="text-4xl mb-3 opacity-30">📄</div>
            <p>{t('clientMissions.reportViewer.noReport')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#222] rounded-xl">
              <span className="text-sm font-semibold">{t('clientMissions.reportViewer.globalScore')}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-[#333] rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF4D00] rounded-full" style={{ width: `${report.score}%` }} />
                </div>
                <span className="font-bold text-[#FF4D00]">{report.score}/100</span>
              </div>
            </div>
            <div>
              <label className="label">{t('clientMissions.reportViewer.summary')}</label>
              <div className="bg-[#222] rounded-xl p-4 text-sm text-[#AAA] leading-relaxed">{report.summary}</div>
            </div>
            {report.risk_points?.length > 0 && (
              <div>
                <label className="label">{t('clientMissions.reportViewer.riskPoints')}</label>
                <div className="space-y-1">
                  {report.risk_points.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-[#AAA] bg-[#222] rounded-lg px-3 py-2">
                      <span className="text-yellow-400 mt-0.5">⚠️</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


function ClaimModal({ mission, onClose, onClaimed }) {
  const { t } = useTranslation()
  const [comment, setComment] = useState('')
  const [saving, setSaving]   = useState(false)

  const submit = async () => {
    if (!comment.trim()) { toast(t('clientMissions.claimModal.commentRequired'), 'error'); return }
    setSaving(true)
    try {
      await missionsAPI.claim(mission.id, comment)
      toast(t('clientMissions.claimModal.sentToast'), 'info')
      onClaimed()
    } catch (err) {
      toast(err.response?.data?.error || t('clientMissions.claimModal.genericError'), 'error')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-5 w-full max-w-sm shadow-xl">
        <h2 className="font-semibold mb-1">{t('clientMissions.claimModal.title')}</h2>
        <p className="text-xs text-[#AAA] mb-4">{t('clientMissions.claimModal.subtitle', { title: mission.title })}</p>
        <textarea
          className="input resize-none h-28 w-full"
          placeholder={t('clientMissions.claimModal.placeholder')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="btn btn-ghost flex-1 justify-center">{t('clientMissions.claimModal.cancel')}</button>
          <button onClick={submit} disabled={saving || !comment.trim()} className="btn btn-primary flex-1 justify-center disabled:opacity-60">
            {saving ? t('clientMissions.claimModal.sending') : t('clientMissions.claimModal.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}


export default function ClientMissions() {

  const { t } = useTranslation()
  const navigate = useNavigate()
  const [missions, setMissions]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [showNew, setShowNew]             = useState(false)
  const [ratingMission, setRatingMission] = useState(null)
  const [chatMission, setChatMission]     = useState(null)
  const [reportMission, setReportMission] = useState(null)
  const [problemMission, setProblemMission] = useState(null)
  const [interestsMission, setInterestsMission] = useState(null)
  const [claimMission, setClaimMission] = useState(null)
  const [historyMission, setHistoryMission] = useState(null)
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatus]         = useState('')
  const [typeFilter, setType]             = useState('')
  const { pendingAction, clearPending } = useNotif()

// Traiter l'action en attente depuis une notification (chat ou intéressés)
useEffect(() => {
  if (!pendingAction) return
  const { type, missionId } = pendingAction
  if (!missionId) { clearPending(); return }

  const found = missions.find((m) => m.id === missionId)
  const openWith = (mission) => {
    if (type === 'chat') setChatMission(mission)
    else if (type === 'interests_modal') setInterestsMission(mission)
  }

  if (found) {
    openWith(found)
    clearPending()
  } else {
    missionsAPI.get(missionId)
      .then(({ data }) => openWith(data.mission || data))
      .catch(() => toast(t('clientMissions.errors.loadingMission'), 'error'))
      .finally(() => clearPending())
  }
}, [pendingAction, missions])


  const load = useCallback(() => {
    setLoading(true)
    return missionsAPI.list({ search, status: statusFilter, type: typeFilter })
      .then(({ data }) => setMissions(data.missions || []))
      .catch(() => toast(t('clientMissions.errors.loading'), 'error'))
      .finally(() => setLoading(false))
  }, [search, statusFilter, typeFilter])

  useEffect(() => {
    load()
  }, [load])

const cancel = async (id) => {
    const mission = missions.find(m => m.id === id)
    const isAssigned = mission?.status === 'assigned'
    const hoursBeforeMission = mission?.scheduled_at
      ? (new Date(mission.scheduled_at).getTime() - Date.now()) / 3600000
      : 999

    let confirmMsg = t('clientMissions.cancelConfirm.default')
    if (isAssigned && hoursBeforeMission > 2) {
      confirmMsg = t('clientMissions.cancelConfirm.assignedRefund50')
    } else if (isAssigned && hoursBeforeMission <= 2) {
      confirmMsg = t('clientMissions.cancelConfirm.assignedNoRefund')
    }

    if (!window.confirm(confirmMsg)) return
    try {
      await missionsAPI.status(id, { status: 'cancelled' })
      setMissions(prev => prev.map(m => m.id === id ? { ...m, status: 'cancelled' } : m))
      toast(t('clientMissions.cancelledToast'), 'info')
    } catch (err) {
      toast(err.response?.data?.error || t('clientMissions.errors.generic'), 'error')
    }
  }

  const validateMission = async (id) => {
  if (!window.confirm(t('clientMissions.validateConfirm'))) return
  try {
    await missionsAPI.validate(id)
    setMissions(prev => prev.map(m => m.id === id ? { ...m, validated_at: new Date().toISOString() } : m))
    toast(t('clientMissions.validatedToast'), 'success')
  } catch (err) {
    toast(err.response?.data?.error || t('clientMissions.errors.generic'), 'error')
  }
}


  return (
    <AppLayout>
      <Topbar
        title={t('clientMissions.title')}
        actions={
          <button onClick={() => setShowNew(true)} className="btn btn-primary btn-sm">
            {t('clientMissions.newMissionButton')}
          </button>
        }
      />
      <div className="p-6">
        <div className="flex flex-wrap gap-3 mb-5">
          <input className="input max-w-[220px]" placeholder={t('clientMissions.searchPlaceholder')}
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input max-w-[160px]" value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map(o => <option key={o.key} value={o.value}>{t(`clientMissions.filters.${o.key}`)}</option>)}
          </select>
          <select className="input max-w-[160px]" value={typeFilter} onChange={(e) => setType(e.target.value)}>
            {TYPE_OPTIONS.map(o => <option key={o.key} value={o.value}>{t(`clientMissions.filters.${o.key}`)}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : missions.length === 0 ? (
          <EmptyState icon="📋" title={t('clientMissions.emptyTitle')} description={t('clientMissions.emptyDesc')}
            action={<button onClick={() => setShowNew(true)} className="btn btn-primary">{t('clientMissions.newMissionButton')}</button>} />
        ) : (
          <>

          {/* Desktop: tableau */}
<div className="hidden md:block card p-0">
  <div className="table-wrap">
    <table>
      <thead>
        <tr>
          <th>{t('clientMissions.table.mission')}</th><th>{t('clientMissions.table.type')}</th><th>{t('clientMissions.table.oeil')}</th>
          <th>{t('clientMissions.table.date')}</th><th>{t('clientMissions.table.price')}</th><th>{t('clientMissions.table.status')}</th><th>{t('clientMissions.table.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {missions.map((m) => (
          <tr key={m.id}>
            <td>
              <div className="font-semibold">{m.title}</div>
              <div className="text-[11px] text-[#AAA]">#{String(m.id).slice(-6).toUpperCase()}</div>
            </td>
            <td className="text-lg">{TYPE_ICONS[m.type] || '📋'}</td>
            <td className="text-[#AAA]">{m.oeil_name || '—'}</td>
            <td className="text-[#AAA] text-xs">{new Date(m.created_at).toLocaleDateString('fr-FR')}</td>
            <td className="text-green-400 font-semibold">{parseFloat(m.price).toFixed(0)} MAD</td>
            <td><StatusBadge status={m.status} validated={!!m.validated_at} role="client" /></td>
            <td>
              <div className="flex gap-1 flex-wrap">
                {m.status === 'pending' && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setInterestsMission(m); }}
                    className="btn btn-ghost btn-sm" title={t('clientMissions.actions.viewInterested')}>👁️</button>
                )}
                {['assigned','en_route','active'].includes(m.status) && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setChatMission(m); }}
                    className="btn btn-ghost btn-sm" title={t('clientMissions.actions.chatWithOeil')}>💬</button>
                )}
                {['assigned','en_route','active'].includes(m.status) && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setProblemMission(m) }}
                    className="btn btn-ghost btn-sm text-orange-400" title={t('clientMissions.actions.reportProblem')}>⚠️</button>
                )}
                {m.under_surveillance && (
                  <span className="badge badge-red text-[10px]">{t('clientMissions.actions.surveillance')}</span>
                )}
                    {m.status === 'completed' && (
                      <>
                        {['airbnb','booking'].some(s => m.subcategory?.toLowerCase().includes(s.toLowerCase())) && (
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/client/missions/${m.id}/rapport`) }}
                            className="btn btn-ghost btn-sm" title={t('clientMissions.actions.visitReport')}>📄</button>
                        )}
                        {m.type === 'audit' && (
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/client/missions/${m.id}/audit`) }}
                            className="btn btn-ghost btn-sm" title={t('clientMissions.actions.auditReport')}>📋</button>
                        )}
                      </>
                    )}

                {m.type === 'immobilier' && ['Airbnb','Booking'].some(s => m.subcategory?.includes(s)) && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/client/missions/${m.id}/rapport`); }}
                  className="btn btn-ghost btn-sm"
                  title={t('clientMissions.actions.airbnbVisitReport')}
                >📋</button>
              )}

                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setHistoryMission(m); }}
                      className="btn btn-ghost btn-sm" title={t('clientMissions.actions.history')}>🕐</button>


                        {m.status === 'completed' && m.validated_at && (
                          m.rating_score ? (
                            <span className="text-xs text-yellow-400 font-semibold">{t('clientMissions.ratingDisplay', { score: m.rating_score })}</span>
                          ) : (
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRatingMission(m); }}
                              className="btn btn-ghost btn-sm" title={t('clientMissions.actions.rateOeil')}>{t('clientMissions.actions.rate')}</button>
                          )
                        )}

                    {m.status === 'completed' && !m.validated_at && m.completed_by_oeil_at && (
                      (() => {
                        const hours = (Date.now() - new Date(m.completed_by_oeil_at).getTime()) / 3600000;
                        return hours < 12 ? (
                          <>
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); validateMission(m.id); }}
                              className="btn btn-ghost btn-sm text-green-400" title={t('clientMissions.actions.validate')}>✅</button>
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setClaimMission(m); }}
                              className="btn btn-ghost btn-sm text-orange-400" title={t('clientMissions.actions.claim')}>🚨</button>
                          </>
                        ) : null;
                      })()
                    )}

                    {['pending','assigned'].includes(m.status) && (
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); cancel(m.id); }}
                        className="btn btn-ghost btn-sm text-red-400">{t('clientMissions.actions.cancel')}</button>
                    )}


              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

{/* Mobile: cartes */}
<div className="md:hidden space-y-3">
  {missions.map((m) => (
    <div key={m.id} className="card">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{m.title}</div>
          <div className="text-[11px] text-[#AAA] mt-0.5">
            {TYPE_ICONS[m.type]} · {m.oeil_name || t('clientMissions.mobile.notAssigned')} · {new Date(m.created_at).toLocaleDateString('fr-FR')}
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <span className="text-green-400 font-bold text-sm">{parseFloat(m.price).toFixed(0)} MAD</span>
          <StatusBadge status={m.status} validated={!!m.validated_at} role="client" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap pt-2 border-t border-white/10">
        {m.status === 'pending' && (
          <button onClick={() => setInterestsMission(m)} className="btn btn-ghost btn-sm">{t('clientMissions.mobile.interested')}</button>
        )}
        {['assigned','en_route','active'].includes(m.status) && (
          <button onClick={() => setChatMission(m)} className="btn btn-ghost btn-sm">{t('clientMissions.mobile.chat')}</button>
        )}
          {m.status === 'completed' && (
            <>
              {['airbnb','booking'].some(s => m.subcategory?.toLowerCase().includes(s.toLowerCase())) && (
                <button onClick={() => navigate(`/client/missions/${m.id}/rapport`)} className="btn btn-ghost btn-sm">{t('clientMissions.mobile.report')}</button>
              )}
              {m.type === 'audit' && (
                <button onClick={() => navigate(`/client/missions/${m.id}/audit`)} className="btn btn-ghost btn-sm">{t('clientMissions.mobile.audit')}</button>
              )}
            </>
          )}

          {m.type === 'immobilier' && ['Airbnb','Booking'].some(s => m.subcategory?.includes(s)) && (
            <button
              onClick={() => navigate(`/client/missions/${m.id}/rapport`)}
              className="btn btn-ghost btn-sm"
            >{t('clientMissions.mobile.visite')}</button>
          )}
          <button onClick={() => setHistoryMission(m)} className="btn btn-ghost btn-sm">{t('clientMissions.mobile.history')}</button>

          {m.status === 'completed' && m.validated_at && (
            m.rating_score ? (
              <span className="text-xs text-yellow-400 font-semibold">
                {m.rating_comment
                  ? t('clientMissions.ratingDisplayWithComment', { score: m.rating_score, comment: `${m.rating_comment.slice(0,30)}${m.rating_comment.length > 30 ? '...' : ''}` })
                  : t('clientMissions.ratingDisplay', { score: m.rating_score })}
              </span>
            ) : (
              <button onClick={() => setRatingMission(m)} className="btn btn-ghost btn-sm">{t('clientMissions.mobile.rate')}</button>
            )
          )}

          {m.status === 'completed' && !m.validated_at && m.completed_by_oeil_at && (
  (() => {
    const hours = (Date.now() - new Date(m.completed_by_oeil_at).getTime()) / 3600000;
    return hours < 12 ? (
      <>
        <button onClick={() => validateMission(m.id)} className="btn btn-ghost btn-sm text-green-400">{t('clientMissions.mobile.validate')}</button>
        <button onClick={() => setClaimMission(m)} className="btn btn-ghost btn-sm text-orange-400">{t('clientMissions.mobile.claim')}</button>
      </>
    ) : null;
  })()
)}


      </div>
    </div>

  )


)}
</div>
          </>
        )}
      </div>

      <NewMissionModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => { load(); toast(t('clientMissions.missionCreatedToast'), 'success') }}
      />

      {ratingMission && (
        <RateModal
          mission={ratingMission}
          onClose={() => setRatingMission(null)}
          onRated={() => { setRatingMission(null); load() }}
        />
      )}

{claimMission && (
  <ClaimModal mission={claimMission} onClose={() => setClaimMission(null)} onClaimed={() => { setClaimMission(null); load() }} />
)}

{historyMission && (
  <MissionHistoryModal mission={historyMission} onClose={() => setHistoryMission(null)} />
)}

      {chatMission && (
        <ChatModal
          mission={chatMission}
          onClose={() => setChatMission(null)}
        />
      )}

      {reportMission && (
        <ReportViewer
          mission={reportMission}
          onClose={() => setReportMission(null)}
        />
      )}
      {interestsMission && (
  <InterestsModal
    mission={interestsMission}
    onClose={() => setInterestsMission(null)}
    onHired={() => { setInterestsMission(null); load() }}
  />
)}
      <NewTicketModal
        open={!!problemMission}
        onClose={() => setProblemMission(null)}
        onCreated={() => { setProblemMission(null); load() }}
        presetMissionId={problemMission?.id}
        presetCategory="mission"
      />
    </AppLayout>
  )
}