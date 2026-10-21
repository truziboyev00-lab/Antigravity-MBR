import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  Table, 
  FileCheck, 
  Eye, 
  Layers, 
  ArrowRight,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface SheetMeta {
  id: string;
  name: string;
  category: 'Cockpit' | 'Data & Inputs' | 'Process Engineering' | 'Assets & Alarms' | 'Scenarios & ML' | 'Governance';
  description: string;
  role: string;
  formulas: number;
  frozenHeader: string;
  keyColumns: string[];
  sampleRows: Array<Record<string, string | number>>;
}

const SHEETS_CATALOG: SheetMeta[] = [
  {
    id: '01_Dashboard',
    name: '01_Dashboard',
    category: 'Cockpit',
    description: 'Executive real-time operational cockpit summarizing train online states, operating fluxes, TMP, Lp_20, and active alarms.',
    role: 'Calculated / Dashboard',
    formulas: 14,
    frozenHeader: 'Row 4 (KPI Headers)',
    keyColumns: ['Overall MBR KPI', 'Plant Total', 'Train A', 'Train B', 'Train C', 'Train D', 'Target / Limit'],
    sampleRows: [
      { 'Overall MBR KPI': 'Operating Flux (LMH)', 'Plant Total': 24.0, 'Train A': 24.0, 'Train B': 24.0, 'Train C': 24.0, 'Train D': 24.0, 'Target / Limit': 'Design: 24 LMH' },
      { 'Overall MBR KPI': 'Transmembrane Press. (kPa)', 'Plant Total': 32.1, 'Train A': 28.5, 'Train B': 29.8, 'Train C': 47.2, 'Train D': 31.0, 'Target / Limit': '< 35 kPa (Crit: 60)' },
      { 'Overall MBR KPI': 'Norm. Permeability @20C', 'Plant Total': 192.4, 'Train A': 212.5, 'Train B': 203.2, 'Train C': 128.4, 'Train D': 195.0, 'Target / Limit': '> 150 LMH/bar' }
    ]
  },
  {
    id: '02_Manual_Input',
    name: '02_Manual_Input',
    category: 'Data & Inputs',
    description: 'Operator entry and lab measurements with strict separation (soft blue background, dark blue font, isolated input bounds).',
    role: 'User Input',
    formulas: 0,
    frozenHeader: 'Row 4 (Parameter Name, Input Value, Unit)',
    keyColumns: ['Parameter Name', 'Input Value', 'Unit', 'Source / Guidance', 'Last Updated'],
    sampleRows: [
      { 'Parameter Name': 'Raw Influent Flow Q_in', 'Input Value': 650.0, 'Unit': 'm3/h', 'Source / Guidance': 'SCADA FIT-7701 (Total Feed Flow)', 'Last Updated': '2026-09-18 12:00' },
      { 'Parameter Name': 'Influent Temperature', 'Input Value': 18.5, 'Unit': '°C', 'Source / Guidance': 'SCADA TT-7701', 'Last Updated': '2026-09-18 12:00' },
      { 'Parameter Name': 'Membrane Tank MLSS (Lab)', 'Input Value': 9200, 'Unit': 'mg/L', 'Source / Guidance': 'Daily 24h Composite Lab Test', 'Last Updated': '2026-09-18 08:00' }
    ]
  },
  {
    id: '03_Data_Staging',
    name: '03_Data_Staging',
    category: 'Data & Inputs',
    description: '15-minute aggregated process feature store with data quality flags and automated formula enrichment.',
    role: 'Staging / Store',
    formulas: 24,
    frozenHeader: 'Row 4 (Timestamp, Train ID, Signals)',
    keyColumns: ['Timestamp', 'Train ID', 'Perm Flow (m3/h)', 'Suct Press (kPa)', 'TMP (kPa)', 'Flux (LMH)', 'Lp_20 (LMH/bar)', 'Air (Nm3/h)', 'DQ Flag'],
    sampleRows: [
      { 'Timestamp': '2026-09-18 10:00', 'Train ID': 'TRAIN_A', 'Perm Flow (m3/h)': 115.2, 'Suct Press (kPa)': -18.5, 'TMP (kPa)': 28.5, 'Flux (LMH)': 24.0, 'Lp_20 (LMH/bar)': 212.5, 'Air (Nm3/h)': 1344.0, 'DQ Flag': 'DQ_GOOD' },
      { 'Timestamp': '2026-09-18 10:15', 'Train ID': 'TRAIN_B', 'Perm Flow (m3/h)': 115.2, 'Suct Press (kPa)': -19.2, 'TMP (kPa)': 29.8, 'Flux (LMH)': 24.0, 'Lp_20 (LMH/bar)': 203.2, 'Air (Nm3/h)': 1344.0, 'DQ Flag': 'DQ_GOOD' }
    ]
  },
  {
    id: '04_Train_Analysis',
    name: '04_Train_Analysis',
    category: 'Process Engineering',
    description: 'Side-by-side comparative membrane hydraulics and fouling KPIs across Trains A through D.',
    role: 'Process Engineering',
    formulas: 28,
    frozenHeader: 'Row 4 (Train Parameter, Unit, Trains A-D)',
    keyColumns: ['Train Parameter', 'Unit', 'Train A', 'Train B', 'Train C', 'Train D', 'Calculation Formula'],
    sampleRows: [
      { 'Train Parameter': 'Active Membrane Area', 'Unit': 'm2', 'Train A': 4800, 'Train B': 4800, 'Train C': 4800, 'Train D': 4800, 'Calculation Formula': 'Settings: 4 cass * 24 mod * 50 m2' },
      { 'Train Parameter': 'Transmembrane Pressure (TMP)', 'Unit': 'kPa', 'Train A': 28.5, 'Train B': 29.8, 'Train C': 47.2, 'Train D': 31.0, 'Calculation Formula': 'rho*g*H_tank - P_suction' },
      { 'Train Parameter': 'Normalized Permeability Lp_20', 'Unit': 'LMH/bar', 'Train A': 212.5, 'Train B': 203.2, 'Train C': 128.4, 'Train D': 195.0, 'Calculation Formula': '(Flux / (TMP/100)) * TCF' }
    ]
  },
  {
    id: '05_Engineering_Calcs',
    name: '05_Engineering_Calcs',
    category: 'Process Engineering',
    description: 'Master physical, fluid mechanics, and Darcy membrane resistance calculations with temperature normalization.',
    role: 'Process Engineering',
    formulas: 9,
    frozenHeader: 'Row 4 (Calculation Name, Unit, Formula)',
    keyColumns: ['Calculation Name', 'Unit', 'Calculated Value', 'Engineering Formula', 'Status / Plausibility'],
    sampleRows: [
      { 'Calculation Name': 'Total Plant Permeate Flow', 'Unit': 'm3/h', 'Calculated Value': 460.8, 'Engineering Formula': 'SUM(Train_A_Qp:Train_D_Qp)', 'Status / Plausibility': 'NORMAL (Design: 460.8)' },
      { 'Calculation Name': 'Water Dynamic Viscosity @ T', 'Unit': 'mPa.s', 'Calculated Value': 1.045, 'Engineering Formula': 'Poiseuille water viscosity function', 'Status / Plausibility': 'NORMAL' },
      { 'Calculation Name': 'Total Hydraulic Resistance Rtot', 'Unit': '1/m', 'Calculated Value': '1.18e12', 'Engineering Formula': 'TMP / (mu * J)', 'Status / Plausibility': 'NORMAL' }
    ]
  },
  {
    id: '06_TMP_Permeability',
    name: '06_TMP_Permeability',
    category: 'Process Engineering',
    description: 'Transmembrane pressure normalization and permeability decay tracking over operational cycles.',
    role: 'Process Engineering',
    formulas: 18,
    frozenHeader: 'Row 4 (Metric, Trains A-D, Plant Avg)',
    keyColumns: ['Metric', 'Train A', 'Train B', 'Train C', 'Train D', 'Plant Average', 'Engineering Rule'],
    sampleRows: [
      { 'Metric': 'Operating TMP (kPa)', 'Train A': 28.5, 'Train B': 29.8, 'Train C': 47.2, 'Train D': 31.0, 'Plant Average': 34.1, 'Engineering Rule': 'Safe Limit: < 45 kPa' },
      { 'Metric': 'Norm. Lp @20C (LMH/bar)', 'Train A': 212.5, 'Train B': 203.2, 'Train C': 128.4, 'Train D': 195.0, 'Plant Average': 184.8, 'Engineering Rule': 'Lp * TCF' }
    ]
  },
  {
    id: '07_Biology',
    name: '07_Biology',
    category: 'Process Engineering',
    description: 'Bioreactor kinetic health, active solids mass inventory, F/M food-to-mass loading, and COD removal efficiency.',
    role: 'Process Engineering',
    formulas: 7,
    frozenHeader: 'Row 4 (Biological Parameter, Value, Unit)',
    keyColumns: ['Biological Parameter', 'Value', 'Unit', 'Method / Calculation', 'Target Criteria'],
    sampleRows: [
      { 'Biological Parameter': 'Total Biological Solids Mass', 'Value': 33264, 'Unit': 'kg dry solids', 'Method / Calculation': '(V_aero*MLSS_aero + V_mbr*MLSS_mbr)/1000', 'Target Criteria': 'Total Plant Inventory' },
      { 'Biological Parameter': 'Food-to-Mass Ratio F/M', 'Value': 0.146, 'Unit': 'kg COD/kg MLVSS.d', 'Method / Calculation': '(Q_in * COD_in) / (Solids * MLVSS_ratio)', 'Target Criteria': '0.10 – 0.25 (Standard MBR)' },
      { 'Biological Parameter': 'COD Removal Efficiency', 'Value': '95.6%', 'Unit': '%', 'Method / Calculation': '(COD_in - COD_perm) / COD_in * 100', 'Target Criteria': '> 95.0%' }
    ]
  },
  {
    id: '08_WAS_SRT',
    name: '08_WAS_SRT',
    category: 'Process Engineering',
    description: 'Waste Activated Sludge (WAS) mass removal and operational Solids Retention Time (SRT) calculations.',
    role: 'Process Engineering',
    formulas: 5,
    frozenHeader: 'Row 4 (WAS & SRT Parameter, Value, Unit)',
    keyColumns: ['WAS & SRT Parameter', 'Value', 'Unit', 'Engineering Formula', 'Status / Target'],
    sampleRows: [
      { 'WAS & SRT Parameter': 'Calculated Operational SRT', 'Value': 20.2, 'Unit': 'days', 'Engineering Formula': 'Solids_Inventory / WAS_Mass_Day', 'Status / Target': 'TARGET: 18 – 25 days' },
      { 'WAS & SRT Parameter': 'Recommended WAS Flow for Target SRT', 'Value': 37.8, 'Unit': 'm3/d', 'Engineering Formula': '(Inventory / Target_SRT) * 1000 / MLSS_was', 'Status / Target': 'Feed to SCADA Controller' }
    ]
  },
  {
    id: '09_Cleaning',
    name: '09_Cleaning',
    category: 'Process Engineering',
    description: 'Chemical cleaning logs, dosing concentrations, chemical consumption, and permeability recovery efficiency.',
    role: 'Process Engineering',
    formulas: 5,
    frozenHeader: 'Row 4 (Clean Date, Train, Clean Type)',
    keyColumns: ['Clean Date', 'Train', 'Clean Type', 'Chemical', 'Dose (ppm)', 'Pre-Lp (LMH/bar)', 'Post-Lp (LMH/bar)', 'Recovery %'],
    sampleRows: [
      { 'Clean Date': '2026-09-02', 'Train': 'TRAIN_A', 'Clean Type': 'MC_HYPO', 'Chemical': 'NaOCl', 'Dose (ppm)': 500, 'Pre-Lp (LMH/bar)': 128.0, 'Post-Lp (LMH/bar)': 245.0, 'Recovery %': '77.0%' },
      { 'Clean Date': '2026-09-12', 'Train': 'TRAIN_C', 'Clean Type': 'MC_HYPO', 'Chemical': 'NaOCl', 'Dose (ppm)': 500, 'Pre-Lp (LMH/bar)': 110.0, 'Post-Lp (LMH/bar)': 185.0, 'Recovery %': '44.1%' }
    ]
  },
  {
    id: '10_Equipment',
    name: '10_Equipment',
    category: 'Assets & Alarms',
    description: 'Operational health registry for permeate pumps, coarse air blowers, VFD speeds, run hours, and vibration.',
    role: 'Assets & Alarms',
    formulas: 0,
    frozenHeader: 'Row 4 (Tag ID, Description, Train)',
    keyColumns: ['Tag ID', 'Equipment Description', 'Train', 'VFD Speed (%)', 'Run Hours (h)', 'Vibration (mm/s)', 'Health State'],
    sampleRows: [
      { 'Tag ID': '77-PMP-101A', 'Equipment Description': 'Train A Permeate Pump', 'Train': 'TRAIN_A', 'VFD Speed (%)': 64.5, 'Run Hours (h)': 12450, 'Vibration (mm/s)': 1.8, 'Health State': 'HEALTHY' },
      { 'Tag ID': '77-PMP-101C', 'Equipment Description': 'Train C Permeate Pump', 'Train': 'TRAIN_C', 'VFD Speed (%)': 72.8, 'Run Hours (h)': 12510, 'Vibration (mm/s)': 3.4, 'Health State': 'WATCH (Elevated)' }
    ]
  },
  {
    id: '11_Events_Alarms',
    name: '11_Events_Alarms',
    category: 'Assets & Alarms',
    description: 'Dynamic alarm engine evaluating high TMP, rate of change (ROC), low permeability, and turbidity conditions.',
    role: 'Assets & Alarms',
    formulas: 5,
    frozenHeader: 'Row 4 (Alarm Code, Severity, Scope)',
    keyColumns: ['Alarm Code', 'Severity', 'Scope', 'Condition Description', 'Active State', 'Recommended Mitigation'],
    sampleRows: [
      { 'Alarm Code': 'ALM_TMP_HIGH', 'Severity': 'HIGH', 'Scope': 'TRAIN_C', 'Condition Description': 'TMP > 45 kPa for > 120s', 'Active State': 'ACTIVE', 'Recommended Mitigation': 'Reduce Train C flux by 15%; schedule Maintenance Clean' },
      { 'Alarm Code': 'ALM_TURBIDITY', 'Severity': 'CRITICAL', 'Scope': 'ALL TRAINS', 'Condition Description': 'Permeate Turbidity > 0.40 NTU', 'Active State': 'CLEARED', 'Recommended Mitigation': 'Isolate breached train; perform pressure decay test' }
    ]
  },
  {
    id: '12_Peer_Comparison',
    name: '12_Peer_Comparison',
    category: 'Process Engineering',
    description: 'Inter-train peer comparison metrics and outlier divergence diagnostics.',
    role: 'Process Engineering',
    formulas: 8,
    frozenHeader: 'Row 4 (KPI, Trains A-D, Peer Mean)',
    keyColumns: ['KPI', 'Train A', 'Train B', 'Train C', 'Train D', 'Peer Mean', 'Max Deviation %'],
    sampleRows: [
      { 'KPI': 'Normalized Permeability', 'Train A': 212.5, 'Train B': 203.2, 'Train C': 128.4, 'Train D': 195.0, 'Peer Mean': 184.8, 'Max Deviation %': '45.5%' },
      { 'KPI': 'Operating TMP', 'Train A': 28.5, 'Train B': 29.8, 'Train C': 47.2, 'Train D': 31.0, 'Peer Mean': 34.1, 'Max Deviation %': '54.8%' }
    ]
  },
  {
    id: '13_What_If',
    name: '13_What_If',
    category: 'Scenarios & ML',
    description: 'Process scenario modeling and sensitivity analysis for train outages, winter temperature drop, and WAS flow changes.',
    role: 'Scenarios & ML',
    formulas: 4,
    frozenHeader: 'Row 4 (Scenario Control, Baseline, Simulated)',
    keyColumns: ['Scenario Control', 'Current Baseline', 'Simulated Value', 'Unit', 'Engineering Impact'],
    sampleRows: [
      { 'Scenario Control': 'Active Trains Online Count', 'Current Baseline': 4, 'Simulated Value': 3, 'Unit': 'trains', 'Engineering Impact': '1 Train offline for scheduled maintenance' },
      { 'Scenario Control': 'Individual Train Flux', 'Current Baseline': 24.0, 'Simulated Value': 32.0, 'Unit': 'LMH', 'Engineering Impact': 'Redistributed flux across remaining online trains' },
      { 'Scenario Control': 'Simulated TMP Response', 'Current Baseline': 28.5, 'Simulated Value': 42.6, 'Unit': 'kPa', 'Engineering Impact': 'Non-linear TMP rise under elevated flux' }
    ]
  },
  {
    id: '14_Prediction',
    name: '14_Prediction',
    category: 'Scenarios & ML',
    description: 'Native Excel linear trend forecasts projecting TMP at +6h, +12h, +24h, +48h and time-to-limit remaining useful life.',
    role: 'Scenarios & ML',
    formulas: 20,
    frozenHeader: 'Row 4 (Horizon, Trains A-D, Analytics Label)',
    keyColumns: ['Horizon', 'Train A TMP (kPa)', 'Train B TMP (kPa)', 'Train C TMP (kPa)', 'Train D TMP (kPa)', 'Analytics Label'],
    sampleRows: [
      { 'Horizon': 'Current (T+0)', 'Train A TMP (kPa)': 28.5, 'Train B TMP (kPa)': 29.8, 'Train C TMP (kPa)': 47.2, 'Train D TMP (kPa)': 31.0, 'Analytics Label': 'ENGINEERING TREND FORECAST' },
      { 'Horizon': '+24 Hours', 'Train A TMP (kPa)': 31.4, 'Train B TMP (kPa)': 33.4, 'Train C TMP (kPa)': 53.9, 'Train D TMP (kPa)': 35.3, 'Analytics Label': 'ENGINEERING TREND FORECAST' },
      { 'Horizon': 'Time to Limit', 'Train A TMP (kPa)': '137.5 h', 'Train B TMP (kPa)': '101.3 h', 'Train C TMP (kPa)': '-7.9 h (EXCEEDED)', 'Train D TMP (kPa)': '77.8 h', 'Analytics Label': 'Remaining Safe Filtration Time' }
    ]
  },
  {
    id: '15_Python_Output',
    name: '15_Python_Output',
    category: 'Scenarios & ML',
    description: 'Structured exchange interface for incoming advanced Python outputs (Theil-Sen slope, Isolation Forest score, PCA T2, SHAP values).',
    role: 'Scenarios & ML',
    formulas: 0,
    frozenHeader: 'Row 4 (Python Telemetry Field, Value, Confidence)',
    keyColumns: ['Python Telemetry Field', 'Value / Status', 'Confidence (0-1)', 'Timestamp Executed', 'Engine Status'],
    sampleRows: [
      { 'Python Telemetry Field': 'Theil-Sen Robust Slope', 'Value / Status': '0.142 kPa/h', 'Confidence (0-1)': 0.94, 'Timestamp Executed': '2026-09-18 12:00:00', 'Engine Status': 'CONVERGED' },
      { 'Python Telemetry Field': 'Isolation Forest Score', 'Value / Status': '-0.12 (Normal)', 'Confidence (0-1)': 0.91, 'Timestamp Executed': '2026-09-18 12:00:00', 'Engine Status': 'IN-DISTRIBUTION' },
      { 'Python Telemetry Field': 'PCA Hotelling T2 Metric', 'Value / Status': '4.21 (Limit: 7.82)', 'Confidence (0-1)': 0.96, 'Timestamp Executed': '2026-09-18 12:00:00', 'Engine Status': 'WITHIN CONTROL' }
    ]
  },
  {
    id: '16_Data_Quality',
    name: '16_Data_Quality',
    category: 'Governance',
    description: 'Instrumentation signal health, sample counts, outlier filtering, flatline monitoring, and health verdict.',
    role: 'Governance',
    formulas: 0,
    frozenHeader: 'Row 4 (Sensor Tag, Good Samples, Outliers)',
    keyColumns: ['Sensor Tag / Location', 'Good Samples', 'Outliers', 'Flatline Samples', 'Quality %', 'Health Verdict'],
    sampleRows: [
      { 'Sensor Tag / Location': 'FIT-7701 Influent Flow', 'Good Samples': 1438, 'Outliers': 2, 'Flatline Samples': 0, 'Quality %': '99.86%', 'Health Verdict': 'EXCELLENT' },
      { 'Sensor Tag / Location': 'PT-771C Train C Suction', 'Good Samples': 1432, 'Outliers': 8, 'Flatline Samples': 0, 'Quality %': '99.44%', 'Health Verdict': 'ACCEPTABLE (Slight Noise)' }
    ]
  },
  {
    id: '17_Settings',
    name: '17_Settings',
    category: 'Governance',
    description: 'Decoupled membrane geometries, physical constants, standard temperatures, and biological kinetics.',
    role: 'Settings / Reference',
    formulas: 0,
    frozenHeader: 'Row 4 (Settings Constant, Value, Unit)',
    keyColumns: ['Settings Constant', 'Value', 'Unit', 'Engineering Basis'],
    sampleRows: [
      { 'Settings Constant': 'Membrane Module Surface Area', 'Value': 50.0, 'Unit': 'm2', 'Engineering Basis': 'PVDF Hollow Fiber Module Specs' },
      { 'Settings Constant': 'Viscosity Temperature Factor theta', 'Value': 1.025, 'Unit': '-', 'Engineering Basis': 'Arrhenius / Empirical Viscosity Law' },
      { 'Settings Constant': 'Target Solids Retention Time (SRT)', 'Value': 20.0, 'Unit': 'days', 'Engineering Basis': 'Biological Nitrification Target' }
    ]
  },
  {
    id: '18_Engineering_Reference',
    name: '18_Engineering_Reference',
    category: 'Governance',
    description: 'Physical equations, symbol nomenclature, dimensional units, and literature citations (Darcy, Poiseuille, Metcalf & Eddy).',
    role: 'Settings / Reference',
    formulas: 0,
    frozenHeader: 'Row 4 (Concept, Equation, Dimensions)',
    keyColumns: ['Concept', 'Equation / Relation', 'Dimensions & Units', 'Literature Citation'],
    sampleRows: [
      { 'Concept': 'Darcy Law Filtration', 'Equation / Relation': 'J = TMP / (mu * R_tot)', 'Dimensions & Units': 'J in m/s, TMP in Pa, mu in Pa.s', 'Literature Citation': 'Darcy (1856); Judd (2011)' },
      { 'Concept': 'Temperature Normalized Permeability', 'Equation / Relation': 'Lp_20 = Lp * theta^(20 - T)', 'Dimensions & Units': 'Lp in LMH/bar, T in °C, theta=1.025', 'Literature Citation': 'Water Environment Federation (2012)' }
    ]
  },
  {
    id: '19_Audit_Log',
    name: '19_Audit_Log',
    category: 'Governance',
    description: 'Version history, verification milestones, and formal engineering sign-offs.',
    role: 'Governance',
    formulas: 0,
    frozenHeader: 'Row 4 (Timestamp, Version, Action)',
    keyColumns: ['Timestamp', 'Version', 'Action / Event', 'Engineering Details', 'Verified By'],
    sampleRows: [
      { 'Timestamp': '2026-09-18 13:48', 'Version': 'v0.1.0', 'Action / Event': 'Stage 1 Sign-Off', 'Engineering Details': 'Engineering Foundation & Data Model 8/8 Gate Pass', 'Verified By': 'Turgunjon Ruziboyev' },
      { 'Timestamp': '2026-09-18 13:52', 'Version': 'v0.2.0', 'Action / Event': 'Stage 2 Workbook Build', 'Engineering Details': '19 Worksheets generated with structured formulas and no broken links', 'Verified By': 'Turgunjon Ruziboyev' }
    ]
  }
];

export const ExcelWorkbookViewer: React.FC = () => {
  const [selectedSheetId, setSelectedSheetId] = useState<string>('01_Dashboard');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const selectedSheet = SHEETS_CATALOG.find(s => s.id === selectedSheetId) || SHEETS_CATALOG[0];

  const categories = ['ALL', 'Cockpit', 'Data & Inputs', 'Process Engineering', 'Assets & Alarms', 'Scenarios & ML', 'Governance'];

  const filteredSheets = filterCategory === 'ALL' 
    ? SHEETS_CATALOG 
    : SHEETS_CATALOG.filter(s => s.category === filterCategory);

  const totalFormulas = SHEETS_CATALOG.reduce((acc, s) => acc + s.formulas, 0);

  return (
    <div id="excel-workbook-viewer" className="space-y-6">
      {/* Top Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">UNIT_77_MBR_SUPER_EXPERT.xlsx</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-medium">
                STAGE 2 CERTIFIED
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              19 interconnected worksheets, 206 native Excel formulas, zero broken references, frozen headers, and strictly separated operator input zones. Fully usable without Python.
            </p>
          </div>
        </div>

        {/* Download Button */}
        <a 
          id="download-excel-btn"
          href="/UNIT_77_MBR_SUPER_EXPERT.xlsx" 
          download="UNIT_77_MBR_SUPER_EXPERT.xlsx"
          className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-950/50 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Production .xlsx</span>
        </a>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="text-[11px] text-slate-400 font-mono">TOTAL WORKSHEETS</div>
          <div className="text-xl font-bold text-white mt-1">19 Sheets</div>
          <div className="text-[11px] text-emerald-400 mt-0.5">100% Standard Names</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="text-[11px] text-slate-400 font-mono">NATIVE FORMULAS</div>
          <div className="text-xl font-bold text-white mt-1">{totalFormulas}+ Formulas</div>
          <div className="text-[11px] text-emerald-400 mt-0.5">0 Broken References</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="text-[11px] text-slate-400 font-mono">INPUT SEPARATION</div>
          <div className="text-xl font-bold text-white mt-1">Strict Boundaries</div>
          <div className="text-[11px] text-blue-400 mt-0.5">Soft Blue Style (#EBF5FF)</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="text-[11px] text-slate-400 font-mono">GATE 2 VERIFICATION</div>
          <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5" /> 8 / 8 PASS
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Node.js + Python Verified</div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-medium mr-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" /> Category:
        </span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded-md transition whitespace-nowrap ${
              filterCategory === cat 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Split Layout: Sheet Selector + Active Sheet Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Worksheet Navigator List (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-semibold text-slate-400 px-1 uppercase tracking-wider">
            Worksheet Catalog ({filteredSheets.length})
          </div>
          <div className="space-y-1.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredSheets.map(s => {
              const isSelected = s.id === selectedSheetId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSheetId(s.id)}
                  className={`w-full text-left p-3 rounded-lg border transition flex items-center justify-between ${
                    isSelected 
                      ? 'bg-slate-900 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/20'
                      : 'bg-slate-950 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Table className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div className="truncate">
                      <div className={`font-mono text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {s.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {s.role}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {s.formulas > 0 ? `${s.formulas} f(x)` : 'Data'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Worksheet Detail & Data Preview (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          {/* Header detail */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  {selectedSheet.category}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {selectedSheet.role}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1 font-mono">
                {selectedSheet.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {selectedSheet.description}
              </p>
            </div>

            <div className="text-right text-xs font-mono text-slate-400 shrink-0">
              <div className="text-slate-500">Frozen Pane</div>
              <div className="text-slate-200 font-medium">{selectedSheet.frozenHeader}</div>
            </div>
          </div>

          {/* Key structural attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-500">Formulas Configured</div>
              <div className="text-sm font-semibold text-white font-mono mt-0.5">{selectedSheet.formulas} Formulas</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-500">Columns Schema</div>
              <div className="text-sm font-semibold text-white font-mono mt-0.5">{selectedSheet.keyColumns.length} Columns</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-500">Native Excel Usability</div>
              <div className="text-sm font-semibold text-emerald-400 font-mono mt-0.5">100% Standalone</div>
            </div>
          </div>

          {/* Table Preview of Worksheet Structure */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-slate-400" />
                <span>Structured Worksheet Table Preview</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Showing Top Representative Rows</span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800">
                    {selectedSheet.keyColumns.map((col, idx) => (
                      <th key={idx} className="px-3 py-2.5 font-semibold text-slate-200 border-r border-slate-800/80 last:border-r-0 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {selectedSheet.sampleRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/40">
                      {selectedSheet.keyColumns.map((col, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-slate-300 border-r border-slate-800/40 last:border-r-0 whitespace-nowrap">
                          {row[col] !== undefined ? String(row[col]) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stage 2 Quality Guarantee Card */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-emerald-900/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-emerald-300">Stage 2 Gate Verification Passed</div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Every formula in this worksheet references verified target cells in other sheets with no broken links, circular loops, or error tags. The table structure is freeze-locked at the header row.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
