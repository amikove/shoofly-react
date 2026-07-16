import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { missionsAPI } from '../../api'
import { VILLES, VILLES_LIST } from '../../constants/villes'
import { toast } from '../ui'
import Autocomplete from './Autocomplete'

function toDateInput(iso) {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 10)
}
function toTimeInput(iso) {
  if (!iso) return ''
  return new Date(iso).toTimeString().slice(0, 5)
}

export default function EditMissionModal({ mission, onClose, onSaved }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: mission.title || '',
    description: mission.description || '',
    address: mission.address || '',
    city: mission.city || '',
    quartier: mission.quartier || '',
    scheduled_date: toDateInput(mission.scheduled_at),
    scheduled_time: toTimeInput(mission.scheduled_at),
    duration_est: mission.duration_est ?? '',
    replacement_preference: mission.replacement_preference || 'fast',
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  const isAssigned = mission.status === 'assigned'

  const submit = async (e) => {
    e.preventDefault()
    if (form.title.trim().length < 6) {
      toast(t('editMissionModal.errors.titleTooShort'), 'error')
      return
    }
    if (!form.city || !form.quartier) {
      toast(t('editMissionModal.errors.cityQuartierRequired'), 'error')
      return
    }
    if (!form.scheduled_date || !form.scheduled_time) {
      toast(t('editMissionModal.errors.dateTimeRequired'), 'error')
      return
    }

    const scheduledAt = new Date(`${form.scheduled_date}T${form.scheduled_time}`).toISOString()

    // proposed_changes ne doit contenir que les champs réellement modifiés — pas un patch complet
    const changes = {}
    if (form.title.trim() !== mission.title) changes.title = form.title.trim()
    if ((form.description || '') !== (mission.description || '')) changes.description = form.description || null
    if (form.address.trim() !== (mission.address || '')) changes.address = form.address.trim()
    if (form.city !== mission.city) changes.city = form.city
    if (form.quartier !== (mission.quartier || '')) changes.quartier = form.quartier
    if (scheduledAt !== new Date(mission.scheduled_at).toISOString()) changes.scheduled_at = scheduledAt
    const durationValue = form.duration_est === '' ? null : parseInt(form.duration_est, 10)
    if (durationValue !== (mission.duration_est ?? null)) changes.duration_est = durationValue
    if (form.replacement_preference !== (mission.replacement_preference || 'fast')) changes.replacement_preference = form.replacement_preference

    if (Object.keys(changes).length === 0) {
      toast(t('editMissionModal.errors.noChanges'), 'error')
      return
    }

    setLoading(true)
    try {
      const { data } = await missionsAPI.edit(mission.id, changes)
      if (data.edit_request) {
        toast(t('editMissionModal.pendingApprovalToast', { message: data.message }), 'info')
      } else {
        toast(t('editMissionModal.appliedToast'), 'success')
      }
      onSaved?.(data)
      onClose()
    } catch (err) {
      toast(err.response?.data?.error || t('editMissionModal.errors.generic'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/75 z-[110] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-base">{t('editMissionModal.title')}</h2>
            <p className="text-xs text-[#AAA] mt-0.5">{mission.title}</p>
          </div>
          <button onClick={onClose} aria-label={t('common.close')} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        {isAssigned && (
          <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/20 rounded-xl p-3 mb-4 text-xs text-[#AAA] leading-relaxed">
            ⚠️ {t('editMissionModal.assignedNotice')}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">{t('editMissionModal.titleLabel')}</label>
            <input className="input" value={form.title} onChange={set('title')} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Autocomplete
              label={t('editMissionModal.cityLabel')}
              value={form.city}
              onChange={(v) => { setVal('city')(v); setVal('quartier')('') }}
              suggestions={VILLES_LIST}
              placeholder={t('editMissionModal.cityPlaceholder')}
            />
            <Autocomplete
              label={t('editMissionModal.quartierLabel')}
              value={form.quartier}
              onChange={setVal('quartier')}
              suggestions={VILLES[form.city] || []}
              placeholder={form.city ? t('editMissionModal.quartierPlaceholder') : t('editMissionModal.quartierPlaceholderDisabled')}
              disabled={!form.city}
            />
          </div>

          <div>
            <label className="label">{t('editMissionModal.addressLabel')}</label>
            <input className="input" value={form.address} onChange={set('address')} placeholder={t('editMissionModal.addressPlaceholder')} />
          </div>

          <div>
            <label className="label">{t('editMissionModal.descriptionLabel')}</label>
            <textarea className="input resize-none h-20" value={form.description} onChange={set('description')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('editMissionModal.dateLabel')}</label>
              <input
                type="date"
                className="input"
                style={{ colorScheme: 'dark', accentColor: '#FF4D00' }}
                value={form.scheduled_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">{t('editMissionModal.timeLabel')}</label>
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

          <div>
            <label className="label">{t('editMissionModal.durationLabel')}</label>
            <input type="number" min="0" className="input" value={form.duration_est} onChange={set('duration_est')}
              placeholder={t('editMissionModal.durationPlaceholder')} />
          </div>

          <div>
            <label className="label">{t('editMissionModal.replacementPreferenceLabel')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setVal('replacement_preference')('fast')}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  form.replacement_preference === 'fast' ? 'border-[#FF4D00] bg-[#FF4D00]/10' : 'border-white/12 bg-[#222] text-[#AAA]'
                }`}>
                🟢 {t('editMissionModal.replacementPreferenceFast')}
              </button>
              <button type="button" onClick={() => setVal('replacement_preference')('choose')}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  form.replacement_preference === 'choose' ? 'border-[#FF4D00] bg-[#FF4D00]/10' : 'border-white/12 bg-[#222] text-[#AAA]'
                }`}>
                🔵 {t('editMissionModal.replacementPreferenceChoose')}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg flex-1 justify-center disabled:opacity-60">
              {loading ? t('editMissionModal.submitLoading') : (isAssigned ? t('editMissionModal.submitRequest') : t('editMissionModal.submitApply'))}
            </button>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-lg">{t('editMissionModal.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
