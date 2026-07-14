import ChatModal from '../../components/missions/ChatModal'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../components/layout/AppLayout'
import { VILLES } from '../../constants/villes'
import { translateLocation } from '../../constants/villesTranslations'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, reportsAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, toast, Pagination } from '../../components/ui'
import { useNotif } from '../../context/NotifContext'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import MissionHistoryModal from '../../components/missions/MissionHistoryModal'
import MissionSummaryModal from '../../components/missions/MissionSummaryModal'
import ComplianceModal from '../../components/missions/ComplianceModal'
import NewTicketModal from '../../components/tickets/NewTicketModal'

const TABS = ['priority', 'available', 'active', 'done']
const TYPE_ICONS = { immobilier:'🏠', file_attente:'⏳', audit:'🔎', personnalisee:'🎯' }


export default function OeilMissions() {
  const { t, i18n } = useTranslation()
  const [complianceMission, setComplianceMission] = useState(null)
  const [tab, setTab]             = useState('available')
  const [missions, setMissions]   = useState([])
  const [priorityMissions, setPriorityMissions] = useState([])
  const [counts, setCounts] = useState({ priority: 0, available: 0, active: 0, done: 0 })
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [chatMission, setChatMission] = useState(null)
  const navigate = useNavigate()
  const [quartier, setQuartier] = useState('')
  // Pagination (uniquement sur l'onglet "Disponibles")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { pendingAction, clearPending } = useNotif()
  const { user } = useAuth()
  const [historyMission, setHistoryMission] = useState(null)
  const [transferMission, setTransferMission] = useState(null)
  const [transferReason, setTransferReason] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [assistanceMission, setAssistanceMission] = useState(null)
  const [assistanceView, setAssistanceView] = useState('choice') // 'choice' | 'transfer'
  const [ticketMission, setTicketMission] = useState(null)
  const [bonusCampaign, setBonusCampaign] = useState({ active: false, percent: 0 })

  useEffect(() => { missionsAPI.fiveStarBonus().then(({ data }) => setBonusCampaign(data)).catch(() => {}) }, [])

  const doTransfer = async () => {
    if (!transferReason) { toast(t('oeilMissions.toasts.selectReasonRequired'), 'error'); return }
    setTransferring(true)
    try {
      await missionsAPI.transfer(transferMission.id, { reason: transferReason })
      toast(t('oeilMissions.toasts.transferReported'), 'info')
      setTransferMission(null)
      setTransferReason('')
      load()
    } catch (err) {
      toast(err.response?.data?.error || t('oeilMissions.toasts.genericError'), 'error')
    } finally { setTransferring(false) }
  }
  const [summaryMission, setSummaryMission] = useState(null)




  // Ouvrir le chat depuis une notification

useEffect(() => {
  if (!pendingAction || pendingAction.type !== 'chat') return
  const id = pendingAction.missionId
  if (!id) { clearPending(); return }

  setTab('active')
  const found = missions.find((m) => m.id === id) || priorityMissions.find((m) => m.id === id)
  if (found) {
    setChatMission(found)
    clearPending()
  } else {
    missionsAPI.get(id)
      .then(({ data }) => setChatMission(data.mission || data))
      .catch(() => {})
      .finally(() => clearPending())
  }
}, [pendingAction, missions, priorityMissions])

const load = useCallback((t) => {
  setLoading(true)
  setError('')

  // Charger les compteurs de tous les onglets en parallèle
  Promise.all([
    missionsAPI.list({ mode: 'available', is_priority: true, limit: 200 }),
      missionsAPI.list({ mode: 'available', limit: 200 }),
      missionsAPI.list({ mode: 'mine', limit: 200 }),
      missionsAPI.list({ mode: 'mine', status: 'completed', limit: 200 }),
  ]).then(([prioRes, availRes, activeRes, doneRes]) => {
    const prio = (prioRes.data.missions || []).filter(m => m.is_priority)
    setPriorityMissions(prio)
    setCounts({
      priority:  prio.length,
      available: (availRes.data.missions || []).filter(m => !m.is_priority).length,
      active:    (activeRes.data.missions || []).filter(m => ['assigned','en_route','active'].includes(m.status)).length,
      done:      (doneRes.data.missions || []).length,
    })
  }).catch(() => {})

  let params = {}
  if (t === 'priority') {
    params = { mode: 'available', is_priority: true }
  } else if (t === 'available') {
      // Tri fixe par date d'exécution la plus proche (missions urgentes en premier)
      params = { mode: 'available', sort: 'scheduled_asc', page, limit: 20, ...(quartier ? { quartier } : {}) }
  } else if (t === 'active') {
      params = { mode: 'mine', limit: 200 } // Aligné avec le compteur pour éviter la troncature par défaut (limit=20)
  } else {
      params = { mode: 'mine', status: 'completed', limit: 200 } // Aligné avec le compteur pour éviter la troncature par défaut (limit=20)
  }
  return missionsAPI.list(params)
      .then(({ data }) => {
        if (t === 'available') setTotalPages(data.pages || 1)
        let ms = data.missions || []
        if (t === 'priority') {
        ms = ms.filter(m => m.is_priority)
      } else if (t === 'available') {
        ms = ms.filter(m => !m.is_priority)
      } else if (t === 'active') {
        ms = ms.filter((m) => ['assigned','en_route','active','sous_reclamation'].includes(m.status))
      }
      setMissions(ms)
    })
    .catch((err) => {
      const msg = err.response?.data?.error || t('oeilMissions.toasts.loadingError')
      setError(msg)
      toast(msg, 'error')
    })
    .finally(() => setLoading(false))
}, [quartier, page])

  // Revenir à la page 1 si le filtre quartier change (évite une page vide hors limites)
  useEffect(() => { setPage(1) }, [quartier])




 // refuser les missions par l'oeil

  useEffect(() => { load(tab) }, [tab, load])


  const refuse = async (id, isAvailable = false) => {
    try {
      await missionsAPI.refuse(id, isAvailable)
      setMissions((prev) => prev.filter((m) => m.id !== id))
      toast(isAvailable ? t('oeilMissions.toasts.missionIgnored') : t('oeilMissions.toasts.missionRefused'), 'info')
    } catch {
      toast(t('oeilMissions.toasts.genericError'), 'error')
    }
  }

const interest = async (id) => {
    if (!complianceMission) { setComplianceMission(id); return }
    setComplianceMission(null)
    try {
      await missionsAPI.interest(id)
      setMissions((prev) => prev.map((m) => m.id === id ? { ...m, interested: true } : m))
      toast(t('oeilMissions.toasts.interestExpressed'), 'success')
    } catch (err) {
      toast(err.response?.data?.error || t('oeilMissions.toasts.genericError'), 'error')
    }
  }


const [complianceAdvance, setComplianceAdvance] = useState(null)

const advance = async (mission, bypassed = false) => {
  const next = {
    assigned: 'en_route',
    en_route: 'active',
    active:   'completed',
  }[mission.status]

    if (!next) { toast(t('oeilMissions.toasts.invalidStatus'), 'error'); return }

    // Afficher compliance quand l'Œil passe en "en_route"
    if (next === 'en_route' && !bypassed) {
      setComplianceAdvance(mission)
      return
    }

  const labels = {
    en_route:  t('oeilMissions.advanceStatusLabels.enRoute'),
    active:    t('oeilMissions.advanceStatusLabels.active'),
    completed: t('oeilMissions.advanceStatusLabels.completed'),
  }

  // Bloquer si rapport obligatoire non soumis
  if (next === 'completed') {
    const isAudit  = mission.type === 'audit'
    const isAirbnb = ['airbnb','booking'].some(s => mission.subcategory?.toLowerCase().includes(s.toLowerCase()))

    if (isAudit || isAirbnb) {
      try {
        const { data: rData } = await reportsAPI.get(mission.id)

        if (!rData.report || !rData.report.submitted) {
          const url = isAudit
            ? `/oeil/missions/${mission.id}/audit`
            : `/oeil/missions/${mission.id}/rapport`
          toast(t('oeilMissions.toasts.reportRequiredBeforeComplete'), 'error')
          setTimeout(() => navigate(url), 300)
          return
        }

      } catch {
        toast(t('oeilMissions.toasts.cannotVerifyReport'), 'error')
        return
      }
    }
  }

try {
    await missionsAPI.status(mission.id, { status: next })
    if (next === 'completed') {
      setMissions((prev) => prev.filter((m) => m.id !== mission.id))
      setTab('done')
      load('done')
    } else {
      setMissions((prev) => prev.map((m) => m.id === mission.id ? { ...m, status: next } : m))
    }
    toast(labels[next], 'success')
  } catch (err) {
    const msg = err.response?.data?.error || t('oeilMissions.toasts.genericError')
    toast(msg, 'error')
    if (msg.includes('rapport')) {
      const isAudit  = mission.type === 'audit'
      const isAirbnb = ['airbnb','booking'].some(s => mission.subcategory?.toLowerCase().includes(s.toLowerCase()))
      if (isAudit)  navigate(`/oeil/missions/${mission.id}/audit`)
      if (isAirbnb) navigate(`/oeil/missions/${mission.id}/rapport`)
    }
  }
}



  const emptyProps = {
    priority:  { icon:'🟢', title: t('oeilMissions.empty.priority.title'),  desc: t('oeilMissions.empty.priority.desc')  },
    available: { icon:'🎯', title: t('oeilMissions.empty.available.title'), desc: t('oeilMissions.empty.available.desc') },
    active:    { icon:'📋', title: t('oeilMissions.empty.active.title'),    desc: t('oeilMissions.empty.active.desc')    },
    done:      { icon:'✅', title: t('oeilMissions.empty.done.title'),      desc: t('oeilMissions.empty.done.desc')      },
  }

  const advanceLabel = {
    assigned: t('oeilMissions.advanceLabel.assigned'),
    en_route: t('oeilMissions.advanceLabel.enRoute'),
    active:   t('oeilMissions.advanceLabel.active'),
  }

  return (
    <AppLayout>
      <Topbar title={t('oeilMissions.title')} />
      <div className="p-4 md:p-6">
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit mb-6 flex-wrap">
          {TABS.map((tabId) => (
            <button key={tabId} onClick={() => setTab(tabId)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                tab === tabId ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'
              }`}>
              {tabId === 'priority' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
              {t(`oeilMissions.tabs.${tabId}`)}
              {tabId === 'priority' && counts.priority > 0 && (
                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                  {counts.priority}
                </span>
              )}
              {tabId !== 'priority' && counts[tabId] > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === tabId
                    ? 'bg-[#FF4D00]/20 text-[#FF4D00]'
                    : 'bg-white/10 text-[#AAA]'
                }`}>
                  {counts[tabId]}
                </span>
              )}
            </button>
          ))}
        </div>
        {tab === 'priority' && (
  priorityMissions.length === 0 ? (
    <EmptyState icon="🟢" title={t('oeilMissions.empty.priority.title')} description={t('oeilMissions.empty.priority.desc')} />
  ) : (
    <div className="space-y-3">
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 mb-4">
        <p className="text-xs text-red-400 font-semibold">{t('oeilMissions.priorityBanner.text')}</p>
        <p className="text-xs text-[#AAA] mt-0.5">{t('oeilMissions.priorityBanner.subtext')}</p>
      </div>
      {priorityMissions.map((m) => (
        <div key={m.id} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">{t('oeilMissions.priorityBanner.badge')}</span>
                <span className="font-semibold text-sm truncate">{m.title}</span>
              </div>
              <div className="text-xs text-[#AAA] space-y-0.5">
                <div>📍 {translateLocation(m.city, i18n.language)} {m.quartier ? `· ${translateLocation(m.quartier, i18n.language)}` : ''}</div>
                {m.scheduled_at && (
                  <div>📅 {new Date(m.scheduled_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })} à {new Date(m.scheduled_at).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}</div>
                )}
                {m.transfer_deadline && (
                  <div className="text-red-400">⏱️ Expire à {new Date(m.transfer_deadline).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}</div>
                )}
              </div>
            </div>
            <div className="text-green-400 font-bold whitespace-nowrap text-sm">
              {parseFloat(m.oeil_earning || m.price).toFixed(0)} MAD
            </div>
          </div>
          {bonusCampaign.active && (
            <div className="text-[11px] text-[#FF4D00] mb-2">
              {t('oeilDashboard.fiveStarBonusHint', { bonus: (parseFloat(m.oeil_earning || m.price) * bonusCampaign.percent / 100).toFixed(0) })}
            </div>
          )}
          <button
            onClick={() => user?.is_verified ? missionsAPI.interest(m.id).then(() => { toast(t('oeilMissions.toasts.interestExpressedShort'), 'success'); load(tab) }).catch(err => toast(err.response?.data?.error || t('oeilMissions.toasts.genericError'), 'error')) : navigate('/oeil/verification-identite')}
            className="btn btn-sm w-full justify-center bg-red-500 text-white hover:bg-red-600"
          >
            {t('oeilMissions.priorityBanner.interestButton')}
          </button>
        </div>
      ))}
    </div>
  )
)}    
    {tab === 'available' && (
      <div className="mb-4">
        <select
          className="input max-w-[200px]"
          value={quartier}
          onChange={(e) => setQuartier(e.target.value)}
        >
          <option value="">{t('oeilMissions.filters.allQuartiers')}</option>
          {(VILLES[user?.city] || []).map((q) => (
            <option key={q} value={q}>{translateLocation(q, i18n.language)}</option>
          ))}
        </select>
      </div>
    )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-sm text-red-400">
            ❌ {error}
          </div>
        )}

        {tab !== 'priority' && (loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : missions.length === 0 ? (
          <EmptyState icon={emptyProps[tab].icon} title={emptyProps[tab].title} description={emptyProps[tab].desc} />
        ) : (
          <div className="space-y-3">
            {missions.map((m) => (
              <div key={m.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 bg-[#222] rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {TYPE_ICONS[m.type] || '📋'}
                    </div>
                    <div className="min-w-0">
                      
                      <div className="font-semibold text-sm flex items-center gap-2 flex-wrap">
                        {m.title}
                        {m.is_urgent && <span className="badge badge-orange text-[10px]">{t('oeilMissions.card.urgentBadge')}</span>}
                        {m.under_surveillance && <span className="badge badge-red text-[10px]">{t('oeilMissions.card.underSurveillanceBadge')}</span>}
                      </div>

                      
                        <div className="text-xs text-[#AAA] mt-1 space-y-0.5">
                        <div className="flex flex-wrap gap-3">
                          <span>📍 {translateLocation(m.city, i18n.language)}{m.quartier ? ` · ${translateLocation(m.quartier, i18n.language)}` : ''}</span>
                          <span>📅 {m.scheduled_at ? `${new Date(m.scheduled_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })} à ${new Date(m.scheduled_at).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}` : '—'}</span>
                          {m.client_name && <span>👤 {m.client_name}</span>}
                          {tab !== 'available' && <StatusBadge status={m.status} validated={!!m.validated_at} role="oeil" />}
                        </div>
                        {m.address && <div>🏠 {m.address}</div>}
                        {m.description && <div className="text-[#666] line-clamp-2">💬 {m.description}</div>}
                      </div>
                      
                      {m.description && (
                        <p className="text-xs text-[#777] mt-1 line-clamp-1">{m.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">

                    <div className="text-green-400 font-bold text-base">{parseFloat(m.oeil_earning || m.price).toFixed(0)} MAD</div>
                    <div className="text-[11px] text-[#AAA]">{t('oeilMissions.card.yourEarning')}</div>
                    {tab === 'available' && bonusCampaign.active && (
                      <div className="text-[11px] text-[#FF4D00] mt-1 max-w-[140px]">
                        {t('oeilDashboard.fiveStarBonusHint', { bonus: (parseFloat(m.oeil_earning || m.price) * bonusCampaign.percent / 100).toFixed(0) })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                  
                  {tab === 'available' && (
                      <>
                        <button
                          onClick={() => interest(m.id)}
                          disabled={m.interested || m.has_interested}
                          className="btn btn-sm flex-1 justify-center disabled:opacity-50 bg-green-500 text-white hover:bg-green-600"
                        >
                          {(m.interested || m.has_interested) ? t('oeilMissions.card.requestSent') : t('oeilMissions.card.interested')}
                        </button>
                        <button
                        onClick={() => refuse(m.id, true)}
                        className="btn btn-sm flex-1 justify-center bg-red-500 text-white hover:bg-red-600"
                      >
                        {t('oeilMissions.card.ignore')}
                      </button>


                      </>
                    )}

                  

                  {tab === 'active' && (
                    <>
                      <button onClick={() => setChatMission(m)} className="btn btn-ghost btn-sm">{t('oeilMissions.card.chat')}</button>
                      <button onClick={() => setHistoryMission(m)} className="btn btn-ghost btn-sm">🕐</button>


                        {['en_route','active'].includes(m.status) && ['airbnb','booking','Airbnb','Booking'].some(s => m.subcategory?.toLowerCase().includes(s.toLowerCase())) && (
                          <button onClick={() => navigate(`/oeil/missions/${m.id}/rapport`)} className="btn btn-ghost btn-sm">
                            {t('oeilMissions.card.reportButton')}
                          </button>
                        )}
                        {['en_route','active'].includes(m.status) && m.type === 'audit' && (
                          <button onClick={() => navigate(`/oeil/missions/${m.id}/audit`)} className="btn btn-ghost btn-sm">
                            {t('oeilMissions.card.auditButton')}
                          </button>
                        )}

                      <button className="btn btn-ghost btn-sm">{t('oeilMissions.card.photosButton')}</button>
                      {advanceLabel[m.status] && (
                        <button onClick={() => advance(m)} className="btn btn-primary btn-sm flex-1 justify-center">
                          {advanceLabel[m.status]}
                        </button>
                      )}
                      {m.status === 'assigned' && (
                        <button onClick={() => refuse(m.id)} className="btn btn-ghost btn-sm text-red-400">
                          {t('oeilMissions.card.refuse')}
                        </button>
                      )}
                    </>
                  )}
                  {tab === 'active' && ['assigned','en_route','active'].includes(m.status) && (
                    <button
                      onClick={() => setAssistanceMission(m)}
                      className="text-xs text-[#555] hover:text-orange-400 transition-colors mt-2 w-full text-center"
                    >
                      {t('oeilMissions.card.askAssistance')}
                    </button>
                  )}


                  {tab === 'done' && (
                    <button onClick={() => setSummaryMission(m)} className="btn btn-ghost btn-sm">{t('oeilMissions.card.summaryButton')}</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
        {tab === 'available' && <Pagination page={page} pages={totalPages} onPageChange={setPage} />}
      </div>
      {historyMission && (
        <MissionHistoryModal mission={historyMission} onClose={() => setHistoryMission(null)} />
      )}

      {assistanceMission && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#181818] border border-orange-500/30 rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto">

            {/* Choix initial */}
            {assistanceView === 'choice' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl">🆘</div>
                  <div>
                    <h2 className="font-bold text-base">{t('oeilMissions.assistanceModal.title')}</h2>
                    <p className="text-xs text-[#AAA]">{assistanceMission.title}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => { setTicketMission(assistanceMission); setAssistanceMission(null) }}
                    className="w-full bg-[#222] hover:bg-[#2A2A2A] rounded-xl p-4 text-start transition-colors border border-white/5"
                  >
                    <p className="text-sm font-semibold text-orange-400 mb-1">{t('oeilMissions.assistanceModal.reportProblem.label')}</p>
                    <p className="text-xs text-[#AAA]">{t('oeilMissions.assistanceModal.reportProblem.desc')}</p>
                  </button>
                  <button
                    onClick={() => { setAssistanceView('transfer'); setTransferReason('') }}
                    className="w-full bg-[#222] hover:bg-[#2A2A2A] rounded-xl p-4 text-start transition-colors border border-white/5"
                  >
                    <p className="text-sm font-semibold text-red-400 mb-1">{t('oeilMissions.assistanceModal.majorImpediment.label')}</p>
                    <p className="text-xs text-[#AAA]">{t('oeilMissions.assistanceModal.majorImpediment.desc')}</p>
                  </button>
                </div>
                <button onClick={() => setAssistanceMission(null)} className="btn btn-ghost w-full justify-center mt-4">{t('oeilMissions.assistanceModal.cancel')}</button>
              </>
            )}

            {/* Empêchement majeur */}
            {assistanceView === 'transfer' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => setAssistanceView('choice')} className="text-[#AAA] hover:text-white">←</button>
                  <div>
                    <h2 className="font-bold text-base">{t('oeilMissions.assistanceModal.transferView.title')}</h2>
                    <p className="text-xs text-[#AAA]">{assistanceMission.title}</p>
                  </div>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4">
                  <p className="text-xs text-white/80">{t('oeilMissions.assistanceModal.transferView.warning')}</p>
                </div>
                <div className="bg-[#222] rounded-xl p-3 mb-4 space-y-1">
                  <p className="text-xs text-[#AAA]">{t('oeilMissions.assistanceModal.transferView.consequencesLabel')}</p>
                  {assistanceMission.status === 'assigned'
                    ? <p className="text-xs text-white/70">{t('oeilMissions.assistanceModal.transferView.noPay')}</p>
                    : <>
                        <p className="text-xs text-white/70">{t('oeilMissions.assistanceModal.transferView.halfPay')}</p>
                        <p className="text-xs text-white/70">{t('oeilMissions.assistanceModal.transferView.cooldown')}</p>
                      </>
                  }
                  <p className="text-xs text-white/70">{t('oeilMissions.assistanceModal.transferView.noted')}</p>
                </div>
                <div className="mb-5">
                  <label className="label">{t('oeilMissions.assistanceModal.transferView.reasonLabel')}</label>
                  <select className="input" value={transferReason} onChange={e => setTransferReason(e.target.value)}>
                    <option value="">{t('oeilMissions.assistanceModal.transferView.reasonPlaceholder')}</option>
                    <option value="Urgence médicale">{t('oeilMissions.assistanceModal.transferView.reasons.medical')}</option>
                    <option value="Accident / incident">{t('oeilMissions.assistanceModal.transferView.reasons.accident')}</option>
                    <option value="Problème de sécurité">{t('oeilMissions.assistanceModal.transferView.reasons.security')}</option>
                    <option value="Empêchement familial grave">{t('oeilMissions.assistanceModal.transferView.reasons.family')}</option>
                    <option value="Autre cas de force majeure">{t('oeilMissions.assistanceModal.transferView.reasons.other')}</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setAssistanceView('choice')} className="btn btn-ghost flex-1 justify-center">{t('oeilMissions.assistanceModal.transferView.back')}</button>
                  <button
                    onClick={async () => {
                      if (!transferReason) { toast(t('oeilMissions.toasts.selectReasonShort'), 'error'); return }
                      setTransferring(true)
                      try {
                        await missionsAPI.transfer(assistanceMission.id, { reason: transferReason })
                        toast(t('oeilMissions.toasts.transferReported'), 'info')
                        setAssistanceMission(null)
                        setAssistanceView('choice')
                        load(tab)
                      } catch (err) { toast(err.response?.data?.error || t('oeilMissions.toasts.genericError'), 'error') }
                      finally { setTransferring(false) }
                    }}
                    disabled={transferring || !transferReason}
                    className="btn btn-sm flex-1 justify-center bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {transferring ? t('oeilMissions.assistanceModal.transferView.confirming') : t('oeilMissions.assistanceModal.transferView.confirm')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

     
{summaryMission && (
  <MissionSummaryModal mission={summaryMission} onClose={() => setSummaryMission(null)} />
)}


  {complianceMission && (
    <ComplianceModal onAccept={() => interest(complianceMission)} />
  )}
  {complianceAdvance && (
    <ComplianceModal onAccept={() => { const m = complianceAdvance; setComplianceAdvance(null); advance(m, true) }} />
  )}

      {chatMission && (
        <ChatModal mission={chatMission} onClose={() => setChatMission(null)} />
      )}
      <NewTicketModal
        open={!!ticketMission}
        onClose={() => setTicketMission(null)}
        onCreated={() => { setTicketMission(null); load(tab) }}
        presetMissionId={ticketMission?.id}
        presetCategory="mission"
      />
    </AppLayout>
  )
}