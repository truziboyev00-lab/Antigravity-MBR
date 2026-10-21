#!/usr/bin/env python3
"""
UNIT 77 MBR SUPER EXPERT — STAGE 4 GATE VERIFICATION (PYTHON AUDIT)
Author: Turgunjon Ruziboyev

Python test runner validating:
 - Python 4.1: High-side hysteresis deadband state transitions
 - Python 4.2: Low-side hysteresis deadband state transitions
 - Python 4.3: Persistence time-window latching vs transient spikes
 - Python 4.4: Rate of Change (ROC) derivation and slope monitoring
 - Python 4.5: Multi-Risk Index (MRI 0-100) composite synthesis
 - Python 4.6: Risk factor domain partitioning (Hydraulic, Biological, Mechanical, DQ)
 - Python 4.7: Inter-Train Peer Comparison Z-score statistics
 - Python 4.8: Multi-Symptom Diagnostic Reasoning & Fault Inference
 - Python 4.9: OpenXML Inspection of Stage 4 Workbook Worksheets
 - Python 4.10: Zero-division and mathematical edge guards
"""

import sys
import math
import zipfile
import xml.etree.ElementTree as ET
import os

passed_checks = 0
total_checks = 0

def assert_check(check_id, name, condition, details=""):
    global passed_checks, total_checks
    total_checks += 1
    if condition:
        passed_checks += 1
        print(f"[PASS] {check_id}: {name}")
        if details:
            print(f"       {details}")
    else:
        print(f"[FAIL] {check_id}: {name}")
        if details:
            print(f"       {details}")

print("====================================================")
print("UNIT 77 MBR SUPER EXPERT — STAGE 4 PYTHON GATE AUDIT")
print("Author: Turgunjon Ruziboyev")
print("====================================================")

# --- Python 4.1: High-Side Hysteresis ---
# Trip = 45.0, Deadband = 3.0, Reset = 42.0
def eval_high_side(val, was_latched, dur_sec, thresh=45.0, deadband=3.0, persist=120):
    reset_thresh = thresh - deadband
    is_breach = val > thresh
    if was_latched:
        is_latched = val >= reset_thresh
    else:
        is_latched = is_breach and dur_sec >= persist
    return is_latched

h1 = eval_high_side(46.5, False, 150)
h2 = eval_high_side(43.5, True, 200) # Inside deadband, must hold
h3 = eval_high_side(41.5, True, 0)   # Below reset, clears

assert_check(
    "Python 4.1",
    "High-Side Hysteresis Deadband Transitions",
    h1 is True and h2 is True and h3 is False,
    f"Trip: {h1}, Hold: {h2}, Reset: {not h3} (Threshold: 45.0, Reset: 42.0 kPa)"
)

# --- Python 4.2: Low-Side Hysteresis ---
# Trip = 100.0, Deadband = 10.0, Reset = 110.0
def eval_low_side(val, was_latched, dur_sec, thresh=100.0, deadband=10.0, persist=600):
    reset_thresh = thresh + deadband
    is_breach = val < thresh
    if was_latched:
        is_latched = val <= reset_thresh
    else:
        is_latched = is_breach and dur_sec >= persist
    return is_latched

l1 = eval_low_side(92.0, False, 650)
l2 = eval_low_side(106.0, True, 700) # Inside deadband, must hold
l3 = eval_low_side(114.0, True, 0)   # Above reset, clears

assert_check(
    "Python 4.2",
    "Low-Side Hysteresis Deadband Transitions",
    l1 is True and l2 is True and l3 is False,
    f"Trip: {l1}, Hold: {l2}, Reset: {not l3} (Threshold: 100.0, Reset: 110.0 LMH/bar)"
)

# --- Python 4.3: Persistence Filtering ---
p_transient = eval_high_side(52.0, False, 30, persist=120)
p_sustained = eval_high_side(52.0, False, 130, persist=120)

assert_check(
    "Python 4.3",
    "Persistence Window Spike Suppression",
    p_transient is False and p_sustained is True,
    f"Transient 30s: Latched={p_transient}, Sustained 130s: Latched={p_sustained}"
)

# --- Python 4.4: Rate of Change (ROC) ---
def calc_roc(now_val, prev_val, dt_min):
    if dt_min <= 0:
        return 0.0
    return (now_val - prev_val) / (dt_min / 60.0)

roc_norm = calc_roc(22.3, 22.0, 60.0)
roc_fast = calc_roc(33.4, 28.0, 120.0)

assert_check(
    "Python 4.4",
    "Rate of Change (ROC) Calculation",
    abs(roc_norm - 0.30) < 1e-4 and abs(roc_fast - 2.70) < 1e-4,
    f"Normal: {roc_norm:.2f} kPa/h, Accelerated: {roc_fast:.2f} kPa/h"
)

# --- Python 4.5 & 4.6: Multi-Risk Index (MRI 0-100) ---
def compute_mri(tmp, lp, roc, mlss, do_val, srt, air, turb, vib, dq_flag="GOOD"):
    # Hydraulic Risk (40%)
    tmp_r = (tmp / 25.0) * 15.0 if tmp <= 25 else (
        15.0 + ((tmp - 25.0) / 10.0) * 20.0 if tmp <= 35 else (
            35.0 + ((tmp - 35.0) / 10.0) * 35.0 if tmp <= 45 else 70.0 + min(30.0, ((tmp - 45.0) / 15.0) * 30.0)
        )
    )
    lp_r = 5.0 if lp >= 180 else (
        10.0 + ((180.0 - lp) / 40.0) * 25.0 if lp >= 140 else (
            35.0 + ((140.0 - lp) / 40.0) * 35.0 if lp >= 100 else 70.0 + min(30.0, ((100.0 - lp) / 40.0) * 30.0)
        )
    )
    roc_r = min(100.0, max(0.0, (roc / 1.5) * 100.0))
    hyd = min(100.0, max(0.0, 0.50 * tmp_r + 0.35 * lp_r + 0.15 * roc_r))

    # Biological Risk (25%)
    m_r = 85.0 + min(15.0, ((mlss - 14000.0) / 4000.0) * 15.0) if mlss > 14000 else (
        45.0 + ((mlss - 12000.0) / 2000.0) * 40.0 if mlss > 12000 else 10.0
    )
    d_r = 90.0 if do_val < 1.0 else (
        60.0 + ((1.5 - do_val) / 0.5) * 30.0 if do_val < 1.5 else (
            20.0 + ((2.0 - do_val) / 0.5) * 40.0 if do_val < 2.0 else 5.0
        )
    )
    s_r = 80.0 if srt > 45 else (40.0 + ((srt - 35.0) / 10.0) * 40.0 if srt > 35 else 10.0)
    bio = min(100.0, max(0.0, 0.40 * m_r + 0.35 * d_r + 0.25 * s_r))

    # Mechanical Risk (20%)
    a_r = 90.0 if air < 700 else (
        70.0 + ((750.0 - air) / 50.0) * 20.0 if air < 750 else (
            20.0 + ((850.0 - air) / 100.0) * 50.0 if air < 850 else 5.0
        )
    )
    t_r = 100.0 if turb > 0.40 else (30.0 + ((turb - 0.20) / 0.20) * 70.0 if turb > 0.20 else 5.0)
    v_r = 90.0 if vib > 4.5 else (50.0 if vib > 3.0 else 10.0)
    mech = min(100.0, max(0.0, 0.45 * a_r + 0.35 * t_r + 0.20 * v_r))

    dq = 0.0 if dq_flag == "GOOD" else 100.0
    total = round(0.40 * hyd + 0.25 * bio + 0.20 * mech + 0.15 * dq, 1)
    return total, hyd, bio, mech

mri_nom, hyd_nom, bio_nom, mech_nom = compute_mri(22.0, 175.0, 0.2, 9500, 2.4, 25.0, 920, 0.06, 1.5, "GOOD")
mri_str, hyd_str, bio_str, mech_str = compute_mri(48.5, 85.0, 2.2, 14500, 0.85, 48.0, 650, 0.45, 4.8, "FAULT")

assert_check(
    "Python 4.5",
    "Multi-Risk Index (MRI 0-100) Composite",
    mri_nom < 25.0 and mri_str >= 75.0,
    f"Nominal MRI: {mri_nom}/100, Stressed MRI: {mri_str}/100"
)

assert_check(
    "Python 4.6",
    "Risk Factor Domain Partitioning",
    hyd_str > 70.0 and bio_str > 75.0 and mech_str > 70.0,
    f"Stressed Sub-scores: Hyd={hyd_str:.1f}, Bio={bio_str:.1f}, Mech={mech_str:.1f}"
)

# --- Python 4.7: Inter-Train Peer Comparison Z-Scores ---
def calc_peer_z(train_vals):
    n = len(train_vals)
    mean = sum(train_vals) / n
    var = sum((x - mean) ** 2 for x in train_vals) / (n - 1)
    std = math.sqrt(var)
    z_scores = [(x - mean) / std if std > 1e-4 else 0.0 for x in train_vals]
    pct_devs = [((x - mean) / mean) * 100.0 for x in train_vals]
    return mean, std, z_scores, pct_devs

mean, std, z_scores, pct_devs = calc_peer_z([160.0, 158.0, 105.0, 162.0])
assert_check(
    "Python 4.7",
    "Inter-Train Peer Comparison Z-Scores",
    mean == 146.25 and pct_devs[2] < -25.0,
    f"Peer Mean: {mean:.2f}, Std: {std:.2f}, Train C Dev: {pct_devs[2]:.1f}%"
)

# --- Python 4.8: Multi-Symptom Diagnostic Reasoning ---
def diagnose(turb, air, tmp, temp, mlss, lp):
    if turb > 0.35: return "FAULT_FIBER_RUPTURE"
    if air < 750 and tmp > 35: return "FAULT_AERATION_DEFICIT"
    if temp < 14 and tmp > 40 and lp > 140: return "PHENOMENON_COLD_VISCOSITY"
    if mlss > 13000 and lp < 110: return "FAULT_COLLOIDAL_FOULING"
    return "NOMINAL"

d1 = diagnose(0.65, 900, 24, 19, 9000, 160)
d2 = diagnose(0.08, 620, 42, 18, 10500, 135)
d3 = diagnose(0.07, 910, 43.5, 9.5, 9800, 165)
d4 = diagnose(0.08, 900, 44, 18, 14200, 95)

assert_check(
    "Python 4.8",
    "Multi-Symptom Root-Cause Hypothesis Inference",
    d1 == "FAULT_FIBER_RUPTURE" and d2 == "FAULT_AERATION_DEFICIT" and d3 == "PHENOMENON_COLD_VISCOSITY" and d4 == "FAULT_COLLOIDAL_FOULING",
    f"Inferred: 1={d1}, 2={d2}, 3={d3}, 4={d4}"
)

# --- Python 4.9: OpenXML Workbook Inspection ---
xlsx_path = os.path.join(os.path.dirname(__file__), "../public/UNIT_77_MBR_SUPER_EXPERT.xlsx")
try:
    with zipfile.ZipFile(xlsx_path, 'r') as z:
        # Check workbook.xml for sheets
        wb_xml = z.read('xl/workbook.xml').decode('utf-8')
        has_sh11 = 'name="11_Events_Alarms"' in wb_xml
        has_sh12 = 'name="12_Peer_Comparison"' in wb_xml

        # Check sheet11 strings
        has_hyst = False
        for name in z.namelist():
            if name.startswith('xl/worksheets/sheet') or name == 'xl/sharedStrings.xml':
                content = z.read(name).decode('utf-8', errors='ignore')
                if 'HYST' in content:
                    has_hyst = True
                    break

    assert_check(
        "Python 4.9",
        "OpenXML Stage 4 Sheets & Hysteresis Presence",
        has_sh11 and has_sh12 and has_hyst,
        f"Sheet 11: {has_sh11}, Sheet 12: {has_sh12}, Hysteresis token present: {has_hyst}"
    )
except Exception as e:
    assert_check("Python 4.9", "OpenXML Inspection", False, str(e))

# --- Python 4.10: Zero Division Safeguards ---
zero_roc = calc_roc(25.0, 25.0, 0.0)
m, s, z_all_zeros, _ = calc_peer_z([150.0, 150.0, 150.0, 150.0])

assert_check(
    "Python 4.10",
    "Zero Division Safeguards & Clamping",
    zero_roc == 0.0 and all(z == 0.0 for z in z_all_zeros),
    f"Zero dt ROC: {zero_roc}, Identical train Z-scores: {z_all_zeros}"
)

print("----------------------------------------------------")
print(f"TOTAL PYTHON AUDIT CHECKS: {total_checks} | PASSED: {passed_checks} | FAILED: {total_checks - passed_checks}")
if passed_checks == total_checks:
    print(">>> STAGE 4 PYTHON GATE: [PASS] <<<")
else:
    print(">>> STAGE 4 PYTHON GATE: [FAIL] <<<")
    sys.exit(1)
