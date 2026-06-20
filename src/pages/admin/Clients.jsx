import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { Spinner, EmptyState, Avatar, toast } from '../../components/ui'

export default function AdminClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.users({ role: 'client' })
      .then(({ data }) => setClients(data.users || []))
      .catch(() => toast('Erreur', 'error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      <Topbar title="Gestion des clients" />
      <div className="p-6">
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
                      <td><div className="flex items-center gap-2"><Avatar name={`${c.first_name} ${c.last_name}`} size={26} bgColor="bg-blue-500/10" textColor="text-blue-400" /><span className="font-medium">{c.first_name} {c.last_name}</span></div></td>
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
