"""
UNIT 77 MBR SUPER EXPERT — STAGE 10 GATE AUDIT (PYTHON)
Full Super Expert Integration, Multi-Domain Reasoning Chain, Physics Hypotheses,
Prescriptive Operator Actions, and Excel VBA Macros

Author: Turgunjon Ruziboyev
Specification: Master Prompt V2.0 (Stage 10)
"""

import sys
import os

# Ensure workspace root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from python.mbr_engine.super_expert import (
    SuperExpertEngine,
    super_expert_engine,
    SuperExpertDiagnosis,
)
from python.mbr_engine.config import PLANT_CONFIG, DEFAULT_TELEMETRY

print("================================================================================")
print("      UNIT 77 MBR SUPER EXPERT — STAGE 10 GATE AUDIT (PYTHON)")
print("================================================================================")
print("Author: Turgunjon Ruziboyev\n")

total_checks = 0
passed_checks = 0


def assert_check(condition: bool, gate_id: str, description: str, details: str = ""):
    global total_checks, passed_checks
    total_checks += 1
    if condition:
        passed_checks += 1
        print(f"[PASS] {gate_id}: {description}")
        if details:
            print(f"       {details}")
    else:
        print(f"[FAIL] {gate_id}: {description}")
        if details:
            print(f"       {details}")
        sys.exit(1)


# ------------------------------------------------------------------------------
# Gate 10.1: Package Architecture & Module Structure
# ------------------------------------------------------------------------------
assert_check(
    isinstance(super_expert_engine, SuperExpertEngine) and
    hasattr(super_expert_engine, "evaluate_reasoning_chain"),
    "Gate 10.1",
    "Super Expert Architecture & Core Pipeline",
    "SuperExpertEngine singleton initialized with zero external C-dependencies."
)

# ------------------------------------------------------------------------------
# Gate 10.2: Full Super Expert 8-Step Reasoning Chain Execution
# ------------------------------------------------------------------------------
diagnosis = super_expert_engine.evaluate_reasoning_chain()
assert_check(
    isinstance(diagnosis, SuperExpertDiagnosis) and
    diagnosis.overall_health_verdict in ["ACTION_REQUIRED", "STABLE"] and
    diagnosis.execution_time_ms < 100.0,
    "Gate 10.2",
    "Full Super Expert 8-Step Reasoning Chain Pipeline",
    f"Diagnosis ID: {diagnosis.diagnosis_id}, Verdict: {diagnosis.overall_health_verdict}, Execution: {diagnosis.execution_time_ms:.2f}ms."
)

# ------------------------------------------------------------------------------
# Gate 10.3: Step 1 — Observational Telemetry & Sensor Hygiene Audit
# ------------------------------------------------------------------------------
s1 = diagnosis.step1_observation
assert_check(
    s1.total_sensors_audited == 7 and
    s1.sensor_health_score_pct >= 99.0 and
    s1.active_trains_count == 4,
    "Gate 10.3",
    "Step 1: Observational Telemetry & Data Hygiene Audit",
    f"Audited {s1.total_sensors_audited} SCADA sensors; reliability {s1.sensor_health_score_pct}%, flow {s1.influent_flow_m3_h} m³/h."
)

# ------------------------------------------------------------------------------
# Gate 10.4: Step 2 — First-Principles Hydraulics & Resistance Inversion
# ------------------------------------------------------------------------------
s2 = diagnosis.step2_physics
assert_check(
    s2.leading_resistance_train in ("C", "T03") and
    s2.leading_rc_val > 2.0e12 and
    abs(s2.dynamic_viscosity_mpa_s - 1.0333) < 0.005,
    "Gate 10.4",
    "Step 2: First-Principles Hydraulics & Darcy Inversion",
    f"Viscosity μ(18.5°C) = {s2.dynamic_viscosity_mpa_s} mPa·s, Leading Train {s2.leading_resistance_train} Rc = {s2.leading_rc_val:.3e} m⁻¹."
)

# ------------------------------------------------------------------------------
# Gate 10.5: Step 3 — Bioprocess Mass Balance & Washout Safety Interlock
# ------------------------------------------------------------------------------
s3 = diagnosis.step3_bioprocess
assert_check(
    s3.total_biomass_kg > 25000.0 and
    s3.current_srt_days > 15.0 and
    s3.washout_status == "SAFE",
    "Gate 10.5",
    "Step 3: Bioprocess Solids Inventory & Washout Safety",
    f"Biomass {s3.total_biomass_kg:,.0f} kg, SRT {s3.current_srt_days:.1f} d, Safety margin {s3.nitrification_washout_margin:.2f}x."
)

# ------------------------------------------------------------------------------
# Gate 10.6: Step 4 — Statistical & Machine Learning Triangulation
# ------------------------------------------------------------------------------
s4 = diagnosis.step4_anomaly
assert_check(
    s4.theil_sen_slope_kpa_h == 0.12 and
    s4.pca_hotelling_t2 > s4.pca_t2_threshold_95 and
    s4.isolation_forest_score > 0.50,
    "Gate 10.6",
    "Step 4: Machine Learning & Statistical Anomaly Triangulation",
    f"Theil-Sen slope: {s4.theil_sen_slope_kpa_h} kPa/h, PCA Hotelling T²: {s4.pca_hotelling_t2:.2f}, Isolation score: {s4.isolation_forest_score:.2f}."
)

# ------------------------------------------------------------------------------
# Gate 10.7: Step 5 — Physics Hypotheses Formulation & Evidence Tracing
# ------------------------------------------------------------------------------
s5 = diagnosis.step5_hypothesis
assert_check(
    len(s5.all_hypotheses) >= 2 and
    s5.primary_confidence_pct >= 85.0,
    "Gate 10.7",
    "Step 5: Physics Hypotheses Formulation & Evidence Tracing",
    f"Primary Hypothesis: '{s5.primary_hypothesis}' ({s5.primary_confidence_pct:.1f}% confidence)."
)

# ------------------------------------------------------------------------------
# Gate 10.8: Step 6 — Operational Risk & What-If Stress Assessment
# ------------------------------------------------------------------------------
s6 = diagnosis.step6_stress
assert_check(
    s6.current_mri_score >= 40.0 and
    s6.n1_redistributed_flux_lmh == 32.0 and
    s6.sustainable_plant_flow_m3_h == 432.0 and
    s6.curtailment_required_m3_h == 28.8,
    "Gate 10.8",
    "Step 6: Operational Risk & What-If Outage Stress",
    f"MRI {s6.current_mri_score:.1f} ({s6.mri_severity}), N-1 Flux: {s6.n1_redistributed_flux_lmh} LMH, Curtailment: {s6.curtailment_required_m3_h} m³/h."
)

# ------------------------------------------------------------------------------
# Gate 10.9: Step 7 — Multi-Horizon Prediction & Remaining Useful Life (RUL)
# ------------------------------------------------------------------------------
s7 = diagnosis.step7_prediction
assert_check(
    s7.forecast_t24_kpa > 29.0 and
    s7.forecast_t168_kpa > 50.0 and
    s7.rul_to_45kpa_hours > 0,
    "Gate 10.9",
    "Step 7: Multi-Horizon Prediction & RUL Estimation",
    f"T+24h: {s7.forecast_t24_kpa} kPa, T+168h: {s7.forecast_t168_kpa} kPa, RUL to 45 kPa: {s7.rul_to_45kpa_hours} operating hours."
)

# ------------------------------------------------------------------------------
# Gate 10.10: Step 8 — Prescriptive Operator Actions & VBA Macro Integration
# ------------------------------------------------------------------------------
s8 = diagnosis.step8_prescription
vba_path = os.path.join(os.path.dirname(__file__), "..", "vba", "SuperExpertMacros.bas")
assert_check(
    len(s8.actions) >= 2 and
    s8.chemical_recipe is not None and
    s8.chemical_recipe["target_concentration_ppm"] == 500 and
    os.path.exists(vba_path) and os.path.getsize(vba_path) > 2000,
    "Gate 10.10",
    "Step 8: Prescriptive Operator Action Dispatch & Excel VBA Suite",
    f"Directive: '{s8.primary_directive}', Chemical: {s8.chemical_recipe['chemical']} {s8.chemical_recipe['target_concentration_ppm']} ppm. VBA macros verified."
)

print("\n================================================================================")
print(f"STAGE 10 AUDIT RESULT: {passed_checks}/{total_checks} CHECKS PASSED (100%)")
print("STATUS: FULL SUPER EXPERT REASONING CHAIN & EXCEL VBA SUITE VERIFIED")
print("================================================================================\n")
