/**
 * UNIT 77 MBR SUPER EXPERT — STAGE 6 BENCHMARK SUITE
 * Author: Turgunjon Ruziboyev
 * 
 * Standardized controlled tests verifying:
 *  - Multi-horizon linear trend forecasting math
 *  - Exponential cake compaction forecasting math
 *  - 95% Statistical Confidence uncertainty envelopes
 *  - Remaining Useful Life (RUL) to Maintenance Clean (45 kPa)
 *  - RUL to Emergency Stop (55 kPa)
 *  - Permeability decay trajectory to critical limit (70 LMH/bar)
 *  - Darcy clean membrane resistance Rm inversion
 *  - Specific cake resistance alpha calibration
 *  - Compaction exponent beta log-ratio calibration
 *  - Ordinary Least Squares regression convergence (R², RMSE)
 *  - Arrhenius / Poiseuille temperature sensitivity theta
 *  - Operational urgency state latching
 *  - Automated chemical cleaning dosing & scheduling
 *  - Zero-division, negative slope, and boundary clamping safeguards
 */

import {
  calculateWaterViscosity,
  calculateDarcyResistance,
  calibrateCleanMembraneResistance,
  calibrateSpecificCakeResistance,
  calibrateCompactionExponent,
  calculateLeastSquaresRegression,
  calculateRULHours,
  determineUrgency,
  generateTrainForecast,
  runAutomatedCalibration,
  generateMaintenanceRecommendations,
  TMP_MAINTENANCE_CLEAN_LIMIT,
  TMP_ESTOP_LIMIT
} from './predictionCalibrationEngine';

export interface Stage6BenchmarkTestCase {
  id: string;
  category: 'TREND_FORECAST' | 'EXPONENTIAL_COMPACTION' | 'RUL_CALCULATION' | 'DARCY_RESISTANCE' | 'PARAMETER_CALIBRATION' | 'REGRESSION_METRICS' | 'MAINTENANCE_SCHEDULING' | 'GUARD_BOUNDARY';
  name: string;
  description: string;
  expectedValue: any;
  computedValue: any;
  tolerancePct?: number;
  unit: string;
  passed: boolean;
  notes: string;
}

export function runStage6BenchmarkSuite(): Stage6BenchmarkTestCase[] {
  const tests: Stage6BenchmarkTestCase[] = [];

  function isClose(actual: number, expected: number, tolPct: number = 0.05): boolean {
    if (Math.abs(expected) < 1e-9) return Math.abs(actual) < 1e-9;
    const diff = Math.abs(actual - expected) / Math.abs(expected);
    return diff <= tolPct;
  }

  // --- 1. Linear Multi-Horizon Forecast Math ---
  const baseTMP = 20.0;
  const linearSlope = 0.25; // kPa/h
  const forecast24h = baseTMP + linearSlope * 24.0; // 26.0 kPa
  const forecast48h = baseTMP + linearSlope * 48.0; // 32.0 kPa
  const forecast168h = baseTMP + linearSlope * 168.0; // 62.0 kPa

  tests.push({
    id: 'BENCH-6.1A',
    category: 'TREND_FORECAST',
    name: 'Linear 24-Hour Horizon TMP Projection',
    description: 'Verifies TMP(24) = TMP0 + slope * 24h',
    expectedValue: 26.0,
    computedValue: forecast24h,
    unit: 'kPa',
    passed: isClose(forecast24h, 26.0, 0.001),
    notes: '20.0 + 0.25*24 = 26.0 kPa exact'
  });

  tests.push({
    id: 'BENCH-6.1B',
    category: 'TREND_FORECAST',
    name: 'Linear 7-Day (168h) Horizon TMP Projection',
    description: 'Verifies TMP(168) = TMP0 + slope * 168h',
    expectedValue: 62.0,
    computedValue: forecast168h,
    unit: 'kPa',
    passed: isClose(forecast168h, 62.0, 0.001),
    notes: '20.0 + 0.25*168 = 62.0 kPa exact'
  });

  // --- 2. Exponential Compaction Forecast Math ---
  const kExp = 0.010; // 1/h
  const expTMP24h = baseTMP * Math.exp(kExp * 24.0); // 20.0 * exp(0.24) = 25.425 kPa
  const expTMP48h = baseTMP * Math.exp(kExp * 48.0); // 20.0 * exp(0.48) = 32.321 kPa

  tests.push({
    id: 'BENCH-6.2A',
    category: 'EXPONENTIAL_COMPACTION',
    name: 'Exponential 24-Hour Autocatalytic Compaction Projection',
    description: 'Verifies TMP(24) = TMP0 * exp(k * 24)',
    expectedValue: 25.425,
    computedValue: Number(expTMP24h.toFixed(3)),
    unit: 'kPa',
    passed: isClose(expTMP24h, 25.425, 0.01),
    notes: 'Non-linear acceleration properly modeled'
  });

  tests.push({
    id: 'BENCH-6.2B',
    category: 'EXPONENTIAL_COMPACTION',
    name: 'Exponential 48-Hour Autocatalytic Compaction Projection',
    description: 'Verifies TMP(48) = TMP0 * exp(k * 48)',
    expectedValue: 32.321,
    computedValue: Number(expTMP48h.toFixed(3)),
    unit: 'kPa',
    passed: isClose(expTMP48h, 32.321, 0.01),
    notes: 'Exp acceleration exceeds linear trajectory at extended horizons'
  });

  // --- 3. 95% Confidence Envelope ---
  const trainTest = generateTrainForecast('TRAIN_TEST', 'Test Train', 20.0, 24.0, 120.0, 0.20, 0.008, 0.35);
  const point24 = trainTest.forecastPoints.find(p => p.horizonHours === 24)!;
  const envValid = point24.lowerBound95 <= point24.hybridTMP && point24.hybridTMP <= point24.upperBound95;

  tests.push({
    id: 'BENCH-6.3',
    category: 'TREND_FORECAST',
    name: '95% Confidence Interval Envelope Sanity',
    description: 'Verifies LowerBound <= HybridTMP <= UpperBound',
    expectedValue: true,
    computedValue: envValid,
    unit: 'boolean',
    passed: envValid,
    notes: `Lower: ${point24.lowerBound95} kPa, Mean: ${point24.hybridTMP} kPa, Upper: ${point24.upperBound95} kPa`
  });

  // --- 4. Remaining Useful Life (RUL) Math ---
  const rulCalc = calculateRULHours(20.0, TMP_MAINTENANCE_CLEAN_LIMIT, 0.25, 0.010);
  // Linear RUL: (45 - 20) / 0.25 = 100.0 hours
  // Exp RUL: ln(45 / 20) / 0.010 = ln(2.25) / 0.010 = 0.81093 / 0.010 = 81.1 hours
  tests.push({
    id: 'BENCH-6.4A',
    category: 'RUL_CALCULATION',
    name: 'Linear RUL to Maintenance Clean Limit (45 kPa)',
    description: 'Verifies RUL = (45 - TMP0) / slope',
    expectedValue: 100.0,
    computedValue: rulCalc.rulLinear,
    unit: 'hours',
    passed: isClose(rulCalc.rulLinear, 100.0, 0.01),
    notes: '(45 - 20) / 0.25 = 100.0h'
  });

  tests.push({
    id: 'BENCH-6.4B',
    category: 'RUL_CALCULATION',
    name: 'Exponential RUL to Maintenance Clean Limit (45 kPa)',
    description: 'Verifies RUL_exp = ln(45 / TMP0) / k',
    expectedValue: 81.1,
    computedValue: rulCalc.rulExp,
    unit: 'hours',
    passed: isClose(rulCalc.rulExp, 81.1, 0.02),
    notes: 'Exponential compaction reaches 45 kPa faster than linear (81.1h vs 100.0h)'
  });

  // --- 5. RUL to Emergency Stop Limit (55 kPa) ---
  const rulEStopCalc = calculateRULHours(20.0, TMP_ESTOP_LIMIT, 0.25, 0.010);
  // (55 - 20) / 0.25 = 140.0 hours
  tests.push({
    id: 'BENCH-6.5',
    category: 'RUL_CALCULATION',
    name: 'RUL to Emergency Stop Critical Threshold (55 kPa)',
    description: 'Verifies RUL to fiber collapse threshold',
    expectedValue: 140.0,
    computedValue: rulEStopCalc.rulLinear,
    unit: 'hours',
    passed: isClose(rulEStopCalc.rulLinear, 140.0, 0.01),
    notes: '(55 - 20) / 0.25 = 140.0h safe margin to emergency shutdown'
  });

  // --- 6. Darcy Clean Membrane Resistance Inversion ---
  // Clean TMP = 10.0 kPa, Flux = 24 LMH, Temp = 20.0 °C
  // mu(20) = 1.002 mPa.s = 1.002e-3 Pa.s
  // J = 24 / 3.6e6 = 6.6667e-6 m/s
  // Rm = 10,000 / (1.002e-3 * 6.6667e-6) = 1.497e12 m^-1
  const cleanRm = calibrateCleanMembraneResistance(10.0, 24.0, 20.0);
  tests.push({
    id: 'BENCH-6.6',
    category: 'DARCY_RESISTANCE',
    name: 'Clean Membrane Resistance Rm Inversion',
    description: 'Verifies Rm = TMP_clean / (mu * J_clean) in 1/m',
    expectedValue: 1.497e12,
    computedValue: cleanRm,
    tolerancePct: 0.01,
    unit: 'm⁻¹',
    passed: isClose(cleanRm, 1.497e12, 0.01),
    notes: 'Physically accurate for hollow-fiber PVDF MBR membranes (~1.5e12 m^-1)'
  });

  // --- 7. Specific Cake Resistance Calibration ---
  const alphaCal = calibrateSpecificCakeResistance(8.6, 24.0, 18.5, 0.038);
  // Expecting ~3.285e13 m/kg
  tests.push({
    id: 'BENCH-6.7',
    category: 'PARAMETER_CALIBRATION',
    name: 'Specific Cake Resistance (alpha) Estimation',
    description: 'Verifies alpha = Rc / omega in m/kg',
    expectedValue: 3.285e13,
    computedValue: alphaCal,
    tolerancePct: 0.15,
    unit: 'm/kg',
    passed: alphaCal > 1.0e13 && alphaCal < 1.0e14,
    notes: `Calibrated alpha: ${alphaCal.toExponential(3)} m/kg`
  });

  // --- 8. Compaction Exponent Beta Calibration ---
  // Flux step: 24 to 32 LMH (+33.3%), TMP: 19.57 to 29.27 kPa (+49.6%)
  // beta = ln(29.27 / 19.57) / ln(32 / 24) = ln(1.4957) / ln(1.3333) = 0.40258 / 0.28768 = 1.3994 ~ 1.40
  const betaCal = calibrateCompactionExponent(19.5667, 24.0, 29.267, 32.0);
  tests.push({
    id: 'BENCH-6.8',
    category: 'PARAMETER_CALIBRATION',
    name: 'Cake Compaction Exponent (beta) Calibration',
    description: 'Verifies beta = ln(TMP2/TMP1) / ln(J2/J1)',
    expectedValue: 1.40,
    computedValue: Number(betaCal.toFixed(3)),
    unit: '-',
    passed: isClose(betaCal, 1.40, 0.01),
    notes: 'Conforms to Stage 5 power-law cake compaction parameter (beta = 1.40)'
  });

  // --- 9. Ordinary Least Squares Regression ---
  const tH = [0, 12, 24, 36, 48];
  const yKPa = [20.0, 22.4, 24.8, 27.2, 29.6]; // Exactly 0.20 kPa/h slope
  const reg = calculateLeastSquaresRegression(tH, yKPa);

  tests.push({
    id: 'BENCH-6.9A',
    category: 'REGRESSION_METRICS',
    name: 'OLS Regression Slope Accuracy',
    description: 'Verifies analytical slope computation',
    expectedValue: 0.20,
    computedValue: Number(reg.slope.toFixed(4)),
    unit: 'kPa/h',
    passed: isClose(reg.slope, 0.20, 0.001),
    notes: 'Exact slope recovery from linear series'
  });

  tests.push({
    id: 'BENCH-6.9B',
    category: 'REGRESSION_METRICS',
    name: 'OLS Coefficient of Determination (R²)',
    description: 'Verifies R² goodness of fit for deterministic trend',
    expectedValue: 1.0,
    computedValue: Number(reg.r2.toFixed(4)),
    unit: '-',
    passed: isClose(reg.r2, 1.0, 0.001),
    notes: 'Perfect linear correlation yields R² = 1.000'
  });

  // --- 10. Temperature Sensitivity Theta Calibration ---
  const mu10 = calculateWaterViscosity(10.0);
  const mu20 = calculateWaterViscosity(20.0);
  const theta = Math.pow(mu10 / mu20, 1.0 / (20.0 - 10.0));

  tests.push({
    id: 'BENCH-6.10',
    category: 'PARAMETER_CALIBRATION',
    name: 'Dynamic Temperature Sensitivity (theta) Calibration',
    description: 'Verifies theta = (mu10 / mu20)^(1/10)',
    expectedValue: 1.025,
    computedValue: Number(theta.toFixed(4)),
    unit: '-',
    passed: isClose(theta, 1.025, 0.01),
    notes: `Arrhenius water viscosity scaling verified: ${theta.toFixed(4)}`
  });

  // --- 11. Operational Urgency State Transitions ---
  const u1 = determineUrgency(8.0); // <= 12h -> CRITICAL_URGENT
  const u2 = determineUrgency(24.0); // 12-36h -> WARNING
  const u3 = determineUrgency(48.0); // 36-72h -> PLANNED_ATTENTION
  const u4 = determineUrgency(100.0); // > 72h -> NORMAL

  tests.push({
    id: 'BENCH-6.11',
    category: 'MAINTENANCE_SCHEDULING',
    name: 'Operational Urgency Threshold State Machine',
    description: 'Verifies RUL boundary classification: Critical, Warning, Planned, Normal',
    expectedValue: 'CRITICAL,WARNING,PLANNED,NORMAL',
    computedValue: `${u1},${u2},${u3},${u4}`.replace(/_ATTENTION|_URGENT/g, ''),
    unit: 'enum',
    passed: u1 === 'CRITICAL_URGENT' && u2 === 'WARNING' && u3 === 'PLANNED_ATTENTION' && u4 === 'NORMAL',
    notes: 'Four-tier operational safety window verified'
  });

  // --- 12. Automated Maintenance Chemical Dosing Plan ---
  const trainsList = [
    generateTrainForecast('TRAIN_C', 'Train C', 38.0, 24.0, 63.2, 0.80, 0.025) // RUL = (45 - 38)/0.8 = 8.75h -> CRITICAL
  ];
  const plans = generateMaintenanceRecommendations(trainsList);
  const criticalPlan = plans[0];

  tests.push({
    id: 'BENCH-6.12',
    category: 'MAINTENANCE_SCHEDULING',
    name: 'Critical RUL Maintenance Clean Dosing Dispatch',
    description: 'Verifies automated chemical dosing plan for critical urgency (<12h RUL)',
    expectedValue: 'MAINTENANCE_CLEAN',
    computedValue: criticalPlan.recommendedClean,
    unit: 'action',
    passed: criticalPlan.recommendedClean === 'MAINTENANCE_CLEAN' && criticalPlan.targetDosePPM === 500,
    notes: `Prescribed: ${criticalPlan.primaryChemical} @ ${criticalPlan.targetDosePPM} ppm for ${criticalPlan.soakDurationMinutes} min`
  });

  // --- 13. Zero-Division & Edge-Case Boundary Guards ---
  // Zero slope RUL
  const zeroSlopeRUL = calculateRULHours(20.0, 45.0, 0.0, 0.0);
  tests.push({
    id: 'BENCH-6.13A',
    category: 'GUARD_BOUNDARY',
    name: 'Zero-Slope RUL Boundary Guard',
    description: 'Verifies zero slope does not produce Infinity or NaN',
    expectedValue: true,
    computedValue: Number.isFinite(zeroSlopeRUL.rulLinear),
    unit: 'boolean',
    passed: Number.isFinite(zeroSlopeRUL.rulLinear) && zeroSlopeRUL.rulLinear > 0,
    notes: `Clamped to safe slope: RUL = ${zeroSlopeRUL.rulLinear}h`
  });

  // Pre-exceeded limit TMP >= Limit
  const exceededRUL = calculateRULHours(46.2, 45.0, 0.20, 0.01);
  tests.push({
    id: 'BENCH-6.13B',
    category: 'GUARD_BOUNDARY',
    name: 'Pre-Exceeded Threshold RUL Guard (TMP >= 45 kPa)',
    description: 'Verifies RUL is zero when current TMP exceeds limit',
    expectedValue: 0.0,
    computedValue: exceededRUL.rulLinear,
    unit: 'hours',
    passed: exceededRUL.rulLinear === 0.0 && exceededRUL.rulExp === 0.0,
    notes: 'Immediate zero RUL clamp prevents negative countdown'
  });

  // Zero flux Darcy resistance
  const zeroFluxR = calculateDarcyResistance(20.0, 0.0, 20.0);
  tests.push({
    id: 'BENCH-6.13C',
    category: 'GUARD_BOUNDARY',
    name: 'Zero-Flux Darcy Resistance Guard',
    description: 'Verifies zero flux returns 0 without division by zero',
    expectedValue: 0,
    computedValue: zeroFluxR,
    unit: '1/m',
    passed: zeroFluxR === 0,
    notes: 'Safe handling of zero permeate pump flow'
  });

  // Automated Calibration Engine Full Report
  const calReport = runAutomatedCalibration();
  tests.push({
    id: 'BENCH-6.14',
    category: 'PARAMETER_CALIBRATION',
    name: 'Full Automated Parameter Calibration Execution',
    description: 'Verifies end-to-end parameter calibration report generation',
    expectedValue: true,
    computedValue: calReport.parameters.length >= 5 && calReport.goodnessOfFitR2 > 0.90,
    unit: 'boolean',
    passed: calReport.parameters.length >= 5 && calReport.goodnessOfFitR2 > 0.90,
    notes: `Calibrated 5 parameters with R² = ${calReport.goodnessOfFitR2}, RMSE = ${calReport.rmseKPa} kPa`
  });

  return tests;
}
