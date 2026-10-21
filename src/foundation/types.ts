/**
 * UNIT 77 MBR SUPER EXPERT — ENGINEERING FOUNDATION TYPES
 * Created by Turgunjon Ruziboyev
 * 
 * Stage 1 Data Model & Types Definition
 */

export type DataCategory = 'HYDRAULICS' | 'MEMBRANE_PHYSICS' | 'BIOLOGY' | 'AERATION' | 'CLEANING' | 'EQUIPMENT' | 'WATER_QUALITY';

export type MeasurementType = 'MEASURED' | 'CALCULATED' | 'ESTIMATED' | 'SIMULATED';

export type MissingDataPolicy = 
  | 'HOLD_LAST_VALID' 
  | 'LINEAR_INTERPOLATE' 
  | 'FLAG_AND_OMIT' 
  | 'DEFAULT_SETTINGS' 
  | 'ERROR_OUT';

export interface ParameterDefinition {
  id: string;
  name: string;
  category: DataCategory;
  engineeringDescription: string;
  source: string; // e.g. "SCADA_FIT_7701", "CALC_FLUX", "LAB_MLSS"
  unit: string; // e.g. "LMH", "kPa", "m3/h", "LMH/bar", "mg/L", "°C"
  expectedRange: {
    min: number;
    max: number;
    typicalLow: number;
    typicalHigh: number;
  };
  required: boolean;
  type: MeasurementType;
  applicableTrain: 'PLANT' | 'TRAIN' | 'BOTH'; // dynamic: applies across trains or plant-wide
  calculationDependency: string[]; // List of parameter IDs required to compute this
  missingDataPolicy: MissingDataPolicy;
}

export interface UnitDefinition {
  unitCode: string;
  dimension: 'PRESSURE' | 'FLUX' | 'FLOW' | 'TEMPERATURE' | 'CONCENTRATION' | 'PERMEABILITY' | 'TIME' | 'RATIO' | 'ENERGY';
  baseUnit: string;
  conversionToBase: (val: number) => number;
  conversionFromBase: (val: number) => number;
  standardSymbol: string;
  description: string;
}

export type CanonicalTrainId = 'T01' | 'T02' | 'T03' | 'T04' | 'T05' | 'T06' | 'T07';

export type TrainOperatingStatus = 
  | 'ONLINE' 
  | 'STANDBY' 
  | 'MAINTENANCE' 
  | 'OUT_OF_SERVICE' 
  | 'NOT_INSTALLED';

export type ParameterVerificationStatus = 
  | 'VERIFIED'
  | 'USER_PROVIDED'
  | 'OEM_VERIFIED'
  | 'PLANT_DOCUMENT_VERIFIED'
  | 'ASSUMED'
  | 'NOT_CONFIGURED'
  | 'CONFLICT_ENGINEERING_CONFIRMATION_REQUIRED';

export interface ParameterMetadata<T = number | string> {
  value: T;
  unit: string;
  source: string;
  sourceDoc?: string;
  revision?: string;
  verificationStatus: ParameterVerificationStatus;
  lastReviewed?: string;
  comment?: string;
}

export interface TrainConfig {
  trainId: CanonicalTrainId; // Strictly canonical: "T01", "T02", ... "T07"
  trainName: string;
  installed: boolean;
  operatingStatus: TrainOperatingStatus;
  cassettesCount?: number;
  modulesPerCassette?: number;
  membraneAreaPerModule?: number; // m2
  membraneAreaM2: number; // m2 per train (dynamic, not hardcoded)
  tankVolumeM3?: number; // m3
  cleanRm?: number; // m^-1
  cleanPermeabilityLmhBar?: number; // LMH/bar
  designFluxLmh: number; // LMH (L/m2/h)
  maxDesignFluxLmh?: number; // LMH
  membraneModel?: string;
  membraneManufacturer?: string;
  installDate?: string;
  lastCleanDate?: string;
  cleanCyclesCount?: number;
}

export interface PlantConfig {
  plantName: string;
  siteId: string;
  unitTag: string; // e.g. "UNIT 77", "UNIT 03"
  configId: string;
  configVersion: string;
  processType: string;
  installedTrainCount: number; // 1 to 7
  trains: TrainConfig[];
  aerobicTankVolumeTotal: number; // m3
  anoxicTankVolumeTotal: number; // m3
  membraneTankVolumeTotal: number; // m3
  temperatureRef: number; // 20.0 °C
  waterDensity: number; // 1000 kg/m3
  viscosityWater20C: number; // 1.002 mPa.s (cP)
  tempCorrectionCoeff: number; // 1.025 or Arrhenius
}

export interface ConfigurationCompletenessReport {
  completenessScorePct: number; // 0 to 100%
  isReadyForRealPlantMode: boolean; // >= 90% and 0 missing mandatory
  missingMandatoryParameters: string[];
  assumedParameters: string[];
  activeTrainsCount: number;
  totalInstalledTrainsCount: number;
  activeMembraneAreaM2: number;
}

export type DataQualityFlag = 
  | 'GOOD'          // Valid sensor reading within bounds
  | 'UNCERTAIN'     // Minor drift or noisy, but usable
  | 'BAD'           // Out of physical bounds or hardware fault
  | 'MISSING'       // Sensor disconnected / NaN / null
  | 'FLATLINE'      // Zero variation over extended window
  | 'OUTLIER'       // Exceeds statistical Hampel / 3-sigma bound
  | 'ESTIMATED'     // Imputed or soft-sensed
  | 'CALCULATED';   // Derived via physics formula

export type AlarmSeverity = 
  | 'NORMAL' 
  | 'WATCH' 
  | 'WARNING' 
  | 'HIGH' 
  | 'CRITICAL' 
  | 'RECOVERY';

export interface AlarmDefinition {
  alarmCode: string;
  parameterId: string;
  applicableTrain: 'PLANT' | 'TRAIN' | 'BOTH';
  description: string;
  severity: AlarmSeverity;
  threshold: number;
  operator: '>' | '<' | '>=' | '<=' | 'RATE_EXCEEDS' | 'STUCK';
  persistenceSeconds: number; // Must sustain for N seconds
  deadbandHysteresis: number; // Return-to-normal hysteresis band
  actionRecommendation: string;
}

export interface CleaningEventRecord {
  id: string;
  trainId: string;
  timestampStart: string;
  timestampEnd: string;
  type: 'RELAXATION' | 'BACKPULSE' | 'MAINTENANCE_CLEAN_NAOCL' | 'MAINTENANCE_CLEAN_CITRIC' | 'CIP_RECOVERY';
  durationMinutes: number;
  chemicalUsed?: 'NaOCl' | 'Citric_Acid' | 'Oxalic_Acid' | 'NaOH' | 'None';
  chemicalConcentrationPpm?: number;
  tmpPreCleanKPa: number;
  tmpPostCleanKPa: number;
  permeabilityPreCleanLMHbar: number;
  permeabilityPostCleanLMHbar: number;
  cleanWaterPermeabilityRecoveryPct: number;
  operatorNotes?: string;
}
