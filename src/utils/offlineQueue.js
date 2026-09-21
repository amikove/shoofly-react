// File locale minimale d'actions terrain hors-ligne (PW-5, audit perf/concurrence 2026-09-19).
//
// Contexte : un Œil qui perd le réseau en pleine mission (zone blanche, sous-sol) déclenche une action
// (confirmer sa présence, confirmer sa disponibilité comme candidat) qui échouait avec une simple erreur.
// Ici, l'action est mise en attente dans le navigateur (localStorage) et REJOUÉE automatiquement au retour
// du réseau (événement `online`, relance périodique, prochain lancement de l'app).
//
// PÉRIMÈTRE STRICT — sécurité avant tout. Seules les actions listées dans QUEUEABLE_ACTIONS peuvent entrer
// dans la file : c'est une liste blanche STRUCTURELLE (enqueue() refuse tout autre type), pas une
// convention. Critère d'entrée : rejouer la même requête deux fois ne doit produire AUCUN doublon côté
// serveur (mécanisme vérifié dans le code backend, voir chaque entrée ci-dessous). En sont volontairement
// exclus : envoi de messages, création de tickets, uploads (non protégés contre le doublon — ID-2 de l'audit),
// ainsi que POST /:id/seen (rejeu tardif = seen_at posé à NOW() côté serveur : marquerait « lus » des
// messages reçus pendant la coupure) et push/subscribe (déjà relancé à chaque montage de l'app avec
// l'abonnement navigateur FRAIS ; un instantané mis en file pourrait être périmé).
//
// Le serveur reste seul juge : au rejeu, une action devenue sans objet (mission réattribuée, annulée,
// échéance dépassée…) est refusée par une réponse claire (403/404/409…) → l'action est RETIRÉE de la file
// et l'Œil est informé ; on ne boucle jamais dessus.
//
// Fabrique pure (toutes les dépendances injectées) : testable sous Node contre le vrai backend, sans
// navigateur. Le câblage réel (localStorage, axios, navigator) est dans offlineQueueInstance.js.

export const QUEUEABLE_ACTIONS = {
  // POST /api/missions/:id/confirm-presence — routes/missions.js. Idempotent par construction :
  //   UPDATE missions SET presence_confirmed_at = COALESCE(presence_confirmed_at, NOW())
  //   WHERE id=$1 AND oeil_id=$2 → un rejeu conserve l'horodatage d'origine ; la garde oeil_id=$2 rejette
  //   proprement (403/409) un Œil qui n'est plus (ou n'est pas) l'assigné (réattribution entre-temps).
  'confirm-presence': { path: (missionId) => `/api/missions/${missionId}/confirm-presence` },
  // POST /api/missions/:id/candidate-confirm — routes/missions.js. Rejeu séquentiel court-circuité :
  //   confirmed_at déjà posé → 200 {already_confirmed:true} sans écriture ; états invalides rejetés
  //   (409 annulée / déjà attribuée, 403 plus sollicité). Aucune ligne créée, aucun effet dupliqué.
  'candidate-confirm': { path: (missionId) => `/api/missions/${missionId}/candidate-confirm` },
}

const STORAGE_KEY = 'shoofly_offline_queue_v1'
const LOCK_NAME = 'shoofly-offline-queue'
const EMPTY = Object.freeze({ items: Object.freeze([]), count: 0 })

// Erreur RÉSEAU (coupure, DNS, timeout axios) = requête sans réponse HTTP. Même critère que
// AuthContext.jsx et pages/oeil/Missions.jsx (`!err.response`), restreint aux erreurs axios non annulées :
// une erreur de programmation levée avant l'envoi ne doit jamais être prise pour une coupure réseau.
export function isNetworkError(err) {
  return Boolean(err && err.isAxiosError && !err.response && err.code !== 'ERR_CANCELED')
}

export function createOfflineQueue({
  storage,                       // { getItem, setItem } — localStorage ; peut lever (mode privé, quota)
  send,                          // async (path) => réponse ; doit LEVER l'erreur axios telle quelle
  getUserId,                     // () => string | null — utilisateur courant
  isOnline = () => true,
  now = () => Date.now(),
  newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
  locks = null,                  // navigator.locks (Web Locks) — exclusivité entre onglets si disponible
  storageKey = STORAGE_KEY,
  maxAttempts = 3,               // réponses 5xx/429 successives avant abandon
  maxAgeMs = 24 * 3600 * 1000,   // une action plus vieille est abandonnée (le contexte terrain a changé)
  minAgeMs = 2000,               // pas de rejeu avant 2 s (évite de doubler une requête encore en vol)
  retryEveryMs = 15000,
} = {}) {
  const listeners = new Set()
  let flushing = false
  let started = false
  let snapshot = { raw: null, uid: null, value: EMPTY }

  // ── stockage ───────────────────────────────────────────────────────────────────────────────────
  function readRaw() {
    try { return storage.getItem(storageKey) } catch { return null }
  }
  function parse(raw) {
    if (!raw) return []
    try {
      const data = JSON.parse(raw)
      return data && data.v === 1 && Array.isArray(data.items) ? data.items : []
    } catch { return [] } // stockage corrompu : on repart d'une file vide plutôt que de planter l'app
  }
  const readItems = () => parse(readRaw())
  function writeItems(items) {
    try {
      storage.setItem(storageKey, JSON.stringify({ v: 1, items }))
      return true
    } catch { return false }
  }
  function emit(event) {
    for (const l of [...listeners]) {
      try { l(event) } catch { /* un abonné défaillant ne doit jamais bloquer la file */ }
    }
  }

  // ── lecture réactive (useSyncExternalStore) : référence STABLE tant que rien n'a changé ─────────────
  function getSnapshot() {
    const raw = readRaw()
    const uid = getUserId() || null
    if (raw === snapshot.raw && uid === snapshot.uid) return snapshot.value
    const items = parse(raw).filter((i) => i.userId === uid)
    snapshot = { raw, uid, value: items.length ? { items: Object.freeze(items), count: items.length } : EMPTY }
    return snapshot.value
  }
  function subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function isQueued(type, missionId) {
    return getSnapshot().items.some((i) => i.type === type && i.missionId === missionId)
  }

  // ── mise en file ───────────────────────────────────────────────────────────────────────────────
  function enqueue(type, missionId) {
    if (!Object.prototype.hasOwnProperty.call(QUEUEABLE_ACTIONS, type)) return { queued: false, reason: 'unsupported' }
    const userId = getUserId()
    if (!userId || !missionId) return { queued: false, reason: 'invalid' }
    const items = readItems()
    const existing = items.find((i) => i.userId === userId && i.type === type && i.missionId === missionId)
    if (existing) return { queued: true, duplicate: true, item: existing } // déjà en attente : jamais deux fois
    const item = { id: newId(), type, missionId, userId, createdAt: now(), attempts: 0 }
    if (!writeItems([...items, item])) return { queued: false, reason: 'storage' }
    emit({ type: 'changed' })
    return { queued: true, item }
  }

  // ── rejeu ──────────────────────────────────────────────────────────────────────────────────────
  // Séquentiel, FIFO. Coupure réseau / 401 / réponse transitoire → on s'ARRÊTE (le reste attend le prochain
  // déclencheur). Réponse définitive (autre 4xx) → l'action est retirée, l'Œil informé, on continue.
  async function run() {
    const results = []
    const uid = getUserId()
    // Ménage : toute action périmée (tous utilisateurs) est abandonnée.
    const all = readItems()
    const fresh = all.filter((i) => now() - i.createdAt <= maxAgeMs)
    if (fresh.length !== all.length) {
      writeItems(fresh)
      for (const i of all.filter((x) => !fresh.includes(x))) {
        if (i.userId === uid) { const r = { outcome: 'expired', item: i }; results.push(r); emit({ type: 'processed', ...r }) }
      }
      emit({ type: 'changed' })
    }
    if (!uid) return results

    const handled = new Set()
    while (isOnline() && getUserId() === uid) {
      // File relue à chaque tour : un autre onglet a pu la modifier entre-temps.
      const item = readItems().filter((i) => i.userId === uid).sort((a, b) => a.createdAt - b.createdAt)[0]
      // Élément déjà traité dans CE passage = retrait impossible (stockage en échec) : on s'arrête plutôt
      // que de renvoyer la même requête en boucle.
      if (!item || handled.has(item.id)) break
      if (now() - item.createdAt < minAgeMs) break
      handled.add(item.id)
      const spec = QUEUEABLE_ACTIONS[item.type]
      const remove = () => writeItems(readItems().filter((i) => i.id !== item.id))
      if (!spec) { remove(); emit({ type: 'changed' }); continue } // type inconnu (donnée périmée) : jamais rejoué

      try {
        const res = await send(spec.path(item.missionId))
        remove()
        const r = { outcome: 'sent', item, data: res && res.data }
        results.push(r); emit({ type: 'changed' }); emit({ type: 'processed', ...r })
      } catch (err) {
        if (isNetworkError(err)) break // toujours hors-ligne : on garde tout, on retentera
        const status = err && err.response && err.response.status
        if (status === 401) break // session à renouveler : on garde tout (l'intercepteur axios gère la redirection)
        if (status === 429 || status >= 500) {
          const attempts = (item.attempts || 0) + 1
          if (attempts >= maxAttempts) {
            remove()
            const r = { outcome: 'failed', item, status }
            results.push(r); emit({ type: 'changed' }); emit({ type: 'processed', ...r })
            continue
          }
          writeItems(readItems().map((i) => (i.id === item.id ? { ...i, attempts } : i)))
          emit({ type: 'changed' })
          break // réponse transitoire : on retentera plus tard
        }
        // 4xx définitif (403/404/409/…) : le serveur a tranché — action retirée, jamais rejouée en boucle.
        remove()
        const message = err && err.response && err.response.data && err.response.data.error
        const r = { outcome: 'rejected', item, status, message: typeof message === 'string' ? message : null }
        results.push(r); emit({ type: 'changed' }); emit({ type: 'processed', ...r })
      }
    }
    return results
  }

  async function flush() {
    if (flushing) return { skipped: 'busy', results: [] }
    if (!readItems().length) return { skipped: 'empty', results: [] }
    flushing = true
    try {
      if (locks && typeof locks.request === 'function') {
        // Un seul onglet rejoue à la fois (les autres passent leur tour : ifAvailable). Le serveur étant
        // idempotent, le pire cas sans Web Locks (2 onglets) reste sans doublon — mais avec 2 toasts.
        return await locks.request(LOCK_NAME, { ifAvailable: true }, async (lock) => (lock ? { results: await run() } : { skipped: 'other-tab', results: [] }))
      }
      return { results: await run() }
    } finally {
      flushing = false
    }
  }

  // ── déclencheurs de rejeu ──────────────────────────────────────────────────────────────────────
  // `online` (comme AuthContext / oeil/Missions), relance périodique tant que la file n'est pas vide
  // (en zone de couverture faible `navigator.onLine` peut rester `true` sans qu'aucune requête n'aboutisse
  // — même constat que AuthContext.jsx), et une tentative au lancement de l'app.
  function start(win = typeof window !== 'undefined' ? window : null) {
    if (started || !win) return () => {}
    started = true
    const onOnline = () => { flush() }
    const onStorage = (e) => { if (!e || e.key === storageKey || e.key === null) emit({ type: 'changed' }) }
    win.addEventListener('online', onOnline)
    win.addEventListener('storage', onStorage)
    const timer = setInterval(() => { if (getSnapshot().count > 0) flush() }, retryEveryMs)
    flush()
    return () => {
      started = false
      win.removeEventListener('online', onOnline)
      win.removeEventListener('storage', onStorage)
      clearInterval(timer)
    }
  }

  return { enqueue, flush, start, subscribe, getSnapshot, isQueued, isNetworkError }
}
