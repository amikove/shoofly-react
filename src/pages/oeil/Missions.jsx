import ChatModal from '../../components/missions/ChatModal'
import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, reportsAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, toast } from '../../components/ui'
import { useNotif } from '../../context/NotifContext'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import MissionHistoryModal from '../../components/missions/MissionHistoryModal'
import MissionSummaryModal from '../../components/missions/MissionSummaryModal'
import ComplianceModal from '../../components/missions/ComplianceModal'

const TABS = [
  { id: 'available', label: 'Disponibles' },
  { id: 'active',    label: 'En cours'    },
  { id: 'done',      label: 'Terminées'   },
]
const TYPE_ICONS = { immobilier:'🏠', file_attente:'⏳', audit:'🔎', personnalisee:'🎯' }
const VILLES = {
  'Rabat': ['Agdal','Hassan','Océan','Souissi','Aviation','Hay Riad','Youssoufia','Akkari','Diour Jamaa','Médina','Orangers','Ryad','Centre Ville','Hay Nahda','Hay Fadoul','Takaddoum','Hay Karima','Hay Salama','Mabella','Hay Ennakhil'],
  'Salé': ['Bettana','Hay Salam','Tabriquet','Laâyoune','Médina','Kébibat','Hssaine','Sidi Moussa','Bab Lamrissa','Hay Karima','Hay Arrahma','Hay Al Majd','Attacharouk','Hay Essalam','Layayda','Ouled Mtaa','Hay Nasr','Sidi Taibi','Hay Al Wifaq','Hay Al Massira'],
  'Témara': ['Hay Al Fath','Massira','Oumassa','Centre Ville','Ain Attig','Menzeh','Hay Farah','Hay Al Amal','Hay Essalam','Hay Ennour','Hay Nakhil','Résidence Al Wifaq','Hay Nahda','Hay Rihane','Sidi Yahya','Mansouria'],
  'Casablanca': ['Maarif','Bourgogne','Gauthier','Hay Hassani','Ain Chock','Ain Sebaa','Anfa','Bernoussi','Bouskoura','CIL','Californie','Derb Sultan','Hay Mohammadi','Moulay Rachid','Sidi Belyout','Sbata','Médina','Oulfa','Ben M\'sick','Sidi Bernoussi','Roches Noires','Polo','Racine','Val Fleuri','Riviera','Hay Al Farah','Hay Ennakhil','Hay Inara','Lissasfa','Lahraouiyine','Sidi Maarouf','Dar Bouazza','Belvédère','Palmier','Sidi Othmane','Hay El Hana','Zenata','Tit Mellil','Hay Moulay Abdallah','Sidi Moumen','Nassim'],
  'Marrakech': ['Guéliz','Hivernage','Médina','Mellah','Daoudiate','Massira','Syba','M\'hamid','Targa','Azzouzia','Palmeraie','Hay Charaf','Douar Lahna','Sidi Youssef Ben Ali','Bab Doukkala','Ménara','Hay Al Majd','Tamansourt','Iziki','Hay Hassani','Hay Mohammadi','Mouassine','Bab Ghmat','Kennaria','Riad Zitoun','Arset El Maach','Hay Houta','Résidence Al Wifaq'],
  'Fès': ['Médina','Ville Nouvelle','Jdid','Saïss','Narjiss','Bensouda','Aouinat Hajjaj','Zouagha','Hay Amal','Hay Mahatta','Atlas','Agdal','Hay Nakhil','Sidi Brahim','Hay Essalam','Ain Chkef','Hay Wifaq','Hay Massira','Dokkarat','Hay Moulay Slimane','Hay Ennahda','Hay Karima','Oued Fès','Hay Al Farah','Ain Kadous'],
  'Meknès': ['Hamria','Médina','Ville Nouvelle','Ismaïlia','Marjane','Bassatine','Hay Salam','Hay Nour','Hay Wifaq','Hay Amal','Hay Inara','Résidence Ismaïlia','Hay Al Majd','Hay Doum','Riad','Hay Mansour','Hay Zitoune','Ain Smen','Borj Moulay Omar','Hay Karima'],
  'Tanger': ['Médina','Malabata','Marshan','Gzenaya','Mesnana','Iberia','California','Achakar','Boukhalef','Hay Karima','Bni Makada','Hay Amal','Dradeb','Ain Ktiouet','Hay Nakhil','Moujahidine','Val Fleuri','Hay Almohades','Hay Nahda','Rmilat','Souani','Branes','Hay Hassani','Hay Mohammadi','Charf','Tanger City Center'],
  'Agadir': ['Hay Mohammadi','Talborjt','Dakhla','Charaf','Bensergao','Anza','Tilila','Founty','Hay Salam','Hay Amal','Hay Al Massira','Tikiouine','Hay Hassani','Adrar','Cité Suisse','Résidence Yasmina','Hay Yassmine','Aourir','Hay Nahda','Hay Al Wifaq','Ait Melloul','Inezgane'],
  'Oujda': ['Médina','Lazaret','Sidi Maâfa','Hay Al Qods','Isly','Université','Hay Salam','Hay Amal','Hay Nakhil','Hay Wifaq','Ain Sfa','Hay Essalam','Hay Al Majd','Hay Riad','Sidi Ziane','Hay Karima','Hay Mohammadi','Hay Andalous','Ennakhil'],
  'Kénitra': ['Médina','Hay Mahatta','Hay Salam','Bir Rami','Saknia','Hay Amal','Hay Nakhil','Hay Wifaq','Hay Karima','Centre Ville','Hay Nassim','Hay El Wahda','Hay Hassani','Maamoura','Hay Mohammadi','Hay Al Farah','Résidence Al Wifaq','Hay Essalam'],
  'Tétouan': ['Médina','Ensanche','Martil','Mhannech','Azla','Hay Salam','Hay Amal','Hay Nahda','Hay Nakhil','Hay Wifaq','Hay Karima','Dersa','Touabel','Sidi Mandri','Hay Al Majd','Hay Mohammadi','Hay Hassani','Résidence Al Farah','Ain Lhout','Hay Riad'],
  'Mohammedia': ['Centre Ville','Ain Harrouda','Sidi Moumen','Médina','Hay Hassani','Hay Mohammadi','Hay Salam','Hay Amal','Hay Wifaq','Hay Nakhil','Hay Karima','Hay Al Majd','Hay Nassim','Sidi Maarouf','Hay Essalam','Résidence Al Wifaq','Hay Nahda','Ain Sbiaa'],
  'El Jadida': ['Médina','Hay Hassani','Azemmour','Centre Ville','Hay Salam','Hay Amal','Hay Mohammadi','Hay Wifaq','Hay Nakhil','Hay Karima','Hay Al Majd','Haouzia','Hay Essalam','Bir Jdid','Résidence Al Farah','Hay Nahda','Sidi Bouzid'],
  'Safi': ['Médina','Hay El Amal','Arsat Lhamra','Centre Ville','Hay Hassani','Hay Mohammadi','Hay Salam','Hay Wifaq','Hay Nakhil','Hay Karima','Hay Al Majd','Hay Essalam','Hay Nahda','Résidence Al Wifaq','Sidi Bouzid','Hay Inara','Jrifat'],
  'Béni Mellal': ['Centre Ville','Hay Amal','Oulad Yaïch','Médina','Hay Hassani','Hay Salam','Hay Mohammadi','Hay Wifaq','Hay Nakhil','Hay Karima','Hay Al Majd','Hay Essalam','Hay Nahda','Taboun','Ain Asserdoun','Résidence Al Farah','Hay Inara','Hay Riad'],
  'Nador': ['Centre Ville','Médina','Hay Salam','Hay Amal','Hay Nakhil','Hay Wifaq','Hay Karima','Hay Mohammadi','Hay Hassani','Beni Chiker','Hay Al Majd','Hay Nahda','Hay Essalam','Hay Riad','Résidence Al Wifaq','Azghangan'],
  'Settat': ['Centre Ville','Hay Salam','Hay Amal','Hay Nakhil','Hay Wifaq','Hay Karima','Hay Mohammadi','Hay Hassani','Hay Al Majd','Hay Nahda','Hay Essalam','Médina','Résidence Al Farah','Hay Riad'],
  'Laâyoune': ['Centre Ville','Hay Salam','Hay Amal','Hay Nakhil','Hay Wifaq','Hay Karima','Hay Mohammadi','Hay Hassani','Hay Al Majd','Hay Nahda','Hay Essalam','Cité Militaire','Résidence Al Wifaq','Hay Riad'],
}

export default function OeilMissions() {
  const [complianceMission, setComplianceMission] = useState(null)
  const [tab, setTab]           = useState('available')
  const [missions, setMissions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [chatMission, setChatMission] = useState(null)
  const navigate = useNavigate()
  const [quartier, setQuartier] = useState('')
  const { pendingChatMissionId, clearPendingChat, getPending } = useNotif()
  const { user } = useAuth()
  const [historyMission, setHistoryMission] = useState(null)
  const [summaryMission, setSummaryMission] = useState(null)




  // Ouvrir le chat depuis une notification

useEffect(() => {
  const handler = (e) => {
    const id = e.detail
    if (id) {
      setTab('active')
      missionsAPI.get(id)
        .then(({ data }) => setChatMission(data.mission || data))
        .catch(() => {})
    }
  }
  window.addEventListener('shoofly-open-chat', handler)
  return () => window.removeEventListener('shoofly-open-chat', handler)
}, [])

const load = useCallback((t) => {
  setLoading(true)
  setError('')
  let params = {}
  if (t === 'available') {
    params = { mode: 'available', ...(quartier ? { quartier } : {}) }
  } else if (t === 'active') {
    params = { mode: 'mine' }
  } else {
    params = { mode: 'mine', status: 'completed' }
  }
  return missionsAPI.list(params)
    .then(({ data }) => {
      let ms = data.missions || []
      if (t === 'active') {
        ms = ms.filter((m) => ['assigned','en_route','active','sous_reclamation'].includes(m.status))
      }
      setMissions(ms)
    })
    .catch((err) => {
      const msg = err.response?.data?.error || 'Erreur de chargement'
      setError(msg)
      toast(msg, 'error')
    })
    .finally(() => setLoading(false))
}, [quartier])




 // refuser les missions par l'oeil

  useEffect(() => { load(tab) }, [tab, load])


  const refuse = async (id, isAvailable = false) => {
    try {
      await missionsAPI.refuse(id, isAvailable)
      setMissions((prev) => prev.filter((m) => m.id !== id))
      toast(isAvailable ? 'Mission ignorée' : 'Mission refusée', 'info')
    } catch {
      toast('Erreur', 'error')
    }
  }

const interest = async (id) => {
    if (!complianceMission) { setComplianceMission(id); return }
    setComplianceMission(null)
    try {
      await missionsAPI.interest(id)
      setMissions((prev) => prev.map((m) => m.id === id ? { ...m, interested: true } : m))
      toast('Intérêt exprimé 👁️ Le client va vous contacter.', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    }
  }


  const advance = async (mission) => {
  const next = {
    assigned: 'en_route',
    en_route: 'active',
    active:   'completed',
  }[mission.status]

  if (!next) { toast('Statut invalide', 'error'); return }

  const labels = {
    en_route:  'En route vers la mission ✓',
    active:    'Mission démarrée ✓',
    completed: 'Mission terminée ! Bien joué 🎉',
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
          toast('Vous devez soumettre le rapport avant de terminer la mission 📋', 'error')
          setTimeout(() => navigate(url), 300)
          return
        }

      } catch {
        toast('Impossible de vérifier le rapport', 'error')
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
    const msg = err.response?.data?.error || 'Erreur'
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
    available: { icon:'🎯', title:'Aucune mission disponible', desc:'Toutes les missions ont été assignées. Revenez bientôt !' },
    active:    { icon:'📋', title:'Aucune mission en cours',   desc:'Acceptez une mission pour commencer.'                    },
    done:      { icon:'✅', title:'Aucune mission terminée',   desc:'Vos missions complétées apparaîtront ici.'               },
  }

  const advanceLabel = {
    assigned: '🚗 Je suis en route',
    en_route: '▶️ Démarrer la mission',
    active:   '✓ Terminer la mission',
  }

  return (
    <AppLayout>
      <Topbar title="Missions" />
      <div className="p-4 md:p-6">
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit mb-6">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === t.id ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'
              }`}>
              {t.label}
              {tab === t.id && !loading && (
                <span className="ml-1.5 text-[10px] bg-[#FF4D00]/20 text-[#FF4D00] px-1.5 py-0.5 rounded-full">
                  {missions.length}
                </span>
              )}
            </button>
          ))}
        </div>

{tab === 'available' && (
  <div className="mb-4">
    <select
      className="input max-w-[200px]"
      value={quartier}
      onChange={(e) => setQuartier(e.target.value)}
    >
      <option value="">Tous les quartiers</option>
      {(VILLES[user?.city] || []).map((q) => (
        <option key={q} value={q}>{q}</option>
      ))}
    </select>
  </div>
)}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-sm text-red-400">
            ❌ {error}
          </div>
        )}

        {loading ? (
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
                        {m.is_urgent && <span className="badge badge-orange text-[10px]">🚨 Urgent</span>}
                      </div>
                      <div className="text-xs text-[#AAA] mt-1 flex flex-wrap gap-3">
                        <span>📍 {m.city}</span>
                        <span>📅 {m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString('fr-MA') : '—'}</span>
                        {m.client_name && <span>👤 {m.client_name}</span>}
                        {tab !== 'available' && <StatusBadge status={m.status} validated={!!m.validated_at} role="oeil" />}
                      </div>
                      {m.description && (
                        <p className="text-xs text-[#777] mt-1 line-clamp-1">{m.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">

                    <div className="text-green-400 font-bold text-base">{parseFloat(m.oeil_earning || m.price).toFixed(0)} MAD</div>
                    <div className="text-[11px] text-[#AAA]">votre gain</div>
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
                          {(m.interested || m.has_interested) ? '✅ Demande envoyée' : '👁️ Je suis intéressé'}
                        </button>
                        <button
                        onClick={() => refuse(m.id, true)}
                        className="btn btn-sm flex-1 justify-center bg-red-500 text-white hover:bg-red-600"
                      >
                        ✕ Ignorer
                      </button>


                      </>
                    )}

                  

                  {tab === 'active' && (
                    <>
                      <button onClick={() => setChatMission(m)} className="btn btn-ghost btn-sm">💬 Chat</button>
                      <button onClick={() => setHistoryMission(m)} className="btn btn-ghost btn-sm">🕐</button>
                      

                        {['en_route','active'].includes(m.status) && ['airbnb','booking','Airbnb','Booking'].some(s => m.subcategory?.toLowerCase().includes(s.toLowerCase())) && (
                          <button onClick={() => navigate(`/oeil/missions/${m.id}/rapport`)} className="btn btn-ghost btn-sm">
                            📋 Rapport
                          </button>
                        )}
                        {['en_route','active'].includes(m.status) && m.type === 'audit' && (
                          <button onClick={() => navigate(`/oeil/missions/${m.id}/audit`)} className="btn btn-ghost btn-sm">
                            📋 Audit
                          </button>
                        )}

                      <button className="btn btn-ghost btn-sm">📸 Photos</button>
                      {advanceLabel[m.status] && (
                        <button onClick={() => advance(m)} className="btn btn-primary btn-sm flex-1 justify-center">
                          {advanceLabel[m.status]}
                        </button>
                      )}
                      {m.status === 'assigned' && (
                        <button onClick={() => refuse(m.id)} className="btn btn-ghost btn-sm text-red-400">
                          ✕ Refuser
                        </button>
                      )}
                    </>
                  )}


                  {tab === 'done' && (
                    <button onClick={() => setSummaryMission(m)} className="btn btn-ghost btn-sm">📄 Résumé</button>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {historyMission && (
        <MissionHistoryModal mission={historyMission} onClose={() => setHistoryMission(null)} />
      )}

{summaryMission && (
  <MissionSummaryModal mission={summaryMission} onClose={() => setSummaryMission(null)} />
)}


      {complianceMission && (
  <ComplianceModal onAccept={() => interest(complianceMission)} />
      )}

      {chatMission && (
        <ChatModal mission={chatMission} onClose={() => setChatMission(null)} />
      )}
    </AppLayout>
  )
}