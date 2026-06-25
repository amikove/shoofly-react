import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, reportsAPI } from '../../api'
import { Spinner, Stars } from '../../components/ui'

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
      <div className="text-xs text-[#AAA] w-40 flex-shrink-0">{label}</div>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: getColor(pct) }} />
      </div>
      <div className="text-xs font-semibold text-white w-12 text-right">{value}/{max}</div>
    </div>
  )
}

function CritereDisplay({ label, note, remarque }) {
  if (!note) return null
  return (
    <div className="py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#CCC]">{label}</span>
        <Stars value={note} />
      </div>
      {remarque && <p className="text-xs text-[#666] italic">"{remarque}"</p>}
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
  if (s >= 90) return { label: 'Excellent 🟢',    color: 'text-green-400'  }
  if (s >= 80) return { label: 'Très bon 🟢',     color: 'text-green-400'  }
  if (s >= 70) return { label: 'Correct 🟡',      color: 'text-yellow-400' }
  if (s >= 60) return { label: 'À améliorer 🟠',  color: 'text-orange-400' }
  return              { label: 'Critique 🔴',      color: 'text-red-400'    }
}

export default function AuditReportView() {
  const { missionId } = useParams()
  const navigate = useNavigate()
  const [mission, setMission] = useState(null)
  const [report, setReport]   = useState(null)
  const [loading, setLoading] = useState(true)

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
    <AppLayout><Topbar title="Rapport d'audit" />
      <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
    </AppLayout>
  )

  if (!report || !report.submitted) return (
    <AppLayout>
      <Topbar title="Rapport d'audit" />
      <div className="flex-1 flex items-center justify-center flex-col gap-3 text-[#AAA]">
        <div className="text-4xl opacity-30">📋</div>
        <p className="text-sm">Rapport non encore disponible</p>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm mt-2">← Retour</button>
      </div>
    </AppLayout>
  )

  const d = report.data || {}
  const score = d.score_final || 0
  const { label: scoreLbl, color: scoreColor } = scoreLabel(score)

  return (
    <AppLayout>
      <Topbar title="Rapport d'audit mystère" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto">

        {/* Header */}
        <div className="card mb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{mission?.title}</div>
              <div className="text-xs text-[#AAA] mt-0.5">📍 {mission?.city}</div>
              {d.date_visite && <div className="text-xs text-[#AAA] mt-0.5">📅 {d.date_visite} {d.heure_visite && `à ${d.heure_visite}`}</div>}
              {d.duree_visite && <div className="text-xs text-[#AAA] mt-0.5">⏱ Durée : {d.duree_visite} min</div>}
            </div>
            <span className="badge badge-green">✓ Rapport soumis</span>
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
            <ScoreBar label="Première impression" value={10} max={10} />
            <ScoreBar label="Accueil"             value={20} max={20} />
            <ScoreBar label="Propreté"            value={15} max={15} />
            <ScoreBar label="Service"             value={20} max={20} />
            <ScoreBar label="Comp. commerciale"   value={15} max={15} />
            <ScoreBar label="Expérience client"   value={15} max={15} />
            <ScoreBar label="Recommandation"      value={5}  max={5}  />
          </div>
        </div>

        {/* Section 1 — Première impression */}
        <Section title="1. Première impression">
          <CritereDisplay label="Facilité à trouver"       note={d.premiere_impression}  remarque={d.premiere_impression_rem}  />
          <CritereDisplay label="Aspect extérieur"          note={d.aspect_exterieur}      remarque={d.aspect_exterieur_rem}      />
          <CritereDisplay label="Visibilité enseigne"       note={d.visibilite_enseigne}   remarque={d.visibilite_enseigne_rem}   />
          <CritereDisplay label="Attractivité"              note={d.attractivite}          remarque={d.attractivite_rem}          />
          <CritereDisplay label="Impression globale"        note={d.impression_globale}    remarque={d.impression_globale_rem}    />
        </Section>

        {/* Section 2 — Accueil */}
        <Section title="2. Accueil">
          <CritereDisplay label="Temps prise en charge"    note={d.temps_prise_charge}    remarque={d.temps_prise_charge_rem}    />
          <CritereDisplay label="Politesse"                note={d.politesse}             remarque={d.politesse_rem}             />
          <CritereDisplay label="Sourire"                  note={d.sourire}               remarque={d.sourire_rem}               />
          <CritereDisplay label="Disponibilité"            note={d.disponibilite}         remarque={d.disponibilite_rem}         />
          <CritereDisplay label="Professionnalisme"        note={d.professionnalisme_accueil} remarque={d.professionnalisme_accueil_rem} />
          <CritereDisplay label="Envie de rester"          note={d.envie_rester}          remarque={d.envie_rester_rem}          />
        </Section>

        {/* Section 3 — Propreté */}
        <Section title="3. Propreté et environnement">
          <CritereDisplay label="Propreté générale"        note={d.proprete_generale}     remarque={d.proprete_generale_rem}     />
          <CritereDisplay label="Organisation"             note={d.organisation}          remarque={d.organisation_rem}          />
          <CritereDisplay label="État du mobilier"         note={d.etat_mobilier}         remarque={d.etat_mobilier_rem}         />
          <CritereDisplay label="Ambiance"                 note={d.ambiance}              remarque={d.ambiance_rem}              />
          <CritereDisplay label="Confort"                  note={d.confort}               remarque={d.confort_rem}               />
        </Section>

        {/* Section 4 — Service */}
        <Section title="4. Qualité du service">
          <CritereDisplay label="Rapidité"                 note={d.rapidite_service}      remarque={d.rapidite_service_rem}      />
          <CritereDisplay label="Compréhension besoin"     note={d.comprehension_besoin}  remarque={d.comprehension_besoin_rem}  />
          <CritereDisplay label="Pertinence réponses"      note={d.pertinence_reponses}   remarque={d.pertinence_reponses_rem}   />
          <CritereDisplay label="Qualité conseils"         note={d.qualite_conseils}      remarque={d.qualite_conseils_rem}      />
          <CritereDisplay label="Niveau pro"               note={d.niveau_pro}            remarque={d.niveau_pro_rem}            />
          <CritereDisplay label="Connaissance produit"     note={d.connaissance_produit}  remarque={d.connaissance_produit_rem}  />
        </Section>

        {/* Section 5 — Compétence commerciale */}
        {d.competence_commerciale?.length > 0 && (
          <Section title="5. Compétence commerciale">
            <div className="flex flex-wrap gap-1.5">
              {d.competence_commerciale.map(item => (
                <span key={item} className={`badge text-[10px] ${item === "N'a fait aucun effort commercial" ? 'badge-red' : 'badge-green'}`}>
                  {item}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Section 6 — Expérience client */}
        <Section title="6. Expérience client">
          <CritereDisplay label="Clarté des prix"          note={d.clarte_prix}           remarque={d.clarte_prix_rem}           />
          <CritereDisplay label="Transparence"             note={d.transparence}          remarque={d.transparence_rem}          />
          <CritereDisplay label="Simplicité parcours"      note={d.simplicite_parcours}   remarque={d.simplicite_parcours_rem}   />
          <CritereDisplay label="Confiance inspirée"       note={d.confiance_inspiree}    remarque={d.confiance_inspiree_rem}    />
          <CritereDisplay label="Satisfaction générale"    note={d.satisfaction_generale} remarque={d.satisfaction_generale_rem} />
        </Section>

        {/* Section 7 — Observations */}
        {(d.points_positifs?.length > 0 || d.points_negatifs?.length > 0) && (
          <Section title="7. Observations">
            {d.points_positifs?.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-green-400 font-semibold mb-1">✅ Points positifs</div>
                <div className="flex flex-wrap gap-1">
                  {d.points_positifs.map(p => <span key={p} className="badge badge-green text-[10px]">{p}</span>)}
                </div>
              </div>
            )}
            {d.points_negatifs?.length > 0 && (
              <div>
                <div className="text-xs text-red-400 font-semibold mb-1">❌ Points négatifs</div>
                <div className="flex flex-wrap gap-1">
                  {d.points_negatifs.map(p => <span key={p} className="badge badge-red text-[10px]">{p}</span>)}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Section 8 — Incidents */}
        {d.incidents?.length > 0 && (
          <Section title="8. Incidents">
            <div className="flex flex-wrap gap-1">
              {d.incidents.map(i => (
                <span key={i} className={`badge text-[10px] ${i === 'Aucun incident' ? 'badge-green' : 'badge-red'}`}>{i}</span>
              ))}
            </div>
            {d.incidents_commentaire && <p className="text-xs text-[#AAA] mt-2 italic">"{d.incidents_commentaire}"</p>}
          </Section>
        )}

        {/* Section 9 — Question clé */}
        {d.achat_produit && (
          <Section title="9. Question clé Shoofly">
            <div className="text-center py-2">
              <span className="text-lg font-bold">
                {d.achat_produit === 'oui_sans'         ? '👍 Oui sans hésitation' :
                 d.achat_produit === 'probablement_oui' ? '👌 Probablement oui'    :
                 d.achat_produit === 'peut_etre'        ? '😐 Peut-être'           :
                 d.achat_produit === 'probablement_non' ? '👎 Probablement non'    :
                                                          '🚫 Certainement non'    }
              </span>
            </div>
            <CritereDisplay label="Recommandation" note={d.recommandation_note} remarque={d.recommandation_rem} />
          </Section>
        )}

        {/* Section 10 — Commentaire libre */}
        {d.commentaire_libre && (
          <Section title="10. Commentaire libre">
            <p className="text-sm text-[#CCC] leading-relaxed">{d.commentaire_libre}</p>
          </Section>
        )}

        <button onClick={() => navigate(-1)} className="btn btn-ghost w-full justify-center mt-4">
          ← Retour aux missions
        </button>

      </div>
    </AppLayout>
  )
}