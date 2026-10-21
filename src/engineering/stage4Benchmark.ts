/**
 * UNIT 77 MBR SUPER EXPERT — STAGE 4 BENCHMARK SUITE
 * Author: Turgunjon Ruziboyev
 * 
 * Standardized controlled tests verifying:
 *  - High-side & Low-side Hysteresis deadband mechanics
 *  - Persistence spike filtering and confirmation
 *  - Rate-of-Change (ROC) trajectory derivation
 *  - Multi-Risk Index (MRI) composite weighting
 *  - Peer comparison Z-scores & outlier detection
 *  - Multi-symptom root cause diagnostic reasoning
 */

import {
  evaluateAlarmCondition,
  calculateRateOfChange,
  calculateMultiRiskIndex,
  calculatePeerComparison,
  diagnoseRootCauses,
  MASTER_ALARM_RULES,
  OperationalSnapshot
} from './diagnosticEngine';

export interface Stage4BenchmarkTestCase {
  id: string;
  category: 'HYSTERESIS' | 'PERSISTENCE' | 'ROC' | 'MULTI_RISK_INDEX' | 'PEER_COMPARISON' | 'ROOT_CAUSE' | 'GUARD_LIMIT';
  name: string;
  description: string;
  expectedValue: any;
  computedValue: any;
  tolerancePct?: number;
  unit: string;
  passed: boolean;
  notes: string;
}

export function runStage4BenchmarkSuite(): Stage4BenchmarkTestCase[] {
  const tests: Stage4BenchmarkTestCase[] = [];

  // Helper for rules
  const tmpHighRule = MASTER_ALARM_RULES.find(r => r.alarmCode === 'ALM_TMP_HIGH')!;
  const lpLowRule = MASTER_ALARM_RULES.find(r => r.alarmCode === 'ALM_LP_LOW_WARNING')!;

  // 1. High-Side Hysteresis: Initial Trip
  // Threshold 45.0, deadband 3.0. Value 46.5 kPa, duration 150s (> 120s)
  const res1 = evaluateAlarmCondition(tmpHighRule, 46.5, 'TRAIN_C', false, 150);
  tests.push({
    id: 'BENCH-4.1A',
    category: 'HYSTERESIS',
    name: 'High-Side Alarm Initial Trip (TMP > 45.0 kPa)',
    description: 'Verifies alarm trips when value exceeds threshold and persistence is satisfied',
    expectedValue: true,
    computedValue: res1.isLatched,
    unit: 'boolean',
    passed: res1.isLatched === true && res1.isBreaching === true,
    notes: `Trip threshold: 45.0 kPa, reset: 42.0 kPa. Evaluated at 46.5 kPa for 150s.`
  });

  // 2. High-Side Hysteresis: Deadband Hold (43.5 kPa is between 42.0 and 45.0)
  // Was previously latched, value drops to 43.5. Must REMAIN latched!
  const res2 = evaluateAlarmCondition(tmpHighRule, 43.5, 'TRAIN_C', true, 200);
  tests.push({
    id: 'BENCH-4.1B',
    category: 'HYSTERESIS',
    name: 'High-Side Deadband Latch Hold (TMP = 43.5 kPa)',
    description: 'Verifies alarm remains latched within hysteresis deadband (42.0 - 45.0 kPa) to prevent chattering',
    expectedValue: true,
    computedValue: res2.isLatched,
    unit: 'boolean',
    passed: res2.isLatched === true,
    notes: `Value 43.5 kPa < 45.0, but >= reset threshold 42.0 kPa. Correctly holds state.`
  });

  // 3. High-Side Hysteresis: Clean Reset below Deadband (41.5 kPa < 42.0)
  const res3 = evaluateAlarmCondition(tmpHighRule, 41.5, 'TRAIN_C', true, 0);
  tests.push({
    id: 'BENCH-4.1C',
    category: 'HYSTERESIS',
    name: 'High-Side Deadband Alarm Reset (TMP = 41.5 kPa)',
    description: 'Verifies alarm clears only when value drops strictly below reset threshold (45.0 - 3.0 = 42.0 kPa)',
    expectedValue: false,
    computedValue: res3.isLatched,
    unit: 'boolean',
    passed: res3.isLatched === false,
    notes: `Value 41.5 kPa < reset threshold 42.0 kPa. Latch successfully released.`
  });

  // 4. Low-Side Hysteresis: Initial Trip (Lp < 100.0, deadband 10.0, reset = 110.0)
  const res4 = evaluateAlarmCondition(lpLowRule, 92.0, 'TRAIN_A', false, 650);
  tests.push({
    id: 'BENCH-4.2A',
    category: 'HYSTERESIS',
    name: 'Low-Side Alarm Initial Trip (Lp < 100.0 LMH/bar)',
    description: 'Verifies low-side alarm trips when normalized permeability falls below 100.0',
    expectedValue: true,
    computedValue: res4.isLatched,
    unit: 'boolean',
    passed: res4.isLatched === true,
    notes: `Threshold: 100.0 LMH/bar, reset: 110.0 LMH/bar. Value: 92.0 LMH/bar.`
  });

  // 5. Low-Side Hysteresis: Deadband Hold (Lp = 106.0 LMH/bar, between 100.0 and 110.0)
  const res5 = evaluateAlarmCondition(lpLowRule, 106.0, 'TRAIN_A', true, 700);
  tests.push({
    id: 'BENCH-4.2B',
    category: 'HYSTERESIS',
    name: 'Low-Side Deadband Latch Hold (Lp = 106.0 LMH/bar)',
    description: 'Verifies low-side alarm remains latched until rising above 110.0 LMH/bar reset threshold',
    expectedValue: true,
    computedValue: res5.isLatched,
    unit: 'boolean',
    passed: res5.isLatched === true,
    notes: `Value 106.0 > 100.0, but <= 110.0 reset threshold. Latch correctly held.`
  });

  // 6. Low-Side Hysteresis: Reset (Lp = 114.0 LMH/bar > 110.0)
  const res6 = evaluateAlarmCondition(lpLowRule, 114.0, 'TRAIN_A', true, 0);
  tests.push({
    id: 'BENCH-4.2C',
    category: 'HYSTERESIS',
    name: 'Low-Side Deadband Alarm Reset (Lp = 114.0 LMH/bar)',
    description: 'Verifies low-side alarm resets when permeability safely exceeds 110.0 LMH/bar',
    expectedValue: false,
    computedValue: res6.isLatched,
    unit: 'boolean',
    passed: res6.isLatched === false,
    notes: `Value 114.0 LMH/bar > 110.0 reset threshold. Latch released.`
  });

  // 7. Persistence Filtering: Transient Hydraulic Spike Ignored
  // TMP breaches 48.0 kPa, but only sustained for 35s (persistence requires 120s)
  const res7 = evaluateAlarmCondition(tmpHighRule, 48.0, 'TRAIN_B', false, 35);
  tests.push({
    id: 'BENCH-4.3A',
    category: 'PERSISTENCE',
    name: 'Persistence Rejection of Transient Pressure Spike',
    description: 'Ensures instantaneous spike (< 120s) does NOT trigger confirmed latched alarm',
    expectedValue: false,
    computedValue: res7.isLatched,
    unit: 'boolean',
    passed: res7.isLatched === false && res7.isBreaching === true,
    notes: `Condition breached (48.0 > 45.0), but duration 35s < 120s persistence. Correctly filtered.`
  });

  // 8. Persistence Filtering: Sustained Breach Confirmed
  const res8 = evaluateAlarmCondition(tmpHighRule, 48.0, 'TRAIN_B', false, 125);
  tests.push({
    id: 'BENCH-4.3B',
    category: 'PERSISTENCE',
    name: 'Persistence Confirmation of Sustained Overpressure',
    description: 'Ensures persistent condition (125s >= 120s) confirms and latches alarm',
    expectedValue: true,
    computedValue: res8.isLatched,
    unit: 'boolean',
    passed: res8.isLatched === true,
    notes: `Duration 125s >= 120s. Alarm latched.`
  });

  // 9. Rate of Change: Normal Trajectory
  // From 22.0 to 22.3 kPa over 60 minutes -> 0.300 kPa/h
  const roc1 = calculateRateOfChange(22.3, 22.0, 60, 'TRANSMEMBRANE_PRESSURE', 'TRAIN_A', 1.2);
  tests.push({
    id: 'BENCH-4.4A',
    category: 'ROC',
    name: 'Normal TMP Rate-of-Change Calculation (0.30 kPa/h)',
    description: 'Verifies dTMP/dt derivation over 60-minute window',
    expectedValue: 0.30,
    computedValue: roc1.ratePerHour,
    tolerancePct: 0.01,
    unit: 'kPa/h',
    passed: Math.abs(roc1.ratePerHour - 0.30) < 0.001 && roc1.isExcessive === false,
    notes: `Delta: +0.30 kPa in 1.0 h. Below 1.2 kPa/h warning threshold.`
  });

  // 10. Rate of Change: Accelerated Fouling Spike
  // From 28.0 to 33.4 kPa over 120 minutes -> (5.4 / 2.0) = 2.700 kPa/h
  const roc2 = calculateRateOfChange(33.4, 28.0, 120, 'TRANSMEMBRANE_PRESSURE', 'TRAIN_C', 1.2);
  tests.push({
    id: 'BENCH-4.4B',
    category: 'ROC',
    name: 'Accelerated Fouling Rate Detection (2.70 kPa/h)',
    description: 'Verifies detection of severe fouling slope exceeding 1.2 kPa/h limit',
    expectedValue: 2.70,
    computedValue: roc2.ratePerHour,
    tolerancePct: 0.01,
    unit: 'kPa/h',
    passed: Math.abs(roc2.ratePerHour - 2.70) < 0.001 && roc2.isExcessive === true,
    notes: `Delta: +5.4 kPa in 2.0 h -> 2.70 kPa/h > 1.2 kPa/h. Correctly flagged excessive.`
  });

  // 11. Multi-Risk Index: Nominal Pristine Operation
  const nominalSnapshot: OperationalSnapshot = {
    trainId: 'TRAIN_A',
    tmpKPa: 22.0,
    tmpPrevKPa: 21.8,
    dtMinutes: 60,
    permeabilityNormalized: 175.0,
    fluxGrossLMH: 22.0,
    airScourFlowNm3h: 920.0,
    permeateTurbidityNTU: 0.06,
    mlssMgL: 9500.0,
    doMgL: 2.4,
    temperatureC: 18.5,
    srtDays: 24.5,
    pumpVibrationMmS: 1.5,
    dataQualityFlag: 'GOOD'
  };
  const mriNominal = calculateMultiRiskIndex(nominalSnapshot);
  tests.push({
    id: 'BENCH-4.5A',
    category: 'MULTI_RISK_INDEX',
    name: 'Multi-Risk Index: Nominal Baseline (MRI < 25)',
    description: 'Ensures healthy operating plant receives low risk score in NORMAL category',
    expectedValue: '< 25.0',
    computedValue: mriNominal.totalScore,
    unit: 'Score (0-100)',
    passed: mriNominal.totalScore < 25.0 && mriNominal.riskCategory === 'NORMAL',
    notes: `Calculated total score: ${mriNominal.totalScore}/100. Category: ${mriNominal.riskCategory}.`
  });

  // 12. Multi-Risk Index: High Stress / Multi-Domain Fouling
  const stressedSnapshot: OperationalSnapshot = {
    trainId: 'TRAIN_C',
    tmpKPa: 48.5,
    tmpPrevKPa: 44.0,
    dtMinutes: 60,
    permeabilityNormalized: 85.0,
    fluxGrossLMH: 24.0,
    airScourFlowNm3h: 650.0,
    permeateTurbidityNTU: 0.45,
    mlssMgL: 14500.0,
    doMgL: 0.85,
    temperatureC: 15.0,
    srtDays: 48.0,
    pumpVibrationMmS: 4.8,
    dataQualityFlag: 'BAD'
  };
  const mriStressed = calculateMultiRiskIndex(stressedSnapshot);
  tests.push({
    id: 'BENCH-4.5B',
    category: 'MULTI_RISK_INDEX',
    name: 'Multi-Risk Index: Critical Multi-Domain Risk (MRI >= 75)',
    description: 'Verifies compounding hydraulic, biological, and aeration stresses elevate score into CRITICAL',
    expectedValue: '>= 75.0',
    computedValue: mriStressed.totalScore,
    unit: 'Score (0-100)',
    passed: mriStressed.totalScore >= 75.0 && (mriStressed.riskCategory === 'HIGH' || mriStressed.riskCategory === 'CRITICAL'),
    notes: `Calculated total score: ${mriStressed.totalScore}/100. Category: ${mriStressed.riskCategory}. Dominant: ${mriStressed.dominantFactor}.`
  });

  // 13. Inter-Train Peer Comparison: Z-Score & Outlier Detection
  // Trains A, B, C, D normalized permeability
  const trainPermValues = {
    TRAIN_A: 160.0,
    TRAIN_B: 158.0,
    TRAIN_C: 105.0, // Outlier
    TRAIN_D: 162.0
  };
  const peerRes = calculatePeerComparison('PERMEABILITY_NORMALIZED_20C', 'LMH/bar', trainPermValues);
  // Mean = (160+158+105+162)/4 = 146.25
  // Variance = ((160-146.25)^2 + (158-146.25)^2 + (105-146.25)^2 + (162-146.25)^2) / 3
  // = (189.0625 + 138.0625 + 1701.5625 + 248.0625) / 3 = 2276.75 / 3 = 758.9167
  // StdDev = sqrt(758.9167) = 27.548
  // Train C Z = (105 - 146.25) / 27.548 = -1.50
  // Train C % Dev = (105 - 146.25) / 146.25 = -28.2%
  tests.push({
    id: 'BENCH-4.6A',
    category: 'PEER_COMPARISON',
    name: 'Inter-Train Peer Comparison Outlier Identification',
    description: 'Detects Train C as abnormal divergent outlier relative to Trains A, B, D',
    expectedValue: ['TRAIN_C'],
    computedValue: peerRes.outlierTrains,
    unit: 'train list',
    passed: peerRes.outlierTrains.includes('TRAIN_C') && peerRes.outlierTrains.length === 1,
    notes: `Peer mean: ${peerRes.peerMean} LMH/bar. Train C deviation: ${peerRes.pctDeviations['TRAIN_C']}%. Correctly isolated.`
  });

  // 14. Root-Cause Diagnostic: Fiber Integrity Rupture
  const ruptureSnapshot: OperationalSnapshot = {
    trainId: 'TRAIN_D',
    tmpKPa: 24.0,
    permeabilityNormalized: 160.0,
    fluxGrossLMH: 22.0,
    airScourFlowNm3h: 900.0,
    permeateTurbidityNTU: 0.65, // Spiking
    mlssMgL: 9000.0,
    doMgL: 2.5,
    temperatureC: 19.0,
    srtDays: 25.0
  };
  const hypotheses1 = diagnoseRootCauses(ruptureSnapshot);
  tests.push({
    id: 'BENCH-4.7A',
    category: 'ROOT_CAUSE',
    name: 'Root-Cause Hypothesis: Fiber Integrity Rupture',
    description: 'Infers membrane fiber integrity breach when permeate turbidity spikes above 0.35 NTU',
    expectedValue: 'FAULT_FIBER_RUPTURE',
    computedValue: hypotheses1[0]?.faultCode,
    unit: 'faultCode',
    passed: hypotheses1.length > 0 && hypotheses1[0].faultCode === 'FAULT_FIBER_RUPTURE' && hypotheses1[0].probabilityPct >= 90,
    notes: `Diagnosed ${hypotheses1[0].title} with ${hypotheses1[0].probabilityPct}% confidence.`
  });

  // 15. Root-Cause Diagnostic: Air Scour Aeration Deficit
  const aerationDeficitSnapshot: OperationalSnapshot = {
    trainId: 'TRAIN_B',
    tmpKPa: 42.0,
    permeabilityNormalized: 135.0,
    fluxGrossLMH: 23.0,
    airScourFlowNm3h: 620.0, // Low aeration
    permeateTurbidityNTU: 0.08,
    mlssMgL: 10500.0,
    doMgL: 2.1,
    temperatureC: 18.0,
    srtDays: 26.0
  };
  const hypotheses2 = diagnoseRootCauses(aerationDeficitSnapshot);
  tests.push({
    id: 'BENCH-4.7B',
    category: 'ROOT_CAUSE',
    name: 'Root-Cause Hypothesis: Air Scour Deficit / Header Malfunction',
    description: 'Infers coarse bubble aeration starved cake layer when air scour < 750 and TMP elevated',
    expectedValue: 'FAULT_AERATION_DEFICIT',
    computedValue: hypotheses2[0]?.faultCode,
    unit: 'faultCode',
    passed: hypotheses2.length > 0 && hypotheses2[0].faultCode === 'FAULT_AERATION_DEFICIT',
    notes: `Diagnosed ${hypotheses2[0].title} with ${hypotheses2[0].probabilityPct}% confidence.`
  });

  // 16. Root-Cause Diagnostic: Cold Weather Viscosity Phenomenon
  const coldSnapshot: OperationalSnapshot = {
    trainId: 'TRAIN_A',
    tmpKPa: 43.5, // High uncorrected TMP
    permeabilityNormalized: 165.0, // But healthy normalized permeability!
    fluxGrossLMH: 22.0,
    airScourFlowNm3h: 910.0,
    permeateTurbidityNTU: 0.07,
    mlssMgL: 9800.0,
    doMgL: 2.6,
    temperatureC: 9.5, // Cold wastewater
    srtDays: 24.0
  };
  const hypotheses3 = diagnoseRootCauses(coldSnapshot);
  tests.push({
    id: 'BENCH-4.7C',
    category: 'ROOT_CAUSE',
    name: 'Diagnostic Reasoning: Cold Weather Fluid Drag Separation',
    description: 'Distinguishes genuine foulant cake from Newtonian fluid viscosity increase at 9.5°C',
    expectedValue: 'PHENOMENON_COLD_VISCOSITY',
    computedValue: hypotheses3[0]?.faultCode,
    unit: 'faultCode',
    passed: hypotheses3.length > 0 && hypotheses3[0].faultCode === 'PHENOMENON_COLD_VISCOSITY',
    notes: `Identified ${hypotheses3[0].title}. Prevents unneeded chemical cleans.`
  });

  // 17. Zero-Division & Guard Limit: Zero Delta Time on ROC
  const rocGuard = calculateRateOfChange(25.0, 25.0, 0, 'TRANSMEMBRANE_PRESSURE', 'TRAIN_A', 1.2);
  tests.push({
    id: 'BENCH-4.8A',
    category: 'GUARD_LIMIT',
    name: 'Zero-Division Guard: Zero Elapsed Minutes on ROC',
    description: 'Clamps rate-of-change to 0 without throwing divide-by-zero or producing NaN',
    expectedValue: 0,
    computedValue: rocGuard.ratePerHour,
    unit: 'number',
    passed: rocGuard.ratePerHour === 0 && !isNaN(rocGuard.ratePerHour),
    notes: 'Zero minutes safely trapped.'
  });

  // 18. Zero-Division & Guard Limit: Identical Peer Values (StdDev = 0)
  const identicalPeers = { TRAIN_A: 150.0, TRAIN_B: 150.0, TRAIN_C: 150.0, TRAIN_D: 150.0 };
  const peerGuard = calculatePeerComparison('PERMEABILITY_NORMALIZED_20C', 'LMH/bar', identicalPeers);
  tests.push({
    id: 'BENCH-4.8B',
    category: 'GUARD_LIMIT',
    name: 'Zero-Division Guard: Zero Peer Standard Deviation',
    description: 'Clamps Z-scores to 0.0 when all trains operate at exact identical values',
    expectedValue: 0.0,
    computedValue: peerGuard.zScores['TRAIN_A'],
    unit: 'Z-score',
    passed: peerGuard.zScores['TRAIN_A'] === 0.0 && peerGuard.peerStdDev === 0,
    notes: 'StdDev = 0 safely guarded. All Z-scores 0.0.'
  });

  return tests;
}

// Auto-run when executed directly via tsx/node
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('stage4Benchmark')) {
  console.log('====================================================');
  console.log('UNIT 77 MBR SUPER EXPERT — STAGE 4 BENCHMARK SUITE');
  console.log('Author: Turgunjon Ruziboyev');
  console.log('====================================================');

  const results = runStage4BenchmarkSuite();
  let passCount = 0;
  results.forEach(t => {
    const mark = t.passed ? '[PASS]' : '[FAIL]';
    if (t.passed) passCount++;
    console.log(`${mark} ${t.id}: ${t.name}`);
    console.log(`       Expected: ${t.expectedValue} | Computed: ${t.computedValue} ${t.unit} | Notes: ${t.notes}`);
  });

  console.log('----------------------------------------------------');
  console.log(`TOTAL BENCHMARK TESTS: ${results.length} | PASSED: ${passCount} | FAILED: ${results.length - passCount}`);
  if (passCount === results.length) {
    console.log('>>> STAGE 4 BENCHMARKS: ALL 18 TESTS PASSED [100%] <<<');
  } else {
    console.error('>>> STAGE 4 BENCHMARKS: FAILED <<<');
    process.exit(1);
  }
}
