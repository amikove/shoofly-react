import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { Spinner, EmptyState, Avatar, toast } from '../../components/ui'

const TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'active', label: 'Actifs' },
  { key: 'inactive', label: 'Inactifs' },
]

export default function AdminClients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = { role: 'client' }
    if (tab === 'active') params.is_active = '1'
    else if (tab === 'inactive') params.is_active = '0'
    adminAPI.users(params)
      .then(({ data }) => { if (!cancelled) setClients(data.users || []) })
      .catch(() => { if (!cancelled) toast('Erreur', 'error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tab])

  return (
    <AppLayout>
      <Topbar title="Gestion des clients" />
      <div className="p-6 space-y-4">
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit max-w-full overflow-x-auto">
          {TABS.map((s) => (
            <button key={s.key} onClick={() => setTab(s.key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === s.key ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}>
              {s.label}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : clients.length === 0 ? (
          <EmptyState icon="👥" title="Aucun client" description="Aucun client enregistré." />
        ) : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Client</th><th>Email</th><th>Ville</th><th>Missions</th><th>Statut</th></tr></thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-2 cursor-pointer hover:text-[#FF4D00]" onClick={() => navigate(`/admin/users/${c.id}`)}>
                          <Avatar name={`${c.first_name} ${c.last_name}`} size={26} bgColor="bg-blue-500/10" textColor="text-blue-400" />
                          <span className="font-medium hover:underline">{c.first_name} {c.last_name}</span>
                        </div>
                      </td>
                      <td className="text-[#AAA] text-xs">{c.email}</td>
                      <td className="text-[#AAA]">{c.city || '—'}</td>
                      <td className="text-center">{c.total_missions || 0}</td>
                      <td><span className={`badge ${c.is_active ? 'badge-green' : 'badge-gray'}`}>{c.is_active ? 'Actif' : 'Inactif'}</span></td>
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
