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
import { translateLocation } from '../../constants/villesTranslations'


export default function ClientDashboard() {
  const { t, i18n } = useTranslation()
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