import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Affichée dans le formulaire de création de ticket quand la sous-catégorie
// sélectionnée est marquée [REDIRECTION] (redirectRoute) ou manualNote (RGPD/
// suppression de données) dans src/constants/ticketCategories.js. N'empêche
// jamais la création du ticket — informe seulement d'un chemin plus direct.
export default function TicketRedirectNotice({ subcategory, onNavigateAway }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (!subcategory || (!subcategory.redirectRoute && !subcategory.manualNote)) return null

  if (subcategory.redirectRoute) {
    return (
      <div className="rounded-xl border border-[#FF4D00]/40 bg-[#FF4D00]/10 p-3 text-xs text-white flex items-center justify-between gap-3">
        <span>{t('ticketRedirect.routeTitle')}</span>
        <button
          type="button"
          onClick={() => { onNavigateAway?.(); navigate(subcategory.redirectRoute) }}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-[#FF4D00] text-white text-xs font-medium hover:bg-[#e64500] transition-colors"
        >
          {t('ticketRedirect.routeCta')}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-3 text-xs text-[#aaa]">
      <p className="font-medium text-white mb-0.5">{t('ticketRedirect.manualTitle')}</p>
      <p>{t('ticketRedirect.manualBody')}</p>
    </div>
  )
}
