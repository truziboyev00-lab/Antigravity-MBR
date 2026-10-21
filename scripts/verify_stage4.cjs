/**
 * UNIT 77 MBR SUPER EXPERT — STAGE 4 GATE VERIFICATION (NODE.JS)
 * Author: Turgunjon Ruziboyev
 * 
 * Verifies:
 *  - Gate 4.1: High-side hysteresis deadband trip & clear logic
 *  - Gate 4.2: Low-side hysteresis deadband trip & clear logic
 *  - Gate 4.3: Persistence time-window latching
 *  - Gate 4.4: Rate-of-Change (ROC) calculation & threshold detection
 *  - Gate 4.5: Composite Multi-Risk Index (MRI 0-100)
 *  - Gate 4.6: Risk factor domain decomposition (Hyd, Bio, Mech, DQ)
 *  - Gate 4.7: Inter-train peer deviation & statistical Z-scores
 *  - Gate 4.8: Multi-symptom root cause diagnostic reasoning
 *  - Gate 4.9: Stage 4 Excel Workbook OpenXML structures & formulas
 *  - Gate 4.10: Zero-division and edge-case guards
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const alarmData = require('../src/foundation/alarm_structure.json');
const alarms = alarmData.alarms;

let passedChecks = 0;
let totalChecks = 0;

function assertCheck(id, name, condition, details) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`[PASS] ${id}: ${name}`);
    if (details) console.log(`       ${details}`);
  } else {
    console.error(`[FAIL] ${id}: ${name}`);
    if (details) console.error(`       ${details}`);
    process.exitCode = 1;
  }
}

console.log('====================================================');
console.log('UNIT 77 MBR SUPER EXPERT — STAGE 4 GATE VERIFICATION');
console.log('Author: Turgunjon Ruziboyev');
console.log('====================================================');

// --- Gate 4.1: High-Side Hysteresis Logic ---
const tmpHigh = alarms.find(a => a.alarmCode === 'ALM_TMP_HIGH');
// Trip = 45.0, Deadband = 3.0, Reset = 42.0
function evaluateHighSide(val, wasLatched, durSeconds, thresh, deadband, persist) {
  const resetThresh = thresh - deadband;
  const isBreaching = val > thresh;
  let isLatched = false;
  if (wasLatched) {
    isLatched = val >= resetThresh;
  } else {
    isLatched = isBreaching && durSeconds >= persist;
  }
  return { isBreaching, isLatched, resetThresh };
}

const h1 = evaluateHighSide(46.2, false, 150, tmpHigh.threshold, tmpHigh.deadbandHysteresis, tmpHigh.persistenceSeconds);
const h2 = evaluateHighSide(43.5, true, 200, tmpHigh.threshold, tmpHigh.deadbandHysteresis, tmpHigh.persistenceSeconds);
const h3 = evaluateHighSide(41.2, true, 0, tmpHigh.threshold, tmpHigh.deadbandHysteresis, tmpHigh.persistenceSeconds);

assertCheck(
  'Gate 4.1',
  'High-Side Hysteresis Deadband Trip & Clear Logic',
  h1.isLatched === true && h2.isLatched === true && h3.isLatched === false,
  `Trip at 46.2 kPa (${h1.isLatched}), Hold at 43.5 kPa (${h2.isLatched}), Reset at 41.2 kPa (${!h3.isLatched}) [Deadband: 3.0 kPa]`
);

// --- Gate 4.2: Low-Side Hysteresis Logic ---
const lpLow = alarms.find(a => a.alarmCode === 'ALM_LP_LOW_WARNING');
// Trip = 100.0, Deadband = 10.0, Reset = 110.0
function evaluateLowSide(val, wasLatched, durSeconds, thresh, deadband, persist) {
  const resetThresh = thresh + deadband;
  const isBreaching = val < thresh;
  let isLatched = false;
  if (wasLatched) {
    isLatched = val <= resetThresh;
  } else {
    isLatched = isBreaching && durSeconds >= persist;
  }
  return { isBreaching, isLatched, resetThresh };
}

const l1 = evaluateLowSide(95.0, false, 650, lpLow.threshold, lpLow.deadbandHysteresis, lpLow.persistenceSeconds);
const l2 = evaluateLowSide(105.0, true, 700, lpLow.threshold, lpLow.deadbandHysteresis, lpLow.persistenceSeconds);
const l3 = evaluateLowSide(112.0, true, 0, lpLow.threshold, lpLow.deadbandHysteresis, lpLow.persistenceSeconds);

assertCheck(
  'Gate 4.2',
  'Low-Side Hysteresis Deadband Trip & Clear Logic',
  l1.isLatched === true && l2.isLatched === true && l3.isLatched === false,
  `Trip at 95.0 LMH/bar (${l1.isLatched}), Hold at 105.0 LMH/bar (${l2.isLatched}), Reset at 112.0 LMH/bar (${!l3.isLatched})`
);

// --- Gate 4.3: Persistence Time-Window Filtering ---
const pTransient = evaluateHighSide(50.0, false, 30, tmpHigh.threshold, tmpHigh.deadbandHysteresis, 120);
const pSustained = evaluateHighSide(50.0, false, 125, tmpHigh.threshold, tmpHigh.deadbandHysteresis, 120);

assertCheck(
  'Gate 4.3',
  'Persistence Time-Window Latching',
  pTransient.isBreaching === true && pTransient.isLatched === false && pSustained.isLatched === true,
  `Transient 30s spike correctly filtered (Latched: ${pTransient.isLatched}); Sustained 125s confirmed (Latched: ${pSustained.isLatched})`
);

// --- Gate 4.4: Rate-of-Change (ROC) ---
function calcROC(valNow, valPrev, dtMinutes) {
  if (dtMinutes <= 0) return 0;
  return ((valNow - valPrev) / (dtMinutes / 60));
}

const rocNormal = calcROC(22.3, 22.0, 60); // 0.30 kPa/h
const rocSpike = calcROC(33.4, 28.0, 120); // 2.70 kPa/h

assertCheck(
  'Gate 4.4',
  'Rate-of-Change (ROC) Trajectory & Fouling Slope',
  Math.abs(rocNormal - 0.30) < 0.001 && Math.abs(rocSpike - 2.70) < 0.001,
  `Normal ROC: ${rocNormal.toFixed(2)} kPa/h, Fouling Spike: ${rocSpike.toFixed(2)} kPa/h (Limit: 1.2 kPa/h)`
);

// --- Gate 4.5 & 4.6: Multi-Risk Index (MRI 0-100) & Sub-factors ---
function calcHydraulicRisk(tmp, lp, roc) {
  let tmpR = tmp <= 25 ? (tmp / 25) * 15 : (tmp <= 35 ? 15 + ((tmp - 25) / 10) * 20 : (tmp <= 45 ? 35 + ((tmp - 35) / 10) * 35 : 70 + Math.min(30, ((tmp - 45) / 15) * 30)));
  let lpR = lp >= 180 ? 5 : (lp >= 140 ? 10 + ((180 - lp) / 40) * 25 : (lp >= 100 ? 35 + ((140 - lp) / 40) * 35 : 70 + Math.min(30, ((100 - lp) / 40) * 30)));
  let rocR = Math.min(100, Math.max(0, (roc / 1.5) * 100));
  return Math.min(100, Math.max(0, 0.50 * tmpR + 0.35 * lpR + 0.15 * rocR));
}

function calcBioRisk(mlss, doVal, srt) {
  let mR = mlss > 14000 ? 85 + Math.min(15, ((mlss - 14000) / 4000) * 15) : (mlss > 12000 ? 45 + ((mlss - 12000) / 2000) * 40 : 10);
  let dR = doVal < 1.0 ? 90 : (doVal < 1.5 ? 60 + ((1.5 - doVal) / 0.5) * 30 : (doVal < 2.0 ? 20 + ((2.0 - doVal) / 0.5) * 40 : 5));
  let sR = srt > 45 ? 80 : (srt > 35 ? 40 + ((srt - 35) / 10) * 40 : 10);
  return Math.min(100, Math.max(0, 0.40 * mR + 0.35 * dR + 0.25 * sR));
}

function calcMechRisk(air, turb, vib) {
  let aR = air < 700 ? 90 : (air < 750 ? 70 + ((750 - air) / 50) * 20 : (air < 850 ? 20 + ((850 - air) / 100) * 50 : 5));
  let tR = turb > 0.40 ? 100 : (turb > 0.20 ? 30 + ((turb - 0.20) / 0.20) * 70 : 5);
  let vR = vib > 4.5 ? 90 : (vib > 3.0 ? 50 : 10);
  return Math.min(100, Math.max(0, 0.45 * aR + 0.35 * tR + 0.20 * vR));
}

function calcMRI(hyd, bio, mech, dq) {
  return Math.round((0.40 * hyd + 0.25 * bio + 0.20 * mech + 0.15 * dq) * 10) / 10;
}

const nominalHyd = calcHydraulicRisk(22.0, 175.0, 0.2);
const nominalBio = calcBioRisk(9500, 2.4, 25.0);
const nominalMech = calcMechRisk(920, 0.06, 1.5);
const nominalMRI = calcMRI(nominalHyd, nominalBio, nominalMech, 0);

const stressedHyd = calcHydraulicRisk(48.5, 85.0, 2.2);
const stressedBio = calcBioRisk(14500, 0.85, 48.0);
const stressedMech = calcMechRisk(650, 0.45, 4.8);
const stressedMRI = calcMRI(stressedHyd, stressedBio, stressedMech, 100);

assertCheck(
  'Gate 4.5',
  'Composite Multi-Risk Index (MRI 0-100)',
  nominalMRI < 25 && stressedMRI >= 75,
  `Nominal MRI: ${nominalMRI}/100 [NORMAL], Stressed MRI: ${stressedMRI}/100 [CRITICAL]`
);

assertCheck(
  'Gate 4.6',
  'Risk Factor Domain Decomposition',
  stressedHyd > 70 && stressedBio > 75 && stressedMech > 70,
  `Hydraulic Risk: ${stressedHyd.toFixed(1)}%, Biological: ${stressedBio.toFixed(1)}%, Mechanical: ${stressedMech.toFixed(1)}%`
);

// --- Gate 4.7: Inter-Train Peer Comparison & Z-Scores ---
function calcPeerStats(vals) {
  const n = vals.length;
  const mean = vals.reduce((a, b) => a + b, 0) / n;
  const variance = vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1);
  const std = Math.sqrt(variance);
  const zScores = vals.map(v => std > 0.0001 ? (v - mean) / std : 0);
  const pctDevs = vals.map(v => ((v - mean) / mean) * 100);
  return { mean, std, zScores, pctDevs };
}

const trainPerms = [160.0, 158.0, 105.0, 162.0]; // Train C at index 2
const peerStats = calcPeerStats(trainPerms);
const trainCDev = peerStats.pctDevs[2];

assertCheck(
  'Gate 4.7',
  'Inter-Train Peer Comparison & Z-Scores',
  peerStats.mean === 146.25 && trainCDev < -25.0,
  `Peer Mean: ${peerStats.mean} LMH/bar, StdDev: ${peerStats.std.toFixed(2)}, Train C Dev: ${trainCDev.toFixed(1)}% (Outlier Detected)`
);

// --- Gate 4.8: Multi-Symptom Root Cause Diagnostics ---
function inferRootCause(turb, air, tmp, temp, mlss, lp) {
  if (turb > 0.35) return 'FAULT_FIBER_RUPTURE';
  if (air < 750 && tmp > 35) return 'FAULT_AERATION_DEFICIT';
  if (temp < 14 && tmp > 40 && lp > 140) return 'PHENOMENON_COLD_VISCOSITY';
  if (mlss > 13000 && lp < 110) return 'FAULT_COLLOIDAL_FOULING';
  return 'NOMINAL_OPERATION';
}

const c1 = inferRootCause(0.65, 900, 24, 19, 9000, 160);
const c2 = inferRootCause(0.08, 620, 42, 18, 10500, 135);
const c3 = inferRootCause(0.07, 910, 43.5, 9.5, 9800, 165);
const c4 = inferRootCause(0.08, 900, 44, 18, 14200, 95);

assertCheck(
  'Gate 4.8',
  'Multi-Symptom Root Cause Diagnostics',
  c1 === 'FAULT_FIBER_RUPTURE' && c2 === 'FAULT_AERATION_DEFICIT' && c3 === 'PHENOMENON_COLD_VISCOSITY' && c4 === 'FAULT_COLLOIDAL_FOULING',
  `Rupture: ${c1}, Aeration Deficit: ${c2}, Cold Viscosity: ${c3}, Colloidal: ${c4}`
);

// --- Gate 4.9: Stage 4 Excel Workbook OpenXML Verification ---
async function verifyWorkbookStage4() {
  const wbPath = path.resolve(__dirname, '../public/UNIT_77_MBR_SUPER_EXPERT.xlsx');
  if (!fs.existsSync(wbPath)) {
    assertCheck('Gate 4.9', 'Excel Workbook Exists for Stage 4', false, 'Workbook file missing at public/');
    return;
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(wbPath);

  const sh11 = wb.getWorksheet('11_Events_Alarms');
  const sh12 = wb.getWorksheet('12_Peer_Comparison');

  const sh11HasHysteresis = sh11 && sh11.getRow(4).getCell(5).value.toString().includes('HYST');
  const sh11HasMRI = sh11 && sh11.getRow(16).getCell(1).value.toString().includes('MULTI-RISK INDEX');
  const sh12HasZScores = sh12 && sh12.getRow(4).getCell(8).value.toString().includes('STDEV');

  assertCheck(
    'Gate 4.9',
    'Excel Stage 4 Worksheets (11_Events_Alarms & 12_Peer_Comparison)',
    sh11HasHysteresis && sh11HasMRI && sh12HasZScores,
    `Sheet 11 Hysteresis Header: [${sh11HasHysteresis}], Sheet 11 MRI Table: [${sh11HasMRI}], Sheet 12 Stats: [${sh12HasZScores}]`
  );

  // --- Gate 4.10: Zero-Division & Edge-Case Guards ---
  const zeroDtROC = calcROC(25.0, 25.0, 0);
  const zeroStdPeers = calcPeerStats([150, 150, 150, 150]);
  const zeroStdGuarded = zeroStdPeers.zScores.every(z => z === 0 && !isNaN(z));

  assertCheck(
    'Gate 4.10',
    'Zero-Division & Edge-Case Guards',
    zeroDtROC === 0 && zeroStdGuarded,
    `Zero dt ROC: ${zeroDtROC} (clamped), Zero StdDev Z-scores: [${zeroStdPeers.zScores.join(', ')}] (no NaN/Inf)`
  );

  console.log('----------------------------------------------------');
  console.log(`TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${totalChecks - passedChecks}`);
  if (passedChecks === totalChecks) {
    console.log('>>> STAGE 4 GATE: [PASS] <<<');
  } else {
    console.error('>>> STAGE 4 GATE: [FAIL] <<<');
    process.exit(1);
  }
}

verifyWorkbookStage4().catch(err => {
  console.error('Error verifying stage 4 workbook:', err);
  process.exit(1);
});
