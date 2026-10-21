"""
UNIT 77 MBR SUPER EXPERT — BIOLOGICAL MASS BALANCE & SRT ENGINE
Calculates biomass inventory, Sludge Retention Time (SRT), HRT, F:M ratio,
and nitrification washout threshold protection with zero-division safeguards.
"""

from dataclasses import dataclass
from typing import Dict, Any

from .config import PLANT_CONFIG, OPERATIONAL_LIMITS


def calculate_total_biomass_inventory(
    v_bio_m3: float = 3200.0,
    mlss_bio_mg_l: float = 8200.0,
    v_mbr_m3: float = 800.0,
    mlss_mbr_mg_l: float = 9500.0,
) -> float:
    """
    Calculates total active plant solids inventory in kilograms (kg):
    M_solids = (V_bio * MLSS_bio + V_mbr * MLSS_mbr) / 1000
    Default: (3200 * 8200 + 800 * 9500) / 1000 = 26240 + 7600 = 33840 kg
    For benchmark baseline: (3200 * 7000 + 800 * 7100) / 1000 = 28080 kg
    """
    m_bio = (max(0.0, v_bio_m3) * max(0.0, mlss_bio_mg_l)) / 1000.0
    m_mbr = (max(0.0, v_mbr_m3) * max(0.0, mlss_mbr_mg_l)) / 1000.0
    return m_bio + m_mbr


def calculate_solids_retention_time(
    total_biomass_kg: float,
    was_flow_m3_d: float,
    mlss_was_mg_l: float,
    effluent_flow_m3_d: float = 11059.2,
    effluent_tss_mg_l: float = 1.5,
) -> float:
    """
    Calculates continuous biological Solids Retention Time (SRT / sludge age) in days:
    SRT = M_total / (M_was_loss_per_day + M_effluent_loss_per_day)
    Safely clamped to prevent division by zero (returns 99999.0 days if wastage = 0).
    """
    daily_was_loss_kg = (max(0.0, was_flow_m3_d) * max(0.0, mlss_was_mg_l)) / 1000.0
    daily_eff_loss_kg = (max(0.0, effluent_flow_m3_d) * max(0.0, effluent_tss_mg_l)) / 1000.0
    total_daily_loss_kg = daily_was_loss_kg + daily_eff_loss_kg

    if total_daily_loss_kg <= 0.001:
        return 99999.0
    return total_biomass_kg / total_daily_loss_kg


def calculate_hydraulic_retention_time(
    total_volume_m3: float = 4000.0,
    influent_flow_m3_h: float = 460.8,
) -> float:
    """
    Calculates plant Hydraulic Retention Time (HRT) in hours:
    HRT = V_total / Q_inf
    """
    if influent_flow_m3_h <= 0.001:
        return 999.0
    return max(0.0, total_volume_m3) / influent_flow_m3_h


def calculate_fm_ratio(
    influent_flow_m3_d: float,
    influent_bod_mg_l: float,
    v_bio_m3: float,
    mlss_bio_mg_l: float,
) -> float:
    """
    Calculates Food-to-Microorganism ratio (F:M) in kg BOD / (kg MLSS * day):
    F:M = (Q_inf * BOD_in) / (V_bio * MLSS_bio)
    """
    bod_load_kg_d = (max(0.0, influent_flow_m3_d) * max(0.0, influent_bod_mg_l)) / 1000.0
    biomass_inventory_kg = (max(0.0, v_bio_m3) * max(0.0, mlss_bio_mg_l)) / 1000.0

    if biomass_inventory_kg <= 0.001:
        return 0.0
    return bod_load_kg_d / biomass_inventory_kg


def calculate_volumetric_loading_rate(
    influent_flow_m3_d: float,
    influent_bod_mg_l: float,
    total_volume_m3: float = 4000.0,
) -> float:
    """
    Calculates Volumetric BOD Loading Rate in kg BOD / (m^3 * day):
    VLR = (Q_inf * BOD_in) / (V_total * 1000)
    """
    if total_volume_m3 <= 0.001:
        return 0.0
    bod_load_kg_d = (max(0.0, influent_flow_m3_d) * max(0.0, influent_bod_mg_l)) / 1000.0
    return bod_load_kg_d / total_volume_m3


def check_nitrification_washout_risk(
    srt_days: float,
    min_safe_srt_days: float = 12.0,
) -> Dict[str, Any]:
    """
    Evaluates critical nitrification bacteria (AOB/NOB) washout safety threshold.
    Returns status: SAFE, WARNING, or WASHOUT_CRITICAL.
    """
    if srt_days < min_safe_srt_days:
        return {
            "washout_risk": True,
            "status": "WASHOUT_CRITICAL",
            "message": f"CRITICAL: Sludge Age ({srt_days:.1f} d) is below minimum nitrification limit ({min_safe_srt_days:.1f} d). Autotrophic nitrifiers risk complete biological washout!",
            "action": "Immediately reduce or halt Waste Activated Sludge (WAS) pumping to restore inventory.",
        }
    elif srt_days < (min_safe_srt_days + 3.0):
        return {
            "washout_risk": False,
            "status": "WARNING",
            "message": f"WARNING: Sludge Age ({srt_days:.1f} d) approaching lower nitrification boundary ({min_safe_srt_days:.1f} d).",
            "action": "Throttle WAS pumping rate by 15-25%.",
        }
    else:
        return {
            "washout_risk": False,
            "status": "SAFE",
            "message": f"NORMAL: Biological SRT ({srt_days:.1f} d) is healthy for complete autotrophic nitrification.",
            "action": "Maintain routine wastage schedule.",
        }


@dataclass
class BiologicalState:
    total_biomass_kg: float
    srt_days: float
    hrt_hours: float
    fm_ratio: float
    volumetric_loading_rate: float
    was_flow_m3_d: float
    washout_status: str
    washout_risk: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_biomass_kg": round(self.total_biomass_kg, 1),
            "srt_days": round(self.srt_days, 1),
            "hrt_hours": round(self.hrt_hours, 2),
            "fm_ratio": round(self.fm_ratio, 3),
            "volumetric_loading_rate": round(self.volumetric_loading_rate, 3),
            "was_flow_m3_d": round(self.was_flow_m3_d, 1),
            "washout_status": self.washout_status,
            "washout_risk": self.washout_risk,
        }


def evaluate_biological_state(
    v_bio_m3: float = 3200.0,
    mlss_bio_mg_l: float = 8200.0,
    v_mbr_m3: float = 800.0,
    mlss_mbr_mg_l: float = 9500.0,
    was_flow_m3_d: float = 35.0,
    influent_flow_m3_h: float = 460.8,
    influent_bod_mg_l: float = 240.0,
    effluent_tss_mg_l: float = 1.5,
) -> BiologicalState:
    """
    Evaluates complete biological process state for Unit 77 MBR bioreactor.
    """
    total_bio = calculate_total_biomass_inventory(v_bio_m3, mlss_bio_mg_l, v_mbr_m3, mlss_mbr_mg_l)
    daily_inf_flow = influent_flow_m3_h * 24.0
    daily_eff_flow = daily_inf_flow - was_flow_m3_d
    srt = calculate_solids_retention_time(total_bio, was_flow_m3_d, mlss_mbr_mg_l, daily_eff_flow, effluent_tss_mg_l)
    hrt = calculate_hydraulic_retention_time(v_bio_m3 + v_mbr_m3, influent_flow_m3_h)
    fm = calculate_fm_ratio(daily_inf_flow, influent_bod_mg_l, v_bio_m3, mlss_bio_mg_l)
    vlr = calculate_volumetric_loading_rate(daily_inf_flow, influent_bod_mg_l, v_bio_m3 + v_mbr_m3)
    washout = check_nitrification_washout_risk(srt)

    return BiologicalState(
        total_biomass_kg=total_bio,
        srt_days=srt,
        hrt_hours=hrt,
        fm_ratio=fm,
        volumetric_loading_rate=vlr,
        was_flow_m3_d=was_flow_m3_d,
        washout_status=washout["status"],
        washout_risk=washout["washout_risk"],
    )
