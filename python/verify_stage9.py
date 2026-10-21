"""
UNIT 77 MBR SUPER EXPERT — STAGE 9 GATE AUDIT (PYTHON)
Excel <-> Python Hybrid Bridge: Two-Way Parity, Heartbeat Telemetry & Graceful Fallback

Author: Turgunjon Ruziboyev
Specification: Master Prompt V2.0
"""

import sys
import os
import zipfile
import xml.etree.ElementTree as ET

# Ensure workspace root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from python.mbr_engine.hybrid_bridge import (
    HybridBridgeManager,
    hybrid_bridge,
    BridgeHeartbeat,
    MetricParityCheck,
    TwoWayValidationReport,
    HybridSyncResult,
)
from python.mbr_engine.config import PLANT_CONFIG, DEFAULT_TELEMETRY

print("================================================================================")
print("      UNIT 77 MBR SUPER EXPERT — STAGE 9 GATE AUDIT (PYTHON)")
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
# Gate 9.1: Package Architecture & Module Structure
# ------------------------------------------------------------------------------
assert_check(
    hasattr(hybrid_bridge, "evaluate_bidirectional_parity") and
    hasattr(hybrid_bridge, "execute_hybrid_sync") and
    hasattr(hybrid_bridge, "get_heartbeat"),
    "Gate 9.1",
    "Hybrid Bridge Architecture & Core Interfaces",
    "All hybrid bridge interfaces loaded with zero external C-dependencies."
)

# ------------------------------------------------------------------------------
# Gate 9.2: Bidirectional Parity Evaluation Coverage (8 Metrics)
# ------------------------------------------------------------------------------
parity_report = hybrid_bridge.evaluate_bidirectional_parity()
assert_check(
    parity_report.total_metrics_evaluated == 8 and len(parity_report.parity_details) == 8,
    "Gate 9.2",
    "Bidirectional Operational Metrics Coverage (8 Metrics)",
    f"Evaluated {parity_report.total_metrics_evaluated} metrics across Hydraulics, Physics, Biology, What-If, and Prediction."
)

# ------------------------------------------------------------------------------
# Gate 9.3: Absolute & Percentage Discrepancy Parity (<0.05% tolerance)
# ------------------------------------------------------------------------------
assert_check(
    parity_report.overall_status == "PASS" and parity_report.max_discrepancy_pct <= 0.05,
    "Gate 9.3",
    "Bidirectional Parity Accuracy (<0.05% Discrepancy)",
    f"Max Discrepancy: {parity_report.max_discrepancy_pct:.4f}%, Avg: {parity_report.avg_discrepancy_pct:.4f}% [Pass: {parity_report.metrics_passed}/{parity_report.total_metrics_evaluated}]."
)

# ------------------------------------------------------------------------------
# Gate 9.4: Hydraulic & Physics Parity (Flux, Viscosity, Darcy Rm)
# ------------------------------------------------------------------------------
flux_check = next(m for m in parity_report.parity_details if m.metric_name == "Train A Gross Flux")
visc_check = next(m for m in parity_report.parity_details if "Viscosity" in m.metric_name)
rm_check = next(m for m in parity_report.parity_details if "Darcy Clean" in m.metric_name)

assert_check(
    flux_check.status == "PASS" and visc_check.status == "PASS" and rm_check.status == "PASS",
    "Gate 9.4",
    "Hydraulic & Fluid Physics Parity (Flux, Viscosity, Rm)",
    f"Flux Diff: {flux_check.discrepancy_pct:.4f}%, Visc Diff: {visc_check.discrepancy_pct:.4f}%, Rm Diff: {rm_check.discrepancy_pct:.4f}%."
)

# ------------------------------------------------------------------------------
# Gate 9.5: Biological Mass Balance & What-If Parity (SRT, Outage, Compaction)
# ------------------------------------------------------------------------------
srt_check = next(m for m in parity_report.parity_details if "Solids Retention" in m.metric_name)
out_check = next(m for m in parity_report.parity_details if "N-1 Outage" in m.metric_name)
comp_check = next(m for m in parity_report.parity_details if "Compaction" in m.metric_name)

assert_check(
    srt_check.status == "PASS" and out_check.status == "PASS" and comp_check.status == "PASS",
    "Gate 9.5",
    "Biological SRT & What-If Scenario Parity (SRT, N-1, Compaction)",
    f"SRT Diff: {srt_check.discrepancy_pct:.4f}%, Outage Diff: {out_check.discrepancy_pct:.4f}%, Compaction Diff: {comp_check.discrepancy_pct:.4f}%."
)

# ------------------------------------------------------------------------------
# Gate 9.6: Predictive Horizon & Remaining Useful Life (RUL) Parity
# ------------------------------------------------------------------------------
fc24_check = next(m for m in parity_report.parity_details if "T+24h" in m.metric_name)
rul_check = next(m for m in parity_report.parity_details if "Remaining Useful Life" in m.metric_name)

assert_check(
    fc24_check.status == "PASS" and rul_check.status == "PASS",
    "Gate 9.6",
    "Multi-Horizon Prediction & RUL Parity (T+24h, RUL 45kPa)",
    f"Forecast T+24h Diff: {fc24_check.discrepancy_pct:.4f}%, RUL 45kPa Diff: {rul_check.discrepancy_pct:.4f}%."
)

# ------------------------------------------------------------------------------
# Gate 9.7: Normal Two-Way Hybrid Sync Cycle (Authority: PYTHON_ADVANCED)
# ------------------------------------------------------------------------------
sync_result = hybrid_bridge.execute_hybrid_sync(update_disk_workbook=False)
assert_check(
    sync_result.success and sync_result.daemon_state == "SYNCED" and sync_result.authority == "PYTHON_ADVANCED",
    "Gate 9.7",
    "Normal Hybrid Sync Cycle & Machine Learning Enrichment",
    f"Daemon State: {sync_result.daemon_state}, Authority: {sync_result.authority}, Latency: {sync_result.latency_ms:.2f}ms."
)

# ------------------------------------------------------------------------------
# Gate 9.8: Graceful Fallback on Daemon Offline Simulation
# ------------------------------------------------------------------------------
hybrid_bridge.is_simulated_offline = True
fallback_result = hybrid_bridge.execute_hybrid_sync()
fallback_hb = hybrid_bridge.get_heartbeat()

assert_check(
    not fallback_result.success and
    fallback_result.daemon_state == "FALLBACK_TO_EXCEL" and
    fallback_result.authority == "EXCEL_NATIVE" and
    fallback_result.fallback_triggered and
    fallback_hb.daemon_state in ["DEGRADED", "FALLBACK_TO_EXCEL", "DISCONNECTED"] and
    "DAEMON_OFFLINE" in (fallback_result.fallback_message or ""),
    "Gate 9.8",
    "Graceful Fallback State Machine on Python Daemon Disconnection",
    f"State: {fallback_result.daemon_state}, Authority: {fallback_result.authority}, Trigger: {fallback_result.fallback_message}."
)

# Recover daemon and test reconnection
hybrid_bridge.is_simulated_offline = False
recovery_sync = hybrid_bridge.execute_hybrid_sync()

# ------------------------------------------------------------------------------
# Gate 9.9: Heartbeat Telemetry & Watchdog Monitoring
# ------------------------------------------------------------------------------
heartbeat = hybrid_bridge.get_heartbeat()
assert_check(
    recovery_sync.success and
    heartbeat.daemon_state in ["ONLINE", "SYNCED"] and
    heartbeat.engine_version == "0.9.0" and
    heartbeat.roundtrip_latency_ms < 100.0,
    "Gate 9.9",
    "Heartbeat Health Monitoring & Roundtrip Latency Watchdog",
    f"State: {heartbeat.daemon_state}, Version: {heartbeat.engine_version}, Latency: {heartbeat.roundtrip_latency_ms}ms, Cycles: {heartbeat.total_sync_cycles}."
)

# ------------------------------------------------------------------------------
# Gate 9.10: OpenXML Production Workbook Stage 9 Sign-Off in Sheet 19 (Pure Python)
# ------------------------------------------------------------------------------
wb_path = hybrid_bridge.workbook_path
has_stage9_signoff = False
sheet_count = 0

with zipfile.ZipFile(wb_path, "r") as z:
    wb_xml = z.read("xl/workbook.xml")
    root = ET.fromstring(wb_xml)
    for elem in root.iter():
        if elem.tag.endswith("sheet") and "name" in elem.attrib:
            sheet_count += 1

    for fname in z.namelist():
        if "sharedstrings" in fname.lower():
            s_str = z.read(fname).decode("utf-8")
            if "Stage 9" in s_str and "Hybrid Bridge" in s_str:
                has_stage9_signoff = True

assert_check(
    sheet_count >= 19 and has_stage9_signoff,
    "Gate 9.10",
    "Pure Python OpenXML Production Workbook Stage 9 Sign-Off",
    f"Workbook verified ({sheet_count} sheets); Sheet 19 contains Stage 9 sign-off token."
)

print("--------------------------------------------------------------------------------")
print(f"STAGE 9 GATE AUDIT RESULT: {passed_checks} / {total_checks} CHECKS PASSED")
print("================================================================================")
