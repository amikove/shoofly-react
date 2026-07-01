import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI } from '../../api'
import { Spinner, toast } from '../../components/ui'

const STATUS_TABS = [
  { id: 'open',        label: 'Ouverts',   color: 'text-red-400'    },
  { id: 'in_progress', label: 'En cours',  color: 'text-amber-400'  },
  { id: 'resolved',    label: 'Résolus',   color: 'text-green-400'  },
  { id: 'dismissed',   label: 'Ignorés',   color: 'text-[#555]'     },
]

export default function AdminProblemes() {
  const [reports, setReports]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('open')
  const [acting, setActing]     = useState({})
  const [noteModal, setNoteModal] = useState(null)
  const [adminNote, setAdminNote] = useState('')
  const [nextStatus, setNextStatus] = useState('resolved')

  const load = () => {
    setLoading(true)
    missionsAPI.adminProblems(tab)
      .then(({ data }) => setReports(data.reports || []))
      .catch(() => toast('Erreur chargement', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [tab])

  const resolve = async (id, status, note) => {
    setActing(a => ({ ...a, [id]: true }))
    try {
      await missionsAPI.resolveReport(id, { status, admin_note: note || null })
      toast(status === 'resolved' ? 'Ticket résolu ✓' : status === 'dismissed' ? 'Ticket ignoré' : 'Statut mis à jour', 'info')
      setNoteModal(null)
      setAdminNote('')
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setActing(a => ({ ...a, [id]: false })) }
  }

  const typeColor = (type) => {
    if (type.includes('dangereux') || type.includes('illégale') || type.includes('insultant')) return 'text-red-400'
    if (type.includes('répond') || type.includes('place') || type.includes('injoignable')) return 'text-amber-400'
    return 'text-orange-400'
  }

  return (
    <AppLayout>
      <Topbar title="🚨 Problèmes en cours" />
      <div className="p-6 space-y-5">

        {/* Onglets */}
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit">
          {STATUS_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : reports.length === 0 ? (
          <div className="card text-center py-12 text-[#AAA]">✅ Aucun ticket dans cette catégorie</div>
        ) : (
          <div className="space-y-4">
            {reports.map(r => (
              <div key={r.id} className="card">
                {/* En-tête */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-semibold ${typeColor(r.type)}`}>⚠️ {r.type}</span>
                      <span className="text-[10px] bg-[#333] text-[#AAA] px-2 py-0.5 rounded-full">
                        {r.reporter_role === 'client' ? '👥 Client' : '👁️ Œil'}
                      </span>
                    </div>
                    <p className="text-xs text-[#AAA]">
                      Signalé par <span className="text-white">{r.reporter_first} {r.reporter_last}</span>
                    </p>
                  </div>
                  <p className="text-[10px] text-[#555]">{new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                {/* Mission */}
                <div className="bg-[#222] rounded-xl p-3 mb-3 space-y-1">
                  <p className="text-xs font-semibold text-white">📋 {r.mission_title}</p>
                  <p className="text-xs text-[#AAA]">📍 {r.city} · 📅 {r.scheduled_at ? new Date(r.scheduled_at).toLocaleDateString('fr-FR') : '—'}</p>
                  <p className="text-xs text-[#AAA]">👥 Client : {r.client_first} {r.client_last} · 👁️ Œil : {r.oeil_first || '—'} {r.oeil_last || ''}</p>
                </div>

                {/* Description */}
                {r.description && (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 mb-3">
                    <p className="text-xs text-white/80">{r.description}</p>
                  </div>
                )}

                {/* Note admin */}
                {r.admin_note && (
                  <div className="bg-[#222] rounded-xl p-3 mb-3">
                    <p className="text-[10px] text-[#555] mb-1">Note admin :</p>
                    <p className="text-xs text-[#AAA]">{r.admin_note}</p>
                  </div>
                )}

                {/* Actions */}
                {tab === 'open' && (
                  noteModal === r.id ? (
                    <div className="space-y-3 border-t border-white/10 pt-3">
                      <textarea
                        className="input resize-none h-16 w-full text-sm"
                        placeholder="Note interne (optionnel)..."
                        value={adminNote}
                        onChange={e => setAdminNote(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => resolve(r.id, nextStatus, adminNote)}
                          disabled={acting[r.id]}
                          className="btn btn-primary btn-sm disabled:opacity-50"
                        >
                          {acting[r.id] ? '...' : nextStatus === 'resolved' ? '✅ Marquer résolu' : nextStatus === 'in_progress' ? '🔄 Confirmer' : '🙈 Ignorer'}
                        </button>
                        <button onClick={() => { setNoteModal(null); setAdminNote('') }} className="btn btn-ghost btn-sm">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 border-t border-white/10 pt-3">
                      <button
                        onClick={() => { setNoteModal(r.id); setNextStatus('in_progress') }}
                        className="btn btn-ghost btn-sm text-amber-400"
                      >
                        🔄 En cours
                      </button>
                      <button
                        onClick={() => { setNoteModal(r.id); setNextStatus('resolved') }}
                        className="btn btn-primary btn-sm"
                      >
                        ✅ Résoudre
                      </button>
                     <button
                        onClick={() => resolve(r.id, 'dismissed', null)}
                        disabled={acting[r.id]}
                        className="btn btn-ghost btn-sm text-[#555] disabled:opacity-50"
                      >
                        {acting[r.id] ? '...' : '🙈 Ignorer'}
                      </button>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}