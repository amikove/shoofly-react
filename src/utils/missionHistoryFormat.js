import { useTranslation } from 'react-i18next'

export function useStatusConfig() {
  const { t } = useTranslation()
  return {
    pending:          { icon: '📋', label: t('missionHistoryModal.status.pending'),   color: 'text-yellow-400'  },
    assigned:         { icon: '🤝', label: t('missionHistoryModal.status.assigned'),  color: 'text-blue-400'    },
    en_route:         { icon: '🚗', label: t('missionHistoryModal.status.enRoute'),   color: 'text-blue-400'    },
    active:           { icon: '▶️', label: t('missionHistoryModal.status.active'),     color: 'text-[#FF4D00]'   },
    completed:        { icon: '✅', label: t('missionHistoryModal.status.completed'), color: 'text-green-400'   },
    validated:        { icon: '💰', label: t('missionHistoryModal.status.validated'), color: 'text-green-400'   },
    cancelled:        { icon: '❌', label: t('missionHistoryModal.status.cancelled'), color: 'text-red-400'     },
    sous_reclamation: { icon: '🚨', label: t('missionHistoryModal.status.sousReclamation'), color: 'text-orange-400'  },
  }
}

export function formatHistoryDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
