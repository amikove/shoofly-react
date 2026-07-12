import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, toast, Spinner } from '../ui'
import { useAuth } from '../../context/AuthContext'
import { missionsAPI, ticketsAPI } from '../../api'
import {
  getCategoriesForRole, getSubcategoriesForRole, MANUAL_NOTE_SUFFIX,
} from '../../constants/ticketCategories'
import TicketRedirectNotice from './TicketRedirectNotice'

// Remplace l'ancien ReportModal inline (client/Missions.jsx, oeil/Missions.jsx) : point
// d'entrée unique de création de ticket, avec pré-remplissage optionnel depuis une page
// mission (presetMissionId/presetCategory) — voir étape 7.3 de la migration.
export default function NewTicketModal({ open, onClose, onCreated, presetMissionId, presetCategory }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const role = user?.role

  const categories = useMemo(() => getCategoriesForRole(role), [role])

  const [categoryValue, setCategoryValue] = useState('')
  const [subcategoryLabel, setSubcategoryLabel] = useState('')
  const [missionId, setMissionId] = useState('')
  const [message, setMessage] = useState('')
  const [missions, setMissions] = useState([])
  const [loadingMissions, setLoadingMissions] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const selectedCategory = categories.find((c) => c.value === categoryValue) || null
  const subcategories = getSubcategoriesForRole(selectedCategory, role)
  const selectedSubcategory = subcategories.find((s) => s.label === subcategoryLabel) || null
  const showMissionField = selectedSubcategory?.missionRelevant || false

  useEffect(() => {
    if (!open) return
    setCategoryValue(presetCategory || '')
    setSubcategoryLabel('')
    setMissionId(presetMissionId || '')
    setMessage('')
  }, [open, presetCategory, presetMissionId])

  useEffect(() => {
    if (!open || !showMissionField) return
    setLoadingMissions(true)
    const req = role === 'oeil'
      ? missionsAPI.list({ mode: 'mine', limit: 100 })
      : missionsAPI.list({ limit: 100 })
    req.then(({ data }) => setMissions(data.missions || []))
      .catch(() => {})
      .finally(() => setLoadingMissions(false))
  }, [open, showMissionField, role])

  const reset = () => {
    setCategoryValue('')
    setSubcategoryLabel('')
    setMissionId('')
    setMessage('')
  }

  const submit = async () => {
    if (!categoryValue || !message.trim()) return
    setSubmitting(true)
    try {
      const finalMessage = selectedSubcategory?.manualNote
        ? `${message.trim()}${MANUAL_NOTE_SUFFIX}`
        : message.trim()
      const { data } = await ticketsAPI.create({
        category: categoryValue,
        subcategory: subcategoryLabel || null,
        mission_id: missionId || null,
        initial_message: finalMessage,
      })
      toast(t('newTicket.created', { reference: data.ticket.reference }), 'success')
      reset()
      onCreated?.(data.ticket)
      onClose()
    } catch (err) {
      toast(err.response?.data?.error || t('newTicket.createError'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title={t('newTicket.title')} size="md">
      <div className="space-y-4">
        {/* Catégorie */}
        <div>
          <label className="label">{t('newTicket.categoryLabel')}</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {categories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => { setCategoryValue(c.value); setSubcategoryLabel('') }}
                className={`px-3 py-2 rounded-xl text-xs font-medium text-left flex items-center gap-2 border transition-all ${
                  categoryValue === c.value
                    ? c.value === 'urgence'
                      ? 'bg-[#E11D2E]/20 border-[#E11D2E] text-white'
                      : 'bg-[#FF4D00]/15 border-[#FF4D00] text-white'
                    : c.value === 'urgence'
                      ? 'bg-[#E11D2E]/10 border-[#E11D2E]/40 text-[#ff8a93] hover:border-[#E11D2E]'
                      : 'bg-[#222] border-white/12 text-[#AAA] hover:text-white hover:border-white/22'
                }`}
              >
                <span>{c.icon}</span>
                <span>{t(`ticketCategories.categories.${c.labelKey}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sous-catégorie */}
        {selectedCategory && subcategories.length > 0 && (
          <div>
            <label className="label">{t('newTicket.subcategoryLabel')}</label>
            <select
              className="input w-full"
              value={subcategoryLabel}
              onChange={(e) => setSubcategoryLabel(e.target.value)}
            >
              <option value="">{t('newTicket.subcategoryPlaceholder')}</option>
              {subcategories.map((s) => (
                <option key={s.label} value={s.label}>
                  {t(`ticketCategories.subcategories.${s.label}`, s.label)}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedSubcategory && <TicketRedirectNotice subcategory={selectedSubcategory} onNavigateAway={() => { reset(); onClose() }} />}

        {/* Mission liée (optionnelle) */}
        {showMissionField && (
          <div>
            <label className="label">{t('newTicket.missionLabel')}</label>
            {loadingMissions ? (
              <div className="py-2"><Spinner size="sm" /></div>
            ) : (
              <select className="input w-full" value={missionId} onChange={(e) => setMissionId(e.target.value)}>
                <option value="">{t('newTicket.missionNone')}</option>
                {missions.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Message */}
        {(selectedCategory) && (
          <div>
            <label className="label">{t('newTicket.messageLabel')}</label>
            <textarea
              className="input w-full resize-none h-24"
              placeholder={t('newTicket.messagePlaceholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={submit}
            disabled={submitting || !categoryValue || !message.trim()}
            className="btn btn-primary flex-1 justify-center disabled:opacity-50"
          >
            {submitting ? '…' : t('newTicket.submit')}
          </button>
          <button onClick={() => { reset(); onClose() }} className="btn btn-ghost">
            {t('newTicket.cancel')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
