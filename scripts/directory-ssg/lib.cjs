#!/usr/bin/env node
// Chantier SEO annuaire — Phase 3 (2026-09-30). Générateur SSG : lit directory-data/*.json (export
// backend, voir Shoofly/backend/scripts/directory-import/export-json.js) + directory-content.json
// (contenu éditorial séparé), écrit du HTML STATIQUE COMPLET (aucune dépendance JS pour le contenu)
// dans public/etablissements/** (FR) et public/ar/etablissements/** (AR). Lancé en pré-build
// (package.json "build") — jamais de connexion DB depuis ce script quand il tourne sur Vercel.
//
// Textes : voir text-templates.js (recopiés mot pour mot depuis seo-study/MODELES_TEXTES_SEO.md) et
// directory-content.json (phrases par catégorie §8, également recopiées du même .md).

const fs = require('fs');
const path = require('path');
const T = require('./text-templates.cjs');
const CONTENT = require('./directory-content.json').categories;

const ROOT = path.join(__dirname, '..', '..');
const DATA_DIR = path.join(ROOT, 'directory-data');
const PUBLIC_DIR = path.join(ROOT, 'public');
// Domaine PRINCIPAL : https://shoofly.ma redirige vers https://www.shoofly.ma (vérifié en production). Toute URL
// absolue générée (canonical, hreflang, sitemaps, robots.txt, JSON-LD, IndexNow, stubs) doit pointer ici.
const SITE_URL = 'https://www.shoofly.ma';
// URL de l'API backend pour le formulaire de signalement (§C, routes/directory.js) — PAS de valeur
// devinée : configurable via une variable d'environnement de build, comme VITE_API_URL ailleurs
// dans ce dépôt (src/api/client.js). Défaut = backend local, pour que les previews non configurées
// échouent de façon visible plutôt que d'appeler un domaine inventé. À définir explicitement dans
// les variables d'environnement Vercel avant tout déploiement réel — voir RAPPORT_PHASE3.md.
const API_URL = process.env.DIRECTORY_API_URL || 'http://localhost:3001';
const MIN_FOR_PAGE = 3; // seuil ville×catégorie ET quartier×catégorie (décision Phase 3, Étape 2)

const CITY_SLUGS = { Rabat: 'rabat', 'Salé': 'sale', 'Témara': 'temara' };
const CITY_BY_SLUG = Object.fromEntries(Object.entries(CITY_SLUGS).map(([k, v]) => [v, k]));

// ── Utilitaires ──────────────────────────────────────────────────────────
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function normalizeCore(s) {
  let out = (s || '').toLowerCase();
  out = out.normalize('NFD').replace(/[̀-ͯ]/g, '');
  out = out.replace(/[ً-ٰٟ]/g, '');
  out = out.replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  return out;
}
function slugify(s) { return normalizeCore(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x'; }
function categorySlug(catId) { return catId.replace(/_/g, '-'); }
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
// Site web saisi sans protocole dans la source (ex. "www.poste.ma") : on ajoute https:// au build,
// pour le lien visible ET le JSON-LD. Valeur invalide => null (le lien n'est alors pas affiché).
// Garde-fous : pas d'espace, schéma http(s) seulement après normalisation, hôte à au moins un point
// et un TLD alphabétique (écarte "javascript:…", "localhost", "1.2.3.4" et les chaînes parasites).
function normalizeWebsite(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s || /\s/.test(s)) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  let u;
  try { u = new URL(s); } catch { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  if (u.username || u.password) return null; // "mailto:a@b.ma" => https://mailto:a@b.ma/ : identifiants, rejeté
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(u.hostname)) return null;
  // Racine seule : pas de barre finale ajoutée par URL ("https://www.poste.ma", pas "…ma/").
  const out = u.toString();
  return u.pathname === '/' && !u.search && !u.hash ? out.replace(/\/$/, '') : out;
}
function writeFile(relPath, content) {
  const full = path.join(PUBLIC_DIR, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}
// directory-data/ est gitignoré (Phase 4, décision #2) : absent sur un checkout propre (Vercel) —
// mkdir recursive avant d'écrire, comme writeFile ci-dessus.
function writeDataFile(fileName, content) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, fileName), content);
}

// ── Chargement des données ───────────────────────────────────────────────
// Phase 4, décision #2 : les données ne sont plus lues depuis des fichiers JSON locaux commis au
// dépôt (les dépôts GitHub sont PUBLICS) mais récupérées au build via l'endpoint protégé
// GET /api/directory/export (routes/directory.js, backend), jeton lu depuis une variable
// d'environnement Vercel. ÉCHEC EXPLICITE (throw, jamais un tableau vide) si l'URL/le jeton
// manquent ou si la requête échoue — jamais de pages générées à partir de données vides.
// Phase 4 bis, correctif #2 : Render (plan gratuit) peut mettre le backend plusieurs dizaines de
// secondes à répondre après une mise en veille ("cold start"). Timeout généreux par tentative +
// 3 tentatives avec attente croissante, pour ne pas faire échouer un build Vercel juste parce que
// le backend était en train de démarrer. N'importe quelle erreur réseau/timeout, ou un 5xx (signe
// typique de cold start côté proxy), déclenche une nouvelle tentative ; un 4xx (ex. jeton invalide)
// n'a aucune raison de réussir en réessayant et échoue donc immédiatement.
const EXPORT_TIMEOUT_MS = 90000;
const EXPORT_MAX_ATTEMPTS = 3;
const EXPORT_RETRY_DELAYS_MS = [5000, 20000];

async function fetchExportWithRetry(url, token) {
  for (let attempt = 1; attempt <= EXPORT_MAX_ATTEMPTS; attempt++) {
    console.log(`Export backend — tentative ${attempt}/${EXPORT_MAX_ATTEMPTS} vers ${url}...`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), EXPORT_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { 'X-Directory-Export-Token': token },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok && res.status >= 500 && attempt < EXPORT_MAX_ATTEMPTS) {
        const wait = EXPORT_RETRY_DELAYS_MS[attempt - 1];
        console.warn(`Export backend — HTTP ${res.status} (tentative ${attempt}/${EXPORT_MAX_ATTEMPTS}), probable démarrage à froid — nouvelle tentative dans ${wait / 1000}s...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      return res; // ok, ou échec définitif (4xx, ou dernière tentative) — l'appelant décide
    } catch (e) {
      clearTimeout(timer);
      const reason = e.name === 'AbortError' ? `délai dépassé (${EXPORT_TIMEOUT_MS / 1000}s)` : e.message;
      if (attempt < EXPORT_MAX_ATTEMPTS) {
        const wait = EXPORT_RETRY_DELAYS_MS[attempt - 1];
        console.warn(`Export backend — échec (${reason}) à la tentative ${attempt}/${EXPORT_MAX_ATTEMPTS}, probable démarrage à froid — nouvelle tentative dans ${wait / 1000}s...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw new Error(`Export backend injoignable après ${EXPORT_MAX_ATTEMPTS} tentatives (${reason}) à ${url} — build arrêté volontairement.`);
    }
  }
}

async function loadData() {
  if (!process.env.DIRECTORY_EXPORT_TOKEN) {
    throw new Error("DIRECTORY_EXPORT_TOKEN manquant — build arrêté volontairement (décision Phase 4 #2 : jamais de pages générées sans données réelles).");
  }
  const res = await fetchExportWithRetry(`${API_URL}/api/directory/export`, process.env.DIRECTORY_EXPORT_TOKEN);
  if (!res.ok) {
    throw new Error(`Export backend indisponible (HTTP ${res.status}) à ${API_URL}/api/directory/export après ${EXPORT_MAX_ATTEMPTS} tentatives — build arrêté volontairement.`);
  }
  const { categories, establishments, neighborhoods, removed } = await res.json();
  if (!Array.isArray(establishments) || establishments.length === 0) {
    throw new Error("Export backend a renvoyé 0 établissement — build arrêté volontairement (pas de pages vides).");
  }
  // `removed` : ajouté au backend sur feat/annuaire-liens. Absent tant que le backend n'est pas déployé
  // => aucune page de redirection générée (et un avertissement), le reste du build continue.
  if (!Array.isArray(removed)) console.warn('(avertissement) export sans liste `removed` — aucune page de redirection générée (backend non déployé ?).');
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));
  const nbById = Object.fromEntries(neighborhoods.map((n) => [n.id, n]));
  for (const e of establishments) {
    e.category = catById[e.category_id];
    e.neighborhood = e.neighborhood_id ? nbById[e.neighborhood_id] : null;
  }
  return { categories, establishments, neighborhoods, removed: Array.isArray(removed) ? removed : [], catById, nbById };
}

// ── Gabarit HTML commun ──────────────────────────────────────────────────
function htmlShell({ lang, title, meta, canonicalPath, alternatePath, jsonLd, bodyHtml, breadcrumbHtml, mainClass }) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const canonical = `${SITE_URL}${canonicalPath}`;
  const altFr = lang === 'ar' ? `${SITE_URL}${alternatePath}` : canonical;
  const altAr = lang === 'ar' ? canonical : `${SITE_URL}/ar${alternatePath}`;
  return `<!doctype html>
<html lang="${lang === 'ar' ? 'ar' : 'fr'}" dir="${dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(meta)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="fr" href="${altFr}">
<link rel="alternate" hreflang="ar" href="${altAr}">
<link rel="alternate" hreflang="x-default" href="${altFr}">
<meta name="theme-color" content="#0F0F0F">
<link rel="icon" href="/favicon.ico">
<link rel="preload" href="/fonts/inter-variable-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/space-grotesk-variable-latin.woff2" as="font" type="font/woff2" crossorigin>
${lang === 'ar' ? `<link rel="preload" href="/fonts/tajawal-400-arabic.woff2" as="font" type="font/woff2" crossorigin>\n` : ''}<script>document.documentElement.classList.add('js')</script>
<style>
/* Polices auto-hébergées (Phase 4, décision #5) — mêmes fichiers que l'app React, sous-jeu latin */
@font-face{font-family:'Inter';font-style:normal;font-weight:300 700;font-display:swap;src:url('/fonts/inter-variable-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Space Grotesk';font-style:normal;font-weight:400 700;font-display:swap;src:url('/fonts/space-grotesk-variable-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
/* Police arabe (choix BOSS 2026-09-30) — Tajawal, licence SIL OFL 1.1, sous-jeu arabe. Ajoutée en
   repli après Inter/Space Grotesk : le unicode-range fait retomber automatiquement les caractères
   arabes dessus sans sélecteur dir dédié. */
@font-face{font-family:'Tajawal';font-style:normal;font-weight:400;font-display:swap;src:url('/fonts/tajawal-400-arabic.woff2') format('woff2');unicode-range:U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFC,U+200C-200E}
@font-face{font-family:'Tajawal';font-style:normal;font-weight:500;font-display:swap;src:url('/fonts/tajawal-500-arabic.woff2') format('woff2');unicode-range:U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFC,U+200C-200E}
@font-face{font-family:'Tajawal';font-style:normal;font-weight:700;font-display:swap;src:url('/fonts/tajawal-700-arabic.woff2') format('woff2');unicode-range:U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFC,U+200C-200E}
:root{--bg:#0F0F0F;--panel:#181818;--accent:#FF4D00;--text:#F2F2F2;--muted:#9A9A9A;--border:#262626}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:'Inter','Tajawal',system-ui,-apple-system,sans-serif;line-height:1.55}
h1,h2,h3{font-family:'Space Grotesk','Tajawal','Inter',system-ui,sans-serif;line-height:1.25}
a{color:var(--accent)}
.wrap{max-width:880px;margin:0 auto;padding:0 16px}
header.site{border-bottom:1px solid var(--border);padding:14px 0}
header.site .wrap{display:flex;align-items:center;justify-content:space-between}
.logo{font-weight:700;font-size:18px;color:var(--text);text-decoration:none}
.logo b{color:var(--accent)}
main{padding:28px 0 60px}
h1{font-size:26px;margin:0 0 8px}
.crumbs{font-size:13px;color:var(--muted);margin-bottom:16px}
.crumbs a{color:var(--muted)}
.intro{color:#D8D8D8;margin-bottom:20px}
.panel{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:20px;margin:20px 0}
.btn{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:10px;margin-top:10px}
.tagline{font-style:italic;color:var(--muted)}
ul.list{list-style:none;padding:0;margin:0}
ul.list li{border-bottom:1px solid var(--border);padding:14px 0}
ul.list li:last-child{border-bottom:none}
.card-name{font-weight:600;font-size:16px}
.card-meta{color:var(--muted);font-size:14px;margin-top:2px}
.badge{display:inline-block;font-size:11px;color:var(--muted);border:1px solid var(--border);border-radius:999px;padding:1px 8px;margin-inline-start:6px}
.cats,.quartiers{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}
.chip{border:1px solid var(--border);border-radius:999px;padding:6px 12px;font-size:13px;text-decoration:none;color:var(--text)}
.faq dt{font-weight:600;margin-top:14px}
.faq dd{margin:4px 0 0;color:#D8D8D8}
.fiche-info{margin:16px 0}
.fiche-info div{padding:6px 0;border-bottom:1px solid var(--border)}
.urgence{border:1px solid var(--accent);background:rgba(255,77,0,.08);border-radius:14px;padding:16px;margin-bottom:20px}
.non-affil{color:var(--muted);font-size:13px;margin-top:24px}
.signalement{font-size:13px;margin-top:10px}
.signalement a{margin-inline-end:14px}
footer.site{border-top:1px solid var(--border);padding:20px 0;color:var(--muted);font-size:12px}
/* Formulaires de signalement : visibles SANS JavaScript (repli mailto), masqués seulement si le JS est
   actif (classe "js" posée tout en haut du <head>). */
form.report-form{display:flex;margin-top:10px;gap:8px;flex-direction:column;max-width:420px}
.js form.report-form{display:none}
.js form.report-form.open{display:flex}
form.report-form textarea,form.report-form input{background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:8px}
form.report-form button{background:var(--accent);color:#fff;border:0;border-radius:8px;padding:8px;font-weight:600;cursor:pointer}
.report-ok{color:#5FD068;font-size:13px}
/* Fiche établissement (refonte 2026-10-05) : hiérarchie nom > CTA > infos > détails repliés. Règles
   scopées à main.fiche : les pages liste ne sont pas touchées. Logique (inline-start/end) pour le RTL. */
main.fiche{padding-bottom:28px}
.fiche h1{font-size:32px;margin:0 0 6px}
.fiche-kicker{color:#D8D8D8;font-size:15px;margin:0 0 10px}
.fiche-attente{display:inline-block;font-size:13px;font-weight:600;color:var(--text);border:1px solid var(--accent);border-radius:999px;padding:4px 12px;margin:0 0 22px}
.fiche-cta{margin:0 0 24px}
.btn-cta{display:flex;align-items:center;justify-content:center;min-height:52px;background:var(--accent);color:#fff;font-weight:700;font-size:18px;text-decoration:none;border-radius:12px;padding:12px 20px}
.fiche-card{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:0 16px;margin:0 0 24px}
.fiche-row{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border)}
.fiche-row:last-child{border-bottom:none}
.fiche-row svg{flex:0 0 20px;width:20px;height:20px;margin-top:10px;fill:none;stroke:var(--muted);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.fiche-row .lbl{display:block;font-size:12px;color:var(--muted)}
.fiche-row a{display:inline-flex;align-items:center;min-height:44px;margin-inline-end:14px;word-break:break-word}
.fiche-how,.faq-item{border-top:1px solid var(--border);margin-top:0}
.fiche-how>summary,.faq-item>summary{display:flex;align-items:center;min-height:44px;padding:8px 0;font-weight:600;cursor:pointer;list-style:none}
.fiche-how>summary::-webkit-details-marker,.faq-item>summary::-webkit-details-marker{display:none}
.fiche-how>summary::after,.faq-item>summary::after{content:'+';margin-inline-start:auto;font-size:20px;color:var(--muted);padding-inline-start:12px}
.fiche-how[open]>summary::after,.faq-item[open]>summary::after{content:'−'}
.fiche-how-body{padding:0 0 12px}
.fiche-how-body h3{font-size:18px;margin:4px 0 8px}
.fiche-how-body p{margin:6px 0;color:#D8D8D8}
.faq-item p{margin:0 0 12px;color:#D8D8D8}
.fiche-foot{margin-top:28px;border-top:1px solid var(--border);padding-top:14px}
.fiche-foot .non-affil{margin-top:0}
@media (max-width:639px){
  /* Mobile : le bouton principal reste visible en bas de l'écran (fixed, un seul élément). Le
     padding du <main> réserve la place pour que le pied de page reste accessible. */
  .fiche-cta{position:fixed;inset-inline:0;bottom:0;z-index:50;margin:0;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:var(--bg);border-top:1px solid var(--border)}
  .fiche-cta .btn-cta{width:100%}
  main.fiche{padding-bottom:120px}
}
</style>
${jsonLd.map((block) => `<script type="application/ld+json">${JSON.stringify(block)}</script>`).join('\n')}
</head>
<body>
<header class="site"><div class="wrap">
<a class="logo" href="${lang === 'ar' ? '/ar' : '/'}">SHOOF<b>LY</b></a>
</div></header>
<main class="${mainClass || 'wrap'}">
${breadcrumbHtml || ''}
${bodyHtml}
</main>
<footer class="site"><div class="wrap">${esc(T.FOOTER_ATTRIBUTION[lang])}</div></footer>
<script>
document.addEventListener('click', function(e){
  var t = e.target.closest('[data-report-toggle]');
  if (t) {
    // Sans preventDefault, href="#…" fait défiler la page tout en haut : c'était le « rechargement » signalé.
    e.preventDefault();
    var f = document.getElementById(t.getAttribute('data-report-toggle')); if (f) f.classList.toggle('open');
  }
});
document.addEventListener('submit', function(e){
  var f = e.target.closest('form.report-form');
  if (!f) return;
  e.preventDefault();
  var body = { establishment_id: f.dataset.establishmentId, type: f.dataset.type, message: f.querySelector('[name=message]').value, contact_email: f.querySelector('[name=contact_email]').value || undefined };
  fetch('${API_URL}/api/directory/reports', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
    .then(function(r){ return r.ok ? f : Promise.reject(); })
    .then(function(){ f.innerHTML = '<p class="report-ok">' + (f.dataset.lang==='ar' ? 'تم الإرسال، شكراً لك.' : 'Envoyé, merci.') + '</p>'; })
    .catch(function(){ f.innerHTML = '<p>' + (f.dataset.lang==='ar' ? 'خطأ، حاول لاحقاً.' : 'Erreur, réessayez plus tard.') + '</p>'; });
});
</script>
</body>
</html>`;
}

// ── Blocs réutilisables ──────────────────────────────────────────────────
function blocShoofly(lang, missionHref) {
  const b = T.BLOC_SHOOFLY[lang];
  return `<div class="panel">
<h2>${esc(b.titre)}</h2>
<p>${esc(b.corps)}</p>
<p class="tagline">${esc(b.tagline)}</p>
<a class="btn" href="${esc(missionHref)}">${esc(b.bouton)}</a>
</div>`;
}
function oeilPeut(lang, domain) {
  const t = domain === 'sante' ? T.OEIL_PEUT_SANTE : T.OEIL_PEUT_ADMIN;
  return `<p>${esc(t[lang])}</p>`;
}
function nonAffiliationBlock(lang, nom) {
  const t = nom ? T.nonAffiliation(nom)[lang] : T.NON_AFFILIATION_LISTE[lang];
  return `<p class="non-affil">${esc(t)}</p>`;
}
function signalementLinks(lang, establishmentId) {
  const l = T.LIENS_SIGNALEMENT[lang];
  return `<div class="signalement">
<a href="#report-erreur" data-report-toggle="report-erreur">${esc(l.erreur)}</a>
<a href="#report-retrait" data-report-toggle="report-retrait">${esc(l.retrait)}</a>
${reportForm(lang, establishmentId, 'erreur', 'report-erreur')}
${reportForm(lang, establishmentId, 'retrait', 'report-retrait')}
</div>`;
}
function reportForm(lang, establishmentId, type, id) {
  const placeholders = lang === 'ar'
    ? { msg: 'اكتب رسالتك هنا', email: 'بريدك الإلكتروني (اختياري)', send: 'إرسال' }
    : { msg: 'Votre message', email: 'Votre email (optionnel)', send: 'Envoyer' };
  // Repli SANS JavaScript : envoi par mailto (text/plain) à l'adresse de contact publiée par Shoofly.
  // Avec JS, le submit est intercepté (voir script de htmlShell) et part vers l'API.
  const subject = lang === 'ar'
    ? (type === 'retrait' ? 'طلب حذف بطاقة من الدليل' : 'الإبلاغ عن خطأ في بطاقة الدليل')
    : (type === 'retrait' ? 'Demande de retrait — annuaire' : 'Signalement d\'erreur — annuaire');
  return `<form class="report-form" id="${id}" data-establishment-id="${esc(establishmentId)}" data-type="${type}" data-lang="${lang}" method="post" enctype="text/plain" action="mailto:contact@shoofly.ma?subject=${encodeURIComponent(subject)}">
<input type="hidden" name="establishment_id" value="${esc(establishmentId)}">
<input type="hidden" name="type" value="${type}">
<textarea name="message" placeholder="${esc(placeholders.msg)}" required></textarea>
<input type="email" name="contact_email" placeholder="${esc(placeholders.email)}">
<button type="submit">${esc(placeholders.send)}</button>
</form>`;
}
function faqBlock(lang, items) {
  return `<dl class="faq">${items.map((it) => `<dt>${esc(it.q)}</dt><dd>${it.r}</dd>`).join('')}</dl>`;
}
// Fiche établissement (refonte 2026-10-05) : questions visibles, réponses repliées. Mêmes textes que
// faqBlock (le JSON-LD FAQPage est construit à partir des mêmes items, inchangé).
function faqDetails(items) {
  return `<div class="faq-list">${items.map((it) => `<details class="faq-item"><summary>${esc(it.q)}</summary><p>${it.r}</p></details>`).join('')}</div>`;
}
// Bouton principal unique de la fiche (sticky en bas sur mobile, voir CSS main.fiche).
function ficheCta(lang, missionHref) {
  return `<div class="fiche-cta"><a class="btn-cta" href="${esc(missionHref)}">${esc(T.FICHE[lang].cta)}</a></div>`;
}
// Bloc « Comment ça marche ? » replié : texte Shoofly sans bouton (le CTA unique est en haut de page).
function ficheHow(lang, domain) {
  const b = T.BLOC_SHOOFLY[lang];
  const t = domain === 'sante' ? T.OEIL_PEUT_SANTE : T.OEIL_PEUT_ADMIN;
  return `<details class="fiche-how"><summary>${esc(T.FICHE[lang].how)}</summary><div class="fiche-how-body"><h3>${esc(b.titre)}</h3><p>${esc(b.corps)}</p><p class="tagline">${esc(b.tagline)}</p><p>${esc(t[lang])}</p></div></details>`;
}
// Icônes SVG inline (aucune bibliothèque), décoratives : aria-hidden.
const ICONS = {
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  nav: '<path d="M3 11l19-9-9 19-2-8-8-2z"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/>',
  map: '<path d="M1 6l7-3 8 3 7-3v15l-7 3-8-3-7 3z"/><path d="M8 3v15M16 6v15"/>',
};
function ficheRow(icon, label, valueHtml) {
  return `<div class="fiche-row"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[icon]}</svg><div>${label ? `<span class="lbl">${esc(label)}</span>` : ''}${valueHtml}</div></div>`;
}
function jsonLdFaq(items) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((it) => ({ '@type': 'Question', name: it.q, acceptedAnswer: { '@type': 'Answer', text: it.rPlain } })) };
}
function jsonLdBreadcrumb(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })) };
}
function jsonLdShooflyService() {
  return {
    '@context': 'https://schema.org', '@type': 'Service', serviceType: "Service d'attente",
    provider: { '@type': 'Organization', name: 'Shoofly', url: SITE_URL },
    areaServed: ['Rabat', 'Salé', 'Témara'],
  };
}
// Chantier sous-catégorie annuaire (2026-10-02), correspondance validée par BOSS. Dette technique
// ASSUMÉE (même patron que backend/src/constants/missionCategories.js) : copie manuelle du contenu
// de CATEGORIES.file_attente (NewMissionModal.jsx, shoofly-react) — ce script Node ne peut pas
// importer un fichier JSX. `sub(groupe, item)` valide IMMÉDIATEMENT (dès le chargement de ce
// module, donc dès le début du build) que chaque couple existe réellement dans la liste ci-dessous
// — si NewMissionModal.jsx change un libellé sans répercuter ici, le build échoue tout de suite
// avec le nom exact de la sous-catégorie fautive, plutôt qu'un lien silencieusement cassé en prod.
const FILE_ATTENTE_GROUPS = [
  { label: 'Véhicules & Transport', items: ['Centre de visite technique', 'Autre'] },
  { label: 'Centres de santé', items: ['Hôpital & clinique', 'Cabinet de spécialiste', 'Laboratoire', 'Autre'] },
  { label: 'Administrations', items: ['CNSS', 'ANCFCC', "Services d'état civil", 'Tribunal', "Centre d'immatriculation", 'Préfectures / Annexes administratives', 'Douane', 'Bureau des passeports / Cartes nationales', 'Adoul / Notaires', "CRI / Centres régionaux d'investissement", 'Impôts (DGI)', 'Autre'] },
  { label: 'Services publics', items: ['ONEE', 'REDAL', 'RADEEMA', 'Autre'] },
  { label: 'Consulats et visas', items: ['Consulat étranger', 'Centre de visas', 'Autre'] },
  { label: 'Banques', items: ['Attijariwafa', 'CIH Bank', 'Banque Populaire', 'BMCE', 'BMCI', 'Al Barid Bank', 'Autre'] },
  { label: 'Éducation', items: ['Inscription universitaire', 'École privée', 'Bourse & dossier étudiant', 'Autre'] },
  { label: 'Autre', items: ['À préciser'] },
];
const FILE_ATTENTE_SUBCATEGORIES = new Set(
  FILE_ATTENTE_GROUPS.flatMap((g) => g.items.map((item) => `${g.label} — ${item}`))
);
function sub(group, item) {
  const value = `${group} — ${item}`;
  if (!FILE_ATTENTE_SUBCATEGORIES.has(value)) {
    throw new Error(`lib.cjs: sous-catégorie inconnue "${value}" — vérifier FILE_ATTENTE_GROUPS ici vs CATEGORIES.file_attente dans NewMissionModal.jsx`);
  }
  return value;
}

// Correspondance catégorie annuaire -> sous-catégorie mission, validée par BOSS (2026-10-02).
// Catégories volontairement ABSENTES de cette table (aucune pré-sélection, le client choisit
// lui-même) : medecines_douces, autres_sante, barid (poste ≠ banque malgré "Al Barid Bank"),
// autres_administrations (non publiée de toute façon), urgences (pas de bouton mission du tout,
// géré séparément par isUrgence dans generate.cjs — jamais d'appel à missionHref pour ces fiches).
const DIRECTORY_CATEGORY_TO_SUBCATEGORY = {
  hopitaux: sub('Centres de santé', 'Hôpital & clinique'),
  cliniques: sub('Centres de santé', 'Hôpital & clinique'),
  laboratoires: sub('Centres de santé', 'Laboratoire'),
  dentistes: sub('Centres de santé', 'Cabinet de spécialiste'),
  kinesitherapie: sub('Centres de santé', 'Cabinet de spécialiste'),
  radiologie: sub('Centres de santé', 'Cabinet de spécialiste'),
  ophtalmologie: sub('Centres de santé', 'Cabinet de spécialiste'),
  gynecologie: sub('Centres de santé', 'Cabinet de spécialiste'),
  pediatrie: sub('Centres de santé', 'Cabinet de spécialiste'),
  sante_mentale: sub('Centres de santé', 'Cabinet de spécialiste'),
  specialites_medicales: sub('Centres de santé', 'Cabinet de spécialiste'),
  medecine_generale: sub('Centres de santé', 'Autre'),
  centres_sante_publics: sub('Centres de santé', 'Autre'),
  cnss: sub('Administrations', 'CNSS'),
  conservation_fonciere: sub('Administrations', 'ANCFCC'),
  impots: sub('Administrations', 'Impôts (DGI)'),
  prefecture: sub('Administrations', 'Préfectures / Annexes administratives'),
  arrondissement_etat_civil: sub('Administrations', "Services d'état civil"),
  tribunal: sub('Administrations', 'Tribunal'),
  commissariat: sub('Administrations', 'Bureau des passeports / Cartes nationales'),
  eau_electricite: sub('Services publics', 'Autre'),
  visite_technique: sub('Véhicules & Transport', 'Centre de visite technique'),
  // 'banque' n'est PAS ici : résolue dynamiquement par détection de mot-clé, voir detectBankSubcategory.
};

// 'banque' agrège toutes les enseignes — la sous-catégorie exacte se déduit du NOM de
// l'établissement (seule donnée disponible), par mot-clé insensible à la casse et aux accents
// (normalizeCore, déjà utilisé pour les slugs). Ordre de la liste = ordre de priorité de
// correspondance ; première qui matche gagne. Aucune marque reconnue => "Banques — Autre".
const BANK_NAME_KEYWORDS = [
  { re: /attijariwafa/, item: 'Attijariwafa' },
  { re: /\bcih\b/, item: 'CIH Bank' },
  { re: /banque populaire|chaabi/, item: 'Banque Populaire' },
  { re: /\bbmce\b|bank of africa/, item: 'BMCE' },
  { re: /\bbmci\b/, item: 'BMCI' },
  { re: /barid/, item: 'Al Barid Bank' }, // catégorie 'banque' uniquement : jamais la poste (catégorie séparée 'barid')
];
function detectBankSubcategory(name) {
  const normalized = normalizeCore(name);
  for (const { re, item } of BANK_NAME_KEYWORDS) if (re.test(normalized)) return sub('Banques', item);
  return sub('Banques', 'Autre');
}

function resolvePrefillSubcategory(est) {
  if (est.category_id === 'banque') return detectBankSubcategory(est.name);
  return DIRECTORY_CATEGORY_TO_SUBCATEGORY[est.category_id] || null;
}

function missionHref(est) {
  // Chantier annuaire SEO, Phase 4 (2026-09-30), décision #4 — mécanisme réel maintenant en place :
  // NewMissionModal.jsx accepte `prefill`, ClientDashboard.jsx lit ces paramètres sur /client, et
  // RequireAuth (App.jsx) préserve cette destination via /login?redirect=... si le visiteur n'est
  // pas connecté (connexion/inscription puis retour automatique, sans perte du lieu). Toujours vers
  // /client : un Œil/admin déjà connecté qui clique est renvoyé vers SON propre tableau de bord par
  // RequireAuth (roleDenied), sans y arriver — comportement proposé et déjà en place nativement,
  // pas de code spécifique ajouté pour ce cas (voir RAPPORT_PHASE4.md).
  const params = new URLSearchParams({ newMission: '1' });
  if (est) {
    if (est.name) params.set('prefill_title', est.name);
    if (est.address) params.set('prefill_address', est.address);
    if (est.lat) params.set('prefill_lat', est.lat);
    if (est.lng) params.set('prefill_lng', est.lng);
    if (est.city) params.set('prefill_city', est.city);
    if (est.neighborhood && est.neighborhood.name_fr) params.set('prefill_quartier', est.neighborhood.name_fr);
    // Chantier sous-catégorie (2026-10-02) : jamais appelé pour une fiche urgence (isUrgence court-
    // circuite blocShoofly dans generate.cjs), donc pas de garde explicite ici pour ce cas.
    const prefillSubcategory = resolvePrefillSubcategory(est);
    if (prefillSubcategory) params.set('prefill_subcategory', prefillSubcategory);
  }
  return `/client?${params.toString()}`;
}

module.exports = {
  esc, normalizeCore, slugify, categorySlug, haversineMeters, normalizeWebsite, writeFile, loadData, htmlShell,
  blocShoofly, oeilPeut, nonAffiliationBlock, signalementLinks, faqBlock, faqDetails, ficheCta, ficheHow, ficheRow, jsonLdFaq, jsonLdBreadcrumb,
  jsonLdShooflyService, missionHref, CITY_SLUGS, CITY_BY_SLUG, MIN_FOR_PAGE, SITE_URL, CONTENT, PUBLIC_DIR,
  DATA_DIR, writeDataFile, FILE_ATTENTE_SUBCATEGORIES, DIRECTORY_CATEGORY_TO_SUBCATEGORY,
  detectBankSubcategory, resolvePrefillSubcategory,
};
