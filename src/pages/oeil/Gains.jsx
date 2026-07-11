import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { usersAPI } from '../../api'
import { Spinner, EmptyState, toast } from '../../components/ui'

export default function OeilGains() {
  const { t } = useTranslation()
  const TYPE_LABELS = {
    immobilier: t('oeilGains.typeLabels.immobilier'),
    file_attente: t('oeilGains.typeLabels.fileAttente'),
    audit: t('oeilGains.typeLabels.audit'),
    personnalisee: t('oeilGains.typeLabels.personnalisee'),
  }
  const [lines, setLines] = useState([])
  const [balance, setBalance] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    usersAPI.oeilEarnings()
      .then(({ data }) => {
        setLines(data.lines || [])
        setBalance(data.balance || 0)
          setTotalEarnings(data.total_earnings || 0)
        })
        .catch(() => toast('Erreur lors du chargement de vos gains', 'error'))
        .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      <Topbar title={t('oeilGains.title')} />
      <div className="p-6">
        {/* Résumé */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="card">
            <p className="text-xs text-[#AAA] mb-1">{t('oeilGains.currentBalanceLabel')}</p>
            <p className="text-2xl font-bold text-green-400">{parseFloat(balance).toFixed(0)} MAD</p>
          </div>
          <div className="card">
            <p className="text-xs text-[#AAA] mb-1">{t('oeilGains.totalEarningsLabel')}</p>
            <p className="text-2xl font-bold">{parseFloat(totalEarnings).toFixed(0)} MAD</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : lines.length === 0 ? (
          <EmptyState icon="💰" title={t('oeilGains.emptyTitle')} description={t('oeilGains.emptyDesc')} />
        ) : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="text-center">{t('oeilGains.table.date')}</th>
                    <th className="text-center">{t('oeilGains.table.type')}</th>
                    <th className="text-center">{t('oeilGains.table.executionDate')}</th>
                    <th className="text-center">{t('oeilGains.table.status')}</th>
                    <th className="text-center">{t('oeilGains.table.earnings')}</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={`${l.kind}-${l.id}`}>
                      <td className="text-xs text-[#AAA]">
                        {new Date(l.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="font-medium">
                        {l.kind === 'transfer' ? t('oeilGains.bankTransferLabel') : (TYPE_LABELS[l.type] || l.title)}
                      </td>
                      <td className="text-xs text-[#AAA]">
                        {l.kind === 'mission' && l.scheduled_at
                          ? new Date(l.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        {l.kind === 'transfer'
                          ? <span className="badge badge-blue">{t('oeilGains.transferredBadge')}</span>
                          : <span className="badge badge-green">{t('oeilGains.completedBadge')}</span>}
                      </td>
                      <td className={`font-semibold ${(l.amount || 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {(l.amount || 0) < 0 ? '' : '+'}{(l.amount || 0).toFixed(0)} MAD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}