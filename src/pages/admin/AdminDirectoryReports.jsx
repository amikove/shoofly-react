// Chantier SEO annuaire — Phase 2 (2026-09-30). Traitement des signalements publics
// ("Demander le retrait" / "Signaler une erreur") reçus sur les fiches de l'annuaire. Page
// volontairement minimale (chantier "couche données") — voir RAPPORT_PHASE2_DONNEES.md.
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { directoryAPI } from '../../api'
import { Spinner, toast } from '../../components/ui'
import { CASABLANCA_TZ } from '../../utils/casablancaTime'

const STATUS_TABS = [
  { id: 'pending',  label: 'À traiter', color: 'text-orange-400' },
  { id: 'actioned', label: 'Traités',   color: 'text-green-400'  },
  { id: 'dismissed', label: 'Ignorés',  color: 'text-[#555]'     },
]

const TYPE_LABEL = { retrait: 'Demande de retrait', erreur: 'Signalement d\'erreur' }

export default function AdminDirectoryReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [acting, setActing] = useState({})
  const { t } = useTranslation()

  const load = useCallback(() => {
    setLoading(true)
    directoryAPI.adminReports(tab)
      .then(({ data }) => setReports(data))
      .catch(() => toast('Erreur chargement', 'error'))
      .finally(() => setLoading(false))
  }, [tab])

  useEffect(() => { load() }, [load])

  const act = async (report, action) => {
    setActing((a) => ({ ...a, [report.id]: true }))
    try {
      const { data } = await directoryAPI.adminSetReport(report.id, action)
      if (action === 'actioned' && report.type === 'retrait') {
        // Rebuild planifié (anti-rafale, ~5 min) : message de succès. Sinon, retrait effectif mais
        // republication manuelle/prochain build : on le dit à l'admin.
        toast(
          t(data.rebuild_scheduled ? 'adminDirectoryReports.retraitConfirme' : 'adminDirectoryReports.retraitSansRebuild'),
          data.rebuild_scheduled ? 'success' : 'info',
        )
      } else {
        toast(action === 'actioned' ? 'Signalement traité ✓' : 'Signalement ignoré', 'success')
      }
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally {
      setActing((a) => ({ ...a, [report.id]: false }))
    }
  }

  return (
    <AppLayout>
      <Topbar title="📍 Annuaire — signalements" />
      <div className="p-6 space-y-5">
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit max-w-full overflow-x-auto">
          {STATUS_TABS.map((s) => (
            <button key={s.id} onClick={() => setTab(s.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === s.id ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {loading ? <Spinner /> : reports.length === 0 ? (
          <p className="text-[#888] text-sm">Aucun signalement dans cette liste.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#2A2A2A]">
            <table className="w-full text-sm">
              <thead className="bg-[#1A1A1A] text-[#AAA] text-left">
                <tr>
                  <th className="p-3">Établissement</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Message</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Reçu le</th>
                  {tab === 'pending' && <th className="p-3">Action</th>}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-t border-[#2A2A2A]">
                    <td className="p-3">
                      <div className="font-medium">{r.establishment_name}</div>
                      <div className="text-[#888] text-xs">{r.establishment_city} — {r.establishment_slug}</div>
                    </td>
                    <td className="p-3">{TYPE_LABEL[r.type] || r.type}</td>
                    <td className="p-3 max-w-xs truncate" title={r.message}>{r.message}</td>
                    <td className="p-3 text-[#888]">{r.contact_email || '—'}</td>
                    <td className="p-3 text-[#888] whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString('fr-FR', { timeZone: CASABLANCA_TZ })}
                    </td>
                    {tab === 'pending' && (
                      <td className="p-3 whitespace-nowrap space-x-2">
                        <button disabled={acting[r.id]} onClick={() => act(r, 'actioned')}
                          className="px-3 py-1 rounded-lg bg-green-600/20 text-green-400 text-xs font-medium hover:bg-green-600/30 disabled:opacity-50">
                          {r.type === 'retrait' ? 'Confirmer le retrait' : 'Marquer traité'}
                        </button>
                        <button disabled={acting[r.id]} onClick={() => act(r, 'dismissed')}
                          className="px-3 py-1 rounded-lg bg-[#2A2A2A] text-[#AAA] text-xs font-medium hover:text-white disabled:opacity-50">
                          Ignorer
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
