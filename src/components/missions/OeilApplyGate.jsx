import { useTranslation } from 'react-i18next'
import { isApplyBlocked } from '../../utils/oeilApplyGate'

// Chantier « première mission offerte + solde insuffisant côté Œil » (2026-09-28).
// AUCUNE règle métier ici : le serveur (GET /missions?mode=available, rôle Œil) calcule tout —
//   oeil_wallet : { balance, first_mission_free, free_offer_mission_id, cashplus_enabled }
//   par mission : required_balance, apply_block (null | INSUFFICIENT_BALANCE_TO_APPLY |
//                 FREE_MISSION_ALREADY_USED), free_offer (cette mission porte la candidature offerte).
// Ce fichier ne fait qu'afficher ces valeurs (bandeaux, bouton grisé, ligne d'explication).

const fmtMad = (v) => {
  const n = Number(v) || 0
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function RechargeLink({ wallet, onRecharge, className = '' }) {
  const { t } = useTranslation()
  if (!wallet?.cashplus_enabled || !onRecharge) return null
  return (
    <button type="button" onClick={onRecharge} className={`text-[#FF4D00] font-semibold underline underline-offset-2 ${className}`}>
      {t('oeilWallet.rechargeLink')}
    </button>
  )
}

// Bandeaux en haut d'une liste de missions disponibles :
//  - 🎁 tant que l'Œil peut encore bénéficier de sa mission offerte (ou qu'elle est en jeu) ;
//  - « Rechargez… » tant que le solde ne couvre pas le plus petit montant exigé parmi les
//    missions affichées (missions offertes / offrables exclues : rien à couvrir).
export function OeilWalletBanners({ wallet, missions, onRecharge }) {
  const { t } = useTranslation()
  if (!wallet) return null
  const showGift = wallet.first_mission_free === true || !!wallet.free_offer_mission_id
  const required = (missions || []).map((m) => Number(m.required_balance) || 0).filter((v) => v > 0)
  const showRecharge = required.length > 0 && (Number(wallet.balance) || 0) < Math.min(...required)
  if (!showGift && !showRecharge) return null
  return (
    <div className="space-y-2 mb-4">
      {showGift && (
        <div className="bg-green-500/10 border border-green-500/25 rounded-xl px-3 py-2.5 text-xs text-green-300 break-words">
          {t('oeilWallet.giftBanner')}
        </div>
      )}
      {showRecharge && (
        <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-[#CCC] flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="break-words">{t('oeilWallet.rechargeBanner')}</span>
          <RechargeLink wallet={wallet} onRecharge={onRecharge} />
        </div>
      )}
    </div>
  )
}

// Explication sous le bouton « Postuler » d'une mission : pourquoi il est grisé (et lien
// Recharger), ou rappel que cette candidature est la mission offerte.
export function ApplyBlockInfo({ mission, wallet, onRecharge, className = '' }) {
  const { t } = useTranslation()
  if (mission?.free_offer) {
    return <p className={`text-[11px] text-green-300 break-words ${className}`}>{t('oeilWallet.freeOfferBadge')}</p>
  }
  if (!isApplyBlocked(mission)) return null
  return (
    <div className={`text-[11px] text-[#AAA] break-words ${className}`}>
      {mission.apply_block === 'FREE_MISSION_ALREADY_USED'
        ? t('oeilWallet.freeUsedDetail')
        : t('oeilWallet.insufficientDetail', { commission: fmtMad(mission.required_balance), balance: fmtMad(wallet?.balance) })}
      <RechargeLink wallet={wallet} onRecharge={onRecharge} className="ms-2" />
    </div>
  )
}
