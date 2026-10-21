"""
UNIT 77 MBR SUPER EXPERT — PREDICTION & RUL ENGINE
Implements multi-horizon forecasting (linear vs exponential compaction), Remaining Useful Life
matrix (RUL to 45 kPa & 55 kPa), urgency classification, and prescriptive chemical maintenance.
"""

import math
from dataclasses import dataclass
from typing import Dict, Any, List

from .config import OPERATIONAL_LIMITS


def project_linear_forecast(
    base_tmp_kpa: float,
    fouling_rate_kpa_h: float,
    horizon_hours: float,
) -> float:
    """
    Computes linear fouling trend projection:
    TMP(t) = max(0, TMP_0 + (dTMP/dt) * t)
    """
    projected = base_tmp_kpa + (fouling_rate_kpa_h * horizon_hours)
    return round(max(0.0, projected), 2)


def project_exponential_forecast(
    base_tmp_kpa: float,
    fouling_rate_kpa_h: float,
    horizon_hours: float,
) -> float:
    """
    Computes exponential cake compaction projection:
    k = (dTMP/dt) / TMP_0
    TMP(t) = TMP_0 * exp(k * t)
    """
    if base_tmp_kpa <= 0.01:
        return 0.0
    k_exp = fouling_rate_kpa_h / base_tmp_kpa
    k_exp = max(-0.05, min(0.10, k_exp))
    projected = base_tmp_kpa * math.exp(k_exp * horizon_hours)
    return round(max(0.0, projected), 2)


def calculate_remaining_useful_life(
    current_tmp_kpa: float,
    fouling_rate_kpa_h: float,
    limit_tmp_kpa: float = 45.0,
    model_type: str = "LINEAR",
) -> float:
    """
    Calculates Remaining Useful Life (RUL) in operating hours until threshold is breached.
    Linear: RUL = (Limit - Current) / max(0.001, rate)
    Exponential: RUL = ln(Limit / Current) / max(0.0001, rate / Current)
    """
    if current_tmp_kpa >= limit_tmp_kpa:
        return 0.0

    if model_type.upper() == "EXPONENTIAL":
        if current_tmp_kpa <= 0.01:
            return 999.0
        k = max(0.0001, fouling_rate_kpa_h / current_tmp_kpa)
        rul = math.log(limit_tmp_kpa / current_tmp_kpa) / k
        return round(max(0.0, rul), 1)

    # Default Linear
    safe_rate = max(0.001, fouling_rate_kpa_h)
    rul = (limit_tmp_kpa - current_tmp_kpa) / safe_rate
    return round(max(0.0, rul), 1)


def classify_operational_urgency(rul_hours: float) -> str:
    """
    Maps RUL to standard industrial operating urgency:
      - CRITICAL: <= 12 hours (Immediate clean or shutdown imminent)
      - WARNING: <= 36 hours (Schedule maintenance clean within shift)
      - PLANNED: <= 72 hours (Plan chemical replenishment)
      - NORMAL: > 72 hours (Safe operating envelope)
    """
    if rul_hours <= 12.0:
        return "CRITICAL"
    elif rul_hours <= 36.0:
        return "WARNING"
    elif rul_hours <= 72.0:
        return "PLANNED"
    return "NORMAL"


def generate_prescriptive_cleaning_plan(
    train_id: str,
    tmp_kpa: float,
    rul_hours: float,
    organic_fouling_dominant: bool = True,
) -> Dict[str, Any]:
    """
    Generates tailored chemical maintenance clean recipe and operational dispatch order.
    """
    urgency = classify_operational_urgency(rul_hours)

    if urgency == "CRITICAL":
        chemical = "Sodium Hypochlorite (NaOCl)" if organic_fouling_dominant else "Citric Acid"
        conc_ppm = 500 if organic_fouling_dominant else 2000
        soak_min = 45
        dispatch = "IMMEDIATE_DISPATCH"
        msg = f"Train {train_id} requires emergency Maintenance Clean within {rul_hours:.1f}h to avoid automatic shutdown."
    elif urgency == "WARNING":
        chemical = "Sodium Hypochlorite (NaOCl)" if organic_fouling_dominant else "Citric Acid"
        conc_ppm = 350 if organic_fouling_dominant else 1500
        soak_min = 30
        dispatch = "SCHEDULE_CURRENT_SHIFT"
        msg = f"Train {train_id} fouling trend indicates clean required in {rul_hours:.1f}h."
    elif urgency == "PLANNED":
        chemical = "Routine NaOCl Maintenance Clean"
        conc_ppm = 250
        soak_min = 20
        dispatch = "SCHEDULE_WEEKLY_WINDOW"
        msg = f"Train {train_id} on schedule. Clean window in ~{rul_hours / 24.0:.1f} days."
    else:
        chemical = "Standard Cyclic Backwash"
        conc_ppm = 0
        soak_min = 0
        dispatch = "ROUTINE_MONITORING"
        msg = f"Train {train_id} healthy. RUL exceeds 72 operating hours ({rul_hours:.1f}h)."

    return {
        "train_id": train_id,
        "urgency": urgency,
        "dispatch_order": dispatch,
        "recommended_chemical": chemical,
        "concentration_ppm": conc_ppm,
        "soak_time_min": soak_min,
        "message": msg,
    }


@dataclass
class PredictionResult:
    train_id: str
    current_tmp_kpa: float
    fouling_rate_kpa_h: float
    linear_forecasts: Dict[str, float]
    exp_forecasts: Dict[str, float]
    rul_linear_45_kpa: float
    rul_exp_45_kpa: float
    rul_estop_55_kpa: float
    urgency: str
    cleaning_plan: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "train_id": self.train_id,
            "current_tmp_kpa": self.current_tmp_kpa,
            "fouling_rate_kpa_h": self.fouling_rate_kpa_h,
            "linear_forecasts": self.linear_forecasts,
            "exp_forecasts": self.exp_forecasts,
            "rul_linear_45_kpa": self.rul_linear_45_kpa,
            "rul_exp_45_kpa": self.rul_exp_45_kpa,
            "rul_estop_55_kpa": self.rul_estop_55_kpa,
            "urgency": self.urgency,
            "cleaning_plan": self.cleaning_plan,
        }


def evaluate_train_prediction(
    train_id: str,
    current_tmp_kpa: float,
    fouling_rate_kpa_h: float,
    horizons: List[float] = None,
) -> PredictionResult:
    """
    Evaluates multi-horizon prediction, RUL, and action scheduling for a train.
    """
    if horizons is None:
        horizons = [6.0, 12.0, 24.0, 48.0, 72.0, 168.0]

    lin_fc = {"T+0": current_tmp_kpa}
    exp_fc = {"T+0": current_tmp_kpa}

    for h in horizons:
        tag = f"+{int(h)}h"
        lin_fc[tag] = project_linear_forecast(current_tmp_kpa, fouling_rate_kpa_h, h)
        exp_fc[tag] = project_exponential_forecast(current_tmp_kpa, fouling_rate_kpa_h, h)

    rul_lin_45 = calculate_remaining_useful_life(current_tmp_kpa, fouling_rate_kpa_h, 45.0, "LINEAR")
    rul_exp_45 = calculate_remaining_useful_life(current_tmp_kpa, fouling_rate_kpa_h, 45.0, "EXPONENTIAL")
    rul_estop_55 = calculate_remaining_useful_life(current_tmp_kpa, fouling_rate_kpa_h, 55.0, "LINEAR")

    urgency = classify_operational_urgency(rul_lin_45)
    plan = generate_prescriptive_cleaning_plan(train_id, current_tmp_kpa, rul_lin_45)

    return PredictionResult(
        train_id=train_id,
        current_tmp_kpa=current_tmp_kpa,
        fouling_rate_kpa_h=fouling_rate_kpa_h,
        linear_forecasts=lin_fc,
        exp_forecasts=exp_fc,
        rul_linear_45_kpa=rul_lin_45,
        rul_exp_45_kpa=rul_exp_45,
        rul_estop_55_kpa=rul_estop_55,
        urgency=urgency,
        cleaning_plan=plan,
    )
