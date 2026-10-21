# UNIT 77 MBR SUPER EXPERT — KNOWN LIMITATIONS & CONSTRAINTS

This document articulates the physical, mathematical, and computational boundaries of the UNIT 77 MBR SUPER EXPERT platform.

---

## 1. Operating Envelope Boundaries
1. **Temperature Operating Range (5°C – 38°C)**:
   - Dynamic viscosity polynomials are calibrated between 5.0°C and 38.0°C.
   - For fluid temperatures exceeding 38.0°C, viscosity estimates diverge slightly from steam table standards, and the system engages the `OUTSIDE MODEL EXPERIENCE` safety flag.

2. **MLSS Operational Range (2,000 mg/L – 16,000 mg/L)**:
   - Biological kinetics and non-Newtonian sludge rheology correlations are valid up to 16,000 mg/L.
   - At MLSS > 16,000 mg/L, non-Newtonian apparent viscosity introduces non-linear deviations not captured by the standard Darcy Newtonian formulation.

3. **Submerged Membrane Vacuum Limits**:
   - Permeate pump suction cavitation risk occurs at TMP > 50 kPa.
   - Absolute upper mechanical safety trip threshold is set at 45.0 kPa.

---

## 2. Telemetry & Sensor Dependency
1. **Single Sensor Telemetry Loss**:
   - The platform strictly adheres to **MISSING ≠ ZERO**. When a sensor drops offline, the system does not substitute zero, avoiding false alarms.
   - However, prolonged missing telemetry for >6 hours degrades predictive RUL confidence.

2. **Flow Transmitter Zero-Drift**:
   - Magnetic flow transmitters must be zero-calibrated during clean water backwash cycles to prevent cumulative mass balance drift.

---

## 3. Platform Architecture Constraints
1. **Platform Independence**:
   - The Excel workbook (`UNIT_77_MBR_SUPER_EXPERT.xlsx`) uses standard OpenXML dynamic formulas. It does not rely on Windows-only ActiveX or COM extensions.
   - Python engine is 100% standard library Python 3.10+ (zero compiled C-extensions required for core analysis).

2. **Synchronous Polling Rate**:
   - Recommended SCADA polling interval is 10 seconds to 60 seconds. High-frequency acoustic emission or microsecond pressure pulsing is outside current architecture scope.
