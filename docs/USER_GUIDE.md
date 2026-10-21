# UNIT 77 MBR SUPER EXPERT — OPERATOR & USER GUIDE

## 1. Operating Philosophy
The UNIT 77 MBR Super Expert platform is built for plant operators, process engineers, and wastewater managers managing the 4-train, 19,200 m² PVDF ultrafiltration plant.

The core operating invariants are strictly enforced:
- **MISSING ≠ ZERO**: A missing flow or pressure signal never collapses to zero; it is displayed as `UNCERTAIN/MISSING` to prevent false low-flow trips.
- **MEASURED ≠ CALCULATED ≠ ESTIMATED ≠ PREDICTED**: Every telemetry value maintains strict epistemic tagging.
- **ACTUAL ≠ SIMULATED**: Interactive What-If sandbox scenarios never overwrite live SCADA state.
- **CORRELATION ≠ CAUSATION**: Alarms require persistent multi-variable physical evidence before root-cause attribution.

---

## 2. Navigating the 19 Worksheets (Excel Core)

| Worksheet Tab | Operational Focus | Primary User Action |
|---|---|---|
| `01_Dashboard` | Plant Master KPI Console | View plant flow, average TMP, normalized permeability, and active alarm banners. |
| `02_Manual_Input` | Daily Laboratory & Manual Log | Enter offline grab-sample MLSS, MLVSS, effluent turbidity, and chemical inventory. |
| `03_Data_Staging` | SCADA Ingestion Buffer | High-resolution timestamped sensor feeds from PLC/SCADA tags. |
| `04_Train_Analysis` | Train A–D Permeability Status | Compare train hydraulic resistances, gross flux, and fouling rates. |
| `05_Engineering_Calcs` | First-Principles Core Engine | Darcy equation, dynamic water viscosity, net production flux, recovery ratio. |
| `06_TMP_Permeability` | Temperature-Normalized Trends | Track 20°C temperature-corrected permeability ($L_{p,20}$) vs clean membrane baseline. |
| `07_Biology` | Biological Kinetic Status | Aeration basin F/M ratio, volumetric loading rate, nitrification washout risk. |
| `08_WAS_SRT` | Waste Sludge & Solids Age | Daily WAS flow recommendation to maintain target 25.0-day solids retention time. |
| `09_Cleaning` | Chemical Cleaning (CEB / CIP) | Chemical recipe calculator (NaOCl / Citric acid), recovery tracking, soaking timer. |
| `10_Equipment` | Blower & Pump Asset Health | VFD speed, blower discharge temperature, permeate pump vibration, running hours. |
| `11_Events_Alarms` | Priority Alarm Log & Hysteresis | Active high-TMP, rate-of-change, membrane breach, and fouling acceleration alerts. |
| `12_Peer_Comparison` | Cross-Train Comparative Analytics | Normalized permeability variance, fouling coefficient deviation across 4 trains. |
| `13_What_If` | Scenario Simulation Sandbox | N-1 train outage, hydraulic peak surge, and cold-weather viscosity stress simulator. |
| `14_Prediction` | Predictive Fouling & RUL | Time-to-CIP forecast, exponential TMP projection, remaining useful life (hours). |
| `15_Python_Output` | Advanced Analytics Staging | Destination range for Python daemon Theil-Sen regression and Kalman estimates. |
| `16_Data_Quality` | Sensor Health & Quality Flags | Flatline detection, spike rejection, drift detection, and confidence scoring. |
| `17_Settings` | Engineering Plant Constants | Membrane surface area, tank volumes, alarm limits, target SRT, chemical concentrations. |
| `18_Engineering_Reference` | Scientific Basis & Standards | Standard equations, Metcalf & Eddy references, membrane manufacturer limits. |
| `19_Audit_Log` | Change History & Validation | Chronological log of parameter edits, calibration updates, and validation runs. |

---

## 3. Interpreting Alarms & Decision Support
- **Green (NORMAL)**: Membrane operating within sustainable flux and permeability limits.
- **Amber (WARNING)**: Parameter within deadband or trending toward warning threshold (e.g., TMP rate of change > 0.35 kPa/h).
- **Red (CRITICAL / TRIP)**: Immediate operator intervention required (e.g., TMP ≥ 35.0 kPa sustained for >3 consecutive cycles).

### Chemical Cleaning Recommendation
When Train normalized permeability drops below 100 LMH/bar:
1. Review `09_Cleaning` for recommended protocol: Maintenance Clean (NaOCl 300–500 mg/L) vs Recovery Clean / CIP (NaOCl 1,000–2,000 mg/L + Citric Acid 2,000 mg/L).
2. Ensure train is fully isolated from permeate header before initiating chemical fill.
