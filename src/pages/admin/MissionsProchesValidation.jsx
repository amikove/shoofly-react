import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { Spinner, toast, Badge } from '../../components/ui'
import { CASABLANCA_TZ } from '../../utils/casablancaTime'

// PROMPT 5 point 5 (2026-08-18) — missions 'pending' où le client a reçu des candidatures mais
// n'a toujours pas choisi d'Œil, et où le cron de relance (index.js) a jugé la mission trop
// proche de scheduled_at pour compter sur un nouveau WhatsApp (candidature_admin_alert_sent_at
// posé côté backend — voir GET /missions/admin/missions-proches-validation). Liste plate, pas de
// tabs/pagination : ensemble volontairement borné et urgent, l'admin doit tout voir d'un coup
// d'œil. Rafraîchissement périodique (60s, même ordre de grandeur que les compteurs de badge
// d'AppLayout) — "temps restant" est une valeur qui bouge tant que la page reste ouverte.
const REFRESH_MS = 60000

function minutesUntil(iso) {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000)
}

export default function MissionsProchesValidation() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    adminAPI.missionsProchesValidation()
      .then(({ data }) => setMissions(data.missions || []))
      .catch(() => toast(t('missionsProchesValidation.loadError'), 'error'))
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    load()
    const interval = setInterval(load, REFRESH_MS)
    return () => clearInterval(interval)
  }, [load])

  const remainingLabel = (scheduledAt) => {
    const mins = minutesUntil(scheduledAt)
    if (mins < 0) return t('missionsProchesValidation.overdue', { minutes: Math.abs(mins) })
    if (mins < 60) return t('missionsProchesValidation.minutesLeft', { minutes: mins })
    return t('missionsProchesValidation.hoursLeft', { hours: Math.round(mins / 60 * 10) / 10 })
  }

  return (
    <AppLayout>
      <Topbar title={t('missionsProchesValidation.title')} />
      <div className="p-4 md:p-6 space-y-5">
        <p className="text-xs text-[#AAA] max-w-2xl">{t('missionsProchesValidation.subtitle')}</p>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : missions.length === 0 ? (
          <div className="card text-center py-12 text-[#AAA]">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm">{t('missionsProchesValidation.empty')}</p>
          </div>
        ) : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('missionsProchesValidation.table.mission')}</th>
                    <th>{t('missionsProchesValidation.table.client')}</th>
                    <th>{t('missionsProchesValidation.table.scheduledAt')}</th>
                    <th>{t('missionsProchesValidation.table.remaining')}</th>
                    <th>{t('missionsProchesValidation.table.candidatures')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {missions.map((m) => {
                    const overdue = minutesUntil(m.scheduled_at) < 0
                    return (
                      <tr key={m.id}>
                        <td>
                          <div className="text-white">{m.title}</div>
                          <div className="text-xs text-[#AAA]">{m.city}</div>
                        </td>
                        <td>
                          <span
                            className="text-white cursor-pointer hover:text-[#FF4D00] hover:underline"
                            onClick={() => navigate(`/admin/users/${m.client_id}`)}
                          >
                            {m.client_first} {m.client_last}
                          </span>
                          <div className="text-xs text-[#AAA]">{m.client_phone}</div>
                        </td>
                        <td className="text-xs text-[#AAA]">
                          {new Date(m.scheduled_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: CASABLANCA_TZ })}
                        </td>
                        <td>
                          <Badge variant={overdue ? 'red' : 'orange'}>{remainingLabel(m.scheduled_at)}</Badge>
                        </td>
                        <td className="text-[#AAA]">{m.candidature_count}</td>
                        <td>
                          <button
                            onClick={() => navigate('/admin/missions', { state: { search: m.title } })}
                            className="btn btn-primary btn-sm"
                          >
                            {t('missionsProchesValidation.view')}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
