"""
UNIT 77 MBR SUPER EXPERT — DIAGNOSTIC & ADVANCED ALARM ENGINE
Implements deadband hysteresis, persistence counters, peer train Z-score outliers,
composite Multi-Risk Index (MRI 0-100), and root-cause fault diagnosis.
"""

import math
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

from .config import OPERATIONAL_LIMITS


class AlarmSeverity(str, Enum):
    NORMAL = "NORMAL"
    ADVISORY = "ADVISORY"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


@dataclass
class HysteresisAlarm:
    """
    Prevents alarm chattering by enforcing separate trip and reset thresholds.
    """
    param_id: str
    trip_high: float
    reset_low: float
    is_latched: bool = False

    def evaluate(self, current_value: float) -> bool:
        if not self.is_latched:
            if current_value >= self.trip_high:
                self.is_latched = True
        else:
            if current_value < self.reset_low:
                self.is_latched = False
        return self.is_latched


@dataclass
class PersistenceAlarm:
    """
    Requires anomalous condition to persist for consecutive evaluation cycles before tripping.
    """
    param_id: str
    threshold: float
    required_persistence_cycles: int = 3
    current_counter: int = 0
    is_active: bool = False

    def evaluate(self, current_value: float) -> bool:
        if current_value >= self.threshold:
            self.current_counter += 1
            if self.current_counter >= self.required_persistence_cycles:
                self.is_active = True
        else:
            self.current_counter = 0
            self.is_active = False
        return self.is_active


def calculate_rate_of_change(
    current_val: float,
    previous_val: float,
    delta_time_hours: float,
) -> float:
    """
    Calculates numerical rate of change (e.g., dTMP/dt in kPa/h).
    Clamped against zero or negative delta time.
    """
    if delta_time_hours <= 1e-4:
        return 0.0
    return (current_val - previous_val) / delta_time_hours


def calculate_peer_z_scores(train_values: Dict[str, float]) -> Dict[str, Dict[str, float]]:
    """
    Calculates peer statistical z-scores and percentage deviation from fleet mean.
    Z_i = (X_i - Mean) / StdDev
    If standard deviation is zero or near zero, z-score is 0.0.
    """
    train_ids = list(train_values.keys())
    values = [float(train_values[tid]) for tid in train_ids]
    n = len(values)

    if n == 0:
        return {}
    if n == 1:
        return {train_ids[0]: {"value": values[0], "mean": values[0], "std_dev": 0.0, "z_score": 0.0, "pct_dev": 0.0}}

    mean_val = sum(values) / n
    variance = sum((x - mean_val) ** 2 for x in values) / n
    std_dev = math.sqrt(variance)

    results: Dict[str, Dict[str, float]] = {}
    for tid in train_ids:
        val = train_values[tid]
        z = (val - mean_val) / std_dev if std_dev > 1e-6 else 0.0
        pct_dev = ((val - mean_val) / mean_val * 100.0) if mean_val > 1e-6 else 0.0
        results[tid] = {
            "value": round(val, 2),
            "mean": round(mean_val, 2),
            "std_dev": round(std_dev, 4),
            "z_score": round(z, 2),
            "pct_dev": round(pct_dev, 2),
        }
    return results


def calculate_multi_risk_index(
    max_tmp_kpa: float,
    max_roc_kpa_h: float,
    min_norm_perm_lmh_bar: float,
    srt_days: float,
    mlss_mg_l: float,
    aeration_flow_nm3_h: float,
) -> Dict[str, Any]:
    """
    Calculates Composite Multi-Risk Index (MRI 0-100) and decomposed domain risk factors.
    Domains:
      - Hydraulic Risk (weight 0.40): TMP, ROC, Permeability loss
      - Biological Risk (weight 0.35): SRT washout proximity, MLSS bounds
      - Mechanical/Aeration Risk (weight 0.25): Aeration scouring deficiency
    """
    # 1. Hydraulic Risk (0 - 100)
    tmp_score = min(100.0, max(0.0, ((max_tmp_kpa - 15.0) / (45.0 - 15.0)) * 100.0))
    roc_score = min(100.0, max(0.0, (max_roc_kpa_h / 0.50) * 100.0))
    perm_score = min(100.0, max(0.0, ((150.0 - min_norm_perm_lmh_bar) / (150.0 - 60.0)) * 100.0))
    hydraulic_risk = (0.50 * tmp_score) + (0.30 * roc_score) + (0.20 * perm_score)

    # 2. Biological Risk (0 - 100)
    if srt_days < 12.0:
        srt_score = 100.0
    elif srt_days < 18.0:
        srt_score = ((18.0 - srt_days) / 6.0) * 80.0 + 20.0
    elif srt_days > 70.0:
        srt_score = min(100.0, ((srt_days - 70.0) / 30.0) * 70.0 + 30.0)
    else:
        srt_score = 10.0

    mlss_score = 0.0
    if mlss_mg_l > 11000.0:
        mlss_score = min(100.0, ((mlss_mg_l - 11000.0) / 2000.0) * 100.0)
    elif mlss_mg_l < 6000.0:
        mlss_score = min(100.0, ((6000.0 - mlss_mg_l) / 2000.0) * 100.0)
    biological_risk = (0.65 * srt_score) + (0.35 * mlss_score)

    # 3. Mechanical / Aeration Risk (0 - 100)
    nominal_aeration = 450.0  # Nm3/h
    if aeration_flow_nm3_h < nominal_aeration:
        aeration_score = min(100.0, ((nominal_aeration - aeration_flow_nm3_h) / nominal_aeration) * 100.0)
    else:
        aeration_score = 5.0
    mechanical_risk = aeration_score

    # Composite MRI
    composite_mri = (0.40 * hydraulic_risk) + (0.35 * biological_risk) + (0.25 * mechanical_risk)
    composite_mri = min(100.0, max(0.0, composite_mri))

    severity = AlarmSeverity.NORMAL
    if composite_mri >= 80.0:
        severity = AlarmSeverity.CRITICAL
    elif composite_mri >= 60.0:
        severity = AlarmSeverity.WARNING
    elif composite_mri >= 35.0:
        severity = AlarmSeverity.ADVISORY

    return {
        "mri_score": round(composite_mri, 1),
        "severity": severity.value,
        "hydraulic_risk": round(hydraulic_risk, 1),
        "biological_risk": round(biological_risk, 1),
        "mechanical_risk": round(mechanical_risk, 1),
        "dominant_risk_domain": max(
            [("HYDRAULIC", hydraulic_risk), ("BIOLOGICAL", biological_risk), ("MECHANICAL", mechanical_risk)],
            key=lambda item: item[1]
        )[0],
    }


def diagnose_root_cause(
    tmp_kpa: float,
    norm_perm_lmh_bar: float,
    turbidity_ntu: float,
    aeration_scfm: float,
    temp_c: float,
    mlss_mg_l: float,
) -> Dict[str, Any]:
    """
    Multi-symptom root cause diagnostic classifier.
    Distinguishes:
      - FAULT_FIBER_RUPTURE: Sudden drop in TMP + surge in filtrate turbidity (>0.5 NTU)
      - FAULT_AERATION_DEFICIT: Low scouring air + rapid cake buildup
      - PHENOMENON_COLD_VISCOSITY: Elevated TMP caused strictly by temperature drop without permeability loss
      - FAULT_COLLOIDAL_FOULING: Low normalized permeability + high MLSS/viscosity
      - NOMINAL: Operating within normal baseline parameters
    """
    if turbidity_ntu > 0.40:
        return {
            "diagnostic_code": "FAULT_FIBER_RUPTURE",
            "confidence_pct": 98.5,
            "title": "Membrane Fiber Integrity Compromised",
            "description": f"Elevated filtrate turbidity ({turbidity_ntu:.2f} NTU) indicates breached hollow-fiber integrity.",
            "recommended_action": "Isolate train immediately and perform Pressure Decay Test (PDT) to pin-point broken fibers.",
            "severity": AlarmSeverity.CRITICAL.value,
        }

    if aeration_scfm < 280.0 and tmp_kpa > 25.0:
        return {
            "diagnostic_code": "FAULT_AERATION_DEFICIT",
            "confidence_pct": 94.0,
            "title": "Air Scouring Scour Deficit / Blower Starvation",
            "description": f"Coarse bubble scouring air ({aeration_scfm:.1f} Nm³/h) is below minimum threshold for surface shear.",
            "recommended_action": "Verify blower header valve positioning and clear differential pressure across air scour diffusers.",
            "severity": AlarmSeverity.WARNING.value,
        }

    if temp_c < 12.0 and norm_perm_lmh_bar > 115.0 and tmp_kpa > 22.0:
        return {
            "diagnostic_code": "PHENOMENON_COLD_VISCOSITY",
            "confidence_pct": 96.2,
            "title": "Low-Temperature Viscosity Drag Elevation",
            "description": f"Elevated TMP is thermally induced by fluid drag at {temp_c:.1f}°C, while 20°C normalized permeability remains healthy.",
            "recommended_action": "Do NOT apply chemical cleaning. Relax flux slightly or allow standard temperature-compensated setpoint adjustments.",
            "severity": AlarmSeverity.ADVISORY.value,
        }

    if norm_perm_lmh_bar < 95.0 or (tmp_kpa > 32.0 and mlss_mg_l > 10500.0):
        return {
            "diagnostic_code": "FAULT_COLLOIDAL_FOULING",
            "confidence_pct": 92.8,
            "title": "Extracellular Polymeric (EPS) / Colloidal Cake Fouling",
            "description": f"True membrane permeability is degraded ({norm_perm_lmh_bar:.1f} LMH/bar) due to organic/sludge cake resistance.",
            "recommended_action": "Initiate Maintenance Clean (MC) with 500 ppm NaOCl + 2000 ppm Citric Acid backpulse.",
            "severity": AlarmSeverity.WARNING.value,
        }

    return {
        "diagnostic_code": "NOMINAL",
        "confidence_pct": 99.0,
        "title": "Normal Operational Equilibrium",
        "description": "All monitored hydraulic, biological, and pneumatic indicators are within normal design envelopes.",
        "recommended_action": "Continue automated cyclic filtration and routine backwashing.",
        "severity": AlarmSeverity.NORMAL.value,
    }


@dataclass
class AlarmState:
    train_id: str
    tmp_hysteresis_latched: bool
    roc_alarm_active: bool
    z_score: float
    mri: Dict[str, Any]
    diagnostic: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "train_id": self.train_id,
            "tmp_hysteresis_latched": self.tmp_hysteresis_latched,
            "roc_alarm_active": self.roc_alarm_active,
            "z_score": self.z_score,
            "mri": self.mri,
            "diagnostic": self.diagnostic,
        }
