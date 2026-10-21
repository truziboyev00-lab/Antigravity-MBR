"""
UNIT 77 MBR SUPER EXPERT — WHAT-IF SCENARIO ENGINE
Simulates train outages, non-linear cake compaction, cold-weather viscosity compensation,
sustainable flow bottlenecking, pumping power/SEC, and sludge wastage sensitivity.
"""

from dataclasses import dataclass
from typing import Dict, Any, List, Optional

from .config import PLANT_CONFIG, OPERATIONAL_LIMITS, plant_config_manager
from .hydraulics import calculate_water_viscosity, calculate_gross_flux
from .biological import calculate_total_biomass_inventory, calculate_solids_retention_time


def simulate_train_outage(
    total_flow_m3_h: Optional[float] = None,
    active_trains: Optional[int] = None,
    train_area_m2: Optional[float] = None,
    total_trains: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Simulates instantaneous hydraulic redistribution when one or more trains are offline.
    Dynamically driven by PlantConfigManager if parameters omitted.
    """
    if total_trains is None:
        total_trains = plant_config_manager.getInstalledTrainCount()
    if active_trains is None:
        active_trains = len(plant_config_manager.get_active_online_trains())
    if train_area_m2 is None:
        online = plant_config_manager.get_active_online_trains()
        tot_area = plant_config_manager.calculate_active_membrane_area()
        train_area_m2 = (tot_area / len(online)) if online else 4800.0
    if total_flow_m3_h is None:
        total_flow_m3_h = 460.8

    safe_trains = max(0, min(total_trains, int(active_trains)))
    active_area_m2 = safe_trains * train_area_m2

    if safe_trains == 0 or active_area_m2 <= 0.0:
        return {
            "active_trains": 0,
            "offline_trains": total_trains,
            "active_area_m2": 0.0,
            "redistributed_flux_lmh": 0.0,
            "flux_increase_pct": 0.0,
            "status": "ALL_TRAINS_OFFLINE",
        }

    redistributed_flux = (total_flow_m3_h * 1000.0) / active_area_m2
    baseline_flux = (total_flow_m3_h * 1000.0) / (total_trains * train_area_m2)
    flux_increase_pct = ((redistributed_flux - baseline_flux) / baseline_flux) * 100.0

    return {
        "active_trains": safe_trains,
        "offline_trains": total_trains - safe_trains,
        "active_area_m2": active_area_m2,
        "redistributed_flux_lmh": round(redistributed_flux, 2),
        "baseline_flux_lmh": round(baseline_flux, 2),
        "flux_increase_pct": round(flux_increase_pct, 2),
        "status": "REDISTRIBUTED_NORMAL" if redistributed_flux <= 30.0 else "EXCEEDS_SUSTAINABLE_FLUX",
    }


def simulate_nonlinear_tmp(
    baseline_tmp_kpa: float,
    baseline_flux_lmh: float,
    simulated_flux_lmh: float,
    beta_compaction: float = 1.40,
) -> float:
    """
    Models non-linear sludge cake compaction using power-law compressibility:
    TMP_sim = TMP_base * (J_sim / J_base)^beta
    """
    if baseline_flux_lmh <= 0.01 or simulated_flux_lmh <= 0.0:
        return 0.0
    flux_ratio = simulated_flux_lmh / baseline_flux_lmh
    return baseline_tmp_kpa * math_pow_safe(flux_ratio, beta_compaction)


def math_pow_safe(base: float, exponent: float) -> float:
    import math
    if base <= 0.0:
        return 0.0
    return math.pow(base, exponent)


def solve_sustainable_plant_flow(
    active_trains: Optional[int] = None,
    train_area_m2: Optional[float] = None,
    max_sustainable_flux_lmh: float = 30.0,
    desired_plant_flow_m3_h: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Solves maximum sustainable plant permeate throughput under train outage constraints.
    Q_max = (active_trains * A_train * J_max) / 1000
    Curtailment = max(0, Q_desired - Q_max)
    """
    if active_trains is None:
        active_trains = len(plant_config_manager.get_active_online_trains())
    if train_area_m2 is None:
        online = plant_config_manager.get_active_online_trains()
        tot_area = plant_config_manager.calculate_active_membrane_area()
        train_area_m2 = (tot_area / len(online)) if online else 4800.0
    if desired_plant_flow_m3_h is None:
        desired_plant_flow_m3_h = 460.8

    active_area_m2 = max(0, active_trains) * train_area_m2
    max_sustainable_flow_m3_h = (active_area_m2 * max_sustainable_flux_lmh) / 1000.0
    curtailment_required_m3_h = max(0.0, desired_plant_flow_m3_h - max_sustainable_flow_m3_h)
    curtailment_pct = (curtailment_required_m3_h / desired_plant_flow_m3_h * 100.0) if desired_plant_flow_m3_h > 0 else 0.0

    return {
        "active_trains": active_trains,
        "max_sustainable_flow_m3_h": round(max_sustainable_flow_m3_h, 2),
        "desired_plant_flow_m3_h": round(desired_plant_flow_m3_h, 2),
        "curtailment_required_m3_h": round(curtailment_required_m3_h, 2),
        "curtailment_pct": round(curtailment_pct, 2),
        "bottleneck_active": curtailment_required_m3_h > 0.001,
    }


def calculate_permeate_pump_power(
    flow_m3_h: float,
    tmp_kpa: float,
    pump_efficiency: float = 0.75,
) -> Dict[str, float]:
    """
    Calculates permeate pump hydraulic and electrical power and Specific Energy Consumption (SEC):
    P_hyd (kW) = (Q_m3_h * TMP_kPa) / 3600
    P_elec (kW) = P_hyd / eta
    SEC (kWh/m3) = P_elec / Q_m3_h = TMP_kPa / (3600 * eta)
    """
    if flow_m3_h <= 0.001:
        return {"p_hyd_kw": 0.0, "p_elec_kw": 0.0, "sec_kwh_m3": 0.0}

    p_hyd_kw = (flow_m3_h * tmp_kpa) / 3600.0
    eta = max(0.1, min(1.0, pump_efficiency))
    p_elec_kw = p_hyd_kw / eta
    sec_kwh_m3 = p_elec_kw / flow_m3_h

    return {
        "p_hyd_kw": round(p_hyd_kw, 3),
        "p_elec_kw": round(p_elec_kw, 3),
        "sec_kwh_m3": round(sec_kwh_m3, 5),
    }


def simulate_was_srt_sensitivity(
    total_biomass_kg: float = 28080.0,
    was_rates_m3_d: List[float] = None,
    mlss_was_mg_l: float = 7100.0,
    effluent_flow_m3_d: float = 11059.2,
    effluent_tss_mg_l: float = 1.5,
) -> List[Dict[str, Any]]:
    """
    Evaluates continuous biological SRT across a sweep of daily sludge wastage rates.
    """
    if was_rates_m3_d is None:
        was_rates_m3_d = [0.0, 20.0, 35.0, 50.0, 60.0, 100.0, 150.0, 250.0, 270.0]

    sweep_results = []
    for was_m3_d in was_rates_m3_d:
        srt = calculate_solids_retention_time(
            total_biomass_kg=total_biomass_kg,
            was_flow_m3_d=was_m3_d,
            mlss_was_mg_l=mlss_was_mg_l,
            effluent_flow_m3_d=effluent_flow_m3_d,
            effluent_tss_mg_l=effluent_tss_mg_l,
        )
        washout = srt < 12.0
        sweep_results.append({
            "was_flow_m3_d": was_m3_d,
            "srt_days": round(srt, 1),
            "nitrification_washout": washout,
            "status": "CRITICAL_WASHOUT" if washout else ("WARNING" if srt < 15.0 else "SAFE"),
        })

    return sweep_results


def simulate_compound_stress(
    total_flow_m3_h: float = 530.0,  # +15% storm surge
    active_trains: int = 3,          # N-1 outage
    cold_temp_c: float = 8.0,        # Winter freeze
    base_temp_c: float = 18.5,
    base_tmp_kpa: float = 19.5667,
    base_flux_lmh: float = 24.0,
    beta_compaction: float = 1.40,
) -> Dict[str, Any]:
    """
    Compound multi-variable extreme operational stress test:
    Simultaneous 3-Train outage + 8°C cold weather + 15% influent surge.
    """
    active_area = active_trains * 4800.0
    compound_flux = (total_flow_m3_h * 1000.0) / active_area
    flux_ratio = compound_flux / base_flux_lmh

    # Viscosity ratio
    mu_cold = calculate_water_viscosity(cold_temp_c)
    mu_base = calculate_water_viscosity(base_temp_c)
    visc_ratio = mu_cold / mu_base

    # Compound TMP with non-linear cake compaction and cold viscosity
    compound_tmp = base_tmp_kpa * math_pow_safe(flux_ratio, beta_compaction) * visc_ratio

    severity = "NORMAL"
    if compound_tmp >= 45.0:
        severity = "CRITICAL"
    elif compound_tmp >= 35.0:
        severity = "WARNING"

    return {
        "compound_flux_lmh": round(compound_flux, 2),
        "viscosity_cold_mpa_s": round(mu_cold, 4),
        "viscosity_drag_ratio": round(visc_ratio, 3),
        "compound_tmp_kpa": round(compound_tmp, 2),
        "severity": severity,
        "interlock_triggered": compound_tmp >= 45.0,
    }


@dataclass
class WhatIfSimulationResult:
    outage: Dict[str, Any]
    bottleneck: Dict[str, Any]
    pump_power: Dict[str, float]
    compound: Dict[str, Any]
    was_sensitivity: List[Dict[str, Any]]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "outage": self.outage,
            "bottleneck": self.bottleneck,
            "pump_power": self.pump_power,
            "compound": self.compound,
            "was_sensitivity": self.was_sensitivity,
        }
