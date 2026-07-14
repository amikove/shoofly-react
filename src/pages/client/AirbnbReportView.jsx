import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, reportsAPI } from '../../api'
import { Spinner, Stars } from '../../components/ui'
import { translateLocation } from '../../constants/villesTranslations'
import { cuisineLabel, pointsFortsLabel, pointsFaiblesLabel } from '../../constants/airbnbReportLabels'

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

function OuiNonDisplay({ label, value, t }) {
  if (!value) return null
  const positive = value === 'oui' || value === 'fonctionnelle' || value === 'disponible'
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
      <span className="text-xs text-[#CCC]">{label}</span>
      <span className={`text-xs font-semibold ${positive ? 'text-green-400' : 'text-red-400'}`}>
        {positive ? t('oeilAirbnbReport.ouiNon.oui') : t('oeilAirbnbReport.ouiNon.non')}
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

function useScoreLabel(t) {
  return (s) => {
    if (s >= 90) return { label: `${t('oeilAirbnbReport.scoreLabels.excellent')} 🟢`, color: 'text-green-400' }
    if (s >= 80) return { label: `${t('oeilAirbnbReport.scoreLabels.veryGood')} 🟢`, color: 'text-green-400' }
    if (s >= 70) return { label: `${t('oeilAirbnbReport.scoreLabels.correct')} 🟡`, color: 'text-yellow-400' }
    if (s >= 60) return { label: `${t('oeilAirbnbReport.scoreLabels.average')} 🟠`, color: 'text-orange-400' }
    return              { label: `${t('oeilAirbnbReport.scoreLabels.disappointing')} 🔴`, color: 'text-red-400' }
  }
}

export default function AirbnbReportView() {
  const { t, i18n } = useTranslation()
  const scoreLabel = useScoreLabel(t)
  const { missionId } = useParams()
  const navigate = useNavigate()
  const [mission, setMission] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [dismissed, setDismissed] = useState(
  localStorage.getItem(`report-disclaimer-${missionId}`) === 'true'
    )

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
    <AppLayout><Topbar title={t('oeilAirbnbReport.title')} />
      <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
    </AppLayout>
  )

  if (loadError) return (
    <AppLayout>
      <Topbar title={t('oeilAirbnbReport.title')} />
      <div className="flex-1 flex items-center justify-center flex-col gap-3 text-[#AAA]">
        <div className="text-4xl opacity-30">⚠️</div>
        <p className="text-sm">{t('clientAirbnbReportView.loadError')}</p>
        <button onClick={load} className="btn btn-primary btn-sm mt-2">{t('clientAirbnbReportView.retry')}</button>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">{t('clientAuditReportView.back')}</button>
      </div>
    </AppLayout>
  )

  if (!report) return (
    <AppLayout>
      <Topbar title={t('oeilAirbnbReport.title')} />
      <div className="flex-1 flex items-center justify-center flex-col gap-3 text-[#AAA]">
        <div className="text-4xl opacity-30">📋</div>
        <p className="text-sm">{t('clientAirbnbReportView.notAvailable')}</p>
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm mt-2">{t('clientAuditReportView.back')}</button>
      </div>
    </AppLayout>
  )

  const d = report.data || {}
  const score = report.score || 0
  const { label: scoreLbl, color: scoreColor } = scoreLabel(score)

  const conformiteLabels = {
    oui: `✓ ${t('oeilAirbnbReport.sections.s1.choices.oui')}`,
    partiellement: t('oeilAirbnbReport.sections.s1.choices.partiellement'),
    non: t('oeilAirbnbReport.sections.s1.choices.non'),
  }
  const photosConformiteLabels = {
    conformes: t('oeilAirbnbReport.sections.s10.choices.conformes'),
    legerement: t('oeilAirbnbReport.sections.s10.choices.legerement'),
    tres: t('oeilAirbnbReport.sections.s10.choices.tres'),
    trompeuses: t('oeilAirbnbReport.sections.s10.choices.trompeuses'),
  }
  const recommandationLabels = {
    oui_sans: t('oeilAirbnbReport.sections.s12.choices.ouiSans'),
    oui_reserves: t('oeilAirbnbReport.sections.s12.choices.ouiReserves'),
    moyennement: t('oeilAirbnbReport.sections.s12.choices.moyennement'),
    non: t('oeilAirbnbReport.sections.s12.choices.non'),
    eviter: t('oeilAirbnbReport.sections.s12.choices.eviter'),
  }

                if (!dismissed) return (
                <AppLayout>
                    <Topbar title={t('oeilAirbnbReport.title')} />
                    <div className="flex-1 flex items-center justify-center p-6">
                    <div className="bg-[#181818] border border-white/20 rounded-2xl p-6 w-full max-w-md">
                        <div className="text-2xl mb-4">📋</div>
                        <h2 className="font-bold text-base mb-3">{t('clientAirbnbReportView.disclaimerTitle')}</h2>
                        <p className="text-sm text-[#AAA] leading-relaxed mb-6">
                        {t('clientAirbnbReportView.disclaimerPrefix')} <strong className="text-white">{t('clientAirbnbReportView.disclaimerStars')}</strong> {t('clientAirbnbReportView.disclaimerMiddle')} <strong className="text-white">{t('clientAirbnbReportView.disclaimerOuiNon')}</strong> {t('clientAirbnbReportView.disclaimerSuffix')}
                        </p>
                        <button
                        onClick={() => {
                            localStorage.setItem(`report-disclaimer-${missionId}`, 'true')
                            setDismissed(true)
                        }}
                        className="btn btn-primary w-full justify-center"
                        >
                        ✅ {t('clientAirbnbReportView.understood')}
                        </button>
                    </div>
                    </div>
                </AppLayout>
                )




  return (
    <AppLayout>
      <Topbar title={t('oeilAirbnbReport.title')} />
      <div className="p-4 md:p-6 max-w-2xl mx-auto">

        {/* Header */}
        <div className="card mb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold">{mission?.title}</div>
              <div className="text-xs text-[#AAA]">📍 {translateLocation(mission?.city, i18n.language)} · {mission?.subcategory ? t(`newMissionModal.subcategories.${mission.subcategory}`, mission.subcategory) : ''}</div>
            </div>
            {report.submitted
              ? <span className="badge badge-green">✓ {t('clientAuditReportView.reportSubmitted')}</span>
              : <span className="badge badge-yellow">{t('clientAirbnbReportView.inProgress')}</span>
            }
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
            <ScoreBar label={t('oeilAirbnbReport.sections.s2.title')} value={Math.round((d.proprete_note||0)/5*20)} max={20} />
            <ScoreBar label={t('clientAirbnbReportView.conformite')} value={d.conformite==='oui'?15:d.conformite==='partiellement'?8:0} max={15} />
            <ScoreBar label={t('oeilAirbnbReport.sections.s3.title')} value={Math.round(((d.confort_lit||0)+(d.confort_canape||0)+(d.confort_global||0))/15*15)} max={15} />
            <ScoreBar label={t('oeilAirbnbReport.sections.s5.title')} value={Math.round(score*0.15)} max={15} />
            <ScoreBar label={t('oeilAirbnbReport.sections.s4.title')} value={Math.round(((d.bruit_exterieur||0)+(d.isolation_phonique||0))/10*10)} max={10} />
            <ScoreBar label={t('oeilAirbnbReport.sections.s7.title')} value={Math.round((d.securite_note||0)/5*10)} max={10} />
            <ScoreBar label={t('oeilAirbnbReport.sections.s9.title')} value={Math.round(((d.restaurants||0)+(d.commerces||0)+(d.transports||0)+(d.interet_touristique||0))/20*10)} max={10} />
            <ScoreBar label={t('oeilAirbnbReport.sections.s6.title')} value={Math.round((d.luminosite||0)/5*5)} max={5} />
          </div>
        </div>

        {/* Première impression */}
        {(d.conformite || d.note_generale || d.commentaire_impression) && (
          <Section title={`1. ${t('oeilAirbnbReport.sections.s1.title')}`}>
            {d.conformite && <div className="text-xs text-[#CCC]">{t('clientAirbnbReportView.conformiteAnnonce')} <span className="text-white font-medium">{conformiteLabels[d.conformite]}</span></div>}
            {d.note_generale && <div className="flex items-center gap-2 mt-1"><Stars value={d.note_generale} /><span className="text-xs text-[#AAA]">{d.note_generale}/5</span></div>}
            {d.commentaire_impression && <p className="text-xs text-[#AAA] mt-2 italic">"{d.commentaire_impression}"</p>}
          </Section>
        )}

        {/* Propreté */}
        <Section title={`2. ${t('oeilAirbnbReport.sections.s2.title')}`}>
          {d.proprete_note && <div className="flex items-center gap-2 mb-2"><Stars value={d.proprete_note} /><span className="text-xs text-[#AAA]">{d.proprete_note}/5</span></div>}
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s2.solsPropresLabel')} value={d.sols_propres} />
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s2.sdbPropreLabel')} value={d.sdb_propre} />
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s2.literiePropreLabel')} value={d.literie_propre} />
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s2.odeursLabel')} value={d.odeurs} />
        </Section>

        {/* Confort */}
        <Section title={`3. ${t('oeilAirbnbReport.sections.s3.title')}`}>
          {d.confort_lit && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">{t('clientAirbnbReportView.bed')}</span><Stars value={d.confort_lit} /></div>}
          {d.confort_canape && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">{t('clientAirbnbReportView.sofa')}</span><Stars value={d.confort_canape} /></div>}
          {d.confort_global && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">{t('clientAirbnbReportView.global')}</span><Stars value={d.confort_global} /></div>}
          {d.commentaire_confort && <p className="text-xs text-[#AAA] mt-2 italic">"{d.commentaire_confort}"</p>}
        </Section>

        {/* Bruit */}
        <Section title={`4. ${t('oeilAirbnbReport.sections.s4.title')}`}>
          {d.bruit_exterieur && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">{t('oeilAirbnbReport.sections.s4.bruitExterieurLabel')}</span><Stars value={d.bruit_exterieur} /></div>}
          {d.isolation_phonique && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">{t('oeilAirbnbReport.sections.s4.isolationPhoniqueLabel')}</span><Stars value={d.isolation_phonique} /></div>}
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s4.fenetresIsoleesLabel')} value={d.fenetres_isolees} />
        </Section>

        {/* Équipements */}
        <Section title={`5. ${t('oeilAirbnbReport.sections.s5.title')}`}>
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s5.equip.wifi')} value={d.wifi} />
          {d.wifi === 'disponible' && d.wifi_qualite && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">{t('oeilAirbnbReport.sections.s5.wifiQualityLabel')}</span><Stars value={d.wifi_qualite} /></div>}
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s5.equip.clim')} value={d.clim} />
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s5.equip.eauChaude')} value={d.eau_chaude} />
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s5.equip.tv')} value={d.tv} />
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s5.equip.machineLaver')} value={d.machine_laver} />
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s5.equip.secheLinge')} value={d.seche_linge} />
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s5.equip.ferRepasser')} value={d.fer_repasser} />
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s5.equip.produitsNettoyage')} value={d.produits_nettoyage} />
          {d.cuisine?.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-[#AAA] mb-1">{t('oeilAirbnbReport.sections.s5.kitchenLabel')} :</div>
              <div className="flex flex-wrap gap-1">
                {d.cuisine.map(item => <span key={item} className="badge badge-gray text-[10px]">{cuisineLabel(item, t)}</span>)}
              </div>
            </div>
          )}
        </Section>

        {/* Luminosité */}
        {(d.luminosite || d.exposition) && (
          <Section title={`6. ${t('oeilAirbnbReport.sections.s6.title')}`}>
            {d.luminosite && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">{t('oeilAirbnbReport.sections.s6.luminositeLabel')}</span><Stars value={d.luminosite} /></div>}
            {d.exposition && <div className="text-xs text-[#CCC]">{t('oeilAirbnbReport.sections.s6.expositionLabel')} : <span className="text-white font-medium">{d.exposition}</span></div>}
          </Section>
        )}

        {/* Sécurité */}
        <Section title={`7. ${t('oeilAirbnbReport.sections.s7.title')}`}>
          {d.securite_note && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">{t('oeilAirbnbReport.sections.s7.securiteNoteLabel')}</span><Stars value={d.securite_note} /></div>}
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s7.porteSecuriseeLabel')} value={d.porte_securisee} />
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s7.quartierRassurantLabel')} value={d.quartier_rassurant} />
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s7.eclairageExterieurLabel')} value={d.eclairage_exterieur} />
        </Section>

        {/* Accessibilité */}
        <Section title={`8. ${t('oeilAirbnbReport.sections.s8.title')}`}>
          {d.acces_facilite && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">{t('oeilAirbnbReport.sections.s8.accesFaciliteLabel')}</span><Stars value={d.acces_facilite} /></div>}
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s8.ascenseurLabel')} value={d.ascenseur} />
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s8.escaliersDifficilesLabel')} value={d.escaliers_difficiles} />
          <OuiNonDisplay t={t} label={t('oeilAirbnbReport.sections.s8.parkingLabel')} value={d.parking} />
        </Section>

        {/* Environnement */}
        <Section title={`9. ${t('oeilAirbnbReport.sections.s9.title')}`}>
          {d.restaurants && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">{t('oeilAirbnbReport.sections.s9.restaurantsLabel')}</span><Stars value={d.restaurants} /></div>}
          {d.commerces && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">{t('oeilAirbnbReport.sections.s9.commercesLabel')}</span><Stars value={d.commerces} /></div>}
          {d.transports && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">{t('oeilAirbnbReport.sections.s9.transportsLabel')}</span><Stars value={d.transports} /></div>}
          {d.interet_touristique && <div className="flex items-center justify-between py-1"><span className="text-xs text-[#CCC]">{t('oeilAirbnbReport.sections.s9.interetTouristiqueLabel')}</span><Stars value={d.interet_touristique} /></div>}
        </Section>

        {/* Photos annonce */}
        {d.photos_conformite && (
          <Section title={`10. ${t('oeilAirbnbReport.sections.s10.title')}`}>
            <div className="text-xs text-[#CCC]">{t('clientAirbnbReportView.photosAre')} <span className="text-white font-medium">
              {photosConformiteLabels[d.photos_conformite]}
            </span></div>
          </Section>
        )}

        {/* Points forts/faibles */}
        {(d.points_forts?.length > 0 || d.points_faibles?.length > 0) && (
          <Section title={`11. ${t('oeilAirbnbReport.sections.s11.title')}`}>
            {d.points_forts?.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-green-400 font-semibold mb-1">{t('oeilAirbnbReport.sections.s11.strengthsLabel')}</div>
                <div className="flex flex-wrap gap-1">
                  {d.points_forts.map(p => <span key={p} className="badge badge-green text-[10px]">{pointsFortsLabel(p, t)}</span>)}
                </div>
              </div>
            )}
            {d.points_faibles?.length > 0 && (
              <div>
                <div className="text-xs text-red-400 font-semibold mb-1">{t('oeilAirbnbReport.sections.s11.weaknessesLabel')}</div>
                <div className="flex flex-wrap gap-1">
                  {d.points_faibles.map(p => <span key={p} className="badge badge-red text-[10px]">{pointsFaiblesLabel(p, t)}</span>)}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Recommandation */}
        {d.recommandation && (
          <Section title={`12. ${t('oeilAirbnbReport.sections.s12.title')}`}>
            <div className="text-center py-2">
              <span className="text-lg font-bold">
                {recommandationLabels[d.recommandation]}
              </span>
            </div>
          </Section>
        )}

        <button onClick={() => navigate(-1)} className="btn btn-ghost w-full justify-center mt-4">
          {t('clientAuditReportView.backToMissions')}
        </button>

      </div>
    </AppLayout>
  )
}
