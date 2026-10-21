# UNIT 77 MBR SUPER EXPERT — MODEL DOCUMENTATION

## 1. Multi-Model Architecture Overview
The platform incorporates a hybrid hierarchy of first-principles physical equations, robust non-parametric statistical filters, and machine learning models for anomaly detection and fouling rate prediction.

```
[ SCADA Ingestion Buffer ]
          │
          ▼
[ Data Quality & Hampel Filter ] ── (Flags: MISSING, FLATLINE, SPIKE)
          │
          ▼
[ Physical Model: Darcy-Viscosity ] ── (Lp,20, Rm, Rc, Rp)
          │
          ▼
[ Theil-Sen Robust Trend Extrapolator ] ── (dTMP/dt, RUL)
          │
          ▼
[ OOD Safety Guard ] ── (Validates against envelope: T, MLSS, Flux)
          │
          ▼
[ SuperExpert Decision Synthesis ] ── (SED-77 Diagnostic Output)
```

---

## 2. Model Specifications

### 2.1 Darcy Resistance-in-Series Model
- **Model Type**: Physics-based white-box deterministic model.
- **Inputs**: Net flow ($Q$), Transmembrane pressure ($\Delta P$), Temperature ($T$).
- **Outputs**: Total resistance ($R_t$), Temperature-normalized permeability ($L_{p,20}$).
- **Assumptions**: Laminar flow across micro-porous membrane media; Newtonian fluid properties.

### 2.2 Hampel 3-Sigma Outlier Filter
- **Model Type**: Robust non-parametric sliding window statistical filter.
- **Window Size ($k$)**: 7 consecutive timesteps.
- **Threshold**: $3.0 \times 1.4826 \times \text{MAD}$ (Median Absolute Deviation).
- **Purpose**: Suppresses sensor telemetry spikes and electromagnetic interference without lagging physical process changes.

### 2.3 Theil-Sen Robust Linear Trend Extrapolator
- **Model Type**: Non-parametric robust regression.
- **Formulation**:
$$\beta = \text{median}\left(\left\{\frac{y_j - y_i}{x_j - x_i} : i < j\right\}\right)$$
- **Breakdown Point**: 29.3% arbitrary gross outliers.
- **Purpose**: Projects long-term fouling progression and Remaining Useful Life (RUL) impervious to temporary chemical backwash perturbations.

### 2.4 Biological Kinetic & Mass Balance Model
- **Model Type**: Modified activated sludge mass balance (Metcalf & Eddy 5th Ed.).
- **State Variables**: Aeration basin MLSS ($X_a$), MBR tank MLSS ($X_m$), Waste activated sludge flow ($Q_w$).
- **Governing Equations**: Solids retention time ($\theta_x$), biomass accumulation rate ($dX/dt$).

---

## 3. Out-Of-Distribution (OOD) Guard
Before any diagnostic or optimization directive is emitted, the operating vector is validated against the safe experimental training envelope:
- Temperature: $5.0^\circ\text{C} \le T \le 38.0^\circ\text{C}$
- MLSS: $2,000 \text{ mg/L} \le X \le 16,000 \text{ mg/L}$
- Flux: $5.0 \text{ LMH} \le J \le 36.0 \text{ LMH}$
- TMP: $0.0 \text{ kPa} \le \text{TMP} \le 55.0 \text{ kPa}$

If any parameter violates this bounding polytope:
- Output is strictly flagged as `OUTSIDE MODEL EXPERIENCE`.
- Decision confidence is clamped to `LOW` or `INSUFFICIENT DATA`.
- High-confidence autonomous control recommendations are withheld.
