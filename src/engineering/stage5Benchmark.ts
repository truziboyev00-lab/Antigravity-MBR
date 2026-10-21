/**
 * UNIT 77 MBR SUPER EXPERT — STAGE 5 BENCHMARK SUITE
 * Author: Turgunjon Ruziboyev
 * 
 * Standardized controlled tests verifying:
 *  - Train outage hydraulic flux redistribution & area scaling
 *  - Non-linear TMP power-law response modeling
 *  - Sustainable plant flow capacity bottleneck and curtailment
 *  - Poiseuille dynamic viscosity temperature scaling
 *  - Thermal suction head compensation
 *  - Permeate pump power & Specific Energy Consumption (SEC)
 *  - Biological solids inventory mass balance & continuous SRT
 *  - Accelerated WAS optimization sensitivity
 *  - Multi-variable compound stress-tests
 *  - Zero-division and physical boundary guards
 */

import {
  evaluateWhatIfScenario,
  calculateWaterViscosity,
  DEFAULT_BASELINE_PARAMS,
  DEFAULT_TRAIN_CONFIGS,
  WhatIfScenarioInputs,
  VISCOSITY_20C,
} from './whatIfEngine';

export interface Stage5BenchmarkTestCase {
  id: string;
  category: 'OUTAGE_REDISTRIBUTION' | 'NONLINEAR_TMP' | 'BOTTLENECK_SOLVER' | 'COLD_VISCOSITY' | 'ENERGY_POWER' | 'WAS_SRT' | 'COMPOUND_STRESS' | 'GUARD_LIMIT';
  name: string;
  description: string;
  expectedValue: any;
  computedValue: any;
  tolerancePct?: number;
  unit: string;
  passed: boolean;
  notes: string;
}

export function runStage5BenchmarkSuite(): Stage5BenchmarkTestCase[] {
  const tests: Stage5BenchmarkTestCase[] = [];

  // Helper for tolerance comparison
  function isClose(actual: number, expected: number, tolPct: number = 0.05): boolean {
    if (Math.abs(expected) < 1e-9) return Math.abs(actual) < 1e-9;
    const diff = Math.abs(actual - expected) / Math.abs(expected);
    return diff <= tolPct;
  }

  // --- 1. Train Outage Redistribution (4 to 3 trains) ---
  const sc1: WhatIfScenarioInputs = {
    activeTrainIds: ['TRAIN_A', 'TRAIN_B', 'TRAIN_C'], // 1 train offline
    simulatedWaterTempC: 18.5,
    simulatedWASFlowM3d: 38.0,
  };
  const res1 = evaluateWhatIfScenario(sc1);

  tests.push({
    id: 'BENCH-5.1A',
    category: 'OUTAGE_REDISTRIBUTION',
    name: 'Train Outage Flux Redistribution (3 of 4 Trains Online)',
    description: 'Verifies plant flow (460.8 m³/h) redistributed over 14,400 m² equals exactly 32.0 LMH (+33.3%)',
    expectedValue: 32.0,
    computedValue: Number(res1.simulatedFluxLMH.toFixed(2)),
    tolerancePct: 0.01,
    unit: 'LMH',
    passed: isClose(res1.simulatedFluxLMH, 32.0, 0.001),
    notes: `Active area: ${res1.activeMembraneAreaM2} m². Baseline: 24.0 LMH -> Simulated: ${res1.simulatedFluxLMH.toFixed(2)} LMH (+${res1.fluxIncreasePct.toFixed(1)}%).`
  });

  tests.push({
    id: 'BENCH-5.1B',
    category: 'OUTAGE_REDISTRIBUTION',
    name: 'Active Membrane Area Reduction (14,400 m²)',
    description: 'Verifies sum of online train areas equals 14,400 m² (down from 19,200 m²)',
    expectedValue: 14400,
    computedValue: res1.activeMembraneAreaM2,
    unit: 'm²',
    passed: res1.activeMembraneAreaM2 === 14400 && res1.activeTrainsCount === 3,
    notes: `Active trains: ${res1.activeTrainsCount}/4. Active area: 14,400 m².`
  });

  // --- 2. Non-linear TMP Response ---
  // Baseline avg TMP = (18.5+19.2+21.0)/3 = 19.5667 kPa
  // Flux ratio = 32.0 / 24.0 = 1.33333. Viscosity ratio = 1.0.
  // TMP_sim = 19.5667 * (1.33333)^1.4 = 19.5667 * 1.49305 = 29.21 kPa
  const expectedTMP1 = (18.5 + 19.2 + 21.0) / 3 * Math.pow(32.0 / 24.0, 1.4);
  tests.push({
    id: 'BENCH-5.2A',
    category: 'NONLINEAR_TMP',
    name: 'Non-linear TMP Power-Law Elevation (beta = 1.4)',
    description: 'Verifies non-linear cake compaction elevation under elevated flux ratio',
    expectedValue: Number(expectedTMP1.toFixed(2)),
    computedValue: Number(res1.simulatedTMPkPa.toFixed(2)),
    tolerancePct: 0.05,
    unit: 'kPa',
    passed: isClose(res1.simulatedTMPkPa, expectedTMP1, 0.01),
    notes: `Simulated TMP: ${res1.simulatedTMPkPa.toFixed(2)} kPa vs Expected: ${expectedTMP1.toFixed(2)} kPa (+${res1.tmpIncreasePct.toFixed(1)}%).`
  });

  // Linear Darcy test (beta = 1.0)
  const scLinear: WhatIfScenarioInputs = {
    activeTrainIds: ['TRAIN_A', 'TRAIN_B', 'TRAIN_C'],
    simulatedWaterTempC: 18.5,
    simulatedWASFlowM3d: 38.0,
    fluxNonlinearExponent: 1.0,
  };
  const resLinear = evaluateWhatIfScenario(scLinear);
  const expectedLinearTMP = (18.5 + 19.2 + 21.0) / 3 * (32.0 / 24.0);
  tests.push({
    id: 'BENCH-5.2B',
    category: 'NONLINEAR_TMP',
    name: 'Linear Darcy Law Baseline Response (beta = 1.0)',
    description: 'Verifies pure proportional Darcy response without exponential cake compaction',
    expectedValue: Number(expectedLinearTMP.toFixed(2)),
    computedValue: Number(resLinear.simulatedTMPkPa.toFixed(2)),
    tolerancePct: 0.05,
    unit: 'kPa',
    passed: isClose(resLinear.simulatedTMPkPa, expectedLinearTMP, 0.01),
    notes: `Linear TMP: ${resLinear.simulatedTMPkPa.toFixed(2)} kPa (ratio exactly 1.3333).`
  });

  // --- 3. Sustainable Flow Bottleneck Solver ---
  // Max allowable flux = 30.0 LMH. 3 trains = 14,400 m².
  // Max sustainable plant flow = 14,400 * 30.0 / 1000 = 432.0 m³/h.
  // Target flow = 460.8 m³/h -> Curtailment = 460.8 - 432.0 = 28.8 m³/h (6.25%).
  tests.push({
    id: 'BENCH-5.3A',
    category: 'BOTTLENECK_SOLVER',
    name: 'Maximum Sustainable Plant Flow (30.0 LMH Peak Cap)',
    description: 'Solves maximum plant throughput without exceeding peak flux safety limit',
    expectedValue: 432.0,
    computedValue: Number(res1.maxSustainablePlantFlowM3h.toFixed(1)),
    unit: 'm³/h',
    passed: isClose(res1.maxSustainablePlantFlowM3h, 432.0, 0.001),
    notes: `Max sustainable: 432.0 m³/h with 3 trains online at 30 LMH limit.`
  });

  tests.push({
    id: 'BENCH-5.3B',
    category: 'BOTTLENECK_SOLVER',
    name: 'Automated Hydraulic Flow Curtailment Advisory',
    description: 'Calculates exact required flow curtailment to protect remaining active trains',
    expectedValue: 28.8,
    computedValue: Number(res1.flowCurtailmentM3h.toFixed(1)),
    unit: 'm³/h',
    passed: isClose(res1.flowCurtailmentM3h, 28.8, 0.001) && isClose(res1.flowCurtailmentPct, 6.25, 0.01),
    notes: `Curtailment required: ${res1.flowCurtailmentM3h.toFixed(1)} m³/h (${res1.flowCurtailmentPct.toFixed(2)}%).`
  });

  // --- 4. Cold-Weather Viscosity Scaling ---
  // Test at 8.0°C with all 4 trains online
  const scCold: WhatIfScenarioInputs = {
    activeTrainIds: ['TRAIN_A', 'TRAIN_B', 'TRAIN_C', 'TRAIN_D'],
    simulatedWaterTempC: 8.0,
    simulatedWASFlowM3d: 38.0,
  };
  const resCold = evaluateWhatIfScenario(scCold);
  const mu8 = calculateWaterViscosity(8.0); // ~ 1.385 mPa*s
  const mu18_5 = calculateWaterViscosity(18.5); // ~ 1.042 mPa*s
  const expectedViscRatio = mu8 / mu18_5; // ~ 1.329

  tests.push({
    id: 'BENCH-5.4A',
    category: 'COLD_VISCOSITY',
    name: 'Poiseuille Viscosity Scaling at 8.0°C',
    description: 'Calculates dynamic water viscosity at 8.0°C using empirical exponential model',
    expectedValue: 1.385,
    computedValue: Number(mu8.toFixed(3)),
    tolerancePct: 0.02,
    unit: 'mPa·s',
    passed: isClose(mu8, 1.385, 0.01),
    notes: `Viscosity at 8°C: ${mu8.toFixed(4)} mPa·s vs 20°C: ${VISCOSITY_20C.toFixed(4)} mPa·s.`
  });

  tests.push({
    id: 'BENCH-5.4B',
    category: 'COLD_VISCOSITY',
    name: 'Cold-Weather Viscosity Drag Multiplier (+32.9% vs 18.5°C)',
    description: 'Evaluates fluid friction drag ratio between 8.0°C and 18.5°C baseline',
    expectedValue: Number(expectedViscRatio.toFixed(3)),
    computedValue: Number(resCold.viscosityRatio.toFixed(3)),
    unit: 'ratio',
    passed: isClose(resCold.viscosityRatio, expectedViscRatio, 0.005),
    notes: `Viscosity ratio: ${resCold.viscosityRatio.toFixed(3)} (+${((resCold.viscosityRatio - 1) * 100).toFixed(1)}% drag increase).`
  });

  const avgTMP4 = (18.5 + 19.2 + 21.0 + 20.4) / 4; // 19.775 kPa
  const expectedColdTMP = avgTMP4 * expectedViscRatio; // ~ 26.28 kPa
  tests.push({
    id: 'BENCH-5.4C',
    category: 'COLD_VISCOSITY',
    name: 'Thermal Permeate Suction Head Compensation',
    description: 'Calculates elevated vacuum TMP required to overcome higher fluid viscosity',
    expectedValue: Number(expectedColdTMP.toFixed(2)),
    computedValue: Number(resCold.simulatedTMPkPa.toFixed(2)),
    tolerancePct: 0.02,
    unit: 'kPa',
    passed: isClose(resCold.simulatedTMPkPa, expectedColdTMP, 0.01),
    notes: `Baseline TMP: ${avgTMP4.toFixed(2)} kPa -> Cold TMP: ${resCold.simulatedTMPkPa.toFixed(2)} kPa.`
  });

  // --- 5. Permeate Pumping Power & SEC ---
  // Flow = 460.8 m³/h, TMP = 19.775 kPa
  // Hyd Power = 460.8 * 19.775 / 3600 = 2.5312 kW
  // Elec Power = 2.5312 / 0.75 = 3.3749 kW
  // SEC = 3.3749 / 460.8 = 0.007324 kWh/m³
  const expectedHydKW = (460.8 * avgTMP4) / 3600;
  const expectedElecKW = expectedHydKW / 0.75;
  const expectedSEC = expectedElecKW / 460.8;

  const scNominal: WhatIfScenarioInputs = {
    activeTrainIds: ['TRAIN_A', 'TRAIN_B', 'TRAIN_C', 'TRAIN_D'],
    simulatedWaterTempC: 18.5,
    simulatedWASFlowM3d: 38.0,
  };
  const resNominal = evaluateWhatIfScenario(scNominal);

  tests.push({
    id: 'BENCH-5.5A',
    category: 'ENERGY_POWER',
    name: 'Permeate Pump Hydraulic Power Output',
    description: 'Computes fluid hydraulic power in kW: Q * DeltaP / 3600',
    expectedValue: Number(expectedHydKW.toFixed(3)),
    computedValue: Number(resNominal.pumpHydraulicPowerKW.toFixed(3)),
    unit: 'kW',
    passed: isClose(resNominal.pumpHydraulicPowerKW, expectedHydKW, 0.005),
    notes: `Hydraulic power: ${resNominal.pumpHydraulicPowerKW.toFixed(3)} kW.`
  });

  tests.push({
    id: 'BENCH-5.5B',
    category: 'ENERGY_POWER',
    name: 'Permeate Pump Electrical Power (eta = 75%)',
    description: 'Computes total wire-to-water motor power demand',
    expectedValue: Number(expectedElecKW.toFixed(3)),
    computedValue: Number(resNominal.pumpElectricalPowerKW.toFixed(3)),
    unit: 'kW',
    passed: isClose(resNominal.pumpElectricalPowerKW, expectedElecKW, 0.005),
    notes: `Electrical power: ${resNominal.pumpElectricalPowerKW.toFixed(3)} kW.`
  });

  tests.push({
    id: 'BENCH-5.5C',
    category: 'ENERGY_POWER',
    name: 'Specific Pumping Energy Consumption (SEC in kWh/m³)',
    description: 'Specific electrical power per m³ of treated effluent',
    expectedValue: Number(expectedSEC.toFixed(5)),
    computedValue: Number(resNominal.specificPumpingEnergyKWhM3.toFixed(5)),
    unit: 'kWh/m³',
    passed: isClose(resNominal.specificPumpingEnergyKWhM3, expectedSEC, 0.005),
    notes: `Pumping SEC: ${resNominal.specificPumpingEnergyKWhM3.toFixed(5)} kWh/m³.`
  });

  // --- 6. WAS & SRT Mass Balance ---
  // Aeration basin: 2800 m³ * 7400 mg/L / 1000 = 20,720 kg
  // Membrane tank: 800 m³ * 9200 mg/L / 1000 = 7,360 kg
  // Total inventory = 20,720 + 7,360 = 28,080 kg
  const totalInventoryExpected = 28080.0;
  // Baseline WAS = 38.0 m³/d * 9.2 kg/m³ = 349.6 kg/d
  // Baseline SRT = 28,080 / 349.6 = 80.320 days
  const expectedBaselineSRT = 28080.0 / (38.0 * 9.2);

  tests.push({
    id: 'BENCH-5.6A',
    category: 'WAS_SRT',
    name: 'Total Plant Sludge Solids Inventory Mass Balance',
    description: 'Verifies aggregate bioreactor + membrane basin dry solids inventory (28,080 kg)',
    expectedValue: 28080.0,
    computedValue: resNominal.totalSolidsInventoryKg,
    unit: 'kg',
    passed: resNominal.totalSolidsInventoryKg === 28080.0,
    notes: `Bioreactor: 20,720 kg + Membrane: 7,360 kg = ${resNominal.totalSolidsInventoryKg} kg dry solids.`
  });

  tests.push({
    id: 'BENCH-5.6B',
    category: 'WAS_SRT',
    name: 'Continuous Baseline Solids Retention Time (SRT = 80.3 days)',
    description: 'Evaluates baseline sludge age based on daily WAS mass withdrawal',
    expectedValue: Number(expectedBaselineSRT.toFixed(2)),
    computedValue: Number(resNominal.baselineSRTdays.toFixed(2)),
    unit: 'days',
    passed: isClose(resNominal.baselineSRTdays, expectedBaselineSRT, 0.005),
    notes: `Baseline SRT: ${resNominal.baselineSRTdays.toFixed(2)} days (WAS: 38 m³/d, 349.6 kg/d).`
  });

  // Accelerated WAS rate scenario: WAS = 65 m³/d
  const scWAS: WhatIfScenarioInputs = {
    activeTrainIds: ['TRAIN_A', 'TRAIN_B', 'TRAIN_C', 'TRAIN_D'],
    simulatedWaterTempC: 18.5,
    simulatedWASFlowM3d: 65.0,
  };
  const resWAS = evaluateWhatIfScenario(scWAS);
  const expectedWASMassKgD = 65.0 * 9.2; // 598.0 kg/d
  const expectedSimSRT = 28080.0 / expectedWASMassKgD; // 46.9565 days

  tests.push({
    id: 'BENCH-5.6C',
    category: 'WAS_SRT',
    name: 'Accelerated Sludge Wastage (WAS = 65 m³/d -> SRT = 47.0 days)',
    description: 'Verifies sludge age reduction sensitivity to increased WAS wastage rate',
    expectedValue: Number(expectedSimSRT.toFixed(2)),
    computedValue: Number(resWAS.simulatedSRTdays.toFixed(2)),
    unit: 'days',
    passed: isClose(resWAS.simulatedSRTdays, expectedSimSRT, 0.005),
    notes: `Simulated SRT: ${resWAS.simulatedSRTdays.toFixed(2)} days (delta: ${resWAS.srtChangeDays.toFixed(2)} days).`
  });

  // Nitrification warning check: WAS = 260 m³/d -> SRT < 12 days
  const scLowSRT: WhatIfScenarioInputs = {
    activeTrainIds: ['TRAIN_A', 'TRAIN_B', 'TRAIN_C', 'TRAIN_D'],
    simulatedWaterTempC: 18.5,
    simulatedWASFlowM3d: 260.0,
  };
  const resLowSRT = evaluateWhatIfScenario(scLowSRT);
  tests.push({
    id: 'BENCH-5.6D',
    category: 'WAS_SRT',
    name: 'Nitrification Washout Threshold Protection (SRT < 12 days)',
    description: 'Flags critical biological warning when excessive WAS causes nitrification failure risk',
    expectedValue: true,
    computedValue: resLowSRT.isSRTBelowNitrificationLimit,
    unit: 'boolean',
    passed: resLowSRT.isSRTBelowNitrificationLimit === true && resLowSRT.simulatedSRTdays < 12.0,
    notes: `Simulated SRT: ${resLowSRT.simulatedSRTdays.toFixed(1)} days. Nitrification flag latched.`
  });

  // --- 7. Compound Multi-Variable Stress-Test ---
  const scStress: WhatIfScenarioInputs = {
    activeTrainIds: ['TRAIN_A', 'TRAIN_B', 'TRAIN_C'], // 3 trains
    targetPlantFlowM3h: 530.0,                         // High influent flow (+15%)
    simulatedWaterTempC: 9.0,                          // Cold winter water
    simulatedWASFlowM3d: 38.0,
  };
  const resStress = evaluateWhatIfScenario(scStress);

  tests.push({
    id: 'BENCH-5.7A',
    category: 'COMPOUND_STRESS',
    name: 'Compound Hydraulic & Thermal Extreme Stress Classification',
    description: 'Evaluates compound multi-fault scenario (Outage + Cold + Surge) and latches CRITICAL severity',
    expectedValue: 'CRITICAL',
    computedValue: resStress.bottleneckSeverity,
    unit: 'severity',
    passed: resStress.bottleneckSeverity === 'CRITICAL' && resStress.isFluxOverLimit === true,
    notes: `Flux: ${resStress.simulatedFluxLMH.toFixed(1)} LMH (> 30 limit), TMP: ${resStress.simulatedTMPkPa.toFixed(1)} kPa. Severity: CRITICAL.`
  });

  // --- 8. Zero-Division & Edge-Case Guards ---
  // All trains offline
  const scZeroTrains: WhatIfScenarioInputs = {
    activeTrainIds: [],
    simulatedWaterTempC: 18.5,
    simulatedWASFlowM3d: 38.0,
  };
  const resZeroTrains = evaluateWhatIfScenario(scZeroTrains);

  tests.push({
    id: 'BENCH-5.8A',
    category: 'GUARD_LIMIT',
    name: 'Zero-Division Guard: Zero Active Trains Online',
    description: 'Safely clamps flux to 0 LMH and 100% flow curtailment without NaN or Infinity',
    expectedValue: 0,
    computedValue: resZeroTrains.simulatedFluxLMH,
    unit: 'LMH',
    passed: resZeroTrains.simulatedFluxLMH === 0 && !isNaN(resZeroTrains.simulatedTMPkPa) && isFinite(resZeroTrains.simulatedTMPkPa),
    notes: `Safely returned 0 LMH flux and 100% curtailment without crash.`
  });

  // Zero WAS flow
  const scZeroWAS: WhatIfScenarioInputs = {
    activeTrainIds: ['TRAIN_A', 'TRAIN_B', 'TRAIN_C', 'TRAIN_D'],
    simulatedWaterTempC: 18.5,
    simulatedWASFlowM3d: 0,
  };
  const resZeroWAS = evaluateWhatIfScenario(scZeroWAS);

  tests.push({
    id: 'BENCH-5.8B',
    category: 'GUARD_LIMIT',
    name: 'Zero-Division Guard: Zero Daily WAS Flow',
    description: 'Clamps zero sludge wastage safely to maximum upper physical bound without Infinity crash',
    expectedValue: true,
    computedValue: isFinite(resZeroWAS.simulatedSRTdays),
    unit: 'boolean',
    passed: isFinite(resZeroWAS.simulatedSRTdays) && !isNaN(resZeroWAS.simulatedSRTdays),
    notes: `SRT clamped safely at ${resZeroWAS.simulatedSRTdays.toFixed(1)} days.`
  });

  return tests;
}

// Standalone execution entry point
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('stage5Benchmark')) {
  console.log('====================================================');
  console.log('UNIT 77 MBR SUPER EXPERT — STAGE 5 BENCHMARK SUITE');
  console.log('Author: Turgunjon Ruziboyev');
  console.log('====================================================');

  const tests = runStage5BenchmarkSuite();
  let passedCount = 0;

  tests.forEach(t => {
    if (t.passed) {
      passedCount++;
      console.log(`[PASS] ${t.id}: ${t.name}`);
      console.log(`       Expected: ${t.expectedValue} | Computed: ${t.computedValue} ${t.unit} | Notes: ${t.notes}`);
    } else {
      console.error(`[FAIL] ${t.id}: ${t.name}`);
      console.error(`       Expected: ${t.expectedValue} | Computed: ${t.computedValue} ${t.unit} | Notes: ${t.notes}`);
    }
  });

  console.log('----------------------------------------------------');
  console.log(`TOTAL BENCHMARK TESTS: ${tests.length} | PASSED: ${passedCount} | FAILED: ${tests.length - passedCount}`);
  if (passedCount === tests.length) {
    console.log(`>>> STAGE 5 BENCHMARKS: ALL ${tests.length} TESTS PASSED [100%] <<<`);
  } else {
    process.exitCode = 1;
  }
}
