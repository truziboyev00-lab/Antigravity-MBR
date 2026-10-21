"""
UNIT 77 MBR SUPER EXPERT — AUTOMATED PARAMETER CALIBRATION ENGINE
Provides analytical inversion for Darcy parameters, OLS regression fitting,
and model parameter tuning with convergence metrics.
"""

import math
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple

from .hydraulics import (
    calculate_water_viscosity,
    calculate_clean_membrane_resistance,
    calculate_specific_cake_resistance,
    calculate_compaction_exponent,
)


def perform_ols_regression(
    x_values: List[float],
    y_values: List[float],
) -> Dict[str, float]:
    """
    Pure-Python Ordinary Least Squares (OLS) linear regression without external dependencies.
    y = slope * x + intercept
    Returns slope, intercept, R^2, RMSE, and residual variance.
    """
    n = len(x_values)
    if n < 2 or len(y_values) != n:
        return {"slope": 0.0, "intercept": 0.0, "r2": 0.0, "rmse": 0.0, "residual_var": 0.0}

    sum_x = sum(x_values)
    sum_y = sum(y_values)
    sum_xy = sum(x * y for x, y in zip(x_values, y_values))
    sum_x2 = sum(x * x for x in x_values)

    denom = (n * sum_x2) - (sum_x * sum_x)
    if abs(denom) <= 1e-12:
        return {"slope": 0.0, "intercept": sum_y / n, "r2": 0.0, "rmse": 0.0, "residual_var": 0.0}

    slope = ((n * sum_xy) - (sum_x * sum_y)) / denom
    intercept = (sum_y - (slope * sum_x)) / n

    mean_y = sum_y / n
    ss_tot = sum((y - mean_y) ** 2 for y in y_values)
    ss_res = sum((y - (intercept + slope * x)) ** 2 for x, y in zip(x_values, y_values))

    r2 = (1.0 - (ss_res / ss_tot)) if ss_tot > 1e-12 else 1.0
    r2 = max(0.0, min(1.0, r2))
    rmse = math.sqrt(ss_res / n)
    res_var = ss_res / max(1, n - 2)

    return {
        "slope": slope,
        "intercept": intercept,
        "r2": r2,
        "rmse": rmse,
        "residual_var": res_var,
    }


def calibrate_clean_resistance(
    clean_tmp_kpa: float = 10.0,
    clean_flux_lmh: float = 24.0,
    clean_temp_c: float = 20.0,
) -> float:
    """
    Calibrates clean membrane resistance Rm from baseline clean water test.
    """
    return calculate_clean_membrane_resistance(clean_tmp_kpa, clean_flux_lmh, clean_temp_c)


def calibrate_cake_resistance_and_compaction(
    delta_tmp_kpa: float = 8.6,
    flux_lmh: float = 24.0,
    temp_c: float = 18.5,
    deposited_solids_kg_m2: float = 0.038,
    tmp_step_high_kpa: float = 29.267,
    tmp_step_low_kpa: float = 19.5667,
    flux_step_high_lmh: float = 32.0,
    flux_step_low_lmh: float = 24.0,
) -> Tuple[float, float]:
    """
    Calibrates specific cake resistance alpha (m/kg) and compaction exponent beta (-).
    """
    alpha = calculate_specific_cake_resistance(delta_tmp_kpa, flux_lmh, temp_c, deposited_solids_kg_m2)
    beta = calculate_compaction_exponent(tmp_step_high_kpa, tmp_step_low_kpa, flux_step_high_lmh, flux_step_low_lmh)
    return alpha, beta


@dataclass
class CalibrationReport:
    rm_clean_m_inv: float
    alpha_cake_m_kg: float
    beta_compaction: float
    k_foul_h_inv: float
    theta_temp_factor: float
    ols_metrics: Dict[str, float]
    calibration_converged: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rm_clean_m_inv": float(f"{self.rm_clean_m_inv:.4e}"),
            "alpha_cake_m_kg": float(f"{self.alpha_cake_m_kg:.4e}"),
            "beta_compaction": round(self.beta_compaction, 3),
            "k_foul_h_inv": round(self.k_foul_h_inv, 4),
            "theta_temp_factor": round(self.theta_temp_factor, 3),
            "ols_metrics": {
                "slope_kpa_h": round(self.ols_metrics["slope"], 4),
                "intercept_kpa": round(self.ols_metrics["intercept"], 3),
                "r2": round(self.ols_metrics["r2"], 4),
                "rmse_kpa": round(self.ols_metrics["rmse"], 4),
            },
            "calibration_converged": self.calibration_converged,
        }


def calibrate_all_parameters(
    time_series_hours: List[float] = None,
    tmp_series_kpa: List[float] = None,
) -> CalibrationReport:
    """
    Performs unified automated parameter calibration over plant telemetry.
    """
    if time_series_hours is None or tmp_series_kpa is None:
        # Default 40-hour calibration horizon
        time_series_hours = [0.0, 8.0, 16.0, 24.0, 32.0, 40.0]
        tmp_series_kpa = [18.6, 19.56, 20.52, 21.48, 22.44, 23.40]

    ols = perform_ols_regression(time_series_hours, tmp_series_kpa)
    rm = calibrate_clean_resistance(10.0, 24.0, 20.0)
    alpha, beta = calibrate_cake_resistance_and_compaction()

    # Dynamic fouling constant k_foul = slope / mean(TMP)
    mean_tmp = sum(tmp_series_kpa) / len(tmp_series_kpa) if tmp_series_kpa else 20.0
    k_foul = ols["slope"] / mean_tmp if mean_tmp > 0 else 0.0085

    theta = 1.025  # Arrhenius thermal sensitivity factor

    converged = ols["r2"] >= 0.85 and ols["rmse"] < 1.0

    return CalibrationReport(
        rm_clean_m_inv=rm,
        alpha_cake_m_kg=alpha,
        beta_compaction=beta,
        k_foul_h_inv=k_foul,
        theta_temp_factor=theta,
        ols_metrics=ols,
        calibration_converged=converged,
    )
