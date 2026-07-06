import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, reportsAPI } from '../../api'
import { Spinner, Stars } from '../../components/ui'
import { translateLocation } from '../../constants/villesTranslations'



function ScoreBar({ label, value, max }) {
  const pct = Math.round((value / max) * 100)
  const getColor = (p) => {
    if (p >= 80) return '#22c55e'
    if (p >= 60) return '#84cc16'
    if (p >= 40) return '#f97316'
    if (p >= 20) return '#ef4444'
    return '#dc2626'
  }
  return (
    <div className="flex items-center gap-3">
      <div className="text-xs text-[#AAA] w-36 flex-shrink-0">{label}</div>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: getColor(pct) }} />
      </div>
      <div className="text-xs font-semibold text-white w-12 text-right">{value}/{max}</div>
    </div>
  )
}

function OuiNonDisplay({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
      <span className="text-xs text-[#CCC]">{label}</span>
      <span className={`text-xs font-semibold ${value === 'oui' || value === 'fonctionnelle' || value === 'disponible' ? 'text-green-400' : 'text-red-400'}`}>
        {value === 'oui' || value === 'fonctionnelle' || value === 'disponible' ? '✓ Oui' : '✗ Non'}
      </span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card mb-4">
      <h3 className="font-semibold text-sm mb-3 text-white">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function scoreLabel(s) {
  if (s >= 90) return { label: 'Excellent 🟢', color: 'text-green-400' }
  if (s >= 80) return { label: 'Très bon 🟢', color: 'text-green-400' }
  if (s >= 70) return { label: 'Correct 🟡', color: 'text-yellow-400' }
  if (s >= 60) return { label: 'Moyen 🟠', color: 'text-orange-400' }
  return { label: 'Décevant 🔴', color: 'text-red-400' }
}

export default function AirbnbReportView() {
  const { t, i18n } = useTranslation()
  const { missionId } = useParams()
  const navigate = useNavigate()
  const [mission, setMission] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(
  localStorage.getItem(`report-disclaimer-${missionId}`) === 'true'
    )

  useEffect(() => {
    Promise.all([
      missionsAPI.get(missionId),
      reportsAPI.get(missionId),
    ]).then(([mRes, rRes]) => {
      setMission(mRes.data.mission || mRes.data)
      setReport(rRes.data.report || null)
    }).finally(() => setLoading(false))
  }, [missionId])

  if (loading) return (
    <AppLayout><Topbar title="Rapport de visite" />
      <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
    </AppLayout>
  )

  if (!report) return (
    <AppLayout>
      <Topbar title="Rapport de visite" />
      <div className="flex-1 flex items-center justify-center flex-col gap-3 text-[#AAA]">
        <div className="text-4xl opacity-30">📋</div>
        <p className="text-sm">Rapport non encore disponible</p>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm mt-2">← Retour</button>
      </div>
    </AppLayout>
  )

  const d = report.data || {}
  const score = report.score || 0
  const { label: scoreLbl, color: scoreColor } = scoreLabel(score)


                if (!dismissed) return (
                <AppLayout>
                    <Topbar title="Rapport de visite" />
                    <div className="flex-1 flex items-center justify-center p-6">
                    <div className="bg-[#181818] border border-white/20 rounded-2xl p-6 w-full max-w-md">
                        <div className="text-2xl mb-4">📋</div>
                        <h2 className="font-bold text-base mb-3">Rapport de visite indépendant</h2>
                        <p className="text-sm text-[#AAA] leading-relaxed mb-6">
                        Le score est indicatif car les <strong className="text-white">étoiles ⭐</strong> reflètent la perception personnelle de l'Œil. Pour une information plus fiable, concentrez-vous sur les réponses <strong className="text-white">Oui / Non</strong> qui sont objectives et vérifiables sur place.
                        </p>
                        <button
                        onClick={() => {
                            localStorage.setItem(`report-disclaimer-${missionId}`, 'true')
                            setDismissed(true)
                        }}
                        className="btn btn-primary w-full justify-center"
                        >
                        ✅ Compris
                        </button>
                    </div>
                    </div>
                </AppLayout>
                )




  return (
    <AppLayout>
      <Topbar title="Rapport de visite" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto">

        {/* Header */}
        <div className="card mb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{mission?.title}</div>
              <div className="text-xs text-[#AAA]">📍 {translateLocation(mission?.city, i18n.language)} · {mission?.subcategory ? t(`newMissionModal.subcategories.${mission.subcategory}`, mission.subcategory) : ''}</div>
            </div>
            {report.submitted
              ? <span className="badge badge-green">✓ Rapport soumis</span>
              : <span className="badge badge-yellow">En cours</span>
            }
          </div>
        </div>

        {/* Score global */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-[#AAA] mb-0.5">Score Shoofly</div>
              <div className={`text-4xl font-bold ${scoreColor}`}>
                {score}<span className="text-sm text-[#AAA]">/100</span>
              </div>
              <div className={`text-sm font-semibold mt-1 ${scoreColor}`}>{scoreLbl}</div>
            </div>
            <div className="w-24 h-24 rounded-full border-4 border-[#FF4D00]/30 flex items-center justify-center">
              <span className={`text-2xl font-bold ${scoreColor}`}>{score}</span>
            </div>
          </div>
          <div className="space-y-2">
            <ScoreBar label="Propreté" value={Math.round((d.proprete_note||0)/5*20)} max={20} />
            <ScoreBar label="Conformité" value={d.conformite==='oui'?15:d.conformite==='partiellement'?8:0} max={15} />
            <ScoreBar label="Confort" value={Math.round(((d.confort_lit||0)+(d.confort_canape||0)+(d.confort_global||0))/15*15)} max={15} />
            <ScoreBar label="Équipements" value={Math.round(score*0.15)} max={15} />
            <ScoreBar label="Bruit" value={Math.round(((d.bruit_exterieur||0)+(d.isolation_phonique||0))/10*10)} max={10} />
            <ScoreBar label="Sécurité" value={Math.round((d.securite_note||0)/5*10)} max={10} />
            <ScoreBar label="Environnement" value={Math.round(((d.restaurants||0)+(d.commerces||0)+(d.transports||0)+(d.interet_touristique||0))/20*10)} max={10} />
            <ScoreBar label="Luminosité" value={Math.round((d.luminosite||0)/5*5)} max={5} />
          </div>
        </div>

        {/* Première impression */}
        {(d.conformite || d.note_generale || d.commentaire_impression) && (
          <Section title="1. Première impression">
            {d.conformite && <div className="text-xs text-[#CCC]">Conformité annonce : <span className="text-white font-medium">{d.conformite === 'oui' ? '✓ Conforme' : d.conformite === 'partiellement' ? '~ Partielle' : '✗ Non conforme'}</span></div>}
            {d.note_generale && <div className="flex items-center gap-2 mt-1"><Stars value={d.note_generale} /><span className="text-xs text-[#AAA]">{d.note_generale}/5</span></div>}
            {d.commentaire_impression && <p className="text-xs text-[#AAA] mt-2 italic">"{d.commentaire_impression}"</p>}
          </Section>
        )}

        {/* Propreté */}
        <Section title="2. Propreté">
          {d.proprete_note && <div className="flex items-center gap-2 mb-2"><Stars value={d.proprete_note} /><span className="text-xs text-[#AAA]">{d.proprete_note}/5</span></div>}
          <OuiNonDisplay label="Sols propres" value={d.sols_propres} />
          <OuiNonDisplay label="Salle de bain propre" value={d.sdb_propre} />
          <OuiNonDisplay label="Literie propre" value={d.literie_propre} />
          <OuiNonDisplay label="Odeurs désagréables" value={d.odeurs} />
        </Section>

        {/* Confort */}
        <Section title="3. Confort">
          {d.confort_lit && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">Lit</span><Stars value={d.confort_lit} /></div>}
          {d.confort_canape && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">Canapé</span><Stars value={d.confort_canape} /></div>}
          {d.confort_global && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">Global</span><Stars value={d.confort_global} /></div>}
          {d.commentaire_confort && <p className="text-xs text-[#AAA] mt-2 italic">"{d.commentaire_confort}"</p>}
        </Section>

        {/* Bruit */}
        <Section title="4. Bruit">
          {d.bruit_exterieur && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">Bruit extérieur</span><Stars value={d.bruit_exterieur} /></div>}
          {d.isolation_phonique && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">Isolation phonique</span><Stars value={d.isolation_phonique} /></div>}
          <OuiNonDisplay label="Fenêtres isolées" value={d.fenetres_isolees} />
        </Section>

        {/* Équipements */}
        <Section title="5. Équipements">
          <OuiNonDisplay label="Wifi" value={d.wifi} />
          {d.wifi === 'disponible' && d.wifi_qualite && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">Qualité Wifi</span><Stars value={d.wifi_qualite} /></div>}
          <OuiNonDisplay label="Climatisation" value={d.clim} />
          <OuiNonDisplay label="Eau chaude" value={d.eau_chaude} />
          <OuiNonDisplay label="Télévision" value={d.tv} />
          <OuiNonDisplay label="Machine à laver" value={d.machine_laver} />
          <OuiNonDisplay label="Sèche-linge" value={d.seche_linge} />
          <OuiNonDisplay label="Fer à repasser" value={d.fer_repasser} />
          <OuiNonDisplay label="Produits nettoyage" value={d.produits_nettoyage} />
          {d.cuisine?.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-[#AAA] mb-1">Cuisine :</div>
              <div className="flex flex-wrap gap-1">
                {d.cuisine.map(item => <span key={item} className="badge badge-gray text-[10px]">{item}</span>)}
              </div>
            </div>
          )}
        </Section>

        {/* Luminosité */}
        {(d.luminosite || d.exposition) && (
          <Section title="6. Luminosité">
            {d.luminosite && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">Luminosité</span><Stars value={d.luminosite} /></div>}
            {d.exposition && <div className="text-xs text-[#CCC]">Exposition : <span className="text-white font-medium">{d.exposition}</span></div>}
          </Section>
        )}

        {/* Sécurité */}
        <Section title="7. Sécurité">
          {d.securite_note && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">Sentiment sécurité</span><Stars value={d.securite_note} /></div>}
          <OuiNonDisplay label="Porte sécurisée" value={d.porte_securisee} />
          <OuiNonDisplay label="Quartier rassurant" value={d.quartier_rassurant} />
          <OuiNonDisplay label="Éclairage extérieur" value={d.eclairage_exterieur} />
        </Section>

        {/* Accessibilité */}
        <Section title="8. Accessibilité">
          {d.acces_facilite && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">Facilité d'accès</span><Stars value={d.acces_facilite} /></div>}
          <OuiNonDisplay label="Ascenseur" value={d.ascenseur} />
          <OuiNonDisplay label="Escaliers difficiles" value={d.escaliers_difficiles} />
          <OuiNonDisplay label="Parking" value={d.parking} />
        </Section>

        {/* Environnement */}
        <Section title="9. Environnement">
          {d.restaurants && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">Restaurants</span><Stars value={d.restaurants} /></div>}
          {d.commerces && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">Commerces</span><Stars value={d.commerces} /></div>}
          {d.transports && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">Transports</span><Stars value={d.transports} /></div>}
          {d.interet_touristique && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">Intérêt touristique</span><Stars value={d.interet_touristique} /></div>}
        </Section>

        {/* Photos annonce */}
        {d.photos_conformite && (
          <Section title="10. Photos de l'annonce">
            <div className="text-xs text-[#CCC]">Les photos sont : <span className="text-white font-medium">
              {d.photos_conformite === 'conformes' ? '✓ Exactement conformes' :
               d.photos_conformite === 'legerement' ? '~ Légèrement embellies' :
               d.photos_conformite === 'tres' ? '⚠️ Très embellies' : '✗ Trompeuses'}
            </span></div>
          </Section>
        )}

        {/* Points forts/faibles */}
        {(d.points_forts?.length > 0 || d.points_faibles?.length > 0) && (
          <Section title="11. Points forts & faibles">
            {d.points_forts?.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-green-400 font-semibold mb-1">✅ Points forts</div>
                <div className="flex flex-wrap gap-1">
                  {d.points_forts.map(p => <span key={p} className="badge badge-green text-[10px]">{p}</span>)}
                </div>
              </div>
            )}
            {d.points_faibles?.length > 0 && (
              <div>
                <div className="text-xs text-red-400 font-semibold mb-1">❌ Points faibles</div>
                <div className="flex flex-wrap gap-1">
                  {d.points_faibles.map(p => <span key={p} className="badge badge-red text-[10px]">{p}</span>)}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Recommandation */}
        {d.recommandation && (
          <Section title="12. Recommandation finale">
            <div className="text-center py-2">
              <span className="text-lg font-bold">
                {d.recommandation === 'oui_sans' ? '👍 Oui sans hésitation' :
                 d.recommandation === 'oui_reserves' ? '👌 Oui avec réserves' :
                 d.recommandation === 'moyennement' ? '😐 Moyennement' :
                 d.recommandation === 'non' ? '👎 Non' : '🚫 À éviter'}
              </span>
            </div>
          </Section>
        )}

        <button onClick={() => navigate(-1)} className="btn btn-ghost w-full justify-center mt-4">
          ← Retour aux missions
        </button>

      </div>
    </AppLayout>
  )
}