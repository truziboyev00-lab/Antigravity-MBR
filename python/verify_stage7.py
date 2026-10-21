#!/usr/bin/env python3
"""
UNIT 77 MBR SUPER EXPERT — STAGE 7 INDEPENDENT GATE AUDIT
Verification script for Stage 7: Python Engine Foundation (Modular Python Package Matching Excel Math)

Author: Turgunjon Ruziboyev
Date: 2026-09-18
"""

import sys
import os
import json
import math

# Ensure python folder is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from python.mbr_engine import (
        calculate_water_viscosity,
        calculate_gross_flux,
        calculate_net_flux,
        calculate_permeability,
        calculate_normalized_permeability,
        calculate_darcy_total_resistance,
        calculate_clean_membrane_resistance,
        calculate_cake_layer_resistance,
        calculate_specific_cake_resistance,
        calculate_compaction_exponent,
        calculate_total_biomass_inventory,
        calculate_solids_retention_time,
        calculate_hydraulic_retention_time,
        calculate_fm_ratio,
        check_nitrification_washout_risk,
        HysteresisAlarm,
        PersistenceAlarm,
        calculate_rate_of_change,
        calculate_peer_z_scores,
        calculate_multi_risk_index,
        diagnose_root_cause,
        simulate_train_outage,
        simulate_nonlinear_tmp,
        solve_sustainable_plant_flow,
        calculate_permeate_pump_power,
        simulate_was_srt_sensitivity,
        simulate_compound_stress,
        project_linear_forecast,
        project_exponential_forecast,
        calculate_remaining_useful_life,
        classify_operational_urgency,
        generate_prescriptive_cleaning_plan,
        perform_ols_regression,
        calibrate_all_parameters,
        audit_excel_workbook,
        generate_python_output_payload,
        compare_python_vs_excel,
    )
except ImportError as e:
    print(f"FATAL: Failed to import python.mbr_engine: {e}")
    sys.exit(1)


def run_gate_7_audit():
    print("================================================================================")
    print("      UNIT 77 MBR SUPER EXPERT — STAGE 7 PYTHON ENGINE GATE AUDIT")
    print("================================================================================")

    checks = []

    # -------------------------------------------------------------------------
    # Gate 7.1: Package Architecture & Submodule Structure
    # -------------------------------------------------------------------------
    try:
        import python.mbr_engine.config as cfg
        import python.mbr_engine.hydraulics as hyd
        import python.mbr_engine.biological as bio
        import python.mbr_engine.alarms as alm
        import python.mbr_engine.whatif as wif
        import python.mbr_engine.prediction as prd
        import python.mbr_engine.calibration as cal
        import python.mbr_engine.workbook_bridge as brg

        submodules_valid = all([
            hasattr(cfg, "PLANT_CONFIG"),
            hasattr(hyd, "calculate_water_viscosity"),
            hasattr(bio, "calculate_solids_retention_time"),
            hasattr(alm, "calculate_multi_risk_index"),
            hasattr(wif, "simulate_train_outage"),
            hasattr(prd, "project_linear_forecast"),
            hasattr(cal, "perform_ols_regression"),
            hasattr(brg, "audit_excel_workbook"),
        ])
        checks.append({
            "id": "Gate 7.1",
            "name": "Package Architecture & Submodule Structure",
            "passed": submodules_valid,
            "details": "All 8 modular sub-packages loaded with expected functional interfaces.",
        })
    except Exception as e:
        checks.append({
            "id": "Gate 7.1",
            "name": "Package Architecture & Submodule Structure",
            "passed": False,
            "details": f"Import failure: {e}",
        })

    # -------------------------------------------------------------------------
    # Gate 7.2: Hydraulic & Darcy Physics Parity
    # -------------------------------------------------------------------------
    try:
        flux = calculate_gross_flux(115.2, 4800.0)
        net_flux = calculate_net_flux(flux, 9.0, 0.75, 0.25)
        visc_18_5 = calculate_water_viscosity(18.5)
        perm = calculate_permeability(flux, 18.6)
        perm_20 = calculate_normalized_permeability(perm, 18.5)
        r_total = calculate_darcy_total_resistance(18.6, flux, 18.5)
        r_clean = calculate_clean_membrane_resistance(10.0, 24.0, 20.0)
        r_cake = calculate_cake_layer_resistance(r_total, r_clean)

        g7_2_pass = (
            abs(flux - 24.0) < 1e-4 and
            abs(net_flux - 21.6) < 1e-4 and
            abs(visc_18_5 - 1.0333) < 0.005 and
            abs(perm - 129.03) < 0.1 and
            r_total > 2.5e12 and
            r_clean > 1.45e12 and
            r_cake > 1.0e12
        )
        checks.append({
            "id": "Gate 7.2",
            "name": "Hydraulic & Darcy Physics Parity",
            "passed": g7_2_pass,
            "details": f"Gross Flux={flux:.2f} LMH, Net={net_flux:.2f} LMH, Visc={visc_18_5:.4f} cP, Rm={r_clean:.3e} m^-1, Rc={r_cake:.3e} m^-1.",
        })
    except Exception as e:
        checks.append({
            "id": "Gate 7.2",
            "name": "Hydraulic & Darcy Physics Parity",
            "passed": False,
            "details": f"Error: {e}",
        })

    # -------------------------------------------------------------------------
    # Gate 7.3: Biological Mass Balance & SRT Parity
    # -------------------------------------------------------------------------
    try:
        biomass = calculate_total_biomass_inventory(3200.0, 7000.0, 800.0, 7100.0)
        srt_nominal = calculate_solids_retention_time(biomass, 35.0, 7100.0, 11059.2, 1.5)
        srt_washout = calculate_solids_retention_time(biomass, 350.0, 7100.0, 11059.2, 1.5)
        washout_eval = check_nitrification_washout_risk(srt_washout)
        hrt = calculate_hydraulic_retention_time(4000.0, 460.8)

        g7_3_pass = (
            abs(biomass - 28080.0) < 1.0 and
            abs(srt_nominal - 105.9) < 0.5 and
            srt_washout < 12.0 and
            washout_eval["washout_risk"] is True and
            abs(hrt - 8.68) < 0.1
        )
        checks.append({
            "id": "Gate 7.3",
            "name": "Biological Mass Balance & Nitrification Protection",
            "passed": g7_3_pass,
            "details": f"Biomass={biomass:.0f} kg, Nominal SRT={srt_nominal:.1f}d, High WAS SRT={srt_washout:.1f}d (Washout Risk={washout_eval['washout_risk']}).",
        })
    except Exception as e:
        checks.append({
            "id": "Gate 7.3",
            "name": "Biological Mass Balance & Nitrification Protection",
            "passed": False,
            "details": f"Error: {e}",
        })

    # -------------------------------------------------------------------------
    # Gate 7.4: Advanced Diagnostic & Alarm Engine
    # -------------------------------------------------------------------------
    try:
        # Hysteresis check
        h_alarm = HysteresisAlarm("TMP_TRIP", trip_high=35.0, reset_low=32.0)
        h1 = h_alarm.evaluate(34.0)  # False
        h2 = h_alarm.evaluate(35.5)  # True (latched)
        h3 = h_alarm.evaluate(33.0)  # Still True (deadband)
        h4 = h_alarm.evaluate(31.5)  # False (reset)

        # Persistence check
        p_alarm = PersistenceAlarm("ROC_ALARM", threshold=0.50, required_persistence_cycles=3)
        p1 = p_alarm.evaluate(0.55)  # count 1 -> False
        p2 = p_alarm.evaluate(0.55)  # count 2 -> False
        p3 = p_alarm.evaluate(0.55)  # count 3 -> True

        # Z-Scores & MRI
        z_dict = calculate_peer_z_scores({"A": 125.0, "B": 120.0, "C": 80.0, "D": 128.0})
        mri_eval = calculate_multi_risk_index(
            max_tmp_kpa=32.0,
            max_roc_kpa_h=0.45,
            min_norm_perm_lmh_bar=80.0,
            srt_days=25.0,
            mlss_mg_l=8500.0,
            aeration_flow_nm3_h=420.0,
        )
        diag = diagnose_root_cause(33.0, 78.0, 0.08, 420.0, 18.5, 9500.0)

        g7_4_pass = (
            (not h1) and h2 and h3 and (not h4) and
            (not p1) and (not p2) and p3 and
            z_dict["C"]["z_score"] < -1.5 and
            mri_eval["mri_score"] > 30.0 and
            diag["diagnostic_code"] == "FAULT_COLLOIDAL_FOULING"
        )
        checks.append({
            "id": "Gate 7.4",
            "name": "Advanced Alarm Engine & Root Cause Classifier",
            "passed": g7_4_pass,
            "details": f"Hysteresis & Persistence verified. Train C Z-Score={z_dict['C']['z_score']:.2f}, MRI={mri_eval['mri_score']}, Diagnostic={diag['diagnostic_code']}.",
        })
    except Exception as e:
        checks.append({
            "id": "Gate 7.4",
            "name": "Advanced Alarm Engine & Root Cause Classifier",
            "passed": False,
            "details": f"Error: {e}",
        })

    # -------------------------------------------------------------------------
    # Gate 7.5: What-If Outage & Cake Compaction Simulation
    # -------------------------------------------------------------------------
    try:
        outage = simulate_train_outage(460.8, 3, 4800.0, 4)
        comp_tmp = simulate_nonlinear_tmp(19.5667, 24.0, 32.0, 1.40)
        bottle = solve_sustainable_plant_flow(3, 4800.0, 30.0, 460.8)
        pwr = calculate_permeate_pump_power(460.8, 20.0, 0.75)
        compound = simulate_compound_stress(530.0, 3, 8.0, 18.5, 19.5667, 24.0, 1.40)

        g7_5_pass = (
            abs(outage["redistributed_flux_lmh"] - 32.0) < 0.01 and
            abs(comp_tmp - 29.27) < 0.05 and
            abs(bottle["max_sustainable_flow_m3_h"] - 432.0) < 0.01 and
            abs(bottle["curtailment_required_m3_h"] - 28.8) < 0.01 and
            pwr["p_hyd_kw"] > 2.0 and
            compound["compound_tmp_kpa"] > 40.0
        )
        checks.append({
            "id": "Gate 7.5",
            "name": "What-If Outage & Cake Compaction Simulation",
            "passed": g7_5_pass,
            "details": f"N-1 Flux={outage['redistributed_flux_lmh']} LMH (+33.3%), Non-linear TMP={comp_tmp:.2f} kPa, Curtailment={bottle['curtailment_required_m3_h']} m3/h, Compound TMP={compound['compound_tmp_kpa']:.2f} kPa.",
        })
    except Exception as e:
        checks.append({
            "id": "Gate 7.5",
            "name": "What-If Outage & Cake Compaction Simulation",
            "passed": False,
            "details": f"Error: {e}",
        })

    # -------------------------------------------------------------------------
    # Gate 7.6: Multi-Horizon Forecast & Remaining Useful Life Matrix
    # -------------------------------------------------------------------------
    try:
        t_lin_24 = project_linear_forecast(20.0, 0.25, 24.0)
        t_lin_168 = project_linear_forecast(20.0, 0.25, 168.0)
        t_exp_24 = project_exponential_forecast(20.0, 0.25, 24.0)
        rul_lin_45 = calculate_remaining_useful_life(20.0, 0.25, 45.0, "LINEAR")
        rul_exp_45 = calculate_remaining_useful_life(20.0, 0.25, 45.0, "EXPONENTIAL")
        rul_estop = calculate_remaining_useful_life(20.0, 0.25, 55.0, "LINEAR")
        urgency = classify_operational_urgency(rul_lin_45)
        clean_plan = generate_prescriptive_cleaning_plan("C", 38.0, 10.5, True)

        g7_6_pass = (
            abs(t_lin_24 - 26.0) < 0.01 and
            abs(t_lin_168 - 62.0) < 0.01 and
            abs(t_exp_24 - 27.0) < 2.0 and
            abs(rul_lin_45 - 100.0) < 0.1 and
            abs(rul_estop - 140.0) < 0.1 and
            urgency == "NORMAL" and
            clean_plan["urgency"] == "CRITICAL"
        )
        checks.append({
            "id": "Gate 7.6",
            "name": "Multi-Horizon Forecast & RUL Engine",
            "passed": g7_6_pass,
            "details": f"Linear T+24h={t_lin_24} kPa, T+168h={t_lin_168} kPa, RUL(45kPa)={rul_lin_45}h, RUL(55kPa)={rul_estop}h, Critical Clean Plan={clean_plan['dispatch_order']}.",
        })
    except Exception as e:
        checks.append({
            "id": "Gate 7.6",
            "name": "Multi-Horizon Forecast & RUL Engine",
            "passed": False,
            "details": f"Error: {e}",
        })

    # -------------------------------------------------------------------------
    # Gate 7.7: Pure-Python OLS Regression & Parameter Calibration
    # -------------------------------------------------------------------------
    try:
        x_pts = [0.0, 10.0, 20.0, 30.0, 40.0]
        y_pts = [18.0, 20.5, 23.0, 25.5, 28.0]
        reg = perform_ols_regression(x_pts, y_pts)
        calib = calibrate_all_parameters()

        g7_7_pass = (
            abs(reg["slope"] - 0.25) < 1e-4 and
            abs(reg["intercept"] - 18.0) < 1e-4 and
            abs(reg["r2"] - 1.0) < 1e-4 and
            reg["rmse"] < 1e-4 and
            calib.calibration_converged is True and
            abs(calib.beta_compaction - 1.40) < 0.01
        )
        checks.append({
            "id": "Gate 7.7",
            "name": "OLS Regression & Parameter Inversion",
            "passed": g7_7_pass,
            "details": f"OLS Slope={reg['slope']:.4f}, R²={reg['r2']:.4f}, RMSE={reg['rmse']:.4f}, Calibrated Rm={calib.rm_clean_m_inv:.3e} m^-1, beta={calib.beta_compaction:.2f}.",
        })
    except Exception as e:
        checks.append({
            "id": "Gate 7.7",
            "name": "OLS Regression & Parameter Inversion",
            "passed": False,
            "details": f"Error: {e}",
        })

    # -------------------------------------------------------------------------
    # Gate 7.8: Pure Python OpenXML Workbook Auditor
    # -------------------------------------------------------------------------
    try:
        wb_audit = audit_excel_workbook()
        g7_8_pass = (
            wb_audit["exists"] is True and
            wb_audit["sheet_count"] >= 19 and
            wb_audit["formulas_detected"] > 100 and
            wb_audit["valid_structure"] is True
        )
        checks.append({
            "id": "Gate 7.8",
            "name": "Pure Python OpenXML Workbook Audit",
            "passed": g7_8_pass,
            "details": f"Workbook at {wb_audit['workbook_path']} audited: {wb_audit['sheet_count']} sheets, {wb_audit['formulas_detected']} formulas, valid structure={wb_audit['valid_structure']}.",
        })
    except Exception as e:
        checks.append({
            "id": "Gate 7.8",
            "name": "Pure Python OpenXML Workbook Audit",
            "passed": False,
            "details": f"Error: {e}",
        })

    # -------------------------------------------------------------------------
    # Gate 7.9: Python JSON Telemetry Payload Generation
    # -------------------------------------------------------------------------
    try:
        payload = generate_python_output_payload()
        g7_9_pass = (
            payload["engine_version"] in ["0.7.0", "0.8.0"] and
            len(payload["hydraulics"]) == 4 and
            "biological" in payload and
            "alarms" in payload and
            "whatif" in payload and
            "prediction" in payload and
            "calibration" in payload and
            payload["parity_with_excel"] is True
        )
        checks.append({
            "id": "Gate 7.9",
            "name": "Python JSON Output Schema Generation",
            "passed": g7_9_pass,
            "details": f"Generated schema-compliant payload with 4 trains, biological state, alarms, whatif, prediction, and calibration.",
        })
    except Exception as e:
        checks.append({
            "id": "Gate 7.9",
            "name": "Python JSON Output Schema Generation",
            "passed": False,
            "details": f"Error: {e}",
        })

    # -------------------------------------------------------------------------
    # Gate 7.10: Numerical Stability & Edge Case Handling
    # -------------------------------------------------------------------------
    try:
        # 1. Zero flux / zero area
        z_flux = calculate_gross_flux(0.0, 0.0)
        # 2. Viscosity at extreme cold
        sub_visc = calculate_water_viscosity(-5.0)
        # 3. RUL with zero slope
        rul_zero_slope = calculate_remaining_useful_life(20.0, 0.0, 45.0, "LINEAR")
        # 4. RUL with already exceeded TMP
        rul_exceeded = calculate_remaining_useful_life(48.0, 0.25, 45.0, "LINEAR")
        # 5. Permeability with 0 TMP
        perm_zero = calculate_permeability(24.0, 0.0)
        # 6. Outage with 0 active trains
        out_zero = simulate_train_outage(460.8, 0)

        g7_10_pass = (
            z_flux == 0.0 and
            sub_visc > 0.0 and
            rul_zero_slope > 20000.0 and
            rul_exceeded == 0.0 and
            not math.isinf(perm_zero) and
            out_zero["active_area_m2"] == 0.0
        )
        checks.append({
            "id": "Gate 7.10",
            "name": "Numerical Stability & Boundary Clamping",
            "passed": g7_10_pass,
            "details": f"Clamped boundary conditions: zero area flux={z_flux}, subzero visc={sub_visc:.4f}, zero-slope RUL={rul_zero_slope}h, exceeded RUL={rul_exceeded}h.",
        })
    except Exception as e:
        checks.append({
            "id": "Gate 7.10",
            "name": "Numerical Stability & Boundary Clamping",
            "passed": False,
            "details": f"Error: {e}",
        })

    # -------------------------------------------------------------------------
    # Summary Display
    # -------------------------------------------------------------------------
    passed_count = sum(1 for c in checks if c["passed"])
    total_count = len(checks)

    for c in checks:
        status_tag = "PASS" if c["passed"] else "FAIL"
        print(f"[{status_tag}] {c['id']}: {c['name']}")
        print(f"       {c['details']}")

    print("--------------------------------------------------------------------------------")
    print(f"STAGE 7 GATE AUDIT RESULT: {passed_count} / {total_count} CHECKS PASSED")
    print("================================================================================")

    if passed_count != total_count:
        sys.exit(1)
    return True


if __name__ == "__main__":
    run_gate_7_audit()
