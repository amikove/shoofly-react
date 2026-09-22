// PW-1 (audit perf/résilience 2026-09-19/21) — aucune compression/redimensionnement côté
// navigateur n'existait avant ce fichier (grep exhaustif du projet : ni canvas, ni toBlob, ni
// createImageBitmap ailleurs) : sur un réseau 3G moyen (≈1 Mbps ⇒ ~1,9 Mo envoyables en 15s,
// le timeout global d'api/client.js), un rapport de mission exige ≥10 photos et une photo brute
// pèse couramment 3-5 Mo — l'envoi échoue systématiquement. Compressé (~0,3-0,5 Mo/photo), le
// lot entier tient largement dans ce budget. Paramètres alignés sur la convention SERVEUR déjà
// en place (Cloudinary recadre déjà à 1200px après réception, routes/media.js) : 1600px suffit
// très largement à la preuve de mission (lisibilité d'un document/lieu, pas de la photographie
// d'art) tout en restant au-dessus de ce que le serveur retaillera de toute façon.

const MAX_DIMENSION_DEFAULT = 1600;
const QUALITY_DEFAULT = 0.7;

/**
 * Redimensionne (plus grand côté ≤ maxDimension) et réencode en JPEG (qualité ~0.7) une image
 * AVANT son envoi. Ne touche JAMAIS un fichier non-image (retourné tel quel — ce module ne gère
 * aucun cas vidéo, sans objet ici). Si la compression échoue pour QUELQUE raison que ce soit
 * (format non décodable par ce navigateur — ex. HEIC brut sur Chrome/Firefox desktop, quasi
 * toujours décodable nativement sur iOS/Safari où il est produit —, fichier corrompu, mémoire
 * insuffisante...) ou si le résultat compressé serait plus LOURD que l'original (petit fichier
 * déjà optimisé), retourne l'ORIGINAL inchangé : au pire, comportement strictement identique à
 * avant ce correctif pour ce fichier précis — jamais un envoi bloqué à cause de la compression.
 * @param {File} file
 * @param {{maxDimension?: number, quality?: number}} [opts]
 * @returns {Promise<File>}
 */
export async function compressImageIfPossible(file, opts = {}) {
  const maxDimension = opts.maxDimension ?? MAX_DIMENSION_DEFAULT;
  const quality = opts.quality ?? QUALITY_DEFAULT;

  if (!file.type || !file.type.startsWith('image/')) return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // format non décodable par ce navigateur — on envoie l'original tel quel
  }

  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^./\\]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    bitmap.close?.();
  }
}
