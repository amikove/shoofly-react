import { useNavigate } from 'react-router-dom'

export default function Confidentialite() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-white/10">
        <button onClick={() => navigate('/')} className="font-display font-bold text-xl tracking-tight">
          SHOOF<span className="text-[#FF4D00]">LY</span>
        </button>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display font-bold text-3xl mb-2">Politique de confidentialité</h1>
        <p className="text-[#AAA] text-sm mb-10">Dernière mise à jour : juin 2026</p>

        <div className="space-y-8 text-[#CCC] text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">1. Identité du responsable de traitement</h2>
            <p>La société <strong className="text-white">SHOOFLY SARL</strong>, immatriculée au Registre du Commerce de Rabat sous le numéro RC [À COMPLÉTER], dont le siège social est situé à [ADRESSE LÉGALE], Rabat, Maroc, est responsable du traitement de vos données personnelles conformément à la loi n° 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">2. Données collectées</h2>
            <p className="mb-3">Dans le cadre de l'utilisation de la plateforme SHOOFLY, nous collectons les données suivantes :</p>
            <ul className="space-y-2">
              {[
                'Données d\'identité : nom, prénom, date de naissance, photo d\'identité (pour les Œils)',
                'Données de contact : adresse e-mail, numéro de téléphone, ville et quartier',
                'Données de connexion : adresse IP, historique de connexion, type d\'appareil',
                'Données de transaction : historique des missions, montants, paiements',
                'Données de géolocalisation : position GPS pendant les missions (Œils uniquement)',
                'Données de communication : messages échangés sur la plateforme',
                'Données d\'évaluation : notes et avis laissés par les utilisateurs',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">3. Finalités du traitement</h2>
            <p className="mb-3">Vos données sont traitées pour les finalités suivantes :</p>
            <ul className="space-y-2">
              {[
                'Création et gestion de votre compte utilisateur',
                'Mise en relation entre clients et Œils',
                'Exécution et suivi des missions',
                'Traitement des paiements et gestion du portefeuille',
                'Prévention de la fraude et sécurisation de la plateforme',
                'Envoi de notifications relatives à vos missions',
                'Amélioration de nos services et analyses statistiques anonymisées',
                'Respect de nos obligations légales et réglementaires',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">4. Base légale du traitement</h2>
            <p>Le traitement de vos données repose sur : l'exécution du contrat qui vous lie à SHOOFLY, votre consentement explicite lors de l'inscription, nos intérêts légitimes (prévention de la fraude, amélioration du service), et le respect de nos obligations légales.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">5. Durée de conservation</h2>
            <ul className="space-y-2">
              {[
                'Données de compte : conservées pendant toute la durée de votre inscription, puis 3 ans après la clôture du compte',
                'Données de transaction : 10 ans conformément aux obligations comptables marocaines',
                'Données de géolocalisation : 6 mois après la fin de la mission',
                'Messages : 2 ans après la clôture de la mission concernée',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">6. Partage des données</h2>
            <p className="mb-3">Vos données peuvent être partagées avec :</p>
            <ul className="space-y-2">
              {[
                'Les autres utilisateurs de la plateforme dans le strict cadre de l\'exécution d\'une mission (nom, note, ville)',
                'Nos prestataires techniques (hébergement, paiement, notifications) dans le cadre de leurs missions',
                'Les autorités compétentes marocaines sur demande légale',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">SHOOFLY ne vend en aucun cas vos données personnelles à des tiers.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">7. Vos droits</h2>
            <p className="mb-3">Conformément à la loi n° 09-08, vous disposez des droits suivants :</p>
            <ul className="space-y-2">
              {[
                'Droit d\'accès à vos données personnelles',
                'Droit de rectification des données inexactes',
                'Droit d\'opposition au traitement',
                'Droit à l\'effacement de vos données',
                'Droit à la portabilité de vos données',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">Pour exercer ces droits, contactez-nous à : <strong className="text-white">privacy@shoofly.ma</strong></p>
            <p className="mt-2">Vous pouvez également introduire une réclamation auprès de la <strong className="text-white">CNDP</strong> (Commission Nationale de contrôle de la protection des Données à caractère Personnel).</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">8. Sécurité</h2>
            <p>SHOOFLY met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte, destruction ou altération, notamment le chiffrement des données en transit (HTTPS), le hachage des mots de passe, et des accès restreints aux données par notre équipe.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">9. Cookies</h2>
            <p>SHOOFLY utilise des cookies strictement nécessaires au fonctionnement de la plateforme (authentification, session). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">10. Contact</h2>
            <p>Pour toute question relative à cette politique : <strong className="text-white">privacy@shoofly.ma</strong><br />SHOOFLY SARL — [ADRESSE LÉGALE] — Rabat, Maroc</p>
          </section>

        </div>
      </div>
    </div>
  )
}