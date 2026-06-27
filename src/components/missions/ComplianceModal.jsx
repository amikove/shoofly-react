export default function ComplianceModal({ onAccept }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#181818] border border-orange-500/30 rounded-2xl p-6 w-full max-w-md shadow-xl">

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl flex-shrink-0">
            ⚠️
          </div>
          <h2 className="font-bold text-base">Important — À lire avant de continuer</h2>
        </div>

        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-5">
          <p className="text-sm text-white/80 leading-relaxed mb-3">
            Afin de garantir votre sécurité et le bon déroulement de la mission, toute communication doit rester sur <strong className="font-display font-bold text-white">SHOOF<span className="text-[#FF4D00]">LY</span></strong> jusqu'à sa clôture.
          </p>
          <p className="text-sm text-white/80 leading-relaxed">
            Le partage de numéros de téléphone, d'adresses e-mail, de liens ou de comptes de messagerie externe est <strong className="text-orange-400">strictement interdit</strong>. Cette règle protège les deux parties et garantit que notre équipe puisse intervenir efficacement en cas de problème.
          </p>
        </div>

        <div className="flex items-start gap-2 mb-5">
          <span className="text-green-400 mt-0.5">✓</span>
          <p className="text-xs text-[#AAA] leading-relaxed">
            En continuant, vous acceptez de respecter cette règle. Tout contournement de la plateforme entraîne la suspension du compte.
          </p>
        </div>

        <button
          onClick={onAccept}
          className="btn btn-primary w-full justify-center"
        >
          J'ai compris, je continue →
        </button>
      </div>
    </div>
  )
}