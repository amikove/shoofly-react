// Chantier SEO annuaire — Phase 3 (2026-09-30). TOUS les textes fixes de ce fichier sont recopiés
// MOT POUR MOT depuis seo-study/MODELES_TEXTES_SEO.md (source unique validée par BOSS — voir §0
// règle 0 du .md). Ne JAMAIS reformuler ici : si un texte doit changer, éditer le .md d'abord.
// Les seules parties générées sont les variables ({nom}, {ville}, {nb}...), substituées par
// generate.js — jamais du texte de marque nouveau.

const BLOC_SHOOFLY = {
  fr: {
    titre: 'Ne faites plus la queue.',
    corps: "Avec Shoofly, un Œil — un agent vérifié — se rend sur place et attend à votre place. Il vous prévient quand votre tour approche, pour que vous n'arriviez qu'au bon moment.",
    tagline: 'Nous attendons. Vous vivez.',
    bouton: 'Créer une mission',
  },
  ar: {
    titre: 'لا تنتظر في الطابور بعد اليوم.',
    corps: 'مع شووفلي، تتوجه عين شووفلي — وكيل موثَّق — إلى المكان وتنتظر بدلاً منك، ثم تنبّهك عندما يقترب دورك لتصل في الوقت المناسب فقط.',
    tagline: 'نحن ننتظر. وأنتم تعيشون.',
    bouton: 'أنشئ مهمة',
  },
};

const OEIL_PEUT_SANTE = {
  fr: "Selon les règles de l'établissement, l'Œil peut garder votre place ou prendre un ticket. La consultation ou l'analyse elle-même nécessite votre présence : l'Œil vous prévient à temps pour que vous preniez le relais.",
  ar: 'حسب قواعد المؤسسة، يمكن لعين شووفلي أن تحتفظ بمكانك أو تأخذ لك رقماً. أما الفحص أو التحليل نفسه فيتطلب حضورك شخصياً، لذلك تنبّهك في الوقت المناسب لتأخذ مكانها.',
};

const OEIL_PEUT_ADMIN = {
  fr: 'L\'Œil fait la file ou prend un ticket pour vous. Certaines démarches exigent votre présence ou vos documents originaux : l\'Œil vous prévient quand votre tour approche.',
  ar: 'تقف عين شووفلي في الطابور أو تأخذ لك رقماً. بعض الإجراءات تتطلب حضورك أو وثائقك الأصلية، لذلك تنبّهك عندما يقترب دورك.',
};

function nonAffiliation(nom) {
  return {
    fr: `Shoofly n'est pas affilié à ${nom}. Les informations proviennent de sources ouvertes et peuvent être incomplètes.`,
    ar: `شووفلي غير مرتبط بـ ${nom}. المعلومات مأخوذة من مصادر مفتوحة وقد تكون غير مكتملة.`,
  };
}
const NON_AFFILIATION_LISTE = {
  fr: "Shoofly n'est affilié à aucun des établissements listés.",
  ar: 'شووفلي غير مرتبط بأي من المؤسسات المذكورة.',
};

const LIENS_SIGNALEMENT = {
  fr: { erreur: 'Signaler une erreur', retrait: 'Vous êtes cet établissement ? Demander le retrait' },
  ar: { erreur: 'الإبلاغ عن خطأ', retrait: 'هل أنتم هذه المؤسسة؟ اطلبوا الحذف' },
};

// "· Source : NARSA" ajouté au texte du .md (Phase 4, décision #6 — explicitement demandé, pas une
// improvisation : le §1.6 de MODELES_TEXTES_SEO.md ne pouvait pas encore lister NARSA, source
// intégrée seulement dans ce chantier).
const FOOTER_ATTRIBUTION = {
  fr: 'Données : © OpenStreetMap contributors · Source : data.gov.ma — Ministère de la Transition Numérique et de la Réforme de l\'Administration · Overture Maps Foundation · Foursquare Open Source Places (licence Apache 2.0) · Source : NARSA (centres de visite technique).',
  ar: 'البيانات: © OpenStreetMap contributors · المصدر: data.gov.ma — وزارة الانتقال الرقمي وإصلاح الإدارة · Overture Maps Foundation · Foursquare Open Source Places (رخصة Apache 2.0) · المصدر: نارسا (مراكز الفحص التقني).',
};

const URGENCES_BANDEAU = {
  fr: { fort: 'En cas d\'urgence médicale, appelez immédiatement les secours.', suite: 'SAMU : 141 · Protection civile : 150 · Police : 19.' },
  ar: { fort: 'في حالة الطوارئ الطبية، اتصل فوراً بالإسعاف.', suite: 'الإسعاف الطبي: 141 · الوقاية المدنية: 150 · الشرطة: 19.' },
};

const FAQ_GENERALE = [
  { fr: { q: 'Qu\'est-ce qu\'un Œil Shoofly ?', r: 'Un agent vérifié qui se rend sur place et attend à votre place, puis vous prévient quand votre tour approche.' },
    ar: { q: 'ما هي عين شووفلي؟', r: 'وكيل موثَّق يتوجه إلى المكان وينتظر بدلاً منك، ثم ينبّهك عندما يقترب دورك.' } },
  { fr: { q: 'Faut-il installer une application ?', r: 'Non. Shoofly s\'utilise depuis le navigateur ; vous pouvez ajouter un raccourci sur votre écran d\'accueil. Aucune installation nécessaire.' },
    ar: { q: 'هل يجب تثبيت تطبيق؟', r: 'لا. يُستخدم شووفلي من المتصفح، ويمكنك إضافة اختصار إلى شاشتك الرئيسية. لا حاجة لأي تثبيت.' } },
  { fr: { q: 'Comment se passe le paiement ?', r: 'Le paiement se fait en espèces, selon un accord direct entre vous et l\'Œil. Nous recommandons de verser un acompte avant la mission et le complément à la fin.' },
    ar: { q: 'كيف يتم الدفع؟', r: 'يتم الدفع نقداً، حسب اتفاق مباشر بينك وبين عين شووفلي. ننصح بدفع تسبيق قبل المهمة والباقي عند نهايتها.' } },
  { fr: { q: 'Shoofly est-il partenaire de ces établissements ?', r: 'Non. Shoofly est un service indépendant d\'attente ; il n\'est affilié à aucun établissement listé.' },
    ar: { q: 'هل شووفلي شريك لهذه المؤسسات؟', r: 'لا. شووفلي خدمة انتظار مستقلة وغير مرتبطة بأي مؤسسة مذكورة.' } },
];

// Page d'entrée /etablissements (+ /ar/etablissements). H1 et intro : textes validés, recopiés tels
// quels. Le titre et la meta description ne sont pas dans le .md : ils reprennent le H1 et l'intro.
const ENTREE_ANNUAIRE = {
  fr: {
    title: "Annuaire des lieux où l'on attend | Shoofly",
    h1: "Annuaire des lieux où l'on attend",
    intro: "Laboratoires, hôpitaux, CNSS, arrondissements… Trouvez l'établissement, et confiez l'attente à un Œil Shoofly.",
    villes: 'Villes',
    phares: 'Catégories phares',
    accueil: 'Accueil',
    annuaire: 'Annuaire',
  },
  ar: {
    title: 'دليل أماكن الانتظار | شووفلي',
    h1: 'دليل أماكن الانتظار',
    intro: 'مختبرات، مستشفيات، الضمان الاجتماعي، المقاطعات… اعثر على المؤسسة، ودع عين شووفلي تنتظر بدلاً منك.',
    villes: 'المدن',
    phares: 'فئات رئيسية',
    accueil: 'الرئيسية',
    annuaire: 'الدليل',
  },
};

// Bloc noscript de index.html (accueil SANS JavaScript, pour les robots d'IA et les navigateurs sans
// JS). Même contenu que la section React « Où voulez-vous qu'on attende pour vous ? » — FR uniquement :
// la page d'accueil est une SPA dont la langue se choisit côté client.
const ACCUEIL_NOSCRIPT = {
  fr: {
    titre: "Où voulez-vous qu'on attende pour vous ?",
    villes: 'Annuaire par ville',
    phares: 'Catégories phares à',
    pied: 'Annuaire des établissements',
  },
  ar: {
    titre: 'أين تريد أن ننتظر بدلاً منك؟',
    villes: 'الدليل حسب المدينة',
    phares: 'فئات رئيسية في',
    pied: 'دليل المؤسسات',
  },
};

// Page de redirection d'une fiche retirée / non publiée. AUCUNE donnée de la fiche (ni nom, ni adresse) :
// le texte est générique et le seul rôle de la page est la redirection vers la cible (voir generate.cjs).
const REDIRECTION_RETIREE = {
  fr: { titre: 'Redirection — Shoofly', lien: 'Cette fiche n’est plus disponible. Voir les établissements similaires.' },
  ar: { titre: 'تحويل — شووفلي', lien: 'لم تعد هذه البطاقة متاحة. اطلع على المؤسسات المشابهة.' },
};

// Fiche établissement — libellés d'interface de la refonte de mise en page (demande BOSS, 2026-10-05).
// CTA et libellés AR repris tels que donnés par BOSS ; les autres libellés ne sont PAS dans le .md
// (à valider par BOSS). Aucun texte de contenu (FAQ, mentions, signalement) n'est touché ici.
const FICHE = {
  fr: { cta: 'Un Œil attend pour moi', how: 'Comment ça marche ?', attente: 'Attente souvent', itineraire: 'Itinéraire', adresse: 'Adresse', tel: 'Téléphone', site: 'Site web', carte: 'Voir sur la carte', proches: 'À proximité' },
  ar: { cta: 'عين شووفلي تنتظر بدلاً مني', how: 'كيف يعمل؟', attente: 'الانتظار غالباً', itineraire: 'الاتجاهات', adresse: 'العنوان', tel: 'الهاتف', site: 'الموقع الإلكتروني', carte: 'عرض على الخريطة', proches: 'بالقرب منك' },
};

module.exports = {
  BLOC_SHOOFLY, OEIL_PEUT_SANTE, OEIL_PEUT_ADMIN, nonAffiliation, NON_AFFILIATION_LISTE,
  LIENS_SIGNALEMENT, FOOTER_ATTRIBUTION, URGENCES_BANDEAU, FAQ_GENERALE, ENTREE_ANNUAIRE, ACCUEIL_NOSCRIPT,
  REDIRECTION_RETIREE, FICHE,
};
