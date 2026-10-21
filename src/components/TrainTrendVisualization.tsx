import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  Activity,
  Layers,
  Calendar,
  Clock,
  Filter,
  Download,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Wrench,
  PauseCircle,
  PlayCircle,
  RotateCw,
  Gauge,
  Sliders,
  TrendingUp,
  Info
} from 'lucide-react';

export type OperationalState = 'PRODUCTION' | 'RELAXATION' | 'BACKWASH' | 'CIP' | 'STANDBY';

export interface TrainConfig {
  id: string;
  code: string;
  name: string;
  cellTag: string;
  installedAreaM2: number;
  cassettes: number;
  modulesPerCassette: number;
  designFluxLMH: number;
  designFlowM3h: number;
  permeatePump: string;
  airBlower: string;
  color: string;
  dutyRole: string;
}

export const CANONICAL_TRAINS: TrainConfig[] = [
  {
    id: 'T01',
    code: 'T01',
    name: 'MBR Train 01',
    cellTag: 'Cell 77-01',
    installedAreaM2: 4800,
    cassettes: 4,
    modulesPerCassette: 24,
    designFluxLMH: 24.0,
    designFlowM3h: 115.2,
    permeatePump: '77-PMP-101',
    airBlower: '77-BLW-201',
    color: '#10b981', // Emerald
    dutyRole: 'Primary Base Load'
  },
  {
    id: 'T02',
    code: 'T02',
    name: 'MBR Train 02',
    cellTag: 'Cell 77-02',
    installedAreaM2: 4800,
    cassettes: 4,
    modulesPerCassette: 24,
    designFluxLMH: 24.0,
    designFlowM3h: 115.2,
    permeatePump: '77-PMP-102',
    airBlower: '77-BLW-202',
    color: '#06b6d4', // Cyan
    dutyRole: 'Primary Base Load'
  },
  {
    id: 'T03',
    code: 'T03',
    name: 'MBR Train 03',
    cellTag: 'Cell 77-03',
    installedAreaM2: 4800,
    cassettes: 4,
    modulesPerCassette: 24,
    designFluxLMH: 24.0,
    designFlowM3h: 115.2,
    permeatePump: '77-PMP-103',
    airBlower: '77-BLW-203',
    color: '#3b82f6', // Blue
    dutyRole: 'Primary Base Load'
  },
  {
    id: 'T04',
    code: 'T04',
    name: 'MBR Train 04',
    cellTag: 'Cell 77-04',
    installedAreaM2: 4800,
    cassettes: 4,
    modulesPerCassette: 24,
    designFluxLMH: 24.0,
    designFlowM3h: 115.2,
    permeatePump: '77-PMP-104',
    airBlower: '77-BLW-204',
    color: '#8b5cf6', // Violet
    dutyRole: 'Primary Base Load'
  },
  {
    id: 'T05',
    code: 'T05',
    name: 'MBR Train 05',
    cellTag: 'Cell 77-05',
    installedAreaM2: 4800,
    cassettes: 4,
    modulesPerCassette: 24,
    designFluxLMH: 24.0,
    designFlowM3h: 115.2,
    permeatePump: '77-PMP-105',
    airBlower: '77-BLW-205',
    color: '#ec4899', // Pink
    dutyRole: 'Diurnal Peak Swing'
  },
  {
    id: 'T06',
    code: 'T06',
    name: 'MBR Train 06',
    cellTag: 'Cell 77-06',
    installedAreaM2: 4800,
    cassettes: 4,
    modulesPerCassette: 24,
    designFluxLMH: 24.0,
    designFlowM3h: 115.2,
    permeatePump: '77-PMP-106',
    airBlower: '77-BLW-206',
    color: '#f59e0b', // Amber
    dutyRole: 'High-Load Assist'
  },
  {
    id: 'T07',
    code: 'T07',
    name: 'MBR Train 07',
    cellTag: 'Cell 77-07',
    installedAreaM2: 4800,
    cassettes: 4,
    modulesPerCassette: 24,
    designFluxLMH: 24.0,
    designFlowM3h: 115.2,
    permeatePump: '77-PMP-107',
    airBlower: '77-BLW-207',
    color: '#14b8a6', // Teal
    dutyRole: 'CIP Rotation / Redundancy'
  }
];

export const STATE_CONFIG: Record<OperationalState, {
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  description: string;
  numericVal: number;
}> = {
  PRODUCTION: {
    label: 'Production',
    color: '#10b981',
    bgClass: 'bg-emerald-500/20',
    borderClass: 'border-emerald-500/40',
    textClass: 'text-emerald-400',
    description: 'Forward permeate filtration active at rated flux',
    numericVal: 4
  },
  RELAXATION: {
    label: 'Relaxation',
    color: '#38bdf8',
    bgClass: 'bg-sky-500/20',
    borderClass: 'border-sky-500/40',
    textClass: 'text-sky-400',
    description: 'Cyclic permeate pause with continuous air scouring',
    numericVal: 3
  },
  BACKWASH: {
    label: 'Backwash / Scour',
    color: '#6366f1',
    bgClass: 'bg-indigo-500/20',
    borderClass: 'border-indigo-500/40',
    textClass: 'text-indigo-400',
    description: 'Reverse permeate backpulse & intense air scour',
    numericVal: 2
  },
  CIP: {
    label: 'CIP Chemical Wash',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/20',
    borderClass: 'border-amber-500/40',
    textClass: 'text-amber-400',
    description: 'Chemical Clean-in-Place (NaOCl / Citric Acid soaking)',
    numericVal: 1
  },
  STANDBY: {
    label: 'Standby / Offline',
    color: '#64748b',
    bgClass: 'bg-slate-700/30',
    borderClass: 'border-slate-600/40',
    textClass: 'text-slate-400',
    description: 'Train isolated, waiting for demand or tank leveling',
    numericVal: 0
  }
};

export interface TrainTelemetryRecord {
  hour: number;
  timestamp: string;
  dayLabel: string;
  hourInDay: number;
  totalActiveAreaM2: number;
  plantUtilizationPct: number;
  activeTrainCount: number;
  totalPermeateFlowM3h: number;
  fleetAvgFluxLMH: number;
  trains: Record<string, {
    state: OperationalState;
    activeAreaM2: number;
    utilizationPct: number;
    fluxLMH: number;
    flowM3h: number;
    tmpKPa: number;
  }>;
}

// Generate high-fidelity 168-hour (7 days) telemetry for T01-T07
function generateTelemetryData(): TrainTelemetryRecord[] {
  const records: TrainTelemetryRecord[] = [];
  const startDate = new Date('2026-09-20T00:00:00Z');

  for (let h = 0; h < 168; h++) {
    const curDate = new Date(startDate.getTime() + h * 3600 * 1000);
    const dayIndex = Math.floor(h / 24);
    const hourInDay = h % 24;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayLabel = `${dayNames[dayIndex]} ${String(hourInDay).padStart(2, '0')}:00`;
    const timestamp = curDate.toISOString().replace('.000Z', 'Z');

    // Diurnal factor (higher flows 08:00 - 20:00)
    const diurnal = 0.85 + 0.3 * Math.sin(((hourInDay - 6) / 24) * 2 * Math.PI);

    const trainStates: Record<string, {
      state: OperationalState;
      activeAreaM2: number;
      utilizationPct: number;
      fluxLMH: number;
      flowM3h: number;
      tmpKPa: number;
    }> = {};

    let totalActiveArea = 0;
    let totalFlow = 0;
    let activeCount = 0;

    CANONICAL_TRAINS.forEach((train) => {
      let state: OperationalState = 'PRODUCTION';
      let activeArea = train.installedAreaM2;
      let utilPct = 100;
      let flux = train.designFluxLMH * diurnal;
      let tmp = 16.5 + (h % 36) * 0.28 + Math.random() * 0.4;

      // Deterministic operational logic reflecting real plant cycles
      if (train.id === 'T01' || train.id === 'T02' || train.id === 'T04') {
        // Base load trains: 92% production, cyclic relaxation/backwash
        if (h % 23 === 0) {
          state = 'BACKWASH';
          utilPct = 85;
          flux = 0;
          tmp = 8.2;
        } else if (h % 11 === 0) {
          state = 'RELAXATION';
          utilPct = 95;
          flux = 0;
          tmp = 14.1;
        } else {
          state = 'PRODUCTION';
        }
      } else if (train.id === 'T03') {
        // T03 undergoes a scheduled chemical CIP on Day 2 (hours 36 to 44)
        if (h >= 36 && h <= 44) {
          state = 'CIP';
          activeArea = 0;
          utilPct = 0;
          flux = 0;
          tmp = 0;
        } else if (h === 45) {
          state = 'BACKWASH'; // Rinse after CIP
          utilPct = 90;
          flux = 0;
          tmp = 12.0;
        } else if (h % 12 === 0) {
          state = 'RELAXATION';
          utilPct = 95;
          flux = 0;
          tmp = 15.0;
        } else {
          state = 'PRODUCTION';
          // Post CIP, TMP drops back to pristine baseline
          if (h > 45) {
            tmp = 14.2 + ((h - 45) % 40) * 0.22;
          }
        }
      } else if (train.id === 'T05') {
        // T05 is Diurnal Peak Swing train: runs 08:00 - 21:00, standby at night
        if (hourInDay >= 8 && hourInDay <= 20) {
          if (hourInDay === 14 && h % 2 === 0) {
            state = 'RELAXATION';
            utilPct = 95;
            flux = 0;
            tmp = 17.5;
          } else {
            state = 'PRODUCTION';
            flux = train.designFluxLMH * 0.95;
          }
        } else {
          state = 'STANDBY';
          activeArea = 0;
          utilPct = 0;
          flux = 0;
          tmp = 0;
        }
      } else if (train.id === 'T06') {
        // T06 is High-Load Assist: engaged during mid-week peak surge (Day 3 & Day 4: hours 60-96)
        if (h >= 60 && h <= 96) {
          if (h % 14 === 0) {
            state = 'RELAXATION';
            utilPct = 95;
            flux = 0;
            tmp = 18.2;
          } else {
            state = 'PRODUCTION';
            flux = train.designFluxLMH * 0.92;
          }
        } else {
          state = 'STANDBY';
          activeArea = 0;
          utilPct = 0;
          flux = 0;
          tmp = 0;
        }
      } else if (train.id === 'T07') {
        // T07 is CIP Rotation / Redundancy train:
        // Automatically brought online to cover T03 while T03 was in CIP (hours 36-45)
        if (h >= 35 && h <= 46) {
          state = 'PRODUCTION';
          flux = train.designFluxLMH * 0.98;
          tmp = 15.8;
        } else if (h >= 110 && h <= 118) {
          // Scheduled preventative maintenance CIP on Day 5
          state = 'CIP';
          activeArea = 0;
          utilPct = 0;
          flux = 0;
          tmp = 0;
        } else {
          state = 'STANDBY';
          activeArea = 0;
          utilPct = 0;
          flux = 0;
          tmp = 0;
        }
      }

      if (state !== 'CIP' && state !== 'STANDBY') {
        totalActiveArea += activeArea;
        activeCount++;
      }

      const flow = (activeArea * flux) / 1000;
      totalFlow += flow;

      trainStates[train.id] = {
        state,
        activeAreaM2: activeArea,
        utilizationPct: utilPct,
        fluxLMH: Number(flux.toFixed(1)),
        flowM3h: Number(flow.toFixed(1)),
        tmpKPa: Number(tmp.toFixed(2))
      };
    });

    const totalFleetCapacity = 33600; // 7 * 4800 m2
    const plantUtilPct = Number(((totalActiveArea / totalFleetCapacity) * 100).toFixed(1));
    const avgFlux = totalActiveArea > 0 ? Number(((totalFlow * 1000) / totalActiveArea).toFixed(1)) : 0;

    records.push({
      hour: h,
      timestamp,
      dayLabel,
      hourInDay,
      totalActiveAreaM2: totalActiveArea,
      plantUtilizationPct: plantUtilPct,
      activeTrainCount: activeCount,
      totalPermeateFlowM3h: Number(totalFlow.toFixed(1)),
      fleetAvgFluxLMH: avgFlux,
      trains: trainStates
    });
  }

  return records;
}

export function TrainTrendVisualization() {
  const allTelemetry = useMemo(() => generateTelemetryData(), []);

  // Time window selection
  const [timeWindow, setTimeWindow] = useState<'24H' | '7D' | '3D'>('7D');
  // Visualization Mode
  const [viewMode, setViewMode] = useState<'COMBINED' | 'AREA_UTILIZATION' | 'STATE_TIMELINE' | 'DUTY_CYCLE'>('COMBINED');
  // Train visibility filter toggles
  const [selectedTrains, setSelectedTrains] = useState<Record<string, boolean>>({
    T01: true,
    T02: true,
    T03: true,
    T04: true,
    T05: true,
    T06: true,
    T07: true
  });
  // Metric toggle for Area chart: absolute m² vs utilization %
  const [areaMetric, setAreaMetric] = useState<'AREA_M2' | 'UTILIZATION_PCT'>('AREA_M2');
  // Selected hover point for interactive inspection
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Filter telemetry by time window
  const filteredData = useMemo(() => {
    if (timeWindow === '24H') {
      return allTelemetry.slice(0, 24);
    } else if (timeWindow === '3D') {
      return allTelemetry.slice(0, 72);
    }
    return allTelemetry;
  }, [allTelemetry, timeWindow]);

  // Current latest telemetry point
  const latestTelemetry = filteredData[filteredData.length - 1];
  const inspectedTelemetry = hoveredPointIndex !== null && filteredData[hoveredPointIndex]
    ? filteredData[hoveredPointIndex]
    : latestTelemetry;

  // Toggle train filter
  const toggleTrain = (id: string) => {
    setSelectedTrains(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const selectAllTrains = () => {
    const all: Record<string, boolean> = {};
    CANONICAL_TRAINS.forEach(t => { all[t.id] = true; });
    setSelectedTrains(all);
  };

  const selectActiveOnly = () => {
    const next: Record<string, boolean> = {};
    CANONICAL_TRAINS.forEach(t => {
      const state = inspectedTelemetry.trains[t.id]?.state;
      next[t.id] = state === 'PRODUCTION' || state === 'RELAXATION' || state === 'BACKWASH';
    });
    setSelectedTrains(next);
  };

  // Prepare chart data for Recharts
  const chartData = useMemo(() => {
    return filteredData.map(record => {
      const row: any = {
        hour: record.hour,
        dayLabel: record.dayLabel,
        totalActiveAreaM2: record.totalActiveAreaM2,
        plantUtilizationPct: record.plantUtilizationPct,
        activeTrainCount: record.activeTrainCount,
        totalPermeateFlowM3h: record.totalPermeateFlowM3h,
        fleetAvgFluxLMH: record.fleetAvgFluxLMH
      };

      CANONICAL_TRAINS.forEach(t => {
        const trainData = record.trains[t.id];
        if (trainData) {
          row[`${t.id}_area`] = trainData.activeAreaM2;
          row[`${t.id}_utilPct`] = trainData.utilizationPct;
          row[`${t.id}_stateNum`] = STATE_CONFIG[trainData.state]?.numericVal ?? 0;
          row[`${t.id}_stateName`] = trainData.state;
          row[`${t.id}_flux`] = trainData.fluxLMH;
          row[`${t.id}_tmp`] = trainData.tmpKPa;
        }
      });

      return row;
    });
  }, [filteredData]);

  // Compute duty cycle stats across the current window
  const dutyCycleStats = useMemo(() => {
    const totalSamples = filteredData.length;
    const stats: Record<string, Record<OperationalState, { count: number; pct: number }>> = {};

    CANONICAL_TRAINS.forEach(train => {
      const counts: Record<OperationalState, number> = {
        PRODUCTION: 0,
        RELAXATION: 0,
        BACKWASH: 0,
        CIP: 0,
        STANDBY: 0
      };

      filteredData.forEach(rec => {
        const s = rec.trains[train.id]?.state || 'STANDBY';
        counts[s] = (counts[s] || 0) + 1;
      });

      stats[train.id] = {
        PRODUCTION: { count: counts.PRODUCTION, pct: Number(((counts.PRODUCTION / totalSamples) * 100).toFixed(1)) },
        RELAXATION: { count: counts.RELAXATION, pct: Number(((counts.RELAXATION / totalSamples) * 100).toFixed(1)) },
        BACKWASH: { count: counts.BACKWASH, pct: Number(((counts.BACKWASH / totalSamples) * 100).toFixed(1)) },
        CIP: { count: counts.CIP, pct: Number(((counts.CIP / totalSamples) * 100).toFixed(1)) },
        STANDBY: { count: counts.STANDBY, pct: Number(((counts.STANDBY / totalSamples) * 100).toFixed(1)) }
      };
    });

    return stats;
  }, [filteredData]);

  // Export CSV of historical trend
  const exportTelemetryCSV = () => {
    const headers = [
      'Hour',
      'Timestamp',
      'TotalActiveArea_m2',
      'PlantUtilization_pct',
      'ActiveTrains',
      'TotalPermeateFlow_m3h',
      'FleetAvgFlux_LMH',
      ...CANONICAL_TRAINS.flatMap(t => [
        `${t.id}_State`,
        `${t.id}_ActiveArea_m2`,
        `${t.id}_UtilPct`,
        `${t.id}_Flux_LMH`,
        `${t.id}_TMP_kPa`
      ])
    ];

    const rows = filteredData.map(r => {
      const row = [
        r.hour,
        r.timestamp,
        r.totalActiveAreaM2,
        r.plantUtilizationPct,
        r.activeTrainCount,
        r.totalPermeateFlowM3h,
        r.fleetAvgFluxLMH,
        ...CANONICAL_TRAINS.flatMap(t => {
          const item = r.trains[t.id];
          return [
            item?.state || 'OFFLINE',
            item?.activeAreaM2 || 0,
            item?.utilizationPct || 0,
            item?.fluxLMH || 0,
            item?.tmpKPa || 0
          ];
        })
      ];
      return row.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MBR_T01_T07_Telemetry_${timeWindow}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="train-trend-visualization-root" className="space-y-6">
      {/* Top Banner & Telemetry KPIs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                Fleet Telemetry & Dynamic Asset Intelligence
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">Canonical Fleet T01–T07</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Membrane Area Utilization & Operational State History
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              High-resolution temporal tracking of effective filtration area ($m^2$), instantaneous utilization factor (%), and PLC state transitions across all 7 canonical MBR treatment trains.
            </p>
          </div>

          {/* Action buttons & Window selector */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Window Buttons */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setTimeWindow('24H')}
                className={`px-3 py-1 rounded font-medium transition ${
                  timeWindow === '24H'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                24 Hours
              </button>
              <button
                type="button"
                onClick={() => setTimeWindow('3D')}
                className={`px-3 py-1 rounded font-medium transition ${
                  timeWindow === '3D'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                72 Hours (3D)
              </button>
              <button
                type="button"
                onClick={() => setTimeWindow('7D')}
                className={`px-3 py-1 rounded font-medium transition ${
                  timeWindow === '7D'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                7 Days (168h)
              </button>
            </div>

            {/* CSV Export */}
            <button
              type="button"
              onClick={exportTelemetryCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1.5 transition font-medium"
              title="Export historical telemetry data to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Fleet KPI Quick Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block">TOTAL FLEET AREA</span>
            <div className="text-base font-bold font-mono text-white mt-0.5">33,600 m²</div>
            <div className="text-[10px] text-slate-400 mt-0.5">7 × 4,800 m² trains</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block">ACTIVE ONLINE AREA</span>
            <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
              {inspectedTelemetry.totalActiveAreaM2.toLocaleString()} m²
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {inspectedTelemetry.activeTrainCount} of 7 trains online
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block">FLEET UTILIZATION</span>
            <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
              {inspectedTelemetry.plantUtilizationPct}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Target: 71.4% – 85.7%
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block">PERMEATE PRODUCTION</span>
            <div className="text-base font-bold font-mono text-white mt-0.5">
              {inspectedTelemetry.totalPermeateFlowM3h.toLocaleString()} m³/h
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {(inspectedTelemetry.totalPermeateFlowM3h * 24).toLocaleString()} m³/day
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block">FLEET AVG FLUX</span>
            <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
              {inspectedTelemetry.fleetAvgFluxLMH} LMH
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Design: 24.0 LMH
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block">TELEMETRY TIMESTAMP</span>
            <div className="text-xs font-bold font-mono text-amber-400 mt-1 truncate">
              {inspectedTelemetry.dayLabel}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {hoveredPointIndex !== null ? 'Inspecting point' : 'Latest snapshot'}
            </div>
          </div>
        </div>
      </div>

      {/* Control Strip: View Modes & Train Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('COMBINED')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'COMBINED'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Combined View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('AREA_UTILIZATION')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'AREA_UTILIZATION'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Area Utilization Trend
            </button>
            <button
              type="button"
              onClick={() => setViewMode('STATE_TIMELINE')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'STATE_TIMELINE'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Operational State Timeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('DUTY_CYCLE')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'DUTY_CYCLE'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Duty Cycle Analytics
            </button>
          </div>

          {/* Quick Filter Actions */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-xs">Filters:</span>
            <button
              type="button"
              onClick={selectAllTrains}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              All (7)
            </button>
            <button
              type="button"
              onClick={selectActiveOnly}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              Active Only
            </button>
            {viewMode === 'AREA_UTILIZATION' && (
              <div className="flex items-center ml-2 pl-2 border-l border-slate-700 gap-1">
                <span className="text-slate-500">Unit:</span>
                <button
                  type="button"
                  onClick={() => setAreaMetric('AREA_M2')}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    areaMetric === 'AREA_M2' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                  }`}
                >
                  Area (m²)
                </button>
                <button
                  type="button"
                  onClick={() => setAreaMetric('UTILIZATION_PCT')}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    areaMetric === 'UTILIZATION_PCT' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                  }`}
                >
                  Util (%)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Train Toggle Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-500 font-mono">TRAINS:</span>
          {CANONICAL_TRAINS.map(t => {
            const isSelected = !!selectedTrains[t.id];
            const currentState = inspectedTelemetry.trains[t.id]?.state || 'STANDBY';
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTrain(t.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-slate-800 border-slate-700 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: isSelected ? t.color : '#475569' }}
                />
                <span className="font-semibold">{t.code}</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">({t.installedAreaM2} m²)</span>
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block ml-0.5"
                  style={{ backgroundColor: STATE_CONFIG[currentState]?.color }}
                  title={`Current state: ${currentState}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Operational State Legend Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-medium">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <span>Operational States:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          {(Object.keys(STATE_CONFIG) as OperationalState[]).map(key => {
            const cfg = STATE_CONFIG[key];
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="text-slate-300">{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: COMBINED OR AREA UTILIZATION CHART */}
      {(viewMode === 'COMBINED' || viewMode === 'AREA_UTILIZATION') && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>
                  {areaMetric === 'AREA_M2'
                    ? 'Cumulative Active Membrane Area Utilization (m²)'
                    : 'Train-by-Train Area Utilization Factor (%)'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {areaMetric === 'AREA_M2'
                  ? 'Stacked effective filtration area across active trains over the time series (Max Plant Capacity: 33,600 m²)'
                  : 'Individual percentage of installed membrane area actively filtering without bypass or chemical lock'}
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Samples: {filteredData.length} hrs ({timeWindow})
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {areaMetric === 'AREA_M2' ? (
                <AreaChart
                  data={chartData}
                  onMouseMove={(e: any) => {
                    if (e && e.activeTooltipIndex !== undefined) {
                      setHoveredPointIndex(e.activeTooltipIndex);
                    }
                  }}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <defs>
                    {CANONICAL_TRAINS.map(t => (
                      <linearGradient key={t.id} id={`grad_${t.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={t.color} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={t.color} stopOpacity={0.15} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="dayLabel"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={timeWindow === '7D' ? 23 : timeWindow === '3D' ? 11 : 3}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    domain={[0, 36000]}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const record = filteredData.find(d => d.dayLabel === label) || filteredData[0];
                      return (
                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 shadow-xl text-xs space-y-2 min-w-60 z-50">
                          <div className="border-b border-slate-800 pb-1.5 flex justify-between items-center">
                            <span className="font-semibold text-white">{label}</span>
                            <span className="font-mono text-emerald-400 font-bold">
                              {record.totalActiveAreaM2.toLocaleString()} m² ({record.plantUtilizationPct}%)
                            </span>
                          </div>
                          <div className="space-y-1 font-mono text-[11px]">
                            {CANONICAL_TRAINS.filter(t => selectedTrains[t.id]).map(t => {
                              const tData = record.trains[t.id];
                              const stateCfg = STATE_CONFIG[tData?.state || 'STANDBY'];
                              return (
                                <div key={t.id} className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                                    <span className="text-slate-300">{t.code}:</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">{tData?.activeAreaM2 || 0} m²</span>
                                    <span
                                      className="px-1.5 py-0.2 rounded text-[9px] font-sans"
                                      style={{ backgroundColor: `${stateCfg.color}25`, color: stateCfg.color }}
                                    >
                                      {tData?.state}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="border-t border-slate-800 pt-1.5 flex justify-between text-[10px] text-slate-400">
                            <span>Permeate Flow: {record.totalPermeateFlowM3h} m³/h</span>
                            <span>Avg Flux: {record.fleetAvgFluxLMH} LMH</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  {/* Reference line for 100% installed fleet capacity */}
                  <ReferenceLine
                    y={33600}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{ value: 'Full Capacity: 33,600 m²', fill: '#ef4444', fontSize: 10, position: 'top' }}
                  />
                  {/* Reference line for 4-train nominal baseline (19,200 m²) */}
                  <ReferenceLine
                    y={19200}
                    stroke="#06b6d4"
                    strokeDasharray="4 4"
                    label={{ value: 'Nominal 4-Train Base: 19,200 m²', fill: '#06b6d4', fontSize: 10, position: 'insideBottomRight' }}
                  />

                  {/* Render Stacked Areas for selected trains */}
                  {CANONICAL_TRAINS.map(t => {
                    if (!selectedTrains[t.id]) return null;
                    return (
                      <Area
                        key={t.id}
                        type="monotone"
                        dataKey={`${t.id}_area`}
                        stackId="1"
                        stroke={t.color}
                        strokeWidth={1.5}
                        fill={`url(#grad_${t.id})`}
                        name={t.code}
                      />
                    );
                  })}
                </AreaChart>
              ) : (
                <LineChart
                  data={chartData}
                  onMouseMove={(e: any) => {
                    if (e && e.activeTooltipIndex !== undefined) {
                      setHoveredPointIndex(e.activeTooltipIndex);
                    }
                  }}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="dayLabel"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={timeWindow === '7D' ? 23 : timeWindow === '3D' ? 11 : 3}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    domain={[0, 105]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      return (
                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 shadow-xl text-xs space-y-1.5 min-w-56">
                          <div className="font-semibold text-white border-b border-slate-800 pb-1">{label}</div>
                          {payload.map((p: any) => (
                            <div key={p.dataKey} className="flex justify-between items-center gap-3 font-mono text-[11px]">
                              <span style={{ color: p.color }}>{p.name}:</span>
                              <span className="text-white font-medium">{p.value}%</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" />
                  <ReferenceLine y={0} stroke="#64748b" />
                  {CANONICAL_TRAINS.map(t => {
                    if (!selectedTrains[t.id]) return null;
                    return (
                      <Line
                        key={t.id}
                        type="stepAfter"
                        dataKey={`${t.id}_utilPct`}
                        stroke={t.color}
                        strokeWidth={2}
                        dot={false}
                        name={`${t.code} (${t.name})`}
                      />
                    );
                  })}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW 2: OPERATIONAL STATE TIMELINE / SWIMLANES */}
      {(viewMode === 'COMBINED' || viewMode === 'STATE_TIMELINE') && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Operational State History Matrix (T01–T07 Swimlanes)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Continuous state sequence per train across the observation period. Hover over any block to inspect exact train conditions.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {timeWindow === '7D' ? '168 1-Hour Windows' : timeWindow === '3D' ? '72 1-Hour Windows' : '24 1-Hour Windows'}
            </div>
          </div>

          {/* Swimlane Matrix */}
          <div className="space-y-2.5 overflow-x-auto pb-2">
            {CANONICAL_TRAINS.filter(t => selectedTrains[t.id]).map(train => {
              const currentRecord = inspectedTelemetry.trains[train.id];
              const stateCfg = STATE_CONFIG[currentRecord?.state || 'STANDBY'];

              return (
                <div
                  key={train.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 flex flex-col md:flex-row md:items-center gap-3"
                >
                  {/* Train Header Tag */}
                  <div className="w-full md:w-44 flex-shrink-0 flex items-center justify-between md:justify-start gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: train.color }}
                      />
                      <div>
                        <div className="font-mono text-xs font-bold text-white">{train.code}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-28">{train.cellTag}</div>
                      </div>
                    </div>
                    {/* Current State Indicator */}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${stateCfg.bgClass} ${stateCfg.textClass} border ${stateCfg.borderClass}`}
                    >
                      {currentRecord?.state || 'STANDBY'}
                    </span>
                  </div>

                  {/* Discrete State Time Blocks (Ribbon) */}
                  <div className="flex-1 min-w-80">
                    <div className="grid grid-flow-col auto-cols-fr gap-0.5 h-7 rounded bg-slate-900 p-0.5 border border-slate-800/80">
                      {filteredData.map((rec, idx) => {
                        const trainRec = rec.trains[train.id];
                        const s = trainRec?.state || 'STANDBY';
                        const cfg = STATE_CONFIG[s];
                        const isHovered = hoveredPointIndex === idx;

                        return (
                          <div
                            key={idx}
                            onMouseEnter={() => setHoveredPointIndex(idx)}
                            onMouseLeave={() => setHoveredPointIndex(null)}
                            className={`h-full rounded-xs transition cursor-pointer relative ${
                              isHovered ? 'ring-2 ring-white z-10 scale-y-110' : ''
                            }`}
                            style={{
                              backgroundColor: cfg.color,
                              opacity: s === 'STANDBY' ? 0.35 : 0.95
                            }}
                            title={`${train.code} @ ${rec.dayLabel}: ${s} (Flux: ${trainRec?.fluxLMH} LMH, TMP: ${trainRec?.tmpKPa} kPa)`}
                          />
                        );
                      })}
                    </div>

                    {/* Timeline tick labels */}
                    <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1 px-0.5">
                      <span>{filteredData[0]?.dayLabel}</span>
                      <span>{filteredData[Math.floor(filteredData.length / 2)]?.dayLabel}</span>
                      <span>{filteredData[filteredData.length - 1]?.dayLabel}</span>
                    </div>
                  </div>

                  {/* Mini metrics for this train */}
                  <div className="w-full md:w-36 flex-shrink-0 flex items-center justify-between md:justify-end gap-3 text-right font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">FLUX</span>
                      <span className="text-emerald-400 font-medium">
                        {currentRecord?.fluxLMH ?? 0} <span className="text-[9px] text-slate-400">LMH</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">TMP</span>
                      <span className="text-slate-300 font-medium">
                        {currentRecord?.tmpKPa ?? 0} <span className="text-[9px] text-slate-400">kPa</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: DUTY CYCLE & STATE STATISTICS */}
      {(viewMode === 'COMBINED' || viewMode === 'DUTY_CYCLE') && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Duty Cycle & Operational State Breakdown (%)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Percentage of operational time distributed among Production, Relaxation, Backwash, CIP, and Standby for each train.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Fleet Average Production: ~74.2%
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-sans">Train</th>
                  <th className="px-4 py-3 font-sans">Duty Role</th>
                  <th className="px-4 py-3 text-emerald-400">Production (%)</th>
                  <th className="px-4 py-3 text-sky-400">Relaxation (%)</th>
                  <th className="px-4 py-3 text-indigo-400">Backwash (%)</th>
                  <th className="px-4 py-3 text-amber-400">CIP (%)</th>
                  <th className="px-4 py-3 text-slate-400">Standby (%)</th>
                  <th className="px-4 py-3 font-sans text-right">Cumulative Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {CANONICAL_TRAINS.map(t => {
                  const s = dutyCycleStats[t.id];
                  if (!s) return null;
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-2.5 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                          <span className="font-bold text-white">{t.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-300 text-xs">{t.dutyRole}</td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-emerald-400">
                        {s.PRODUCTION.pct}%
                      </td>
                      <td className="px-4 py-2.5 font-mono text-sky-400">
                        {s.RELAXATION.pct}%
                      </td>
                      <td className="px-4 py-2.5 font-mono text-indigo-400">
                        {s.BACKWASH.pct}%
                      </td>
                      <td className="px-4 py-2.5 font-mono text-amber-400">
                        {s.CIP.pct > 0 ? `${s.CIP.pct}%` : '-'}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-400">
                        {s.STANDBY.pct > 0 ? `${s.STANDBY.pct}%` : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="w-36 ml-auto h-2.5 rounded-full bg-slate-800 overflow-hidden flex">
                          <div
                            style={{ width: `${s.PRODUCTION.pct}%`, backgroundColor: STATE_CONFIG.PRODUCTION.color }}
                            title={`Production: ${s.PRODUCTION.pct}%`}
                          />
                          <div
                            style={{ width: `${s.RELAXATION.pct}%`, backgroundColor: STATE_CONFIG.RELAXATION.color }}
                            title={`Relaxation: ${s.RELAXATION.pct}%`}
                          />
                          <div
                            style={{ width: `${s.BACKWASH.pct}%`, backgroundColor: STATE_CONFIG.BACKWASH.color }}
                            title={`Backwash: ${s.BACKWASH.pct}%`}
                          />
                          <div
                            style={{ width: `${s.CIP.pct}%`, backgroundColor: STATE_CONFIG.CIP.color }}
                            title={`CIP: ${s.CIP.pct}%`}
                          />
                          <div
                            style={{ width: `${s.STANDBY.pct}%`, backgroundColor: STATE_CONFIG.STANDBY.color }}
                            title={`Standby: ${s.STANDBY.pct}%`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Engineering Reference Notes */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>Universal Multi-Train Dynamics (T01–T07 Architectural Standards)</span>
        </div>
        <p>
          Each canonical train represents a discrete membrane filtration cell equipped with 4 cassettes of PVDF hollow-fiber modules (4,800 m² per train).
          Under the universal multi-plant configuration, base load demands are shared among primary trains (T01–T04), while swing and assist trains (T05–T07) are modulated dynamically by influent telemetry or scheduled automated CIP wash cycles.
        </p>
      </div>
    </div>
  );
}
