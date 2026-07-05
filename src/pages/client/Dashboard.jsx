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


export default function ClientDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [missions, setMissions] = useState([])
  const [oeils, setOeils]       = useState([])
  const [stats, setStats]       = useState({ total:0, active:0, completed:0, budget:0 })
  const [loading, setLoading]   = useState(true)
  const [showNew, setShowNew]   = useState(false)
const [interestsMission, setInterestsMission] = useState(null)
  const [profileOeil, setProfileOeil] = useState(null)

  useEffect(() => {

    Promise.all([
      missionsAPI.list({ limit: 5 }),
      usersAPI.oeils({ limit: 3, verified: true }),
      usersAPI.clientStats().catch(() => ({ data: {} })),
    ])
      .then(([mRes, oRes, sRes]) => {
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
        })
      })
      .catch(() => toast(t('clientDashboard.errorLoading'), 'error'))
      .finally(() => setLoading(false))

  }, [])

  if (loading) return (
    <AppLayout>
      <Topbar title={t('clientDashboard.title')} />
      <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
    </AppLayout>
  )

  const activeMissions = missions.filter((m) => ['active','assigned','pending'].includes(m.status)).slice(0,3)

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
                      {t('clientDashboard.activeMissions.cityOeil', { city: m.city, oeil: m.oeil_name || t('clientDashboard.activeMissions.notAssigned') })}
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

          {/* Œils disponibles */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">{t('clientDashboard.availableOeils.title')}</h2>
              <a href="/client/oeils" className="text-xs text-[#FF4D00]">{t('clientDashboard.availableOeils.viewAll')}</a>
            </div>
            {oeils.length === 0 ? (
              <EmptyState icon="👁️" title={t('clientDashboard.availableOeils.emptyTitle')} description={t('clientDashboard.availableOeils.emptyDesc')} />
            ) : oeils.map((o) => (
              <div key={o.id} className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
                  <div className="cursor-pointer" onClick={() => setProfileOeil(o)}>
                    <Avatar name={`${o.first_name} ${o.last_name}`} size={36} src={o.avatar_url} />
                  </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{o.first_name} {o.last_name}</div>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <Stars value={o.rating_avg || 0} />
                    <span className="text-[11px] text-[#AAA]">
                      {t('clientDashboard.availableOeils.ratingMissions', { rating: o.rating_avg || '—', count: o.total_missions || 0 })}
                    </span>
                  </div>
                </div>
                <span className={`badge flex-shrink-0 ${o.is_available ? 'badge-green' : 'badge-gray'}`}>
                  {o.is_available ? t('clientDashboard.availableOeils.available') : t('clientDashboard.availableOeils.busy')}
                </span>
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
}}
  />
)}
      <OeilProfileModal oeil={profileOeil} onClose={() => setProfileOeil(null)} />
    </AppLayout>
  )
}