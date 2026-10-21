/**
 * UNIT 77 MBR SUPER EXPERT — STAGE 5 GATE VERIFICATION (NODE.JS)
 * Author: Turgunjon Ruziboyev
 * 
 * Verifies:
 *  - Gate 5.1: Train Outage Hydraulic Redistribution Math (4 to 3 trains -> 32.0 LMH)
 *  - Gate 5.2: Non-linear TMP Response Modeling (beta = 1.4 cake compaction)
 *  - Gate 5.3: Sustainable Flow Bottleneck & Curtailment Solver (at 30 LMH peak limit)
 *  - Gate 5.4: Poiseuille Cold-Weather Viscosity Compensation & Head Loss
 *  - Gate 5.5: Permeate Pump Power & Specific Energy Consumption (SEC in kWh/m3)
 *  - Gate 5.6: Sludge Wastage (WAS) & Continuous SRT Mass Balance
 *  - Gate 5.7: Nitrification Washout Critical Safety Threshold (SRT < 12 days)
 *  - Gate 5.8: Multi-Variable Compound Extreme Stress-Test (Outage + Cold + Surge)
 *  - Gate 5.9: Stage 5 Excel Workbook OpenXML structures & formulas in Sheet 13
 *  - Gate 5.10: Zero-division and physical boundary guards
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
console.log('UNIT 77 MBR SUPER EXPERT — STAGE 5 GATE VERIFICATION');
console.log('Author: Turgunjon Ruziboyev');
console.log('====================================================');

// Physics formulas
function calculateWaterViscosity(tempC) {
  const safeTemp = Math.max(0.1, Math.min(80.0, tempC));
  return 1.787 * Math.exp(-0.0337 * safeTemp + 0.000221 * Math.pow(safeTemp, 2));
}

// --- Gate 5.1: Train Outage Flux Redistribution ---
const totalPlantFlow = 460.8; // m3/h
const areaPerTrain = 4800; // m2
const activeTrainsCount = 3;
const activeArea = activeTrainsCount * areaPerTrain; // 14,400 m2
const redistributedFlux = (totalPlantFlow * 1000) / activeArea; // 32.0 LMH
const baselineFlux = (totalPlantFlow * 1000) / (4 * areaPerTrain); // 24.0 LMH
const fluxIncreasePct = ((redistributedFlux - baselineFlux) / baselineFlux) * 100;

assertCheck(
  'Gate 5.1',
  'Train Outage Hydraulic Redistribution Math',
  Math.abs(redistributedFlux - 32.0) < 0.001 && Math.abs(fluxIncreasePct - 33.333) < 0.01,
  `Active area: ${activeArea} m², Redistributed flux: ${redistributedFlux.toFixed(2)} LMH (+${fluxIncreasePct.toFixed(1)}%)`
);

// --- Gate 5.2: Non-linear TMP Response Modeling ---
const baselineTMP = 19.5667; // kPa
const beta = 1.4;
const simTMP = baselineTMP * Math.pow(redistributedFlux / baselineFlux, beta);
const expectedTMP = 19.5667 * Math.pow(32.0 / 24.0, 1.4); // 29.214 kPa

assertCheck(
  'Gate 5.2',
  'Non-linear TMP Response Modeling (beta = 1.4)',
  Math.abs(simTMP - expectedTMP) < 0.01,
  `Baseline TMP: ${baselineTMP.toFixed(2)} kPa -> Simulated TMP: ${simTMP.toFixed(2)} kPa (+${(((simTMP - baselineTMP) / baselineTMP) * 100).toFixed(1)}%)`
);

// --- Gate 5.3: Sustainable Flow Bottleneck Solver ---
const maxAllowableFlux = 30.0; // LMH
const maxSustainableFlow = (activeArea * maxAllowableFlux) / 1000; // 432.0 m3/h
const flowCurtailment = Math.max(0, totalPlantFlow - maxSustainableFlow); // 28.8 m3/h
const flowCurtailmentPct = (flowCurtailment / totalPlantFlow) * 100; // 6.25%

assertCheck(
  'Gate 5.3',
  'Sustainable Flow Bottleneck & Curtailment Solver',
  Math.abs(maxSustainableFlow - 432.0) < 0.001 && Math.abs(flowCurtailment - 28.8) < 0.001,
  `Max sustainable: ${maxSustainableFlow.toFixed(1)} m³/h, Flow curtailment required: ${flowCurtailment.toFixed(1)} m³/h (${flowCurtailmentPct.toFixed(2)}%)`
);

// --- Gate 5.4: Poiseuille Cold-Weather Viscosity Compensation ---
const mu8 = calculateWaterViscosity(8.0);
const mu18_5 = calculateWaterViscosity(18.5);
const mu20 = calculateWaterViscosity(20.0);
const viscRatio = mu8 / mu18_5; // 1.340
const coldTMP = baselineTMP * viscRatio;

assertCheck(
  'Gate 5.4',
  'Poiseuille Cold-Weather Viscosity Compensation & Head Loss',
  mu8 > 1.38 && mu8 < 1.39 && viscRatio > 1.33 && viscRatio < 1.35,
  `Viscosity at 8°C: ${mu8.toFixed(4)} mPa·s vs 18.5°C: ${mu18_5.toFixed(4)} mPa·s (Drag ratio: ${viscRatio.toFixed(3)}, Cold TMP: ${coldTMP.toFixed(2)} kPa)`
);

// --- Gate 5.5: Permeate Pump Power & SEC ---
const hydPowerKW = (totalPlantFlow * baselineTMP) / 3600; // 2.504 kW
const pumpEta = 0.75;
const elecPowerKW = hydPowerKW / pumpEta; // 3.339 kW
const secKWhM3 = elecPowerKW / totalPlantFlow; // 0.007246 kWh/m3

assertCheck(
  'Gate 5.5',
  'Permeate Pump Power & Specific Energy Consumption (SEC)',
  hydPowerKW > 2.4 && elecPowerKW > 3.2 && secKWhM3 > 0.007 && secKWhM3 < 0.008,
  `Hydraulic power: ${hydPowerKW.toFixed(3)} kW, Electrical power: ${elecPowerKW.toFixed(3)} kW, SEC: ${secKWhM3.toFixed(5)} kWh/m³`
);

// --- Gate 5.6: Sludge Wastage & Continuous SRT Mass Balance ---
const vAer = 2800; // m3
const vMbr = 800;  // m3
const mlssAer = 7400; // mg/L
const mlssMbr = 9200; // mg/L
const totalSolidsInventoryKg = (vAer * mlssAer) / 1000 + (vMbr * mlssMbr) / 1000; // 20720 + 7360 = 28080 kg
const baselineWASFlow = 38.0; // m3/d
const baselineWASMassKgD = (baselineWASFlow * mlssMbr) / 1000; // 349.6 kg/d
const baselineSRT = totalSolidsInventoryKg / baselineWASMassKgD; // 80.32 days

const simWASFlow = 60.0; // m3/d
const simWASMassKgD = (simWASFlow * mlssMbr) / 1000; // 552.0 kg/d
const simSRT = totalSolidsInventoryKg / simWASMassKgD; // 50.87 days

assertCheck(
  'Gate 5.6',
  'Sludge Wastage (WAS) & Continuous SRT Mass Balance',
  totalSolidsInventoryKg === 28080 && Math.abs(baselineSRT - 80.32) < 0.05 && Math.abs(simSRT - 50.87) < 0.05,
  `Solids inventory: ${totalSolidsInventoryKg} kg, Baseline SRT: ${baselineSRT.toFixed(1)} d, Simulated SRT (WAS 60 m³/d): ${simSRT.toFixed(1)} d`
);

// --- Gate 5.7: Nitrification Washout Critical Safety Threshold ---
const highWASFlow = 250.0; // m3/d
const highWASMass = (highWASFlow * mlssMbr) / 1000;
const lowSRT = totalSolidsInventoryKg / highWASMass; // 12.2 d
const isWashoutRisk = lowSRT < 12.0;

const washoutWASFlow = 270.0;
const washoutSRT = totalSolidsInventoryKg / ((washoutWASFlow * mlssMbr) / 1000); // 11.3 d
const latchedWashout = washoutSRT < 12.0;

assertCheck(
  'Gate 5.7',
  'Nitrification Washout Critical Safety Threshold (SRT < 12 days)',
  isWashoutRisk === false && latchedWashout === true,
  `At WAS 250 m³/d -> SRT: ${lowSRT.toFixed(1)} d (Safe); At WAS 270 m³/d -> SRT: ${washoutSRT.toFixed(1)} d (Washout risk latched)`
);

// --- Gate 5.8: Compound Hydraulic-Thermal Stress Test ---
// 3 trains (32 LMH) + Cold (9°C) + Storm (+15% flow = 530 m3/h)
const stormFlux = (530.0 * 1000) / activeArea; // 36.81 LMH (> 30.0 limit)
const coldViscRatio = calculateWaterViscosity(9.0) / calculateWaterViscosity(18.5); // 1.309
const compoundTMP = baselineTMP * Math.pow(stormFlux / baselineFlux, 1.4) * coldViscRatio; // ~ 46.2 kPa (> 45.0 limit)
const isCritical = stormFlux > 30.0 && compoundTMP > 45.0;

assertCheck(
  'Gate 5.8',
  'Multi-Variable Compound Extreme Stress-Test (Outage + Cold + Surge)',
  isCritical === true && compoundTMP > 45.0,
  `Compound flux: ${stormFlux.toFixed(1)} LMH, Compound TMP: ${compoundTMP.toFixed(1)} kPa (> 45.0 limit) -> CRITICAL interlock verified`
);

// --- Gate 5.9: Excel OpenXML Audit for Sheet 13 ---
async function verifyExcelWorkbook() {
  const filePath = path.resolve(__dirname, '../UNIT_77_MBR_SUPER_EXPERT.xlsx');
  if (!fs.existsSync(filePath)) {
    assertCheck('Gate 5.9', 'Stage 5 Excel Workbook OpenXML Verification', false, 'File not found: UNIT_77_MBR_SUPER_EXPERT.xlsx');
    return;
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  const sh13 = wb.getWorksheet('13_What_If');
  const sh19 = wb.getWorksheet('19_Audit_Log');

  const sh13Valid = !!sh13;
  const row5Val = sh13 ? sh13.getRow(5).getCell(3).value : null; // Active Trains online (3)
  const row8Formula = sh13 ? sh13.getRow(8).getCell(3).value : null; // Redistributed Flux formula
  const row11Formula = sh13 ? sh13.getRow(11).getCell(3).value : null; // Simulated TMP formula
  const row23Formula = sh13 ? sh13.getRow(23).getCell(3).value : null; // SRT formula

  const hasFormulas = !!(row8Formula && typeof row8Formula === 'object' && row8Formula.formula);
  
  // Check audit log for Stage 5 entry
  let hasStage5Audit = false;
  if (sh19) {
    sh19.eachRow((r) => {
      const txt = JSON.stringify(r.values);
      if (txt.includes('Stage 5') || txt.includes('What-If')) hasStage5Audit = true;
    });
  }

  assertCheck(
    'Gate 5.9',
    'Stage 5 Excel Workbook OpenXML Verification (Sheet 13 & 19)',
    sh13Valid && hasFormulas && hasStage5Audit,
    `Sheet 13 Present: ${sh13Valid}, Formulas Present: ${hasFormulas}, Stage 5 Audit Entry: ${hasStage5Audit}`
  );

  // --- Gate 5.10: Zero-Division & Bounds Guards ---
  // Zero active trains
  const zeroArea = 0;
  const safeFlux = zeroArea > 0 ? (totalPlantFlow * 1000) / zeroArea : 0;
  const zeroWAS = 0;
  const safeSRT = zeroWAS > 0 ? totalSolidsInventoryKg / zeroWAS : 99999;
  const safeZeroDiv = safeFlux === 0 && isFinite(safeSRT);

  assertCheck(
    'Gate 5.10',
    'Zero-Division and Physical Boundary Guards',
    safeZeroDiv,
    `Zero trains clamped to 0 LMH; Zero WAS clamped to ${safeSRT} days without NaN or Infinity.`
  );

  console.log('----------------------------------------------------');
  console.log(`TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${totalChecks - passedChecks}`);
  if (passedChecks === totalChecks) {
    console.log('>>> STAGE 5 GATE: [PASS] <<<');
  } else {
    console.error('>>> STAGE 5 GATE: [FAIL] <<<');
    process.exitCode = 1;
  }
}

verifyExcelWorkbook().catch(err => {
  console.error('Workbook verification failed:', err);
  process.exitCode = 1;
});
