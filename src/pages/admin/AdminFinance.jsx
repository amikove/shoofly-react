import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { usersAPI } from '../../api'
import { Spinner, EmptyState, toast } from '../../components/ui'

export default function AdminFinance() {
  const [oeils, setOeils] = useState([])
  const [loading, setLoading] = useState(true)
  const [transferModal, setTransferModal] = useState(null) // œil sélectionné pour virement
  const [amount, setAmount] = useState('')
  const [acting, setActing] = useState(false)

  const load = () => {
    setLoading(true)
    usersAPI.adminFinanceOeils()
      .then(({ data }) => setOeils(data.oeils || []))
      .catch(() => toast('Erreur chargement', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openTransfer = (oeil) => {
    setTransferModal(oeil)
    setAmount(oeil.balance) // pré-rempli avec le solde total par défaut
  }

  const confirmTransfer = async () => {
    const value = parseFloat(amount)
    if (!value || value <= 0) { toast('Montant invalide', 'error'); return }
    setActing(true)
    try {
      await usersAPI.wireTransfer(transferModal.id, { amount: value })
      toast('Virement enregistré ✓', 'success')
      setTransferModal(null)
      setAmount('')
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally {
      setActing(false)
    }
  }

  return (
    <AppLayout>
      <Topbar title="💰 Finance — Virements Œils" />
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : oeils.length === 0 ? (
          <EmptyState icon="💰" title="Aucun Œil" description="Aucun Œil trouvé." />
        ) : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Ville</th>
                    <th>Missions</th>
                    <th>Gains totaux</th>
                    <th>Solde à virer</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {oeils.map((o) => (
                    <tr key={o.id}>
                      <td className="font-medium">{o.first_name} {o.last_name}</td>
                      <td className="text-[#AAA]">{o.city || '—'}</td>
                      <td className="text-[#AAA]">{o.total_missions}</td>
                      <td className="text-[#AAA]">{parseFloat(o.total_earnings).toFixed(0)} MAD</td>
                      <td className="text-green-400 font-semibold">{parseFloat(o.balance).toFixed(0)} MAD</td>
                      <td>
                        <button
                          onClick={() => openTransfer(o)}
                          disabled={parseFloat(o.balance) <= 0}
                          className="btn btn-primary btn-sm disabled:opacity-50"
                        >
                          🏦 Virer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal virement */}
      {transferModal && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-base mb-1">Enregistrer un virement</h2>
            <p className="text-xs text-[#AAA] mb-4">{transferModal.first_name} {transferModal.last_name} — solde actuel : {parseFloat(transferModal.balance).toFixed(0)} MAD</p>

            <div className="mb-4">
              <label className="label">Montant à virer (MAD)</label>
              <input
                type="number"
                min="1"
                max={transferModal.balance}
                className="input w-full"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <p className="text-xs text-[#AAA] mb-4">⚠️ Ce virement doit être effectué manuellement via votre banque. Cette action enregistre uniquement la transaction dans Shoofly et déduit le montant du solde de l'Œil.</p>

            <div className="flex gap-2">
              <button onClick={confirmTransfer} disabled={acting} className="btn btn-primary btn-sm flex-1 justify-center disabled:opacity-50">
                {acting ? '...' : '✅ Confirmer le virement'}
              </button>
              <button onClick={() => { setTransferModal(null); setAmount('') }} className="btn btn-ghost btn-sm">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}