# UNIT 77 MBR SUPER EXPERT — INSTALLATION & RUNTIME GUIDE

## 1. System Requirements & Architecture Overview
The UNIT 77 MBR Super Expert platform operates across three tiers:
1. **Excel Core Tier (Autonomous)**: Runs standalone in Microsoft Excel (Windows/Mac/Office 365) or LibreOffice. Zero macro execution required for native OpenXML formulas.
2. **Python 3.10+ Analytical Engine Tier**: Runs locally or as a system daemon providing non-linear physics models, Theil-Sen estimators, and multi-train optimization.
3. **Web Dashboard & API Tier (React + Vite + Tailwind)**: Real-time visual monitoring, interactive What-If simulation sandbox, and diagnostic telemetry viewer.

### Minimum Hardware
- CPU: Dual-Core 2.0 GHz or higher
- RAM: 4 GB minimum (8 GB recommended)
- Disk: 250 MB free space

### Software Dependencies
- Python: Python 3.10 or higher (`math`, `json`, `dataclasses`, `time`, `hashlib` — standard library only, zero heavy external ML dependencies required)
- Node.js: Node.js 18+ (LTS) & npm
- Spreadsheet: Microsoft Excel 2016+ or Excel 365 for optimal OpenXML dynamic array and calculation engine support.

---

## 2. Step-by-Step Installation

### 2.1 Clone / Extract Repository
```bash
git clone <repository_url> unit77_mbr_super_expert
cd unit77_mbr_super_expert
```

### 2.2 Python Engine Verification
Verify that Python 3.10+ is installed and verify all submodules compile:
```bash
python3 -V
python3 -m compileall python/
```

Execute the full suite of acceptance tests:
```bash
python3 python/verify_stage12c.py
```

### 2.3 Web Dashboard Setup
Install Node dependencies and verify the build:
```bash
npm install
npm run lint
npm run build
```

To run the local development server:
```bash
npm run dev
```
Open browser to `http://localhost:3000`.

---

## 3. Production Deployment & Excel Bridge Configuration

### 3.1 Production Workbook Location
The primary certified production workbook is located at:
- Root: `UNIT_77_MBR_SUPER_EXPERT.xlsx`
- Web Static Distribution: `public/UNIT_77_MBR_SUPER_EXPERT.xlsx`

Both files share identical SHA-256 binary checksums (`c777a74aa39960eb...`).

### 3.2 Running the Python Analytical Engine
To run single-cycle telemetry evaluation:
```bash
python3 -c "from python.mbr_engine.super_expert import evaluate_plant; print(evaluate_plant())"
```

To execute hybrid Excel-to-Python synchronization:
```bash
python3 -c "from python.mbr_engine.hybrid_bridge import HybridBridgeManager; bridge = HybridBridgeManager(); print(bridge.execute_hybrid_sync())"
```

---

## 4. Fallback Verification
If the Python engine is stopped or unavailable:
1. Open `UNIT_77_MBR_SUPER_EXPERT.xlsx` directly in Excel.
2. Excel Core immediately assumes active authority (`EXCEL_NATIVE`).
3. All hydraulic calculations, biological mass balances, and hysteresis alarms continue to calculate natively via OpenXML formulas.
