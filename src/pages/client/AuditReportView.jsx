import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, reportsAPI } from '../../api'
import { Spinner, Stars } from '../../components/ui'
import { translateLocation } from '../../constants/villesTranslations'
import { competenceCommercialeLabel, pointsPositifsLabel, pointsNegatifsLabel, incidentsLabel } from '../../constants/auditReportLabels'

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

function useScoreLabel(t) {
  return (s) => {
    if (s >= 90) return { label: `${t('oeilAuditReport.scoreLabels.excellent')} 🟢`, color: 'text-green-400'  }
    if (s >= 80) return { label: `${t('oeilAuditReport.scoreLabels.veryGood')} 🟢`,  color: 'text-green-400'  }
    if (s >= 70) return { label: `${t('oeilAuditReport.scoreLabels.correct')} 🟡`,   color: 'text-yellow-400' }
    if (s >= 60) return { label: `${t('oeilAuditReport.scoreLabels.toImprove')} 🟠`, color: 'text-orange-400' }
    return              { label: `${t('oeilAuditReport.scoreLabels.critical')} 🔴`,  color: 'text-red-400'    }
  }
}

export default function AuditReportView() {
  const { t, i18n } = useTranslation()
  const scoreLabel = useScoreLabel(t)
  const { missionId } = useParams()
  const navigate = useNavigate()
  const [mission, setMission] = useState(null)
  const [report, setReport]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const load = () => {
    setLoading(true)
    setLoadError(false)
    Promise.all([
      missionsAPI.get(missionId),
      reportsAPI.get(missionId),
    ]).then(([mRes, rRes]) => {
      setMission(mRes.data.mission || mRes.data)
      setReport(rRes.data.report || null)
    }).catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }

  useEffect(load, [missionId])

  if (loading) return (
    <AppLayout><Topbar title={t('clientAuditReportView.topbarTitle')} />
      <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
    </AppLayout>
  )

  if (loadError) return (
    <AppLayout>
      <Topbar title={t('clientAuditReportView.topbarTitle')} />
      <div className="flex-1 flex items-center justify-center flex-col gap-3 text-[#AAA]">
        <div className="text-4xl opacity-30">⚠️</div>
        <p className="text-sm">{t('clientAuditReportView.loadError')}</p>
        <button onClick={load} className="btn btn-primary btn-sm mt-2">{t('clientAuditReportView.retry')}</button>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">{t('clientAuditReportView.back')}</button>
      </div>
    </AppLayout>
  )

  if (!report || !report.submitted) return (
    <AppLayout>
      <Topbar title={t('clientAuditReportView.topbarTitle')} />
      <div className="flex-1 flex items-center justify-center flex-col gap-3 text-[#AAA]">
        <div className="text-4xl opacity-30">📋</div>
        <p className="text-sm">{t('clientAuditReportView.notAvailable')}</p>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm mt-2">{t('clientAuditReportView.back')}</button>
      </div>
    </AppLayout>
  )

  const d = report.data || {}
  const score = d.score_final || 0
  const { label: scoreLbl, color: scoreColor } = scoreLabel(score)

  const achatProduitLabels = {
    oui_sans: t('oeilAuditReport.sections.s9.choices.ouiSans'),
    probablement_oui: t('oeilAuditReport.sections.s9.choices.probablementOui'),
    peut_etre: t('oeilAuditReport.sections.s9.choices.peutEtre'),
    probablement_non: t('oeilAuditReport.sections.s9.choices.probablementNon'),
    certainement_non: t('oeilAuditReport.sections.s9.choices.certainementNon'),
  }

  return (
    <AppLayout>
      <Topbar title={t('clientAuditReportView.pageTitle')} />
      <div className="p-4 md:p-6 max-w-2xl mx-auto">

        {/* Header */}
        <div className="card mb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{mission?.title}</div>
              <div className="text-xs text-[#AAA] mt-0.5">📍 {translateLocation(mission?.city, i18n.language)}</div>
              {d.date_visite && <div className="text-xs text-[#AAA] mt-0.5">📅 {d.date_visite} {d.heure_visite && t('clientAuditReportView.at', { time: d.heure_visite })}</div>}
              {d.duree_visite && <div className="text-xs text-[#AAA] mt-0.5">⏱ {t('clientAuditReportView.duration', { minutes: d.duree_visite })}</div>}
            </div>
            <span className="badge badge-green">✓ {t('clientAuditReportView.reportSubmitted')}</span>
          </div>
        </div>

        {/* Score global */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-[#AAA] mb-0.5">{t('clientAuditReportView.shooflyScore')}</div>
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
            <ScoreBar label={t('oeilAuditReport.recap.rows.premiereImpression')} value={10} max={10} />
            <ScoreBar label={t('oeilAuditReport.recap.rows.accueil')}            value={20} max={20} />
            <ScoreBar label={t('oeilAuditReport.recap.rows.proprete')}           value={15} max={15} />
            <ScoreBar label={t('oeilAuditReport.recap.rows.service')}           value={20} max={20} />
            <ScoreBar label={t('oeilAuditReport.recap.rows.compCommerciale')}   value={15} max={15} />
            <ScoreBar label={t('oeilAuditReport.recap.rows.experienceClient')}  value={15} max={15} />
            <ScoreBar label={t('oeilAuditReport.recap.rows.recommandation')}    value={5}  max={5}  />
          </div>
        </div>

        {/* Section 1 — Première impression */}
        <Section title={`1. ${t('oeilAuditReport.sections.s1.title')}`}>
          <CritereDisplay label={t('oeilAuditReport.sections.s1.criteria.premiereImpression')} note={d.premiere_impression}  remarque={d.premiere_impression_rem}  />
          <CritereDisplay label={t('oeilAuditReport.sections.s1.criteria.aspectExterieur')}    note={d.aspect_exterieur}      remarque={d.aspect_exterieur_rem}      />
          <CritereDisplay label={t('oeilAuditReport.sections.s1.criteria.visibiliteEnseigne')} note={d.visibilite_enseigne}   remarque={d.visibilite_enseigne_rem}   />
          <CritereDisplay label={t('oeilAuditReport.sections.s1.criteria.attractivite')}       note={d.attractivite}          remarque={d.attractivite_rem}          />
          <CritereDisplay label={t('oeilAuditReport.sections.s1.criteria.impressionGlobale')}  note={d.impression_globale}    remarque={d.impression_globale_rem}    />
        </Section>

        {/* Section 2 — Accueil */}
        <Section title={`2. ${t('oeilAuditReport.sections.s2.title')}`}>
          <CritereDisplay label={t('oeilAuditReport.sections.s2.criteria.tempsPriseCharge')}   note={d.temps_prise_charge}    remarque={d.temps_prise_charge_rem}    />
          <CritereDisplay label={t('oeilAuditReport.sections.s2.criteria.politesse')}          note={d.politesse}             remarque={d.politesse_rem}             />
          <CritereDisplay label={t('oeilAuditReport.sections.s2.criteria.sourire')}            note={d.sourire}               remarque={d.sourire_rem}               />
          <CritereDisplay label={t('oeilAuditReport.sections.s2.criteria.disponibilite')}      note={d.disponibilite}         remarque={d.disponibilite_rem}         />
          <CritereDisplay label={t('oeilAuditReport.sections.s2.criteria.professionnalisme')}  note={d.professionnalisme_accueil} remarque={d.professionnalisme_accueil_rem} />
          <CritereDisplay label={t('oeilAuditReport.sections.s2.criteria.envieRester')}        note={d.envie_rester}          remarque={d.envie_rester_rem}          />
        </Section>

        {/* Section 3 — Propreté */}
        <Section title={`3. ${t('oeilAuditReport.sections.s3.title')}`}>
          <CritereDisplay label={t('oeilAuditReport.sections.s3.criteria.proprete')}      note={d.proprete_generale}     remarque={d.proprete_generale_rem}     />
          <CritereDisplay label={t('oeilAuditReport.sections.s3.criteria.organisation')}  note={d.organisation}          remarque={d.organisation_rem}          />
          <CritereDisplay label={t('oeilAuditReport.sections.s3.criteria.etatMobilier')}  note={d.etat_mobilier}         remarque={d.etat_mobilier_rem}         />
          <CritereDisplay label={t('oeilAuditReport.sections.s3.criteria.ambiance')}      note={d.ambiance}              remarque={d.ambiance_rem}              />
          <CritereDisplay label={t('oeilAuditReport.sections.s3.criteria.confort')}       note={d.confort}               remarque={d.confort_rem}               />
        </Section>

        {/* Section 4 — Service */}
        <Section title={`4. ${t('oeilAuditReport.sections.s4.title')}`}>
          <CritereDisplay label={t('oeilAuditReport.sections.s4.criteria.rapidite')}             note={d.rapidite_service}      remarque={d.rapidite_service_rem}      />
          <CritereDisplay label={t('oeilAuditReport.sections.s4.criteria.comprehensionBesoin')}  note={d.comprehension_besoin}  remarque={d.comprehension_besoin_rem}  />
          <CritereDisplay label={t('oeilAuditReport.sections.s4.criteria.pertinenceReponses')}   note={d.pertinence_reponses}   remarque={d.pertinence_reponses_rem}   />
          <CritereDisplay label={t('oeilAuditReport.sections.s4.criteria.qualiteConseils')}      note={d.qualite_conseils}      remarque={d.qualite_conseils_rem}      />
          <CritereDisplay label={t('oeilAuditReport.sections.s4.criteria.niveauPro')}            note={d.niveau_pro}            remarque={d.niveau_pro_rem}            />
          <CritereDisplay label={t('oeilAuditReport.sections.s4.criteria.connaissanceProduit')}  note={d.connaissance_produit}  remarque={d.connaissance_produit_rem}  />
        </Section>

        {/* Section 5 — Compétence commerciale */}
        {d.competence_commerciale?.length > 0 && (
          <Section title={`5. ${t('oeilAuditReport.sections.s5.title')}`}>
            <div className="flex flex-wrap gap-1.5">
              {d.competence_commerciale.map(item => (
                <span key={item} className={`badge text-[10px] ${item === "N'a fait aucun effort commercial" ? 'badge-red' : 'badge-green'}`}>
                  {competenceCommercialeLabel(item, t)}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Section 6 — Expérience client */}
        <Section title={`6. ${t('oeilAuditReport.sections.s6.title')}`}>
          <CritereDisplay label={t('oeilAuditReport.sections.s6.criteria.clartePrix')}          note={d.clarte_prix}           remarque={d.clarte_prix_rem}           />
          <CritereDisplay label={t('oeilAuditReport.sections.s6.criteria.transparence')}        note={d.transparence}          remarque={d.transparence_rem}          />
          <CritereDisplay label={t('oeilAuditReport.sections.s6.criteria.simpliciteParcours')}  note={d.simplicite_parcours}   remarque={d.simplicite_parcours_rem}   />
          <CritereDisplay label={t('oeilAuditReport.sections.s6.criteria.confianceInspiree')}   note={d.confiance_inspiree}    remarque={d.confiance_inspiree_rem}    />
          <CritereDisplay label={t('oeilAuditReport.sections.s6.criteria.satisfactionGenerale')} note={d.satisfaction_generale} remarque={d.satisfaction_generale_rem} />
        </Section>

        {/* Section 7 — Observations */}
        {(d.points_positifs?.length > 0 || d.points_negatifs?.length > 0) && (
          <Section title={`7. ${t('oeilAuditReport.sections.s7.title')}`}>
            {d.points_positifs?.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-green-400 font-semibold mb-1">{t('oeilAuditReport.sections.s7.positiveIntro')}</div>
                <div className="flex flex-wrap gap-1">
                  {d.points_positifs.map(p => <span key={p} className="badge badge-green text-[10px]">{pointsPositifsLabel(p, t)}</span>)}
                </div>
              </div>
            )}
            {d.points_negatifs?.length > 0 && (
              <div>
                <div className="text-xs text-red-400 font-semibold mb-1">{t('oeilAuditReport.sections.s7.negativeIntro')}</div>
                <div className="flex flex-wrap gap-1">
                  {d.points_negatifs.map(p => <span key={p} className="badge badge-red text-[10px]">{pointsNegatifsLabel(p, t)}</span>)}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Section 8 — Incidents */}
        {d.incidents?.length > 0 && (
          <Section title={`8. ${t('oeilAuditReport.sections.s8.title')}`}>
            <div className="flex flex-wrap gap-1">
              {d.incidents.map(i => (
                <span key={i} className={`badge text-[10px] ${i === 'Aucun incident' ? 'badge-green' : 'badge-red'}`}>{incidentsLabel(i, t)}</span>
              ))}
            </div>
            {d.incidents_commentaire && <p className="text-xs text-[#AAA] mt-2 italic">"{d.incidents_commentaire}"</p>}
          </Section>
        )}

        {/* Section 9 — Question clé */}
        {d.achat_produit && (
          <Section title={`9. ${t('oeilAuditReport.sections.s9.title')}`}>
            <div className="text-center py-2">
              <span className="text-lg font-bold">
                {achatProduitLabels[d.achat_produit]}
              </span>
            </div>
            <CritereDisplay label={t('oeilAuditReport.sections.s9.recommendationLabel')} note={d.recommandation_note} remarque={d.recommandation_rem} />
          </Section>
        )}

        {/* Section 10 — Commentaire libre */}
        {d.commentaire_libre && (
          <Section title={`10. ${t('oeilAuditReport.sections.s10.title')}`}>
            <p className="text-sm text-[#CCC] leading-relaxed">{d.commentaire_libre}</p>
          </Section>
        )}

        <button onClick={() => navigate(-1)} className="btn btn-ghost w-full justify-center mt-4">
          {t('clientAuditReportView.backToMissions')}
        </button>

      </div>
    </AppLayout>
  )
}
