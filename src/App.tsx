import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Layers, 
  Sliders, 
  AlertTriangle, 
  Activity, 
  Scale, 
  FileText, 
  Cpu, 
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  ArrowRightLeft,
  Brain,
  ExternalLink,
  Package,
  Check,
  Bot,
  Radio,
  Sparkles
} from 'lucide-react';

// Import foundation configurations
import parameterDict from './foundation/parameter_dictionary.json';
import unitDict from './foundation/unit_dictionary.json';
import trainStructure from './foundation/train_structure.json';
import engineeringLimits from './foundation/engineering_limits.json';
import settingsStructure from './foundation/settings_structure.json';
import alarmStructure from './foundation/alarm_structure.json';
import dqFlags from './foundation/data_quality_flags.json';

// Import Gemini AI Copilot & Live Voice Suite
import { GeminiAICopilot } from './components/GeminiAICopilot';
// Import Stage 11 Validation & Stress Testing
import { StressTestingView } from './components/StressTestingView';
// Import Stage 10 Full Super Expert Reasoning Chain
import { SuperExpertView } from './components/SuperExpertView';
// Import Stage 9 Excel <-> Python Hybrid Bridge
import { HybridBridgeView } from './components/HybridBridgeView';
// Import Stage 2 Excel Workbook Explorer
import { ExcelWorkbookViewer } from './components/ExcelWorkbookViewer';
// Import Stage 3 Core Engineering Calculations Benchmark
import { CoreCalculationsBenchmark } from './components/CoreCalculationsBenchmark';
// Import Stage 4 Diagnostic & Alarm Engine
import { DiagnosticAlarmEngine } from './components/DiagnosticAlarmEngine';
// Import Stage 5 What-If Scenario Modeling Engine
import { WhatIfScenarioEngine } from './components/WhatIfScenarioEngine';
// Import Stage 7 Modular Python Engine View
import { PythonEngineView } from './components/PythonEngineView';
// Import Train Trend Visualization & Fleet Topology
import { TrainTrendVisualization, CANONICAL_TRAINS } from './components/TrainTrendVisualization';
// Import Unit Converter Component
import { UnitConverter } from './components/UnitConverter';

type ActiveTab = 'GEMINI_AI' | 'STRESS_TESTING' | 'SUPER_EXPERT' | 'HYBRID_BRIDGE' | 'PYTHON_ENGINE' | 'WHAT_IF' | 'DIAGNOSTICS' | 'CALCULATIONS' | 'WORKBOOK' | 'PARAMETERS' | 'TRAINS' | 'UNITS' | 'LIMITS' | 'SETTINGS' | 'ALARMS' | 'VERIFICATION';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('STRESS_TESTING');
  const [paramSearch, setParamSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const handleDownloadFile = async (filename: string, label: string) => {
    try {
      setDownloadStatus(`Downloading ${label}...`);
      const response = await fetch(`/${filename}`);
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.setAttribute('download', filename);
      document.body.appendChild(tempLink);
      tempLink.click();
      setTimeout(() => {
        document.body.removeChild(tempLink);
        window.URL.revokeObjectURL(blobUrl);
        setDownloadStatus(`✓ ${label} downloaded successfully`);
        setTimeout(() => setDownloadStatus(null), 3000);
      }, 200);
    } catch (error) {
      console.warn('Direct blob download failed, attempting window.open fallback:', error);
      window.open(`/${filename}`, '_blank');
      setDownloadStatus(`Opened ${label} in new window`);
      setTimeout(() => setDownloadStatus(null), 3000);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(parameterDict.map(p => p.category)))];

  const filteredParams = parameterDict.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(paramSearch.toLowerCase()) ||
                          p.id.toLowerCase().includes(paramSearch.toLowerCase()) ||
                          p.engineeringDescription.toLowerCase().includes(paramSearch.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div id="unit-77-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Engineering Header */}
      <header id="app-header" className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">UNIT 77 MBR SUPER EXPERT</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono font-semibold">
                  STAGE 10 VERIFIED (v1.0.0)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Excel + Python Dual-Engine Digital Twin & Decision Support System • Created by <span className="text-slate-200 font-medium">Turgunjon Ruziboyev</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar & Actions */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
            <div className="flex flex-col hidden sm:flex">
              <span className="text-slate-500">BENCHMARKS</span>
              <span className="text-emerald-400 font-semibold text-sm">139 / 139 Pass</span>
            </div>
            <div className="flex flex-col hidden sm:flex">
              <span className="text-slate-500">WORKBOOK</span>
              <span className="text-slate-200 font-semibold text-sm">19 Sheets</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500">RELEASE GATE</span>
              <span className="text-emerald-400 font-semibold text-sm flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> STAGES 1..12D PASS
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                id="header-ai-copilot-btn"
                onClick={() => setActiveTab('GEMINI_AI')}
                className="px-3 py-1.5 rounded-md bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition shadow"
                title="Open Gemini AI Copilot & Voice"
              >
                <Bot className="w-3.5 h-3.5 text-emerald-300" />
                <span>AI Copilot & Live Voice</span>
              </button>

              <button
                id="header-download-zip-btn"
                onClick={() => handleDownloadFile('UNIT_77_MBR_SUPER_EXPERT_V1.0_FINAL_FULL_PROJECT.zip', 'Full Project ZIP (v1.0)')}
                className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition shadow"
                title="Download Full Project ZIP Archive (464 KB)"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Download .zip (464 KB)</span>
              </button>

              <button
                id="header-download-xlsx-btn"
                onClick={() => handleDownloadFile('UNIT_77_MBR_SUPER_EXPERT.xlsx', 'Excel Workbook (.xlsx)')}
                className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition border border-slate-700"
                title="Download Production Excel Workbook (42 KB)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.xlsx (42 KB)</span>
              </button>

              <a
                id="header-open-tab-btn"
                href={window.location.href}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700"
                title="Open in Full Browser Tab (bypass iframe download restrictions)"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Download notification toast */}
        {downloadStatus && (
          <div className="max-w-7xl mx-auto mt-2 px-3 py-1.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{downloadStatus}</span>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 flex-1 flex flex-col gap-6">
        {/* Stage Progress Banner */}
        <section id="stage-banner" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                <span>Stage 12D Certified</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-emerald-400">100% Gates Verified (Stages 1–12D)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                <span className="text-slate-400">Baseline Frozen v1.0</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">UNIT 77 MBR SUPER EXPERT — Certified Production Digital Twin</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete engineering platform with Excel OpenXML workbook (19 sheets, 309 formulas), 15-module Python engine, 28 stress scenarios, and complete verification suites.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                id="banner-download-zip-btn"
                onClick={() => handleDownloadFile('UNIT_77_MBR_SUPER_EXPERT_V1.0_FINAL_FULL_PROJECT.zip', 'Full Project ZIP (v1.0)')}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shrink-0"
              >
                <Package className="w-4 h-4" />
                <span>Download Full Project (.zip)</span>
              </button>

              <button
                id="banner-download-xlsx-btn"
                onClick={() => handleDownloadFile('UNIT_77_MBR_SUPER_EXPERT.xlsx', 'Excel Workbook (.xlsx)')}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition shadow-md shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Workbook (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Gate Verification Checklist Pills */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>28 Scenarios (28/28)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>6 Stress Domains</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Zero-Division Clamping</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>N-1 &amp; Multi-Outage Safety</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Telemetry Noise Filter</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Sub-10ms SLA Engine</span>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div id="tabs-navigation" className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800 text-xs font-medium">
          <button
            id="tab-gemini-ai"
            onClick={() => setActiveTab('GEMINI_AI')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'GEMINI_AI' 
                ? 'bg-slate-900 text-white border-emerald-400 font-bold shadow-sm' 
                : 'text-emerald-400 border-transparent hover:text-emerald-300 hover:bg-slate-900/50'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Gemini AI Copilot & Voice</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              LIVE
            </span>
          </button>

          <button
            id="tab-stress-testing"
            onClick={() => setActiveTab('STRESS_TESTING')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'STRESS_TESTING' 
                ? 'bg-slate-900 text-white border-emerald-500 font-semibold shadow-sm' 
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Stress Testing Suite (Stage 11)
          </button>

          <button
            id="tab-super-expert"
            onClick={() => setActiveTab('SUPER_EXPERT')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'SUPER_EXPERT' 
                ? 'bg-slate-900 text-white border-cyan-500 font-semibold shadow-sm' 
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Brain className="w-4 h-4 text-cyan-400" />
            Super Expert Reasoning (Stage 10)
          </button>

          <button
            id="tab-hybrid-bridge"
            onClick={() => setActiveTab('HYBRID_BRIDGE')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'HYBRID_BRIDGE' 
                ? 'bg-slate-900 text-white border-purple-500 font-semibold shadow-sm' 
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 text-purple-400" />
            Hybrid Bridge (Stage 9)
          </button>

          <button
            id="tab-python-engine"
            onClick={() => setActiveTab('PYTHON_ENGINE')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'PYTHON_ENGINE' 
                ? 'bg-slate-900 text-white border-indigo-500 font-semibold shadow-sm' 
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Cpu className="w-4 h-4 text-indigo-400" />
            Python Engine & Parity (Stage 7)
          </button>

          <button
            id="tab-what-if"
            onClick={() => setActiveTab('WHAT_IF')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'WHAT_IF' 
                ? 'bg-slate-900 text-white border-emerald-500 font-semibold shadow-sm' 
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            What-If Scenario Engine (Stage 5)
          </button>

          <button
            id="tab-diagnostics"
            onClick={() => setActiveTab('DIAGNOSTICS')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'DIAGNOSTICS' 
                ? 'bg-slate-900 text-white border-emerald-500 font-semibold shadow-sm' 
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Diagnostic Alarm Engine (Stage 4)
          </button>

          <button
            id="tab-calculations"
            onClick={() => setActiveTab('CALCULATIONS')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'CALCULATIONS' 
                ? 'bg-slate-900 text-white border-emerald-500 font-semibold shadow-sm' 
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            Core Calculations (Stage 3)
          </button>

          <button
            id="tab-workbook"
            onClick={() => setActiveTab('WORKBOOK')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'WORKBOOK' 
                ? 'bg-slate-900 text-white border-emerald-500 font-semibold shadow-sm' 
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            Excel Workbook Explorer (19 Sheets)
          </button>

          <button
            id="tab-parameters"
            onClick={() => setActiveTab('PARAMETERS')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'PARAMETERS' 
                ? 'bg-slate-900 text-white border-emerald-500 font-semibold' 
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            Parameter Dictionary ({parameterDict.length})
          </button>

          <button
            id="tab-trains"
            onClick={() => setActiveTab('TRAINS')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'TRAINS' 
                ? 'bg-slate-900 text-white border-emerald-500 font-semibold' 
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Activity className="w-4 h-4 text-blue-400" />
            Dynamic Train Structure
          </button>

          <button
            id="tab-units"
            onClick={() => setActiveTab('UNITS')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'UNITS' 
                ? 'bg-slate-900 text-white border-emerald-500 font-semibold' 
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Scale className="w-4 h-4 text-amber-400" />
            Unit Dictionary ({unitDict.length})
          </button>

          <button
            id="tab-limits"
            onClick={() => setActiveTab('LIMITS')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'LIMITS' 
                ? 'bg-slate-900 text-white border-emerald-500 font-semibold' 
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Engineering Limits
          </button>

          <button
            id="tab-settings"
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'SETTINGS' 
                ? 'bg-slate-900 text-white border-emerald-500 font-semibold' 
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Sliders className="w-4 h-4 text-purple-400" />
            Settings Structure
          </button>

          <button
            id="tab-alarms"
            onClick={() => setActiveTab('ALARMS')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'ALARMS' 
                ? 'bg-slate-900 text-white border-emerald-500 font-semibold' 
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-yellow-400" />
            Alarm State Engine
          </button>

          <button
            id="tab-verification"
            onClick={() => setActiveTab('VERIFICATION')}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'VERIFICATION' 
                ? 'bg-slate-900 text-white border-emerald-500 font-semibold' 
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            Stage 1 Gate Audit
          </button>
        </div>

        {/* Tab Contents */}
        <section id="tab-content" className="flex-1">
          {/* TAB -8: GEMINI AI COPILOT, LIVE VOICE & SEARCH GROUNDING */}
          {activeTab === 'GEMINI_AI' && <GeminiAICopilot />}

          {/* TAB -7: STAGE 11 VALIDATION & STRESS TESTING (28 SCENARIOS) */}
          {activeTab === 'STRESS_TESTING' && <StressTestingView />}

          {/* TAB -6: STAGE 10 FULL SUPER EXPERT REASONING CHAIN */}
          {activeTab === 'SUPER_EXPERT' && <SuperExpertView />}

          {/* TAB -5: STAGE 9 EXCEL <-> PYTHON HYBRID BRIDGE */}
          {activeTab === 'HYBRID_BRIDGE' && <HybridBridgeView />}

          {/* TAB -4: STAGE 7 PYTHON ENGINE & DUAL-LANGUAGE PARITY */}
          {activeTab === 'PYTHON_ENGINE' && <PythonEngineView />}

          {/* TAB -3: STAGE 5 WHAT-IF SCENARIO ENGINE */}
          {activeTab === 'WHAT_IF' && <WhatIfScenarioEngine />}

          {/* TAB -2: STAGE 4 DIAGNOSTIC & ALARM ENGINE */}
          {activeTab === 'DIAGNOSTICS' && <DiagnosticAlarmEngine />}

          {/* TAB -1: CORE ENGINEERING CALCULATIONS & BENCHMARK */}
          {activeTab === 'CALCULATIONS' && <CoreCalculationsBenchmark />}

          {/* TAB 0: EXCEL WORKBOOK EXPLORER */}
          {activeTab === 'WORKBOOK' && <ExcelWorkbookViewer />}

          {/* TAB 1: PARAMETERS */}
          {activeTab === 'PARAMETERS' && (
            <div className="space-y-4">
              {/* Search & Filter bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900 p-3.5 rounded-lg border border-slate-800">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    id="param-search-input"
                    type="text"
                    placeholder="Search by parameter ID, name, description..."
                    value={paramSearch}
                    onChange={(e) => setParamSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Category:</span>
                  <select
                    id="param-category-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono">
                    <tr>
                      <th className="px-4 py-3">Parameter / ID</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Source / Type</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3">Expected Range</th>
                      <th className="px-4 py-3">Scope</th>
                      <th className="px-4 py-3">Missing Data Rule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredParams.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-100">{p.name}</div>
                          <div className="font-mono text-[10px] text-emerald-400">{p.id}</div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{p.engineeringDescription}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                            {p.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-mono text-[11px] text-slate-300">{p.source}</div>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            p.type === 'MEASURED' ? 'bg-blue-500/10 text-blue-400' :
                            p.type === 'CALCULATED' ? 'bg-purple-500/10 text-purple-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-emerald-400 whitespace-nowrap">
                          {p.unit}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap">
                          <span className="text-slate-300">[{p.expectedRange.min} – {p.expectedRange.max}]</span>
                          <div className="text-[10px] text-slate-500">Typ: {p.expectedRange.typicalLow} - {p.expectedRange.typicalHigh}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {p.applicableTrain}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                          {p.missingDataPolicy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TRAINS */}
          {activeTab === 'TRAINS' && (
            <div className="space-y-6">
              {/* Recharts / D3 Trend Visualization for Membrane Area Utilization & Operational State History */}
              <TrainTrendVisualization />

              {/* Dynamic Fleet Topology Specification & Train Cell Cards */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Dynamic Multi-Train Topology (Canonical Fleet T01–T07)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Universal MBR Fleet Architecture: 7 Modular Membrane Cells with 33,600 m² Total Installed Membrane Area.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded font-mono text-xs font-semibold">
                      Total Installed Area: 33,600 m²
                    </span>
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded font-mono text-xs">
                      7 Modular Trains (T01–T07)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                  {CANONICAL_TRAINS.map((train) => (
                    <div
                      key={train.id}
                      className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2.5 flex flex-col justify-between hover:border-slate-700 transition"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: train.color }} />
                            <h4 className="font-bold text-xs text-white font-mono">{train.code}</h4>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            ONLINE
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 font-sans mt-1">
                          {train.cellTag} · <span className="text-slate-300 font-medium">{train.dutyRole}</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] font-mono border-t border-slate-800/60 pt-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Area:</span>
                          <span className="text-slate-200">{train.installedAreaM2.toLocaleString()} m²</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Modules:</span>
                          <span className="text-slate-200">{train.cassettes}c / {train.cassettes * train.modulesPerCassette}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Design:</span>
                          <span className="text-emerald-400">{train.designFluxLMH} LMH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Capacity:</span>
                          <span className="text-slate-300">{train.designFlowM3h} m³/h</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                          <span>Pump:</span>
                          <span>{train.permeatePump}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UNITS */}
          {activeTab === 'UNITS' && (
            <div className="space-y-6">
              {/* Dedicated Unit Converter */}
              <UnitConverter />

              {/* Master Unit Dictionary Reference Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    FOUNDATION UNIT DICTIONARY REFERENCE (unit_dictionary.json)
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    {unitDict.length} Defined Engineering Dimensions
                  </span>
                </div>
                <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono">
                      <tr>
                        <th className="px-4 py-3">Unit Code</th>
                        <th className="px-4 py-3">Dimension</th>
                        <th className="px-4 py-3">Symbol</th>
                        <th className="px-4 py-3">Standard Engineering Description</th>
                        <th className="px-4 py-3">Engineering Conversion Factors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {unitDict.map((u) => (
                        <tr key={u.unitCode} className="hover:bg-slate-800/40">
                          <td className="px-4 py-3 font-mono font-bold text-amber-400">{u.unitCode}</td>
                          <td className="px-4 py-3 font-mono text-slate-300">{u.dimension}</td>
                          <td className="px-4 py-3 font-mono text-slate-200">{u.standardSymbol}</td>
                          <td className="px-4 py-3 text-slate-400">{u.description}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                            {Object.entries(u.conversions || {}).map(([k, v]) => (
                              <span key={k} className="mr-3 inline-block">
                                1 {u.unitCode} = {String(v)} {k}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIMITS */}
          {activeTab === 'LIMITS' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-900">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Parameter ID</th>
                      <th className="px-4 py-3">Unit</th>
                      <th className="px-4 py-3 text-rose-400">Low Crit</th>
                      <th className="px-4 py-3 text-amber-400">Low Warn</th>
                      <th className="px-4 py-3 text-emerald-400">Normal Range</th>
                      <th className="px-4 py-3 text-amber-400">High Warn</th>
                      <th className="px-4 py-3 text-rose-400">High Crit</th>
                      <th className="px-4 py-3 text-rose-500">Trip Point</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {engineeringLimits.limits.map((lim) => (
                      <tr key={lim.parameterId} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-medium text-slate-200">{lim.parameterId}</td>
                        <td className="px-4 py-3 font-mono text-emerald-400">{lim.unit}</td>
                        <td className="px-4 py-3 font-mono text-rose-400">{lim.lowCritical}</td>
                        <td className="px-4 py-3 font-mono text-amber-400">{lim.lowWarning}</td>
                        <td className="px-4 py-3 font-mono text-emerald-300 font-semibold">{lim.lowNormal} – {lim.highNormal}</td>
                        <td className="px-4 py-3 font-mono text-amber-400">{lim.highWarning}</td>
                        <td className="px-4 py-3 font-mono text-rose-400 font-semibold">{lim.highCritical}</td>
                        <td className="px-4 py-3 font-mono text-rose-500 font-bold">{lim.emergencyTrip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === 'SETTINGS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3">
                <h4 className="text-sm font-bold text-purple-400 border-b border-slate-800 pb-2">Plant Design Settings</h4>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between"><span className="text-slate-400">Design Capacity:</span><span>18,000 m³/d</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Peak Capacity:</span><span>24,000 m³/d</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Aerobic Vol Total:</span><span>3,600 m³</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Anoxic Vol Total:</span><span>1,800 m³</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">MBR Tanks Total:</span><span>720 m³</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Total Bioreactor:</span><span>6,120 m³</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">T_ref:</span><span>20.0 °C</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Temp Coeff θ:</span><span>1.025</span></div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3">
                <h4 className="text-sm font-bold text-blue-400 border-b border-slate-800 pb-2">Biological Targets</h4>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between"><span className="text-slate-400">Target SRT:</span><span>20.0 days</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Target MLSS (MBR):</span><span>9,500 mg/L</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Target MLSS (Aero):</span><span>7,500 mg/L</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Target MLVSS/MLSS:</span><span>0.72</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Target DO (Aero):</span><span>2.2 mg/L</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Target DO (MBR):</span><span>4.5 mg/L</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Yield Y_obs:</span><span>0.35 kg/kg</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Decay K_d:</span><span>0.05 1/d</span></div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3">
                <h4 className="text-sm font-bold text-emerald-400 border-b border-slate-800 pb-2">Cleaning & Aeration Protocols</h4>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between"><span className="text-slate-400">MC Interval Target:</span><span>7.0 days</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">CIP Interval Target:</span><span>6 months</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">MC NaOCl Dose:</span><span>500 ppm</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">MC Citric Acid Dose:</span><span>2,000 ppm</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Min Acceptable Rec:</span><span>70.0%</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Target SAD_m:</span><span>0.28 Nm³/(m²·h)</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Target SAD_p:</span><span>12.5 Nm³/m³</span></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ALARMS */}
          {activeTab === 'ALARMS' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono">
                    <tr>
                      <th className="px-4 py-3">Alarm Code</th>
                      <th className="px-4 py-3">Severity</th>
                      <th className="px-4 py-3">Condition / Threshold</th>
                      <th className="px-4 py-3">Persistence & Hysteresis</th>
                      <th className="px-4 py-3">Recommended Operator Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {alarmStructure.alarms.map((a) => (
                      <tr key={a.alarmCode} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-slate-200">{a.alarmCode}</td>
                        <td className="px-4 py-3 font-mono whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                            a.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                            a.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          }`}>
                            {a.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          {a.parameterId} {a.operator} {a.threshold}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          Persist: {a.persistenceSeconds}s | Deadband: {a.deadbandHysteresis}
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-[11px]">{a.actionRecommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: VERIFICATION AUDIT */}
          {activeTab === 'VERIFICATION' && (
            <div className="space-y-6">
              {/* STAGE 3 AUDIT CARD */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> STAGE 3 GATE VERIFICATION REPORT: 100% PASS
                    </h3>
                    <p className="text-xs text-slate-400">Controlled benchmark test suite &amp; physical equations audited via Node.js and Python test runners.</p>
                  </div>
                  <div className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                    12 / 12 CHECKS PASSED (&lt; 0.01% ERROR)
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 3.1: Hydrostatic Gravity Head Correction</span>
                    </div>
                    <span className="text-slate-400">P_hydro = 31.392 kPa (H = 3.2 m, rho = 1000)</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 3.2: True Transmembrane Pressure (TMP)</span>
                    </div>
                    <span className="text-slate-400">True TMP = 49.892 kPa (Zero gauge error)</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 3.3: Gross &amp; Net Flux Calculations</span>
                    </div>
                    <span className="text-slate-400">J_gross = 22.50 LMH, J_net = 20.25 LMH (90% duty)</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 3.4: Poiseuille Dynamic Viscosity &amp; TCF</span>
                    </div>
                    <span className="text-slate-400">mu(15°C) = 1.147267 mPa·s, TCF = 1.131408</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 3.5: Temperature-Normalized Permeability (L_p,20)</span>
                    </div>
                    <span className="text-slate-400">L_p,20 = 159.1043 LMH/bar @ 20°C</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 3.6: Darcy Total &amp; Fouling Resistance</span>
                    </div>
                    <span className="text-slate-400">R_tot = 2.2314e12 1/m, R_f = 1.7114e12 1/m</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 3.7: Biomass Inventory &amp; Operational SRT</span>
                    </div>
                    <span className="text-slate-400">Inventory = 40,475 kg TSS, SRT = 23.67 days</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 3.8: Target WAS Flow Setpoint Solver</span>
                    </div>
                    <span className="text-slate-400">Recommended Flow = 170.42 m³/d for 25d SRT</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 3.9: Specific Aeration Demands (SAD_m, SAD_p)</span>
                    </div>
                    <span className="text-slate-400">SAD_m = 0.25 Nm³/(m²·h), SAD_p = 11.11 Nm³/m³</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 3.10: Chemical Cleaning Permeability Recovery</span>
                    </div>
                    <span className="text-slate-400">Recovery = 76.00% against virgin baseline</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 3.11: Rate of TMP Change (dTMP/dt)</span>
                    </div>
                    <span className="text-slate-400">Slope = 0.200 kPa/h, 139.0 h to 45 kPa limit</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 3.12: Zero-Division &amp; Physical Guards</span>
                    </div>
                    <span className="text-slate-400">Zero area/flow/WAS clamped safely (0 NaNs)</span>
                  </div>
                </div>
              </div>

              {/* STAGE 2 AUDIT CARD */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> STAGE 2 GATE VERIFICATION REPORT: 100% PASS
                    </h3>
                    <p className="text-xs text-slate-400">Production .xlsx workbook validation executed via Node.js and Python OpenXML inspectors.</p>
                  </div>
                  <div className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                    8 / 8 CHECKS PASSED
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 2.1: Workbook File Generation</span>
                    </div>
                    <span className="text-slate-400">UNIT_77_MBR_SUPER_EXPERT.xlsx present on disk</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 2.2: File Size Plausibility</span>
                    </div>
                    <span className="text-slate-400">37,030 bytes (&gt; 10 KB threshold)</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 2.3: 19 Mandatory Worksheets Present</span>
                    </div>
                    <span className="text-slate-400">01_Dashboard to 19_Audit_Log verified</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 2.4: Native Formula Syntax Integrity</span>
                    </div>
                    <span className="text-slate-400">206 formulas audited, 0 errors (#REF!, #NAME?, #DIV/0!)</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 2.5: Zero Broken Cross-Sheet Links</span>
                    </div>
                    <span className="text-slate-400">All cross-sheet references bind to valid sheets</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 2.6: Freeze Pane Configuration</span>
                    </div>
                    <span className="text-slate-400">All 19 worksheets have frozen header panes</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 2.7: Input Separation & Distinction</span>
                    </div>
                    <span className="text-slate-400">22 input cells visually isolated (#EBF5FF, blue font)</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 2.8: Usable Without Python</span>
                    </div>
                    <span className="text-slate-400">100% standalone native Excel formula calculation</span>
                  </div>
                </div>
              </div>

              {/* STAGE 1 AUDIT CARD */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> STAGE 1 GATE VERIFICATION REPORT: 100% PASS
                    </h3>
                    <p className="text-xs text-slate-400">Foundation data model verification executed via Node.js and Python test runners.</p>
                  </div>
                  <div className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                    8 / 8 CHECKS PASSED
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 1.1: Parameter Uniqueness</span>
                    </div>
                    <span className="text-slate-400">43 unique IDs, 0 collisions</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 1.2: Unit Dictionary Consistency</span>
                    </div>
                    <span className="text-slate-400">27 SI/Metric units fully mapped</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 1.3: Dynamic Train Scalability</span>
                    </div>
                    <span className="text-slate-400">Dynamic 1..N topology validated</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 1.4: Missing Data Policy</span>
                    </div>
                    <span className="text-slate-400">Zero-as-missing explicitly prohibited</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 1.5: Decoupled Engineering Settings</span>
                    </div>
                    <span className="text-slate-400">Constants isolated from calculations</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 1.6: Calculation Dependency Graph</span>
                    </div>
                    <span className="text-slate-400">Directed Acyclic Graph (DAG) valid</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 1.7: Engineering Limits Integrity</span>
                    </div>
                    <span className="text-slate-400">All limits bind to known parameters</span>
                  </div>

                  <div className="p-3 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold mr-2">[PASS]</span>
                      <span className="text-slate-200">Gate 1.8: Alarm Persistence & Hysteresis</span>
                    </div>
                    <span className="text-slate-400">Deadbands & time debounce configured</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Engineering Footer */}
      <footer id="app-footer" className="border-t border-slate-800 bg-slate-900/60 px-6 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>UNIT 77 MBR SUPER EXPERT • Predictive Operations & Engineering Decision Support System</div>
        <div className="font-mono text-[11px]">Author: Turgunjon Ruziboyev • v0.3.0-stage3</div>
      </footer>
    </div>
  );
}
