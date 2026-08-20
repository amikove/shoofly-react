import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usersAPI } from '../../api'
import { Modal } from '../ui'
import { CASABLANCA_TZ } from '../../utils/casablancaTime'

const AMOUNTS = [100, 200, 300, 500]

function formatExpiration(iso) {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: CASABLANCA_TZ,
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

// Recharge du wallet Œil via CashPlus (paiement cash en agence) — voir
// RECAP_INTEGRATION_CASHPLUS.md. Montants fixes, jamais de saisie libre (même liste que
// cashplusService.ALLOWED_AMOUNTS côté backend, qui reste la seule validation qui compte).
export default function CashPlusRechargeModal({ onClose }) {
  const { t } = useTranslation()
  const [view, setView] = useState('choice') // 'choice' | 'result' | 'error'
  const [loadingAmount, setLoadingAmount] = useState(null)
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const generate = async (amount) => {
    setLoadingAmount(amount)
    try {
      const { data } = await usersAPI.cashplusGenerateToken({ amount })
      setResult(data)
      setView('result')
    } catch (err) {
      setErrorMessage(err.response?.data?.error || t('oeilGains.recharge.errorGenericMessage'))
      setView('error')
    } finally {
      setLoadingAmount(null)
    }
  }

  const titles = {
    choice: t('oeilGains.recharge.modalTitle'),
    result: t('oeilGains.recharge.successTitle'),
    error:  t('oeilGains.recharge.errorTitle'),
  }

  return (
    <Modal open onClose={onClose} title={titles[view]} subtitle={view === 'choice' ? t('oeilGains.recharge.modalSubtitle') : undefined}>
      {view === 'choice' && (
        <div>
          <label className="label">{t('oeilGains.recharge.chooseAmountLabel')}</label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => generate(amount)}
                disabled={loadingAmount !== null}
                className="bg-[#222] hover:bg-[#2A2A2A] border border-white/10 rounded-xl py-4 text-center transition-colors disabled:opacity-50"
              >
                <span className="text-xl font-bold">{loadingAmount === amount ? '...' : amount}</span>
                {loadingAmount !== amount && <span className="text-sm ms-1 text-[#AAA]">MAD</span>}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="btn btn-ghost w-full justify-center mt-5">
            {t('oeilGains.recharge.cancel')}
          </button>
        </div>
      )}

      {view === 'result' && result && (
        <div>
          <label className="label">{t('oeilGains.recharge.tokenLabel')}</label>
          <div className="bg-[#222] border border-white/10 rounded-xl px-3 py-2.5 font-mono text-sm break-all select-all mb-4">
            {result.token}
          </div>

          <div className="bg-[#222] rounded-xl p-3 mb-4">
            <p className="text-xs text-[#AAA] mb-1">{t('oeilGains.recharge.expirationLabel')}</p>
            <p className="text-sm font-semibold">{formatExpiration(result.dateExpiration)}</p>
          </div>

          <p className="text-sm text-white/80 mb-4 leading-relaxed">
            {t('oeilGains.recharge.instructionText', {
              date: formatExpiration(result.dateExpiration),
              amount: result.amount,
            })}
          </p>

          <div className="bg-[#222] rounded-xl p-3 mb-2 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#AAA]">{t('oeilGains.recharge.amountBreakdown.rechargeAmount')}</span>
              <span>{parseFloat(result.amount).toFixed(2)} MAD</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#AAA]">{t('oeilGains.recharge.amountBreakdown.fees')}</span>
              <span>{parseFloat(result.fees).toFixed(2)} MAD</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-white/10">
              <span>{t('oeilGains.recharge.amountBreakdown.total')}</span>
              <span className="text-[#FF4D00]">{(parseFloat(result.amount) + parseFloat(result.fees)).toFixed(2)} MAD</span>
            </div>
          </div>
          <p className="text-[11px] text-[#666] mb-5">{t('oeilGains.recharge.totalHint')}</p>

          <button onClick={onClose} className="btn btn-primary w-full justify-center">
            {t('oeilGains.recharge.closeButton')}
          </button>
        </div>
      )}

      {view === 'error' && (
        <div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-5">
            <p className="text-sm text-white/80">{errorMessage}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-ghost flex-1 justify-center">
              {t('oeilGains.recharge.closeButton')}
            </button>
            <button onClick={() => setView('choice')} className="btn btn-primary flex-1 justify-center">
              {t('oeilGains.recharge.retryButton')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
