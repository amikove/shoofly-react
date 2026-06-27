import { useNavigate } from 'react-router-dom'

const MISSIONS = [
  { icon: '🏠', label: 'Immobilier',     desc: 'vérification d\'annonces, Visites de biens, état des lieux ' },
  { icon: '⏳', label: 'File d\'attente', desc: 'CNSS, consulats, hôpitaux, banques, administrations'        },
  { icon: '🔍', label: 'Audit mystère',  desc: 'Évaluation anonyme de restaurants, commerces et services'                },
  { icon: '🎯', label: 'Personnalisée',  desc: 'Toute mission de présence physique sur mesure'              },
]

const STEPS = [
  { n: '01', title: 'Créez votre mission', desc: 'Décrivez votre besoin, choisissez la ville et le budget. 1 minute suffit.' },
  { n: '02', title: 'Un Œil accepte',      desc: 'Un agent de terrain vérifié près de chez vous prend en charge votre mission.'  },
  { n: '03', title: 'Mission accomplie',   desc: 'Vous recevez un rapport détaillé et validez quand vous êtes satisfait.'        },
]


const WHY = [
  { icon: '🛡️', label: 'Agents vérifiés et identifiés',        desc: 'Chaque Œil est vérifié, identifié et évalué avant d\'accéder à la plateforme'         },
  { icon: '📡', label: 'Suivi en temps réel',                   desc: 'Suivez l\'avancement de votre mission en direct, étape par étape'                      },
  { icon: '🎥', label: 'Preuves d\'exécution',                  desc: 'Photos et vidéos transmises à chaque mission pour confirmer l\'accomplissement'        },
  { icon: '📋', label: 'Rapports standardisés et objectifs',    desc: 'Chaque mission est documentée selon une grille de contrôle complète : photos de preuves, observations détaillées et note globale. Vous décidez en toute confiance, sans vous déplacer.' },
  { icon: '⭐', label: 'Notes et avis clients',                  desc: 'Choisissez votre Œil en toute confiance grâce aux avis des précédents clients'        },
  { icon: '🔐', label: 'Paiement libéré après validation',      desc: 'L\'agent est payé uniquement lorsque vous validez la mission — jamais avant. Votre argent est sécurisé jusqu\'à votre confirmation.' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">



      {/* NAV */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-white/10">
        <div className="font-display font-bold text-xl tracking-tight">
          SHOOF<span className="text-[#FF4D00]">LY</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')}
            className="text-sm text-[#AAA] hover:text-white transition-colors">
            Connexion
          </button>
          <button onClick={() => navigate('/register')}
            className="bg-[#FF4D00] hover:bg-[#e04400] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            S'inscrire
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-6 md:px-16 py-24 md:py-36 max-w-4xl mx-auto text-center">
        <div className="inline-block bg-[#FF4D00]/10 border border-[#FF4D00]/20 text-[#FF4D00] text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          🇲🇦 Disponible au Maroc
        </div>

            <div className="text-[#AAA] text-sm font-medium tracking-widest uppercase mb-4">
            Nous attendons. Vous vivez.
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight mb-6">
            Soyez partout.<br />
            <span className="text-[#FF4D00]">Sans bouger.</span>
            </h1>
            <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto mb-4 leading-relaxed">
            Pourquoi perdre une demi-journée dans une file d'attente (CNSS, cabinet, consulat...), parcourir des centaines de kilomètres pour être choqué d'un Airbnb qui ne correspond pas à l'annonce, ou interrompre votre journée de congé pour une simple démarche administrative ?
            </p>
            <p className="text-[#FF4D00] font-semibold text-base md:text-lg mb-4">
            Votre temps a plus de valeur que cela.
            </p>
            <p className="text-[#AAA] text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            <strong className="font-display font-bold text-white">SHOOF<span className="text-[#FF4D00]">LY</span></strong> vous met en relation avec votre Œil sur le terrain : une personne vérifiée qui attend, visite, vérifie, récupère ou accomplit toute mission physique à votre place, partout au Maroc.
            </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/register')}
            className="bg-[#FF4D00] hover:bg-[#e04400] text-white font-semibold px-8 py-4 rounded-2xl text-base transition-colors">
            Créer une mission →
          </button>
          <button onClick={() => navigate('/register')}
            className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-colors">
            Devenir un Œil
          </button>
        </div>
      </section>

      {/* TYPES DE MISSIONS */}
      <section className="px-6 md:px-16 py-20 bg-[#141414]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-center mb-3">
            Quelles missions peut-on confier ?
          </h2>
          <p className="text-[#AAA] text-center mb-12">Toute situation nécessitant une présence physique</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {MISSIONS.map((m) => (
              
              <div key={m.label} className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 hover:border-[#FF4D00]/30 transition-colors text-center">
                <div className="text-4xl mb-4">{m.icon}</div>
                <div className="font-semibold mb-2">{m.label}</div>
                <div className="text-xs text-[#AAA] leading-relaxed">{m.desc}</div>
              </div>
              
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="px-6 md:px-16 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-center mb-3">
            Comment ça marche ?
          </h2>
          <p className="text-[#AAA] text-center mb-12">Simple, rapide, fiable</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center mx-auto mb-4">
                  <span className="font-display font-bold text-[#FF4D00] text-lg">{s.n}</span>
                </div>
                <div className="font-semibold mb-2">{s.title}</div>
                <div className="text-sm text-[#AAA] leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POURQUOI SHOOFLY */}
      <section className="px-6 md:px-16 py-20 bg-[#141414]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-center mb-12">
            Pourquoi Shoofly ?
          </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {WHY.map((w) => (
                    <div key={w.label} className="flex items-start gap-4 bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 hover:border-[#FF4D00]/30 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-[#FF4D00]/10 flex items-center justify-center text-2xl flex-shrink-0">
                        {w.icon}
                    </div>
                    <div>
                        <div className="font-semibold text-sm mb-1">{w.label}</div>
                        <div className="text-xs text-[#AAA] leading-relaxed">{w.desc}</div>
                    </div>
                    </div>
                ))}
                </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 md:px-16 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
            Prêt à gagner du temps ?
          </h2>
          <p className="text-[#AAA] mb-8">Inscription gratuite. Première mission en quelques minutes.</p>
          <button onClick={() => navigate('/register')}
            className="bg-[#FF4D00] hover:bg-[#e04400] text-white font-semibold px-10 py-4 rounded-2xl text-base transition-colors">
            Commencer maintenant →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 md:px-16 py-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-display font-bold text-lg">
          SHOOF<span className="text-[#FF4D00]">LY</span>
        </div>
        <div className="text-xs text-[#555]">© 2026 Shoofly. Tous droits réservés.</div>
        <div className="flex gap-4 text-xs text-[#555]">
          <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Connexion</button>
          <button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Inscription</button>
        </div>
      </footer>

    </div>
  )
}