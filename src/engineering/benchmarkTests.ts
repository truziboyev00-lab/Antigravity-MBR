/**
 * UNIT 77 MBR SUPER EXPERT — STAGE 3 CONTROLLED BENCHMARK TEST SUITE
 * Author: Turgunjon Ruziboyev
 * 
 * Defines standardized reference benchmark inputs and expected engineering outputs
 * across all core MBR physical and biological domains.
 */

import {
  calculateWaterProperties,
  calculateMembraneHydraulics,
  calculateBiologySRT,
  calculateAerationDemand,
  calculateCleaningRecovery,
  calculateFoulingRate,
  calculateMassBalance,
  MembraneHydraulicsInput,
  BiologySRTInput,
  AerationDemandInput,
  CleaningRecoveryInput,
  FoulingRateInput,
  MassBalanceInput
} from './calculations';

export interface BenchmarkTestResult {
  id: string;
  category: 'Hydraulics' | 'Temperature' | 'Resistance' | 'Biology' | 'Aeration' | 'Cleaning' | 'Fouling' | 'MassBalance' | 'SafetyGuards';
  parameter: string;
  unit: string;
  inputsDescription: string;
  expectedValue: number;
  actualValue: number;
  difference: number;
  errorPct: number;
  tolerancePct: number;
  status: 'PASS' | 'FAIL';
  zeroDivisionProtected: boolean;
  boundsChecked: boolean;
  notes: string;
}

export function runAllBenchmarkTests(): {
  results: BenchmarkTestResult[];
  totalPassed: number;
  totalFailed: number;
  overallPass: boolean;
} {
  const results: BenchmarkTestResult[] = [];

  // -------------------------------------------------------------------------
  // TEST 1: Hydrostatic Gravity Head
  // Tank Level H = 3.2 m, rho = 1000 kg/m3, g = 9.81 m/s2
  // P_hydro = 1000 * 9.81 * 3.2 / 1000 = 31.392 kPa
  // -------------------------------------------------------------------------
  const hydInput1: MembraneHydraulicsInput = {
    permeateFlowM3H: 157.5,
    membraneAreaM2: 7000.0,
    suctionPressureKPa: -18.5,
    tankLiquidLevelM: 3.2,
    waterTempC: 20.0
  };
  const hydOut1 = calculateMembraneHydraulics(hydInput1);
  const expHead = 31.392;
  const diffHead = hydOut1.hydrostaticHeadKPa - expHead;
  const errHead = (Math.abs(diffHead) / expHead) * 100.0;
  results.push({
    id: 'BENCH-01',
    category: 'Hydraulics',
    parameter: 'Hydrostatic Liquid Head (P_hydro)',
    unit: 'kPa',
    inputsDescription: 'Liquid Level = 3.2 m, rho = 1000 kg/m3, g = 9.81 m/s2',
    expectedValue: expHead,
    actualValue: Number(hydOut1.hydrostaticHeadKPa.toFixed(4)),
    difference: Number(diffHead.toFixed(6)),
    errorPct: Number(errHead.toFixed(6)),
    tolerancePct: 0.01,
    status: errHead <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Gravity liquid column above membrane cassette crown.'
  });

  // -------------------------------------------------------------------------
  // TEST 2: True Transmembrane Pressure (TMP)
  // TMP = P_hydro - P_suction = 31.392 - (-18.5) = 49.892 kPa
  // -------------------------------------------------------------------------
  const expTMP = 49.892;
  const diffTMP = hydOut1.trueTMPKPa - expTMP;
  const errTMP = (Math.abs(diffTMP) / expTMP) * 100.0;
  results.push({
    id: 'BENCH-02',
    category: 'Hydraulics',
    parameter: 'True Transmembrane Pressure (TMP)',
    unit: 'kPa',
    inputsDescription: 'P_hydro = 31.392 kPa, P_suction = -18.5 kPa',
    expectedValue: expTMP,
    actualValue: Number(hydOut1.trueTMPKPa.toFixed(4)),
    difference: Number(diffTMP.toFixed(6)),
    errorPct: Number(errTMP.toFixed(6)),
    tolerancePct: 0.01,
    status: errTMP <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Rigorous hydrostatic head correction included.'
  });

  // -------------------------------------------------------------------------
  // TEST 3: Gross Flux (J_gross)
  // Flow = 157.5 m3/h, Area = 7000 m2 => J = (157.5 * 1000) / 7000 = 22.5 LMH
  // -------------------------------------------------------------------------
  const expFlux = 22.500;
  const diffFlux = hydOut1.grossFluxLMH - expFlux;
  const errFlux = (Math.abs(diffFlux) / expFlux) * 100.0;
  results.push({
    id: 'BENCH-03',
    category: 'Hydraulics',
    parameter: 'Gross Membrane Flux (J_gross)',
    unit: 'LMH',
    inputsDescription: 'Permeate Flow = 157.5 m3/h, Membrane Area = 7000 m2',
    expectedValue: expFlux,
    actualValue: Number(hydOut1.grossFluxLMH.toFixed(4)),
    difference: Number(diffFlux.toFixed(6)),
    errorPct: Number(errFlux.toFixed(6)),
    tolerancePct: 0.01,
    status: errFlux <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Standardized liters per m2 per hour.'
  });

  // -------------------------------------------------------------------------
  // TEST 4: Net Flux (J_net)
  // 90% duty cycle (9 min suction / 1 min relaxation) => 22.5 * 0.9 = 20.25 LMH
  // -------------------------------------------------------------------------
  const expNetFlux = 20.250;
  const diffNetFlux = hydOut1.netFluxLMH - expNetFlux;
  const errNetFlux = (Math.abs(diffNetFlux) / expNetFlux) * 100.0;
  results.push({
    id: 'BENCH-04',
    category: 'Hydraulics',
    parameter: 'Net Membrane Flux (J_net)',
    unit: 'LMH',
    inputsDescription: 'Gross Flux = 22.5 LMH, Duty Cycle = 90% (9m on / 1m relax)',
    expectedValue: expNetFlux,
    actualValue: Number(hydOut1.netFluxLMH.toFixed(4)),
    difference: Number(diffNetFlux.toFixed(6)),
    errorPct: Number(errNetFlux.toFixed(6)),
    tolerancePct: 0.01,
    status: errNetFlux <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Accounts for cyclic filtration relaxation/backwash periods.'
  });

  // -------------------------------------------------------------------------
  // TEST 5: Water Viscosity at 15.0 °C (Poiseuille Model)
  // mu = 1.784 / (1 + 0.0337*15 + 0.00022*15^2)
  // 1 + 0.5055 + 0.0495 = 1.5550 => mu = 1.784 / 1.555 = 1.14726688 mPa.s
  // -------------------------------------------------------------------------
  const water15 = calculateWaterProperties(15.0);
  const expVisc15 = 1.147267;
  const diffVisc15 = water15.viscosityMPaS - expVisc15;
  const errVisc15 = (Math.abs(diffVisc15) / expVisc15) * 100.0;
  results.push({
    id: 'BENCH-05',
    category: 'Temperature',
    parameter: 'Dynamic Water Viscosity @ 15°C (mu)',
    unit: 'mPa·s',
    inputsDescription: 'Water Temp = 15.0 °C, Poiseuille model',
    expectedValue: expVisc15,
    actualValue: Number(water15.viscosityMPaS.toFixed(6)),
    difference: Number(diffVisc15.toFixed(6)),
    errorPct: Number(errVisc15.toFixed(6)),
    tolerancePct: 0.01,
    status: errVisc15 <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Poiseuille formulation for clean water dynamic viscosity.'
  });

  // -------------------------------------------------------------------------
  // TEST 6: Temperature Correction Factor (TCF) at 15.0 °C
  // TCF = 1.025^(20 - 15) = 1.025^5 = 1.131408
  // -------------------------------------------------------------------------
  const expTCF15 = 1.131408;
  const diffTCF15 = water15.tcf - expTCF15;
  const errTCF15 = (Math.abs(diffTCF15) / expTCF15) * 100.0;
  results.push({
    id: 'BENCH-06',
    category: 'Temperature',
    parameter: 'Temperature Correction Factor (TCF) @ 15°C',
    unit: 'ratio',
    inputsDescription: 'Water Temp = 15.0 °C, Base = 20.0 °C, Theta = 1.025',
    expectedValue: expTCF15,
    actualValue: Number(water15.tcf.toFixed(6)),
    difference: Number(diffTCF15.toFixed(6)),
    errorPct: Number(errTCF15.toFixed(6)),
    tolerancePct: 0.01,
    status: errTCF15 <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Standardized Arrhenius Arrhenius-viscosity normalization scalar.'
  });

  // -------------------------------------------------------------------------
  // TEST 7: Temperature-Normalized Permeability (L_p,20)
  // At 15°C: J = 22.5 LMH, TMP = 16.0 kPa = 0.16 bar
  // Lp_operational = 22.5 / 0.16 = 140.625 LMH/bar
  // Lp_20 = 140.625 * 1.131408 = 159.104278 LMH/bar
  // -------------------------------------------------------------------------
  const hydInput15: MembraneHydraulicsInput = {
    permeateFlowM3H: 157.5,
    membraneAreaM2: 7000.0,
    suctionPressureKPa: 15.392, // True TMP = 31.392 - 15.392 = 16.0 kPa
    tankLiquidLevelM: 3.2,
    waterTempC: 15.0
  };
  const hydOut15 = calculateMembraneHydraulics(hydInput15);
  const expLp20 = 159.104278;
  const diffLp20 = hydOut15.normalizedLp20LMHBar - expLp20;
  const errLp20 = (Math.abs(diffLp20) / expLp20) * 100.0;
  results.push({
    id: 'BENCH-07',
    category: 'Hydraulics',
    parameter: 'Normalized Permeability @ 20°C (L_p,20)',
    unit: 'LMH/bar',
    inputsDescription: 'Gross Flux = 22.5 LMH, True TMP = 16.0 kPa (0.16 bar), Temp = 15°C',
    expectedValue: expLp20,
    actualValue: Number(hydOut15.normalizedLp20LMHBar.toFixed(6)),
    difference: Number(diffLp20.toFixed(6)),
    errorPct: Number(errLp20.toFixed(6)),
    tolerancePct: 0.01,
    status: errLp20 <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Decoupled from thermal viscosity variations.'
  });

  // -------------------------------------------------------------------------
  // TEST 8: Darcy Total Membrane Resistance (R_tot)
  // R_tot = TMP / (mu * J)
  // TMP = 16,000 Pa, mu = 1.147267e-3 Pa.s, J = 22.5 LMH = 6.25e-6 m/s
  // Denom = 1.14726688e-3 * 6.25e-6 = 7.170418e-9 Pa.s.m/s
  // R_tot = 16000 / 7.170418e-9 = 2.23138988e12 1/m
  // -------------------------------------------------------------------------
  const expRtot = 2.23138988e12;
  const diffRtot = hydOut15.totalResistanceRtot - expRtot;
  const errRtot = (Math.abs(diffRtot) / expRtot) * 100.0;
  results.push({
    id: 'BENCH-08',
    category: 'Resistance',
    parameter: 'Total Darcy Hydraulic Resistance (R_tot)',
    unit: '1/m',
    inputsDescription: 'TMP = 16,000 Pa, J = 6.25e-6 m/s, mu = 1.147267e-3 Pa·s',
    expectedValue: expRtot,
    actualValue: Number(hydOut15.totalResistanceRtot.toExponential(6)),
    difference: Number(diffRtot.toExponential(4)),
    errorPct: Number(errRtot.toFixed(6)),
    tolerancePct: 0.01,
    status: errRtot <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Darcy fluid mechanics resistance formulation in SI units.'
  });

  // -------------------------------------------------------------------------
  // TEST 9: Fouling Resistance Partition (R_f = R_tot - R_m)
  // Clean Rm = 5.20e11 1/m
  // Rf = 2.23138988e12 - 5.20e11 = 1.71138988e12 1/m
  // -------------------------------------------------------------------------
  const expRf = 1.71138988e12;
  const diffRf = hydOut15.foulingResistanceRf - expRf;
  const errRf = (Math.abs(diffRf) / expRf) * 100.0;
  results.push({
    id: 'BENCH-09',
    category: 'Resistance',
    parameter: 'Fouling Hydraulic Resistance (R_f)',
    unit: '1/m',
    inputsDescription: 'R_tot = 2.231e12 1/m, Clean Membrane R_m = 5.20e11 1/m',
    expectedValue: expRf,
    actualValue: Number(hydOut15.foulingResistanceRf.toExponential(6)),
    difference: Number(diffRf.toExponential(4)),
    errorPct: Number(errRf.toFixed(6)),
    tolerancePct: 0.01,
    status: errRf <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Separation of intrinsic membrane resistance from foulant layer.'
  });

  // -------------------------------------------------------------------------
  // TEST 10: Specific Aeration Demand per Area (SAD_m)
  // Air Flow = 1750 Nm3/h, Membrane Area = 7000 m2
  // SAD_m = 1750 / 7000 = 0.250 Nm3/(m2.h)
  // -------------------------------------------------------------------------
  const aerInput: AerationDemandInput = {
    airScourFlowNm3H: 1750.0,
    membraneAreaM2: 7000.0,
    permeateFlowM3H: 157.5
  };
  const aerOut = calculateAerationDemand(aerInput);
  const expSADm = 0.250;
  const diffSADm = aerOut.sadmM3M2H - expSADm;
  const errSADm = (Math.abs(diffSADm) / expSADm) * 100.0;
  results.push({
    id: 'BENCH-10',
    category: 'Aeration',
    parameter: 'Specific Aeration Demand / Area (SAD_m)',
    unit: 'Nm³/(m²·h)',
    inputsDescription: 'Air Scour = 1750 Nm3/h, Membrane Area = 7000 m2',
    expectedValue: expSADm,
    actualValue: Number(aerOut.sadmM3M2H.toFixed(4)),
    difference: Number(diffSADm.toFixed(6)),
    errorPct: Number(errSADm.toFixed(6)),
    tolerancePct: 0.01,
    status: errSADm <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Continuous or intermittent coarse bubble air scouring rate.'
  });

  // -------------------------------------------------------------------------
  // TEST 11: Specific Aeration Demand per Permeate Volume (SAD_p)
  // Air Flow = 1750 Nm3/h, Permeate Flow = 157.5 m3/h
  // SAD_p = 1750 / 157.5 = 11.111111 Nm3 air / m3 water
  // -------------------------------------------------------------------------
  const expSADp = 11.111111;
  const diffSADp = aerOut.sadpM3M3 - expSADp;
  const errSADp = (Math.abs(diffSADp) / expSADp) * 100.0;
  results.push({
    id: 'BENCH-11',
    category: 'Aeration',
    parameter: 'Specific Aeration Demand / Permeate (SAD_p)',
    unit: 'Nm³/m³',
    inputsDescription: 'Air Scour = 1750 Nm3/h, Permeate = 157.5 m3/h',
    expectedValue: expSADp,
    actualValue: Number(aerOut.sadpM3M3.toFixed(6)),
    difference: Number(diffSADp.toFixed(6)),
    errorPct: Number(errSADp.toFixed(6)),
    tolerancePct: 0.01,
    status: errSADp <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Energy intensity indicator for permeate air scouring.'
  });

  // -------------------------------------------------------------------------
  // TEST 12: Total Biological Solids Mass Inventory
  // Aeration: 4500 m3 * 7200 mg/L / 1000 = 32,400 kg
  // MBR Tanks: 850 m3 * 9500 mg/L / 1000 = 8,075 kg
  // Total Inventory = 32,400 + 8,075 = 40,475 kg TSS
  // -------------------------------------------------------------------------
  const bioInput: BiologySRTInput = {
    aerationTankVolM3: 4500.0,
    aerationMLSSMgL: 7200.0,
    membraneTankVolM3: 850.0,
    membraneMLSSMgL: 9500.0,
    mlvssMgL: 7125.0,
    wasFlowM3D: 180.0,
    wasMLSSMgL: 9500.0,
    influentFlowM3H: 300.0,
    influentCODMgL: 450.0,
    effluentCODMgL: 22.0,
    targetSRTDays: 25.0
  };
  const bioOut = calculateBiologySRT(bioInput);
  const expMass = 40475.0;
  const diffMass = bioOut.totalSolidsMassKg - expMass;
  const errMass = (Math.abs(diffMass) / expMass) * 100.0;
  results.push({
    id: 'BENCH-12',
    category: 'Biology',
    parameter: 'Total Biological Solids Inventory',
    unit: 'kg TSS',
    inputsDescription: 'Aero: 4500 m3 @ 7200 mg/L, MBR: 850 m3 @ 9500 mg/L',
    expectedValue: expMass,
    actualValue: Number(bioOut.totalSolidsMassKg.toFixed(2)),
    difference: Number(diffMass.toFixed(6)),
    errorPct: Number(errMass.toFixed(6)),
    tolerancePct: 0.01,
    status: errMass <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Combined biomass inventory in aeration and membrane zones.'
  });

  // -------------------------------------------------------------------------
  // TEST 13: Daily WAS Solids Purged
  // WAS Flow = 180 m3/d, WAS MLSS = 9500 mg/L
  // WAS Mass = 180 * 9500 / 1000 = 1,710 kg TSS/d
  // -------------------------------------------------------------------------
  const expWAS = 1710.0;
  const diffWAS = bioOut.dailyWASMassKgD - expWAS;
  const errWAS = (Math.abs(diffWAS) / expWAS) * 100.0;
  results.push({
    id: 'BENCH-13',
    category: 'Biology',
    parameter: 'Daily Waste Activated Sludge (WAS) Mass',
    unit: 'kg TSS/d',
    inputsDescription: 'WAS Flow = 180 m3/d, WAS MLSS = 9500 mg/L',
    expectedValue: expWAS,
    actualValue: Number(bioOut.dailyWASMassKgD.toFixed(2)),
    difference: Number(diffWAS.toFixed(6)),
    errorPct: Number(errWAS.toFixed(6)),
    tolerancePct: 0.01,
    status: errWAS <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Dry solids intentionally removed from bioreactor daily.'
  });

  // -------------------------------------------------------------------------
  // TEST 14: Operational Solids Retention Time (SRT)
  // SRT = Total Inventory / Daily WAS Mass = 40475 / 1710 = 23.669591 days
  // -------------------------------------------------------------------------
  const expSRT = 23.669591;
  const diffSRT = bioOut.calculatedSRTDays - expSRT;
  const errSRT = (Math.abs(diffSRT) / expSRT) * 100.0;
  results.push({
    id: 'BENCH-14',
    category: 'Biology',
    parameter: 'Operational Solids Retention Time (SRT)',
    unit: 'days',
    inputsDescription: 'Total Solids = 40475 kg, Daily WAS Mass = 1710 kg/d',
    expectedValue: expSRT,
    actualValue: Number(bioOut.calculatedSRTDays.toFixed(6)),
    difference: Number(diffSRT.toFixed(6)),
    errorPct: Number(errSRT.toFixed(6)),
    tolerancePct: 0.01,
    status: errSRT <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Sludge age controlling nitrifier kinetics and sludge filterability.'
  });

  // -------------------------------------------------------------------------
  // TEST 15: Recommended WAS Flow Rate for Target SRT (25.0 days)
  // Target Mass = 40475 / 25.0 = 1619.0 kg/d
  // Required Flow = (1619.0 * 1000) / 9500 = 170.421053 m3/d
  // -------------------------------------------------------------------------
  const expWASFlow = 170.421053;
  const diffWASFlow = bioOut.recommendedWASFlowM3D - expWASFlow;
  const errWASFlow = (Math.abs(diffWASFlow) / expWASFlow) * 100.0;
  results.push({
    id: 'BENCH-15',
    category: 'Biology',
    parameter: 'Recommended WAS Flow for Target SRT (25d)',
    unit: 'm³/d',
    inputsDescription: 'Target SRT = 25.0 days, Inventory = 40475 kg, WAS MLSS = 9500 mg/L',
    expectedValue: expWASFlow,
    actualValue: Number(bioOut.recommendedWASFlowM3D.toFixed(6)),
    difference: Number(diffWASFlow.toFixed(6)),
    errorPct: Number(errWASFlow.toFixed(6)),
    tolerancePct: 0.01,
    status: errWASFlow <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Process setpoint solver for sludge age stabilization.'
  });

  // -------------------------------------------------------------------------
  // TEST 16: COD Removal Efficiency
  // Inflow COD = 450 mg/L, Effluent COD = 22 mg/L
  // Efficiency = (450 - 22) / 450 * 100 = 428 / 450 * 100 = 95.111111%
  // -------------------------------------------------------------------------
  const expCOD = 95.111111;
  const diffCOD = bioOut.codRemovalEfficiencyPct - expCOD;
  const errCOD = (Math.abs(diffCOD) / expCOD) * 100.0;
  results.push({
    id: 'BENCH-16',
    category: 'Biology',
    parameter: 'Biological COD Removal Efficiency',
    unit: '%',
    inputsDescription: 'Influent COD = 450 mg/L, Effluent COD = 22 mg/L',
    expectedValue: expCOD,
    actualValue: Number(bioOut.codRemovalEfficiencyPct.toFixed(6)),
    difference: Number(diffCOD.toFixed(6)),
    errorPct: Number(errCOD.toFixed(6)),
    tolerancePct: 0.01,
    status: errCOD <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Overall biological oxidation and filtration barrier effectiveness.'
  });

  // -------------------------------------------------------------------------
  // TEST 17: Chemical Cleaning Permeability Recovery
  // Pre-clean Lp = 95 LMH/bar, Post-clean Lp = 190 LMH/bar, Clean baseline = 220 LMH/bar
  // Max potential recovery = 220 - 95 = 125 LMH/bar
  // Actual recovery = 190 - 95 = 95 LMH/bar
  // Relative recovery = (95 / 125) * 100 = 76.000%
  // -------------------------------------------------------------------------
  const cleanInput: CleaningRecoveryInput = {
    preCleanLpLMHBar: 95.0,
    postCleanLpLMHBar: 190.0,
    virginCleanLpLMHBar: 220.0
  };
  const cleanOut = calculateCleaningRecovery(cleanInput);
  const expCleanRec = 76.000;
  const diffCleanRec = cleanOut.relativeRecoveryPct - expCleanRec;
  const errCleanRec = (Math.abs(diffCleanRec) / expCleanRec) * 100.0;
  results.push({
    id: 'BENCH-17',
    category: 'Cleaning',
    parameter: 'Chemical Clean Permeability Recovery',
    unit: '%',
    inputsDescription: 'Pre Lp = 95, Post Lp = 190, Clean Baseline = 220 LMH/bar',
    expectedValue: expCleanRec,
    actualValue: Number(cleanOut.relativeRecoveryPct.toFixed(4)),
    difference: Number(diffCleanRec.toFixed(6)),
    errorPct: Number(errCleanRec.toFixed(6)),
    tolerancePct: 0.01,
    status: errCleanRec <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Recovery percentage following CIP chemical restoration.'
  });

  // -------------------------------------------------------------------------
  // TEST 18: Rate of TMP Change (dTMP/dt) via Linear Regression
  // Time hours: [0, 4, 8, 12, 16]
  // TMP readings: [14.0, 14.8, 15.6, 16.4, 17.2]
  // Slope = (17.2 - 14.0) / 16.0 = 3.2 / 16.0 = 0.200 kPa/h
  // R^2 = 1.000000
  // -------------------------------------------------------------------------
  const foulInput: FoulingRateInput = {
    timestampsHours: [0, 4, 8, 12, 16],
    tmpReadingsKPa: [14.0, 14.8, 15.6, 16.4, 17.2]
  };
  const foulOut = calculateFoulingRate(foulInput);
  const expSlope = 0.200;
  const diffSlope = foulOut.dTMPdtKPaH - expSlope;
  const errSlope = (Math.abs(diffSlope) / expSlope) * 100.0;
  results.push({
    id: 'BENCH-18',
    category: 'Fouling',
    parameter: 'Fouling Rate Linear Slope (dTMP/dt)',
    unit: 'kPa/h',
    inputsDescription: 't = [0, 4, 8, 12, 16] h, TMP = [14.0, 14.8, 15.6, 16.4, 17.2] kPa',
    expectedValue: expSlope,
    actualValue: Number(foulOut.dTMPdtKPaH.toFixed(4)),
    difference: Number(diffSlope.toFixed(6)),
    errorPct: Number(errSlope.toFixed(6)),
    tolerancePct: 0.01,
    status: errSlope <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Real-time slope tracking for fouling rate acceleration detection.'
  });

  // -------------------------------------------------------------------------
  // TEST 19: Time to Critical TMP Threshold (45.0 kPa)
  // Current TMP = 17.2 kPa, Slope = 0.20 kPa/h
  // Time = (45.0 - 17.2) / 0.20 = 27.8 / 0.20 = 139.00 hours
  // -------------------------------------------------------------------------
  const expHours = 139.000;
  const diffHours = foulOut.hoursToCriticalTMP - expHours;
  const errHours = (Math.abs(diffHours) / expHours) * 100.0;
  results.push({
    id: 'BENCH-19',
    category: 'Fouling',
    parameter: 'Hours to Critical TMP (45 kPa Limit)',
    unit: 'hours',
    inputsDescription: 'Current TMP = 17.2 kPa, Slope = 0.20 kPa/h, Target Limit = 45.0 kPa',
    expectedValue: expHours,
    actualValue: Number(foulOut.hoursToCriticalTMP.toFixed(4)),
    difference: Number(diffHours.toFixed(6)),
    errorPct: Number(errHours.toFixed(6)),
    tolerancePct: 0.01,
    status: errHours <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Predictive maintenance alert window before required maintenance wash.'
  });

  // -------------------------------------------------------------------------
  // TEST 20: Water Mass Balance Discrepancy
  // Influent = 7200 m3/d, Permeate = 7020 m3/d, WAS = 180 m3/d
  // Total Discharge = 7020 + 180 = 7200 m3/d
  // Discrepancy = 0.00%
  // -------------------------------------------------------------------------
  const massInput: MassBalanceInput = {
    influentFlowM3D: 7200.0,
    permeateFlowM3D: 7020.0,
    wasFlowM3D: 180.0
  };
  const massOut = calculateMassBalance(massInput);
  const expBal = 0.0;
  const diffBal = massOut.waterBalanceDiscrepancyPct - expBal;
  results.push({
    id: 'BENCH-20',
    category: 'MassBalance',
    parameter: 'Plant Water Balance Discrepancy',
    unit: '%',
    inputsDescription: 'Inflow = 7200 m3/d, Permeate = 7020 m3/d, WAS = 180 m3/d',
    expectedValue: expBal,
    actualValue: Number(massOut.waterBalanceDiscrepancyPct.toFixed(4)),
    difference: Number(diffBal.toFixed(6)),
    errorPct: 0.0,
    tolerancePct: 0.01,
    status: Math.abs(diffBal) <= 0.01 ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Conservation of mass check across plant hydraulic boundaries.'
  });

  // -------------------------------------------------------------------------
  // TEST 21: Zero-Division Protection (Zero Area & Zero Flow)
  // Ensure calculations do not throw NaN, Infinity or crash
  // -------------------------------------------------------------------------
  const zeroHyd = calculateMembraneHydraulics({
    permeateFlowM3H: 0.0,
    membraneAreaM2: 0.0, // Handled safely by minimum area guard
    suctionPressureKPa: 0.0,
    tankLiquidLevelM: 0.0,
    waterTempC: 20.0
  });
  const isZeroSafe = Number.isFinite(zeroHyd.grossFluxLMH) && 
                     Number.isFinite(zeroHyd.trueTMPKPa) && 
                     Number.isFinite(zeroHyd.normalizedLp20LMHBar) &&
                     !Number.isNaN(zeroHyd.grossFluxLMH);

  results.push({
    id: 'BENCH-21',
    category: 'SafetyGuards',
    parameter: 'Zero-Division & Infinite Guard (Hydraulics)',
    unit: 'boolean',
    inputsDescription: 'Area = 0 m2, Permeate Flow = 0 m3/h, Suction = 0 kPa, Level = 0 m',
    expectedValue: 1, // 1 = true
    actualValue: isZeroSafe ? 1 : 0,
    difference: 0,
    errorPct: 0,
    tolerancePct: 0,
    status: isZeroSafe ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Engineered fallback guards clamp zero area and zero pressure.'
  });

  // -------------------------------------------------------------------------
  // TEST 22: Negative Permeability & Out-of-Bounds Biological Checks
  // Non-negative permeability guarantee & SRT division safety
  // -------------------------------------------------------------------------
  const zeroBio = calculateBiologySRT({
    aerationTankVolM3: 4500,
    aerationMLSSMgL: 7000,
    membraneTankVolM3: 850,
    membraneMLSSMgL: 9000,
    mlvssMgL: 6000,
    wasFlowM3D: 0, // Zero WAS flow -> must not produce Infinity without warning
    wasMLSSMgL: 9000,
    influentFlowM3H: 300,
    influentCODMgL: 450,
    effluentCODMgL: 20,
    targetSRTDays: 25
  });
  const isSRTSafe = zeroBio.warnings.length > 0 && zeroBio.calculatedSRTDays === 999.0;

  results.push({
    id: 'BENCH-22',
    category: 'SafetyGuards',
    parameter: 'Zero-WAS Division & Impossible SRT Guard',
    unit: 'boolean',
    inputsDescription: 'WAS Flow = 0 m3/d (Zero sludge wasting event)',
    expectedValue: 1,
    actualValue: isSRTSafe ? 1 : 0,
    difference: 0,
    errorPct: 0,
    tolerancePct: 0,
    status: isSRTSafe ? 'PASS' : 'FAIL',
    zeroDivisionProtected: true,
    boundsChecked: true,
    notes: 'Zero sludge wasting gracefully flags operator warning and avoids division by zero.'
  });

  const totalPassed = results.filter(r => r.status === 'PASS').length;
  const totalFailed = results.filter(r => r.status === 'FAIL').length;
  const overallPass = totalFailed === 0;

  return {
    results,
    totalPassed,
    totalFailed,
    overallPass
  };
}
