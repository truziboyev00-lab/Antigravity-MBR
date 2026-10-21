const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('UNIT 77 MBR SUPER EXPERT — STAGE 1 GATE VERIFICATION');
console.log('Author: Turgunjon Ruziboyev');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assertCheck(name, condition, errorMsg = '') {
  if (condition) {
    console.log(`[PASS] ${name}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${name}: ${errorMsg}`);
    failCount++;
  }
}

try {
  const baseDir = path.resolve(__dirname, '../src/foundation');
  
  // 1. Load files
  const params = JSON.parse(fs.readFileSync(path.join(baseDir, 'parameter_dictionary.json'), 'utf8'));
  const units = JSON.parse(fs.readFileSync(path.join(baseDir, 'unit_dictionary.json'), 'utf8'));
  const trains = JSON.parse(fs.readFileSync(path.join(baseDir, 'train_structure.json'), 'utf8'));
  const timestamps = JSON.parse(fs.readFileSync(path.join(baseDir, 'timestamp_structure.json'), 'utf8'));
  const dqFlags = JSON.parse(fs.readFileSync(path.join(baseDir, 'data_quality_flags.json'), 'utf8'));
  const limits = JSON.parse(fs.readFileSync(path.join(baseDir, 'engineering_limits.json'), 'utf8'));
  const settings = JSON.parse(fs.readFileSync(path.join(baseDir, 'settings_structure.json'), 'utf8'));
  const cleaning = JSON.parse(fs.readFileSync(path.join(baseDir, 'cleaning_event_structure.json'), 'utf8'));
  const equipment = JSON.parse(fs.readFileSync(path.join(baseDir, 'equipment_structure.json'), 'utf8'));
  const alarms = JSON.parse(fs.readFileSync(path.join(baseDir, 'alarm_structure.json'), 'utf8'));

  console.log(`Loaded ${params.length} parameters, ${units.length} units, ${trains.trains.length} configured trains.\n`);

  // Gate Check 1: No duplicate parameter definitions exist
  const paramIds = new Set();
  const paramNames = new Set();
  let duplicateParams = 0;
  for (const p of params) {
    if (paramIds.has(p.id)) {
      console.error(`Duplicate parameter ID: ${p.id}`);
      duplicateParams++;
    }
    if (paramNames.has(p.name)) {
      console.error(`Duplicate parameter name: ${p.name}`);
      duplicateParams++;
    }
    paramIds.add(p.id);
    paramNames.add(p.name);
  }
  assertCheck('Gate 1.1: No duplicate parameter IDs or names', duplicateParams === 0, `${duplicateParams} duplicates found`);

  // Gate Check 2: Units are consistent
  const knownUnits = new Set(units.map(u => u.unitCode));
  let invalidUnits = 0;
  for (const p of params) {
    if (!knownUnits.has(p.unit)) {
      console.error(`Parameter ${p.id} has unregistered unit: '${p.unit}'`);
      invalidUnits++;
    }
  }
  assertCheck('Gate 1.2: All parameter units are defined in Unit Dictionary', invalidUnits === 0, `${invalidUnits} unknown units found`);

  // Gate Check 3: Dynamic train architecture
  const isDynamicTrain = trains.architectureType === 'DYNAMIC_MULTI_TRAIN' && 
                        trains.minTrains >= 1 && 
                        trains.maxTrains >= trains.trains.length && 
                        Array.isArray(trains.trains);
  assertCheck('Gate 1.3: Train architecture is dynamic (1..N trains scalable)', isDynamicTrain);

  // Gate Check 4: Missing data behavior defined for every parameter
  let missingPolicyCount = 0;
  for (const p of params) {
    if (p.missingDataPolicy && p.missingDataPolicy.length > 0) {
      missingPolicyCount++;
    }
  }
  assertCheck('Gate 1.4: Missing-data behavior explicitly defined for all parameters', missingPolicyCount === params.length, `Only ${missingPolicyCount}/${params.length} defined`);

  // Gate Check 5: Engineering settings separated from formulas
  const settingsSeparated = settings.plantSettings && 
                           settings.trainSettings && 
                           settings.biologicalSettings && 
                           settings.cleaningSettings &&
                           settings.aerationSettings &&
                           settings.trainSettings.membraneAreaPerTrainM2 > 0 &&
                           settings.trainSettings.cleanMembraneResistanceRm > 0;
  assertCheck('Gate 1.5: Engineering settings and membrane parameters separated from formulas', Boolean(settingsSeparated));

  // Gate Check 6: Calculation dependency graph (no unknown dependency)
  let unknownDeps = 0;
  for (const p of params) {
    for (const dep of p.calculationDependency) {
      if (!paramIds.has(dep)) {
        console.error(`Parameter ${p.id} depends on unknown parameter: ${dep}`);
        unknownDeps++;
      }
    }
  }
  assertCheck('Gate 1.6: Calculation dependency integrity (all dependencies exist)', unknownDeps === 0, `${unknownDeps} unknown dependencies`);

  // Gate Check 7: Engineering limits match parameters
  let unknownLimitParams = 0;
  for (const lim of limits.limits) {
    if (!paramIds.has(lim.parameterId)) {
      console.error(`Limit defined for unknown parameter: ${lim.parameterId}`);
      unknownLimitParams++;
    }
  }
  assertCheck('Gate 1.7: Engineering limits mapped to valid parameters', unknownLimitParams === 0);

  // Gate Check 8: Alarms mapped to valid parameters and have hysteresis
  let invalidAlarms = 0;
  for (const alm of alarms.alarms) {
    if (!paramIds.has(alm.parameterId)) {
      console.error(`Alarm defined for unknown parameter: ${alm.parameterId}`);
      invalidAlarms++;
    }
    if (alm.persistenceSeconds === undefined || alm.deadbandHysteresis === undefined) {
      console.error(`Alarm missing persistence or hysteresis: ${alm.alarmCode}`);
      invalidAlarms++;
    }
  }
  assertCheck('Gate 1.8: Alarms have valid parameter mappings, persistence, and hysteresis', invalidAlarms === 0);

  console.log('\n----------------------------------------------------');
  console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  if (failCount === 0) {
    console.log('>>> STAGE 1 GATE: [PASS] <<<');
    process.exit(0);
  } else {
    console.log('>>> STAGE 1 GATE: [FAIL] <<<');
    process.exit(1);
  }
} catch (err) {
  console.error('Fatal error in Stage 1 Gate Verification:', err);
  process.exit(1);
}
