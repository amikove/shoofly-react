import { useNavigate } from 'react-router-dom'

export default function Verification() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-white/10">
        <button onClick={() => navigate('/')} className="font-display font-bold text-xl tracking-tight">
          SHOOF<span className="text-[#FF4D00]">LY</span>
        </button>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display font-bold text-3xl mb-2">Processus de vérification des Œils</h1>
        <p className="text-[#AAA] text-sm mb-10">Votre sécurité est notre priorité</p>

        <div className="space-y-8 text-[#CCC] text-sm leading-relaxed">

          <section className="bg-[#FF4D00]/5 border border-[#FF4D00]/20 rounded-2xl p-6">
            <p className="text-white font-medium">Chez SHOOFLY, chaque Œil est soigneusement vérifié avant d'accéder aux missions. Ce processus garantit la sécurité des clients et la qualité du service.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-4">Étape 1 — Inscription</h2>
            <ul className="space-y-2">
              {[
                'Création du compte avec email et mot de passe',
                'Renseignement des informations personnelles (nom, prénom, date de naissance, ville)',
                'Acceptation des CGV et de la politique de confidentialité',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-4">Étape 2 — Vérification d'identité</h2>
            <ul className="space-y-2">
              {[
                'Soumission d\'une pièce d\'identité valide (CIN marocaine ou passeport)',
                'Selfie en temps réel pour confirmer la correspondance avec la pièce d\'identité',
                'Vérification de la majorité (18 ans minimum)',
                'Vérification de l\'authenticité du document par notre équipe',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-4">Étape 3 — Validation par l'équipe SHOOFLY</h2>
            <ul className="space-y-2">
              {[
                'Examen du dossier par notre équipe dans un délai de 24 à 48 heures',
                'Vérification de l\'absence d\'antécédents judiciaires (sur déclaration)',
                'Entretien téléphonique ou vidéo si nécessaire',
                'Attribution du badge "Œil Vérifié ✓" après validation',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-4">Étape 4 — Suivi continu</h2>
            <ul className="space-y-2">
              {[
                'Évaluation après chaque mission par le Client',
                'Surveillance du taux de satisfaction et des réclamations',
                'Suspension immédiate en cas de comportement frauduleux ou signalement grave',
                'Re-vérification périodique tous les 12 mois',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-4">Motifs de refus ou suspension</h2>
            <ul className="space-y-2">
              {[
                'Documents d\'identité invalides, expirés ou falsifiés',
                'Âge inférieur à 18 ans',
                'Fausses déclarations lors de l\'inscription',
                'Note moyenne inférieure à 2/5 sur plusieurs missions',
                'Réclamations répétées ou comportements signalés par des Clients',
                'Tentative de contournement de la plateforme',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-4">Confidentialité des données de vérification</h2>
            <p>Les documents d'identité collectés lors du processus de vérification sont stockés de manière sécurisée, chiffrés, et accessibles uniquement à l'équipe de vérification SHOOFLY. Ils ne sont jamais partagés avec les Clients ni avec des tiers, sauf obligation légale.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">Contact</h2>
            <p>Pour toute question sur le processus de vérification : <strong className="text-white">verification@shoofly.ma</strong></p>
          </section>

        </div>
      </div>
    </div>
  )
}