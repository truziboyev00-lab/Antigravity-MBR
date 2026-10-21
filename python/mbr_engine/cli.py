"""
UNIT 77 MBR SUPER EXPERT — COMMAND LINE INTERFACE (CLI)
Provides command-line commands for workbook auditing, running simulations,
and exporting calculated telemetry.
"""

import sys
import json
import argparse

from .workbook_bridge import audit_excel_workbook, generate_python_output_payload, compare_python_vs_excel
from .calibration import calibrate_all_parameters
from .analytics import run_stage8_analytics_pipeline, theil_sen_estimator, hampel_filter


def main():
    parser = argparse.ArgumentParser(
        description="Unit 77 MBR Super Expert — Python Engine CLI (Stage 9 Hybrid Bridge)"
    )
    parser.add_argument("--audit", action="store_true", help="Audit the Excel workbook structure and formulas")
    parser.add_argument("--compare", action="store_true", help="Run parity comparison between Python engine and Excel math")
    parser.add_argument("--export-json", action="store_true", help="Export unified calculation state matching Sheet 15 JSON schema")
    parser.add_argument("--calibrate", action="store_true", help="Run automated parameter calibration over plant data")
    parser.add_argument("--advanced", action="store_true", help="Execute Stage 8 Advanced Python Super Expert Analytics")
    parser.add_argument("--theil-sen", action="store_true", help="Execute Theil-Sen robust slope vs OLS comparison")
    parser.add_argument("--hampel", action="store_true", help="Execute Hampel sliding-window outlier detection filter")
    parser.add_argument("--pca", action="store_true", help="Execute PCA Hotelling T2 multivariate analysis")
    parser.add_argument("--isolation-forest", action="store_true", help="Execute Isolation Forest tree ensemble anomaly score")
    parser.add_argument("--shap", action="store_true", help="Execute SHAP feature attribution waterfall analysis")
    parser.add_argument("--hybrid-sync", action="store_true", help="Execute Stage 9 Excel <-> Python hybrid two-way synchronization")
    parser.add_argument("--verify-parity", action="store_true", help="Run bidirectional mathematical parity evaluation (<0.05% tolerance)")
    parser.add_argument("--simulate-fallback", action="store_true", help="Simulate Python failure and verify graceful fallback to Excel")
    parser.add_argument("--heartbeat", action="store_true", help="Display bridge heartbeat status, latency, and authority")
    parser.add_argument("--super-expert", action="store_true", help="Execute Stage 10 Full Super Expert 8-step reasoning chain and prescription")
    parser.add_argument("--stress-test", action="store_true", help="Execute Stage 11 Industrial Stress Testing (28 edge-case scenarios)")

    args = parser.parse_args()

    from .hybrid_bridge import hybrid_bridge
    from .super_expert import super_expert_engine
    from .stress_testing import stage11_stress_engine
    from dataclasses import asdict

    if args.stress_test:
        rep = stage11_stress_engine.run_all_scenarios()
        print(json.dumps(asdict(rep), indent=2))
        return

    if args.super_expert:
        diagnosis = super_expert_engine.evaluate_reasoning_chain()
        print(json.dumps(diagnosis.to_dict(), indent=2))
        return

    if args.hybrid_sync:
        res = hybrid_bridge.execute_hybrid_sync(update_disk_workbook=True)
        print(json.dumps(res.to_dict(), indent=2))
        return

    if args.verify_parity:
        val = hybrid_bridge.evaluate_bidirectional_parity()
        print(json.dumps(val.to_dict(), indent=2))
        return

    if args.simulate_fallback:
        hybrid_bridge.is_simulated_offline = True
        res = hybrid_bridge.execute_hybrid_sync()
        hybrid_bridge.is_simulated_offline = False
        print(json.dumps(res.to_dict(), indent=2))
        return

    if args.heartbeat:
        hb = hybrid_bridge.get_heartbeat()
        print(json.dumps(hb.to_dict(), indent=2))
        return

    if args.advanced:
        report = run_stage8_analytics_pipeline()
        print(json.dumps(report.to_dict(), indent=2))
        return

    if args.theil_sen:
        report = run_stage8_analytics_pipeline()
        print(json.dumps({k: v.to_dict() for k, v in report.theil_sen_slopes.items()}, indent=2))
        return

    if args.hampel:
        report = run_stage8_analytics_pipeline()
        print(json.dumps({k: v.to_dict() for k, v in report.sensor_health.items()}, indent=2))
        return

    if args.pca:
        report = run_stage8_analytics_pipeline()
        print(json.dumps({
            "pca_model": report.pca_model.to_dict(),
            "hotelling_t2": report.hotelling_t2.to_dict(),
        }, indent=2))
        return

    if args.isolation_forest:
        report = run_stage8_analytics_pipeline()
        print(json.dumps(report.isolation_forest.to_dict(), indent=2))
        return

    if args.shap:
        report = run_stage8_analytics_pipeline()
        print(json.dumps(report.shap_attribution.to_dict(), indent=2))
        return

    if args.audit:
        result = audit_excel_workbook()
        print(json.dumps(result, indent=2))
        return

    if args.compare:
        comps = compare_python_vs_excel()
        all_passed = all(c["parity_pass"] for c in comps)
        print("=== UNIT 77 MBR PYTHON <-> EXCEL PARITY REPORT ===")
        for c in comps:
            status = "PASS" if c["parity_pass"] else "FAIL"
            print(f"[{status}] {c['metric']}: Py={c['python']}, Excel={c['excel']} (Diff: {c['discrepancy_pct']:.4f}%)")
        print("==================================================")
        print(f"Overall Parity Status: {'PASS (100% Match)' if all_passed else 'FAIL'}")
        if not all_passed:
            sys.exit(1)
        return

    if args.calibrate:
        cal = calibrate_all_parameters()
        print(json.dumps(cal.to_dict(), indent=2))
        return

    if args.export_json:
        payload = generate_python_output_payload()
        print(json.dumps(payload, indent=2))
        return

    # Default action if no flag passed
    print("Unit 77 MBR Super Expert — Python Engine v0.8.0")
    print("Stage 8: Advanced Python Super Expert Analytics (Theil-Sen, Hampel, PCA, Isolation Forest, SHAP)")
    print("Author: Turgunjon Ruziboyev")
    print("Use --advanced, --theil-sen, --hampel, --pca, --isolation-forest, --shap, --audit, --compare, or --export-json")


if __name__ == "__main__":
    main()
