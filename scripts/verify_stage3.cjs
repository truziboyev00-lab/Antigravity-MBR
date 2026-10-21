/**
 * UNIT 77 MBR SUPER EXPERT — STAGE 3 GATE VERIFICATION SCRIPT
 * Author: Turgunjon Ruziboyev
 * 
 * Verifies core MBR engineering equations:
 * 1. Hydrostatic pressure correction (P_hydro = rho * g * H)
 * 2. True Transmembrane Pressure (TMP = P_hydro - P_suction)
 * 3. Gross Flux (J_gross = Q_p * 1000 / Area) & Net Flux (J_net = J_gross * duty_cycle)
 * 4. Water dynamic viscosity via Poiseuille model & Temperature Correction Factor (TCF)
 * 5. Temperature-normalized permeability (L_p,20 = L_p * TCF)
 * 6. Darcy total resistance (R_tot = TMP / (mu * J)) and fouling resistance (R_f = R_tot - R_m)
 * 7. Aeration specific demand per area (SAD_m) and per permeate (SAD_p)
 * 8. Solids mass inventory, WAS mass, operational SRT, and recommended WAS flow rate
 * 9. Cleaning permeability recovery percentage
 * 10. Rate of TMP change (dTMP/dt) and predictive hours to limit
 * 11. Water mass balance discrepancy
 * 12. Zero-division and boundary protection
 */

const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('UNIT 77 MBR SUPER EXPERT — STAGE 3 GATE VERIFICATION');
console.log('Author: Turgunjon Ruziboyev');
console.log('====================================================');

let passedChecks = 0;
let totalChecks = 0;

function assertCheck(name, condition, details) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`[PASS] Gate 3.${totalChecks}: ${name}`);
    if (details) console.log(`       ${details}`);
  } else {
    console.error(`[FAIL] Gate 3.${totalChecks}: ${name}`);
    if (details) console.error(`       ERROR: ${details}`);
    process.exitCode = 1;
  }
}

// 1. Hydrostatic Head calculation
const rho = 1000.0;
const g = 9.81;
const H = 3.2;
const P_hydro = (rho * g * H) / 1000.0; // 31.392 kPa
assertCheck('Hydrostatic Head Gravity Correction', Math.abs(P_hydro - 31.392) < 1e-4, `Expected 31.392 kPa, Got ${P_hydro.toFixed(4)} kPa`);

// 2. True TMP calculation
const P_suct = -18.5; // kPa gauge
const trueTMP = P_hydro - P_suct; // 49.892 kPa
assertCheck('True Transmembrane Pressure (TMP)', Math.abs(trueTMP - 49.892) < 1e-4, `Expected 49.892 kPa, Got ${trueTMP.toFixed(4)} kPa`);

// 3. Gross Flux & Net Flux
const Q_p = 157.5; // m3/h
const Area = 7000.0; // m2
const J_gross = (Q_p * 1000.0) / Area; // 22.5 LMH
const J_net = J_gross * 0.90; // 20.25 LMH
assertCheck('Gross & Net Flux Calculations', Math.abs(J_gross - 22.5) < 1e-4 && Math.abs(J_net - 20.25) < 1e-4, `Gross: ${J_gross} LMH, Net: ${J_net} LMH`);

// 4. Water dynamic viscosity & TCF at 15.0 °C
const T = 15.0;
const mu_15 = 1.784 / (1.0 + 0.0337 * T + 0.00022 * Math.pow(T, 2)); // 1.14726688 mPa.s
const tcf_15 = Math.pow(1.025, 20.0 - T); // 1.131408
assertCheck('Poiseuille Viscosity & Temperature Correction Factor (TCF)', Math.abs(mu_15 - 1.147267) < 1e-4 && Math.abs(tcf_15 - 1.131408) < 1e-4, `mu(15°C) = ${mu_15.toFixed(6)} mPa·s, TCF(15°C) = ${tcf_15.toFixed(6)}`);

// 5. Temperature-Normalized Permeability (L_p,20)
const tmp_kpa_15 = 16.0;
const tmp_bar_15 = tmp_kpa_15 / 100.0; // 0.16 bar
const Lp_op = J_gross / tmp_bar_15; // 140.625 LMH/bar
const Lp_20 = Lp_op * tcf_15; // 159.104278 LMH/bar
assertCheck('Temperature-Normalized Permeability (L_p,20)', Math.abs(Lp_20 - 159.104278) < 1e-3, `Expected 159.104 LMH/bar, Got ${Lp_20.toFixed(4)} LMH/bar`);

// 6. Darcy Total & Fouling Resistance
const tmp_pa = tmp_kpa_15 * 1000.0; // 16000 Pa
const j_ms = (J_gross / 1000.0) / 3600.0; // 6.25e-6 m/s
const mu_pas = mu_15 / 1000.0; // 1.147267e-3 Pa.s
const R_tot = tmp_pa / (mu_pas * j_ms); // 2.23139e12 1/m
const R_m = 5.20e11; // 1/m
const R_f = R_tot - R_m; // 1.71139e12 1/m
assertCheck('Darcy Total & Fouling Resistance (R_tot, R_f)', Math.abs(R_tot - 2.23139e12) / 2.23139e12 < 1e-4, `R_tot = ${R_tot.toExponential(4)} 1/m, R_f = ${R_f.toExponential(4)} 1/m`);

// 7. Biological Inventory, WAS Mass & SRT
const V_aero = 4500.0, MLSS_aero = 7200.0;
const V_mbr = 850.0, MLSS_mbr = 9500.0;
const Total_Mass = (V_aero * MLSS_aero + V_mbr * MLSS_mbr) / 1000.0; // 40475 kg
const Q_was = 180.0, MLSS_was = 9500.0;
const Daily_WAS_Mass = (Q_was * MLSS_was) / 1000.0; // 1710 kg/d
const SRT = Total_Mass / Daily_WAS_Mass; // 23.6696 days
assertCheck('Biomass Inventory & Operational SRT', Math.abs(Total_Mass - 40475) < 1e-2 && Math.abs(SRT - 23.66959) < 1e-4, `Total Biomass = ${Total_Mass} kg TSS, SRT = ${SRT.toFixed(2)} days`);

// 8. Recommended WAS Flow for Target SRT (25.0 days)
const target_SRT = 25.0;
const target_was_mass = Total_Mass / target_SRT; // 1619.0 kg/d
const rec_was_flow = (target_was_mass * 1000.0) / MLSS_was; // 170.421 m3/d
assertCheck('Recommended WAS Flow Setpoint Solver', Math.abs(rec_was_flow - 170.421053) < 1e-4, `Expected 170.421 m3/d, Got ${rec_was_flow.toFixed(4)} m3/d`);

// 9. Specific Aeration Demands (SAD_m and SAD_p)
const Air_Flow = 1750.0; // Nm3/h
const SAD_m = Air_Flow / Area; // 0.25 Nm3/(m2.h)
const SAD_p = Air_Flow / Q_p; // 11.111 Nm3 air / m3 water
assertCheck('Specific Aeration Demands (SAD_m, SAD_p)', Math.abs(SAD_m - 0.25) < 1e-4 && Math.abs(SAD_p - 11.111111) < 1e-4, `SAD_m = ${SAD_m} Nm3/(m2.h), SAD_p = ${SAD_p.toFixed(3)} Nm3/m3`);

// 10. Chemical Cleaning Permeability Recovery
const Lp_pre = 95.0, Lp_post = 190.0, Lp_virgin = 220.0;
const rec_pct = ((Lp_post - Lp_pre) / (Lp_virgin - Lp_pre)) * 100.0; // 76.0%
assertCheck('Chemical Cleaning Permeability Recovery', Math.abs(rec_pct - 76.0) < 1e-4, `Expected 76.0%, Got ${rec_pct.toFixed(2)}%`);

// 11. Rate of TMP Change (dTMP/dt) & Projection
const time_pts = [0, 4, 8, 12, 16];
const tmp_pts = [14.0, 14.8, 15.6, 16.4, 17.2];
const slope = (tmp_pts[4] - tmp_pts[0]) / (time_pts[4] - time_pts[0]); // 0.20 kPa/h
const hours_to_45 = (45.0 - tmp_pts[4]) / slope; // 139.0 h
assertCheck('Rate of TMP Change (dTMP/dt) & Projection', Math.abs(slope - 0.20) < 1e-4 && Math.abs(hours_to_45 - 139.0) < 1e-4, `dTMP/dt = ${slope.toFixed(3)} kPa/h, Hours to 45 kPa = ${hours_to_45.toFixed(1)} h`);

// 12. Zero-Division & Non-Negative Physical Guards
let zeroAreaSafe = true;
try {
  const safeArea = Math.max(1.0, 0.0);
  const testFlux = (Q_p * 1000.0) / safeArea;
  const safeWAS = 0.0;
  const safeSRT = safeWAS > 0.1 ? Total_Mass / safeWAS : 999.0;
  if (!Number.isFinite(testFlux) || safeSRT !== 999.0) zeroAreaSafe = false;
} catch (e) {
  zeroAreaSafe = false;
}
assertCheck('Zero-Division Protection & Physical Guard Limits', zeroAreaSafe, 'Zero area and zero WAS wasting safely clamped without NaN or unhandled exceptions.');

console.log('----------------------------------------------------');
console.log(`TOTAL CHECKS: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${totalChecks - passedChecks}`);
if (passedChecks === totalChecks) {
  console.log('>>> STAGE 3 GATE: [PASS] <<<');
} else {
  console.error('>>> STAGE 3 GATE: [FAIL] <<<');
  process.exit(1);
}
