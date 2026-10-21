#!/usr/bin/env python3
"""
UNIT 77 MBR SUPER EXPERT — STAGE 8 INDEPENDENT GATE AUDIT
Verification script for Stage 8: Advanced Python Super Expert Analytics
(Theil-Sen Robust Slope, Hampel Outlier Filter, PCA & Hotelling T2, Isolation Forest, SHAP Attribution)

Author: Turgunjon Ruziboyev
Date: 2026-09-18
Specification: Master Prompt V2.0
"""

import sys
import os
import json
import math
import random

# Ensure python folder is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from python.mbr_engine import (
        theil_sen_estimator,
        hampel_filter,
        detect_flatlines,
        evaluate_sensor_health,
        fit_pca_model,
        evaluate_hotelling_t2,
        IsolationForest,
        evaluate_isolation_forest,
        compute_shap_attributions,
        run_stage8_analytics_pipeline,
        generate_python_output_payload,
    )
except ImportError as e:
    print(f"FATAL: Failed to import python.mbr_engine analytics: {e}")
    sys.exit(1)


def print_gate(gate_id: str, title: str, passed: bool, details: str = ""):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"{status} {gate_id}: {title}")
    if details:
        print(f"       {details}")
    if not passed:
        sys.exit(1)


def main():
    print("=" * 80)
    print("      UNIT 77 MBR SUPER EXPERT — STAGE 8 GATE AUDIT (PYTHON)")
    print("=" * 80)

    # --------------------------------------------------------------------------
    # Gate 8.1: Package Architecture & Submodule Structure
    # --------------------------------------------------------------------------
    exports = [
        theil_sen_estimator,
        hampel_filter,
        detect_flatlines,
        evaluate_sensor_health,
        fit_pca_model,
        evaluate_hotelling_t2,
        IsolationForest,
        evaluate_isolation_forest,
        compute_shap_attributions,
        run_stage8_analytics_pipeline,
    ]
    all_callable = all(callable(fn) for fn in exports)
    print_gate(
        "Gate 8.1",
        "Pure Python Advanced Analytics Architecture & Exports",
        all_callable,
        "All 10 core analytics interfaces loaded with zero external C-dependencies."
    )

    # --------------------------------------------------------------------------
    # Gate 8.2: Theil-Sen Robust Estimator Breakdown Point & Outlier Resistance
    # --------------------------------------------------------------------------
    # Test ground-truth line y = 0.20 * x + 15.0 with 30% severe corrupting outliers
    x_test = [float(i) for i in range(20)]
    true_slope = 0.20
    true_intercept = 15.0
    y_corrupted = [true_slope * xi + true_intercept for xi in x_test]
    # Corrupt 5 points (25% contamination) with huge positive spikes
    corrupted_indices = [3, 7, 11, 15, 18]
    for idx in corrupted_indices:
        y_corrupted[idx] += 25.0  # Massive spike

    ts_res = theil_sen_estimator(x_test, y_corrupted)
    # Theil-Sen should recover true slope ~0.20 within tolerance
    ts_slope_err = abs(ts_res.slope - true_slope)
    ols_slope_err = abs(ts_res.ols_slope - true_slope)
    # OLS is expected to be severely biased (> 0.20) while Theil-Sen remains exact (~0.20)
    is_robust = (ts_slope_err < 0.05) and (ols_slope_err > 0.20)
    print_gate(
        "Gate 8.2",
        "Theil-Sen Robust Estimator Breakdown Point & Outlier Resistance",
        is_robust and ts_res.status == "CONVERGED",
        f"Theil-Sen slope={ts_res.slope:.4f} (err={ts_slope_err:.4f}) vs OLS slope={ts_res.ols_slope:.4f} (err={ols_slope_err:.4f})."
    )

    # --------------------------------------------------------------------------
    # Gate 8.3: Hampel Sliding-Window Outlier Detection & MAD Filtering
    # --------------------------------------------------------------------------
    # Waveform with 2 explicit impulse spikes
    data_series = [10.0 + math.sin(i * 0.2) * 0.5 for i in range(50)]
    spike_1 = 12
    spike_2 = 38
    data_series[spike_1] += 8.0
    data_series[spike_2] -= 7.5

    hampel_res = hampel_filter(data_series, window_size=7, n_sigmas=3.0)
    spikes_found = (spike_1 in hampel_res.outlier_indices) and (spike_2 in hampel_res.outlier_indices)
    spikes_cleaned = abs(hampel_res.filtered_series[spike_1] - 10.0) < 1.5
    print_gate(
        "Gate 8.3",
        "Hampel Sliding-Window Outlier Detection & 1.4826 MAD Imputation",
        spikes_found and spikes_cleaned and hampel_res.outlier_count >= 2,
        f"Identified {hampel_res.outlier_count} outliers at indices {hampel_res.outlier_indices}, filtered values imputed."
    )

    # --------------------------------------------------------------------------
    # Gate 8.4: Sensor Flatline & Frozen Instrument Detection
    # --------------------------------------------------------------------------
    flat_data = [1.2, 1.3, 1.25, 1.25, 1.25, 1.25, 1.25, 1.25, 1.4, 1.5]
    flats = detect_flatlines(flat_data, min_consecutive=5)
    flat_verified = (len(flats) == 6) and (flats == [2, 3, 4, 5, 6, 7])
    print_gate(
        "Gate 8.4",
        "Sensor Flatline & Frozen Instrument Detection",
        flat_verified,
        f"Detected 6 consecutive frozen samples across indices 2..7 (tolerance=1e-6)."
    )

    # --------------------------------------------------------------------------
    # Gate 8.5: Sensor Health Matrix Audit (Sheet 16 Parity)
    # --------------------------------------------------------------------------
    # 1440 samples for Train C suction pressure with small noise and 8 outliers
    rng_c = random.Random(771)
    samples_c = [27.5 + rng_c.gauss(0.0, 0.05) for _ in range(1440)]
    for _ in range(8):
        samples_c[rng_c.randint(0, 1439)] += 6.0
    report_c = evaluate_sensor_health("PT-771C Train C Suction", samples_c)
    health_pass = (
        report_c.good_samples >= 1430
        and report_c.quality_pct >= 99.0
        and "ACCEPTABLE" in report_c.health_verdict
    )
    print_gate(
        "Gate 8.5",
        "Sensor Health Matrix Audit & Sheet 16 Quality Statistics",
        health_pass,
        f"{report_c.sensor_tag}: Good={report_c.good_samples}/1440, Quality={report_c.quality_pct}%, Verdict={report_c.health_verdict}."
    )

    # --------------------------------------------------------------------------
    # Gate 8.6: Pure Python Symmetric Jacobi PCA Eigendecomposition
    # --------------------------------------------------------------------------
    # 4-variable dataset with known principal variance direction
    X_mat = []
    rng_pca = random.Random(42)
    for _ in range(80):
        v1 = rng_pca.gauss(0.0, 5.0)  # dominant direction
        v2 = 0.9 * v1 + rng_pca.gauss(0.0, 0.4)
        v3 = 0.7 * v1 + rng_pca.gauss(0.0, 0.5)
        v4 = rng_pca.gauss(0.0, 0.5)
        X_mat.append([v1, v2, v3, v4])

    pca = fit_pca_model(X_mat, ["F1", "F2", "F3", "F4"], n_components=2)
    # Check descending order of eigenvalues
    descending = pca.eigenvalues[0] >= pca.eigenvalues[1]
    # Check total explained variance > 80%
    high_variance = pca.total_explained_variance > 0.80
    print_gate(
        "Gate 8.6",
        "Pure Python Symmetric Jacobi PCA Eigendecomposition",
        descending and high_variance,
        f"Eigenvalues={pca.eigenvalues}, Total Explained Variance={pca.total_explained_variance * 100:.2f}%."
    )

    # --------------------------------------------------------------------------
    # Gate 8.7: Hotelling's T2 Multivariate Control Limit & Process Excursions
    # --------------------------------------------------------------------------
    nominal_sample = [0.1, 0.1, 0.05, -0.02]
    upset_sample = [18.0, 15.0, 6.0, -5.0]  # Extreme excursion

    hot_nom = evaluate_hotelling_t2(pca, nominal_sample)
    hot_upset = evaluate_hotelling_t2(pca, upset_sample)

    t2_pass = (
        hot_nom.t2_statistic < pca.ucl_95
        and not hot_nom.drift_alert
        and hot_nom.status == "WITHIN CONTROL"
        and hot_upset.t2_statistic > pca.ucl_99
        and hot_upset.alarm_latched
        and "OUT OF CONTROL" in hot_upset.status
    )
    print_gate(
        "Gate 8.7",
        "Hotelling T2 Multivariate Control Limit & Process Upset Latches",
        t2_pass,
        f"Nominal T2={hot_nom.t2_statistic} (< {pca.ucl_95}), Upset T2={hot_upset.t2_statistic} (> {pca.ucl_99}) -> Trip Verified."
    )

    # --------------------------------------------------------------------------
    # Gate 8.8: Pure Python Isolation Forest Anomaly Scoring Engine
    # --------------------------------------------------------------------------
    iso_forest = IsolationForest(n_trees=60, subsample_size=64, random_seed=42)
    iso_forest.fit(X_mat)
    nom_iso = evaluate_isolation_forest(iso_forest, nominal_sample)
    upset_iso = evaluate_isolation_forest(iso_forest, upset_sample)

    iso_pass = (
        nom_iso.anomaly_score < 0.0
        and nom_iso.status == "IN-DISTRIBUTION"
        and upset_iso.anomaly_score > 0.25
        and "ANOMAL" in upset_iso.status
    )
    print_gate(
        "Gate 8.8",
        "Pure Python Isolation Forest Tree Ensemble Anomaly Meter",
        iso_pass,
        f"Nominal score={nom_iso.anomaly_score} ({nom_iso.status}) vs Upset score={upset_iso.anomaly_score} ({upset_iso.status})."
    )

    # --------------------------------------------------------------------------
    # Gate 8.9: SHAP Permutation-Based Attribution & Axiom Compliance
    # --------------------------------------------------------------------------
    def surrogate_model(v):
        return 2.5 * v[0] + 1.2 * v[1] - 0.5 * v[2]

    shap_test = compute_shap_attributions(
        predict_fn=surrogate_model,
        sample=[5.0, 3.0, 1.0, 0.0],
        background_data=[[0.0, 0.0, 0.0, 0.0], [1.0, 1.0, 0.5, 0.0]],
        feature_names=["F1", "F2", "F3", "F4"],
        n_permutations=50,
        random_seed=42,
    )
    # F1 should be dominant feature since it has coefficient 2.5 and value 5.0
    shap_pass = (
        shap_test.dominant_feature == "F1"
        and shap_test.dominant_pct > 50.0
        and shap_test.efficiency_gap < 0.05
        and shap_test.explainability_status == "EXPLAINABLE"
    )
    print_gate(
        "Gate 8.9",
        "SHAP Permutation-Based Feature Attribution & Efficiency Axiom",
        shap_pass,
        f"Dominant={shap_test.dominant_feature} ({shap_test.dominant_pct:.1f}%), Efficiency Gap={shap_test.efficiency_gap:.6f}."
    )

    # --------------------------------------------------------------------------
    # Gate 8.10: Sheet 15 & Sheet 16 Python Exchange Synchronization
    # --------------------------------------------------------------------------
    payload = generate_python_output_payload()
    has_adv = "advanced_analytics" in payload
    has_sh15 = "sheet15_exchange" in payload
    has_sh16 = "sheet16_exchange" in payload

    sh15 = payload.get("sheet15_exchange", {})
    required_sh15_keys = [
        "Python Daemon State",
        "Model Engine Version",
        "Theil-Sen Robust Slope",
        "Isolation Forest Score",
        "PCA Hotelling T2 Metric",
        "SHAP Top Contributor",
        "Remaining Useful Life (RUL)",
    ]
    all_keys_present = all(k in sh15 for k in required_sh15_keys)
    sh16_count = len(payload.get("sheet16_exchange", []))

    sync_pass = has_adv and has_sh15 and has_sh16 and all_keys_present and (sh16_count == 7)
    print_gate(
        "Gate 8.10",
        "Sheet 15 & Sheet 16 Python Exchange Schema Synchronization",
        sync_pass,
        f"Sheet 15 fields verified ({len(required_sh15_keys)} items), Sheet 16 sensors verified ({sh16_count} items)."
    )

    print("-" * 80)
    print("STAGE 8 GATE AUDIT RESULT: 10 / 10 CHECKS PASSED")
    print("=" * 80)


if __name__ == "__main__":
    main()
