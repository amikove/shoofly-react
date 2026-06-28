export default function ComplianceModal({ onAccept }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#181818] border border-orange-500/30 rounded-2xl p-6 w-full max-w-md shadow-xl">

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl flex-shrink-0">
            📋
          </div>
          <h2 className="font-bold text-base">Rappel avant démarrage</h2>
        </div>

        {/* Rappels mission */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-3 bg-[#222] rounded-xl p-3">
            <span className="text-xl flex-shrink-0">📸</span>
            <div>
              <p className="text-sm font-semibold text-white">Photos obligatoires</p>
              <p className="text-xs text-[#AAA] mt-0.5">Vous devez prendre des photos sur place pour prouver votre déplacement. Sans preuve visuelle, la mission peut être contestée.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[#222] rounded-xl p-3">
            <span className="text-xl flex-shrink-0">📍</span>
            <div>
              <p className="text-sm font-semibold text-white">Restez sur le lieu de mission</p>
              <p className="text-xs text-[#AAA] mt-0.5">Votre présence physique est requise. Toute incohérence de localisation sera détectée.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[#222] rounded-xl p-3">
            <span className="text-xl flex-shrink-0">⏱️</span>
            <div>
              <p className="text-sm font-semibold text-white">Respectez les délais</p>
              <p className="text-xs text-[#AAA] mt-0.5">Complétez la mission dans les délais convenus avec le client.</p>
            </div>
          </div>
        </div>

        {/* Règle anti-contact */}
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-4">
          <p className="text-xs text-white/80 leading-relaxed">
            🚫 Toute communication doit rester sur <strong className="text-white">SHOOFLY</strong>. Le partage de numéros, emails ou comptes externes est <strong className="text-orange-400">strictement interdit</strong> et entraîne la suspension du compte.
          </p>
        </div>

        <div className="flex items-start gap-2 mb-5">
          <span className="text-green-400 mt-0.5">✓</span>
          <p className="text-xs text-[#AAA] leading-relaxed">
            En continuant, vous acceptez ces conditions. Tout manquement peut entraîner un avertissement ou la suspension de votre compte.
          </p>
        </div>

        <button
          onClick={onAccept}
          className="btn btn-primary w-full justify-center"
        >
          J'ai compris, je démarre →
        </button>
      </div>
    </div>
  )
}