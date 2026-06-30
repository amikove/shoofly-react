import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { reliabilityAPI } from '../../api'
import { Spinner, toast } from '../../components/ui'

export default function CompteSuspendu() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const load = () => {
    reliabilityAPI.me()
      .then(({ data: d }) => setData(d))
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const submit = async () => {
    if (message.trim().length < 10) { toast('Détaillez votre situation (min. 10 caractères)', 'error'); return }
    setSubmitting(true)
    try {
      await reliabilityAPI.requestReview({ message })
      setSubmitted(true)
      toast('Demande envoyée ✓', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <AppLayout>
      <Topbar title="Compte suspendu" />
      <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <Topbar title="Compte suspendu" />
      <div className="p-4 md:p-6 max-w-lg mx-auto">

        <div className="card mb-6 border border-red-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-2xl">🔴</div>
            <div>
              <p className="font-bold text-base">Compte suspendu</p>
              <p className="text-xs text-[#AAA]">Score de fiabilité : {data?.score}%</p>
            </div>
          </div>
          <div className="bg-[#222] rounded-xl p-3">
            <p className="text-xs text-[#AAA]">
              Votre score de fiabilité est descendu en dessous du seuil minimum requis pour accepter des missions.
              {data?.suspended_at && ` Suspendu depuis le ${new Date(data.suspended_at).toLocaleDateString('fr-FR')}.`}
            </p>
          </div>
        </div>

        {/* Historique détaillé */}
        <div className="card mb-6">
          <p className="font-semibold text-sm mb-3">Résumé de votre historique</p>
          {data?.events?.length === 0 ? (
            <p className="text-xs text-[#555] text-center py-4">Aucun événement enregistré</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data?.events?.map((e, i) => (
                <div key={i} className={`flex items-start justify-between gap-3 p-2.5 rounded-xl ${
                  e.is_grave ? 'bg-red-500/5 border border-red-500/10' : 'bg-[#222]'
                }`}>
                  <div>
                    <p className="text-xs text-white/80">{e.reason}</p>
                    <p className="text-[10px] text-[#555] mt-0.5">{new Date(e.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className={`text-xs font-bold whitespace-nowrap ${e.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {e.points >= 0 ? '+' : ''}{e.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demande d'examen */}
        {submitted ? (
          <div className="card text-center py-8">
            <div className="text-3xl mb-2">📨</div>
            <p className="font-semibold text-sm">Demande envoyée</p>
            <p className="text-xs text-[#AAA] mt-1">Notre équipe examine votre dossier. Vous serez notifié de la décision.</p>
          </div>
        ) : (
          <div className="card">
            <p className="font-semibold text-sm mb-2">Demander un examen de votre dossier</p>
            <p className="text-xs text-[#AAA] mb-3">Expliquez votre situation — notre équipe étudiera votre demande individuellement.</p>
            <textarea
              className="input resize-none h-28 w-full text-sm"
              placeholder="Expliquez les circonstances de votre situation..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            <button
              onClick={submit}
              disabled={submitting || message.trim().length < 10}
              className="btn btn-primary w-full justify-center mt-3 disabled:opacity-50"
            >
              {submitting ? 'Envoi...' : 'Envoyer ma demande →'}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}