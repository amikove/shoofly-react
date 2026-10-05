// Statistiques annuaire (feat/annuaire-stats, 2026-10-05) : une ligne par fiche ayant une activité sur la
// période — vues, clics Itinéraire / Site web / Appel / « Un Œil attend pour moi », missions créées
// depuis la fiche, taux = missions ÷ vues. Filtres période / ville / catégorie côté serveur ; recherche
// par nom et tri par colonne côté navigateur. Permission `stats`.
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { directoryAPI } from '../../api'
import { Spinner, toast } from '../../components/ui'

const PERIODS = [
  { id: '7', labelKey: 'adminDirectoryStats.periode7' },
  { id: '30', labelKey: 'adminDirectoryStats.periode30' },
  { id: 'all', labelKey: 'adminDirectoryStats.periodeTout' },
]

const pct = (rate) => (rate == null ? '—' : `${(rate * 100).toFixed(1)} %`)

export default function AdminDirectoryStats() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'ar' ? 'ar' : 'fr'
  const [period, setPeriod] = useState('30')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ id: 'vues', dir: 'desc' })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Chargement à chaque changement de filtre ; une réponse périmée (filtre changé entre-temps) est ignorée.
  useEffect(() => {
    let cancelled = false
    directoryAPI.adminStats({ period, city: city || undefined, category: category || undefined })
      .then(({ data }) => { if (!cancelled) setData(data) })
      .catch(() => { if (!cancelled) toast(t('adminDirectoryStats.erreur'), 'error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [period, city, category, t])

  const catLabel = (r) => (lang === 'ar' ? r.category_label_ar : r.category_label_fr) || r.category_id
  const catOptionLabel = (c) => (lang === 'ar' ? c.label_ar : c.label_fr)

  // Colonnes : id stable (tri), libellé i18n, valeur de tri / d'affichage.
  const columns = useMemo(() => [
    { id: 'fiche', label: t('adminDirectoryStats.colonnes.fiche'), get: (r) => r.name, text: true },
    { id: 'ville', label: t('adminDirectoryStats.colonnes.ville'), get: (r) => r.city, text: true },
    { id: 'categorie', label: t('adminDirectoryStats.colonnes.categorie'), get: catLabel, text: true },
    { id: 'vues', label: t('adminDirectoryStats.colonnes.vues'), get: (r) => r.views },
    { id: 'itineraire', label: t('adminDirectoryStats.colonnes.itineraire'), get: (r) => r.itineraire },
    { id: 'site_web', label: t('adminDirectoryStats.colonnes.siteWeb'), get: (r) => r.site_web },
    { id: 'appel', label: t('adminDirectoryStats.colonnes.appel'), get: (r) => r.appel },
    { id: 'un_oeil', label: t('adminDirectoryStats.colonnes.unOeil'), get: (r) => r.un_oeil },
    { id: 'missions', label: t('adminDirectoryStats.colonnes.missions'), get: (r) => r.missions },
    { id: 'taux', label: t('adminDirectoryStats.colonnes.taux'), get: (r) => r.rate ?? -1, title: t('adminDirectoryStats.tauxAide') },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, lang])

  const visibleRows = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    const filtered = q ? data.rows.filter((r) => r.name.toLowerCase().includes(q)) : data.rows
    const col = columns.find((c) => c.id === sort.id) || columns[0]
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const va = col.get(a), vb = col.get(b)
      if (typeof va === 'string') return va.localeCompare(vb, lang) * dir
      return (va - vb) * dir
    })
  }, [data, query, sort, columns, lang])

  // Totaux calculés sur les lignes affichées (recherche comprise).
  const totals = useMemo(() => {
    const sum = (k) => visibleRows.reduce((s, r) => s + r[k], 0)
    const views = sum('views'), missions = sum('missions')
    return {
      views, itineraire: sum('itineraire'), site_web: sum('site_web'), appel: sum('appel'),
      un_oeil: sum('un_oeil'), missions, rate: views > 0 ? missions / views : null,
    }
  }, [visibleRows])

  const toggleSort = (id) => setSort((s) => (s.id === id ? { id, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { id, dir: id === 'fiche' || id === 'ville' || id === 'categorie' ? 'asc' : 'desc' }))

  const selectClass = 'bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-sm text-white'

  return (
    <AppLayout>
      <Topbar title={`📈 ${t('adminDirectoryStats.onglet')}`} />
      <div className="p-6 space-y-5">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit max-w-full overflow-x-auto">
            {PERIODS.map((p) => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${period === p.id ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}>
                {t(p.labelKey)}
              </button>
            ))}
          </div>
          <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass} aria-label={t('adminDirectoryStats.toutesVilles')}>
            <option value="">{t('adminDirectoryStats.toutesVilles')}</option>
            {(data?.options.cities || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass} aria-label={t('adminDirectoryStats.toutesCategories')}>
            <option value="">{t('adminDirectoryStats.toutesCategories')}</option>
            {(data?.options.categories || []).map((c) => <option key={c.id} value={c.id}>{catOptionLabel(c)}</option>)}
          </select>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={t('adminDirectoryStats.rechercheNom')} className={`${selectClass} min-w-[220px]`} />
        </div>

        {loading && !data ? <Spinner /> : (
          <div className="overflow-x-auto rounded-xl border border-[#2A2A2A]">
            <table className="min-w-full text-sm">
              <thead className="bg-[#1A1A1A] text-[#AAA] text-xs uppercase">
                <tr>
                  {columns.map((c) => (
                    <th key={c.id} title={c.title} aria-sort={sort.id === c.id ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={`px-3 py-3 whitespace-nowrap ${c.text ? 'text-start' : 'text-end'}`}>
                      <button onClick={() => toggleSort(c.id)} className="hover:text-white">
                        {c.label}{sort.id === c.id ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => (
                  <tr key={r.id} className="border-t border-[#2A2A2A] hover:bg-[#161616]">
                    <td className="px-3 py-2 text-start font-medium">{r.name}</td>
                    <td className="px-3 py-2 text-start text-[#AAA]">{r.city}</td>
                    <td className="px-3 py-2 text-start text-[#AAA]">{catLabel(r)}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{r.views}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{r.itineraire}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{r.site_web}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{r.appel}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{r.un_oeil}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{r.missions}</td>
                    <td className="px-3 py-2 text-end tabular-nums">{pct(r.rate)}</td>
                  </tr>
                ))}
                {visibleRows.length === 0 && (
                  <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-[#777]">
                    {data && data.rows.length === 0 ? t('adminDirectoryStats.vide') : t('adminDirectoryStats.aucuneLigne')}
                  </td></tr>
                )}
              </tbody>
              {visibleRows.length > 0 && (
                <tfoot className="border-t-2 border-[#333] font-semibold">
                  <tr>
                    <td className="px-3 py-3 text-start" colSpan={3}>{t('adminDirectoryStats.total')} ({visibleRows.length})</td>
                    <td className="px-3 py-3 text-end tabular-nums">{totals.views}</td>
                    <td className="px-3 py-3 text-end tabular-nums">{totals.itineraire}</td>
                    <td className="px-3 py-3 text-end tabular-nums">{totals.site_web}</td>
                    <td className="px-3 py-3 text-end tabular-nums">{totals.appel}</td>
                    <td className="px-3 py-3 text-end tabular-nums">{totals.un_oeil}</td>
                    <td className="px-3 py-3 text-end tabular-nums">{totals.missions}</td>
                    <td className="px-3 py-3 text-end tabular-nums">{pct(totals.rate)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
