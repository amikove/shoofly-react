import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { Spinner, toast } from '../../components/ui'

export default function AdminReclamations() {
  const [claims, setClaims]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [resolving, setResolving] = useState(null)

  const load = () => {
    setLoading(true)
    adminAPI.claims()
      .then(({ data }) => setClaims(data.claims || []))
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const resolve = async (claimId, missionId, decision) => {
    setResolving(claimId)
    try {
      await adminAPI.resolveClaim(missionId, decision)
      setClaims(prev => prev.filter(c => c.id !== claimId))
      toast(decision === 'oeil' ? '✅ Résolu en faveur de l\'Œil' : '✅ Résolu en faveur du client', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setResolving(null) }
  }

  return (
    <AppLayout>
      <Topbar title="Réclamations en cours" />
      <div className="p-4 md:p-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : claims.length === 0 ? (
          <div className="card text-center py-12 text-[#AAA]">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm">Aucune réclamation en cours</p>
          </div>
        ) : claims.map((c) => (
          <div key={c.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                  <div className="font-semibold text-sm">
                    {c.mission_title}
                    <span className="text-[#555] font-normal ml-2 text-xs">#{String(c.mission_id).slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="text-xs text-[#AAA] mt-0.5">
                    Client : <span className="text-white">{c.client_name}</span> · Œil : <span className="text-white">{c.oeil_name}</span>
                </div>
                <div className="text-xs text-[#AAA] mt-0.5">
                  Prix : <span className="text-green-400">{c.mission_price} MAD</span> · Gain Œil : <span className="text-[#FF4D00]">{c.oeil_earning} MAD</span>
                </div>
              </div>
              <span className="text-xs text-[#555] shrink-0">
                {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="bg-[#222] rounded-xl p-3">
              <div className="text-xs text-[#AAA] mb-1">Motif du client :</div>
              <p className="text-sm text-white/80">{c.comment}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => resolve(c.id, c.mission_id, 'oeil')}
                disabled={resolving === c.id}
                className="btn btn-primary btn-sm flex-1 justify-center disabled:opacity-60"
              >
                ✅ Valider en faveur de l'Œil
              </button>
              <button
                onClick={() => resolve(c.id, c.mission_id, 'client')}
                disabled={resolving === c.id}
                className="btn btn-ghost btn-sm flex-1 justify-center text-orange-400 disabled:opacity-60"
              >
                🔄 Rembourser le client
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}