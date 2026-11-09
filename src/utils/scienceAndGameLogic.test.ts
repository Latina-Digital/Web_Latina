import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProceduralConformerAtoms,
  classifyPlddtConfidence,
  computeSequencePlddtSummary,
  evaluateChemicalFormulationRules,
  generateProceduralWavBase64,
  GEMINI_CHAT_MODELS,
  parsePdbOrCifAtoms,
} from './scienceAndMultimodalLogic';
import {
  applyPlayerHazardImpact,
  buildRunSnapshot,
  clampSimulationDt,
  createInitialGameSimulationState,
  createInitialHazards,
  createInitialPallets,
  evaluatePalletPickup,
  stepHazardBehavior,
} from './industrial3dGameRules';

test('evaluateChemicalFormulationRules evaluates Lipinski Rule of 5 and Veber criteria accurately', () => {
  const octhilinone = evaluateChemicalFormulationRules({
    molecularWeight: 213.34,
    xlogp: 2.4,
    hBondDonorCount: 0,
    hBondAcceptorCount: 3,
    rotatableBondCount: 7,
    tpsa: 53.9,
  });
  assert.equal(octhilinone.passesLipinski, true);
  assert.equal(octhilinone.passesVeber, true);
  assert.equal(octhilinone.lipinskiViolations, 0);
  assert.equal(octhilinone.stabilityGrade, 'Óptima (Grado Industrial INEN)');
});

test('classifyPlddtConfidence maps scores to the 4 canonical AlphaFold DB color bands', () => {
  assert.equal(classifyPlddtConfidence(94.2).colorHex, '#0053D6');
  assert.equal(classifyPlddtConfidence(82.0).colorHex, '#65CBF3');
  assert.equal(classifyPlddtConfidence(61.5).colorHex, '#FFDB13');
  assert.equal(classifyPlddtConfidence(42.0).colorHex, '#FF7D45');
});

test('parsePdbOrCifAtoms and computeSequencePlddtSummary parse ATOM lines and compute pLDDT stats', () => {
  const samplePdb = [
    'ATOM      1  CA  ALA A   1      11.104  13.207   9.420  1.00 94.50           C',
    'ATOM      2  CA  GLY A   2      14.500  13.800  10.100  1.00 78.20           C',
    'ATOM      3  CA  SER A   3      17.900  14.200  11.000  1.00 44.00           C',
  ].join('\n');

  const atoms = parsePdbOrCifAtoms(samplePdb);
  assert.equal(atoms.length, 3);
  const summary = computeSequencePlddtSummary(atoms);
  assert.equal(summary.residueCount, 3);
  assert.ok(summary.meanPlddt > 70);
  assert.equal(summary.veryHighPct, 33.3);
  assert.equal(summary.confidentPct, 33.3);
  assert.equal(summary.veryLowPct, 33.3);
});

test('generateProceduralWavBase64 produces valid base64 RIFF WAVE audio and GEMINI_CHAT_MODELS includes required models', () => {
  const wavB64 = generateProceduralWavBase64({ durationSec: 0.6, chordMode: 'corporate_anthem' });
  const buf = Buffer.from(wavB64, 'base64');
  assert.equal(buf.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(buf.subarray(8, 12).toString('ascii'), 'WAVE');

  const modelIds = GEMINI_CHAT_MODELS.map((m) => m.id);
  assert.ok(modelIds.includes('gemini-4-argon'));
  assert.ok(modelIds.includes('gemini-3.8-flash'));
  assert.ok(modelIds.includes('gemini-3.1-flash-lite'));
});

test('3D game rules enforce clamped dt, 3 distinct hazard policies, pallet victory, and defeat snapshot', () => {
  assert.equal(clampSimulationDt(0.45), 0.05);
  assert.equal(clampSimulationDt(-1), 0);

  const state = createInitialGameSimulationState(1200, true);
  assert.equal(state.shellState, 'playing');

  const hazards = createInitialHazards();
  assert.equal(hazards.length, 3);
  const movedChaser = stepHazardBehavior(hazards[0], 0, 18, 0.04);
  const movedKiter = stepHazardBehavior(hazards[1], 0, 18, 0.04);
  const movedCharger = stepHazardBehavior(hazards[2], 0, -10, 0.04);
  assert.notEqual(movedChaser.x, hazards[0].x);
  assert.notEqual(movedKiter.x, hazards[1].x);
  assert.ok(movedCharger.windupTimer > 0); // Charger enters telegraph windup when player is within 14m

  const pallets = createInitialPallets();
  let cur = { ...state, playerX: pallets[0].x, playerZ: pallets[0].z, palletsCollected: 7 };
  const pickupRes = evaluatePalletPickup(cur, pallets[0]);
  assert.equal(pickupRes.collectedNow, true);
  assert.equal(pickupRes.state.shellState, 'gameover');
  assert.equal(pickupRes.state.outcome, 'victory');

  const snap = buildRunSnapshot(pickupRes.state);
  assert.equal(snap.outcome, 'victory');
  assert.equal(snap.palletsCollected, 8);

  // Test HP impact and defeat
  let lowHpState = { ...state, hp: 1, invulnerableTimer: 0 };
  lowHpState = applyPlayerHazardImpact(lowHpState);
  assert.equal(lowHpState.hp, 0);
  assert.equal(lowHpState.shellState, 'gameover');
  assert.equal(lowHpState.outcome, 'defeat');
});

test('buildProceduralConformerAtoms creates 3D conformer coordinates with valid pLDDT scores', () => {
  const conformer = buildProceduralConformerAtoms('AF-P04040', 48);
  assert.equal(conformer.length, 48);
  assert.ok(conformer.every((a) => Number.isFinite(a.x) && a.bFactor >= 38 && a.bFactor <= 99));
});
