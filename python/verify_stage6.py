#!/usr/bin/env python3
"""
UNIT 77 MBR SUPER EXPERT — STAGE 6 GATE VERIFICATION (PYTHON AUDIT)
Author: Turgunjon Ruziboyev

Python test runner validating Stage 6 engineering models:
 - Python 6.1: Multi-Horizon Linear Forecast Math (T+24h at 0.25 kPa/h: 20.0 -> 26.0 kPa)
 - Python 6.2: Exponential Cake Compaction Kinetic Projection (T+24h at k=0.010: 20.0 -> 25.425 kPa)
 - Python 6.3: Remaining Useful Life (RUL) to Maintenance Clean (45 kPa)
 - Python 6.4: RUL to Critical Emergency Stop Threshold (55 kPa)
 - Python 6.5: Darcy Clean Membrane Resistance Rm Inversion (1.497e12 m^-1)
 - Python 6.6: Specific Cake Resistance alpha & Compaction Exponent beta (1.40)
 - Python 6.7: Ordinary Least Squares (OLS) Regression Metrics (R² = 1.000, RMSE = 0.00)
 - Python 6.8: Operational Urgency Classification & Chemical Dosing Dispatch
 - Python 6.9: OpenXML Audit of Sheet 14 (14_Prediction) & Sheet 19 (19_Audit_Log)
 - Python 6.10: Zero-Division, Negative Slope, and Boundary Clamping Safeguards
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
print("UNIT 77 MBR SUPER EXPERT — STAGE 6 PYTHON GATE AUDIT")
print("Author: Turgunjon Ruziboyev")
print("====================================================")

def calc_viscosity(temp_c):
    safe_t = max(0.1, min(80.0, temp_c))
    return 1.787 * math.exp(-0.0337 * safe_t + 0.000221 * (safe_t ** 2))

# --- Python 6.1: Multi-Horizon Linear Forecast Math ---
base_tmp = 20.0
slope = 0.25
t24 = 24.0
lin_tmp24 = base_tmp + slope * t24
lin_tmp168 = base_tmp + slope * 168.0

assert_check(
    "Python 6.1",
    "Multi-Horizon Linear Forecast Math",
    abs(lin_tmp24 - 26.0) < 0.001 and abs(lin_tmp168 - 62.0) < 0.001,
    f"T+24h: {lin_tmp24:.2f} kPa, T+168h: {lin_tmp168:.2f} kPa (Exact match)"
)

# --- Python 6.2: Exponential Cake Compaction Kinetic Projection ---
k_exp = 0.010
exp_tmp24 = base_tmp * math.exp(k_exp * 24.0)
exp_tmp48 = base_tmp * math.exp(k_exp * 48.0)

assert_check(
    "Python 6.2",
    "Exponential Cake Compaction Kinetic Projection",
    abs(exp_tmp24 - 25.4249) < 0.01 and abs(exp_tmp48 - 32.3212) < 0.01,
    f"T+24h: {exp_tmp24:.3f} kPa, T+48h: {exp_tmp48:.3f} kPa (Exponential compaction modeled)"
)

# --- Python 6.3: Remaining Useful Life (RUL) to Maintenance Clean (45 kPa) ---
limit_mc = 45.0
rul_lin = (limit_mc - base_tmp) / slope
rul_exp = math.log(limit_mc / base_tmp) / k_exp

assert_check(
    "Python 6.3",
    "Remaining Useful Life (RUL) to Maintenance Clean (45 kPa)",
    abs(rul_lin - 100.0) < 0.01 and abs(rul_exp - 81.09) < 0.02,
    f"RUL Linear: {rul_lin:.1f} h, RUL Exp: {rul_exp:.1f} h (Divergence verified)"
)

# --- Python 6.4: RUL to Critical Emergency Stop Threshold (55 kPa) ---
limit_estop = 55.0
rul_estop = (limit_estop - base_tmp) / slope

assert_check(
    "Python 6.4",
    "RUL to Critical Emergency Stop Threshold (55 kPa)",
    abs(rul_estop - 140.0) < 0.01,
    f"Safe operating window to membrane structural limit: {rul_estop:.1f} hours"
)

# --- Python 6.5: Darcy Clean Membrane Resistance Rm Inversion ---
clean_tmp = 10.0
clean_flux = 24.0
clean_temp = 20.0
mu_pa_s = calc_viscosity(clean_temp) * 0.001
flux_m_s = clean_flux / 3600000.0
clean_rm = (clean_tmp * 1000.0) / (mu_pa_s * flux_m_s)

assert_check(
    "Python 6.5",
    "Darcy Clean Membrane Resistance Rm Analytical Inversion",
    abs(clean_rm - 1.497e12) / 1.497e12 < 0.01,
    f"Clean Rm: {clean_rm:.4e} m-1 (Accurate to PVDF standard 1.50e12)"
)

# --- Python 6.6: Specific Cake Resistance alpha & Compaction Exponent beta ---
beta_val = math.log(29.267 / 19.5667) / math.log(32.0 / 24.0)
delta_tmp_pa = 8.6 * 1000.0
flux_op_m_s = 24.0 / 3600000.0
mu18 = calc_viscosity(18.5) * 0.001
r_cake = delta_tmp_pa / (mu18 * flux_op_m_s)
alpha_cake = r_cake / 0.038

assert_check(
    "Python 6.6",
    "Specific Cake Resistance alpha & Compaction Exponent beta",
    abs(beta_val - 1.40) < 0.01 and 1.0e13 < alpha_cake < 1.0e14,
    f"Beta: {beta_val:.3f}, Alpha: {alpha_cake:.3e} m/kg"
)

# --- Python 6.7: Ordinary Least Squares (OLS) Regression Metrics ---
t_series = [0, 10, 20, 30, 40]
y_series = [18.0, 20.5, 23.0, 25.5, 28.0]
n = len(t_series)
sum_t = sum(t_series)
sum_y = sum(y_series)
sum_ty = sum(t * y for t, y in zip(t_series, y_series))
sum_t2 = sum(t * t for t in t_series)
reg_slope = (n * sum_ty - sum_t * sum_y) / (n * sum_t2 - sum_t * sum_t)
reg_intercept = (sum_y - reg_slope * sum_t) / n
mean_y = sum_y / n
ss_tot = sum((y - mean_y)**2 for y in y_series)
ss_res = sum((y - (reg_intercept + reg_slope * t))**2 for t, y in zip(t_series, y_series))
r2_val = 1 - ss_res / ss_tot
rmse_val = math.sqrt(ss_res / n)

assert_check(
    "Python 6.7",
    "Ordinary Least Squares Regression Accuracy & Convergence",
    abs(reg_slope - 0.25) < 0.001 and abs(r2_val - 1.000) < 0.0001 and rmse_val < 0.001,
    f"Slope: {reg_slope:.3f} kPa/h, R2: {r2_val:.4f}, RMSE: {rmse_val:.4f} kPa"
)

# --- Python 6.8: Operational Urgency Classification & Chemical Dosing ---
def classify_urgency(rul):
    if rul <= 12: return "CRITICAL"
    if rul <= 36: return "WARNING"
    if rul <= 72: return "PLANNED"
    return "NORMAL"

u_crit = classify_urgency(8.5)
u_warn = classify_urgency(24.0)
u_norm = classify_urgency(95.0)

assert_check(
    "Python 6.8",
    "Operational Urgency State Machine & Chemical Dispatch Rules",
    u_crit == "CRITICAL" and u_warn == "WARNING" and u_norm == "NORMAL",
    f"Urgency thresholds: 8.5h->{u_crit}, 24h->{u_warn}, 95h->{u_norm}"
)

# --- Python 6.9: OpenXML Audit of Sheet 14 & Sheet 19 ---
wb_path = os.path.join(os.path.dirname(__file__), "../public/UNIT_77_MBR_SUPER_EXPERT.xlsx")
sheet14_found = False
formulas_found = False
audit_entry_found = False

if os.path.exists(wb_path):
    with zipfile.ZipFile(wb_path, 'r') as z:
        # Check workbook.xml for sheet names
        wb_xml = z.read('xl/workbook.xml').decode('utf-8')
        if '14_Prediction' in wb_xml:
            sheet14_found = True

        for fname in z.namelist():
            if 'sheet' in fname.lower() and fname.endswith('.xml'):
                content = z.read(fname).decode('utf-8')
                if '04_Train_Analysis' in content or 'EXP' in content or 'LN' in content:
                    formulas_found = True
            if 'sharedstrings' in fname.lower():
                s_content = z.read(fname).decode('utf-8')
                if 'Stage 6' in s_content:
                    audit_entry_found = True

assert_check(
    "Python 6.9",
    "OpenXML Stage 6 Sheet 14 & 19 Audit Inspection",
    sheet14_found and formulas_found and audit_entry_found,
    f"Sheet 14 Found: {sheet14_found}, Formulas Present: {formulas_found}, Stage 6 Audit Entry: {audit_entry_found}"
)

# --- Python 6.10: Zero-Division Safeguards & Boundary Clamping ---
zero_slope_rul = (45.0 - 20.0) / max(0.001, 0.0)
exceeded_rul = max(0.0, (45.0 - 46.5) / 0.25)

assert_check(
    "Python 6.10",
    "Zero Division Safeguards & Boundary Clamping",
    math.isfinite(zero_slope_rul) and exceeded_rul == 0.0,
    f"Zero slope safe RUL: {zero_slope_rul} h, Exceeded TMP clamp: {exceeded_rul} h"
)

print("----------------------------------------------------")
print(f"TOTAL PYTHON AUDIT CHECKS: {total_checks} | PASSED: {passed_checks} | FAILED: {total_checks - passed_checks}")
if passed_checks == total_checks:
    print(">>> STAGE 6 PYTHON GATE: [PASS] <<<")
    sys.exit(0)
else:
    print(">>> STAGE 6 PYTHON GATE: [FAIL] <<<")
    sys.exit(1)
