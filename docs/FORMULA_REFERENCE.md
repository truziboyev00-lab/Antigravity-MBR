# UNIT 77 MBR SUPER EXPERT — FORMULA REFERENCE

This document lists canonical mathematical equations implemented synchronously across OpenXML Excel formulas and the Python 64-bit analytical engine.

---

## 1. Hydraulic Formulas

### 1.1 Gross Permeate Flux ($J$)
$$J = \frac{Q_{\text{perm}} \cdot 1000}{A_{\text{membrane}}} \quad [\text{LMH = L}/(\text{m}^2\cdot\text{h})]$$
- Excel: `=(Q_perm * 1000) / Area`
- Python: `(flow_m3_h * 1000.0) / area_m2`

### 1.2 Transmembrane Pressure ($\Delta P$ or $\text{TMP}$)
$$\text{TMP} = P_{\text{feed/tank}} - P_{\text{permeate}} \quad [\text{kPa}]$$
- In submerged configurations: $\text{TMP} = \rho \cdot g \cdot h_{\text{submersion}} - P_{\text{vacuum}}$

### 1.3 Temperature-Corrected Permeability ($L_{p,20}$)
$$L_{p,20} = \frac{J}{\text{TMP} / 100} \cdot \left(\frac{\mu_T}{\mu_{20}}\right) \quad [\text{LMH/bar}]$$
Where $\mu_T$ is computed from standard water dynamic viscosity equations:
$$\mu(T) = A \cdot \exp(B \cdot T + C \cdot T^2)$$
At 20°C, $\mu_{20} = 1.0020 \text{ mPa}\cdot\text{s}$.

### 1.4 Specific Air Demand for Membrane Scouring ($SAD_m$)
$$SAD_m = \frac{Q_{\text{air}}}{A_{\text{membrane}}} \quad [\text{Nm}^3/(\text{m}^2\cdot\text{h})]$$
Design nominal target: $0.25 \text{ Nm}^3/(\text{m}^2\cdot\text{h})$.

---

## 2. Biological Process Formulas

### 2.1 Total Plant Biomass Inventory ($M_{\text{bio}}$)
$$M_{\text{bio}} = \frac{V_{\text{basin}} \cdot X_{\text{basin}} + V_{\text{MBR}} \cdot X_{\text{MBR}}}{1000} \quad [\text{kg MLSS}]$$
Nominal baseline:
- Aeration Tank: $3,600 \text{ m}^3 \times 8,000 \text{ mg/L} / 1000 = 28,800 \text{ kg}$
- MBR Tanks (4): $600 \text{ m}^3 \times 8,400 \text{ mg/L} / 1000 = 5,040 \text{ kg}$
- Total: $33,840 \text{ kg}$

### 2.2 Solids Retention Time (SRT, $\theta_x$)
$$\theta_x = \frac{M_{\text{bio}}}{Q_{\text{WAS}} \cdot X_{\text{WAS}} / 1000 + Q_{\text{eff}} \cdot X_{\text{eff}} / 1000} \quad [\text{days}]$$
Nominal design: $\theta_x = 25.15 \text{ days}$.

### 2.3 Food to Microorganism Ratio (F/M)
$$\text{F/M} = \frac{Q_{\text{inf}} \cdot \text{BOD}_{\text{inf}}}{M_{\text{bio}}} \quad [\text{kg BOD}/(\text{kg MLSS}\cdot\text{d})]$$
Design target: $0.08 - 0.12 \text{ kg BOD}/(\text{kg MLSS}\cdot\text{d})$.

---

## 3. Chemical Cleaning Dosing Formulas

### 3.1 Sodium Hypochlorite (NaOCl) Requirement
$$V_{\text{NaOCl}} = \frac{V_{\text{pipe+membrane}} \cdot C_{\text{target}}}{C_{\text{stock}} \cdot \rho_{\text{stock}} \cdot 10} \quad [\text{Liters}]$$
- $C_{\text{target}}$: 500 mg/L (CEB) to 1,500 mg/L (CIP)
- Stock concentration: 12.0% active chlorine ($\approx 120,000 \text{ mg/L}$)

### 3.2 Citric Acid Requirement
$$m_{\text{citric}} = \frac{V_{\text{solution}} \cdot C_{\text{target}}}{1000} \quad [\text{kg dry powder}]$$
- $C_{\text{target}}$: 2,000 mg/L ($2.0 \text{ kg/m}^3$)
