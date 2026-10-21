/**
 * UNIT 77 MBR SUPER EXPERT — CORE ENGINEERING CALCULATIONS
 * Author: Turgunjon Ruziboyev
 * 
 * Traceable, mathematically validated physical and biological equations for MBR.
 * Includes zero-division guards, physical plausibility limits, and strict typing.
 */

export interface WaterProperties {
  temperatureC: number;
  densityKgM3: number;
  viscosityPaS: number;
  viscosityMPaS: number;
  tcf: number; // Temperature Correction Factor relative to 20°C
}

export interface MembraneHydraulicsInput {
  permeateFlowM3H: number;
  membraneAreaM2: number;
  suctionPressureKPa: number; // Negative gauge reading from pump suction transmitter, e.g. -20 kPa
  tankLiquidLevelM: number;   // Submergence depth above membrane cassettes, e.g. 3.2 m
  waterTempC: number;
  cleanResistanceRm?: number; // 1/m, default 5.2e11
}

export interface MembraneHydraulicsOutput {
  grossFluxLMH: number;
  netFluxLMH: number;
  hydrostaticHeadKPa: number;
  trueTMPKPa: number;
  operationalLpLMHBar: number;
  normalizedLp20LMHBar: number;
  specificFluxLMHKPa: number;
  totalResistanceRtot: number; // 1/m
  foulingResistanceRf: number;  // 1/m
  isPlausible: boolean;
  warnings: string[];
}

export interface BiologySRTInput {
  aerationTankVolM3: number;
  aerationMLSSMgL: number;
  membraneTankVolM3: number;
  membraneMLSSMgL: number;
  mlvssMgL: number;
  wasFlowM3D: number;
  wasMLSSMgL: number;
  influentFlowM3H: number;
  influentCODMgL: number;
  effluentCODMgL: number;
  targetSRTDays: number;
}

export interface BiologySRTOutput {
  totalSolidsMassKg: number;
  totalVolatileSolidsMassKg: number;
  mlvssRatio: number;
  dailyWASMassKgD: number;
  calculatedSRTDays: number;
  recommendedWASFlowM3D: number;
  foodToMassRatioFM: number; // kg COD / kg MLVSS.d
  codRemovalEfficiencyPct: number;
  isPlausible: boolean;
  warnings: string[];
}

export interface AerationDemandInput {
  airScourFlowNm3H: number;
  membraneAreaM2: number;
  permeateFlowM3H: number;
}

export interface AerationDemandOutput {
  sadmM3M2H: number; // Specific Aeration Demand per membrane area: Nm3/(m2.h)
  sadpM3M3: number;  // Specific Aeration Demand per permeate volume: Nm3 air / m3 permeate
  isPlausible: boolean;
}

export interface CleaningRecoveryInput {
  preCleanLpLMHBar: number;
  postCleanLpLMHBar: number;
  virginCleanLpLMHBar: number; // Baseline clean water permeability, e.g. 280 LMH/bar
}

export interface CleaningRecoveryOutput {
  absoluteRecoveryLMHBar: number;
  relativeRecoveryPct: number; // (Post - Pre) / (Clean - Pre) * 100
  isPlausible: boolean;
}

export interface FoulingRateInput {
  timestampsHours: number[];
  tmpReadingsKPa: number[];
}

export interface FoulingRateOutput {
  dTMPdtKPaH: number; // Linear slope in kPa/h
  rSquared: number;
  projectedTMP24hKPa: number;
  hoursToCriticalTMP: number; // Hours until TMP hits 45 kPa warning or 60 kPa trip
}

export interface MassBalanceInput {
  influentFlowM3D: number;
  permeateFlowM3D: number;
  wasFlowM3D: number;
}

export interface MassBalanceOutput {
  totalDischargeM3D: number;
  waterBalanceDiscrepancyPct: number;
  isBalanced: boolean; // < 5% discrepancy
}

// --------------------------------------------------------------------------
// 1. Water Physical Properties (Viscosity, Density, TCF)
// --------------------------------------------------------------------------
export function calculateWaterProperties(tempC: number): WaterProperties {
  // Physical temperature guard
  const boundedTemp = Math.max(0.5, Math.min(50, tempC));
  const densityKgM3 = 1000.0; // Standard water density kg/m3

  // Poiseuille dynamic viscosity equation for water:
  // mu(T) = 1.784 / (1 + 0.0337*T + 0.00022*T^2) [mPa.s]
  const viscosityMPaS = 1.784 / (1 + 0.0337 * boundedTemp + 0.00022 * Math.pow(boundedTemp, 2));
  const viscosityPaS = viscosityMPaS / 1000.0;

  // Temperature correction factor (TCF) referenced to 20°C:
  // TCF = theta^(20 - T), theta = 1.025
  const theta = 1.025;
  const tcf = Math.pow(theta, 20.0 - boundedTemp);

  return {
    temperatureC: boundedTemp,
    densityKgM3,
    viscosityPaS,
    viscosityMPaS,
    tcf
  };
}

// --------------------------------------------------------------------------
// 2. Membrane Hydraulics & Darcy Resistance
// --------------------------------------------------------------------------
export function calculateMembraneHydraulics(input: MembraneHydraulicsInput): MembraneHydraulicsOutput {
  const warnings: string[] = [];

  // Zero-division safeguards
  const area = Math.max(1.0, input.membraneAreaM2);
  const flow = Math.max(0.0, input.permeateFlowM3H);

  // Gross Flux J = (Q_p * 1000) / Area [L/(m2.h) = LMH]
  const grossFluxLMH = (flow * 1000.0) / area;

  // Net Flux (standard 9 min suction + 1 min relaxation/backwash cycle = 90% duty cycle)
  const dutyCycle = 0.90;
  const netFluxLMH = grossFluxLMH * dutyCycle;

  // Hydrostatic gravity head: P_hydro = rho * g * H_tank / 1000 [kPa]
  const g = 9.81; // m/s2
  const water = calculateWaterProperties(input.waterTempC);
  const hydrostaticHeadKPa = (water.densityKgM3 * g * Math.max(0, input.tankLiquidLevelM)) / 1000.0;

  // True Transmembrane Pressure (TMP):
  // True TMP = P_feed_effective - P_permeate = (P_atm + rho*g*H) - (P_atm + P_suction)
  // Therefore: TMP = rho*g*H - P_suction (where P_suction is negative gauge pressure, e.g. -18.5 kPa)
  const trueTMPKPa = hydrostaticHeadKPa - input.suctionPressureKPa;

  // Plausibility check on TMP
  if (trueTMPKPa < 0) {
    warnings.push('Calculated TMP is negative; check suction pressure sign or liquid level transmitter.');
  } else if (trueTMPKPa > 60.0) {
    warnings.push('CRITICAL: TMP exceeds membrane structural trip limit of 60 kPa.');
  }

  // Operational Permeability Lp = Flux / (TMP in bar)
  // TMP in bar = TMP in kPa / 100.0
  const safeTMPBar = Math.max(0.01, trueTMPKPa / 100.0);
  const operationalLpLMHBar = grossFluxLMH / safeTMPBar;

  // Temperature-Normalized Permeability @ 20°C: Lp_20 = Lp * TCF
  const normalizedLp20LMHBar = operationalLpLMHBar * water.tcf;

  // Specific Flux = Flux / TMP (LMH/kPa)
  const safeTMPKPa = Math.max(0.5, trueTMPKPa);
  const specificFluxLMHKPa = grossFluxLMH / safeTMPKPa;

  // Darcy's Law Total Hydraulic Resistance:
  // J = TMP / (mu * R_tot)  =>  R_tot = TMP / (mu * J)
  // where TMP in Pa, mu in Pa.s, J in m/s (1 LMH = 1/(1000 * 3600) m/s = 2.778e-7 m/s)
  const tmpPa = Math.max(10.0, trueTMPKPa * 1000.0);
  const jMS = Math.max(1e-9, (grossFluxLMH / 1000.0) / 3600.0);
  const totalResistanceRtot = tmpPa / (water.viscosityPaS * jMS);

  // Clean membrane baseline resistance
  const Rm = input.cleanResistanceRm ?? 5.2e11; // 1/m
  const foulingResistanceRf = Math.max(0, totalResistanceRtot - Rm);

  const isPlausible = trueTMPKPa >= 0 && trueTMPKPa <= 65 && grossFluxLMH >= 0 && grossFluxLMH <= 50;

  return {
    grossFluxLMH,
    netFluxLMH,
    hydrostaticHeadKPa,
    trueTMPKPa,
    operationalLpLMHBar,
    normalizedLp20LMHBar,
    specificFluxLMHKPa,
    totalResistanceRtot,
    foulingResistanceRf,
    isPlausible,
    warnings
  };
}

// --------------------------------------------------------------------------
// 3. Bioreactor Kinetics, Solids Inventory & SRT
// --------------------------------------------------------------------------
export function calculateBiologySRT(input: BiologySRTInput): BiologySRTOutput {
  const warnings: string[] = [];

  // Total Solids Inventory in Aeration + Membrane tanks:
  // Mass (kg TSS) = (V_aero * MLSS_aero + V_mbr * MLSS_mbr) / 1000
  const massAeroKg = (Math.max(0, input.aerationTankVolM3) * Math.max(0, input.aerationMLSSMgL)) / 1000.0;
  const massMbrKg = (Math.max(0, input.membraneTankVolM3) * Math.max(0, input.membraneMLSSMgL)) / 1000.0;
  const totalSolidsMassKg = massAeroKg + massMbrKg;

  // MLVSS / MLSS ratio
  const safeMbrMLSS = Math.max(100, input.membraneMLSSMgL);
  const mlvssRatio = Math.min(0.95, Math.max(0.40, input.mlvssMgL / safeMbrMLSS));
  const totalVolatileSolidsMassKg = totalSolidsMassKg * mlvssRatio;

  // Daily WAS Dry Mass purged:
  // WAS Mass (kg TSS/d) = (Q_was [m3/d] * MLSS_was [mg/L]) / 1000
  const dailyWASMassKgD = (Math.max(0, input.wasFlowM3D) * Math.max(0, input.wasMLSSMgL)) / 1000.0;

  // Operational SRT (Mean Cell Residence Time):
  // SRT (days) = Total Solids Inventory / Daily WAS Mass
  let calculatedSRTDays = 0;
  if (dailyWASMassKgD > 0.1) {
    calculatedSRTDays = totalSolidsMassKg / dailyWASMassKgD;
  } else {
    calculatedSRTDays = 999.0;
    warnings.push('WAS flow is virtually zero. SRT cannot be reliably computed without solids wasting.');
  }

  if (calculatedSRTDays < 10) {
    warnings.push('WARNING: SRT is critically low (< 10 days). Risk of nitrifier washout.');
  } else if (calculatedSRTDays > 45) {
    warnings.push('WARNING: SRT is excessively high (> 45 days). High cell debris and elevated EPS/SMP fouling risk.');
  }

  // Recommended WAS Flow Rate to achieve Target SRT:
  // Target_WAS_Mass = Total_Inventory / Target_SRT
  // Target_WAS_Flow = (Target_WAS_Mass * 1000) / MLSS_was
  const targetSRT = Math.max(5.0, input.targetSRTDays);
  const targetWASMassKgD = totalSolidsMassKg / targetSRT;
  const recommendedWASFlowM3D = (targetWASMassKgD * 1000.0) / Math.max(500, input.wasMLSSMgL);

  // Food-to-Mass (F/M) Ratio:
  // Daily COD load (kg COD/d) = (Q_in [m3/h] * 24 h/d * Influent_COD [mg/L]) / 1000
  const dailyCODLoadKgD = (Math.max(0, input.influentFlowM3H) * 24.0 * Math.max(0, input.influentCODMgL)) / 1000.0;
  const foodToMassRatioFM = totalVolatileSolidsMassKg > 0 ? dailyCODLoadKgD / totalVolatileSolidsMassKg : 0;

  // COD Removal Efficiency:
  const inCOD = Math.max(1.0, input.influentCODMgL);
  const effCOD = Math.max(0.0, input.effluentCODMgL);
  const codRemovalEfficiencyPct = Math.max(0, Math.min(100, ((inCOD - effCOD) / inCOD) * 100.0));

  const isPlausible = calculatedSRTDays >= 8 && calculatedSRTDays <= 60 && mlvssRatio >= 0.5 && mlvssRatio <= 0.85;

  return {
    totalSolidsMassKg,
    totalVolatileSolidsMassKg,
    mlvssRatio,
    dailyWASMassKgD,
    calculatedSRTDays,
    recommendedWASFlowM3D,
    foodToMassRatioFM,
    codRemovalEfficiencyPct,
    isPlausible,
    warnings
  };
}

// --------------------------------------------------------------------------
// 4. Aeration Demands (SADm and SADp)
// --------------------------------------------------------------------------
export function calculateAerationDemand(input: AerationDemandInput): AerationDemandOutput {
  const air = Math.max(0, input.airScourFlowNm3H);
  const area = Math.max(1, input.membraneAreaM2);
  const permFlow = Math.max(0.1, input.permeateFlowM3H);

  // SAD_m: Nm3 air per m2 membrane per hour
  const sadmM3M2H = air / area;

  // SAD_p: Nm3 air per m3 permeate produced
  const sadpM3M3 = air / permFlow;

  const isPlausible = sadmM3M2H >= 0.1 && sadmM3M2H <= 0.8 && sadpM3M3 >= 5.0 && sadpM3M3 <= 35.0;

  return {
    sadmM3M2H,
    sadpM3M3,
    isPlausible
  };
}

// --------------------------------------------------------------------------
// 5. Cleaning Permeability Recovery
// --------------------------------------------------------------------------
export function calculateCleaningRecovery(input: CleaningRecoveryInput): CleaningRecoveryOutput {
  const absoluteRecoveryLMHBar = input.postCleanLpLMHBar - input.preCleanLpLMHBar;
  
  // Relative recovery against clean baseline: (Post - Pre) / (Clean - Pre) * 100
  const maxPotentialRecovery = Math.max(1.0, input.virginCleanLpLMHBar - input.preCleanLpLMHBar);
  const relativeRecoveryPct = (absoluteRecoveryLMHBar / maxPotentialRecovery) * 100.0;

  const isPlausible = input.postCleanLpLMHBar >= input.preCleanLpLMHBar && relativeRecoveryPct >= 0 && relativeRecoveryPct <= 110;

  return {
    absoluteRecoveryLMHBar,
    relativeRecoveryPct,
    isPlausible
  };
}

// --------------------------------------------------------------------------
// 6. Rate of TMP Change (dTMP/dt) & Linear Forecast
// --------------------------------------------------------------------------
export function calculateFoulingRate(input: FoulingRateInput): FoulingRateOutput {
  const n = input.timestampsHours.length;
  if (n < 2 || n !== input.tmpReadingsKPa.length) {
    return {
      dTMPdtKPaH: 0.0,
      rSquared: 0.0,
      projectedTMP24hKPa: input.tmpReadingsKPa[0] || 0.0,
      hoursToCriticalTMP: 999.0
    };
  }

  // Linear regression: y = slope * x + intercept
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const x = input.timestampsHours[i];
    const y = input.tmpReadingsKPa[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const denominator = (n * sumX2) - (sumX * sumX);
  const slope = denominator !== 0 ? ((n * sumXY) - (sumX * sumY)) / denominator : 0.0;
  const intercept = (sumY - (slope * sumX)) / n;

  // Correlation coefficient R^2
  const numR = (n * sumXY) - (sumX * sumY);
  const denR = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));
  const rSquared = denR !== 0 ? Math.pow(numR / denR, 2) : 0.0;

  const currentTMP = input.tmpReadingsKPa[n - 1];
  const projectedTMP24hKPa = currentTMP + (slope * 24.0);

  // Remaining time to 45 kPa warning limit
  let hoursToCriticalTMP = 999.0;
  if (slope > 0.001) {
    hoursToCriticalTMP = Math.max(0.0, (45.0 - currentTMP) / slope);
  }

  return {
    dTMPdtKPaH: slope,
    rSquared,
    projectedTMP24hKPa,
    hoursToCriticalTMP
  };
}

// --------------------------------------------------------------------------
// 7. Mass & Water Balance Check
// --------------------------------------------------------------------------
export function calculateMassBalance(input: MassBalanceInput): MassBalanceOutput {
  const totalDischargeM3D = input.permeateFlowM3D + input.wasFlowM3D;
  const safeInfluent = Math.max(1.0, input.influentFlowM3D);
  const discrepancy = Math.abs(safeInfluent - totalDischargeM3D);
  const waterBalanceDiscrepancyPct = (discrepancy / safeInfluent) * 100.0;
  const isBalanced = waterBalanceDiscrepancyPct <= 5.0; // Standard < 5% error

  return {
    totalDischargeM3D,
    waterBalanceDiscrepancyPct,
    isBalanced
  };
}
