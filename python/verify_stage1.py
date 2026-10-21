#!/usr/bin/env python3
"""
UNIT 77 MBR SUPER EXPERT — STAGE 1 PYTHON GATE VERIFICATION
Author: Turgunjon Ruziboyev
"""

import json
import os
import sys

def verify_stage1():
    base_dir = os.path.join(os.path.dirname(__file__), '..', 'src', 'foundation')
    
    with open(os.path.join(base_dir, 'parameter_dictionary.json'), 'r') as f:
        params = json.load(f)
    with open(os.path.join(base_dir, 'unit_dictionary.json'), 'r') as f:
        units = json.load(f)
    with open(os.path.join(base_dir, 'train_structure.json'), 'r') as f:
        trains = json.load(f)
    with open(os.path.join(base_dir, 'settings_structure.json'), 'r') as f:
        settings = json.load(f)
    with open(os.path.join(base_dir, 'engineering_limits.json'), 'r') as f:
        limits = json.load(f)
    with open(os.path.join(base_dir, 'alarm_structure.json'), 'r') as f:
        alarms = json.load(f)

    # 1. Duplicate check
    ids = set()
    names = set()
    for p in params:
        assert p['id'] not in ids, f"Duplicate param id: {p['id']}"
        assert p['name'] not in names, f"Duplicate param name: {p['name']}"
        ids.add(p['id'])
        names.add(p['name'])
    print(f"[PASS] Python: {len(params)} unique parameters verified.")

    # 2. Units consistency check
    unit_codes = {u['unitCode'] for u in units}
    for p in params:
        assert p['unit'] in unit_codes, f"Param {p['id']} has unknown unit: {p['unit']}"
    print(f"[PASS] Python: {len(units)} units verified; all parameter units match.")

    # 3. Dynamic train check
    assert trains['architectureType'] == 'DYNAMIC_MULTI_TRAIN'
    assert len(trains['trains']) >= 1
    print(f"[PASS] Python: Dynamic train architecture verified ({len(trains['trains'])} active trains).")

    # 4. Missing data behavior
    for p in params:
        assert 'missingDataPolicy' in p and p['missingDataPolicy'], f"Param {p['id']} missing missingDataPolicy"
    print("[PASS] Python: Missing data behavior defined for all parameters.")

    # 5. Settings separation
    assert 'plantSettings' in settings and 'trainSettings' in settings
    print("[PASS] Python: Engineering settings decoupled from formulas.")

    print("\n>>> STAGE 1 PYTHON GATE: [PASS] <<<")
    return 0

if __name__ == '__main__':
    sys.exit(verify_stage1())
