#!/usr/bin/env node
// Chantier SEO annuaire — Phase 3 (2026-09-30). Point d'entrée du générateur SSG — voir lib.js pour
// les briques réutilisables et text-templates.js pour les textes fixes (copiés mot pour mot depuis
// seo-study/MODELES_TEXTES_SEO.md). Lancé par "npm run build" (package.json), AVANT vite build.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const L = require('./lib.cjs');
const T = require('./text-templates.cjs');

const PROPER_NOUN_CATEGORIES = new Set(['cnss', 'barid']); // {categorie} minuscule sauf noms propres
const CITY_AR = { Rabat: 'الرباط', 'Salé': 'سلا', 'Témara': 'تمارة' }; // noms arabes standards, non éditoriaux

function lowerFirst(catId, label) {
  if (PROPER_NOUN_CATEGORIES.has(catId)) return label;
  return label.charAt(0).toLowerCase() + label.slice(1);
}
function article(genre) { return genre === 'f' ? 'une' : 'un'; }
function cityLabel(city, lang) { return lang === 'ar' ? CITY_AR[city] : city; }

async function main() {
  const { categories, establishments } = await L.loadData();
  const publishedCategories = categories; // déjà filtré is_published=true par l'export backend

  // ── Index ──────────────────────────────────────────────────────────────
  const byCity = {};
  const byCityCat = {};
  const byCityCatQuartier = {};
  for (const e of establishments) {
    if (e.category_id === 'urgences') { /* toujours listée mais gabarit spécial, pas de bouton mission */ }
    (byCity[e.city] ||= []).push(e);
    const k1 = `${e.city}|${e.category_id}`;
    (byCityCat[k1] ||= []).push(e);
    if (e.neighborhood_id) {
      const k2 = `${e.city}|${e.category_id}|${e.neighborhood_id}`;
      (byCityCatQuartier[k2] ||= []).push(e);
    }
  }
  const cities = Object.keys(L.CITY_SLUGS);

  const stats = { hub: 0, cat: 0, quartier: 0, fiche: 0 };
  const sitemapUrls = {}; // categoryId -> [{path, lang}]
  function addSitemap(catId, urlPath) { (sitemapUrls[catId] ||= []).push(urlPath); }

  // ── Fiches établissement ──────────────────────────────────────────────
  for (const e of establishments) {
    for (const lang of ['fr', 'ar']) {
      generateFiche(e, lang, byCity);
      stats.fiche++;
    }
    addSitemap(e.category_id, `/etablissements/${L.CITY_SLUGS[e.city]}/${e.slug}`);
  }

  // ── Pages ville × catégorie + quartier × catégorie ─────────────────────
  for (const city of cities) {
    for (const cat of publishedCategories) {
      if (cat.id === 'urgences') continue; // gabarit spécial, généré séparément ci-dessous
      const list = byCityCat[`${city}|${cat.id}`] || [];
      if (list.length < L.MIN_FOR_PAGE) continue;
      for (const lang of ['fr', 'ar']) { generateVilleCategorie(city, cat, list, lang); stats.cat++; }
      addSitemap(cat.id, `/etablissements/${L.CITY_SLUGS[city]}/${L.categorySlug(cat.id)}`);

      // Quartiers qualifiés pour cette ville×catégorie
      const quartierGroups = {};
      for (const e of list) if (e.neighborhood) (quartierGroups[e.neighborhood_id] ||= []).push(e);
      for (const [nbId, qList] of Object.entries(quartierGroups)) {
        if (qList.length < L.MIN_FOR_PAGE) continue;
        const nb = qList[0].neighborhood;
        for (const lang of ['fr', 'ar']) { generateQuartierCategorie(city, cat, nb, qList, list, lang); stats.quartier++; }
        addSitemap(cat.id, `/etablissements/${L.CITY_SLUGS[city]}/${L.categorySlug(cat.id)}/${L.slugify(nb.name_fr)}`);
      }
    }
    // Urgences : pages ville×catégorie SEULEMENT (pas de quartier, gabarit sans bouton mission)
    const urgList = byCityCat[`${city}|urgences`] || [];
    if (urgList.length >= L.MIN_FOR_PAGE) {
      const urgCat = publishedCategories.find((c) => c.id === 'urgences');
      for (const lang of ['fr', 'ar']) { generateVilleCategorieUrgences(city, urgCat, urgList, lang); stats.cat++; }
      addSitemap('urgences', `/etablissements/${L.CITY_SLUGS[city]}/urgences`);
    }
  }

  // ── Hub ville ───────────────────────────────────────────────────────────
  for (const city of cities) {
    for (const lang of ['fr', 'ar']) { generateHub(city, byCity[city] || [], publishedCategories, lang); stats.hub++; }
    addSitemap('_hubs', `/etablissements/${L.CITY_SLUGS[city]}`);
  }

  writeRobotsAndSitemaps(publishedCategories, sitemapUrls);
  writeIndexNowKey();

  console.log('Pages générées (FR+AR confondus dans les compteurs ci-dessous, ×2 déjà inclus) :');
  console.log('  Hub ville      :', stats.hub);
  console.log('  Ville×catégorie / Urgences :', stats.cat);
  console.log('  Quartier×catégorie :', stats.quartier);
  console.log('  Fiches         :', stats.fiche);
  console.log('  TOTAL          :', stats.hub + stats.cat + stats.quartier + stats.fiche);

  // ── Vérification anti-régression SPA : aucune page annuaire n'écrase une route app existante ──
  checkNoSpaCollision();

  // ── Résumé machine pour le rapport de tests ─────────────────────────────
  fs.writeFileSync(path.join(L.PUBLIC_DIR, '..', 'directory-data', 'build-stats.json'), JSON.stringify({ ...stats, total: stats.hub + stats.cat + stats.quartier + stats.fiche, generated_at: new Date().toISOString() }, null, 2));
}

// ── Générateurs de page ───────────────────────────────────────────────────

function nearest(e, all, n = 5) {
  return all.filter((o) => o.id !== e.id && o.lat && e.lat)
    .map((o) => ({ o, d: L.haversineMeters(e.lat, e.lng, o.lat, o.lng) }))
    .sort((a, b) => (a.o.category_id === e.category_id ? 0 : 1) - (b.o.category_id === e.category_id ? 0 : 1) || a.d - b.d)
    .slice(0, n).map((x) => x.o);
}

function fieldLine(lang, label, value, extra) {
  if (!value) return '';
  return `<div><strong>${L.esc(label)}</strong> ${L.esc(value)}${extra || ''}</div>`;
}

function generateFiche(e, lang, byCity) {
  const cat = e.category;
  const content = L.CONTENT[e.category_id];
  const quartierOuVille = e.neighborhood ? (lang === 'ar' ? e.neighborhood.name_ar || e.neighborhood.name_fr : e.neighborhood.name_fr) : cityLabel(e.city, lang);
  const catSingulier = content ? (lang === 'ar' ? content.singulier_ar : content.singulier_fr) : cat.label_fr;
  const catSingulierCap = catSingulier.charAt(0).toUpperCase() + catSingulier.slice(1);

  const title = lang === 'ar' ? `${e.name} — ${quartierOuVille}: العنوان والهاتف | شووفلي` : `${e.name} — ${quartierOuVille} : adresse et téléphone | Shoofly`;
  const meta = lang === 'ar'
    ? `${catSingulierCap} في ${quartierOuVille}. ${e.address ? 'العنوان، ' : ''}${e.phone ? 'الهاتف، ' : ''}وعين شووفلي لتنتظر بدلاً منك.`
    : `${catSingulierCap} à ${quartierOuVille}. ${e.address ? 'Adresse, ' : ''}${e.phone ? 'téléphone, ' : ''}et un Œil Shoofly pour attendre à votre place.`;

  const sousTitre = lang === 'ar' ? `${catSingulierCap} · ${quartierOuVille}` : `${catSingulierCap} · ${e.neighborhood ? e.neighborhood.name_fr + ', ' : ''}${e.city}`;

  const infoLabels = lang === 'ar'
    ? { adresse: 'العنوان', tel: 'الهاتف', site: 'الموقع الإلكتروني', carte: 'عرض على الخريطة' }
    : { adresse: 'Adresse', tel: 'Téléphone', site: 'Site web', carte: 'Voir sur la carte' };
  let infoHtml = '<div class="fiche-info">';
  infoHtml += fieldLine(lang, infoLabels.adresse, e.address);
  infoHtml += fieldLine(lang, infoLabels.tel, e.phone);
  if (e.website) infoHtml += `<div><strong>${L.esc(infoLabels.site)}</strong> <a href="${L.esc(e.website)}" rel="nofollow noopener" target="_blank">${L.esc(e.website)}</a></div>`;
  if (e.lat && e.lng) infoHtml += `<div><a href="https://www.openstreetmap.org/?mlat=${e.lat}&mlon=${e.lng}#map=17/${e.lat}/${e.lng}" rel="nofollow noopener" target="_blank">${L.esc(infoLabels.carte)}</a></div>`;
  infoHtml += '</div>';

  const isUrgence = e.category_id === 'urgences';
  const near = nearest(e, byCity[e.city] || []);
  const nearTitle = lang === 'ar' ? 'بالقرب منك' : 'À proximité';
  const nearHtml = near.length ? `<h2>${L.esc(nearTitle)}</h2><ul class="list">${near.map((o) => {
    const oq = o.neighborhood ? (lang === 'ar' ? o.neighborhood.name_ar || o.neighborhood.name_fr : o.neighborhood.name_fr) : cityLabel(o.city, lang);
    return `<li><a class="card-name" href="${lang === 'ar' ? '/ar' : ''}/etablissements/${L.CITY_SLUGS[o.city]}/${o.slug}">${L.esc(o.name)}</a><div class="card-meta">${L.esc(oq)}</div></li>`;
  }).join('')}</ul>` : '';

  const faqItems = [
    { q: lang === 'ar' ? `أين يقع ${e.name}؟` : `Où se trouve ${e.name} ?`,
      // §7.3 Q1 : "[SI adresse]{adresse}, [/SI]{quartier}, {ville}." — {quartier} n'est ajouté que
      // s'il existe VRAIMENT (sinon quartierOuVille == la ville, et l'ajouter en double serait faux,
      // ex. "Rabat, Rabat." — bug trouvé en relisant la 1re page générée, corrigé ici).
      r: lang === 'ar'
        ? `${e.address ? e.address + '، ' : ''}${e.neighborhood ? quartierOuVille + '، ' : ''}${cityLabel(e.city, lang)}.`
        : `${e.address ? e.address + ', ' : ''}${e.neighborhood ? quartierOuVille + ', ' : ''}${e.city}.` },
    { q: lang === 'ar' ? `هل يمكن تجنّب الطابور في ${e.name}؟` : `Peut-on éviter la file à ${e.name} ?`,
      r: lang === 'ar' ? 'نعم: يمكن لعين شووفلي أن تنتظر بدلاً منك وتنبّهك عندما يقترب دورك.' : 'Oui : un Œil Shoofly peut attendre sur place à votre place et vous prévenir quand votre tour approche.' },
  ];
  if (e.phone) faqItems.push({
    q: lang === 'ar' ? `ما هو رقم هاتف ${e.name}؟` : `Quel est le téléphone de ${e.name} ?`,
    r: lang === 'ar' ? `${e.phone}.` : `${e.phone}.`,
  });
  const faqItemsHtml = faqItems.map((it) => ({ q: it.q, r: L.esc(it.r) }));

  let body = `<h1>${L.esc(e.name)}</h1><p class="crumbs">${sousTitre}</p>`;
  if (isUrgence) {
    body += `<div class="urgence"><strong>${L.esc(T.URGENCES_BANDEAU[lang].fort)}</strong> ${L.esc(T.URGENCES_BANDEAU[lang].suite)}</div>`;
  }
  body += infoHtml;
  if (!isUrgence) {
    body += L.blocShoofly(lang, L.missionHref(e));
    body += L.oeilPeut(lang, cat.domain);
  }
  body += nearHtml;
  body += `<h2>${lang === 'ar' ? 'أسئلة شائعة' : 'Questions fréquentes'}</h2>` + L.faqBlock(lang, faqItemsHtml);
  body += L.nonAffiliationBlock(lang, e.name);
  body += L.signalementLinks(lang, e.id);

  const breadcrumbItems = lang === 'ar'
    ? [{ name: 'الرئيسية', path: '/ar' }, { name: cityLabel(e.city, lang), path: `/ar/etablissements/${L.CITY_SLUGS[e.city]}` }, { name: e.name, path: `/ar/etablissements/${L.CITY_SLUGS[e.city]}/${e.slug}` }]
    : [{ name: 'Accueil', path: '/' }, { name: e.city, path: `/etablissements/${L.CITY_SLUGS[e.city]}` }, { name: e.name, path: `/etablissements/${L.CITY_SLUGS[e.city]}/${e.slug}` }];
  const breadcrumbHtml = `<p class="crumbs">${breadcrumbItems.map((b) => `<a href="${b.path}">${L.esc(b.name)}</a>`).join(' › ')}</p>`;

  const jsonLd = [
    { '@context': 'https://schema.org', '@type': cat.schema_org_type, name: e.name,
      address: e.address ? { '@type': 'PostalAddress', streetAddress: e.address, addressLocality: e.city, addressCountry: 'MA' } : undefined,
      telephone: e.phone || undefined, url: e.website || undefined,
      geo: (e.lat && e.lng) ? { '@type': 'GeoCoordinates', latitude: e.lat, longitude: e.lng } : undefined },
    L.jsonLdBreadcrumb(breadcrumbItems),
    L.jsonLdFaq(faqItems.map((it) => ({ q: it.q, rPlain: it.r }))),
  ];
  if (!isUrgence) jsonLd.push(L.jsonLdShooflyService());

  const urlPath = `/etablissements/${L.CITY_SLUGS[e.city]}/${e.slug}`;
  const html = L.htmlShell({ lang, title, meta, canonicalPath: lang === 'ar' ? `/ar${urlPath}` : urlPath, alternatePath: urlPath, jsonLd, bodyHtml: body, breadcrumbHtml });
  L.writeFile(`${lang === 'ar' ? '/ar' : ''}${urlPath}.html`, html);
}

function generateVilleCategorie(city, cat, list, lang) {
  const content = L.CONTENT[cat.id];
  const label = lang === 'ar' ? cat.label_ar : (lang === 'fr' ? cat.label_fr : cat.label_fr);
  const labelLower = lang === 'ar' ? label : lowerFirst(cat.id, cat.label_fr);
  const ville = cityLabel(city, lang);
  const nb = list.length;

  const title = lang === 'ar' ? `${label} في ${ville}: القائمة والعناوين والانتظار | شووفلي` : `${label} à ${ville} : liste, adresses et attente | Shoofly`;
  const meta = lang === 'ar' ? `${nb} من ${label} في ${ville} مع العناوين وأرقام الهاتف. تجنّب الطابور: عين شووفلي تنتظر بدلاً منك.` : `${nb} ${labelLower} à ${ville} avec adresses et téléphones. Évitez la file : un Œil Shoofly attend à votre place.`;
  const h1 = lang === 'ar' ? `${label} في ${ville}` : `${label} à ${ville}`;
  const phrase = content ? (lang === 'ar' ? content.phrase_ar : content.phrase_fr) : '';
  const intro = lang === 'ar' ? `تم إحصاء ${nb} من ${label} في ${ville}. ${phrase}` : `${nb} ${labelLower} recensés à ${ville}. ${phrase}`;

  let body = `<h1>${L.esc(h1)}</h1><p class="intro">${L.esc(intro)}</p>`;
  body += L.blocShoofly(lang, L.missionHref(null));
  body += L.oeilPeut(lang, cat.domain);
  body += renderList(list, city, lang);

  const quartierLinks = [...new Set(list.filter((e) => e.neighborhood).map((e) => e.neighborhood_id))]
    .map((id) => list.find((e) => e.neighborhood_id === id).neighborhood)
    .filter((nbObj, i, arr) => arr.findIndex((x) => x.id === nbObj.id) === i);
  const qualifiedQuartiers = quartierLinks.filter((q) => list.filter((e) => e.neighborhood_id === q.id).length >= L.MIN_FOR_PAGE);
  if (qualifiedQuartiers.length) {
    body += `<div class="quartiers">${qualifiedQuartiers.map((q) => `<a class="chip" href="${lang === 'ar' ? '/ar' : ''}/etablissements/${L.CITY_SLUGS[city]}/${L.categorySlug(cat.id)}/${L.slugify(q.name_fr)}">${L.esc(lang === 'ar' ? (q.name_ar || q.name_fr) : q.name_fr)}</a>`).join('')}</div>`;
  }

  const faqItems = buildCategoryFaq(cat, content, ville, nb, quartierLinks.length, lang);
  body += `<h2>${lang === 'ar' ? 'أسئلة شائعة' : 'Questions fréquentes'}</h2>` + L.faqBlock(lang, faqItems.map((it) => ({ q: it.q, r: L.esc(it.r) })));
  body += L.nonAffiliationBlock(lang, null);

  const breadcrumbItems = lang === 'ar'
    ? [{ name: 'الرئيسية', path: '/ar' }, { name: ville, path: `/ar/etablissements/${L.CITY_SLUGS[city]}` }, { name: label, path: `/ar/etablissements/${L.CITY_SLUGS[city]}/${L.categorySlug(cat.id)}` }]
    : [{ name: 'Accueil', path: '/' }, { name: city, path: `/etablissements/${L.CITY_SLUGS[city]}` }, { name: label, path: `/etablissements/${L.CITY_SLUGS[city]}/${L.categorySlug(cat.id)}` }];
  const breadcrumbHtml = `<p class="crumbs">${breadcrumbItems.map((b) => `<a href="${b.path}">${L.esc(b.name)}</a>`).join(' › ')}</p>`;
  const jsonLd = [L.jsonLdBreadcrumb(breadcrumbItems), L.jsonLdFaq(faqItems.map((it) => ({ q: it.q, rPlain: it.r }))), L.jsonLdShooflyService()];

  const urlPath = `/etablissements/${L.CITY_SLUGS[city]}/${L.categorySlug(cat.id)}`;
  const html = L.htmlShell({ lang, title, meta, canonicalPath: lang === 'ar' ? `/ar${urlPath}` : urlPath, alternatePath: urlPath, jsonLd, bodyHtml: body, breadcrumbHtml });
  L.writeFile(`${lang === 'ar' ? '/ar' : ''}${urlPath}.html`, html);
}

function generateVilleCategorieUrgences(city, cat, list, lang) {
  const label = lang === 'ar' ? cat.label_ar : cat.label_fr;
  const ville = cityLabel(city, lang);
  const nb = list.length;
  const title = lang === 'ar' ? `${label} في ${ville}: القائمة والعناوين والانتظار | شووفلي` : `${label} à ${ville} : liste, adresses et attente | Shoofly`;
  const meta = lang === 'ar' ? `${nb} من ${label} في ${ville} مع العناوين وأرقام الهاتف.` : `${nb} ${lowerFirst(cat.id, label)} à ${ville} avec adresses et téléphones.`;
  const h1 = lang === 'ar' ? `${label} في ${ville}` : `${label} à ${ville}`;

  let body = `<h1>${L.esc(h1)}</h1>`;
  body += `<div class="urgence"><strong>${L.esc(T.URGENCES_BANDEAU[lang].fort)}</strong> ${L.esc(T.URGENCES_BANDEAU[lang].suite)}</div>`;
  body += renderList(list, city, lang);
  body += L.nonAffiliationBlock(lang, null);

  const breadcrumbItems = lang === 'ar'
    ? [{ name: 'الرئيسية', path: '/ar' }, { name: ville, path: `/ar/etablissements/${L.CITY_SLUGS[city]}` }, { name: label, path: `/ar/etablissements/${L.CITY_SLUGS[city]}/urgences` }]
    : [{ name: 'Accueil', path: '/' }, { name: city, path: `/etablissements/${L.CITY_SLUGS[city]}` }, { name: label, path: `/etablissements/${L.CITY_SLUGS[city]}/urgences` }];
  const breadcrumbHtml = `<p class="crumbs">${breadcrumbItems.map((b) => `<a href="${b.path}">${L.esc(b.name)}</a>`).join(' › ')}</p>`;
  const jsonLd = [L.jsonLdBreadcrumb(breadcrumbItems)];

  const urlPath = `/etablissements/${L.CITY_SLUGS[city]}/urgences`;
  const html = L.htmlShell({ lang, title, meta, canonicalPath: lang === 'ar' ? `/ar${urlPath}` : urlPath, alternatePath: urlPath, jsonLd, bodyHtml: body, breadcrumbHtml });
  L.writeFile(`${lang === 'ar' ? '/ar' : ''}${urlPath}.html`, html);
}

function generateQuartierCategorie(city, cat, nbObj, list, fullCityCatList, lang) {
  const content = L.CONTENT[cat.id];
  const label = lang === 'ar' ? cat.label_ar : cat.label_fr;
  const labelLower = lang === 'ar' ? label : lowerFirst(cat.id, cat.label_fr);
  const ville = cityLabel(city, lang);
  const quartier = lang === 'ar' ? (nbObj.name_ar || nbObj.name_fr) : nbObj.name_fr;
  const nb = list.length;
  const catSingulier = content ? (lang === 'ar' ? content.singulier_ar : content.singulier_fr) : label;
  const art = content ? article(content.genre) : 'un';

  const title = lang === 'ar' ? `${label} في ${quartier}، ${ville} | شووفلي` : `${label} à ${quartier}, ${ville} | Shoofly`;
  const meta = lang === 'ar' ? `${nb} من ${label} في ${quartier} (${ville}). العناوين وأرقام الهاتف، وعين شووفلي لتنتظر بدلاً منك.` : `${nb} ${labelLower} à ${quartier} (${ville}). Adresses, téléphones, et un Œil Shoofly pour attendre à votre place.`;
  const h1 = lang === 'ar' ? `${label} في ${quartier}` : `${label} à ${quartier}`;
  const phrase = content ? (lang === 'ar' ? content.phrase_ar : content.phrase_fr) : '';
  const intro = lang === 'ar' ? `هل تبحث عن ${catSingulier} في ${quartier}؟ إليك ${nb} مؤسسات في الحي. ${phrase}` : `Vous cherchez ${art} ${catSingulier} à ${quartier} ? Voici les ${nb} établissements recensés dans le quartier. ${phrase}`;

  let body = `<h1>${L.esc(h1)}</h1><p class="intro">${L.esc(intro)}</p>`;
  body += L.blocShoofly(lang, L.missionHref(null));
  body += L.oeilPeut(lang, cat.domain);
  body += renderList(list, city, lang);

  const backLabel = lang === 'ar' ? `كل ${label} في ${ville}` : `Tous les ${labelLower} à ${ville}`;
  body += `<p><a href="${lang === 'ar' ? '/ar' : ''}/etablissements/${L.CITY_SLUGS[city]}/${L.categorySlug(cat.id)}">${L.esc(backLabel)}</a></p>`;

  const faqItems = buildCategoryFaq(cat, content, ville, nb, 1, lang);
  body += `<h2>${lang === 'ar' ? 'أسئلة شائعة' : 'Questions fréquentes'}</h2>` + L.faqBlock(lang, faqItems.map((it) => ({ q: it.q, r: L.esc(it.r) })));
  body += L.nonAffiliationBlock(lang, null);

  const catPath = `/etablissements/${L.CITY_SLUGS[city]}/${L.categorySlug(cat.id)}`;
  const urlPath = `${catPath}/${L.slugify(nbObj.name_fr)}`;
  const breadcrumbItems = lang === 'ar'
    ? [{ name: 'الرئيسية', path: '/ar' }, { name: ville, path: `/ar/etablissements/${L.CITY_SLUGS[city]}` }, { name: label, path: `/ar${catPath}` }, { name: quartier, path: `/ar${urlPath}` }]
    : [{ name: 'Accueil', path: '/' }, { name: city, path: `/etablissements/${L.CITY_SLUGS[city]}` }, { name: label, path: catPath }, { name: quartier, path: urlPath }];
  const breadcrumbHtml = `<p class="crumbs">${breadcrumbItems.map((b) => `<a href="${b.path}">${L.esc(b.name)}</a>`).join(' › ')}</p>`;
  const jsonLd = [L.jsonLdBreadcrumb(breadcrumbItems), L.jsonLdFaq(faqItems.map((it) => ({ q: it.q, rPlain: it.r }))), L.jsonLdShooflyService()];

  const html = L.htmlShell({ lang, title, meta, canonicalPath: lang === 'ar' ? `/ar${urlPath}` : urlPath, alternatePath: urlPath, jsonLd, bodyHtml: body, breadcrumbHtml });
  L.writeFile(`${lang === 'ar' ? '/ar' : ''}${urlPath}.html`, html);
}

function generateHub(city, list, allCategories, lang) {
  const ville = cityLabel(city, lang);
  const title = lang === 'ar' ? `تجنّب الانتظار في ${ville}: الصحة والإدارات | شووفلي` : `Éviter la file d'attente à ${ville} : santé et administrations | Shoofly`;
  const meta = lang === 'ar' ? `مختبرات، أطباء، مستشفيات، الضمان الاجتماعي، المقاطعات… اعثر على مؤسسات ${ville} ودع عين شووفلي تنتظر بدلاً منك.` : `Laboratoires, médecins, hôpitaux, CNSS, arrondissements… Trouvez les établissements de ${ville} et confiez l'attente à un Œil Shoofly.`;
  const h1 = lang === 'ar' ? `أماكن الانتظار في ${ville}` : `Établissements où l'on attend à ${ville}`;
  const intro = lang === 'ar'
    ? `قاعة انتظار ممتلئة، طابور أمام الشباك، رقم لا يتقدم: في ${ville}، تبدأ كثير من الإجراءات بالانتظار. تجمع هذه الصفحة المؤسسات الصحية والإدارات في المدينة، مصنفة حسب الفئة والحي.`
    : `Salle d'attente pleine, file devant un guichet, ticket qui n'avance pas : à ${ville}, beaucoup de démarches commencent par une attente. Cette page regroupe les établissements de santé et les administrations de la ville, classés par catégorie et par quartier.`;

  let body = `<h1>${L.esc(h1)}</h1><p class="intro">${L.esc(intro)}</p>`;
  body += L.blocShoofly(lang, L.missionHref(null));

  const catCounts = {};
  for (const e of list) catCounts[e.category_id] = (catCounts[e.category_id] || 0) + 1;
  const catsWithPage = allCategories.filter((c) => (catCounts[c.id] || 0) >= L.MIN_FOR_PAGE);
  body += `<div class="cats">${catsWithPage.map((c) => {
    const catPath = c.id === 'urgences' ? 'urgences' : L.categorySlug(c.id);
    return `<a class="chip" href="${lang === 'ar' ? '/ar' : ''}/etablissements/${L.CITY_SLUGS[city]}/${catPath}">${L.esc(lang === 'ar' ? c.label_ar : c.label_fr)}<span class="badge">${catCounts[c.id]}</span></a>`;
  }).join('')}</div>`;

  const quartiers = [...new Map(list.filter((e) => e.neighborhood).map((e) => [e.neighborhood.id, e.neighborhood])).values()];
  if (quartiers.length) {
    const quartierTitle = lang === 'ar' ? 'الأحياء' : 'Quartiers';
    body += `<h2>${L.esc(quartierTitle)}</h2><div class="quartiers">${quartiers.map((q) => `<span class="chip">${L.esc(lang === 'ar' ? (q.name_ar || q.name_fr) : q.name_fr)}</span>`).join('')}</div>`;
  }

  const faqItemsPlain = T.FAQ_GENERALE.map((it) => ({ q: it[lang].q, r: it[lang].r }));
  body += `<h2>${lang === 'ar' ? 'أسئلة شائعة' : 'Questions fréquentes'}</h2>` + L.faqBlock(lang, faqItemsPlain.map((it) => ({ q: it.q, r: L.esc(it.r) })));

  const breadcrumbItems = lang === 'ar'
    ? [{ name: 'الرئيسية', path: '/ar' }, { name: ville, path: `/ar/etablissements/${L.CITY_SLUGS[city]}` }]
    : [{ name: 'Accueil', path: '/' }, { name: city, path: `/etablissements/${L.CITY_SLUGS[city]}` }];
  const breadcrumbHtml = `<p class="crumbs">${breadcrumbItems.map((b) => `<a href="${b.path}">${L.esc(b.name)}</a>`).join(' › ')}</p>`;
  const jsonLd = [L.jsonLdBreadcrumb(breadcrumbItems), L.jsonLdFaq(faqItemsPlain.map((it) => ({ q: it.q, rPlain: it.r }))), L.jsonLdShooflyService()];

  const urlPath = `/etablissements/${L.CITY_SLUGS[city]}`;
  const html = L.htmlShell({ lang, title, meta, canonicalPath: lang === 'ar' ? `/ar${urlPath}` : urlPath, alternatePath: urlPath, jsonLd, bodyHtml: body, breadcrumbHtml });
  L.writeFile(`${lang === 'ar' ? '/ar' : ''}${urlPath}.html`, html);
}

function renderList(list, city, lang) {
  const labels = lang === 'ar' ? { fiche: 'التفاصيل' } : { fiche: 'Détails' };
  return `<ul class="list">${list.map((e) => {
    const q = e.neighborhood ? (lang === 'ar' ? e.neighborhood.name_ar || e.neighborhood.name_fr : e.neighborhood.name_fr) : '';
    return `<li>
<a class="card-name" href="${lang === 'ar' ? '/ar' : ''}/etablissements/${L.CITY_SLUGS[city]}/${e.slug}">${L.esc(e.name)}</a>
<div class="card-meta">${[q, e.address, e.phone].filter(Boolean).map(L.esc).join(' · ')}</div>
</li>`;
  }).join('')}</ul>`;
}

function buildCategoryFaq(cat, content, ville, nb, nbQuartiers, lang) {
  const items = [];
  if (content && content.has_attente) {
    const catSing = lang === 'ar' ? content.singulier_ar : content.singulier_fr;
    const attente = lang === 'ar' ? content.attente_ar : content.attente_fr;
    items.push({
      q: lang === 'ar' ? `كم يستغرق الانتظار في ${catSing} في ${ville}؟` : `Combien de temps attend-on dans un/une ${catSing} à ${ville} ?`.replace('un/une', article(content.genre)),
      r: lang === 'ar' ? `غالباً ما يجب احتساب ${attente}، حسب اليوم والساعة والمؤسسة. هذا الوقت يمكنك استرجاعه: عين شووفلي تنتظر بدلاً منك وتنبّهك عندما يقترب دورك.` : `Il faut souvent compter ${attente}, selon le jour, l'heure et l'établissement. Ce temps, vous pouvez le récupérer : un Œil attend à votre place et vous prévient quand votre tour approche.`,
    });
  }
  items.push({
    q: lang === 'ar' ? 'هل يمكن لعين شووفلي أن تعوّضني بالكامل؟' : 'Un Œil peut-il me remplacer complètement ?',
    r: lang === 'ar' ? 'تحتفظ بمكانك أو تأخذ لك رقماً. وإذا كان حضورك ضرورياً، تنبّهك في الوقت المناسب.' : 'Il garde votre place ou prend un ticket. Si votre présence est requise, il vous prévient à temps.',
  });
  const label = lang === 'ar' ? cat.label_ar : cat.label_fr;
  items.push({
    q: lang === 'ar' ? `كم عدد ${label} في ${ville}؟` : `Combien de ${lowerFirst(cat.id, cat.label_fr)} y a-t-il à ${ville} ?`,
    r: lang === 'ar' ? `يحصي شووفلي ${nb} مؤسسة في ${nbQuartiers} أحياء.` : `Shoofly en recense ${nb}, dans ${nbQuartiers} quartiers.`,
  });
  items.push({
    q: lang === 'ar' ? 'هل هناك معلومة خاطئة؟' : 'Une information est fausse ?',
    r: lang === 'ar' ? 'استخدم رابط "الإبلاغ عن خطأ" في الصفحة المعنية.' : 'Utilisez le lien « Signaler une erreur » sur la fiche concernée.',
  });
  return items;
}

function writeRobotsAndSitemaps(categories, sitemapUrls) {
  const robots = `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: *
Allow: /

Sitemap: ${L.SITE_URL}/sitemap-index.xml
`;
  L.writeFile('/robots.txt', robots);

  // Vagues de soumission (décision Étape 3) : catégories à forte attente d'abord — ordre du
  // sitemap-index, PAS un filtre : toutes les pages existent, seul l'ORDRE de soumission diffère.
  const PRIORITY_FIRST = ['laboratoires', 'centres_sante_publics', 'hopitaux', 'medecine_generale', 'cnss', 'arrondissement_etat_civil'];
  const orderedCatIds = ['_hubs', ...PRIORITY_FIRST, ...categories.map((c) => c.id).filter((id) => !PRIORITY_FIRST.includes(id))];

  const today = new Date().toISOString().slice(0, 10);
  const sitemapFiles = [];
  for (const catId of orderedCatIds) {
    const urls = sitemapUrls[catId];
    if (!urls || !urls.length) continue;
    const fileName = catId === '_hubs' ? 'sitemap-hubs.xml' : `sitemap-${catId.replace(/_/g, '-')}.xml`;
    const urlEntries = urls.flatMap((p) => [
      `  <url><loc>${L.SITE_URL}${p}</loc><lastmod>${today}</lastmod><xhtml:link rel="alternate" hreflang="ar" href="${L.SITE_URL}/ar${p}"/></url>`,
      `  <url><loc>${L.SITE_URL}/ar${p}</loc><lastmod>${today}</lastmod><xhtml:link rel="alternate" hreflang="fr" href="${L.SITE_URL}${p}"/></url>`,
    ]);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlEntries.join('\n')}\n</urlset>\n`;
    L.writeFile(`/${fileName}`, xml);
    sitemapFiles.push(fileName);
  }
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapFiles.map((f) => `  <sitemap><loc>${L.SITE_URL}/${f}</loc><lastmod>${today}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`;
  L.writeFile('/sitemap-index.xml', indexXml);
  console.log('Sitemaps écrits (ordre de priorité de soumission) :', sitemapFiles.join(', '));
}

function writeIndexNowKey() {
  // Clé PRÉPARÉE, jamais envoyée (décision Étape 3) — le fichier de vérification doit être servi à
  // la racine (protocole IndexNow) ; aucun appel réseau n'est fait par ce script.
  // Nettoie une éventuelle clé d'un run précédent (utile en local, sur un vrai build Vercel le
  // dossier public/ part toujours d'un checkout propre donc ce cas ne se présente pas).
  for (const f of fs.readdirSync(L.PUBLIC_DIR)) if (/^[a-f0-9]{32}\.txt$/.test(f)) fs.unlinkSync(path.join(L.PUBLIC_DIR, f));
  const key = crypto.randomBytes(16).toString('hex');
  L.writeFile(`/${key}.txt`, key);
  fs.writeFileSync(path.join(L.PUBLIC_DIR, '..', 'directory-data', 'indexnow-key.json'), JSON.stringify({ key, keyLocation: `${L.SITE_URL}/${key}.txt`, note: 'Préparé, jamais envoyé à l\'API IndexNow — voir RAPPORT_PHASE3.md.' }, null, 2));
  console.log('Clé IndexNow préparée (non envoyée) :', key);
}

function checkNoSpaCollision() {
  const APP_ROOT_SEGMENTS = ['login', 'register', 'client', 'oeil', 'admin', 'forgot-password', 'reset-password', 'verification', 'confidentialite', 'cgv', 'mentions-legales', 'compte-bloque', 'payment'];
  const collision = APP_ROOT_SEGMENTS.find((s) => fs.existsSync(path.join(L.PUBLIC_DIR, 'etablissements', s)));
  if (collision) throw new Error(`Collision détectée : /etablissements/${collision} chevauche une route de l'app`);
  console.log('Vérification anti-collision SPA : OK (aucun chevauchement avec les routes app).');
}

main().catch((e) => { console.error('ERREUR BUILD:', e.message); process.exit(1); });
