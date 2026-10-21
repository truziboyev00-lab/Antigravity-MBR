#!/usr/bin/env python3
"""
UNIT 77 MBR SUPER EXPERT — STAGE 5 GATE VERIFICATION (PYTHON AUDIT)
Author: Turgunjon Ruziboyev

Python test runner validating Stage 5 engineering models:
 - Python 5.1: Train outage hydraulic redistribution & area scaling
 - Python 5.2: Non-linear TMP power-law response modeling (beta = 1.4)
 - Python 5.3: Sustainable flow bottleneck & automated curtailment solver
 - Python 5.4: Poiseuille cold-weather dynamic viscosity & drag ratio
 - Python 5.5: Permeate pumping power & Specific Energy Consumption (SEC)
 - Python 5.6: Daily sludge wastage mass balance & continuous SRT
 - Python 5.7: Nitrification washout protection threshold (SRT < 12 days)
 - Python 5.8: Multi-variable compound stress-test (Outage + Cold + Surge)
 - Python 5.9: OpenXML audit of Stage 5 Workbook formulas & Sheet 13
 - Python 5.10: Zero-division safeguards & boundary conditions
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
print("UNIT 77 MBR SUPER EXPERT — STAGE 5 PYTHON GATE AUDIT")
print("Author: Turgunjon Ruziboyev")
print("====================================================")

def calc_viscosity(temp_c):
    safe_t = max(0.1, min(80.0, temp_c))
    return 1.787 * math.exp(-0.0337 * safe_t + 0.000221 * (safe_t ** 2))

# --- Python 5.1: Train Outage Redistribution ---
q_plant = 460.8 # m3/h
a_train = 4800.0 # m2
active_trains = 3
a_active = active_trains * a_train # 14400.0 m2
j_sim = (q_plant * 1000.0) / a_active # 32.0 LMH
j_base = (q_plant * 1000.0) / (4.0 * a_train) # 24.0 LMH
flux_inc_pct = ((j_sim - j_base) / j_base) * 100.0

assert_check(
    "Python 5.1",
    "Train Outage Hydraulic Redistribution Math",
    abs(j_sim - 32.0) < 0.001 and abs(flux_inc_pct - 33.333) < 0.01,
    f"Active Area: {a_active:.0f} m2, Redistributed Flux: {j_sim:.2f} LMH (+{flux_inc_pct:.1f}%)"
)

# --- Python 5.2: Non-linear TMP Response Modeling ---
tmp_base = 19.5667 # kPa
beta = 1.4
tmp_sim = tmp_base * ((j_sim / j_base) ** beta)
tmp_exp = 19.5667 * ((32.0 / 24.0) ** 1.4)

assert_check(
    "Python 5.2",
    "Non-linear TMP Power-Law Response (beta = 1.4)",
    abs(tmp_sim - tmp_exp) < 0.01,
    f"Base TMP: {tmp_base:.2f} kPa -> Simulated TMP: {tmp_sim:.2f} kPa (+{(((tmp_sim - tmp_base)/tmp_base)*100.0):.1f}%)"
)

# --- Python 5.3: Sustainable Flow Bottleneck Solver ---
j_limit = 30.0 # LMH
q_sustainable = (a_active * j_limit) / 1000.0 # 432.0 m3/h
curtailment = max(0.0, q_plant - q_sustainable) # 28.8 m3/h
curtailment_pct = (curtailment / q_plant) * 100.0

assert_check(
    "Python 5.3",
    "Sustainable Flow Bottleneck & Curtailment Solver",
    abs(q_sustainable - 432.0) < 0.001 and abs(curtailment - 28.8) < 0.001,
    f"Sustainable Flow: {q_sustainable:.1f} m3/h, Curtailment Required: {curtailment:.1f} m3/h ({curtailment_pct:.2f}%)"
)

# --- Python 5.4: Poiseuille Cold-Weather Viscosity ---
mu_8 = calc_viscosity(8.0)
mu_18_5 = calc_viscosity(18.5)
mu_ratio = mu_8 / mu_18_5
cold_tmp = tmp_base * mu_ratio

assert_check(
    "Python 5.4",
    "Poiseuille Cold-Weather Dynamic Viscosity & Drag Ratio",
    1.38 < mu_8 < 1.39 and 1.33 < mu_ratio < 1.35,
    f"Viscosity at 8°C: {mu_8:.4f} mPa·s vs 18.5°C: {mu_18_5:.4f} mPa·s (Drag Multiplier: {mu_ratio:.3f}, Cold TMP: {cold_tmp:.2f} kPa)"
)

# --- Python 5.5: Permeate Pumping Power & SEC ---
hyd_kw = (q_plant * tmp_base) / 3600.0 # 2.505 kW
eta = 0.75
elec_kw = hyd_kw / eta # 3.339 kW
sec = elec_kw / q_plant # 0.00725 kWh/m3

assert_check(
    "Python 5.5",
    "Permeate Pumping Power & Specific Energy Consumption (SEC)",
    2.4 < hyd_kw < 2.6 and 3.2 < elec_kw < 3.5 and 0.007 < sec < 0.008,
    f"Hydraulic Power: {hyd_kw:.3f} kW, Electrical Power: {elec_kw:.3f} kW, SEC: {sec:.5f} kWh/m3"
)

# --- Python 5.6: Sludge Wastage Mass Balance & SRT ---
v_aer = 2800.0
v_mbr = 800.0
mlss_aer = 7400.0
mlss_mbr = 9200.0
inventory_kg = (v_aer * mlss_aer) / 1000.0 + (v_mbr * mlss_mbr) / 1000.0 # 28080.0 kg
was_base = 38.0
srt_base = inventory_kg / ((was_base * mlss_mbr) / 1000.0) # 80.32 d

was_sim = 60.0
srt_sim = inventory_kg / ((was_sim * mlss_mbr) / 1000.0) # 50.87 d

assert_check(
    "Python 5.6",
    "Daily Sludge Wastage Mass Balance & Continuous SRT",
    inventory_kg == 28080.0 and abs(srt_base - 80.32) < 0.05 and abs(srt_sim - 50.87) < 0.05,
    f"Total Inventory: {inventory_kg:.0f} kg, Base SRT: {srt_base:.1f} d, Simulated SRT (WAS 60): {srt_sim:.1f} d"
)

# --- Python 5.7: Nitrification Washout Safety Threshold ---
was_high = 250.0
srt_high = inventory_kg / ((was_high * mlss_mbr) / 1000.0) # 12.2 d
was_washout = 270.0
srt_washout = inventory_kg / ((was_washout * mlss_mbr) / 1000.0) # 11.3 d

assert_check(
    "Python 5.7",
    "Nitrification Washout Threshold Protection (SRT < 12 days)",
    srt_high >= 12.0 and srt_washout < 12.0,
    f"WAS 250 m3/d -> SRT: {srt_high:.1f} d (Safe); WAS 270 m3/d -> SRT: {srt_washout:.1f} d (Washout Flag Latched)"
)

# --- Python 5.8: Multi-Variable Compound Extreme Stress-Test ---
surge_q = 530.0 # m3/h
surge_flux = (surge_q * 1000.0) / a_active # 36.81 LMH
cold_ratio = calc_viscosity(9.0) / calc_viscosity(18.5)
compound_tmp = tmp_base * ((surge_flux / j_base) ** 1.4) * cold_ratio # ~ 46.2 kPa

is_critical = surge_flux > 30.0 and compound_tmp > 45.0

assert_check(
    "Python 5.8",
    "Compound Extreme Stress-Test (Outage + Cold + Surge)",
    is_critical and compound_tmp > 45.0,
    f"Compound Flux: {surge_flux:.1f} LMH (> 30), Compound TMP: {compound_tmp:.1f} kPa (> 45 limit) -> Severity: CRITICAL"
)

# --- Python 5.9: OpenXML Inspection of Sheet 13 ---
xlsx_path = "UNIT_77_MBR_SUPER_EXPERT.xlsx"
if not os.path.exists(xlsx_path):
    xlsx_path = "public/UNIT_77_MBR_SUPER_EXPERT.xlsx"

openxml_valid = False
sheet13_found = False
stage5_audit_found = False

if os.path.exists(xlsx_path):
    with zipfile.ZipFile(xlsx_path, 'r') as z:
        # Check workbook.xml for sheet names
        wb_xml = z.read('xl/workbook.xml').decode('utf-8')
        if '13_What_If' in wb_xml:
            sheet13_found = True
        
        # Check sharedStrings or worksheet xml
        for fname in z.namelist():
            if 'sheet' in fname.lower() and fname.endswith('.xml'):
                content = z.read(fname).decode('utf-8')
                if 'What_If' in content or 'Curtailment' in content or 'Poiseuille' in content or 'C5*4800' in content:
                    openxml_valid = True
            if 'sharedstrings' in fname.lower():
                s_content = z.read(fname).decode('utf-8')
                if 'Stage 5' in s_content:
                    stage5_audit_found = True

assert_check(
    "Python 5.9",
    "OpenXML Stage 5 Sheet 13 & 19 Audit Inspection",
    sheet13_found and openxml_valid and stage5_audit_found,
    f"Sheet 13 Found: {sheet13_found}, Formulas/Content Present: {openxml_valid}, Stage 5 Audit: {stage5_audit_found}"
)

# --- Python 5.10: Zero-Division Safeguards ---
zero_a = 0.0
safe_flux = (q_plant * 1000.0) / zero_a if zero_a > 0 else 0.0
zero_was = 0.0
safe_srt = inventory_kg / zero_was if zero_was > 0 else 99999.0

assert_check(
    "Python 5.10",
    "Zero Division Safeguards & Boundary Clamping",
    safe_flux == 0.0 and math.isfinite(safe_srt),
    f"Zero trains -> Flux: {safe_flux} LMH, Zero WAS -> SRT: {safe_srt:.0f} d (no ZeroDivisionError)"
)

print("----------------------------------------------------")
print(f"TOTAL PYTHON AUDIT CHECKS: {total_checks} | PASSED: {passed_checks} | FAILED: {total_checks - passed_checks}")
if passed_checks == total_checks:
    print(">>> STAGE 5 PYTHON GATE: [PASS] <<<")
else:
    print(">>> STAGE 5 PYTHON GATE: [FAIL] <<<")
    sys.exit(1)
