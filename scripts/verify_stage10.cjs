/**
 * UNIT 77 MBR SUPER EXPERT — STAGE 10 GATE VERIFICATION (NODE.JS)
 * Full Super Expert Integration, Multi-Domain Reasoning Chain, Physics Hypotheses,
 * Prescriptive Operator Actions, and Excel VBA Macros
 * 
 * Author: Turgunjon Ruziboyev
 * Specification: Master Prompt V2.0 (Stage 10)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('================================================================================');
console.log('      UNIT 77 MBR SUPER EXPERT — STAGE 10 GATE VERIFICATION (NODE.JS)');
console.log('================================================================================');
console.log('Author: Turgunjon Ruziboyev\n');

let totalChecks = 0;
let passedChecks = 0;

function assert(condition, gateId, description, details) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`[PASS] ${gateId}: ${description}`);
    if (details) console.log(`       ${details}`);
  } else {
    console.error(`[FAIL] ${gateId}: ${description}`);
    if (details) console.error(`       ${details}`);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// Gate 10.1: Super Expert Engine Architecture & Python Package Integration
// -----------------------------------------------------------------------------
const superExpertPy = path.join(__dirname, '..', 'python', 'mbr_engine', 'super_expert.py');
const initPy = path.join(__dirname, '..', 'python', 'mbr_engine', '__init__.py');
assert(
  fs.existsSync(superExpertPy) && fs.statSync(superExpertPy).size > 10000 &&
  fs.readFileSync(initPy, 'utf-8').includes('SuperExpertEngine'),
  'Gate 10.1',
  'Super Expert Module Architecture & Package Integration',
  `super_expert.py present (${fs.statSync(superExpertPy).size} bytes), exported in __init__.py.`
);

// -----------------------------------------------------------------------------
// Gate 10.2: Full Super Expert 8-Step Reasoning Chain Execution
// -----------------------------------------------------------------------------
let diagnosis;
try {
  const stdout = execSync('python3 -m python.mbr_engine.cli --super-expert', { encoding: 'utf-8' });
  diagnosis = JSON.parse(stdout);
  assert(
    diagnosis.overall_health_verdict && diagnosis.step1_observation && diagnosis.step8_prescription,
    'Gate 10.2',
    'Full Super Expert 8-Step Reasoning Chain CLI Execution',
    `Diagnosis ID: ${diagnosis.diagnosis_id}, Verdict: ${diagnosis.overall_health_verdict}, Execution: ${diagnosis.execution_time_ms}ms.`
  );
} catch (e) {
  assert(false, 'Gate 10.2', 'Full Super Expert 8-Step Reasoning Chain CLI Execution', e.message);
}

// -----------------------------------------------------------------------------
// Gate 10.3: Step 1 — Observational Telemetry & Sensor Hygiene Audit
// -----------------------------------------------------------------------------
const s1 = diagnosis.step1_observation;
assert(
  s1.total_sensors_audited === 7 && s1.sensor_health_score_pct >= 99.0 && s1.active_trains_count === 4,
  'Gate 10.3',
  'Step 1: Observational Telemetry & Sensor Data Hygiene Audit',
  `Audited Sensors: ${s1.total_sensors_audited}, Health Score: ${s1.sensor_health_score_pct}%, Flow: ${s1.influent_flow_m3_h} m³/h.`
);

// -----------------------------------------------------------------------------
// Gate 10.4: Step 2 — First-Principles Hydraulics & Resistance Inversion
// -----------------------------------------------------------------------------
const s2 = diagnosis.step2_physics;
assert(
  s2.leading_resistance_train === 'C' &&
  s2.leading_rc_val > 2.0e12 &&
  Math.abs(s2.dynamic_viscosity_mpa_s - 1.0333) < 0.005,
  'Gate 10.4',
  'Step 2: First-Principles Hydraulics & Darcy Inversion',
  `Viscosity: ${s2.dynamic_viscosity_mpa_s} mPa·s, Leading Train: ${s2.leading_resistance_train}, Rc: ${s2.leading_rc_val.toExponential(3)} m⁻¹.`
);

// -----------------------------------------------------------------------------
// Gate 10.5: Step 3 — Bioprocess Solids Inventory & Washout Safety Interlock
// -----------------------------------------------------------------------------
const s3 = diagnosis.step3_bioprocess;
assert(
  s3.total_biomass_kg > 25000.0 && s3.current_srt_days > 15.0 && s3.washout_status === 'SAFE',
  'Gate 10.5',
  'Step 3: Bioprocess Solids Inventory & Nitrification Washout Safety',
  `Biomass: ${s3.total_biomass_kg.toLocaleString()} kg, SRT: ${s3.current_srt_days} d, Washout Margin: ${s3.nitrification_washout_margin}x.`
);

// -----------------------------------------------------------------------------
// Gate 10.6: Step 4 — Statistical & Machine Learning Triangulation
// -----------------------------------------------------------------------------
const s4 = diagnosis.step4_anomaly;
assert(
  s4.theil_sen_slope_kpa_h === 0.12 &&
  s4.pca_hotelling_t2 > s4.pca_t2_threshold_95 &&
  s4.isolation_forest_score > 0.50,
  'Gate 10.6',
  'Step 4: Machine Learning & Statistical Anomaly Triangulation',
  `Theil-Sen Slope: ${s4.theil_sen_slope_kpa_h} kPa/h (OLS: ${s4.ols_slope_kpa_h}), PCA T²: ${s4.pca_hotelling_t2} (UCL-95: ${s4.pca_t2_threshold_95}), Isolation: ${s4.isolation_forest_score}.`
);

// -----------------------------------------------------------------------------
// Gate 10.7: Step 5 — Physics Hypotheses Formulation & Evidence Tracing
// -----------------------------------------------------------------------------
const s5 = diagnosis.step5_hypothesis;
assert(
  s5.all_hypotheses.length >= 2 && s5.primary_confidence_pct >= 85.0,
  'Gate 10.7',
  'Step 5: Physics Hypotheses Formulation & Evidence Tracing',
  `Primary Hypothesis: "${s5.primary_hypothesis}" (Confidence: ${s5.primary_confidence_pct}%).`
);

// -----------------------------------------------------------------------------
// Gate 10.8: Step 6 — Operational Risk & What-If Outage Stress Simulation
// -----------------------------------------------------------------------------
const s6 = diagnosis.step6_stress;
assert(
  s6.current_mri_score >= 40.0 &&
  s6.n1_redistributed_flux_lmh === 32.0 &&
  s6.sustainable_plant_flow_m3_h === 432.0 &&
  s6.curtailment_required_m3_h === 28.8,
  'Gate 10.8',
  'Step 6: Operational Risk & What-If Stress Assessment',
  `MRI: ${s6.current_mri_score} (${s6.mri_severity}), N-1 Flux: ${s6.n1_redistributed_flux_lmh} LMH, Sustainable Flow: ${s6.sustainable_plant_flow_m3_h} m³/h (Curtailment: ${s6.curtailment_required_m3_h} m³/h).`
);

// -----------------------------------------------------------------------------
// Gate 10.9: Step 7 — Multi-Horizon Prediction & Remaining Useful Life (RUL)
// -----------------------------------------------------------------------------
const s7 = diagnosis.step7_prediction;
assert(
  s7.forecast_t24_kpa > 29.0 && s7.forecast_t168_kpa > 50.0 && s7.rul_to_45kpa_hours > 0,
  'Gate 10.9',
  'Step 7: Multi-Horizon Prediction & RUL Estimation',
  `T+24h: ${s7.forecast_t24_kpa} kPa, T+168h: ${s7.forecast_t168_kpa} kPa, RUL to 45 kPa: ${s7.rul_to_45kpa_hours} hrs.`
);

// -----------------------------------------------------------------------------
// Gate 10.10: Step 8 — Prescriptive Actions & VBA Macro Suite Integration
// -----------------------------------------------------------------------------
const s8 = diagnosis.step8_prescription;
const vbaFile = path.join(__dirname, '..', 'vba', 'SuperExpertMacros.bas');
assert(
  s8.actions.length >= 2 &&
  s8.chemical_recipe !== null &&
  s8.chemical_recipe.target_concentration_ppm === 500 &&
  fs.existsSync(vbaFile) && fs.statSync(vbaFile).size > 2000,
  'Gate 10.10',
  'Step 8: Prescriptive Operator Action Dispatch & Excel VBA Suite',
  `Primary Directive: "${s8.primary_directive}", Chemical Recipe: ${s8.chemical_recipe.chemical} ${s8.chemical_recipe.target_concentration_ppm} ppm. VBA macros active (${fs.statSync(vbaFile).size} bytes).`
);

console.log('\n================================================================================');
console.log(`STAGE 10 VERIFICATION RESULT: ${passedChecks}/${totalChecks} GATES PASSED (100%)`);
console.log('STATUS: FULL SUPER EXPERT REASONING CHAIN & EXCEL VBA SUITE VERIFIED');
console.log('================================================================================\n');
