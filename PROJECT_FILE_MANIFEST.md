# UNIT 77 MBR SUPER EXPERT — PROJECT FILE MANIFEST
**Baseline**: v1.0.0 Final Engineering Release  
**Author**: Turgunjon Ruziboyev  
**Certification Date**: 2026-09-20  

---

## 1. Production Excel Workbooks
- `/UNIT_77_MBR_SUPER_EXPERT.xlsx` — Primary certified OpenXML workbook (42,422 B, 19 sheets, 309 formulas)
  - SHA256: `c777a74aa39960eb5a2c2ffab51b72a441aa37554ae52ee3bfa6fefba6bdf3b8`
- `/public/UNIT_77_MBR_SUPER_EXPERT.xlsx` — Web-distributable mirror (Identical SHA256)

---

## 2. Python Analytical Engine (`/python/mbr_engine/`)
- `__init__.py` — Package initialization and export catalog
- `config.py` — Plant physical constants, tank volumes, membrane specs, unit conversions
- `super_expert.py` — First-principles engineering calculations, Darcy equation, mass balance
- `hybrid_bridge.py` — Excel-to-Python bidirectional synchronization, parity check, fallback logic
- `alarms.py` — Deadband hysteresis, N-cycle persistence, rate-of-change, alarm suppression
- `predictions.py` — Theil-Sen robust estimator, linear regression, RUL forecasting
- `biology.py` — Activated sludge kinetics, SRT calculator, F/M ratio, WAS rate recommendation
- `cleaning.py` — Chemical dosing calculator (NaOCl / citric acid), CEB/CIP protocol
- `stress_testing.py` — 28 multi-domain stress testing scenarios (SCEN-01 through SCEN-28)
- `what_if.py` — Offline scenario simulator (N-1 outage, peak flux surge, cold temperature)
- `data_quality.py` — Sensor hygiene, flatline detection, spike rejection, MISSING ≠ ZERO
- `calibration.py` — Parameter calibration, baseline permeability tracking
- `audit.py` — Workbook formula inspector and calculation lineage auditor
- `cli.py` — Command-line interface for daemon execution and automated evaluation
- `types.py` — Dataclasses, telemetry models, and diagnostic output representations

---

## 3. Foundation Schemas & Model Definitions (`/src/foundation/`)
- `plant_config.json` — Plant design parameters, membrane specifications, tank geometries
- `unit_dictionary.json` — Canonical physical units, scaling factors, and dimension definitions
- `data_quality_flags.json` — Telemetry status flags, severity levels, and fallback directives
- `alarm_thresholds.json` — Warning, critical, and trip limits with hysteresis deadbands
- `chemical_cleaning.json` — Chemical concentrations, soaking times, and safety limits
- `biological_model.json` — Kinetic constants, yield coefficients, target SRT values
- `sensor_inventory.json` — SCADA instrumentation tag mapping, ranges, and calibration offsets
- `train_configuration.json` — Multi-train physical layout, valve lineups, and surface areas
- `what_if_scenarios.json` — Standard stress test scenarios and boundary conditions
- `audit_manifest.json` — Audit logging schema, change classification, and verification rules

---

## 4. Benchmark & Synthetic Datasets (`/src/data/`)
- `stress_test_report.json` — Comprehensive output of 28 Stage 11 stress scenarios
- `synthetic_telemetry_dataset.json` — 168-hour 4-train operational time-series benchmark dataset

---

## 5. Automated Verification & Regression Test Suites
### 5.1 Node.js Runners (`/scripts/`)
- `verify_stage1.cjs` through `verify_stage11.cjs` — Stage 1–11 Gate verification scripts
- `verify_stage12c.cjs` — Final Functional Acceptance Tests (FAT) runner
- `build_stage2_workbook.cjs` — OpenXML workbook compiler and builder script

### 5.2 Python Runners (`/python/`)
- `verify_stage1.py` through `verify_stage11.py` — Stage 1–11 Python test suites
- `verify_stage12c.py` — Stage 12C comprehensive FAT runner (Tests A through K)

---

## 6. Web Application & Dashboard (`/src/`)
- `App.tsx` — Main dashboard layout, navigation tabs, and system state manager
- `main.tsx` — React application entry point
- `index.css` — Tailwind CSS styling and theme configuration
- `types.ts` — TypeScript interfaces for MBR telemetry, alarms, and analytics
- `components/` — Modular UI components (Dashboard, TrainAnalysis, Alarms, WhatIf, etc.)

---

## 7. Official Documentation Suite (`/docs/` & Root)
- `README.md` — Project overview, architecture, and quickstart
- `docs/INSTALLATION_GUIDE.md` — Installation, runtime setup, and deployment instructions
- `docs/USER_GUIDE.md` — Operator navigation, worksheet reference, and decision support
- `docs/ENGINEERING_METHODOLOGY.md` — Physical equations, Darcy resistance, biological mass balance
- `docs/FORMULA_REFERENCE.md` — Canonical mathematical formulas across Excel and Python
- `docs/MODEL_DOCUMENTATION.md` — Darcy, Hampel, Theil-Sen, and biological kinetic models
- `docs/KNOWN_LIMITATIONS.md` — Operational envelope boundaries, sensor constraints, and scope limits
- `docs/VALIDATION_REPORT.md` — Master multi-stage validation report (Stages 1–12D)
- `STAGE_12C_ACCEPTANCE_REPORT.md` — Final Functional Acceptance Tests (FAT) evidence report
- `PROJECT_STATE.md` — Current project state, version, and certified status
- `VALIDATION_STATUS.md` — Complete chronological gate validation log
- `CHANGELOG.md` — Release history and feature changes
- `PROJECT_FILE_MANIFEST.md` — This file
- `FINAL_VALIDATION_MATRIX.md` — Full cross-stage validation matrix
- `FINAL_RELEASE_REPORT.md` — Final engineering release certificate
