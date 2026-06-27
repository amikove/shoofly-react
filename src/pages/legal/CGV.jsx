import { useNavigate } from 'react-router-dom'

export default function CGV() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-white/10">
        <button onClick={() => navigate('/')} className="font-display font-bold text-xl tracking-tight">
          SHOOF<span className="text-[#FF4D00]">LY</span>
        </button>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display font-bold text-3xl mb-2">Conditions Générales de Vente et d'Utilisation</h1>
        <p className="text-[#AAA] text-sm mb-10">Dernière mise à jour : juin 2026</p>

        <div className="space-y-8 text-[#CCC] text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">1. Objet et champ d'application</h2>
            <p>Les présentes Conditions Générales de Vente et d'Utilisation (CGVU) régissent l'accès et l'utilisation de la plateforme SHOOFLY, éditée par la société SHOOFLY SARL, et s'appliquent à toute personne utilisant la plateforme en qualité de Client ou d'Œil (prestataire de terrain). Toute utilisation de la plateforme implique l'acceptation pleine et entière des présentes CGVU.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">2. Définitions</h2>
            <ul className="space-y-2">
              {[
                '**Plateforme** : le site web et l\'application SHOOFLY accessible à l\'adresse shoofly.ma',
                '**Client** : toute personne physique ou morale créant et commandant des missions sur la plateforme',
                '**Œil** : prestataire indépendant inscrit sur la plateforme pour effectuer des missions physiques',
                '**Mission** : tâche physique commandée par un Client et exécutée par un Œil',
                '**Commission** : rémunération prélevée par SHOOFLY sur le prix de chaque mission (20%)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span dangerouslySetInnerHTML={{__html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')}} />
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">3. Inscription et conditions d'accès</h2>
            <p className="mb-3">Pour utiliser la plateforme, l'utilisateur doit :</p>
            <ul className="space-y-2">
              {[
                'Être âgé d\'au moins 18 ans',
                'Fournir des informations exactes et à jour lors de l\'inscription',
                'Disposer d\'un moyen de paiement valide (Clients)',
                'Fournir une pièce d\'identité valide et passer le processus de vérification (Œils)',
                'Accepter les présentes CGVU et la Politique de confidentialité',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">SHOOFLY se réserve le droit de refuser ou de suspendre tout compte sans justification.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">4. Statut des Œils</h2>
            <p>Les Œils sont des prestataires indépendants et non des employés, agents ou représentants de SHOOFLY. SHOOFLY agit uniquement en qualité d'intermédiaire de mise en relation. Chaque Œil est seul responsable de l'exécution de ses missions, du respect des lois applicables, et de ses obligations fiscales et sociales.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">5. Création et exécution des missions</h2>
            <ul className="space-y-2">
              {[
                'Le Client décrit sa mission, fixe son budget et choisit parmi les Œils intéressés',
                'L\'Œil accepte la mission et s\'engage à l\'exécuter conformément aux instructions',
                'Toute communication relative à la mission doit rester sur la plateforme SHOOFLY',
                'L\'échange de coordonnées personnelles (téléphone, email, réseaux sociaux) est strictement interdit',
                'L\'Œil s\'engage à respecter les délais et à fournir les preuves d\'exécution demandées',
                'Le Client dispose de 12 heures après la fin de la mission pour valider ou contester',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">6. Prix et paiement</h2>
            <ul className="space-y-2">
              {[
                'Le prix de chaque mission est fixé librement par le Client, avec un minimum de 50 MAD',
                'SHOOFLY prélève une commission de 20% sur chaque mission complétée',
                'L\'Œil perçoit 80% du montant de la mission après validation par le Client',
                'Le paiement est effectué via CMI (Centre Monétique Interbancaire)',
                'Le paiement est sécurisé et libéré uniquement après validation de la mission',
                'En cas de validation automatique (après 12h), le paiement est transféré automatiquement',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">7. Politique de remboursement</h2>
            <ul className="space-y-2">
              {[
                'Annulation avant assignation d\'un Œil : remboursement intégral sous 5 jours ouvrés',
                'Annulation après assignation : remboursement de 50% du montant si annulation plus de 2h avant la mission, aucun remboursement dans les 2h précédant la mission',
                'Mission non exécutée par l\'Œil : remboursement intégral automatique',
                'Réclamation acceptée par l\'admin : remboursement intégral crédité sur le portefeuille SHOOFLY',
                'Le portefeuille SHOOFLY peut être utilisé pour de futures missions ou faire l\'objet d\'une demande de virement bancaire sous 10 jours ouvrés',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">8. Réclamations et litiges</h2>
            <p className="mb-3">En cas de litige entre un Client et un Œil :</p>
            <ul className="space-y-2">
              {[
                'Le Client dispose de 12 heures après la fin de mission pour soumettre une réclamation motivée',
                'SHOOFLY examine la réclamation et rend une décision dans un délai de 48 heures',
                'La décision de SHOOFLY est souveraine et s\'impose aux deux parties',
                'En cas de réclamation abusive répétée, SHOOFLY se réserve le droit de suspendre le compte',
                'Tout litige non résolu à l\'amiable sera soumis aux tribunaux compétents de Rabat',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">9. Responsabilités et limitations</h2>
            <ul className="space-y-2">
              {[
                'SHOOFLY est un intermédiaire de mise en relation et n\'est pas partie au contrat entre Client et Œil',
                'SHOOFLY ne garantit pas les résultats des missions ni la disponibilité permanente des Œils',
                'La responsabilité de SHOOFLY est limitée au montant de la commission perçue sur la mission concernée',
                'SHOOFLY n\'est pas responsable des dommages indirects, pertes de chance ou préjudices consécutifs',
                'L\'Œil est seul responsable de l\'exécution de la mission et de tout dommage causé à des tiers',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">10. Comportements interdits</h2>
            <ul className="space-y-2">
              {[
                'Contournement de la plateforme (contact direct hors SHOOFLY)',
                'Fausse identité ou usurpation d\'identité',
                'Fausses missions ou faux rapports',
                'Harcèlement, menaces ou comportements abusifs envers d\'autres utilisateurs',
                'Utilisation de la plateforme à des fins illégales',
                'Tentative de fraude au paiement',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">Tout manquement entraîne la suspension immédiate du compte et peut faire l'objet de poursuites judiciaires.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">11. Propriété intellectuelle</h2>
            <p>La marque SHOOFLY, le logo, le design et l'ensemble des contenus de la plateforme sont la propriété exclusive de SHOOFLY SARL et sont protégés par le droit marocain de la propriété intellectuelle. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">12. Modification des CGVU</h2>
            <p>SHOOFLY se réserve le droit de modifier les présentes CGVU à tout moment. Les utilisateurs seront informés par email ou notification in-app. La poursuite de l'utilisation de la plateforme après modification vaut acceptation des nouvelles conditions.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">13. Droit applicable</h2>
            <p>Les présentes CGVU sont soumises au droit marocain, notamment la loi n° 31-08 sur la protection du consommateur, la loi n° 09-08 sur la protection des données personnelles, et le Code des obligations et des contrats (DOC). Tout litige sera soumis à la compétence exclusive des tribunaux de Rabat.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">14. Contact</h2>
            <p>Pour toute question : <strong className="text-white">legal@shoofly.ma</strong><br />SHOOFLY SARL — [ADRESSE LÉGALE] — Rabat, Maroc</p>
          </section>

        </div>
      </div>
    </div>
  )
}