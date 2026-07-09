import { useNavigate } from 'react-router-dom'

export default function MentionsLegales() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-white/10">
        <button onClick={() => navigate('/')} className="font-display font-bold text-xl tracking-tight">
          SHOOF<span className="text-[#FF4D00]">LY</span>
        </button>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display font-bold text-3xl mb-2">Mentions légales</h1>
        <p className="text-[#AAA] text-sm mb-10">Dernière mise à jour : juillet 2026</p>

        <div className="space-y-8 text-[#CCC] text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">1. Éditeur du site</h2>
            <p className="mb-2 text-amber-400 text-xs">⚠️ Section à compléter dès l'immatriculation officielle de la société.</p>
            <ul className="space-y-2">
              {[
                'Raison sociale : [RAISON SOCIALE EN COURS DE CONSTITUTION — AutoEntrepreneur ou société en cours de création]',
                'Forme juridique : [À COMPLÉTER]',
                'Numéro de Registre du Commerce (RC) : [À COMPLÉTER]',
                'Identifiant Commun de l\'Entreprise (ICE) : [À COMPLÉTER]',
                'Identifiant Fiscal (IF) : [À COMPLÉTER]',
                'Siège social : [ADRESSE], Rabat, Maroc',
                'Capital social : [À COMPLÉTER, le cas échéant]',
                'Responsable de la publication : [NOM DU PORTEUR DE PROJET]',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">2. Contact</h2>
            <ul className="space-y-2">
              {[
                'E-mail général : contact@shoofly.ma',
                'E-mail juridique : legal@shoofly.ma',
                'E-mail confidentialité des données : privacy@shoofly.ma',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">3. Hébergement</h2>
            <p className="mb-2 text-amber-400 text-xs">⚠️ Section à compléter avec les vrais prestataires d'hébergement utilisés en production.</p>
            <ul className="space-y-2">
              {[
                'Hébergement du site (frontend) : [PRESTATAIRE — ex. Vercel Inc.]',
                'Hébergement de l\'application et des données (backend, base de données) : [PRESTATAIRE — ex. Render]',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">4. Propriété intellectuelle</h2>
            <p>L'ensemble des éléments composant la plateforme SHOOFLY (textes, logos, marques, graphismes, icônes, structure) est protégé par le droit marocain de la propriété intellectuelle. Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation écrite préalable est strictement interdite.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">5. Données personnelles</h2>
            <p>Le traitement des données personnelles collectées via la plateforme est détaillé dans notre <button onClick={() => navigate('/confidentialite')} className="text-[#FF4D00] hover:underline">Politique de confidentialité</button>.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">6. Conditions d'utilisation</h2>
            <p>L'utilisation de la plateforme est régie par nos <button onClick={() => navigate('/cgv')} className="text-[#FF4D00] hover:underline">Conditions Générales de Vente et d'Utilisation</button>.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">7. Droit applicable</h2>
            <p>Les présentes mentions légales sont soumises au droit marocain. Tout litige relève de la compétence exclusive des tribunaux de Rabat.</p>
          </section>

        </div>
      </div>
    </div>
  )
}