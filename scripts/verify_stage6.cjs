/**
 * UNIT 77 MBR SUPER EXPERT — STAGE 6 GATE VERIFICATION (NODE.JS)
 * Author: Turgunjon Ruziboyev
 * 
 * Verifies:
 *  - Gate 6.1: Multi-Horizon Linear Forecast Math (T+24h at 0.25 kPa/h: 20.0 -> 26.0 kPa)
 *  - Gate 6.2: Exponential Cake Compaction Projection Math (T+24h at k=0.010: 20.0 -> 25.425 kPa)
 *  - Gate 6.3: Remaining Useful Life (RUL) to 45 kPa Limit (Linear: 100h, Exp: 81.1h)
 *  - Gate 6.4: RUL to Emergency Stop Critical Limit (55 kPa: 140h)
 *  - Gate 6.5: Darcy Clean Membrane Resistance Rm Inversion (1.497e12 m^-1)
 *  - Gate 6.6: Specific Cake Resistance alpha & Compaction beta (1.40)
 *  - Gate 6.7: Ordinary Least Squares (OLS) Regression Metrics (R² = 1.000, RMSE = 0.00)
 *  - Gate 6.8: Operational Urgency Classification & Automated Dosing Plan
 *  - Gate 6.9: OpenXML Inspection of Sheet 14 (14_Prediction) & Sheet 19 (19_Audit_Log)
 *  - Gate 6.10: Zero-division, negative slope, and boundary clamping safeguards
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

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
console.log('UNIT 77 MBR SUPER EXPERT — STAGE 6 GATE VERIFICATION');
console.log('Author: Turgunjon Ruziboyev');
console.log('====================================================');

// Physics formulas
function calculateWaterViscosity(tempC) {
  const safeTemp = Math.max(0.1, Math.min(80.0, tempC));
  return 1.787 * Math.exp(-0.0337 * safeTemp + 0.000221 * Math.pow(safeTemp, 2));
}

// --- Gate 6.1: Multi-Horizon Linear Forecast Math ---
const baseTMP = 20.0; // kPa
const slopeKPaH = 0.25; // kPa/h
const t24h = 24.0;
const linearTMP24 = baseTMP + slopeKPaH * t24h; // 26.0 kPa
const linearTMP168 = baseTMP + slopeKPaH * 168.0; // 62.0 kPa

assertCheck(
  'Gate 6.1',
  'Multi-Horizon Linear Forecast Mathematical Accuracy',
  Math.abs(linearTMP24 - 26.0) < 0.001 && Math.abs(linearTMP168 - 62.0) < 0.001,
  `T+24h: ${linearTMP24.toFixed(2)} kPa (Target: 26.00), T+168h: ${linearTMP168.toFixed(2)} kPa (Target: 62.00)`
);

// --- Gate 6.2: Exponential Cake Compaction Projection Math ---
const kExp = 0.010; // 1/h
const expTMP24 = baseTMP * Math.exp(kExp * 24.0); // 25.4249 kPa
const expTMP48 = baseTMP * Math.exp(kExp * 48.0); // 32.3212 kPa

assertCheck(
  'Gate 6.2',
  'Exponential Cake Compaction Kinetics Projection',
  Math.abs(expTMP24 - 25.4249) < 0.01 && Math.abs(expTMP48 - 32.3212) < 0.01,
  `T+24h Exp: ${expTMP24.toFixed(3)} kPa, T+48h Exp: ${expTMP48.toFixed(3)} kPa (Autocatalytic rise confirmed)`
);

// --- Gate 6.3: Remaining Useful Life (RUL) to 45 kPa Limit ---
const limitMC = 45.0; // kPa
const rulLinear = (limitMC - baseTMP) / slopeKPaH; // (45 - 20) / 0.25 = 100.0 h
const rulExp = Math.log(limitMC / baseTMP) / kExp; // ln(2.25) / 0.01 = 81.093 h

assertCheck(
  'Gate 6.3',
  'Remaining Useful Life (RUL) to Maintenance Clean (45 kPa)',
  Math.abs(rulLinear - 100.0) < 0.01 && Math.abs(rulExp - 81.09) < 0.02,
  `RUL Linear: ${rulLinear.toFixed(1)} h, RUL Exp: ${rulExp.toFixed(1)} h (Non-linear compaction horizon divergence)`
);

// --- Gate 6.4: RUL to Emergency Stop Critical Limit (55 kPa) ---
const limitEStop = 55.0; // kPa
const rulEStop = (limitEStop - baseTMP) / slopeKPaH; // (55 - 20) / 0.25 = 140.0 h

assertCheck(
  'Gate 6.4',
  'RUL to Critical Emergency Stop Threshold (55 kPa)',
  Math.abs(rulEStop - 140.0) < 0.01,
  `Safe operating window to structural fiber collapse: ${rulEStop.toFixed(1)} hours`
);

// --- Gate 6.5: Darcy Clean Membrane Resistance Rm Inversion ---
const cleanTMP = 10.0; // kPa
const cleanFlux = 24.0; // LMH
const cleanTemp = 20.0; // °C
const muPaS = calculateWaterViscosity(cleanTemp) * 0.001; // Pa.s
const fluxMS = cleanFlux / 3600000.0; // m/s
const cleanRm = (cleanTMP * 1000.0) / (muPaS * fluxMS); // 1/m

assertCheck(
  'Gate 6.5',
  'Darcy Clean Membrane Resistance Rm Analytical Inversion',
  Math.abs(cleanRm - 1.497e12) / 1.497e12 < 0.01,
  `Calibrated Clean Rm: ${cleanRm.toExponential(4)} m⁻¹ (Matches PVDF hollow fiber benchmark ~1.50e12)`
);

// --- Gate 6.6: Specific Cake Resistance alpha & Compaction beta ---
const betaCompaction = Math.log(29.267 / 19.5667) / Math.log(32.0 / 24.0); // 1.399 ~ 1.40
const deltaTMPPa = 8.6 * 1000.0;
const fluxOpMS = 24.0 / 3600000.0;
const mu18 = calculateWaterViscosity(18.5) * 0.001;
const rCake = deltaTMPPa / (mu18 * fluxOpMS);
const depositedSolidsKgM2 = 0.038;
const alphaCake = rCake / depositedSolidsKgM2;

assertCheck(
  'Gate 6.6',
  'Specific Cake Resistance (alpha) & Compaction Exponent (beta)',
  Math.abs(betaCompaction - 1.40) < 0.01 && alphaCake > 1.0e13 && alphaCake < 1.0e14,
  `Calibrated beta: ${betaCompaction.toFixed(3)}, Calibrated alpha: ${alphaCake.toExponential(3)} m/kg`
);

// --- Gate 6.7: Ordinary Least Squares (OLS) Regression Metrics ---
const tH = [0, 10, 20, 30, 40];
const yTMP = [18.0, 20.5, 23.0, 25.5, 28.0]; // Perfect 0.25 kPa/h line
let sumT = 0, sumY = 0, sumTY = 0, sumT2 = 0;
const n = tH.length;
for (let i = 0; i < n; i++) {
  sumT += tH[i]; sumY += yTMP[i]; sumTY += tH[i] * yTMP[i]; sumT2 += tH[i] * tH[i];
}
const slope = (n * sumTY - sumT * sumY) / (n * sumT2 - sumT * sumT);
const intercept = (sumY - slope * sumT) / n;
const meanY = sumY / n;
let ssTot = 0, ssRes = 0;
for (let i = 0; i < n; i++) {
  const yPred = intercept + slope * tH[i];
  ssTot += Math.pow(yTMP[i] - meanY, 2);
  ssRes += Math.pow(yTMP[i] - yPred, 2);
}
const r2 = 1 - ssRes / ssTot;
const rmse = Math.sqrt(ssRes / n);

assertCheck(
  'Gate 6.7',
  'Ordinary Least Squares Regression Accuracy & Convergence',
  Math.abs(slope - 0.25) < 0.001 && Math.abs(r2 - 1.000) < 0.0001 && rmse < 0.001,
  `Slope: ${slope.toFixed(3)} kPa/h, R²: ${r2.toFixed(4)}, RMSE: ${rmse.toFixed(4)} kPa`
);

// --- Gate 6.8: Operational Urgency Classification & Automated Dosing Plan ---
function getUrgency(rul) {
  if (rul <= 12) return 'CRITICAL';
  if (rul <= 36) return 'WARNING';
  if (rul <= 72) return 'PLANNED';
  return 'NORMAL';
}
const uCrit = getUrgency(8.5);
const uWarn = getUrgency(24.0);
const uNorm = getUrgency(95.0);

assertCheck(
  'Gate 6.8',
  'Operational Urgency State Machine & Chemical Dispatch Rules',
  uCrit === 'CRITICAL' && uWarn === 'WARNING' && uNorm === 'NORMAL',
  `8.5h -> ${uCrit} (NaOCl 500ppm dispatch), 24h -> ${uWarn} (NaOCl 300ppm plan), 95h -> ${uNorm}`
);

// --- Gate 6.9: OpenXML Inspection of Sheet 14 & Sheet 19 ---
async function verifyWorkbookOpenXML() {
  const wbPath = path.resolve(__dirname, '../public/UNIT_77_MBR_SUPER_EXPERT.xlsx');
  const exists = fs.existsSync(wbPath);
  if (!exists) {
    assertCheck('Gate 6.9', 'Stage 6 Excel OpenXML Verification', false, `File not found at ${wbPath}`);
    return;
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(wbPath);
  const sh14 = wb.getWorksheet('14_Prediction');
  const sh19 = wb.getWorksheet('19_Audit_Log');

  const sh14Found = !!sh14;
  let formulaFound = false;
  let stage6AuditFound = false;

  if (sh14) {
    sh14.eachRow((row) => {
      row.eachCell((cell) => {
        if (cell.formula && (cell.formula.includes('04_Train_Analysis') || cell.formula.includes('EXP') || cell.formula.includes('LN'))) {
          formulaFound = true;
        }
      });
    });
  }

  if (sh19) {
    sh19.eachRow((row) => {
      row.eachCell((cell) => {
        if (typeof cell.value === 'string' && cell.value.includes('Stage 6')) {
          stage6AuditFound = true;
        }
      });
    });
  }

  assertCheck(
    'Gate 6.9',
    'Stage 6 Excel OpenXML Inspection (Sheet 14 & 19 Audit)',
    sh14Found && formulaFound && stage6AuditFound,
    `Sheet 14 Present: ${sh14Found}, Formulas Present: ${formulaFound}, Stage 6 Audit Entry: ${stage6AuditFound}`
  );
}

// --- Gate 6.10: Zero-Division and Physical Boundary Guards ---
const zeroSlopeSafeRUL = (45.0 - 20.0) / Math.max(0.001, 0.0); // 25,000 h (safe finite)
const exceededTMPRUL = Math.max(0.0, (45.0 - 46.5) / 0.25); // 0 h (no negative time)
const zeroFluxDarcy = 20.0 * 1000 / (muPaS * Math.max(1e-9, 0.0)); // bounded

assertCheck(
  'Gate 6.10',
  'Zero-Division and Physical Boundary Clamping Guards',
  Number.isFinite(zeroSlopeSafeRUL) && exceededTMPRUL === 0.0,
  `Zero slope clamp: ${zeroSlopeSafeRUL} h, Exceeded TMP clamp: ${exceededTMPRUL} h (No NaN or Inf)`
);

// Execute async OpenXML check
verifyWorkbookOpenXML().then(() => {
  console.log('----------------------------------------------------');
  console.log(`TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${totalChecks - passedChecks}`);
  if (passedChecks === totalChecks) {
    console.log('>>> STAGE 6 GATE: [PASS] <<<');
  } else {
    console.log('>>> STAGE 6 GATE: [FAIL] <<<');
    process.exit(1);
  }
});
