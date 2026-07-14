import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, usersAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, Avatar, Stars, toast } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import NewMissionModal from '../../components/missions/NewMissionModal'
import InterestsModal from '../../components/missions/InterestsModal'
import OeilProfileModal from '../../components/missions/OeilProfileModal'
import RateModal from '../../components/missions/RateModal'
import { translateLocation } from '../../constants/villesTranslations'

function formatTimeLeft(t, deadline, now) {
  const diffMs = new Date(deadline).getTime() - now
  if (diffMs <= 0) return t('clientDashboard.actionsRequired.expired')
  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  return t('clientDashboard.actionsRequired.timeLeft', { hours, minutes })
}

export default function ClientDashboard() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [missions, setMissions] = useState([])
  const [oeils, setOeils]       = useState([])
  const [stats, setStats]       = useState({ total:0, active:0, completed:0, budget:0, timeSavedMinutes:0 })
  const [actionsRequired, setActionsRequired] = useState({ to_validate: [], to_rate: [], to_choose_replacement: [] })
  const [loading, setLoading]   = useState(true)
  const [showNew, setShowNew]   = useState(false)
const [interestsMission, setInterestsMission] = useState(null)
  const [profileOeil, setProfileOeil] = useState(null)
  const [ratingMission, setRatingMission] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [validatingIds, setValidatingIds] = useState(new Set())

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(iv)
  }, [])

  const loadActionsRequired = () => {
    missionsAPI.actionsRequired()
      .then(({ data }) => setActionsRequired({
        to_validate: data.to_validate || [],
        to_rate: data.to_rate || [],
        to_choose_replacement: data.to_choose_replacement || [],
      }))
      .catch(() => {})
  }

  useEffect(() => {

    Promise.all([
      missionsAPI.list({ limit: 5 }),
      usersAPI.oeils({ limit: 3, verified: true }),
      usersAPI.clientStats().catch(() => ({ data: {} })),
      missionsAPI.actionsRequired().catch(() => ({ data: {} })),
    ])
      .then(([mRes, oRes, sRes, arRes]) => {
        const ms = mRes.data.missions || []
        const s  = sRes?.data || {}
        setMissions(ms)
        setOeils(oRes.data.oeils || [])
        setStats({
          total:     s.total     ?? ms.length,
          active:    s.active    ?? ms.filter(m => ['active','assigned','en_route'].includes(m.status)).length,
          completed: s.completed ?? ms.filter(m => m.status === 'completed').length,
          budget:    parseFloat(s.total_spent || 0),
          wallet:    parseFloat(s.wallet_balance || 0),
          timeSavedMinutes: parseInt(s.time_saved_minutes || 0, 10),
        })
        setActionsRequired({
          to_validate: arRes?.data?.to_validate || [],
          to_rate: arRes?.data?.to_rate || [],
          to_choose_replacement: arRes?.data?.to_choose_replacement || [],
        })
      })
      .catch(() => toast(t('clientDashboard.errorLoading'), 'error'))
      .finally(() => setLoading(false))

  }, [])

  const validateMission = async (id) => {
    if (!window.confirm(t('clientMissions.validateConfirm'))) return
    setValidatingIds((prev) => new Set(prev).add(id))
    try {
      await missionsAPI.validate(id)
      toast(t('clientMissions.validatedToast'), 'success')
      loadActionsRequired()
    } catch (err) {
      toast(err.response?.data?.error || t('clientMissions.errors.generic'), 'error')
    } finally {
      setValidatingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  if (loading) return (
    <AppLayout>
      <Topbar title={t('clientDashboard.title')} />
      <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
    </AppLayout>
  )

  const activeMissions = missions.filter((m) => ['active','assigned','pending'].includes(m.status)).slice(0,3)
  const { to_validate, to_rate, to_choose_replacement } = actionsRequired
  const hasActionsRequired = to_validate.length > 0 || to_rate.length > 0 || to_choose_replacement.length > 0

  return (
    <AppLayout>
      <Topbar
        title={t('clientDashboard.title')}
        actions={
          <button onClick={() => setShowNew(true)} className="btn btn-primary btn-sm">
            <span className="hidden sm:inline">{t('clientDashboard.newMissionButton')}</span>
            <span className="sm:hidden">{t('clientDashboard.newMissionButtonShort')}</span>
          </button>
        }
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">

        {/* Actions requises — visible seulement si au moins une action est en attente */}
        {hasActionsRequired && (
          <div className="card">
            <h2 className="font-semibold text-sm mb-4">{t('clientDashboard.actionsRequired.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {to_validate.map((m) => {
                const expired = m.deadline && (new Date(m.deadline).getTime() - now) <= 0
                return (
                <div key={`validate-${m.id}`} className={`bg-[#222] border border-orange-500/30 rounded-xl p-3 ${expired ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <span className="badge badge-orange mb-1.5 inline-block">⏳ {t('clientDashboard.actionsRequired.toValidate.badge')}</span>
                      <div className="font-semibold text-sm truncate">{m.title}</div>
                      <div className="text-xs text-[#AAA] mt-0.5">
                        {m.deadline ? formatTimeLeft(t, m.deadline, now) : t('clientDashboard.actionsRequired.toValidate.noDeadline')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => validateMission(m.id)}
                    disabled={validatingIds.has(m.id) || expired}
                    className="btn btn-primary btn-sm w-full justify-center disabled:opacity-50"
                  >
                    {validatingIds.has(m.id) ? '...' : t('clientDashboard.actionsRequired.toValidate.button')}
                  </button>
                </div>
              )})}

              {to_rate.map((m) => (
                <div key={`rate-${m.id}`} className="bg-[#222] border border-blue-500/30 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <span className="badge badge-blue mb-1.5 inline-block">⭐ {t('clientDashboard.actionsRequired.toRate.badge')}</span>
                      <div className="font-semibold text-sm truncate">{m.title}</div>
                      <div className="text-xs text-[#AAA] mt-0.5 truncate">{m.oeil_name}</div>
                    </div>
                  </div>
                  <button onClick={() => setRatingMission(m)} className="btn btn-primary btn-sm w-full justify-center">
                    {t('clientDashboard.actionsRequired.toRate.button')}
                  </button>
                </div>
              ))}

              {to_choose_replacement.map((m) => {
                const expired = m.candidate_window_ends_at && (new Date(m.candidate_window_ends_at).getTime() - now) <= 0
                return (
                <div key={`replacement-${m.id}`} className={`bg-[#222] border border-yellow-500/30 rounded-xl p-3 ${expired ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <span className="badge badge-yellow mb-1.5 inline-block">🔄 {t('clientDashboard.actionsRequired.toChooseReplacement.badge')}</span>
                      <div className="font-semibold text-sm truncate">{m.title}</div>
                      <div className="text-xs text-[#AAA] mt-0.5">
                        {formatTimeLeft(t, m.candidate_window_ends_at, now)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setInterestsMission(m)}
                    disabled={expired}
                    className="btn btn-primary btn-sm w-full justify-center disabled:opacity-50"
                  >
                    {t('clientDashboard.actionsRequired.toChooseReplacement.button')}
                  </button>
                </div>
              )})}
            </div>
          </div>
        )}

        {/* Stats — 2 colonnes mobile, 4 desktop */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {[
            { label: t('clientDashboard.stats.total'), value: stats.total,           color: 'text-white'     },
            { label: t('clientDashboard.stats.active'), value: stats.active,          color: 'text-[#FF4D00]' },
            { label: t('clientDashboard.stats.completed'), value: stats.completed,       color: 'text-green-400' },
            { label: t('clientDashboard.stats.totalSpent'), value: t('clientDashboard.stats.madValue', { value: Math.round(stats.budget || 0) }), color: 'text-green-400' },
            { label: t('clientDashboard.stats.wallet'), value: t('clientDashboard.stats.madValue', { value: Math.round(stats.wallet || 0) }), color: 'text-[#FF4D00]'  },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="text-[11px] text-[#AAA] mb-1 leading-tight">{s.label}</div>
              <div className={`text-xl md:text-2xl font-bold tracking-tight ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Temps économisé */}
        <div className="stat-card">
          <div className="text-[11px] text-[#AAA] mb-1 leading-tight">{t('clientDashboard.stats.timeSaved')}</div>
          {stats.timeSavedMinutes > 0 ? (
            <div className="text-xl md:text-2xl font-bold tracking-tight text-green-400">
              {t('clientDashboard.stats.timeSavedValue', { hours: Math.round(stats.timeSavedMinutes / 60) })}
            </div>
          ) : (
            <div className="text-xs text-[#AAA] mt-1">{t('clientDashboard.stats.timeSavedEmpty')}</div>
          )}
        </div>

        {/* Grille — 1 colonne mobile, 2 desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Missions en cours */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">{t('clientDashboard.activeMissions.title')}</h2>
              <a href="/client/missions" className="text-xs text-[#FF4D00]">{t('clientDashboard.activeMissions.viewAll')}</a>
            </div>
            {activeMissions.length === 0 ? (
              <EmptyState icon="📋" title={t('clientDashboard.activeMissions.emptyTitle')} description={t('clientDashboard.activeMissions.emptyDesc')} />
            ) : activeMissions.map((m) => (
              <div key={m.id} className="bg-[#222] rounded-xl p-3 mb-3 last:mb-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{m.title}</div>
                    <div className="text-xs text-[#AAA] mt-0.5 truncate">
                      {t('clientDashboard.activeMissions.cityOeil', { city: translateLocation(m.city, i18n.language), oeil: m.oeil_name || t('clientDashboard.activeMissions.notAssigned') })}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={m.status} />
                  </div>
                </div>
                  {m.status === 'pending' ? (
                    <button onClick={() => setInterestsMission(m)}
                      className="btn btn-primary btn-sm w-full justify-center">
                      {t('clientDashboard.activeMissions.viewInterested')}
                    </button>
                  ) : (
                    <a href="/client/missions" className="btn btn-primary btn-sm w-full justify-center">
                      {t('clientDashboard.activeMissions.viewButton')}
                    </a>
                  )}
              </div>
            ))}
          </div>

        </div>
        </div>

      <NewMissionModal open={showNew} onClose={() => setShowNew(false)} onCreated={(m) => {
        setMissions((ms) => [m, ...ms])
        setStats((s) => ({ ...s, total: s.total + 1 }))
        toast(t('clientDashboard.missionCreatedToast'), 'success')
      }} />


      {interestsMission && (
  <InterestsModal
    mission={interestsMission}
    onClose={() => setInterestsMission(null)}
   onHired={() => {
  setInterestsMission(null)
  setMissions(prev => prev.filter(m => m.id !== interestsMission?.id))
  loadActionsRequired()
}}
  />
)}
      {ratingMission && (
        <RateModal
          mission={ratingMission}
          onClose={() => setRatingMission(null)}
          onRated={() => { setRatingMission(null); loadActionsRequired() }}
        />
      )}
      <OeilProfileModal oeil={profileOeil} onClose={() => setProfileOeil(null)} />
    </AppLayout>
  )
}