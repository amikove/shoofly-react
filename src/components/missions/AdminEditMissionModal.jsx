import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { missionsAPI } from '../../api'
import { VILLES, VILLES_LIST } from '../../constants/villes'
import { toast, Spinner } from '../ui'
import Autocomplete from './Autocomplete'
import { casablancaWallTimeToISO, casablancaDateTimeInputParts, CASABLANCA_TZ } from '../../utils/casablancaTime'

// Sous-catégories valides par type — copie de la source de vérité frontend
// (NewMissionModal.jsx, const CATEGORIES, elle-même dupliquée côté backend dans
// constants/missionCategories.js). Dette technique déjà assumée deux fois dans ce projet pour
// cette exacte donnée (voir le commentaire de missionCategories.js) — même choix ici plutôt que
// d'exporter/réimporter depuis NewMissionModal.jsx, hors périmètre de ce chantier (FE-2). Forme
// aplatie (pas de groupes/optgroup) : cet écran est un outil de correction admin, pas l'assistant
// de création — un simple select suffit, la structure par groupe de NewMissionModal n'apporte
// rien ici.
const TYPE_OPTIONS = [
  { value: 'immobilier', icon: '🏠', label: 'Immobilier' },
  { value: 'file_attente', icon: '⏳', label: "File d'attente" },
  { value: 'audit', icon: '🔎', label: 'Audit' },
  { value: 'personnalisee', icon: '🎯', label: 'Personnalisée' },
]
const SUBCATEGORIES_BY_TYPE = {
  immobilier: ['Airbnb', 'Booking', 'Avito', 'Mubawab', 'Agence immobilière', 'Particulier', 'Autre'],
  file_attente: [
    'Véhicules & Transport — Centre de visite technique', 'Véhicules & Transport — Autre',
    'Centres de santé — Hôpital & clinique', 'Centres de santé — Cabinet de spécialiste',
    'Centres de santé — Laboratoire', 'Centres de santé — Autre',
    'Administrations — CNSS', 'Administrations — ANCFCC', "Administrations — Services d'état civil",
    'Administrations — Tribunal', "Administrations — Centre d'immatriculation",
    'Administrations — Préfectures / Annexes administratives', 'Administrations — Douane',
    'Administrations — Bureau des passeports / Cartes nationales', 'Administrations — Adoul / Notaires',
    "Administrations — CRI / Centres régionaux d'investissement", 'Administrations — Impôts (DGI)',
    'Administrations — Autre',
    'Services publics — ONEE', 'Services publics — REDAL', 'Services publics — RADEEMA', 'Services publics — Autre',
    'Consulats et visas — Consulat étranger', 'Consulats et visas — Centre de visas', 'Consulats et visas — Autre',
    'Banques — Attijariwafa', 'Banques — CIH Bank', 'Banques — Banque Populaire', 'Banques — BMCE',
    'Banques — BMCI', 'Banques — Al Barid Bank', 'Banques — Autre',
    'Éducation — Inscription universitaire', 'Éducation — École privée', 'Éducation — Bourse & dossier étudiant',
    'Éducation — Autre', 'Autre — À préciser',
  ],
  audit: [
    "Restaurant (Temps d'attente, Propreté, Qualité du service)",
    'Café (Accueil, Rapidité, Propreté)',
    'Hôtel (Check-in, Service client, Propreté)',
    'Salle de sport (Accueil commercial, État des équipements, Suivi coachs)',
    'Concession automobile (Qualité vendeur, Temps de prise en charge, Suivi commercial)',
    'Agence immobilière (Qualité accueil, Réactivité, Compétence commerciale)',
  ],
  personnalisee: ['Présence physique', 'Accompagnement', 'Vérification', 'Livraison', 'Autre'],
}

const EDIT_FIELD_LABELS = {
  title: 'Titre', description: 'Description', address: 'Adresse', city: 'Ville', quartier: 'Quartier',
  scheduled_at: 'Date/heure', duration_est: 'Durée estimée', type: 'Type', subcategory: 'Sous-catégorie',
  replacement_preference: 'Préférence de remplacement',
}

function formatHistoryValue(key, value, t) {
  if (value === null || value === undefined || value === '') return '—'
  if (key === 'scheduled_at') {
    return `${new Date(value).toLocaleDateString('fr-FR', { timeZone: CASABLANCA_TZ, day: 'numeric', month: 'short', year: 'numeric' })} ${new Date(value).toLocaleTimeString('fr-FR', { timeZone: CASABLANCA_TZ, hour: '2-digit', minute: '2-digit' })}`
  }
  if (key === 'duration_est') return `${value} min`
  if (key === 'subcategory') return t(`newMissionModal.subcategories.${value}`, value)
  if (key === 'type') return TYPE_OPTIONS.find((o) => o.value === value)?.label || value
  return String(value)
}

function toDateInput(iso) { return casablancaDateTimeInputParts(iso).date }
function toTimeInput(iso) { return casablancaDateTimeInputParts(iso).time }

export default function AdminEditMissionModal({ mission, onClose, onSaved }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [form, setForm] = useState({
    title: mission.title || '',
    description: mission.description || '',
    address: mission.address || '',
    city: mission.city || '',
    quartier: mission.quartier || '',
    scheduled_date: toDateInput(mission.scheduled_at),
    scheduled_time: toTimeInput(mission.scheduled_at),
    duration_est: mission.duration_est ?? '',
    type: mission.type || 'immobilier',
    subcategory: mission.subcategory || '',
    replacement_preference: mission.replacement_preference || 'fast',
  })

  useEffect(() => {
    missionsAPI.adminEditsHistory(mission.id)
      .then(({ data }) => setHistory(data.admin_edits || []))
      .catch(() => toast(t('adminEditMissionModal.historyLoadError'), 'error'))
      .finally(() => setHistoryLoading(false))
  }, [mission.id, t])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  const changeType = (newType) => setForm((f) => ({ ...f, type: newType, subcategory: '' }))

  const submit = async (e) => {
    e.preventDefault()
    if (form.title.trim().length < 6) {
      toast(t('adminEditMissionModal.errors.titleTooShort'), 'error')
      return
    }
    if (!form.city || !form.quartier) {
      toast(t('adminEditMissionModal.errors.cityQuartierRequired'), 'error')
      return
    }
    if (!form.scheduled_date || !form.scheduled_time) {
      toast(t('adminEditMissionModal.errors.dateTimeRequired'), 'error')
      return
    }

    const scheduledAt = casablancaWallTimeToISO(form.scheduled_date, form.scheduled_time)

    // Ne transmettre que les champs réellement modifiés — jamais un patch complet, jamais price
    // (n'apparaît nulle part dans `form`, ne peut donc jamais être envoyé par accident).
    const changes = {}
    if (form.title.trim() !== mission.title) changes.title = form.title.trim()
    if ((form.description || '') !== (mission.description || '')) changes.description = form.description || null
    if (form.address.trim() !== (mission.address || '')) changes.address = form.address.trim()
    if (form.city !== mission.city) changes.city = form.city
    if (form.quartier !== (mission.quartier || '')) changes.quartier = form.quartier
    if (scheduledAt !== new Date(mission.scheduled_at).toISOString()) changes.scheduled_at = scheduledAt
    const durationValue = form.duration_est === '' ? null : parseInt(form.duration_est, 10)
    if (durationValue !== (mission.duration_est ?? null)) changes.duration_est = durationValue
    if (form.type !== mission.type) changes.type = form.type
    if ((form.subcategory || null) !== (mission.subcategory || null)) changes.subcategory = form.subcategory || null
    if (form.replacement_preference !== (mission.replacement_preference || 'fast')) changes.replacement_preference = form.replacement_preference

    if (Object.keys(changes).length === 0) {
      toast(t('adminEditMissionModal.errors.noChanges'), 'error')
      return
    }

    setLoading(true)
    try {
      const { data } = await missionsAPI.adminEdit(mission.id, changes)
      toast(t('adminEditMissionModal.savedToast'), 'success')
      onSaved?.(data.mission)
      onClose()
    } catch (err) {
      toast(err.response?.data?.error || t('adminEditMissionModal.errors.generic'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const subcategoryOptions = SUBCATEGORIES_BY_TYPE[form.type] || []

  return (
    <div
      className="fixed inset-0 bg-black/75 z-[110] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-base">{t('adminEditMissionModal.title')}</h2>
            <p className="text-xs text-[#AAA] mt-0.5">{mission.title}</p>
          </div>
          <button onClick={onClose} aria-label={t('common.close')} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/20 rounded-xl p-3 mb-4 text-xs text-[#AAA] leading-relaxed">
          🔒 {t('adminEditMissionModal.priceLockedNotice')}
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">{t('adminEditMissionModal.titleLabel')}</label>
            <input className="input" value={form.title} onChange={set('title')} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('adminEditMissionModal.typeLabel')}</label>
              <select className="input" value={form.type} onChange={(e) => changeType(e.target.value)}>
                {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.icon} {o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('adminEditMissionModal.subcategoryLabel')}</label>
              <select className="input" value={form.subcategory} onChange={set('subcategory')}>
                <option value="">{t('adminEditMissionModal.subcategoryNone')}</option>
                {subcategoryOptions.map((s) => <option key={s} value={s}>{t(`newMissionModal.subcategories.${s}`, s)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Autocomplete
              label={t('adminEditMissionModal.cityLabel')}
              value={form.city}
              onChange={(v) => { setVal('city')(v); setVal('quartier')('') }}
              suggestions={VILLES_LIST}
              placeholder={t('adminEditMissionModal.cityPlaceholder')}
            />
            <Autocomplete
              label={t('adminEditMissionModal.quartierLabel')}
              value={form.quartier}
              onChange={setVal('quartier')}
              suggestions={VILLES[form.city] || []}
              placeholder={form.city ? t('adminEditMissionModal.quartierPlaceholder') : t('adminEditMissionModal.quartierPlaceholderDisabled')}
              disabled={!form.city}
            />
          </div>

          <div>
            <label className="label">{t('adminEditMissionModal.addressLabel')}</label>
            <input className="input" value={form.address} onChange={set('address')} />
          </div>

          <div>
            <label className="label">{t('adminEditMissionModal.descriptionLabel')}</label>
            <textarea className="input resize-none h-20" value={form.description} onChange={set('description')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('adminEditMissionModal.dateLabel')}</label>
              <input
                type="date"
                className="input"
                style={{ colorScheme: 'dark', accentColor: '#FF4D00' }}
                value={form.scheduled_date}
                onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">{t('adminEditMissionModal.timeLabel')}</label>
              <input
                type="time"
                className="input"
                style={{ colorScheme: 'dark', accentColor: '#FF4D00' }}
                value={form.scheduled_time}
                onChange={(e) => setForm((f) => ({ ...f, scheduled_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('adminEditMissionModal.durationLabel')}</label>
              <input type="number" min="0" className="input" value={form.duration_est} onChange={set('duration_est')} />
            </div>
            <div>
              <label className="label">{t('adminEditMissionModal.replacementPreferenceLabel')}</label>
              <select className="input" value={form.replacement_preference} onChange={set('replacement_preference')}>
                <option value="fast">{t('adminEditMissionModal.replacementPreferenceFast')}</option>
                <option value="choose">{t('adminEditMissionModal.replacementPreferenceChoose')}</option>
              </select>
            </div>
          </div>
          <p className="text-[11px] text-[#666] -mt-2">{t('adminEditMissionModal.replacementPreferenceDeadNotice')}</p>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg flex-1 justify-center disabled:opacity-60">
              {loading ? t('adminEditMissionModal.submitLoading') : t('adminEditMissionModal.submitApply')}
            </button>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-lg">{t('adminEditMissionModal.cancel')}</button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10">
          <h3 className="text-xs font-semibold text-[#AAA] uppercase tracking-wider mb-3">{t('adminEditMissionModal.historyTitle')}</h3>
          {historyLoading ? (
            <div className="flex justify-center py-4"><Spinner size="sm" /></div>
          ) : history.length === 0 ? (
            <p className="text-xs text-[#555]">{t('adminEditMissionModal.historyEmpty')}</p>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {history.map((entry) => (
                <div key={entry.id} className="bg-[#141414] border border-white/5 rounded-xl p-3">
                  <div className="flex items-center justify-between text-[11px] text-[#AAA] mb-1.5">
                    <span className="font-medium text-white/80">{entry.admin_name || t('adminEditMissionModal.unknownAdmin')}</span>
                    <span>{new Date(entry.created_at).toLocaleDateString('fr-FR', { timeZone: CASABLANCA_TZ, day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(entry.created_at).toLocaleTimeString('fr-FR', { timeZone: CASABLANCA_TZ, hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(entry.changes || {}).map(([key, { from, to }]) => (
                      <div key={key} className="text-xs">
                        <span className="text-[#AAA]">{EDIT_FIELD_LABELS[key] || key}: </span>
                        <span className="text-white/50 line-through">{formatHistoryValue(key, from, t)}</span>
                        <span className="text-[#AAA] mx-1">→</span>
                        <span className="text-[#FF4D00] font-medium">{formatHistoryValue(key, to, t)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
