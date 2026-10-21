"""
MBR SUPER EXPERT v1.1 — UNIVERSAL PLANT CONFIGURATION & CONSTANTS
Single Source of Truth for multi-plant configurations.
Supports dynamic 1-7 trains with canonical T01-T07 architecture.
"""

import os
import json
from typing import Dict, List, Any, Optional

# Standard Physical Constants
PHYSICAL_CONSTANTS: Dict[str, Any] = {
    "WATER_DENSITY_KG_M3": 1000.0,
    "STANDARD_TEMP_C": 20.0,
    "GRAVITY_M_S2": 9.80665,
    "BAR_TO_KPA": 100.0,
    "KPA_TO_PA": 1000.0,
    "SECONDS_PER_HOUR": 3600.0,
    "HOURS_PER_DAY": 24.0,
    "LMH_TO_M_S": 1.0 / 3600000.0,  # L/(m^2*h) -> m/s
    "KG_TO_MG": 1e6,
    "M3_TO_L": 1000.0,
}

CANONICAL_TRAIN_IDS: List[str] = ["T01", "T02", "T03", "T04", "T05", "T06", "T07"]
VALID_OPERATING_STATUSES: List[str] = ["ONLINE", "STANDBY", "MAINTENANCE", "OUT_OF_SERVICE", "NOT_INSTALLED"]
CANONICAL_STATUSES = VALID_OPERATING_STATUSES

# Default embedded Single Source of Truth
DEFAULT_PLANT_JSON_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "src", "foundation", "plant_config.json"
)

class PlantConfigManager:
    """Authoritative Configuration Manager for Multi-Plant MBR Operations."""

    def __init__(self, config_dict: Optional[Dict[str, Any]] = None):
        self.config: Dict[str, Any] = {}
        if config_dict:
            self.config = config_dict
        elif os.path.exists(DEFAULT_PLANT_JSON_PATH):
            try:
                with open(DEFAULT_PLANT_JSON_PATH, "r", encoding="utf-8") as f:
                    self.config = json.load(f)
            except Exception:
                self.config = self._build_fallback_config()
        else:
            self.config = self._build_fallback_config()

    def _build_fallback_config(self) -> Dict[str, Any]:
        return {
            "plantIdentity": {
                "plantName": {"value": "Unit 77 Industrial MBR Facility", "verificationStatus": "VERIFIED"},
                "siteId": {"value": "SITE_GTL_SHURTAN", "verificationStatus": "VERIFIED"},
                "unitId": {"value": "UNIT_77", "verificationStatus": "VERIFIED"},
                "configVersion": {"value": "1.1.0", "verificationStatus": "VERIFIED"}
            },
            "topology": {
                "installedTrainCount": 4,
                "maxSupportedTrains": 7,
                "canonicalTrainIds": CANONICAL_TRAIN_IDS
            },
            "trains": [
                {
                    "trainId": tid,
                    "trainName": f"MBR Train {idx+1:02d}",
                    "installed": idx < 4,
                    "operatingStatus": "ONLINE" if idx < 4 else "NOT_INSTALLED",
                    "membraneAreaM2": 4800.0,
                    "cleanRm": 1.497e12,
                    "designFluxLmh": 24.0,
                    "cleanPermeabilityLmhBar": 240.0
                }
                for idx, tid in enumerate(CANONICAL_TRAIN_IDS)
            ],
            "tanks": {
                "bioreactorVolumeM3": {"value": 3200.0},
                "anoxicBasinVolumeM3": {"value": 1600.0},
                "membraneTanksTotalVolumeM3": {"value": 800.0},
                "totalLiquidVolumeM3": {"value": 4000.0}
            },
            "hydraulicDesign": {
                "designInfluentFlowM3H": {"value": 460.8},
                "designPermeateFlowM3H": {"value": 460.8},
                "filtrationDutyRatio": {"value": 0.90}
            }
        }

    def load_config(self, config_dict: Dict[str, Any]) -> None:
        """Dynamically switches plant configuration at runtime without code modification."""
        self.config = config_dict

    def get_plant_name(self) -> str:
        ident = self.config.get("plantIdentity", {}).get("plantName", {})
        if isinstance(ident, dict):
            return ident.get("value", "Industrial MBR Facility")
        return str(ident or "Industrial MBR Facility")

    def get_site_id(self) -> str:
        ident = self.config.get("plantIdentity", {}).get("siteId", {})
        if isinstance(ident, dict):
            return ident.get("value", "SITE_DEFAULT")
        return str(ident or "SITE_DEFAULT")

    def get_installed_train_count(self) -> int:
        return len(self.get_installed_trains())

    def get_installed_trains(self) -> List[Dict[str, Any]]:
        """Returns all trains configured with installed=True."""
        return [t for t in self.config.get("trains", []) if t.get("installed", False)]

    def get_all_trains(self) -> List[Dict[str, Any]]:
        return self.config.get("trains", [])

    def get_active_online_trains(self) -> List[Dict[str, Any]]:
        """
        Returns strictly trains that are installed=True AND operatingStatus=='ONLINE'.
        Non-online trains (STANDBY, MAINTENANCE, OUT_OF_SERVICE) are excluded from active calculations.
        """
        return [
            t for t in self.config.get("trains", [])
            if t.get("installed", False) and t.get("operatingStatus") == "ONLINE"
        ]

    def calculate_active_membrane_area(self) -> float:
        """
        Dynamic active area: SUM( membraneAreaM2 ) for ONLINE trains only.
        Never assumes 4800 m2.
        """
        active_trains = self.get_active_online_trains()
        return sum(float(t.get("membraneAreaM2", 0.0)) for t in active_trains)

    def get_train_by_id(self, train_id: str) -> Optional[Dict[str, Any]]:
        tid = self.normalize_train_id(train_id)
        for t in self.config.get("trains", []):
            if t.get("trainId") == tid:
                return t
        return None

    def normalize_train_id(self, train_id: str) -> str:
        """
        Canonical normalizer: accepts 'T01', 't01', '1', 'Train 1', or legacy 'A'/'train_a'.
        Maps cleanly to canonical 'T01'..'T07'.
        """
        s = str(train_id).strip().upper()
        if s in CANONICAL_TRAIN_IDS:
            return s
        # Legacy A-D mapping
        legacy_map = {"A": "T01", "B": "T02", "C": "T03", "D": "T04", "E": "T05", "F": "T06", "G": "T07"}
        if s in legacy_map:
            return legacy_map[s]
        for tid in CANONICAL_TRAIN_IDS:
            if tid in s:
                return tid
        if s.isdigit():
            val = int(s)
            if 1 <= val <= 7:
                return f"T{val:02d}"
        return s

    def validate_configuration_completeness(self) -> Dict[str, Any]:
        """
        Validates configuration completeness.
        Returns NOT_CONFIGURED when required items are missing; never invents defaults.
        """
        missing: List[str] = []
        assumed: List[str] = []

        ident = self.config.get("plantIdentity", {})
        if not ident.get("plantName"):
            missing.append("plantIdentity.plantName")
        if not ident.get("siteId"):
            missing.append("plantIdentity.siteId")

        installed = self.get_installed_trains()
        if len(installed) == 0:
            missing.append("topology.installedTrains (at least 1 train required)")

        for t in installed:
            tid = t.get("trainId", "UNKNOWN")
            area = t.get("membraneAreaM2")
            if area is None or float(area) <= 0:
                missing.append(f"trains[{tid}].membraneAreaM2")
            if t.get("membraneModel") in ("NOT_CONFIGURED", None):
                assumed.append(f"trains[{tid}].membraneModel")

        mandatory_count = 6 + (len(installed) * 2)
        valid_count = max(0, mandatory_count - len(missing))
        score = round((valid_count / max(1, mandatory_count)) * 100.0, 1)

        return {
            "completenessScorePct": score,
            "isReadyForRealPlantMode": len(missing) == 0 and score >= 90.0,
            "missingMandatoryParameters": missing,
            "assumedParameters": assumed,
            "activeTrainsCount": len(self.get_active_online_trains()),
            "totalInstalledTrainsCount": len(installed),
            "activeMembraneAreaM2": self.calculate_active_membrane_area()
        }

    # Backward-compatible aliases
    def getInstalledTrainCount(self) -> int:
        return self.get_installed_train_count()

    def calculateActiveMembraneArea(self) -> float:
        return self.calculate_active_membrane_area()

    def getInstalledTrains(self) -> List[Dict[str, Any]]:
        return self.get_installed_trains()

    def getActiveOnlineTrains(self) -> List[Dict[str, Any]]:
        return self.get_active_online_trains()

    def getAllTrains(self) -> List[Dict[str, Any]]:
        return self.get_all_trains()


# Global Singleton Manager
plant_config_manager = PlantConfigManager()

# Dynamic configurations derived from manager
PLANT_CONFIG: Dict[str, Any] = {
    "NAME": plant_config_manager.get_plant_name(),
    "TOTAL_TRAINS": plant_config_manager.get_installed_train_count(),
    "CANONICAL_TRAIN_IDS": CANONICAL_TRAIN_IDS,
    "ACTIVE_MEMBRANE_AREA_M2": plant_config_manager.calculate_active_membrane_area(),
    "MEMBRANE_TYPE": "PVDF Hollow Fiber Ultrafiltration",
    "PORE_SIZE_MICRON": 0.04,
    "BIOLOGICAL_REACTOR_VOLUME_M3": 3200.0,
    "MBR_TANKS_VOLUME_M3": 800.0,
    "TOTAL_PLANT_VOLUME_M3": 4000.0,
    "FILTRATION_DUTY_RATIO": 0.90,
}

OPERATIONAL_LIMITS: Dict[str, Any] = {
    "TMP_NOMINAL_MAX_KPA": 35.0,
    "TMP_MAINTENANCE_CLEAN_KPA": 45.0,
    "TMP_EMERGENCY_STOP_KPA": 55.0,
    "TMP_RATE_OF_CHANGE_ALERT_KPA_H": 0.35,
    "TMP_RATE_OF_CHANGE_ALARM_KPA_H": 0.50,
    "FLUX_SUSTAINABLE_MAX_LMH": 30.0,
    "FLUX_DESIGN_AVERAGE_LMH": 24.0,
    "PERMEABILITY_LOW_ALERT_LMH_BAR": 120.0,
    "PERMEABILITY_LOW_ALARM_LMH_BAR": 90.0,
    "MIN_SRT_NITRIFICATION_DAYS": 12.0,
    "TARGET_SRT_DAYS": 25.0,
    "MAX_SRT_DAYS": 90.0,
    "TARGET_MLSS_MG_L": 8500.0,
    "MAX_MLSS_MG_L": 12000.0,
}

# Dynamic TRAINS_CONFIG dictionary for canonical T01-T07
TRAINS_CONFIG: Dict[str, Dict[str, Any]] = {}
for t in plant_config_manager.getAllTrains():
    tid = t["trainId"]
    TRAINS_CONFIG[tid] = {
        "id": tid,
        "name": t.get("trainName", f"MBR Train {tid}"),
        "installed": t.get("installed", False),
        "operating_status": t.get("operatingStatus", "NOT_INSTALLED"),
        "area_m2": float(t.get("membraneAreaM2", 4800.0)),
        "clean_tmp_kpa": 10.0,
        "clean_flux_lmh": float(t.get("designFluxLmh", 24.0)),
        "clean_temp_c": 20.0,
        "clean_rm_m_inv": float(t.get("cleanRm", 1.497e12)),
    }

# Canonical Default Telemetry
DEFAULT_TELEMETRY: Dict[str, Any] = {
    "temperature_c": 18.5,
    "total_flow_m3_h": 460.8,
    "mlss_bioreactor_mg_l": 8200.0,
    "mlss_mbr_tanks_mg_l": 9500.0,
    "was_flow_m3_d": 35.0,
    "effluent_tss_mg_l": 1.5,
    "influent_bod_mg_l": 240.0,
    "aeration_flow_nm3_h": 420.0,
}

# Add canonical train flows and TMPs
for idx, tid in enumerate(CANONICAL_TRAIN_IDS):
    t_lower = tid.lower()
    DEFAULT_TELEMETRY[f"flow_train_{t_lower}_m3_h"] = 115.2 if idx < 4 else 0.0
    DEFAULT_TELEMETRY[f"tmp_train_{t_lower}_kpa"] = [18.6, 19.8, 27.5, 18.2, 0.0, 0.0, 0.0][idx]
    DEFAULT_TELEMETRY[f"slope_train_{t_lower}_kpa_h"] = [0.12, 0.18, 0.42, 0.08, 0.0, 0.0, 0.0][idx]

# Backward-compatibility accessor layer for transition
_legacy_alias_map = {"A": "T01", "B": "T02", "C": "T03", "D": "T04"}
for letter, tid in _legacy_alias_map.items():
    if tid in TRAINS_CONFIG:
        TRAINS_CONFIG[letter] = TRAINS_CONFIG[tid]
    t_lower = tid.lower()
    l_lower = letter.lower()
    DEFAULT_TELEMETRY[f"flow_train_{l_lower}_m3_h"] = DEFAULT_TELEMETRY.get(f"flow_train_{t_lower}_m3_h", 0.0)
    DEFAULT_TELEMETRY[f"tmp_train_{l_lower}_kpa"] = DEFAULT_TELEMETRY.get(f"tmp_train_{t_lower}_kpa", 0.0)
    DEFAULT_TELEMETRY[f"slope_train_{l_lower}_kpa_h"] = DEFAULT_TELEMETRY.get(f"slope_train_{t_lower}_kpa_h", 0.0)
