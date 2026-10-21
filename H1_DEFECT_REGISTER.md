# MBR SUPER EXPERT v1.1 — STAGE H1: BASELINE FREEZE & COMPLETE DEFECT REGISTER

**Author / Creator**: Turgunjon Ruziboyev  
**Platform**: Universal Multi-Plant Industrial Membrane Bioreactor Engineering Engine  
**Date**: 2026-09-20  
**Baseline Version**: v1.0.0 (Preserved & Frozen)  
**Target Version**: v1.1.0 (Engineering Hardened Universal Multi-Plant Release)  
**Status**: **H1 STATUS: PASS**

---

## 1. Executive Summary & Baseline Preservation Statement

In strict accordance with Section 64 of the *MBR SUPER EXPERT v1.1 Architecture Protocol*, Stage H1 has been executed as an independent audit, defect reproduction, and baseline freeze operation.

1. **v1.0 Immutable Baseline Preserved**:
   - Archive: `UNIT_77_MBR_SUPER_EXPERT_V1.0_FINAL_FULL_PROJECT.zip`
   - File Size: `475,098 bytes` (~464 KB)
   - SHA-256 Checksum: `8afaa7c808e9c059b6846e03e0486ce5847ad3f41422c48dad79dcc6cb452d3b`
   - All 107 repository files have their individual cryptographic SHA-256 signatures frozen and recorded in `BASELINE_V1.0_HASHES.json`.
2. **Audit & Defect Scope**:
   - 14 distinct defects identified and categorized into P0 (6), P1 (5), and P2 (3).
   - 408 occurrences of legacy train names (`Train A`, `Train B`, `Train C`, `Train D`, `train_a`, etc.) located across 34 files.
   - 110 occurrences of hard-coded membrane area (`4,800.0 m²` / `19,200.0 m²`) located across 25 files.
   - 34 hard-coded 4-train topology assumptions identified.
   - Real Excel OpenXML audit completed: 19 sheets, 309 formulas, 0 unresolved `#REF!` or `#DIV/0!` errors.

---

## 2. Reproduction of Known Audit Findings

| Audit Item | Description | Finding Status | Evidence / Location |
|---|---|---|---|
| **AF-01** | Viscosity model disagreement | **CONFIRMED** | `python/mbr_engine/hydraulics.py` uses Poiseuille exponential $\mu(T)=1.787 \cdot \exp(-0.0337 T + 0.000221 T^2)$, whereas `src/engineering/calculations.ts` uses rational polynomial $\mu(T)=1.784/(1+0.0337T+0.00022T^2)$. |
| **AF-02** | TCF formula mismatch | **CONFIRMED** | TypeScript uses Arrhenius form $\theta^{(20-T)}$ with $\theta=1.025$, while Python uses dynamic viscosity ratio $\mu_{20}/\mu_T$. |
| **AF-03** | Fake / self-comparison Excel parity | **CONFIRMED** | `python/mbr_engine/workbook_bridge.py` lines 240–300 compares against hard-coded literals (`xl_out_flux = 32.00`, `xl_comp_tmp = 29.267`, `xl_lin24 = 26.00`). |
| **AF-04** | Stubbed telemetry ingestion | **CONFIRMED** | `workbook_bridge.py` lines 110–135 generates outputs from static `DEFAULT_TELEMETRY` dictionary instead of parsing live worksheet cells. |
| **AF-05** | Clean Membrane Resistance $R_m$ drift | **CONFIRMED** | `config.py` specifies $R_m = 1.497 \times 10^{12} \text{ m}^{-1}$, while `workbook_bridge.py` line 214 tests against $1.5076 \times 10^{12} \text{ m}^{-1}$ (0.71% drift). |
| **AF-06** | Version metadata fragmentation | **CONFIRMED** | `cli.py` has `v0.8.0`, `workbook_bridge.py` has `0.8.0`, `config.py` has `0.7.0`, `package.json` has `0.0.0`, UI has `Stage 10/12D`. |
| **AF-07** | Fixed 4-Train & Area Assumptions | **CONFIRMED** | `train_structure.json` hard-codes 4 trains (`TRAIN_A..D`), `config.py` fixes 4 trains and $4,800 \text{ m}^2$, `whatif.py` assumes `active_trains=3` out of 4. |

---

## 3. Comprehensive Defect Register (P0 / P1 / P2)

### Priority P0: Architecture & Safety Critical (Release Blockers)

1. **DEF-01: Legacy Train A–D & Fixed 4-Train Topology**
   - **Severity**: P0 (Architecture Blocker)
   - **Location**: `src/foundation/train_structure.json`, `python/mbr_engine/config.py`, `python/mbr_engine/super_expert.py`, `src/App.tsx`
   - **Impact**: Makes the engine unusable at plants with 1, 2, 3, 5, 6, or 7 trains.
   - **Target Architecture**: Enforce strict canonical identifiers `T01, T02, T03, T04, T05, T06, T07`. Instantiable train loop based purely on configured train count (1–7).

2. **DEF-02: Hard-Coded Membrane Area Assumptions ($4,800 / 19,200 \text{ m}^2$)**
   - **Severity**: P0 (Safety Critical)
   - **Location**: `python/mbr_engine/config.py`, `python/mbr_engine/whatif.py`, `src/engineering/calculations.ts`
   - **Impact**: Flux calculation error on any plant with different membrane models or cassette dimensions.
   - **Target Architecture**: Dynamic summation $A_{\text{active}} = \sum A_{\text{train}}(T_{xx})$ for all online trains.

3. **DEF-03: Fake Excel Parity Comparisons in Bridge**
   - **Severity**: P0 (Validation Integrity)
   - **Location**: `python/mbr_engine/workbook_bridge.py`, `python/mbr_engine/hybrid_bridge.py`
   - **Impact**: Conceals mathematical drift between Excel formulas and Python engine.
   - **Target Architecture**: True 3-way execution: recalculate Excel model, read cell values, execute Python and TypeScript independently, compare with justified tolerance.

4. **DEF-04: Stubbed Excel Telemetry Reading**
   - **Severity**: P0 (Operational Blocker)
   - **Location**: `python/mbr_engine/workbook_bridge.py` (`read_excel_telemetry()`)
   - **Impact**: Prevents offline SCADA/PHD Excel workbooks from feeding real data into Python analytics.
   - **Target Architecture**: Genuine OpenXML cell extraction from `02_RealTime_Data` and `04_Hydraulic_KPI`.

5. **DEF-05: Missing Authoritative Plant Configuration Layer**
   - **Severity**: P0 (Architecture Principle)
   - **Location**: `src/foundation/*`, `python/mbr_engine/config.py`
   - **Impact**: Plant-specific parameters are mixed into core engine code.
   - **Target Architecture**: Unified Single Source of Truth (`20_Plant_Configuration`) shared across Python, TypeScript, and Excel.

6. **DEF-06: Missing Train Operating Status Filtering**
   - **Severity**: P0 (Process Engineering)
   - **Location**: `python/mbr_engine/hydraulics.py`, `src/engineering/calculations.ts`, `src/App.tsx`
   - **Impact**: Offline/maintenance trains contaminate active plant flux, TMP, and peer statistics.
   - **Target Architecture**: Multi-state train status model: `ONLINE`, `STANDBY`, `MAINTENANCE`, `OUT_OF_SERVICE`, `NOT_INSTALLED`. Active calculations only include trains where `Installed=True AND Operating_Status=ONLINE AND Data_Quality=VALID`.

---

### Priority P1: Engineering Standardization & Parity

7. **DEF-07: Viscosity Model Discrepancy (Exponential vs Polynomial)**
   - **Severity**: P1 (Mathematical Parity)
   - **Location**: `python/mbr_engine/hydraulics.py` vs `src/engineering/calculations.ts`
   - **Target Architecture**: Standardize on Poiseuille/IAPWS model across Excel, Python, and TypeScript.

8. **DEF-08: Temperature Correction Factor (TCF) Definition Inconsistency**
   - **Severity**: P1 (Physics Parity)
   - **Location**: `src/engineering/calculations.ts` vs `python/mbr_engine/hydraulics.py`
   - **Target Architecture**: Standardize TCF to viscosity ratio $\mu_{20}/\mu_T$.

9. **DEF-09: Clean Membrane Resistance $R_m$ Discrepancy**
   - **Severity**: P1 (Engineering Data Quality)
   - **Location**: `config.py` ($1.497 \times 10^{12}$) vs `workbook_bridge.py` ($1.5076 \times 10^{12}$)
   - **Target Architecture**: Derive $R_m$ from verified Plant Configuration with status `OEM_VERIFIED` or `NOT_CALIBRATED`.

10. **DEF-10: Software Version Fragmentation**
    - **Severity**: P1 (Configuration Management)
    - **Location**: `cli.py` (`0.8.0`), `workbook_bridge.py` (`0.8.0`), `config.py` (`0.7.0`), `package.json` (`0.0.0`), `App.tsx` (`Stage 10/12D`)
    - **Target Architecture**: Single authoritative release version: `1.1.0`.

11. **DEF-11: Plant Tag Hard-Coding (Unit 77 DCS Naming)**
    - **Severity**: P1 (Portability)
    - **Location**: `python/mbr_engine/analytics.py`, `src/foundation/train_structure.json`
    - **Target Architecture**: Dedicated Tag Mapping layer translating raw DCS/PHD tags (e.g. `177-PT-001`) to canonical engine variables (`T01.TMP`).

---

### Priority P2: Quality, Hygiene & User Experience

12. **DEF-12: Hard-Coded 'Unit 77' Strings in UI**
    - **Severity**: P2 (Presentation)
    - **Location**: `src/App.tsx`, `python/mbr_engine/cli.py`
    - **Target Architecture**: Dynamically display configured plant name and site ID.

13. **DEF-13: Missing Configuration Completeness Score & Real Plant Mode Validator**
    - **Severity**: P2 (Functional Safety)
    - **Location**: `src/foundation/plant_config.json`, `python/mbr_engine/config.py`
    - **Target Architecture**: Compute completeness score ($0-100\%$) and enforce safe fallback if required parameters are missing.

14. **DEF-14: Static Train Column Headers in Excel Sheet Layouts**
    - **Severity**: P2 (Workbook Usability)
    - **Location**: `UNIT_77_MBR_SUPER_EXPERT.xlsx`
    - **Target Architecture**: Update sheet headers to dynamic canonical `T01–T07` layout.

---

## 4. Excel ↔ Python ↔ TypeScript Dependency Map

```
+-------------------------------------------------------------------------+
|                  SINGLE SOURCE OF TRUTH (v1.1)                          |
|         src/foundation/plant_config.json / 20_Plant_Configuration       |
|  - Plant Identity (Name, Site, Unit, Version)                           |
|  - Installed Trains (1-7): [T01, T02, ..., Txx]                         |
|  - Per-Train Membrane Area & Limits                                     |
|  - Tag Mapping (DCS/PHD Tag -> Canonical Txx.TMP, etc.)                 |
|  - Operating Limits (Normal, Low, Low-Low, High, High-High)             |
+-------------------------------------------------------------------------+
                                   |
         +-------------------------+-------------------------+
         |                                                   |
         v                                                   v
+-----------------------------+             +-----------------------------+
|    PYTHON ENGINE (v1.1)     |             |   TYPESCRIPT / REACT (v1.1) |
| - mbr_engine/hydraulics.py  |             | - engineering/calculations  |
| - mbr_engine/biological.py  |             | - App.tsx (Dynamic T01-T07) |
| - mbr_engine/whatif.py      |             | - Real-time Decision Support|
| - mbr_engine/diagnostics.py |             +-----------------------------+
+-----------------------------+                            |
         |                                                 |
         +-------------------------+-----------------------+
                                   |
                                   v
+-------------------------------------------------------------------------+
|                      PRODUCTION EXCEL WORKBOOK                          |
|                     UNIT_77_MBR_SUPER_EXPERT.xlsx                       |
|  Sheet 20: 20_Plant_Configuration (Authoritative Parameter Registry)   |
|  Sheets 02-14: Dynamic Train Calculations (T01-T07)                     |
|  Sheet 15: 15_Python_Output (Real Exchange Payload)                    |
|  Sheet 16: 16_Sync_Parity (Real Error Calculation & Tolerance Pass)     |
+-------------------------------------------------------------------------+
```

---

## 5. Sequential H2 Implementation Plan

Following approval of Stage H1, Stage H2 will implement the universal configuration and T01–T07 architecture:

1. **Phase H2.1: Single Source of Truth Configuration Layer**
   - Create `src/foundation/plant_config.json` containing complete plant identity, dynamic train array (T01–T07), operating status, membrane area per train, and tag mapping.
   - Mirror configuration in Python `python/mbr_engine/config.py` and Excel sheet `20_Plant_Configuration`.
2. **Phase H2.2: Universal T01–T07 Migration & Dynamic 1–7 Train Engine**
   - Refactor `python/mbr_engine/hydraulics.py`, `super_expert.py`, `whatif.py`, and `diagnostics.py` to instantiate trains dynamically from configuration.
   - Eliminate legacy Train A–D identifiers in active production code.
3. **Phase H2.3: Operating Status Logic & Active Area Summation**
   - Implement train status model: `ONLINE`, `STANDBY`, `MAINTENANCE`, `OUT_OF_SERVICE`, `NOT_INSTALLED`.
   - Calculate $A_{\text{active}} = \sum A(T_{xx})$ for online trains only.
4. **Phase H2.4: Multi-Plant Profile Verification (Profiles A, B, C)**
   - Test Profile A: 3 installed trains (T01–T03, all online).
   - Test Profile B: 4 installed trains (T01–T04, 3 online, 1 maintenance).
   - Test Profile C: 7 installed trains (T01–T07, 5 online, 2 standby).
   - Verify that all three profiles execute successfully using the same source code with zero code modifications.

---

## 6. Stage H1 Verification Outcome

```
================================================================================
MBR SUPER EXPERT v1.1 — STAGE H1 AUDIT & DEFECT DISCOVERY VERIFICATION
================================================================================
Overall Status: PASS
Baseline Checked: v1.0.0 -> Target: v1.1.0
--------------------------------------------------------------------------------
[PASS] H1-01: v1.0 Baseline Freeze & Checksum Lock
[PASS] H1-02: Complete Project File Hash Register (107 files hashed)
[CONFIRMED_DEFECT] H1-03: Viscosity & TCF Equation Drift (Python vs TypeScript)
[CONFIRMED_DEFECT] H1-04: Workbook Bridge Fake Telemetry & Stubbed Read
[CONFIRMED_DEFECT] H1-05: Fake / Self-Comparison Parity Assertions
[CONFIRMED_DEFECT] H1-06: Version Metadata Fragmentation
[CONFIRMED_DEFECT] H1-07: Clean Membrane Resistance Rm Value Drift
[CONFIRMED_DEFECT] H1-08: Legacy Train Identifiers (Train A-D) Scan (408 hits)
[CONFIRMED_DEFECT] H1-09: Hardcoded Membrane Area Scan (110 hits)
[CONFIRMED_DEFECT] H1-10: Hardcoded 4-Train Architecture Assumptions (34 hits)
[PASS] H1-11: Excel OpenXML Formulas & Integrity Audit (19 sheets, 309 formulas, 0 errors)
--------------------------------------------------------------------------------
H1 STATUS: PASS (Baseline frozen, all defects cataloged, ready for H2)
================================================================================
```
