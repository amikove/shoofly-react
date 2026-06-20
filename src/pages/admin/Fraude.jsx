import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { Spinner, toast } from '../../components/ui'

export default function AdminFraude() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState('missions')

  useEffect(() => {
    adminAPI.fraudDashboard()
      .then(({ data: d }) => setData(d))
      .catch(() => toast('Erreur chargement anti-fraude', 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AppLayout><Topbar title="Anti-Fraude" /><div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div></AppLayout>

  const flagged = data?.flagged_missions || []
  const suspMsgs = data?.suspicious_messages || []
  const rules = data?.rules || []

  return (
    <AppLayout>
      <Topbar title="🛡️ Anti-Fraude" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card"><div className="text-xs text-[#AAA] mb-1">Score risque global</div><div className="text-2xl font-bold text-green-400">12<span className="text-sm">/100</span></div></div>
          <div className="stat-card"><div className="text-xs text-[#AAA] mb-1">Missions suspectes</div><div className="text-2xl font-bold text-yellow-400">{flagged.length}</div></div>
          <div className="stat-card"><div className="text-xs text-[#AAA] mb-1">Messages suspects</div><div className="text-2xl font-bold text-orange-400">{suspMsgs.length}</div></div>
          <div className="stat-card"><div className="text-xs text-[#AAA] mb-1">Règles actives</div><div className="text-2xl font-bold">{rules.length}</div></div>
        </div>

        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit">
          {[{id:'missions',label:'Missions suspectes'},{id:'messages',label:'Messages suspects'},{id:'rules',label:'Règles actives'}].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab===t.id?'bg-[#2A2A2A] text-white':'text-[#AAA] hover:text-white'}`}>{t.label}</button>
          ))}
        </div>

        {tab === 'missions' && (flagged.length === 0
          ? <div className="card text-center py-12 text-[#AAA]">✅ Aucune mission suspecte détectée</div>
          : flagged.map((f) => (
            <div key={f.id} className="card">
              <div className="font-semibold">{f.title}</div>
              <div className="text-xs text-[#AAA]">Œil : {f.oeil_name}</div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => toast('Avertissement envoyé', 'info')} className="btn btn-ghost btn-sm text-yellow-400">Avertir</button>
                <button onClick={() => toast('Compte suspendu', 'error')} className="btn btn-ghost btn-sm text-red-400">Suspendre</button>
                <button onClick={() => toast('Alerte ignorée', 'info')} className="btn btn-ghost btn-sm ml-auto">Ignorer</button>
              </div>
            </div>
          ))
        )}

        {tab === 'messages' && (suspMsgs.length === 0
          ? <div className="card text-center py-12 text-[#AAA]">✅ Aucun message suspect détecté</div>
          : suspMsgs.map((m) => (
            <div key={m.id} className="card">
              <div className="text-sm italic text-[#AAA]">"{m.content}"</div>
              <div className="text-xs text-[#777] mt-1">Envoyé par {m.sender_name}</div>
              <button onClick={() => toast('Signalé', 'info')} className="btn btn-ghost btn-sm mt-3 text-red-400">Signaler</button>
            </div>
          ))
        )}

        {tab === 'rules' && (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Règle</th><th>Score</th><th>Action</th><th>Actif</th></tr></thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.code}>
                      <td className="font-medium">{r.label}</td>
                      <td><span className={`badge ${r.score>=80?'badge-red':r.score>=50?'badge-yellow':'badge-gray'}`}>{r.score}</span></td>
                      <td className="text-[#AAA] capitalize">{r.action}</td>
                      <td><div className="w-8 h-4 bg-[#FF4D00] rounded-full cursor-pointer" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
