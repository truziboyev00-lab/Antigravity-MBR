/**
 * UNIT 77 MBR SUPER EXPERT — WHAT-IF & SCENARIO MODELING ENGINE
 * Author: Turgunjon Ruziboyev
 * 
 * Implements physics-grounded mathematical models for:
 *  1. Dynamic Train Outage Redistribution & Flux Scaling
 *  2. Non-linear Transmembrane Pressure (TMP) response under elevated flux
 *  3. Sustainable Flow Bottleneck & Curtailment Solver
 *  4. Poiseuille Temperature-Viscosity Compensation & Head Loss
 *  5. Permeate Pump Power & Specific Energy Consumption (SEC in kWh/m3)
 *  6. Daily WAS Sludge Wastage, Continuous SRT & Solids Inventory
 *  7. Aeration Scour Optimization (SADm, SADp)
 *  8. Multi-Variable Compound Stress-Test Matrix
 *  9. Zero-division and physical boundary safeguards
 */

import { plantConfigManager } from '../foundation/plantConfigManager';

export interface TrainConfig {
  trainId: string;
  name: string;
  membraneAreaM2: number;
  isOnline: boolean;
  baselineFluxLMH: number;
  baselineTMPkPa: number;
  baselineAirFlowNm3h: number;
}

export function normalizeTrainId(id: string): string {
  const norm = id.trim().toUpperCase();
  const legacyMap: Record<string, string> = {
    'TRAIN_A': 'T01', 'TRAIN_B': 'T02', 'TRAIN_C': 'T03', 'TRAIN_D': 'T04',
    'TRAIN_E': 'T05', 'TRAIN_F': 'T06', 'TRAIN_G': 'T07',
    'A': 'T01', 'B': 'T02', 'C': 'T03', 'D': 'T04', 'E': 'T05', 'F': 'T06', 'G': 'T07'
  };
  return legacyMap[norm] || norm;
}

export const DEFAULT_TRAIN_CONFIGS: TrainConfig[] = plantConfigManager.getAllTrains().map(t => ({
  trainId: t.trainId,
  name: t.trainName,
  membraneAreaM2: t.membraneAreaM2,
  isOnline: t.installed && t.operatingStatus === 'ONLINE',
  baselineFluxLMH: t.designFluxLmh,
  baselineTMPkPa: 19.5,
  baselineAirFlowNm3h: 1344.0,
}));

export interface WhatIfBaselineParams {
  totalPlantFlowM3h: number;       // e.g. 460.8 m3/h
  waterTemperatureC: number;       // e.g. 18.5 °C
  dailyWASVolumeM3d: number;       // e.g. 38.0 m3/d
  aerationTankMLSSmgL: number;     // e.g. 7400 mg/L
  membraneTankMLSSmgL: number;     // e.g. 9200 mg/L
  aerationBasinVolumeM3: number;   // e.g. 2800 m3
  membraneTankVolumeM3: number;     // e.g. 800 m3
  pumpEfficiency: number;          // e.g. 0.75 (75%)
  blowerEfficiency: number;        // e.g. 0.70 (70%)
  maxAllowableFluxLMH: number;     // e.g. 30.0 LMH peak limit
  maxAllowableTMPkPa: number;      // e.g. 45.0 kPa critical trip limit
}

export interface WhatIfScenarioInputs {
  activeTrainIds: string[];         // e.g. ['T01', 'T02', 'T03'] (Train 4 offline)
  targetPlantFlowM3h?: number;      // optional override of plant flow
  simulatedWaterTempC: number;      // e.g. 10.0 °C
  simulatedWASFlowM3d: number;      // e.g. 55.0 m3/d
  simulatedAirFlowNm3h?: number;    // optional override of air flow per train
  fluxNonlinearExponent?: number;   // beta exponent, default 1.4
}

export interface WhatIfScenarioResult {
  // Train & Hydraulic Status
  totalTrainsCount: number;
  activeTrainsCount: number;
  activeMembraneAreaM2: number;
  baselinePlantFlowM3h: number;
  effectivePlantFlowM3h: number;
  flowCurtailmentM3h: number;
  flowCurtailmentPct: number;
  
  // Flux Metrics
  baselineFluxLMH: number;
  simulatedFluxLMH: number;
  fluxIncreasePct: number;
  isFluxOverLimit: boolean;
  maxSustainablePlantFlowM3h: number;

  // Temperature & Viscosity
  baselineTempC: number;
  simulatedTempC: number;
  baselineViscosityMpaS: number;
  simulatedViscosityMpaS: number;
  viscosityRatio: number;          // mu_sim / mu_base
  viscosityRatio20: number;        // mu_sim / mu_20

  // Pressure & Energy
  baselineTMPkPa: number;
  simulatedTMPkPa: number;
  tmpIncreasePct: number;
  isTMPOverLimit: boolean;
  pumpHydraulicPowerKW: number;
  pumpElectricalPowerKW: number;
  specificPumpingEnergyKWhM3: number;
  pumpingEnergyDeltaPct: number;

  // Biology & SRT
  baselineSRTdays: number;
  simulatedSRTdays: number;
  srtChangeDays: number;
  totalSolidsInventoryKg: number;
  dailySolidsWastedKgD: number;
  sludgeProductionKgD: number;
  projectedEquilibriumMLSSmgL: number;
  isSRTBelowNitrificationLimit: boolean; // < 12 days warning

  // Aeration & Specific Air Demand
  simulatedAirFlowPerTrainNm3h: number;
  totalAirFlowNm3h: number;
  simulatedSADmNm3m2h: number;
  simulatedSADpNm3m3: number;

  // Scenario Risk Category
  bottleneckSeverity: 'NOMINAL' | 'MODERATE' | 'WARNING' | 'CRITICAL';
  recommendedActions: string[];
}

export const DEFAULT_BASELINE_PARAMS: WhatIfBaselineParams = {
  totalPlantFlowM3h: 460.8,
  waterTemperatureC: 18.5,
  dailyWASVolumeM3d: 38.0,
  aerationTankMLSSmgL: 7400,
  membraneTankMLSSmgL: 9200,
  aerationBasinVolumeM3: 2800,
  membraneTankVolumeM3: 800,
  pumpEfficiency: 0.75,
  blowerEfficiency: 0.70,
  maxAllowableFluxLMH: 30.0,
  maxAllowableTMPkPa: 45.0,
};

/**
 * Standard dynamic viscosity of pure water (Poiseuille model) in mPa*s (cP)
 * mu(T) = 1.787 * exp(-0.0337 * T + 0.000221 * T^2)
 */
export function calculateWaterViscosity(tempC: number): number {
  const safeTemp = Math.max(0.1, Math.min(80.0, tempC));
  return 1.787 * Math.exp(-0.0337 * safeTemp + 0.000221 * Math.pow(safeTemp, 2));
}

/**
 * Viscosity correction factor normalized to 20°C:
 * mu(20°C) = 1.002 mPa*s
 */
export const VISCOSITY_20C = calculateWaterViscosity(20.0); // ~ 1.0019 mPa*s

/**
 * Evaluates What-If Scenario with complete physics & biological mass balance
 */
export function evaluateWhatIfScenario(
  scenario: WhatIfScenarioInputs,
  baseline: WhatIfBaselineParams = DEFAULT_BASELINE_PARAMS,
  trainConfigs: TrainConfig[] = DEFAULT_TRAIN_CONFIGS
): WhatIfScenarioResult {
  const totalTrainsCount = trainConfigs.length;
  const normalizedActiveIds = scenario.activeTrainIds.map((id: string) => normalizeTrainId(id));
  const activeTrains = trainConfigs.filter(t => 
    normalizedActiveIds.includes(normalizeTrainId(t.trainId))
  );
  const activeTrainsCount = activeTrains.length;
  
  // Membrane Area
  const activeMembraneAreaM2 = activeTrains.reduce((sum, t) => sum + t.membraneAreaM2, 0);
  const totalMembraneAreaM2 = trainConfigs.reduce((sum, t) => sum + t.membraneAreaM2, 0);

  // Plant Flow
  const targetPlantFlowM3h = scenario.targetPlantFlowM3h !== undefined ? scenario.targetPlantFlowM3h : baseline.totalPlantFlowM3h;

  // Safe flow calculation: if all trains offline (edge case)
  let simulatedFluxLMH = 0;
  let flowCurtailmentM3h = 0;
  let effectivePlantFlowM3h = targetPlantFlowM3h;
  let maxSustainablePlantFlowM3h = 0;

  if (activeMembraneAreaM2 > 0) {
    simulatedFluxLMH = (targetPlantFlowM3h * 1000) / activeMembraneAreaM2;
    maxSustainablePlantFlowM3h = (activeMembraneAreaM2 * baseline.maxAllowableFluxLMH) / 1000;

    if (simulatedFluxLMH > baseline.maxAllowableFluxLMH) {
      flowCurtailmentM3h = targetPlantFlowM3h - maxSustainablePlantFlowM3h;
    }
  } else {
    // All trains offline
    simulatedFluxLMH = 0;
    maxSustainablePlantFlowM3h = 0;
    flowCurtailmentM3h = targetPlantFlowM3h;
  }

  const flowCurtailmentPct = targetPlantFlowM3h > 0 ? (flowCurtailmentM3h / targetPlantFlowM3h) * 100 : 0;
  const baselineFluxLMH = totalMembraneAreaM2 > 0 ? (baseline.totalPlantFlowM3h * 1000) / totalMembraneAreaM2 : 24.0;
  const fluxIncreasePct = baselineFluxLMH > 0 ? ((simulatedFluxLMH - baselineFluxLMH) / baselineFluxLMH) * 100 : 0;
  const isFluxOverLimit = simulatedFluxLMH > baseline.maxAllowableFluxLMH;

  // Temperature & Viscosity
  const baselineViscosityMpaS = calculateWaterViscosity(baseline.waterTemperatureC);
  const simulatedViscosityMpaS = calculateWaterViscosity(scenario.simulatedWaterTempC);
  const viscosityRatio = baselineViscosityMpaS > 0 ? simulatedViscosityMpaS / baselineViscosityMpaS : 1.0;
  const viscosityRatio20 = VISCOSITY_20C > 0 ? simulatedViscosityMpaS / VISCOSITY_20C : 1.0;

  // Baseline Average TMP
  const baselineAvgTMP = activeTrains.length > 0 
    ? activeTrains.reduce((sum, t) => sum + t.baselineTMPkPa, 0) / activeTrains.length 
    : 20.0;

  // Non-linear TMP rise model:
  // TMP_sim = TMP_base * (J_sim / J_base)^beta * (mu_sim / mu_base)
  const beta = scenario.fluxNonlinearExponent || 1.4;
  let simulatedTMPkPa = 0;
  if (baselineFluxLMH > 0 && simulatedFluxLMH > 0) {
    const fluxRatio = simulatedFluxLMH / baselineFluxLMH;
    simulatedTMPkPa = baselineAvgTMP * Math.pow(fluxRatio, beta) * viscosityRatio;
  } else if (simulatedFluxLMH === 0) {
    simulatedTMPkPa = 0;
  }
  const tmpIncreasePct = baselineAvgTMP > 0 ? ((simulatedTMPkPa - baselineAvgTMP) / baselineAvgTMP) * 100 : 0;
  const isTMPOverLimit = simulatedTMPkPa > baseline.maxAllowableTMPkPa;

  // Permeate Pumping Energy
  // Hydraulic Power (kW) = Q (m3/s) * Delta P (Pa) / 1000 = (Q_m3h / 3600) * (TMP_kPa * 1000) / 1000 = (Q_m3h * TMP_kPa) / 3600
  const pumpHydraulicPowerKW = (effectivePlantFlowM3h * simulatedTMPkPa) / 3600;
  const pumpElectricalPowerKW = baseline.pumpEfficiency > 0 ? pumpHydraulicPowerKW / baseline.pumpEfficiency : 0;
  const specificPumpingEnergyKWhM3 = effectivePlantFlowM3h > 0 ? pumpElectricalPowerKW / effectivePlantFlowM3h : 0;
  
  const baselineHydPowerKW = (baseline.totalPlantFlowM3h * baselineAvgTMP) / 3600;
  const baselineElecPowerKW = baseline.pumpEfficiency > 0 ? baselineHydPowerKW / baseline.pumpEfficiency : 0;
  const baselineSpecificPumpingEnergy = baseline.totalPlantFlowM3h > 0 ? baselineElecPowerKW / baseline.totalPlantFlowM3h : 0;
  const pumpingEnergyDeltaPct = baselineSpecificPumpingEnergy > 0 
    ? ((specificPumpingEnergyKWhM3 - baselineSpecificPumpingEnergy) / baselineSpecificPumpingEnergy) * 100 
    : 0;

  // Biology & SRT (Solids Retention Time)
  // Total Inventory = V_aer * X_aer + V_mbr * X_mbr (kg)
  const aerationSolidsKg = (baseline.aerationBasinVolumeM3 * baseline.aerationTankMLSSmgL) / 1000;
  const membraneSolidsKg = (baseline.membraneTankVolumeM3 * baseline.membraneTankMLSSmgL) / 1000;
  const totalSolidsInventoryKg = aerationSolidsKg + membraneSolidsKg;

  // Daily Solids Wasted (WAS from membrane tank)
  const baselineWASMassKgD = (baseline.dailyWASVolumeM3d * baseline.membraneTankMLSSmgL) / 1000;
  const baselineSRTdays = baselineWASMassKgD > 0 ? totalSolidsInventoryKg / baselineWASMassKgD : 999;

  const simWASFlow = Math.max(0.1, scenario.simulatedWASFlowM3d);
  const dailySolidsWastedKgD = (simWASFlow * baseline.membraneTankMLSSmgL) / 1000;
  const simulatedSRTdays = dailySolidsWastedKgD > 0 ? totalSolidsInventoryKg / dailySolidsWastedKgD : 999;
  const srtChangeDays = simulatedSRTdays - baselineSRTdays;

  // Sludge production rate P_X = Mass / SRT
  const sludgeProductionKgD = simulatedSRTdays > 0 ? totalSolidsInventoryKg / simulatedSRTdays : 0;

  // Projected equilibrium MLSS approximation (Metcalf & Eddy observed yield dynamic)
  // X_eq = X_base * (SRT_sim / SRT_base)^0.35 (empirical MBR active fraction relationship)
  const projectedEquilibriumMLSSmgL = baselineSRTdays > 0 
    ? baseline.aerationTankMLSSmgL * Math.pow(Math.max(1, simulatedSRTdays) / baselineSRTdays, 0.35)
    : baseline.aerationTankMLSSmgL;

  const isSRTBelowNitrificationLimit = simulatedSRTdays < 12.0;

  // Aeration & Specific Air Demand
  const airPerTrain = scenario.simulatedAirFlowNm3h !== undefined ? scenario.simulatedAirFlowNm3h : 1344.0;
  const totalAirFlowNm3h = airPerTrain * activeTrainsCount;
  const simulatedSADmNm3m2h = activeMembraneAreaM2 > 0 ? totalAirFlowNm3h / activeMembraneAreaM2 : 0;
  const simulatedSADpNm3m3 = effectivePlantFlowM3h > 0 ? totalAirFlowNm3h / effectivePlantFlowM3h : 0;

  // Bottleneck Severity Assessment
  let bottleneckSeverity: 'NOMINAL' | 'MODERATE' | 'WARNING' | 'CRITICAL' = 'NOMINAL';
  const recommendedActions: string[] = [];

  if (activeTrainsCount === 0 || isTMPOverLimit || simulatedFluxLMH > 32.0) {
    bottleneckSeverity = 'CRITICAL';
    if (activeTrainsCount === 0) recommendedActions.push('Plant hydraulic total shutoff: all trains offline.');
    if (isTMPOverLimit) recommendedActions.push(`Critical TMP threshold breach (${simulatedTMPkPa.toFixed(1)} kPa > ${baseline.maxAllowableTMPkPa} kPa). Throttling required.`);
    if (flowCurtailmentM3h > 0) recommendedActions.push(`Curtail influent flow by ${flowCurtailmentM3h.toFixed(1)} m³/h to preserve remaining online trains.`);
  } else if (isFluxOverLimit || simulatedTMPkPa > 35.0 || isSRTBelowNitrificationLimit) {
    bottleneckSeverity = 'WARNING';
    if (isFluxOverLimit) recommendedActions.push(`Flux exceeds design limit (${simulatedFluxLMH.toFixed(1)} LMH > ${baseline.maxAllowableFluxLMH} LMH). Increase air scour or throttle.`);
    if (simulatedTMPkPa > 35.0) recommendedActions.push(`Elevated TMP (${simulatedTMPkPa.toFixed(1)} kPa). Advance scheduled maintenance clean.`);
    if (isSRTBelowNitrificationLimit) recommendedActions.push(`SRT below nitrification critical threshold (${simulatedSRTdays.toFixed(1)} d < 12.0 d). Reduce WAS rate.`);
  } else if (fluxIncreasePct > 10 || viscosityRatio > 1.2 || srtChangeDays < -5) {
    bottleneckSeverity = 'MODERATE';
    if (viscosityRatio > 1.2) recommendedActions.push(`Cold weather viscosity penalty (+${((viscosityRatio - 1) * 100).toFixed(0)}% drag). Compensate with higher suction head.`);
    if (fluxIncreasePct > 10) recommendedActions.push(`Moderate train flux redistribution (+${fluxIncreasePct.toFixed(1)}%). Monitor fouling rate-of-change.`);
  } else {
    bottleneckSeverity = 'NOMINAL';
    recommendedActions.push('Process operating within nominal hydraulic, thermal, and biological design envelopes.');
  }

  return {
    totalTrainsCount,
    activeTrainsCount,
    activeMembraneAreaM2,
    baselinePlantFlowM3h: baseline.totalPlantFlowM3h,
    effectivePlantFlowM3h,
    flowCurtailmentM3h,
    flowCurtailmentPct,
    baselineFluxLMH,
    simulatedFluxLMH,
    fluxIncreasePct,
    isFluxOverLimit,
    maxSustainablePlantFlowM3h,
    baselineTempC: baseline.waterTemperatureC,
    simulatedTempC: scenario.simulatedWaterTempC,
    baselineViscosityMpaS,
    simulatedViscosityMpaS,
    viscosityRatio,
    viscosityRatio20,
    baselineTMPkPa: baselineAvgTMP,
    simulatedTMPkPa,
    tmpIncreasePct,
    isTMPOverLimit,
    pumpHydraulicPowerKW,
    pumpElectricalPowerKW,
    specificPumpingEnergyKWhM3,
    pumpingEnergyDeltaPct,
    baselineSRTdays,
    simulatedSRTdays,
    srtChangeDays,
    totalSolidsInventoryKg,
    dailySolidsWastedKgD,
    sludgeProductionKgD,
    projectedEquilibriumMLSSmgL,
    isSRTBelowNitrificationLimit,
    simulatedAirFlowPerTrainNm3h: airPerTrain,
    totalAirFlowNm3h,
    simulatedSADmNm3m2h,
    simulatedSADpNm3m3,
    bottleneckSeverity,
    recommendedActions,
  };
}

/**
 * Standard Pre-configured Scenarios for Quick Operator Analysis
 */
export const WHAT_IF_PRESETS: { id: string; name: string; description: string; inputs: WhatIfScenarioInputs }[] = [
  {
    id: 'SCENARIO_NOMINAL',
    name: 'Nominal Design Baseline',
    description: 'All 4 trains in service, design 24 LMH flux at 18.5°C with nominal WAS rate (38 m³/d).',
    inputs: {
      activeTrainIds: ['TRAIN_A', 'TRAIN_B', 'TRAIN_C', 'TRAIN_D'],
      simulatedWaterTempC: 18.5,
      simulatedWASFlowM3d: 38.0,
      simulatedAirFlowNm3h: 1344.0,
    }
  },
  {
    id: 'SCENARIO_SINGLE_TRAIN_OUTAGE',
    name: 'Train Outage (N-1 Redundancy)',
    description: '1 Train offline for scheduled maintenance/CIP. Remaining 3 trains absorb full 460.8 m³/h (32 LMH flux).',
    inputs: {
      activeTrainIds: ['TRAIN_A', 'TRAIN_B', 'TRAIN_C'],
      simulatedWaterTempC: 18.5,
      simulatedWASFlowM3d: 38.0,
      simulatedAirFlowNm3h: 1344.0,
    }
  },
  {
    id: 'SCENARIO_WINTER_COLD_WATER',
    name: 'Winter Cold Weather Shock (8°C)',
    description: 'Severe temperature drop to 8.0°C causing +38% fluid viscosity drag and elevated permeate pump suction.',
    inputs: {
      activeTrainIds: ['TRAIN_A', 'TRAIN_B', 'TRAIN_C', 'TRAIN_D'],
      simulatedWaterTempC: 8.0,
      simulatedWASFlowM3d: 38.0,
      simulatedAirFlowNm3h: 1344.0,
    }
  },
  {
    id: 'SCENARIO_WAS_OPTIMIZATION',
    name: 'Accelerated Sludge Wastage (WAS 60 m³/d)',
    description: 'Increasing WAS flow to 60 m³/d to control high solids inventory and lower bioreactor MLSS to target.',
    inputs: {
      activeTrainIds: ['TRAIN_A', 'TRAIN_B', 'TRAIN_C', 'TRAIN_D'],
      simulatedWaterTempC: 18.5,
      simulatedWASFlowM3d: 60.0,
      simulatedAirFlowNm3h: 1344.0,
    }
  },
  {
    id: 'SCENARIO_STORM_SURGE',
    name: 'Peak Wet Weather Storm Surge (135% Q)',
    description: 'Influent hydraulic shock surge (622 m³/h) testing instantaneous flux ceiling and aeration buffer.',
    inputs: {
      activeTrainIds: ['TRAIN_A', 'TRAIN_B', 'TRAIN_C', 'TRAIN_D'],
      targetPlantFlowM3h: 622.0,
      simulatedWaterTempC: 16.0,
      simulatedWASFlowM3d: 38.0,
      simulatedAirFlowNm3h: 1550.0,
    }
  },
  {
    id: 'SCENARIO_COMPOUND_STRESS',
    name: 'Compound Extreme Stress (Outage + Cold + Storm)',
    description: '3 Trains online (1 offline) + 9°C cold water + 115% flow demand. Identifies critical plant curtailment point.',
    inputs: {
      activeTrainIds: ['TRAIN_A', 'TRAIN_B', 'TRAIN_C'],
      targetPlantFlowM3h: 530.0,
      simulatedWaterTempC: 9.0,
      simulatedWASFlowM3d: 38.0,
      simulatedAirFlowNm3h: 1450.0,
    }
  }
];
