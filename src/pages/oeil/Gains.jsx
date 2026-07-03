import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { usersAPI } from '../../api'
import { Spinner, EmptyState } from '../../components/ui'

const TYPE_LABELS = {
  immobilier: '🏠 Immobilier',
  file_attente: '⏳ File d\'attente',
  audit: '🔎 Audit',
  personnalisee: '🎯 Personnalisée',
}

export default function OeilGains() {
  const [lines, setLines] = useState([])
  const [balance, setBalance] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    usersAPI.oeilEarnings()
      .then(({ data }) => {
        setLines(data.lines || [])
        setBalance(data.balance || 0)
        setTotalEarnings(data.total_earnings || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      <Topbar title="💰 Mes gains" />
      <div className="p-6">
        {/* Résumé */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="card">
            <p className="text-xs text-[#AAA] mb-1">Solde actuel</p>
            <p className="text-2xl font-bold text-green-400">{parseFloat(balance).toFixed(0)} MAD</p>
          </div>
          <div className="card">
            <p className="text-xs text-[#AAA] mb-1">Gains totaux</p>
            <p className="text-2xl font-bold">{parseFloat(totalEarnings).toFixed(0)} MAD</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : lines.length === 0 ? (
          <EmptyState icon="💰" title="Aucun gain pour le moment" description="Vos missions terminées et virements apparaîtront ici." />
        ) : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Date exécution</th>
                    <th>Statut</th>
                    <th>Gains</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={`${l.kind}-${l.id}`}>
                      <td className="text-xs text-[#AAA]">
                        {new Date(l.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="font-medium">
                        {l.kind === 'transfer' ? '🏦 Virement bancaire' : (TYPE_LABELS[l.type] || l.title)}
                      </td>
                      <td className="text-xs text-[#AAA]">
                        {l.kind === 'mission' && l.scheduled_at
                          ? new Date(l.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        {l.kind === 'transfer'
                          ? <span className="badge badge-blue">Viré</span>
                          : <span className="badge badge-green">Complétée</span>}
                      </td>
                      <td className={`font-semibold ${l.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {l.amount < 0 ? '' : '+'}{l.amount.toFixed(0)} MAD
                      </td>
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