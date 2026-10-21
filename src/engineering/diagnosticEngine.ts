/**
 * UNIT 77 MBR SUPER EXPERT — DIAGNOSTIC & ALARM ENGINE (STAGE 4)
 * Author: Turgunjon Ruziboyev
 * 
 * Physics-grounded MBR Diagnostic Engine featuring:
 *  - Multi-tier limit evaluation (WATCH, WARNING, HIGH, CRITICAL, TRIP)
 *  - Bidirectional Hysteresis deadband state machine (prevents chatter)
 *  - Time-window persistence latching (filters transient hydraulic spikes)
 *  - Rate-of-Change (ROC) trajectory monitoring (dTMP/dt, dLp/dt)
 *  - Composite Multi-Risk Index (MRI 0-100) with sub-risk factor decomposition
 *  - Inter-Train Peer Deviation & Z-Score anomaly diagnostics
 *  - Automated Multi-Symptom Root-Cause Hypothesis Generator
 */

import { AlarmSeverity, DataQualityFlag } from '../foundation/types';
import alarmDefsRaw from '../foundation/alarm_structure.json';

export interface AlarmRule {
  alarmCode: string;
  parameterId: string;
  applicableTrain: 'PLANT' | 'TRAIN' | 'BOTH';
  description: string;
  severity: AlarmSeverity;
  threshold: number;
  operator: '>' | '<' | '>=' | '<=' | 'RATE_EXCEEDS' | 'STUCK';
  persistenceSeconds: number;
  deadbandHysteresis: number;
  actionRecommendation: string;
}

export interface ActiveAlarmState {
  alarmCode: string;
  parameterId: string;
  trainId: string;
  severity: AlarmSeverity;
  description: string;
  currentValue: number;
  threshold: number;
  resetThreshold: number;
  deadbandHysteresis: number;
  operator: string;
  isBreaching: boolean;        // Instantaneous condition breach
  durationActiveSeconds: number; // Time condition has continuously breached
  persistenceSeconds: number;
  isLatched: boolean;          // Confirmed alarm after persistence & hysteresis
  triggerTimestamp?: string;
  actionRecommendation: string;
}

export interface RateOfChangeRecord {
  parameterId: string;
  trainId: string;
  currentValue: number;
  previousValue: number;
  deltaMinutes: number;
  ratePerHour: number; // change per hour
  isExcessive: boolean;
  warningThreshold: number;
}

export interface MultiRiskIndexBreakdown {
  totalScore: number; // 0 to 100
  riskCategory: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  hydraulicRisk: number;   // 0 to 100 (40% weight)
  biologicalRisk: number;  // 0 to 100 (25% weight)
  mechanicalRisk: number;  // 0 to 100 (20% weight)
  dataQualityRisk: number; // 0 to 100 (15% weight)
  dominantFactor: string;
  summaryNote: string;
}

export interface TrainPeerComparison {
  parameterId: string;
  unit: string;
  trainValues: Record<string, number>;
  peerMean: number;
  peerStdDev: number;
  peerMedian: number;
  zScores: Record<string, number>;
  pctDeviations: Record<string, number>;
  outlierTrains: string[];
}

export interface DiagnosticHypothesis {
  faultCode: string;
  title: string;
  probabilityPct: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  matchedEvidence: string[];
  physicalMechanism: string;
  rootCause: string;
  recommendedMitigation: string;
  priority: number;
}

export interface OperationalSnapshot {
  trainId: string;
  tmpKPa: number;
  tmpPrevKPa?: number;
  dtMinutes?: number;
  permeabilityNormalized: number;
  fluxGrossLMH: number;
  airScourFlowNm3h: number;
  permeateTurbidityNTU: number;
  mlssMgL: number;
  doMgL: number;
  temperatureC: number;
  srtDays: number;
  pumpVibrationMmS?: number;
  blowerVibrationMmS?: number;
  dataQualityFlag?: DataQualityFlag;
  previousLatchedAlarms?: Record<string, boolean>;
  alarmDurations?: Record<string, number>;
}

// Pre-loaded alarm dictionary
export const MASTER_ALARM_RULES: AlarmRule[] = (alarmDefsRaw as any).alarms || [];

/**
 * Evaluates an alarm condition with strict Hysteresis Deadband and Persistence filtering
 * 
 * High-Side Alarm (operator > or >=):
 *   Trip condition: value > threshold
 *   Reset condition: value < (threshold - deadband)
 * 
 * Low-Side Alarm (operator < or <=):
 *   Trip condition: value < threshold
 *   Reset condition: value > (threshold + deadband)
 */
export function evaluateAlarmCondition(
  rule: AlarmRule,
  currentValue: number,
  trainId: string,
  wasPreviouslyLatched: boolean = false,
  accumulatedSeconds: number = 0
): ActiveAlarmState {
  const isHighSide = rule.operator === '>' || rule.operator === '>=';
  const tripThreshold = rule.threshold;
  const deadband = Math.max(0, rule.deadbandHysteresis);

  let resetThreshold: number;
  let isBreaching = false;
  let isLatched = false;

  if (isHighSide) {
    resetThreshold = tripThreshold - deadband;
    isBreaching = currentValue > tripThreshold;

    if (wasPreviouslyLatched) {
      // Stays latched until value drops below reset threshold
      isLatched = currentValue >= resetThreshold;
    } else {
      // Must breach and fulfill persistence
      isLatched = isBreaching && accumulatedSeconds >= rule.persistenceSeconds;
    }
  } else {
    // Low-side alarm (e.g. permeability dropped, air scour dropped, DO dropped)
    resetThreshold = tripThreshold + deadband;
    isBreaching = currentValue < tripThreshold;

    if (wasPreviouslyLatched) {
      // Stays latched until value rises above reset threshold
      isLatched = currentValue <= resetThreshold;
    } else {
      isLatched = isBreaching && accumulatedSeconds >= rule.persistenceSeconds;
    }
  }

  const durationActive = isBreaching ? accumulatedSeconds : (isLatched ? accumulatedSeconds : 0);

  return {
    alarmCode: rule.alarmCode,
    parameterId: rule.parameterId,
    trainId,
    severity: rule.severity,
    description: rule.description,
    currentValue,
    threshold: tripThreshold,
    resetThreshold,
    deadbandHysteresis: deadband,
    operator: rule.operator,
    isBreaching,
    durationActiveSeconds: durationActive,
    persistenceSeconds: rule.persistenceSeconds,
    isLatched,
    actionRecommendation: rule.actionRecommendation
  };
}

/**
 * Calculates Rate-of-Change (ROC) over elapsed time window
 * Normalized to change per hour (e.g. kPa/h)
 */
export function calculateRateOfChange(
  currentVal: number,
  prevVal: number,
  deltaMinutes: number,
  parameterId: string,
  trainId: string,
  warningThreshold: number = 1.2
): RateOfChangeRecord {
  if (deltaMinutes <= 0) {
    return {
      parameterId,
      trainId,
      currentValue: currentVal,
      previousValue: prevVal,
      deltaMinutes: 0,
      ratePerHour: 0,
      isExcessive: false,
      warningThreshold
    };
  }

  const ratePerHour = ((currentVal - prevVal) / (deltaMinutes / 60));
  const roundedRate = Math.round(ratePerHour * 1000) / 1000;

  return {
    parameterId,
    trainId,
    currentValue: currentVal,
    previousValue: prevVal,
    deltaMinutes,
    ratePerHour: roundedRate,
    isExcessive: roundedRate > warningThreshold,
    warningThreshold
  };
}

/**
 * Calculates Composite Multi-Risk Index (MRI 0-100)
 * Weighted synthesis across Hydraulic, Biological, Mechanical, and Data Quality domains
 */
export function calculateMultiRiskIndex(snapshot: OperationalSnapshot): MultiRiskIndexBreakdown {
  // 1. Hydraulic Risk (0 - 100, 40% weight)
  // TMP: 20 kPa -> 0, 35 kPa -> 25, 45 kPa -> 60, 60 kPa -> 100
  let tmpRisk = 0;
  if (snapshot.tmpKPa <= 25) {
    tmpRisk = (snapshot.tmpKPa / 25) * 15;
  } else if (snapshot.tmpKPa <= 35) {
    tmpRisk = 15 + ((snapshot.tmpKPa - 25) / 10) * 20; // up to 35
  } else if (snapshot.tmpKPa <= 45) {
    tmpRisk = 35 + ((snapshot.tmpKPa - 35) / 10) * 35; // up to 70
  } else {
    tmpRisk = 70 + Math.min(30, ((snapshot.tmpKPa - 45) / 15) * 30); // up to 100
  }

  // Permeability Lp: > 180 -> 0, 150 -> 20, 100 -> 60, 60 -> 100
  let lpRisk = 0;
  if (snapshot.permeabilityNormalized >= 180) {
    lpRisk = 5;
  } else if (snapshot.permeabilityNormalized >= 140) {
    lpRisk = 10 + ((180 - snapshot.permeabilityNormalized) / 40) * 25; // up to 35
  } else if (snapshot.permeabilityNormalized >= 100) {
    lpRisk = 35 + ((140 - snapshot.permeabilityNormalized) / 40) * 35; // up to 70
  } else {
    lpRisk = 70 + Math.min(30, ((100 - snapshot.permeabilityNormalized) / 40) * 30);
  }

  // ROC component
  const roc = snapshot.tmpPrevKPa !== undefined && snapshot.dtMinutes && snapshot.dtMinutes > 0
    ? (snapshot.tmpKPa - snapshot.tmpPrevKPa) / (snapshot.dtMinutes / 60)
    : 0;
  const rocRisk = Math.min(100, Math.max(0, (roc / 1.5) * 100));

  const hydraulicRisk = Math.min(100, Math.max(0, 0.50 * tmpRisk + 0.35 * lpRisk + 0.15 * rocRisk));

  // 2. Biological Risk (0 - 100, 25% weight)
  // MLSS: ideal 8,000 - 11,000; > 14,000 is critical
  let mlssRisk = 10;
  if (snapshot.mlssMgL > 14000) {
    mlssRisk = 85 + Math.min(15, ((snapshot.mlssMgL - 14000) / 4000) * 15);
  } else if (snapshot.mlssMgL > 12000) {
    mlssRisk = 45 + ((snapshot.mlssMgL - 12000) / 2000) * 40;
  } else if (snapshot.mlssMgL < 6000) {
    mlssRisk = 50 + ((6000 - snapshot.mlssMgL) / 4000) * 40;
  }

  // DO: ideal > 2.0; < 1.0 is danger
  let doRisk = 5;
  if (snapshot.doMgL < 1.0) {
    doRisk = 90;
  } else if (snapshot.doMgL < 1.5) {
    doRisk = 60 + ((1.5 - snapshot.doMgL) / 0.5) * 30;
  } else if (snapshot.doMgL < 2.0) {
    doRisk = 20 + ((2.0 - snapshot.doMgL) / 0.5) * 40;
  }

  // SRT: ideal 20 - 30; > 45 or < 12 is high risk
  let srtRisk = 10;
  if (snapshot.srtDays > 45) {
    srtRisk = 80;
  } else if (snapshot.srtDays > 35) {
    srtRisk = 40 + ((snapshot.srtDays - 35) / 10) * 40;
  } else if (snapshot.srtDays < 12) {
    srtRisk = 75;
  }

  const biologicalRisk = Math.min(100, Math.max(0, 0.40 * mlssRisk + 0.35 * doRisk + 0.25 * srtRisk));

  // 3. Mechanical & Aeration Risk (0 - 100, 20% weight)
  // Air scour: min 750 Nm3/h, design 900
  let airRisk = 5;
  if (snapshot.airScourFlowNm3h < 700) {
    airRisk = 90;
  } else if (snapshot.airScourFlowNm3h < 750) {
    airRisk = 70 + ((750 - snapshot.airScourFlowNm3h) / 50) * 20;
  } else if (snapshot.airScourFlowNm3h < 850) {
    airRisk = 20 + ((850 - snapshot.airScourFlowNm3h) / 100) * 50;
  }

  // Turbidity: > 0.40 is integrity trip
  let turbRisk = 5;
  if (snapshot.permeateTurbidityNTU > 0.40) {
    turbRisk = 100;
  } else if (snapshot.permeateTurbidityNTU > 0.20) {
    turbRisk = 30 + ((snapshot.permeateTurbidityNTU - 0.20) / 0.20) * 70;
  }

  const pumpVib = snapshot.pumpVibrationMmS ?? 1.8;
  const vibRisk = pumpVib > 4.5 ? 90 : (pumpVib > 3.0 ? 50 : 10);

  const mechanicalRisk = Math.min(100, Math.max(0, 0.45 * airRisk + 0.35 * turbRisk + 0.20 * vibRisk));

  // 4. Data Quality Risk (0 - 100, 15% weight)
  let dqRisk = 0;
  switch (snapshot.dataQualityFlag) {
    case 'BAD':
      dqRisk = 100;
      break;
    case 'MISSING':
      dqRisk = 90;
      break;
    case 'FLATLINE':
      dqRisk = 75;
      break;
    case 'UNCERTAIN':
    case 'OUTLIER':
      dqRisk = 40;
      break;
    case 'ESTIMATED':
      dqRisk = 20;
      break;
    case 'GOOD':
    case 'CALCULATED':
    default:
      dqRisk = 0;
      break;
  }

  // Weighted total
  const totalScore = Math.round(
    (0.40 * hydraulicRisk + 0.25 * biologicalRisk + 0.20 * mechanicalRisk + 0.15 * dqRisk) * 10
  ) / 10;

  let riskCategory: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  if (totalScore >= 75 || turbRisk >= 95 || tmpRisk >= 95) {
    riskCategory = 'CRITICAL';
  } else if (totalScore >= 50) {
    riskCategory = 'HIGH';
  } else if (totalScore >= 30) {
    riskCategory = 'ELEVATED';
  } else {
    riskCategory = 'NORMAL';
  }

  // Dominant factor identification
  const factors = [
    { name: 'Hydraulic / Transmembrane Strain', val: hydraulicRisk * 0.40 },
    { name: 'Biological MLSS / DO Imbalance', val: biologicalRisk * 0.25 },
    { name: 'Mechanical Aeration / Turbidity', val: mechanicalRisk * 0.20 },
    { name: 'Sensor Quality / Signal Telemetry', val: dqRisk * 0.15 }
  ];
  factors.sort((a, b) => b.val - a.val);

  return {
    totalScore,
    riskCategory,
    hydraulicRisk: Math.round(hydraulicRisk * 10) / 10,
    biologicalRisk: Math.round(biologicalRisk * 10) / 10,
    mechanicalRisk: Math.round(mechanicalRisk * 10) / 10,
    dataQualityRisk: Math.round(dqRisk * 10) / 10,
    dominantFactor: factors[0].name,
    summaryNote: `Risk score ${totalScore}/100 [${riskCategory}] dominated by ${factors[0].name}.`
  };
}

/**
 * Calculates Inter-Train Peer Comparison and Statistical Z-Score Anomaly Deviation
 */
export function calculatePeerComparison(
  parameterId: string,
  unit: string,
  trainValues: Record<string, number>
): TrainPeerComparison {
  const trainKeys = Object.keys(trainValues);
  const values = Object.values(trainValues);

  if (values.length === 0) {
    return {
      parameterId,
      unit,
      trainValues,
      peerMean: 0,
      peerStdDev: 0,
      peerMedian: 0,
      zScores: {},
      pctDeviations: {},
      outlierTrains: []
    };
  }

  // Mean
  const sum = values.reduce((a, b) => a + b, 0);
  const peerMean = sum / values.length;

  // Median
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const peerMedian = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Standard Deviation
  const variance = values.length > 1
    ? values.reduce((acc, v) => acc + Math.pow(v - peerMean, 2), 0) / (values.length - 1)
    : 0;
  const peerStdDev = Math.sqrt(variance);

  const zScores: Record<string, number> = {};
  const pctDeviations: Record<string, number> = {};
  const outlierTrains: string[] = [];

  for (const train of trainKeys) {
    const v = trainValues[train];
    // Guard against zero division
    const z = peerStdDev > 0.0001 ? (v - peerMean) / peerStdDev : 0;
    zScores[train] = Math.round(z * 100) / 100;

    const pctDev = peerMean !== 0 ? ((v - peerMean) / Math.abs(peerMean)) * 100 : 0;
    pctDeviations[train] = Math.round(pctDev * 10) / 10;

    // Outlier criteria: |Z| > 1.8 or relative deviation > 20%
    if (Math.abs(z) >= 1.8 || Math.abs(pctDev) >= 20.0) {
      outlierTrains.push(train);
    }
  }

  return {
    parameterId,
    unit,
    trainValues,
    peerMean: Math.round(peerMean * 100) / 100,
    peerStdDev: Math.round(peerStdDev * 1000) / 1000,
    peerMedian: Math.round(peerMedian * 100) / 100,
    zScores,
    pctDeviations,
    outlierTrains
  };
}

/**
 * Multi-Symptom Diagnostic Reasoning Engine
 * Infers root causes from combinations of sensor anomalies and physics residuals
 */
export function diagnoseRootCauses(
  snapshot: OperationalSnapshot,
  rocRecord?: RateOfChangeRecord,
  peerComparison?: TrainPeerComparison
): DiagnosticHypothesis[] {
  const hypotheses: DiagnosticHypothesis[] = [];

  // Hypothesis 1: Membrane Fiber Integrity Breach / Rupture
  if (snapshot.permeateTurbidityNTU > 0.35) {
    const prob = snapshot.permeateTurbidityNTU > 0.6 ? 98 : (snapshot.permeateTurbidityNTU > 0.4 ? 90 : 75);
    hypotheses.push({
      faultCode: "FAULT_FIBER_RUPTURE",
      title: "Membrane Fiber Rupture / Cassette Header Seal Failure",
      probabilityPct: prob,
      severity: "CRITICAL",
      matchedEvidence: [
        `Permeate turbidity spike (${snapshot.permeateTurbidityNTU.toFixed(2)} NTU > safe 0.20 NTU)`,
        "Suspended particle / solids bypass directly into permeate stream"
      ],
      physicalMechanism: "Mechanical integrity breakdown of hollow-fiber potting seal or sheared membrane filament allowing activated sludge breakthrough.",
      rootCause: "Physical fatigue from coarse bubble shear, fiber clamping stress, or foreign abrasive debris.",
      recommendedMitigation: "Immediately isolate permeate isolation valve for " + snapshot.trainId + ". Conduct Pressure Decay Test (PDT) and diffusive air leak pin-pointing. Replace damaged module or pin damaged hollow fibers.",
      priority: 1
    });
  }

  // Hypothesis 2: Membrane Air Scour Aeration Deficit / Header Valve Malfunction
  if (snapshot.airScourFlowNm3h < 750 && snapshot.tmpKPa > 35) {
    const prob = snapshot.airScourFlowNm3h < 650 ? 95 : 82;
    hypotheses.push({
      faultCode: "FAULT_AERATION_DEFICIT",
      title: "Coarse Bubble Air Scour Failure (Severe Sludge Cake Formation)",
      probabilityPct: prob,
      severity: "HIGH",
      matchedEvidence: [
        `Coarse air scour below minimum shear velocity (${snapshot.airScourFlowNm3h} Nm³/h < 750)`,
        `Elevated TMP (${snapshot.tmpKPa.toFixed(1)} kPa) with accelerated fouling slope`
      ],
      physicalMechanism: "Loss of boundary layer cyclic cross-flow shear velocity allows reversible sludge flocs to deposit onto fiber surfaces, forming thick cake layer.",
      rootCause: "Blower VFD trip, cyclic aeration butterfly valve failure, or clogged coarse aeration header diffusers.",
      recommendedMitigation: "Inspect blower status and check valve position for " + snapshot.trainId + ". Trigger aeration boost cycle and initiate relaxation flush before cake consolidates.",
      priority: 2
    });
  }

  // Hypothesis 3: Biological Organic Shock & Colloidal SMP Overload
  if (snapshot.mlssMgL > 13000 && snapshot.permeabilityNormalized < 110) {
    hypotheses.push({
      faultCode: "FAULT_COLLOIDAL_FOULING",
      title: "High Sludge Solids & Extracellular Polymeric Substance (EPS/SMP) Pore Clogging",
      probabilityPct: snapshot.mlssMgL > 14000 ? 88 : 72,
      severity: "HIGH",
      matchedEvidence: [
        `Membrane tank MLSS is excessively concentrated (${snapshot.mlssMgL} mg/L > 12,000)`,
        `Normalized permeability suppressed (${snapshot.permeabilityNormalized.toFixed(1)} LMH/bar)`,
        `Calculated biological SRT (${snapshot.srtDays.toFixed(1)} d) indicates aging biomass`
      ],
      physicalMechanism: "Excessive biomass viscosity and soluble microbial products (SMP) plug membrane sub-micron pores, severely increasing irreversible hydraulic resistance Rf.",
      rootCause: "Insufficient WAS sludge wastage or biological stress causing cellular lysis and biopolymer accumulation.",
      recommendedMitigation: "Step up daily WAS sludge wasting rate to purge excess inventory and lower SRT toward 22-25 days. Schedule NaOCl Maintenance Clean (MC).",
      priority: 3
    });
  }

  // Hypothesis 4: Cold Water Thermal Viscosity Surge (Apparent Fouling vs Physical Viscosity)
  if (snapshot.temperatureC < 14 && snapshot.tmpKPa > 40 && snapshot.permeabilityNormalized > 140) {
    hypotheses.push({
      faultCode: "PHENOMENON_COLD_VISCOSITY",
      title: "Liquid Viscosity Elevation due to Low Wastewater Temperature",
      probabilityPct: 92,
      severity: "MEDIUM",
      matchedEvidence: [
        `Water temperature depressed (${snapshot.temperatureC.toFixed(1)} °C < 15.0 °C)`,
        `High uncorrected TMP (${snapshot.tmpKPa.toFixed(1)} kPa) but healthy normalized Lp_20 (${snapshot.permeabilityNormalized.toFixed(1)} LMH/bar)`
      ],
      physicalMechanism: "Water dynamic viscosity increases by ~2.5% per °C drop according to Poiseuille fluid physics. The membrane is NOT chemically fouled; pressure rise is driven by Newtonian fluid drag.",
      rootCause: "Seasonal winter cold weather inflow or prolonged chilling of biological basin.",
      recommendedMitigation: "Verify temperature-corrected Lp_20 before initiating chemical cleans. Avoid unnecessary chemical exposure; adjust operational flux setpoint to remain within suction pump head limit.",
      priority: 4
    });
  }

  // Hypothesis 5: Depressed DO / Biological Bulking
  if (snapshot.doMgL < 1.2 && snapshot.tmpKPa > 38) {
    hypotheses.push({
      faultCode: "FAULT_DEPRESSED_DO_BULKING",
      title: "Oxygen Starvation Leading to Sludge Bulking & High-Viscosity Liquor",
      probabilityPct: 78,
      severity: "HIGH",
      matchedEvidence: [
        `Aerobic tank DO critically low (${snapshot.doMgL.toFixed(2)} mg/L < 1.2 mg/L)`,
        `Accelerated fouling rate under normal aeration air scour`
      ],
      physicalMechanism: "Low dissolved oxygen promotes filamentous bacterial proliferation, reducing floc filterability and dramatically raising apparent liquor viscosity in the membrane tank.",
      rootCause: "Biological aeration blower flow deficiency, high influent COD load spike, or diffuser scaling in aeration basins.",
      recommendedMitigation: "Increase aerobic basin blower delivery to bring DO above 2.0 mg/L. Check influent COD/BOD shock loads.",
      priority: 5
    });
  }

  // Default: Normal Nominal Operation
  if (hypotheses.length === 0) {
    hypotheses.push({
      faultCode: "NOMINAL_OPERATION",
      title: "All Core Systems Operating Within Verified Design Boundaries",
      probabilityPct: 99,
      severity: "LOW",
      matchedEvidence: [
        `TMP is within safe baseline (${snapshot.tmpKPa.toFixed(1)} kPa < 35 kPa)`,
        `Normalized permeability is healthy (${snapshot.permeabilityNormalized.toFixed(1)} LMH/bar)`,
        `Turbidity clean (${snapshot.permeateTurbidityNTU.toFixed(2)} NTU)`,
        `Air scour and biological parameters stable`
      ],
      physicalMechanism: "Hydrodynamic shear matches permeate suction flux; cake layer is actively sheared by coarse aeration bubbles.",
      rootCause: "Optimal equilibrium between operational flux, scouring velocity, and biological sludge quality.",
      recommendedMitigation: "Maintain standard 12-minute filtration / 1-minute relaxation schedule and planned preventative maintenance clean routines.",
      priority: 10
    });
  }

  // Sort by priority and probability
  hypotheses.sort((a, b) => a.priority - b.priority || b.probabilityPct - a.probabilityPct);

  return hypotheses;
}

/**
 * Master Batch Evaluator for a Train
 */
export function runTrainDiagnostics(snapshot: OperationalSnapshot): {
  alarms: ActiveAlarmState[];
  latchedAlarms: ActiveAlarmState[];
  rateOfChange: RateOfChangeRecord;
  riskIndex: MultiRiskIndexBreakdown;
  hypotheses: DiagnosticHypothesis[];
} {
  const previousLatched = snapshot.previousLatchedAlarms || {};
  const durations = snapshot.alarmDurations || {};

  const evaluatedAlarms: ActiveAlarmState[] = [];

  for (const rule of MASTER_ALARM_RULES) {
    // Map rule parameter to snapshot value
    let val: number | null = null;
    switch (rule.parameterId) {
      case 'TRANSMEMBRANE_PRESSURE':
        val = snapshot.tmpKPa;
        break;
      case 'PERMEABILITY_NORMALIZED_20C':
        val = snapshot.permeabilityNormalized;
        break;
      case 'AIR_SCOUR_FLOW_TRAIN':
        val = snapshot.airScourFlowNm3h;
        break;
      case 'MLSS_MEMBRANE_TANK':
        val = snapshot.mlssMgL;
        break;
      case 'DO_AERATION_TANK':
        val = snapshot.doMgL;
        break;
      case 'TURBIDITY_PERMEATE':
        val = snapshot.permeateTurbidityNTU;
        break;
      case 'TMP_RATE_OF_CHANGE':
        if (snapshot.tmpPrevKPa !== undefined && snapshot.dtMinutes && snapshot.dtMinutes > 0) {
          val = (snapshot.tmpKPa - snapshot.tmpPrevKPa) / (snapshot.dtMinutes / 60);
        } else {
          val = 0;
        }
        break;
      default:
        val = null;
        break;
    }

    if (val !== null) {
      const wasLatched = !!previousLatched[rule.alarmCode];
      const accSeconds = durations[rule.alarmCode] || (wasLatched ? rule.persistenceSeconds + 10 : 0);
      const res = evaluateAlarmCondition(rule, val, snapshot.trainId, wasLatched, accSeconds);
      evaluatedAlarms.push(res);
    }
  }

  const latchedAlarms = evaluatedAlarms.filter(a => a.isLatched);

  const roc = calculateRateOfChange(
    snapshot.tmpKPa,
    snapshot.tmpPrevKPa ?? snapshot.tmpKPa,
    snapshot.dtMinutes ?? 60,
    'TRANSMEMBRANE_PRESSURE',
    snapshot.trainId,
    1.2
  );

  const riskIndex = calculateMultiRiskIndex(snapshot);
  const hypotheses = diagnoseRootCauses(snapshot, roc);

  return {
    alarms: evaluatedAlarms,
    latchedAlarms,
    rateOfChange: roc,
    riskIndex,
    hypotheses
  };
}
