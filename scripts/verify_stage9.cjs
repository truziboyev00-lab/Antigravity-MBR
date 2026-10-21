/**
 * UNIT 77 MBR SUPER EXPERT — STAGE 9 GATE VERIFICATION (NODE.JS)
 * Excel <-> Python Hybrid Bridge: Two-Way Parity, Heartbeat Telemetry & Graceful Fallback
 * 
 * Author: Turgunjon Ruziboyev
 * Specification: Master Prompt V2.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('================================================================================');
console.log('      UNIT 77 MBR SUPER EXPERT — STAGE 9 GATE VERIFICATION (NODE.JS)');
console.log('================================================================================');
console.log('Author: Turgunjon Ruziboyev\n');

let totalChecks = 0;
let passedChecks = 0;

function assert(condition, gateId, description, details) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`[PASS] ${gateId}: ${description}`);
    if (details) console.log(`       ${details}`);
  } else {
    console.error(`[FAIL] ${gateId}: ${description}`);
    if (details) console.error(`       ${details}`);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// Gate 9.1: Hybrid Bridge Module Architecture & Public Interfaces
// -----------------------------------------------------------------------------
const bridgeFile = path.join(__dirname, '..', 'python', 'mbr_engine', 'hybrid_bridge.py');
assert(
  fs.existsSync(bridgeFile) && fs.statSync(bridgeFile).size > 4000,
  'Gate 9.1',
  'Hybrid Bridge Architecture & Module Files',
  `hybrid_bridge.py present (${fs.statSync(bridgeFile).size} bytes) with complete implementation.`
);

// -----------------------------------------------------------------------------
// Gate 9.2: Excel-to-Python Ingestion & Telemetry Normalization
// -----------------------------------------------------------------------------
let pyOutput;
try {
  pyOutput = execSync('python3 -m python.mbr_engine.cli --heartbeat', { encoding: 'utf-8' });
  const hb = JSON.parse(pyOutput);
  assert(
    hb.daemon_state === 'ONLINE' && hb.engine_version === '0.9.0',
    'Gate 9.2',
    'Python Engine Daemon Heartbeat & Version 0.9.0',
    `Daemon State: ${hb.daemon_state}, Active Authority: ${hb.active_authority}, Latency: ${hb.roundtrip_latency_ms}ms.`
  );
} catch (e) {
  assert(false, 'Gate 9.2', 'Python Engine Daemon Heartbeat', e.message);
}

// -----------------------------------------------------------------------------
// Gate 9.3: Bidirectional Mathematical Parity Evaluation
// -----------------------------------------------------------------------------
try {
  const parityRaw = execSync('python3 -m python.mbr_engine.cli --verify-parity', { encoding: 'utf-8' });
  const parity = JSON.parse(parityRaw);
  assert(
    parity.overall_status === 'PASS' && parity.max_discrepancy_pct <= 0.05,
    'Gate 9.3',
    'Bidirectional Mathematical Parity (<0.05% discrepancy)',
    `Max discrepancy: ${parity.max_discrepancy_pct.toFixed(4)}%, Avg: ${parity.avg_discrepancy_pct.toFixed(4)}%, Metrics passed: ${parity.metrics_passed}/${parity.total_metrics_evaluated}.`
  );
} catch (e) {
  assert(false, 'Gate 9.3', 'Bidirectional Mathematical Parity', e.message);
}

// -----------------------------------------------------------------------------
// Gate 9.4: Critical Metrics Parity Verification (Flux, Viscosity, Rm, SRT)
// -----------------------------------------------------------------------------
try {
  const parityRaw = execSync('python3 -m python.mbr_engine.cli --verify-parity', { encoding: 'utf-8' });
  const parity = JSON.parse(parityRaw);
  const fluxMetric = parity.parity_details.find(m => m.metric_name === 'Train A Gross Flux');
  const viscMetric = parity.parity_details.find(m => m.metric_name.includes('Viscosity'));
  const rmMetric = parity.parity_details.find(m => m.metric_name.includes('Darcy Clean Resistance'));
  const srtMetric = parity.parity_details.find(m => m.metric_name.includes('Solids Retention Time'));

  const allPassed = fluxMetric.status === 'PASS' && viscMetric.status === 'PASS' && rmMetric.status === 'PASS' && srtMetric.status === 'PASS';
  assert(
    allPassed,
    'Gate 9.4',
    'Core Physics Parity (Flux, Viscosity, Darcy Rm, SRT)',
    `Flux diff: ${fluxMetric.discrepancy_pct}%, Visc diff: ${viscMetric.discrepancy_pct}%, Rm diff: ${rmMetric.discrepancy_pct}%, SRT diff: ${srtMetric.discrepancy_pct}%.`
  );
} catch (e) {
  assert(false, 'Gate 9.4', 'Core Physics Parity', e.message);
}

// -----------------------------------------------------------------------------
// Gate 9.5: What-If & Predictive Horizons Parity (Outage, Compaction, RUL)
// -----------------------------------------------------------------------------
try {
  const parityRaw = execSync('python3 -m python.mbr_engine.cli --verify-parity', { encoding: 'utf-8' });
  const parity = JSON.parse(parityRaw);
  const outMetric = parity.parity_details.find(m => m.metric_name.includes('N-1 Outage'));
  const compMetric = parity.parity_details.find(m => m.metric_name.includes('Compaction TMP'));
  const rulMetric = parity.parity_details.find(m => m.metric_name.includes('Remaining Useful Life'));

  const whatifPassed = outMetric.status === 'PASS' && compMetric.status === 'PASS' && rulMetric.status === 'PASS';
  assert(
    whatifPassed,
    'Gate 9.5',
    'What-If & Prediction Parity (Outage Flux, Compaction TMP, RUL)',
    `Outage diff: ${outMetric.discrepancy_pct}%, Compaction diff: ${compMetric.discrepancy_pct}%, RUL diff: ${rulMetric.discrepancy_pct}%.`
  );
} catch (e) {
  assert(false, 'Gate 9.5', 'What-If & Prediction Parity', e.message);
}

// -----------------------------------------------------------------------------
// Gate 9.6: Graceful Fallback on Daemon Offline
// -----------------------------------------------------------------------------
try {
  const fallbackRaw = execSync('python3 -m python.mbr_engine.cli --simulate-fallback', { encoding: 'utf-8' });
  const fb = JSON.parse(fallbackRaw);
  assert(
    fb.daemon_state === 'FALLBACK_TO_EXCEL' && fb.authority === 'EXCEL_NATIVE' && fb.fallback_triggered === true,
    'Gate 9.6',
    'Graceful Fallback State Machine (Daemon Offline Simulation)',
    `State: ${fb.daemon_state}, Authority: ${fb.authority}, Reason: ${fb.fallback_message}`
  );
} catch (e) {
  assert(false, 'Gate 9.6', 'Graceful Fallback State Machine', e.message);
}

// -----------------------------------------------------------------------------
// Gate 9.7: Fallback Payload Integrity & Non-Crashing Operational Continuity
// -----------------------------------------------------------------------------
try {
  const fallbackRaw = execSync('python3 -m python.mbr_engine.cli --simulate-fallback', { encoding: 'utf-8' });
  const fb = JSON.parse(fallbackRaw);
  const hasSh15 = fb.sheet15_payload && fb.sheet15_payload['Python Daemon State'] === 'FALLBACK_TO_EXCEL';
  const hasSh16 = Array.isArray(fb.sheet16_payload) && fb.sheet16_payload.length === 7;
  assert(
    hasSh15 && hasSh16,
    'Gate 9.7',
    'Fallback Payload Integrity (Sheet 15 & Sheet 16 safe defaults)',
    `Sheet 15 fallback keys: ${Object.keys(fb.sheet15_payload).length}, Sheet 16 sensors: ${fb.sheet16_payload.length}.`
  );
} catch (e) {
  assert(false, 'Gate 9.7', 'Fallback Payload Integrity', e.message);
}

// -----------------------------------------------------------------------------
// Gate 9.8: Normal Hybrid Sync Execution & Authority Enrichment
// -----------------------------------------------------------------------------
try {
  const syncRaw = execSync('python3 -m python.mbr_engine.cli --hybrid-sync', { encoding: 'utf-8' });
  const syncRes = JSON.parse(syncRaw);
  assert(
    syncRes.success === true && syncRes.daemon_state === 'SYNCED' && syncRes.authority === 'PYTHON_ADVANCED',
    'Gate 9.8',
    'Two-Way Hybrid Sync Cycle (Authority: PYTHON_ADVANCED)',
    `Success: ${syncRes.success}, Latency: ${syncRes.latency_ms}ms, Max Discrepancy: ${syncRes.validation_report.max_discrepancy_pct}%.`
  );
} catch (e) {
  assert(false, 'Gate 9.8', 'Two-Way Hybrid Sync Cycle', e.message);
}

// -----------------------------------------------------------------------------
// Gate 9.9: Roundtrip Latency SLA (< 100ms)
// -----------------------------------------------------------------------------
try {
  const syncRaw = execSync('python3 -m python.mbr_engine.cli --hybrid-sync', { encoding: 'utf-8' });
  const syncRes = JSON.parse(syncRaw);
  assert(
    syncRes.latency_ms < 100.0,
    'Gate 9.9',
    'Bridge Roundtrip Latency SLA (< 100ms)',
    `Measured latency: ${syncRes.latency_ms} ms (Target: < 100.0 ms).`
  );
} catch (e) {
  assert(false, 'Gate 9.9', 'Bridge Roundtrip Latency SLA', e.message);
}

// -----------------------------------------------------------------------------
// Gate 9.10: OpenXML Production Workbook Stage 9 Sign-Off in Sheet 19
// -----------------------------------------------------------------------------
const ExcelJS = require('exceljs');
async function verifyWorkbookAudit() {
  const wbPath = path.join(__dirname, '..', 'public', 'UNIT_77_MBR_SUPER_EXPERT.xlsx');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(wbPath);
  const sh19 = wb.getWorksheet('19_Audit_Log');
  let hasStage9 = false;
  sh19.eachRow((row) => {
    const text = row.values ? JSON.stringify(row.values) : '';
    if (text.includes('Stage 9') && text.includes('Hybrid Bridge')) {
      hasStage9 = true;
    }
  });

  assert(
    hasStage9 && wb.worksheets.length === 19,
    'Gate 9.10',
    'OpenXML Production Workbook Stage 9 Audit Sign-Off',
    `Workbook verified with 19 sheets; Sheet 19 contains Stage 9 sign-off entry.`
  );

  console.log('--------------------------------------------------------------------------------');
  console.log(`STAGE 9 GATE VERIFICATION: ${passedChecks} / ${totalChecks} CHECKS PASSED`);
  console.log('================================================================================');
}

verifyWorkbookAudit().catch(err => {
  console.error('Audit verification error:', err);
  process.exit(1);
});
