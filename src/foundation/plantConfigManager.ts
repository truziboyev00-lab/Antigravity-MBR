/**
 * MBR SUPER EXPERT v1.1 — UNIVERSAL PLANT CONFIGURATION MANAGER
 * Created by Turgunjon Ruziboyev
 * 
 * Single Source of Truth Manager for multi-plant configurations.
 * Enforces canonical T01–T07 train identification and dynamic active-train filtering.
 */

import plantConfigJson from './plant_config.json';
import plantProfilesJson from './plant_profiles.json';
import { 
  CanonicalTrainId, 
  TrainConfig, 
  TrainOperatingStatus,
  ConfigurationCompletenessReport
} from './types';

export const CANONICAL_TRAIN_IDS: CanonicalTrainId[] = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07'];

export class PlantConfigurationManager {
  private currentConfig: any;

  constructor(initialConfig?: any) {
    this.currentConfig = initialConfig || plantConfigJson;
  }

  /**
   * Load an external or synthetic plant profile without any source code changes.
   */
  public loadProfile(profileKey: 'DEFAULT' | 'PROFILE_A_3_TRAINS' | 'PROFILE_B_4_TRAINS' | 'PROFILE_C_7_TRAINS' | any) {
    if (profileKey === 'DEFAULT') {
      this.currentConfig = plantConfigJson;
    } else if (typeof profileKey === 'string' && (plantProfilesJson as any)[profileKey]) {
      this.currentConfig = (plantProfilesJson as any)[profileKey];
    } else if (typeof profileKey === 'object') {
      this.currentConfig = profileKey;
    }
  }

  public loadConfig(config: any): void {
    if (typeof config === 'string') {
      this.loadProfile(config);
    } else if (config) {
      this.currentConfig = config;
    }
  }

  public resetToDefault(): void {
    this.currentConfig = plantConfigJson;
  }

  public getPlantName(): string {
    return this.currentConfig.plantIdentity?.plantName?.value || 
           this.currentConfig.plantIdentity?.plantName || 
           'Industrial MBR Facility';
  }

  public getSiteId(): string {
    return this.currentConfig.plantIdentity?.siteId?.value || 
           this.currentConfig.plantIdentity?.siteId || 
           'SITE_DEFAULT';
  }

  public getUnitId(): string {
    return this.currentConfig.plantIdentity?.unitId?.value || 
           this.currentConfig.plantIdentity?.unitId || 
           'UNIT_01';
  }

  public getInstalledTrainCount(): number {
    return this.currentConfig.topology?.installedTrainCount || 
           this.getInstalledTrains().length;
  }

  /**
   * Returns all trains configured as installed in the facility (up to 7).
   */
  public getInstalledTrains(): TrainConfig[] {
    return (this.currentConfig.trains || []).filter((t: any) => t.installed === true);
  }

  /**
   * Returns all trains (including uninstalled T05-T07) for inspection.
   */
  public getAllTrains(): TrainConfig[] {
    return this.currentConfig.trains || [];
  }

  /**
   * Strictly returns ONLY trains that are Installed=True AND Operating_Status=ONLINE.
   * Offline, Standby, Maintenance, and Out-of-Service trains are excluded from active operational calculations.
   */
  public getActiveOnlineTrains(): TrainConfig[] {
    return (this.currentConfig.trains || []).filter(
      (t: any) => t.installed === true && t.operatingStatus === 'ONLINE'
    );
  }

  /**
   * Calculates Total Active Membrane Area dynamically:
   * Active_Membrane_Area = SUM( Membrane_Area(Txx) ) for ONLINE trains with valid data.
   * Never assumes 4800 m2 per train.
   */
  public calculateActiveMembraneArea(): number {
    const activeTrains = this.getActiveOnlineTrains();
    return activeTrains.reduce((sum: number, t: any) => sum + (Number(t.membraneAreaM2) || 0), 0);
  }

  /**
   * Returns specific train configuration by canonical ID ('T01'..'T07')
   */
  public getTrain(trainId: CanonicalTrainId): TrainConfig | undefined {
    return (this.currentConfig.trains || []).find((t: any) => t.trainId === trainId);
  }

  /**
   * Update runtime operating status for a specific train.
   */
  public setTrainOperatingStatus(trainId: CanonicalTrainId, status: TrainOperatingStatus): void {
    const train = (this.currentConfig.trains || []).find((t: any) => t.trainId === trainId);
    if (train) {
      train.operatingStatus = status;
    }
  }

  /**
   * Tag mapping lookup: plant-specific tag -> canonical engine variable
   */
  public resolveCanonicalTag(canonicalTag: string, trainId?: CanonicalTrainId): string {
    const mapping = this.currentConfig.tagMapping || {};
    if (trainId && mapping[trainId] && mapping[trainId][canonicalTag]) {
      return mapping[trainId][canonicalTag];
    }
    if (mapping.PLANT && mapping.PLANT[canonicalTag]) {
      return mapping.PLANT[canonicalTag];
    }
    return `CANONICAL.${trainId ? trainId + '.' : ''}${canonicalTag}`;
  }

  /**
   * Evaluates configuration completeness score.
   * Returns NOT_CONFIGURED when mandatory parameters are missing; never invents defaults.
   */
  public validateConfigurationCompleteness(): ConfigurationCompletenessReport {
    const missing: string[] = [];
    const assumed: string[] = [];

    const identity = this.currentConfig.plantIdentity || {};
    if (!identity.plantName) missing.push('plantIdentity.plantName');
    if (!identity.siteId) missing.push('plantIdentity.siteId');

    const installed = this.getInstalledTrains();
    if (installed.length === 0) {
      missing.push('topology.installedTrains (minimum 1 required)');
    }

    for (const t of installed) {
      if (!t.membraneAreaM2 || t.membraneAreaM2 <= 0) {
        missing.push(`trains[${t.trainId}].membraneAreaM2`);
      }
      if (t.membraneModel === 'NOT_CONFIGURED' || !t.membraneModel) {
        assumed.push(`trains[${t.trainId}].membraneModel`);
      }
    }

    const mandatoryCount = 6 + (installed.length * 2);
    const validCount = Math.max(0, mandatoryCount - missing.length);
    const score = Math.round((validCount / mandatoryCount) * 100);

    return {
      completenessScorePct: score,
      isReadyForRealPlantMode: missing.length === 0 && score >= 90,
      missingMandatoryParameters: missing,
      assumedParameters: assumed,
      activeTrainsCount: this.getActiveOnlineTrains().length,
      totalInstalledTrainsCount: installed.length,
      activeMembraneAreaM2: this.calculateActiveMembraneArea()
    };
  }

  public getRawConfig(): any {
    return this.currentConfig;
  }
}

export const plantConfigManager = new PlantConfigurationManager();
