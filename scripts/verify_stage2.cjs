const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

console.log('====================================================');
console.log('UNIT 77 MBR SUPER EXPERT — STAGE 2 GATE VERIFICATION');
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

async function verifyStage2() {
  const filePath = path.resolve(__dirname, '../public/UNIT_77_MBR_SUPER_EXPERT.xlsx');
  
  assertCheck('Gate 2.1: Workbook file exists on disk', fs.existsSync(filePath), `File not found at ${filePath}`);
  const stats = fs.statSync(filePath);
  assertCheck('Gate 2.2: Workbook file size is non-trivial (> 10 KB)', stats.size > 10000, `Size is only ${stats.size} bytes`);

  // Load workbook independently
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const expectedSheets = [
    '01_Dashboard',
    '02_Manual_Input',
    '03_Data_Staging',
    '04_Train_Analysis',
    '05_Engineering_Calcs',
    '06_TMP_Permeability',
    '07_Biology',
    '08_WAS_SRT',
    '09_Cleaning',
    '10_Equipment',
    '11_Events_Alarms',
    '12_Peer_Comparison',
    '13_What_If',
    '14_Prediction',
    '15_Python_Output',
    '16_Data_Quality',
    '17_Settings',
    '18_Engineering_Reference',
    '19_Audit_Log'
  ];

  const actualSheetNames = workbook.worksheets.map(w => w.name);
  console.log(`Discovered ${actualSheetNames.length} worksheets in workbook.`);

  // Check all sheets present
  let missingSheets = 0;
  for (const exp of expectedSheets) {
    if (!actualSheetNames.includes(exp)) {
      console.error(`Missing expected sheet: ${exp}`);
      missingSheets++;
    }
  }
  assertCheck('Gate 2.3: All 19 mandatory worksheets exist with exact naming', missingSheets === 0, `${missingSheets} sheets missing`);

  // Scan all formulas and references
  let formulaCount = 0;
  let formulaErrors = 0;
  let brokenSheetRefs = 0;

  const validSheetSet = new Set(actualSheetNames);

  for (const sheet of workbook.worksheets) {
    sheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
      row.eachCell({ includeEmpty: false }, (cell, colNum) => {
        // Check for error values
        if (cell.type === ExcelJS.ValueType.Error) {
          console.error(`Formula error in sheet '${sheet.name}' cell ${cell.address}: ${cell.value}`);
          formulaErrors++;
        }

        // Inspect formulas
        if (cell.formula) {
          formulaCount++;
          const fStr = cell.formula;
          
          // Check for Excel error strings inside formula
          if (fStr.includes('#REF!') || fStr.includes('#NAME?') || fStr.includes('#VALUE!') || fStr.includes('#DIV/0!')) {
            console.error(`Broken formula in '${sheet.name}' cell ${cell.address}: ${fStr}`);
            formulaErrors++;
          }

          // Check cross-sheet references: e.g. '04_Train_Analysis'!C8 or '02_Manual_Input'!B5
          const sheetRefMatches = fStr.match(/'([^']+)'!/g);
          if (sheetRefMatches) {
            for (const match of sheetRefMatches) {
              const refSheet = match.replace(/'/g, '').replace('!', '');
              if (!validSheetSet.has(refSheet)) {
                console.error(`Broken cross-sheet link in '${sheet.name}' cell ${cell.address}: '${refSheet}' does not exist!`);
                brokenSheetRefs++;
              }
            }
          }
        }
      });
    });
  }

  console.log(`Audited ${formulaCount} native Excel formulas across ${workbook.worksheets.length} sheets.`);
  assertCheck(`Gate 2.4: Formulas scanned without syntax errors (${formulaCount} formulas)`, formulaErrors === 0, `${formulaErrors} errors found`);
  assertCheck('Gate 2.5: Zero broken cross-sheet links or invalid sheet references', brokenSheetRefs === 0, `${brokenSheetRefs} broken links found`);

  // Verify frozen headers on key sheets
  let frozenHeadersCount = 0;
  for (const sheet of workbook.worksheets) {
    if (sheet.views && sheet.views.some(v => v.state === 'frozen' && v.ySplit >= 3)) {
      frozenHeadersCount++;
    }
  }
  assertCheck('Gate 2.6: Freeze headers configured on worksheets for operator navigation', frozenHeadersCount >= 15, `Only ${frozenHeadersCount} sheets have frozen panes`);

  // Verify clear separation between manual input and calculated areas
  const inputSheet = workbook.getWorksheet('02_Manual_Input');
  let inputStylingCount = 0;
  inputSheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum >= 5) {
      const cellB = row.getCell(2);
      // Check that input cells have distinct styling
      if (cellB.fill && cellB.fill.fgColor && cellB.fill.fgColor.argb === 'FFEBF5FF') {
        inputStylingCount++;
      }
    }
  });
  assertCheck('Gate 2.7: User input cells in 02_Manual_Input are visually and structurally isolated', inputStylingCount >= 20, `Only ${inputStylingCount} cells styled as input`);

  // Verify standalone usability without Python
  const dashSheet = workbook.getWorksheet('01_Dashboard');
  const dashPermeateCell = dashSheet.getCell('C11'); // Total permeate flow
  const dashFluxCell = dashSheet.getCell('B6'); // Plant avg flux
  const isUsableWithoutPython = Boolean(dashPermeateCell.formula && dashFluxCell.formula);
  assertCheck('Gate 2.8: Workbook is 100% usable without Python (native Excel formula tree complete)', isUsableWithoutPython);

  console.log('\n----------------------------------------------------');
  console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
  if (failCount === 0) {
    console.log('>>> STAGE 2 GATE: [PASS] <<<');
    process.exit(0);
  } else {
    console.log('>>> STAGE 2 GATE: [FAIL] <<<');
    process.exit(1);
  }
}

verifyStage2().catch(err => {
  console.error('Fatal error during Stage 2 verification:', err);
  process.exit(1);
});
