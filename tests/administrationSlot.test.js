// Règle administrations côté formulaire (src/utils/administrationSlot.js). Le serveur reste l'autorité.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { administrationSlotProblem } from '../src/utils/administrationSlot.js'

const MON = '2026-10-05' // lundi
const SAT = '2026-10-10' // samedi
const SUN = '2026-10-11' // dimanche

test('16 h 59 un jour de semaine : accepté', () => {
  assert.equal(administrationSlotProblem(MON, '16:59', 17), null)
})

test('17 h 00 un jour de semaine : refusé', () => {
  assert.equal(administrationSlotProblem(MON, '17:00', 17), 'closed')
})

test('samedi refusé, même tôt le matin', () => {
  assert.equal(administrationSlotProblem(SAT, '10:00', 17), 'weekend')
})

test('dimanche refusé', () => {
  assert.equal(administrationSlotProblem(SUN, '09:00', 17), 'weekend')
})

test('réglage non par défaut (15 h) : 15 h 00 refusé, 14 h 59 accepté', () => {
  assert.equal(administrationSlotProblem(MON, '15:00', 15), 'closed')
  assert.equal(administrationSlotProblem(MON, '14:59', 15), null)
})

test('date ou heure absente : rien à signaler', () => {
  assert.equal(administrationSlotProblem('', '10:00', 17), null)
  assert.equal(administrationSlotProblem(MON, '', 17), null)
})
