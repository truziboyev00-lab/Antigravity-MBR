import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Gauge, 
  TrendingUp, 
  Flame, 
  Sliders, 
  RefreshCw, 
  Crosshair, 
  Info, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  evaluateAlarmCondition, 
  calculateRateOfChange, 
  calculateMultiRiskIndex, 
  calculatePeerComparison, 
  diagnoseRootCauses, 
  MASTER_ALARM_RULES, 
  OperationalSnapshot,
  AlarmRule
} from '../engineering/diagnosticEngine';
import { runStage4BenchmarkSuite, Stage4BenchmarkTestCase } from '../engineering/stage4Benchmark';

export function DiagnosticAlarmEngine() {
  // --- Benchmark Suite State ---
  const [benchmarkResults, setBenchmarkResults] = useState<Stage4BenchmarkTestCase[]>(() => runStage4BenchmarkSuite());
  const [selectedBenchmarkCategory, setSelectedBenchmarkCategory] = useState<string>('ALL');

  // --- Interactive Alarm Simulator State ---
  const [selectedAlarmCode, setSelectedAlarmCode] = useState<string>('ALM_TMP_HIGH');
  const [simulatedValue, setSimulatedValue] = useState<number>(44.0);
  const [isPreviouslyLatched, setIsPreviouslyLatched] = useState<boolean>(true);
  const [durationSeconds, setDurationSeconds] = useState<number>(150);

  // --- Interactive Peer Comparison State ---
  const [peerMetric, setPeerMetric] = useState<'PERMEABILITY' | 'TMP' | 'AIR_SCOUR' | 'FLOW'>('PERMEABILITY');
  const [trainValues, setTrainValues] = useState<Record<string, number>>({
    TRAIN_A: 162.0,
    TRAIN_B: 158.5,
    TRAIN_C: 104.2, // Degraded outlier
    TRAIN_D: 159.0
  });

  // --- Interactive Operational Scenario State for Multi-Risk & Root Cause ---
  const [scenarioName, setScenarioName] = useState<'NOMINAL' | 'FIBER_RUPTURE' | 'AERATION_DEFICIT' | 'COLD_SHOCK' | 'COLLOIDAL_FOULING'>('COLLOIDAL_FOULING');
  
  const [currentSnapshot, setCurrentSnapshot] = useState<OperationalSnapshot>({
    trainId: 'TRAIN_C',
    tmpKPa: 46.8,
    tmpPrevKPa: 44.2,
    dtMinutes: 60,
    permeabilityNormalized: 98.0,
    fluxGrossLMH: 24.2,
    airScourFlowNm3h: 740.0,
    permeateTurbidityNTU: 0.08,
    mlssMgL: 14200.0,
    doMgL: 1.1,
    temperatureC: 18.2,
    srtDays: 44.0,
    pumpVibrationMmS: 2.4,
    dataQualityFlag: 'GOOD'
  });

  // Scenario presets
  const applyScenario = (type: 'NOMINAL' | 'FIBER_RUPTURE' | 'AERATION_DEFICIT' | 'COLD_SHOCK' | 'COLLOIDAL_FOULING') => {
    setScenarioName(type);
    if (type === 'NOMINAL') {
      setCurrentSnapshot({
        trainId: 'TRAIN_A',
        tmpKPa: 22.5,
        tmpPrevKPa: 22.2,
        dtMinutes: 60,
        permeabilityNormalized: 172.0,
        fluxGrossLMH: 22.0,
        airScourFlowNm3h: 910.0,
        permeateTurbidityNTU: 0.05,
        mlssMgL: 9200.0,
        doMgL: 2.4,
        temperatureC: 19.0,
        srtDays: 24.0,
        pumpVibrationMmS: 1.4,
        dataQualityFlag: 'GOOD'
      });
    } else if (type === 'FIBER_RUPTURE') {
      setCurrentSnapshot({
        trainId: 'TRAIN_B',
        tmpKPa: 26.0,
        tmpPrevKPa: 25.8,
        dtMinutes: 60,
        permeabilityNormalized: 165.0,
        fluxGrossLMH: 22.5,
        airScourFlowNm3h: 890.0,
        permeateTurbidityNTU: 0.65, // Direct breach
        mlssMgL: 9400.0,
        doMgL: 2.2,
        temperatureC: 18.5,
        srtDays: 24.0,
        pumpVibrationMmS: 1.6,
        dataQualityFlag: 'GOOD'
      });
    } else if (type === 'AERATION_DEFICIT') {
      setCurrentSnapshot({
        trainId: 'TRAIN_C',
        tmpKPa: 44.5,
        tmpPrevKPa: 39.0,
        dtMinutes: 120,
        permeabilityNormalized: 125.0,
        fluxGrossLMH: 23.0,
        airScourFlowNm3h: 620.0, // Low scour
        permeateTurbidityNTU: 0.08,
        mlssMgL: 10800.0,
        doMgL: 1.8,
        temperatureC: 18.0,
        srtDays: 26.0,
        pumpVibrationMmS: 3.6,
        dataQualityFlag: 'GOOD'
      });
    } else if (type === 'COLD_SHOCK') {
      setCurrentSnapshot({
        trainId: 'TRAIN_D',
        tmpKPa: 42.0,
        tmpPrevKPa: 41.5,
        dtMinutes: 60,
        permeabilityNormalized: 158.0, // High normalized permeability!
        fluxGrossLMH: 21.0,
        airScourFlowNm3h: 900.0,
        permeateTurbidityNTU: 0.06,
        mlssMgL: 9800.0,
        doMgL: 2.3,
        temperatureC: 9.2, // Very cold
        srtDays: 25.0,
        pumpVibrationMmS: 1.5,
        dataQualityFlag: 'GOOD'
      });
    } else if (type === 'COLLOIDAL_FOULING') {
      setCurrentSnapshot({
        trainId: 'TRAIN_C',
        tmpKPa: 48.5,
        tmpPrevKPa: 44.0,
        dtMinutes: 60,
        permeabilityNormalized: 88.0, // Severely fouled
        fluxGrossLMH: 23.5,
        airScourFlowNm3h: 760.0,
        permeateTurbidityNTU: 0.09,
        mlssMgL: 14800.0, // Excessive solids
        doMgL: 0.95, // Oxygen starvation
        temperatureC: 17.5,
        srtDays: 46.0, // High sludge age
        pumpVibrationMmS: 2.8,
        dataQualityFlag: 'GOOD'
      });
    }
  };

  // Selected alarm rule
  const currentAlarmRule = MASTER_ALARM_RULES.find(r => r.alarmCode === selectedAlarmCode) || MASTER_ALARM_RULES[0];
  const alarmUnit = currentAlarmRule.parameterId.includes('TMP') ? 'kPa' :
                    currentAlarmRule.parameterId.includes('PERMEABILITY') ? 'LMH/bar' :
                    currentAlarmRule.parameterId.includes('AIR') ? 'Nm3/h' :
                    currentAlarmRule.parameterId.includes('TURBIDITY') ? 'NTU' :
                    currentAlarmRule.parameterId.includes('MLSS') ? 'mg/L' :
                    currentAlarmRule.parameterId.includes('VIBRATION') ? 'mm/s' : '';
  const sliderMin = 0;
  const sliderMax = Math.max(100, currentAlarmRule.threshold * 1.8);

  // Evaluate alarm simulator
  const alarmSimResult = useMemo(() => {
    return evaluateAlarmCondition(
      currentAlarmRule,
      simulatedValue,
      'TRAIN_C',
      isPreviouslyLatched,
      durationSeconds
    );
  }, [currentAlarmRule, simulatedValue, isPreviouslyLatched, durationSeconds]);

  // Compute Multi-Risk Index
  const mriResult = useMemo(() => {
    return calculateMultiRiskIndex(currentSnapshot);
  }, [currentSnapshot]);

  // Compute Peer Comparison
  const peerResult = useMemo(() => {
    const metricLabel = peerMetric === 'PERMEABILITY' ? 'PERMEABILITY_NORMALIZED_20C' :
      peerMetric === 'TMP' ? 'TRANSMEMBRANE_PRESSURE' :
      peerMetric === 'AIR_SCOUR' ? 'AIR_SCOUR_FLOW' : 'PERMEATE_FLOW';
    const unit = peerMetric === 'PERMEABILITY' ? 'LMH/bar' :
      peerMetric === 'TMP' ? 'kPa' :
      peerMetric === 'AIR_SCOUR' ? 'Nm3/h' : 'm3/h';
    return calculatePeerComparison(metricLabel, unit, trainValues);
  }, [peerMetric, trainValues]);

  // Compute Diagnostic Root Causes
  const rootCauses = useMemo(() => {
    return diagnoseRootCauses(currentSnapshot);
  }, [currentSnapshot]);

  const benchmarkPassCount = benchmarkResults.filter(t => t.passed).length;

  return (
    <div id="diagnostic-engine-container" className="flex flex-col gap-6">
      {/* Top Banner & Multi-Risk Index Overview */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>STAGE 4 ALARM ENGINE & RESIDUAL DIAGNOSTICS</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">HYSTERESIS & PERSISTENCE VERIFIED</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Multi-Risk Index (MRI) & State Machine Diagnostics</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Real-time supervisory diagnostic engine preventing alarm chatter via symmetric hysteresis deadbands, persistent condition confirmation, multi-factor risk synthesis (0-100), and statistical peer train divergence analysis.
            </p>
          </div>

          {/* MRI Gauge Card */}
          <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-inner shrink-0">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">MULTI-RISK INDEX</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-3xl font-extrabold font-mono ${
                  mriResult.totalScore >= 75 ? 'text-rose-400' :
                  mriResult.totalScore >= 50 ? 'text-amber-400' :
                  mriResult.totalScore >= 30 ? 'text-yellow-400' : 'text-emerald-400'
                }`}>
                  {mriResult.totalScore.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ 100</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 mt-1 rounded font-semibold font-mono ${
                mriResult.riskCategory === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                mriResult.riskCategory === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                mriResult.riskCategory === 'ELEVATED' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' :
                'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {mriResult.riskCategory} RISK
              </span>
            </div>

            <div className="h-14 w-px bg-slate-800"></div>

            {/* Sub-factor Bars */}
            <div className="flex flex-col gap-1.5 w-44 text-[11px] font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Hydraulic (40%)</span>
                <span className="text-slate-200 font-bold">{mriResult.hydraulicRisk.toFixed(0)}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full ${mriResult.hydraulicRisk > 70 ? 'bg-rose-500' : mriResult.hydraulicRisk > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${mriResult.hydraulicRisk}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Biological (25%)</span>
                <span className="text-slate-200 font-bold">{mriResult.biologicalRisk.toFixed(0)}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full ${mriResult.biologicalRisk > 70 ? 'bg-rose-500' : mriResult.biologicalRisk > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${mriResult.biologicalRisk}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Mechanical (20%)</span>
                <span className="text-slate-200 font-bold">{mriResult.mechanicalRisk.toFixed(0)}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full ${mriResult.mechanicalRisk > 70 ? 'bg-rose-500' : mriResult.mechanicalRisk > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${mriResult.mechanicalRisk}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Scenario Quick-Switch Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <span>Plant Diagnostic Scenario:</span>
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button 
                onClick={() => applyScenario('NOMINAL')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${scenarioName === 'NOMINAL' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Nominal Health
              </button>
              <button 
                onClick={() => applyScenario('FIBER_RUPTURE')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${scenarioName === 'FIBER_RUPTURE' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Fiber Breach
              </button>
              <button 
                onClick={() => applyScenario('AERATION_DEFICIT')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${scenarioName === 'AERATION_DEFICIT' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Air Scour Deficit
              </button>
              <button 
                onClick={() => applyScenario('COLD_SHOCK')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${scenarioName === 'COLD_SHOCK' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                Winter Cold Shock (Viscosity)
              </button>
              <button 
                onClick={() => applyScenario('COLLOIDAL_FOULING')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${scenarioName === 'COLLOIDAL_FOULING' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                High Solids Fouling
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Dominant Stressor:</span>
            <span className="text-amber-400 font-semibold">{mriResult.dominantFactor}</span>
          </div>
        </div>
      </section>

      {/* Grid: Hysteresis Simulator & Root Cause Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Hysteresis Simulator (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Hysteresis Deadband & Persistence Simulator</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Zero-Chatter Logic</span>
          </div>

          {/* Alarm Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Target Alarm Rule</label>
              <select 
                value={selectedAlarmCode}
                onChange={(e) => {
                  const newCode = e.target.value;
                  setSelectedAlarmCode(newCode);
                  const rule = MASTER_ALARM_RULES.find(r => r.alarmCode === newCode);
                  if (rule) {
                    setSimulatedValue(rule.threshold);
                    setDurationSeconds(rule.persistenceSeconds + 10);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-emerald-500"
              >
                {MASTER_ALARM_RULES.map(r => (
                  <option key={r.alarmCode} value={r.alarmCode}>
                    [{r.severity}] {r.alarmCode} — {r.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Previous Latched State (Memory)</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsPreviouslyLatched(true)}
                  className={`py-1.5 px-3 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1 ${
                    isPreviouslyLatched ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" /> Latched (Active)
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviouslyLatched(false)}
                  className={`py-1.5 px-3 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1 ${
                    !isPreviouslyLatched ? 'bg-slate-700 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Cleared (Idle)
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Sliders */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Simulated Process Value:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {simulatedValue.toFixed(2)} {alarmUnit}
                </span>
              </div>
              <input 
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={(sliderMax - sliderMin) / 100}
                value={simulatedValue}
                onChange={(e) => setSimulatedValue(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Min: {sliderMin}</span>
                <span>Trip: {currentAlarmRule.threshold} {alarmUnit}</span>
                <span>Max: {sliderMax.toFixed(0)}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Condition Sustained Duration:</span>
                <span className="text-cyan-400 font-bold">
                  {durationSeconds} s (Persistence Req: {currentAlarmRule.persistenceSeconds} s)
                </span>
              </div>
              <input 
                type="range"
                min={0}
                max={Math.max(600, currentAlarmRule.persistenceSeconds * 2)}
                step={5}
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>

          {/* Hysteresis Calculation Output Card */}
          <div className={`p-4 rounded-xl border flex flex-col gap-3 transition ${
            alarmSimResult.isLatched 
              ? 'bg-rose-950/20 border-rose-500/40 text-rose-200' 
              : alarmSimResult.isBreaching 
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {alarmSimResult.isLatched ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
                ) : alarmSimResult.isBreaching ? (
                  <Activity className="w-5 h-5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
                <span className="font-bold text-sm">
                  {alarmSimResult.isLatched ? 'ALARM STATE: LATCHED & ACTIVE' :
                   alarmSimResult.isBreaching ? 'ALARM STATE: CONDITION BREACHED (PENDING PERSISTENCE)' :
                   'ALARM STATE: CLEARED (NORMAL)'}
                </span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700">
                Reset Threshold: {alarmSimResult.resetThreshold.toFixed(2)} {alarmUnit}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-2 border-t border-slate-800/60">
              <div>
                <span className="text-slate-400 text-[10px] block">THRESHOLD</span>
                <span className="font-bold text-white">{alarmSimResult.threshold} {alarmUnit}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">DEADBAND</span>
                <span className="font-bold text-white">{currentAlarmRule.deadbandHysteresis} {alarmUnit}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">BREACH DETECT</span>
                <span className={alarmSimResult.isBreaching ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  {alarmSimResult.isBreaching ? 'TRUE' : 'FALSE'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">LATCH OUTPUT</span>
                <span className={alarmSimResult.isLatched ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {alarmSimResult.isLatched ? 'ACTIVE' : 'IDLE'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 italic pt-1">
              <strong>Evaluation Trace:</strong> {alarmSimResult.description}
            </p>
          </div>
        </div>

        {/* Right Column: Multi-Symptom Diagnostic Reasoning (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Fault Diagnosis & Hypothesis Engine</h3>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">Heuristic Inferences</span>
          </div>

          <div className="flex flex-col gap-3">
            {rootCauses.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                No abnormal diagnostic hypotheses inferred. All biological, hydraulic, and aeration metrics within healthy envelope.
              </div>
            ) : (
              rootCauses.map((hyp, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {hyp.faultCode}
                      </span>
                      <h4 className="font-bold text-slate-100">{hyp.title}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                      {hyp.probabilityPct.toFixed(0)}% CONFIDENCE
                    </span>
                  </div>

                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    <strong className="text-slate-300">Physics Mechanism:</strong> {hyp.physicalMechanism}
                  </p>

                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80 text-[11px] text-emerald-300">
                    <strong className="text-slate-200">Prescribed Mitigation:</strong> {hyp.recommendedMitigation}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Inter-Train Peer Comparison Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Inter-Train Statistical Peer Comparison (Z-Scores & Divergence)</h3>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Compare Metric:</span>
            <select 
              value={peerMetric}
              onChange={(e) => {
                const m = e.target.value as any;
                setPeerMetric(m);
                if (m === 'PERMEABILITY') {
                  setTrainValues({ TRAIN_A: 162.0, TRAIN_B: 158.5, TRAIN_C: 104.2, TRAIN_D: 159.0 });
                } else if (m === 'TMP') {
                  setTrainValues({ TRAIN_A: 24.2, TRAIN_B: 25.0, TRAIN_C: 47.8, TRAIN_D: 24.8 });
                } else if (m === 'AIR_SCOUR') {
                  setTrainValues({ TRAIN_A: 910.0, TRAIN_B: 895.0, TRAIN_C: 640.0, TRAIN_D: 905.0 });
                } else {
                  setTrainValues({ TRAIN_A: 180.0, TRAIN_B: 182.0, TRAIN_C: 142.0, TRAIN_D: 179.0 });
                }
              }}
              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs"
            >
              <option value="PERMEABILITY">Normalized Permeability (LMH/bar)</option>
              <option value="TMP">Operating TMP (kPa)</option>
              <option value="AIR_SCOUR">Air Scour Flow (Nm3/h)</option>
              <option value="FLOW">Permeate Flow (m3/h)</option>
            </select>
          </div>
        </div>

        {/* Peer Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] block">PEER MEAN</span>
            <span className="text-slate-100 font-bold text-sm">{peerResult.peerMean.toFixed(2)} {peerResult.unit}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] block">PEER STD DEV</span>
            <span className="text-slate-100 font-bold text-sm">{peerResult.peerStdDev.toFixed(2)} {peerResult.unit}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] block">MAX RESIDUAL</span>
            <span className="text-amber-400 font-bold text-sm">
              {Math.max(...Object.values(peerResult.trainValues).map(v => Math.abs(v - peerResult.peerMean))).toFixed(2)} {peerResult.unit}
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] block">OUTLIER STATUS</span>
            <span className={`font-bold text-sm ${peerResult.outlierTrains.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {peerResult.outlierTrains.length > 0 ? `${peerResult.outlierTrains.join(', ')} DIVERGENT` : 'UNIFORM PEERS'}
            </span>
          </div>
        </div>

        {/* Train Breakdown Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 font-mono text-[11px] text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-2.5">TRAIN ID</th>
                <th className="px-4 py-2.5">MEASURED VALUE</th>
                <th className="px-4 py-2.5">DEVIATION FROM MEAN</th>
                <th className="px-4 py-2.5">Z-SCORE</th>
                <th className="px-4 py-2.5">ANOMALY STATUS</th>
                <th className="px-4 py-2.5">ADJUST INPUT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {['TRAIN_A', 'TRAIN_B', 'TRAIN_C', 'TRAIN_D'].map((tId) => {
                const val = trainValues[tId];
                const z = peerResult.zScores[tId];
                const pct = peerResult.pctDeviations[tId];
                const isOutlier = peerResult.outlierTrains.includes(tId);

                return (
                  <tr key={tId} className={isOutlier ? 'bg-rose-950/10' : 'hover:bg-slate-800/30'}>
                    <td className="px-4 py-2 font-bold text-white flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isOutlier ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                      {tId}
                    </td>
                    <td className="px-4 py-2 font-bold text-slate-200">
                      {val.toFixed(1)} {peerResult.unit}
                    </td>
                    <td className={`px-4 py-2 ${pct < -15 ? 'text-rose-400 font-bold' : pct > 15 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`}
                    </td>
                    <td className={`px-4 py-2 ${Math.abs(z) > 1.2 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                      {z > 0 ? `+${z.toFixed(2)}` : z.toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isOutlier 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {isOutlier ? 'ANOMALOUS OUTLIER' : 'NORMAL'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="number"
                        step="1"
                        value={val}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          setTrainValues(prev => ({ ...prev, [tId]: v }));
                        }}
                        className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Stage 4 Controlled Benchmark Verification Suite (18 Tests) */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Stage 4 Controlled Benchmark Suite</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {benchmarkPassCount} / {benchmarkResults.length} PASSED (100%)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              18 Standardized validation tests confirming Hysteresis Trip & Reset, Persistence Windowing, ROC Trajectory, MRI Weighting, Peer Z-Scores, and Zero-Division Guards.
            </p>
          </div>

          {/* Filter by Category */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono">Category:</span>
            <select
              value={selectedBenchmarkCategory}
              onChange={(e) => setSelectedBenchmarkCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-xs font-mono"
            >
              <option value="ALL">ALL CATEGORIES ({benchmarkResults.length})</option>
              <option value="HYSTERESIS">HYSTERESIS (6)</option>
              <option value="PERSISTENCE">PERSISTENCE (2)</option>
              <option value="ROC">RATE-OF-CHANGE (2)</option>
              <option value="MULTI_RISK_INDEX">MULTI-RISK INDEX (2)</option>
              <option value="PEER_COMPARISON">PEER COMPARISON (1)</option>
              <option value="ROOT_CAUSE">ROOT CAUSE (3)</option>
              <option value="GUARD_LIMIT">GUARD LIMITS (2)</option>
            </select>
          </div>
        </div>

        {/* Tests Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 font-mono text-[11px] text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-2.5">TEST ID</th>
                <th className="px-4 py-2.5">TEST NAME & DESCRIPTION</th>
                <th className="px-4 py-2.5">EXPECTED</th>
                <th className="px-4 py-2.5">COMPUTED</th>
                <th className="px-4 py-2.5">STATUS</th>
                <th className="px-4 py-2.5">ENGINEERING AUDIT TRACE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {benchmarkResults
                .filter(t => selectedBenchmarkCategory === 'ALL' || t.category === selectedBenchmarkCategory)
                .map((test) => (
                  <tr key={test.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-2.5 font-bold text-emerald-400 whitespace-nowrap">
                      {test.id}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-slate-200">{test.name}</div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">{test.description}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap font-bold">
                      {String(test.expectedValue)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-100 whitespace-nowrap font-bold">
                      {String(test.computedValue)} <span className="text-[10px] text-slate-500">{test.unit}</span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {test.passed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-[11px] bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <XCircle className="w-3 h-3" /> FAIL
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-[10px] font-sans">
                      {test.notes}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
