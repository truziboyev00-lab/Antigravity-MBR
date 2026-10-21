"""
UNIT 77 MBR SUPER EXPERT — MODULAR PYTHON ENGINE FOUNDATION
Stage 10: Full Super Expert Integration, Multi-Domain Reasoning Chain, Physics Hypotheses, Prescriptive Operator Actions, and Excel Hybrid Decision Support

Author: Turgunjon Ruziboyev
Version: 1.0.0
Specification: Master Prompt V2.0 (Stage 10)
"""

__version__ = "1.0.0"
__author__ = "Turgunjon Ruziboyev"
__stage__ = "STAGE 10 — FULL SUPER EXPERT INTEGRATION"

from .config import (
    PLANT_CONFIG,
    TRAINS_CONFIG,
    PHYSICAL_CONSTANTS,
    OPERATIONAL_LIMITS,
    DEFAULT_TELEMETRY,
)

from .hydraulics import (
    calculate_water_viscosity,
    calculate_gross_flux,
    calculate_net_flux,
    calculate_permeability,
    calculate_normalized_permeability,
    calculate_darcy_total_resistance,
    calculate_clean_membrane_resistance,
    calculate_cake_layer_resistance,
    calculate_specific_cake_resistance,
    calculate_compaction_exponent,
    HydraulicState,
)

from .biological import (
    calculate_total_biomass_inventory,
    calculate_solids_retention_time,
    calculate_hydraulic_retention_time,
    calculate_fm_ratio,
    calculate_volumetric_loading_rate,
    check_nitrification_washout_risk,
    BiologicalState,
)

from .alarms import (
    HysteresisAlarm,
    PersistenceAlarm,
    calculate_rate_of_change,
    calculate_peer_z_scores,
    calculate_multi_risk_index,
    diagnose_root_cause,
    AlarmSeverity,
    AlarmState,
)

from .whatif import (
    simulate_train_outage,
    simulate_nonlinear_tmp,
    solve_sustainable_plant_flow,
    calculate_permeate_pump_power,
    simulate_was_srt_sensitivity,
    simulate_compound_stress,
    WhatIfSimulationResult,
)

from .prediction import (
    project_linear_forecast,
    project_exponential_forecast,
    calculate_remaining_useful_life,
    classify_operational_urgency,
    generate_prescriptive_cleaning_plan,
    PredictionResult,
)

from .calibration import (
    calibrate_clean_resistance,
    calibrate_cake_resistance_and_compaction,
    perform_ols_regression,
    calibrate_all_parameters,
    CalibrationReport,
)

from .analytics import (
    TheilSenResult,
    theil_sen_estimator,
    HampelResult,
    hampel_filter,
    detect_flatlines,
    SensorQualityReport,
    evaluate_sensor_health,
    PCAModel,
    HotellingResult,
    fit_pca_model,
    evaluate_hotelling_t2,
    IsolationForest,
    IsolationForestResult,
    evaluate_isolation_forest,
    SHAPFeatureContribution,
    SHAPAttributionReport,
    compute_shap_attributions,
    Stage8AnalyticsReport,
    run_stage8_analytics_pipeline,
)

from .workbook_bridge import (
    audit_excel_workbook,
    generate_python_output_payload,
    compare_python_vs_excel,
)

from .hybrid_bridge import (
    BridgeHeartbeat,
    MetricParityCheck,
    TwoWayValidationReport,
    HybridSyncResult,
    HybridBridgeManager,
    hybrid_bridge,
)

from .super_expert import (
    SuperExpertDiagnosis,
    SuperExpertEngine,
    super_expert_engine,
)

from .stress_testing import (
    StressScenarioResult,
    Stage11StressReport,
    Stage11StressEngine,
    stage11_stress_engine,
)

__all__ = [
    "StressScenarioResult",
    "Stage11StressReport",
    "Stage11StressEngine",
    "stage11_stress_engine",
    "SuperExpertDiagnosis",
    "SuperExpertEngine",
    "super_expert_engine",
    "BridgeHeartbeat",
    "MetricParityCheck",
    "TwoWayValidationReport",
    "HybridSyncResult",
    "HybridBridgeManager",
    "hybrid_bridge",
    "PLANT_CONFIG",
    "TRAINS_CONFIG",
    "PHYSICAL_CONSTANTS",
    "OPERATIONAL_LIMITS",
    "DEFAULT_TELEMETRY",
    "TheilSenResult",
    "theil_sen_estimator",
    "HampelResult",
    "hampel_filter",
    "detect_flatlines",
    "SensorQualityReport",
    "evaluate_sensor_health",
    "PCAModel",
    "HotellingResult",
    "fit_pca_model",
    "evaluate_hotelling_t2",
    "IsolationForest",
    "IsolationForestResult",
    "evaluate_isolation_forest",
    "SHAPFeatureContribution",
    "SHAPAttributionReport",
    "compute_shap_attributions",
    "Stage8AnalyticsReport",
    "run_stage8_analytics_pipeline",
    "calculate_water_viscosity",
    "calculate_gross_flux",
    "calculate_net_flux",
    "calculate_permeability",
    "calculate_normalized_permeability",
    "calculate_darcy_total_resistance",
    "calculate_clean_membrane_resistance",
    "calculate_cake_layer_resistance",
    "calculate_specific_cake_resistance",
    "calculate_compaction_exponent",
    "HydraulicState",
    "calculate_total_biomass_inventory",
    "calculate_solids_retention_time",
    "calculate_hydraulic_retention_time",
    "calculate_fm_ratio",
    "calculate_volumetric_loading_rate",
    "check_nitrification_washout_risk",
    "BiologicalState",
    "HysteresisAlarm",
    "PersistenceAlarm",
    "calculate_rate_of_change",
    "calculate_peer_z_scores",
    "calculate_multi_risk_index",
    "diagnose_root_cause",
    "AlarmSeverity",
    "AlarmState",
    "simulate_train_outage",
    "simulate_nonlinear_tmp",
    "solve_sustainable_plant_flow",
    "calculate_permeate_pump_power",
    "simulate_was_srt_sensitivity",
    "simulate_compound_stress",
    "WhatIfSimulationResult",
    "project_linear_forecast",
    "project_exponential_forecast",
    "calculate_remaining_useful_life",
    "classify_operational_urgency",
    "generate_prescriptive_cleaning_plan",
    "PredictionResult",
    "calibrate_clean_resistance",
    "calibrate_cake_resistance_and_compaction",
    "perform_ols_regression",
    "calibrate_all_parameters",
    "CalibrationReport",
    "audit_excel_workbook",
    "generate_python_output_payload",
    "compare_python_vs_excel",
]
