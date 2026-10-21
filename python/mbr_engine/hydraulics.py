"""
UNIT 77 MBR SUPER EXPERT — HYDRAULIC & DARCY PHYSICS ENGINE
Calculates membrane fluxes, Poiseuille viscosity, temperature-normalized permeability,
and Darcy-law filtration resistances with zero-division safeguards.
"""

import math
from dataclasses import dataclass
from typing import Dict, Any, Optional

from .config import PHYSICAL_CONSTANTS, PLANT_CONFIG, TRAINS_CONFIG, plant_config_manager


def calculate_water_viscosity(temp_c: float) -> float:
    """
    Calculates dynamic water viscosity in mPa.s (cP) as a function of temperature (°C).
    Uses standard Poiseuille exponential approximation:
    mu(T) = 1.787 * exp(-0.0337 * T + 0.000221 * T^2)
    Safe clamped between 0.1°C and 80.0°C.
    """
    safe_temp = max(0.1, min(80.0, float(temp_c)))
    return 1.787 * math.exp(-0.0337 * safe_temp + 0.000221 * (safe_temp ** 2))


def calculate_gross_flux(flow_m3_h: float, membrane_area_m2: float) -> float:
    """
    Calculates instantaneous gross permeate flux in LMH (L / (m^2 * h)).
    J_gross = (Q * 1000) / A
    """
    if membrane_area_m2 <= 0.0:
        return 0.0
    return (max(0.0, flow_m3_h) * 1000.0) / membrane_area_m2


def calculate_net_flux(
    gross_flux_lmh: float,
    t_filt_min: float = 9.0,
    t_bw_min: float = 0.75,
    t_relax_min: float = 0.25,
) -> float:
    """
    Calculates operational net flux accounting for non-productive cycle time (backwash + relaxation).
    J_net = J_gross * (t_filt / (t_filt + t_bw + t_relax))
    """
    total_cycle = t_filt_min + t_bw_min + t_relax_min
    if total_cycle <= 0.0:
        return 0.0
    duty_ratio = max(0.0, min(1.0, t_filt_min / total_cycle))
    return gross_flux_lmh * duty_ratio


def calculate_permeability(flux_lmh: float, tmp_kpa: float) -> float:
    """
    Calculates hydraulic permeability in LMH/bar.
    K = flux / (TMP / 100) = (flux * 100) / TMP
    """
    safe_tmp = max(0.01, tmp_kpa)
    return (flux_lmh * 100.0) / safe_tmp


def calculate_normalized_permeability(
    permeability_lmh_bar: float, temp_c: float
) -> float:
    """
    Calculates standard temperature-normalized permeability at 20°C.
    K_20 = K_T * (mu_T / mu_20)
    """
    mu_t = calculate_water_viscosity(temp_c)
    mu_20 = calculate_water_viscosity(20.0)  # ~1.002 mPa.s
    return permeability_lmh_bar * (mu_t / mu_20)


def calculate_darcy_total_resistance(
    tmp_kpa: float, flux_lmh: float, temp_c: float
) -> float:
    """
    Calculates total filtration resistance R_t in m^-1 using Darcy's Law:
    R_t = (TMP * 1000) / (mu_Pa_s * J_m_s)
    """
    flux_m_s = max(1e-9, flux_lmh / 3600000.0)
    mu_pa_s = calculate_water_viscosity(temp_c) * 0.001
    tmp_pa = max(0.0, tmp_kpa * 1000.0)
    return tmp_pa / (mu_pa_s * flux_m_s)


def calculate_clean_membrane_resistance(
    clean_tmp_kpa: float = 10.0,
    clean_flux_lmh: float = 24.0,
    clean_temp_c: float = 20.0,
) -> float:
    """
    Inverts clean water baseline test to derive intrinsic clean membrane resistance R_m (m^-1).
    R_m = (TMP_clean * 1000) / (mu_20 * J_clean_m_s)
    Benchmark PVDF hollow fiber value: ~1.497e12 - 1.508e12 m^-1.
    """
    return calculate_darcy_total_resistance(clean_tmp_kpa, clean_flux_lmh, clean_temp_c)


def calculate_cake_layer_resistance(
    total_resistance_m_inv: float, clean_resistance_m_inv: float = 1.497e12
) -> float:
    """
    Calculates fouling/cake layer resistance R_c in m^-1:
    R_c = max(0, R_t - R_m)
    """
    return max(0.0, total_resistance_m_inv - clean_resistance_m_inv)


def calculate_specific_cake_resistance(
    delta_tmp_kpa: float,
    flux_lmh: float,
    temp_c: float,
    deposited_solids_kg_m2: float,
) -> float:
    """
    Calculates specific cake resistance alpha in m/kg:
    alpha = R_c / omega_solids
    where R_c = (delta_TMP * 1000) / (mu * J)
    """
    if deposited_solids_kg_m2 <= 1e-6 or flux_lmh <= 1e-3:
        return 3.285e13
    flux_m_s = flux_lmh / 3600000.0
    mu_pa_s = calculate_water_viscosity(temp_c) * 0.001
    delta_tmp_pa = max(0.0, delta_tmp_kpa * 1000.0)
    r_cake = delta_tmp_pa / (mu_pa_s * flux_m_s)
    return r_cake / deposited_solids_kg_m2


def calculate_compaction_exponent(
    tmp_high_kpa: float,
    tmp_low_kpa: float,
    flux_high_lmh: float,
    flux_low_lmh: float,
) -> float:
    """
    Calculates cake layer compressibility exponent beta from flux-step response:
    beta = ln(TMP_high / TMP_low) / ln(J_high / J_low)
    Nominal MBR sludge cake benchmark: ~1.35 - 1.45.
    """
    if tmp_low_kpa <= 0.01 or flux_low_lmh <= 0.01:
        return 1.40
    ratio_tmp = tmp_high_kpa / tmp_low_kpa
    ratio_flux = flux_high_lmh / flux_low_lmh
    if ratio_flux <= 1.001 or ratio_tmp <= 1.0:
        return 1.40
    return math.log(ratio_tmp) / math.log(ratio_flux)


@dataclass
class HydraulicState:
    train_id: str
    flow_m3_h: float
    tmp_kpa: float
    temp_c: float
    area_m2: float
    gross_flux_lmh: float
    net_flux_lmh: float
    viscosity_mpa_s: float
    permeability_lmh_bar: float
    norm_permeability_lmh_bar: float
    total_resistance_m_inv: float
    clean_resistance_m_inv: float
    cake_resistance_m_inv: float
    fouling_ratio_pct: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "train_id": self.train_id,
            "flow_m3_h": round(self.flow_m3_h, 2),
            "tmp_kpa": round(self.tmp_kpa, 2),
            "temp_c": round(self.temp_c, 2),
            "area_m2": round(self.area_m2, 1),
            "gross_flux_lmh": round(self.gross_flux_lmh, 2),
            "net_flux_lmh": round(self.net_flux_lmh, 2),
            "viscosity_mpa_s": round(self.viscosity_mpa_s, 4),
            "permeability_lmh_bar": round(self.permeability_lmh_bar, 2),
            "norm_permeability_lmh_bar": round(self.norm_permeability_lmh_bar, 2),
            "total_resistance_m_inv": float(f"{self.total_resistance_m_inv:.4e}"),
            "clean_resistance_m_inv": float(f"{self.clean_resistance_m_inv:.4e}"),
            "cake_resistance_m_inv": float(f"{self.cake_resistance_m_inv:.4e}"),
            "fouling_ratio_pct": round(self.fouling_ratio_pct, 2),
        }


def evaluate_train_hydraulics(
    train_id: str,
    flow_m3_h: float,
    tmp_kpa: float,
    temp_c: float,
    area_m2: Optional[float] = None,
    clean_rm: Optional[float] = None,
) -> HydraulicState:
    """
    Evaluates complete hydraulic state for a specific membrane train.
    Area is dynamically resolved per train from PlantConfigManager.
    """
    # Dynamic area lookup
    resolved_area = area_m2
    if resolved_area is None or resolved_area <= 0.0:
        cfg = plant_config_manager.get_train_by_id(train_id)
        if cfg and cfg.get("membraneAreaM2"):
            resolved_area = float(cfg["membraneAreaM2"])
        else:
            resolved_area = float(TRAINS_CONFIG.get(train_id, {}).get("area_m2", 4800.0))

    # Dynamic Rm lookup
    resolved_rm = clean_rm
    if resolved_rm is None:
        cfg = plant_config_manager.get_train_by_id(train_id)
        if cfg and cfg.get("cleanRm"):
            resolved_rm = float(cfg["cleanRm"])
        else:
            resolved_rm = float(TRAINS_CONFIG.get(train_id, {}).get("clean_rm_m_inv", 1.497e12))

    visc = calculate_water_viscosity(temp_c)
    gross_flux = calculate_gross_flux(flow_m3_h, resolved_area)
    net_flux = calculate_net_flux(gross_flux)
    perm = calculate_permeability(gross_flux, tmp_kpa)
    norm_perm = calculate_normalized_permeability(perm, temp_c)
    r_total = calculate_darcy_total_resistance(tmp_kpa, gross_flux, temp_c)
    r_cake = calculate_cake_layer_resistance(r_total, resolved_rm)
    fouling_ratio = (r_cake / max(1.0, r_total)) * 100.0

    return HydraulicState(
        train_id=train_id,
        flow_m3_h=flow_m3_h,
        tmp_kpa=tmp_kpa,
        temp_c=temp_c,
        area_m2=resolved_area,
        gross_flux_lmh=gross_flux,
        net_flux_lmh=net_flux,
        viscosity_mpa_s=visc,
        permeability_lmh_bar=perm,
        norm_permeability_lmh_bar=norm_perm,
        total_resistance_m_inv=r_total,
        clean_resistance_m_inv=resolved_rm,
        cake_resistance_m_inv=r_cake,
        fouling_ratio_pct=fouling_ratio,
    )
