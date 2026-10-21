#!/usr/bin/env python3
"""
UNIT 77 MBR SUPER EXPERT — STAGE 2 PYTHON GATE VERIFICATION
Author: Turgunjon Ruziboyev

Inspects the OpenXML structure of UNIT_77_MBR_SUPER_EXPERT.xlsx using Python's
built-in zipfile and xml.etree.ElementTree to independently verify sheets,
formula tags, and workbook integrity without external dependencies.
"""

import os
import sys
import zipfile
import xml.etree.ElementTree as ET

def verify_stage2_python():
    print("=" * 52)
    print("UNIT 77 MBR SUPER EXPERT — STAGE 2 PYTHON GATE AUDIT")
    print("Author: Turgunjon Ruziboyev")
    print("=" * 52 + "\n")

    xlsx_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'UNIT_77_MBR_SUPER_EXPERT.xlsx')
    assert os.path.exists(xlsx_path), f"File not found: {xlsx_path}"
    file_size = os.path.getsize(xlsx_path)
    print(f"[PASS] Python: Workbook located ({file_size:,} bytes).")

    with zipfile.ZipFile(xlsx_path, 'r') as zf:
        namelist = zf.namelist()
        assert 'xl/workbook.xml' in namelist, "Corrupt OpenXML: xl/workbook.xml missing"

        # Parse workbook.xml to extract sheet names
        wb_xml = zf.read('xl/workbook.xml')
        root = ET.fromstring(wb_xml)
        ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        
        sheets = root.findall('.//main:sheet', ns)
        sheet_names = [s.attrib['name'] for s in sheets]
        print(f"[PASS] Python: Discovered {len(sheet_names)} sheets in OpenXML manifest.")

        expected_sheets = [
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
        ]

        for s in expected_sheets:
            assert s in sheet_names, f"Expected sheet '{s}' missing in OpenXML workbook!"
        print(f"[PASS] Python: All 19 mandatory worksheets verified in OpenXML manifest.")

        # Scan all sheet XML files for formula elements (<f>)
        total_formulas = 0
        error_count = 0
        for name in namelist:
            if name.startswith('xl/worksheets/sheet') and name.endswith('.xml'):
                sheet_xml = zf.read(name)
                s_root = ET.fromstring(sheet_xml)
                formula_nodes = s_root.findall('.//main:f', ns)
                total_formulas += len(formula_nodes)
                for f_node in formula_nodes:
                    f_text = f_node.text or ''
                    if '#REF!' in f_text or '#NAME?' in f_text or '#DIV/0!' in f_text:
                        print(f"Error in formula: {f_text}")
                        error_count += 1

        print(f"[PASS] Python: Audited {total_formulas} formula definitions across worksheet XMLs.")
        assert error_count == 0, f"Encountered {error_count} formula errors in OpenXML."
        assert total_formulas > 50, "Formula density is below expected engineering requirements."

    print("\n>>> STAGE 2 PYTHON GATE: [PASS] <<<")
    return 0

if __name__ == '__main__':
    sys.exit(verify_stage2_python())
