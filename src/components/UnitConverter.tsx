import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Calculator, 
  Copy, 
  Check, 
  Search, 
  Info, 
  Sparkles, 
  RotateCcw,
  Gauge,
  TrendingUp,
  Hash,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  CheckCircle2,
  UploadCloud,
  FileUp,
  FileText,
  Download,
  Trash2,
  Table,
  Layers,
  AlertTriangle,
  AlertCircle,
  BarChart2,
  History,
  Clock,
  Play
} from 'lucide-react';
import unitDictionary from '../foundation/unit_dictionary.json';

interface UnitDictionaryEntry {
  unitCode: string;
  dimension: string;
  baseUnit: string;
  standardSymbol: string;
  description: string;
  conversions: Record<string, number>;
}

const typedUnitDict = unitDictionary as UnitDictionaryEntry[];

// Friendly labels and metadata for units not defined as primary root entries
const UNIT_METADATA_EXTRAS: Record<string, { symbol?: string; description?: string; dimension?: string }> = {
  GFD: { symbol: 'gal/(ft²·d)', description: 'Gallons per square foot per day (US customary membrane flux)', dimension: 'FLUX' },
  'm/s': { symbol: 'm/s', description: 'Meters per second (Darcy superficial velocity)', dimension: 'FLUX' },
  'm3/(m2*d)': { symbol: 'm³/(m²·d)', description: 'Cubic meters per square meter per day', dimension: 'FLUX' },
  bar: { symbol: 'bar', description: 'Bar (100 kPa, standard metric pressure)', dimension: 'PRESSURE' },
  mbar: { symbol: 'mbar', description: 'Millibar (0.1 kPa)', dimension: 'PRESSURE' },
  psi: { symbol: 'psi', description: 'Pounds per square inch (US customary pressure)', dimension: 'PRESSURE' },
  m_H2O: { symbol: 'm H₂O', description: 'Meters of water column pressure head', dimension: 'PRESSURE' },
  Pa: { symbol: 'Pa', description: 'Pascal (SI base pressure unit)', dimension: 'PRESSURE' },
  'LMH/kPa': { symbol: 'L/(m²·h·kPa)', description: 'Specific Flux normalized to kPa', dimension: 'PERMEABILITY' },
  'm/(s*Pa)': { symbol: 'm/(s·Pa)', description: 'SI Darcy membrane permeability', dimension: 'PERMEABILITY' },
  'L/s': { symbol: 'L/s', description: 'Liters per second', dimension: 'FLOW' },
  'L/min': { symbol: 'L/min', description: 'Liters per minute', dimension: 'FLOW' },
  'm3/d': { symbol: 'm³/d', description: 'Cubic meters per day (plant throughput / sludge)', dimension: 'FLOW' },
  MGD: { symbol: 'MGD', description: 'Million gallons per day (US customary flowrate)', dimension: 'FLOW' },
  gpm: { symbol: 'gpm', description: 'US gallons per minute (pump discharge rate)', dimension: 'FLOW' },
  SCFM: { symbol: 'SCFM', description: 'Standard cubic feet per minute (US scour air flow)', dimension: 'FLOW' },
  'Nm3/min': { symbol: 'Nm³/min', description: 'Normal cubic meters per minute', dimension: 'FLOW' },
  'scf/gal': { symbol: 'scf/gal', description: 'Standard cubic feet per gallon permeate', dimension: 'RATIO' },
  'scfm/ft2': { symbol: 'scfm/ft²', description: 'SCFM per square foot membrane area (US SADm)', dimension: 'RATIO' },
  K: { symbol: 'K', description: 'Kelvin absolute temperature', dimension: 'TEMPERATURE' },
  'g/L': { symbol: 'g/L', description: 'Grams per liter (bioreactor MLSS dry solids)', dimension: 'CONCENTRATION' },
  'kg/m3': { symbol: 'kg/m³', description: 'Kilograms per cubic meter', dimension: 'CONCENTRATION' },
  ppm: { symbol: 'ppm', description: 'Parts per million (mass/volume ratio ≈ mg/L in water)', dimension: 'CONCENTRATION' },
  min: { symbol: 'min', description: 'Minutes (filtration cycle, backwash steps)', dimension: 'TIME' },
  mm: { symbol: 'mm', description: 'Millimeters', dimension: 'LENGTH' },
  ft: { symbol: 'ft', description: 'Feet (tank depth, elevation)', dimension: 'LENGTH' },
  ft2: { symbol: 'ft²', description: 'Square feet (US membrane cassette area)', dimension: 'AREA' },
  g: { symbol: 'g', description: 'Grams', dimension: 'MASS' },
  lb: { symbol: 'lb', description: 'Pounds (mass)', dimension: 'MASS' },
  ton: { symbol: 't', description: 'Metric tons (dry cake solids)', dimension: 'MASS' },
  'lb/d': { symbol: 'lb/d', description: 'Pounds per day (US solids wasting rate)', dimension: 'MASS_RATE' },
  'kg/h': { symbol: 'kg/h', description: 'Kilograms per hour', dimension: 'MASS_RATE' },
  '1/cm': { symbol: 'cm⁻¹', description: 'Reciprocal centimeters', dimension: 'RESISTANCE' },
  'bar/d': { symbol: 'bar/d', description: 'Bar per day TMP rise rate', dimension: 'RATE_OF_CHANGE' },
  'mbar/min': { symbol: 'mbar/min', description: 'Millibar per minute TMP rise rate', dimension: 'RATE_OF_CHANGE' },
  'LMH/bar/h': { symbol: 'LMH/(bar·h)', description: 'Permeability decay rate per hour', dimension: 'RATE_OF_CHANGE' },
  FNU: { symbol: 'FNU', description: 'Formazin Nephelometric Units', dimension: 'TURBIDITY' },
  'MJ/m3': { symbol: 'MJ/m³', description: 'Megajoules per cubic meter permeate', dimension: 'ENERGY' },
  'kWh/kgal': { symbol: 'kWh/kgal', description: 'Kilowatt-hours per thousand gallons', dimension: 'ENERGY' },
  fraction: { symbol: 'ratio', description: 'Decimal ratio (0.01 = 1%)', dimension: 'RATIO' }
};

interface ConversionGraphEdge {
  to: string;
  factor: number;
}

interface UnitAutocompleteDropdownProps {
  id?: string;
  value: string;
  onChange: (unitCode: string) => void;
  label: string;
  accentColor: 'amber' | 'emerald';
  allUnits: string[];
  unitMetaMap: Record<string, { code: string; dimension: string; symbol: string; description: string }>;
  compatibleUnits?: string[];
  conversionFactors?: Record<string, number | null>;
  sourceUnitCode?: string;
  placeholder?: string;
}

export function UnitAutocompleteDropdown({
  id,
  value,
  onChange,
  label,
  accentColor,
  allUnits,
  unitMetaMap,
  compatibleUnits,
  conversionFactors,
  sourceUnitCode,
  placeholder
}: UnitAutocompleteDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDimension, setSelectedDimension] = useState<string>('ALL');
  const [onlyCompatible, setOnlyCompatible] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const currentMeta = unitMetaMap[value];

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Available dimensions for quick filtering
  const dimensions = useMemo(() => {
    const dimSet = new Set<string>();
    allUnits.forEach(code => {
      const d = unitMetaMap[code]?.dimension;
      if (d) dimSet.add(d);
    });
    return ['ALL', ...Array.from(dimSet).sort()];
  }, [allUnits, unitMetaMap]);

  // Dynamically filter units
  const filteredUnits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const cleanQ = q.replace(/[\s\-_/·()³²*]/g, '');

    return allUnits.filter(code => {
      const meta = unitMetaMap[code];
      const isCompat = compatibleUnits ? compatibleUnits.includes(code) : true;

      // Filter by compatibility
      if (onlyCompatible && compatibleUnits && !isCompat) {
        return false;
      }

      // Filter by selected dimension pill
      if (selectedDimension !== 'ALL' && meta?.dimension !== selectedDimension) {
        return false;
      }

      if (!q) return true;

      const codeLower = code.toLowerCase();
      const codeClean = codeLower.replace(/[\s\-_/·()³²*]/g, '');
      const symLower = (meta?.symbol || '').toLowerCase();
      const symClean = symLower.replace(/[\s\-_/·()³²*]/g, '');
      const dimLower = (meta?.dimension || '').toLowerCase();
      const descLower = (meta?.description || '').toLowerCase();

      // Textual matching
      if (codeLower.includes(q) || codeClean.includes(cleanQ)) return true;
      if (symLower.includes(q) || symClean.includes(cleanQ)) return true;
      if (dimLower.includes(q)) return true;
      if (descLower.includes(q)) return true;

      // Operator aliases
      if ((q === 'c' || q === 'celsius' || q === 'temp' || q === 'temperature') && (code === '°C' || code === 'K')) return true;
      if ((q === 'darcy' || q === 'velocity') && (code === 'm/s' || code === 'm/(s*Pa)')) return true;
      if ((q === 'mlss' || q === 'solids') && (code === 'mg/L' || code === 'g/L' || code === 'ppm' || code === 'kg/m3')) return true;
      if ((q === 'tmp' || q === 'head') && meta?.dimension === 'PRESSURE') return true;
      if (q === 'flux' && meta?.dimension === 'FLUX') return true;
      if (q === 'flow' && meta?.dimension === 'FLOW') return true;

      return false;
    }).sort((a, b) => {
      // If compatibleUnits is provided, prioritize compatible units first
      if (compatibleUnits) {
        const aCompat = compatibleUnits.includes(a);
        const bCompat = compatibleUnits.includes(b);
        if (aCompat && !bCompat) return -1;
        if (!aCompat && bCompat) return 1;
      }
      // Exact query match comes first
      if (a.toLowerCase() === q && b.toLowerCase() !== q) return -1;
      if (b.toLowerCase() === q && a.toLowerCase() !== q) return 1;
      return a.localeCompare(b);
    });
  }, [allUnits, unitMetaMap, searchQuery, selectedDimension, onlyCompatible, compatibleUnits]);

  // Scroll into view helper
  const scrollToItem = (index: number) => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[data-unit-option]');
      const targetEl = items[index] as HTMLElement | undefined;
      if (targetEl) {
        targetEl.scrollIntoView({ block: 'nearest' });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => {
        const next = prev < filteredUnits.length - 1 ? prev + 1 : 0;
        scrollToItem(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => {
        const next = prev > 0 ? prev - 1 : filteredUnits.length - 1;
        scrollToItem(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredUnits[highlightedIndex]) {
        handleSelect(filteredUnits[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleSelect = (unitCode: string) => {
    onChange(unitCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  const accentBorder = accentColor === 'amber' ? 'hover:border-amber-400 focus:border-amber-400' : 'hover:border-emerald-400 focus:border-emerald-400';
  const accentText = accentColor === 'amber' ? 'text-amber-400' : 'text-emerald-400';
  const accentRing = accentColor === 'amber' ? 'focus:ring-amber-400' : 'focus:ring-emerald-400';

  return (
    <div className="relative w-full" ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
            setSearchQuery('');
            setHighlightedIndex(0);
          } else {
            setIsOpen(false);
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`w-full flex items-center justify-between gap-2 bg-slate-900/90 border ${
          isOpen 
            ? (accentColor === 'amber' ? 'border-amber-400 ring-1 ring-amber-400/50' : 'border-emerald-400 ring-1 ring-emerald-400/50') 
            : 'border-slate-700/80'
        } ${accentBorder} rounded-lg px-3 py-2.5 text-left transition shadow-sm focus:outline-none`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`text-base font-mono font-extrabold ${accentText}`}>
            {value}
          </span>
          <span className="text-xs font-mono text-slate-300 truncate">
            [{currentMeta?.symbol || value}]
          </span>
          {currentMeta?.dimension && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700">
              {currentMeta.dimension}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
          <span className="text-[10px] font-mono hidden md:inline text-slate-500">Search</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-400' : 'text-slate-400'}`} />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/80 p-3 space-y-2.5">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder={placeholder || `Search ${label.toLowerCase()} (code, symbol, dimension, keyword)...`}
              className={`w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-8 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 ${accentRing} ${accentBorder}`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setHighlightedIndex(0);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
            {compatibleUnits && (
              <button
                type="button"
                onClick={() => {
                  setOnlyCompatible(!onlyCompatible);
                  setHighlightedIndex(0);
                }}
                className={`px-2 py-0.5 rounded-full border transition flex items-center gap-1 whitespace-nowrap ${
                  onlyCompatible 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold' 
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>✓ Compatible Only ({compatibleUnits.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedDimension('ALL');
                setHighlightedIndex(0);
              }}
              className={`px-2 py-0.5 rounded border transition whitespace-nowrap ${
                selectedDimension === 'ALL'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              All Dimensions
            </button>

            {dimensions.filter(d => d !== 'ALL').slice(0, 7).map(dim => (
              <button
                key={dim}
                type="button"
                onClick={() => {
                  setSelectedDimension(dim === selectedDimension ? 'ALL' : dim);
                  setHighlightedIndex(0);
                }}
                className={`px-2 py-0.5 rounded border transition whitespace-nowrap ${
                  selectedDimension === dim
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {dim}
              </button>
            ))}
          </div>

          {/* Dynamic Units List */}
          <div
            ref={listRef}
            role="listbox"
            className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 rounded-lg border border-slate-800 bg-slate-950/80 p-1 space-y-0.5"
          >
            {filteredUnits.length > 0 ? (
              filteredUnits.map((code, index) => {
                const meta = unitMetaMap[code];
                const isSelected = code === value;
                const isHighlighted = index === highlightedIndex;
                const isCompat = compatibleUnits ? compatibleUnits.includes(code) : true;
                const factor = conversionFactors && conversionFactors[code] !== undefined ? conversionFactors[code] : null;

                return (
                  <div
                    key={code}
                    data-unit-option
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(code)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`p-2.5 rounded-md cursor-pointer transition flex flex-col gap-1 ${
                      isHighlighted ? 'bg-slate-800/90 text-slate-100' : 'hover:bg-slate-800/50 text-slate-300'
                    } ${isSelected ? 'border-l-2 ' + (accentColor === 'amber' ? 'border-amber-400 bg-amber-950/20' : 'border-emerald-400 bg-emerald-950/20') : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-mono font-bold text-sm ${isSelected ? accentText : 'text-slate-100'}`}>
                          {code}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          ({meta?.symbol || code})
                        </span>
                        {isCompat && compatibleUnits && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            ✓ Compatible
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {meta?.dimension && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
                            {meta.dimension}
                          </span>
                        )}
                        {isSelected && (
                          <Check className={`w-4 h-4 ${accentText}`} />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 gap-2">
                      <p className="truncate max-w-[280px] sm:max-w-[340px]">
                        {meta?.description || 'Standard engineering unit'}
                      </p>
                      {factor !== null && factor !== undefined && sourceUnitCode && (
                        <span className="text-[10px] font-mono text-cyan-300 shrink-0 font-medium ml-2 whitespace-nowrap">
                          1 {sourceUnitCode} = {factor.toPrecision(5)} {code}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs font-mono text-slate-400 space-y-1.5">
                <div>
                  No units found matching &quot;<span className="text-amber-400 font-bold">{searchQuery}</span>&quot;
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDimension('ALL');
                    setOnlyCompatible(false);
                    setHighlightedIndex(0);
                    searchInputRef.current?.focus();
                  }}
                  className="text-cyan-400 hover:underline text-[11px] cursor-pointer"
                >
                  Clear search &amp; show all units
                </button>
              </div>
            )}
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80 px-1">
            <span>
              Showing {filteredUnits.length} of {allUnits.length} units
            </span>
            <span>↑↓ navigate • Enter select • Esc close</span>
          </div>
        </div>
      )}
    </div>
  );
}

export interface BatchHistoryItem {
  id: string;
  timestamp: number;
  formattedTime: string;
  sourceUnit: string;
  targetUnit: string;
  factor: number | null;
  dimension: string;
  itemCount: number;
  validCount: number;
  invalidCount: number;
  textInput: string;
  fileName: string | null;
  fileSize: number | null;
  delimiter: 'auto' | 'newline' | 'comma' | 'tab' | 'semicolon';
  columnIndex: number;
  samplePreview: string;
  srcMin?: number;
  srcMax?: number;
  tgtMin?: number;
  tgtMax?: number;
  srcAvg?: number;
  tgtAvg?: number;
}

export function UnitConverter() {
  const [converterMode, setConverterMode] = useState<'single' | 'batch'>('single');
  const [inputValue, setInputValue] = useState<number>(100);
  const [sourceCodeInput, setSourceCodeInput] = useState<string>('kPa');
  const [targetCodeInput, setTargetCodeInput] = useState<string>('bar');
  const [precision, setPrecision] = useState<number>(4);
  const [dimensionFilter, setDimensionFilter] = useState<string>('ALL');
  const [copied, setCopied] = useState<boolean>(false);
  const [isTypingSource, setIsTypingSource] = useState<boolean>(false);

  // Batch Conversion States
  const [batchTextInput, setBatchTextInput] = useState<string>(
    '12.4\n14.8\n16.2\n18.5\n21.0\n23.4\n25.8\n28.2\n31.5\n34.0\n37.2\n40.5\n43.8\n48.0\n52.5'
  );
  const [batchDelimiter, setBatchDelimiter] = useState<'auto' | 'newline' | 'comma' | 'tab' | 'semicolon'>('auto');
  const [selectedColumnIndex, setSelectedColumnIndex] = useState<number>(0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [batchFilterStatus, setBatchFilterStatus] = useState<'all' | 'valid' | 'errors'>('all');
  const [batchSearchQuery, setBatchSearchQuery] = useState<string>('');
  const [batchPage, setBatchPage] = useState<number>(1);
  const [batchPageSize, setBatchPageSize] = useState<number>(15);
  const [copiedBatch, setCopiedBatch] = useState<'column' | 'tsv' | null>(null);
  const [copiedRowId, setCopiedRowId] = useState<number | null>(null);

  // Batch History State (stores the last 5 successful batch operations in local state)
  const [batchHistory, setBatchHistory] = useState<BatchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('unit_converter_batch_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 5);
        }
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'batch-init-sample-1',
        timestamp: Date.now() - 60000,
        formattedTime: 'Baseline Preset',
        sourceUnit: 'kPa',
        targetUnit: 'bar',
        factor: 0.01,
        dimension: 'PRESSURE',
        itemCount: 15,
        validCount: 15,
        invalidCount: 0,
        textInput: '12.4\n14.8\n16.2\n18.5\n21.0\n23.4\n25.8\n28.2\n31.5\n34.0\n37.2\n40.5\n43.8\n48.0\n52.5',
        fileName: null,
        fileSize: null,
        delimiter: 'auto',
        columnIndex: 0,
        samplePreview: '12.4, 14.8, 16.2...',
        srcMin: 12.4,
        srcMax: 52.5,
        tgtMin: 0.124,
        tgtMax: 0.525,
        srcAvg: 29.85,
        tgtAvg: 0.2985
      }
    ];
  });
  const [historyNotification, setHistoryNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build the complete conversion graph from unit_dictionary.json
  const { graph, allUnitsList, unitsByDimension, unitMetaMap } = useMemo(() => {
    const adj: Record<string, ConversionGraphEdge[]> = {};
    const metaMap: Record<string, { code: string; dimension: string; symbol: string; description: string }> = {};

    function addEdge(u: string, v: string, factor: number) {
      if (!adj[u]) adj[u] = [];
      if (!adj[v]) adj[v] = [];
      if (!adj[u].some(e => e.to === v)) {
        adj[u].push({ to: v, factor });
      }
      if (!adj[v].some(e => e.to === u)) {
        adj[v].push({ to: u, factor: 1 / factor });
      }
    }

    // Populate metadata from root dictionary
    typedUnitDict.forEach(entry => {
      const code = entry.unitCode;
      if (!adj[code]) adj[code] = [];
      metaMap[code] = {
        code,
        dimension: entry.dimension,
        symbol: entry.standardSymbol || code,
        description: entry.description || ''
      };

      Object.entries(entry.conversions || {}).forEach(([target, factor]) => {
        addEdge(code, target, factor);
        if (!metaMap[target]) {
          const extra = UNIT_METADATA_EXTRAS[target];
          metaMap[target] = {
            code: target,
            dimension: extra?.dimension || entry.dimension,
            symbol: extra?.symbol || target,
            description: extra?.description || `${target} (derived from ${code})`
          };
        }
      });
    });

    const allCodes = Object.keys(metaMap).sort((a, b) => a.localeCompare(b));
    
    // Group units by dimension
    const byDim: Record<string, string[]> = {};
    allCodes.forEach(code => {
      const dim = metaMap[code]?.dimension || 'OTHER';
      if (!byDim[dim]) byDim[dim] = [];
      byDim[dim].push(code);
    });

    return {
      graph: adj,
      allUnitsList: allCodes,
      unitsByDimension: byDim,
      unitMetaMap: metaMap
    };
  }, []);

  // BFS solver to find conversion factor and path between two units
  const findConversion = (from: string, to: string) => {
    if (from === to) {
      return { factor: 1, path: [from], found: true };
    }
    if (!graph[from] || !graph[to]) {
      return { factor: null, path: [], found: false };
    }

    const queue: Array<{ node: string; factor: number; path: string[] }> = [
      { node: from, factor: 1, path: [from] }
    ];
    const visited = new Set<string>([from]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.node === to) {
        return { factor: current.factor, path: current.path, found: true };
      }

      for (const edge of graph[current.node] || []) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push({
            node: edge.to,
            factor: current.factor * edge.factor,
            path: [...current.path, edge.to]
          });
        }
      }
    }

    return { factor: null, path: [], found: false };
  };

  // Find all compatible units that can be reached from source unit
  const compatibleUnits = useMemo(() => {
    if (!graph[sourceCodeInput]) return [];
    const reachable: string[] = [];
    const visited = new Set<string>([sourceCodeInput]);
    const queue = [sourceCodeInput];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      reachable.push(curr);
      for (const edge of graph[curr] || []) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push(edge.to);
        }
      }
    }

    return reachable.filter(c => c !== sourceCodeInput);
  }, [graph, sourceCodeInput]);

  // Current conversion calculation
  const conversionResult = useMemo(() => {
    const res = findConversion(sourceCodeInput, targetCodeInput);
    if (!res.found || res.factor === null) {
      return {
        success: false,
        value: null,
        factor: null,
        path: [],
        message: `Units '${sourceCodeInput}' and '${targetCodeInput}' are not dimensionally compatible.`
      };
    }

    // Special temperature notice if °C and K
    let calculatedVal = inputValue * res.factor;
    let specialNote = '';
    if (sourceCodeInput === '°C' && targetCodeInput === 'K') {
      specialNote = 'Note: Dictionary factor uses multiplier × 274.15; thermodynamic absolute T(K) = T(°C) + 273.15';
    }

    return {
      success: true,
      value: calculatedVal,
      factor: res.factor,
      path: res.path,
      specialNote
    };
  }, [sourceCodeInput, targetCodeInput, inputValue]);

  // Multi-unit conversion table for all compatible units
  const multiUnitConversions = useMemo(() => {
    return compatibleUnits.map(unitCode => {
      const res = findConversion(sourceCodeInput, unitCode);
      const val = res.found && res.factor !== null ? inputValue * res.factor : null;
      const meta = unitMetaMap[unitCode];
      return {
        unitCode,
        symbol: meta?.symbol || unitCode,
        description: meta?.description || '',
        dimension: meta?.dimension || '',
        factor: res.factor,
        value: val
      };
    });
  }, [sourceCodeInput, compatibleUnits, inputValue, unitMetaMap]);

  // Pre-calculated conversion factors for all compatible units from sourceCodeInput
  const compatibleFactorsMap = useMemo(() => {
    const map: Record<string, number | null> = {};
    compatibleUnits.forEach(u => {
      const res = findConversion(sourceCodeInput, u);
      map[u] = res.found ? res.factor : null;
    });
    return map;
  }, [sourceCodeInput, compatibleUnits, graph]);

  // Quick Preset Configurations for Operators
  const presets = [
    { label: 'TMP: 100 kPa → bar', value: 100, from: 'kPa', to: 'bar', dim: 'PRESSURE' },
    { label: 'TMP: 14.50 psi → kPa', value: 14.5038, from: 'psi', to: 'kPa', dim: 'PRESSURE' },
    { label: 'Flux: 25 LMH → GFD', value: 25, from: 'LMH', to: 'GFD', dim: 'FLUX' },
    { label: 'Permeate: 150 m³/h → gpm', value: 150, from: 'm3/h', to: 'gpm', dim: 'FLOW' },
    { label: 'Air Scour: 1,200 Nm³/h → SCFM', value: 1200, from: 'Nm3/h', to: 'SCFM', dim: 'FLOW' },
    { label: 'MLSS: 8,000 mg/L → g/L', value: 8000, from: 'mg/L', to: 'g/L', dim: 'CONCENTRATION' },
    { label: 'Permeability: 150 LMH/bar → LMH/kPa', value: 150, from: 'LMH/bar', to: 'LMH/kPa', dim: 'PERMEABILITY' },
    { label: 'SRT: 25 days → hours', value: 25, from: 'd', to: 'h', dim: 'TIME' },
    { label: 'SADm: 0.25 Nm³/(m²·h) → scfm/ft²', value: 0.25, from: 'Nm3/m2/h', to: 'scfm/ft2', dim: 'RATIO' }
  ];

  const handleSwapUnits = () => {
    const prevSrc = sourceCodeInput;
    const prevTgt = targetCodeInput;
    setSourceCodeInput(prevTgt);
    setTargetCodeInput(prevSrc);
  };

  const handleCopyResult = () => {
    if (conversionResult.success && conversionResult.value !== null) {
      const formatted = formatNumber(conversionResult.value, precision);
      navigator.clipboard.writeText(`${inputValue} ${sourceCodeInput} = ${formatted} ${targetCodeInput}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatNumber = (num: number, prec: number) => {
    if (Math.abs(num) < 1e-4 && num !== 0) {
      return num.toExponential(prec);
    }
    if (Math.abs(num) >= 1e7) {
      return num.toExponential(prec);
    }
    return Number(num.toFixed(prec)).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: prec
    });
  };

  const currentSourceMeta = unitMetaMap[sourceCodeInput];
  const currentTargetMeta = unitMetaMap[targetCodeInput];

  // Filtered unit lists based on dimension
  const dimensionsList = useMemo(() => ['ALL', ...Object.keys(unitsByDimension).sort()], [unitsByDimension]);

  // Batch Presets for Operators
  const batchPresets = [
    {
      name: 'TMP Pressure Log (15 pts, kPa)',
      from: 'kPa',
      to: 'bar',
      data: '12.4\n14.8\n16.2\n18.5\n21.0\n23.4\n25.8\n28.2\n31.5\n34.0\n37.2\n40.5\n43.8\n48.0\n52.5'
    },
    {
      name: 'Membrane Flux Run (12 pts, LMH)',
      from: 'LMH',
      to: 'GFD',
      data: '18.0\n19.5\n21.2\n22.5\n24.0\n25.5\n26.8\n27.4\n28.0\n29.2\n30.0\n31.5'
    },
    {
      name: 'Permeate Flowmeters (11 pts, m³/h)',
      from: 'm3/h',
      to: 'gpm',
      data: '105.0\n112.5\n120.0\n128.4\n135.0\n142.2\n150.0\n158.5\n165.0\n172.8\n180.0'
    },
    {
      name: 'SCADA CSV Log (Multi-Col)',
      from: 'kPa',
      to: 'psi',
      data: 'Timestamp,TMP_kPa,Flux_LMH\n08:00,14.5,24.2\n08:15,15.1,24.0\n08:30,15.8,23.8\n08:45,16.5,23.5\n09:00,17.2,23.2\n09:15,18.0,22.9\n09:30,19.1,22.5\n09:45,20.4,22.0\n10:00,21.8,21.5'
    }
  ];

  // Batch Parsing and Conversion Engine
  const parsedBatchData = useMemo(() => {
    if (!batchTextInput || !batchTextInput.trim()) {
      return {
        items: [] as Array<{
          id: number;
          raw: string;
          sourceValue: number | null;
          convertedValue: number | null;
          status: 'valid' | 'invalid';
          error?: string;
          columnValues?: string[];
        }>,
        detectedColumns: [] as string[],
        hasMultipleColumns: false,
        stats: null
      };
    }

    const rawLines = batchTextInput.split(/\r?\n/);
    const nonEmptyLines = rawLines.map(l => l.trim()).filter(Boolean);

    // Auto-detect delimiter if requested
    let effectiveDelim = batchDelimiter;
    if (effectiveDelim === 'auto') {
      const sample = nonEmptyLines.slice(0, 5);
      if (sample.some(l => l.includes('\t'))) {
        effectiveDelim = 'tab';
      } else if (sample.some(l => l.includes(','))) {
        effectiveDelim = 'comma';
      } else if (sample.some(l => l.includes(';'))) {
        effectiveDelim = 'semicolon';
      } else {
        effectiveDelim = 'newline';
      }
    }

    const delimChar = 
      effectiveDelim === 'tab' ? '\t' : 
      effectiveDelim === 'comma' ? ',' : 
      effectiveDelim === 'semicolon' ? ';' : 
      null;

    interface BatchRowItem {
      id: number;
      raw: string;
      sourceValue: number | null;
      convertedValue: number | null;
      status: 'valid' | 'invalid';
      error?: string;
      columnValues?: string[];
    }

    const items: BatchRowItem[] = [];
    let detectedCols: string[] = [];
    let idCounter = 1;

    if (!delimChar || effectiveDelim === 'newline') {
      // Single column or whitespace-delimited tokens
      const tokens = (rawLines.length === 1 && (batchTextInput.includes(',') || batchTextInput.includes(' ')))
        ? batchTextInput.split(/[,\s]+/).map(t => t.trim()).filter(Boolean)
        : rawLines.map(l => l.trim());

      tokens.forEach((tok) => {
        if (!tok) return;
        if (tok.startsWith('#') || tok.startsWith('//')) return;

        const sanitized = tok.replace(/,/g, '');
        const num = parseFloat(sanitized);

        if (isNaN(num)) {
          items.push({
            id: idCounter++,
            raw: tok,
            sourceValue: null,
            convertedValue: null,
            status: 'invalid',
            error: `Non-numeric value: "${tok}"`
          });
        } else {
          let converted = conversionResult.success && conversionResult.factor !== null 
            ? num * conversionResult.factor 
            : null;
          if (sourceCodeInput === '°C' && targetCodeInput === 'K' && converted !== null) {
            converted = num + 273.15;
          }
          items.push({
            id: idCounter++,
            raw: tok,
            sourceValue: num,
            convertedValue: converted,
            status: 'valid'
          });
        }
      });
    } else {
      // Delimited columns (CSV, TSV, Semicolon)
      let startRow = 0;
      if (nonEmptyLines.length > 0) {
        const firstCols = nonEmptyLines[0].split(delimChar).map(c => c.trim().replace(/^["']|["']$/g, ''));
        const hasNumbers = firstCols.some(c => !isNaN(parseFloat(c.replace(/,/g, ''))));
        if (!hasNumbers && firstCols.length > 1) {
          detectedCols = firstCols;
          startRow = 1;
        } else {
          detectedCols = firstCols.map((_, idx) => `Column ${idx + 1}`);
        }
      }

      const colIdx = (selectedColumnIndex >= 0 && selectedColumnIndex < detectedCols.length) 
        ? selectedColumnIndex 
        : 0;

      for (let i = startRow; i < rawLines.length; i++) {
        const line = rawLines[i].trim();
        if (!line) continue;
        if (line.startsWith('#') || line.startsWith('//')) continue;

        const cols = line.split(delimChar).map(c => c.trim().replace(/^["']|["']$/g, ''));
        const cell = cols[colIdx] !== undefined ? cols[colIdx] : cols[0] || '';
        const sanitized = cell.replace(/,/g, '');
        const num = parseFloat(sanitized);

        if (isNaN(num)) {
          items.push({
            id: idCounter++,
            raw: cell || line,
            sourceValue: null,
            convertedValue: null,
            status: 'invalid',
            error: cell ? `Cannot parse "${cell}" as number` : 'Empty cell',
            columnValues: cols
          });
        } else {
          let converted = conversionResult.success && conversionResult.factor !== null 
            ? num * conversionResult.factor 
            : null;
          if (sourceCodeInput === '°C' && targetCodeInput === 'K' && converted !== null) {
            converted = num + 273.15;
          }
          items.push({
            id: idCounter++,
            raw: cell,
            sourceValue: num,
            convertedValue: converted,
            status: 'valid',
            columnValues: cols
          });
        }
      }
    }

    // Compute batch statistics
    const validItems = items.filter(it => it.status === 'valid' && it.sourceValue !== null && it.convertedValue !== null);
    let stats = null;
    if (validItems.length > 0) {
      const srcVals = validItems.map(it => it.sourceValue!);
      const tgtVals = validItems.map(it => it.convertedValue!);
      const srcMin = Math.min(...srcVals);
      const srcMax = Math.max(...srcVals);
      const srcSum = srcVals.reduce((a, b) => a + b, 0);
      const srcAvg = srcSum / srcVals.length;

      const tgtMin = Math.min(...tgtVals);
      const tgtMax = Math.max(...tgtVals);
      const tgtSum = tgtVals.reduce((a, b) => a + b, 0);
      const tgtAvg = tgtSum / tgtVals.length;

      stats = {
        count: validItems.length,
        invalidCount: items.length - validItems.length,
        srcMin,
        srcMax,
        srcSum,
        srcAvg,
        tgtMin,
        tgtMax,
        tgtSum,
        tgtAvg
      };
    }

    return {
      items,
      detectedColumns: detectedCols,
      hasMultipleColumns: detectedCols.length > 1,
      stats
    };
  }, [batchTextInput, batchDelimiter, selectedColumnIndex, conversionResult, sourceCodeInput, targetCodeInput]);

  // Filtered rows for the batch table
  const displayedBatchRows = useMemo(() => {
    return parsedBatchData.items.filter(item => {
      if (batchFilterStatus === 'valid' && item.status !== 'valid') return false;
      if (batchFilterStatus === 'errors' && item.status !== 'invalid') return false;

      if (batchSearchQuery.trim()) {
        const q = batchSearchQuery.toLowerCase();
        const matchesRaw = item.raw.toLowerCase().includes(q);
        const matchesSrc = item.sourceValue !== null && item.sourceValue.toString().includes(q);
        const matchesTgt = item.convertedValue !== null && item.convertedValue.toString().includes(q);
        const matchesErr = item.error && item.error.toLowerCase().includes(q);
        if (!matchesRaw && !matchesSrc && !matchesTgt && !matchesErr) return false;
      }

      return true;
    });
  }, [parsedBatchData.items, batchFilterStatus, batchSearchQuery]);

  const totalBatchPages = batchPageSize === -1 ? 1 : Math.max(1, Math.ceil(displayedBatchRows.length / batchPageSize));
  const currentBatchPage = Math.min(batchPage, totalBatchPages);

  const paginatedBatchRows = useMemo(() => {
    if (batchPageSize === -1) return displayedBatchRows;
    const start = (currentBatchPage - 1) * batchPageSize;
    return displayedBatchRows.slice(start, start + batchPageSize);
  }, [displayedBatchRows, currentBatchPage, batchPageSize]);

  const handleFileUpload = (file: File) => {
    if (!file) return;
    setFileError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setBatchTextInput(content);
        setUploadedFileName(file.name);
        setUploadedFileSize(file.size);
        setBatchPage(1);
      }
    };
    reader.onerror = () => {
      setFileError('Failed to read uploaded file. Please verify file format.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleCopyBatchColumn = () => {
    const validItems = parsedBatchData.items.filter(it => it.status === 'valid' && it.convertedValue !== null);
    if (validItems.length === 0) return;
    const text = validItems.map(it => formatNumber(it.convertedValue!, precision)).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedBatch('column');
    setTimeout(() => setCopiedBatch(null), 2000);
  };

  const handleCopyBatchTSV = () => {
    if (parsedBatchData.items.length === 0) return;
    const headers = ['#', 'Raw Input', `Source (${sourceCodeInput})`, `Converted (${targetCodeInput})`, 'Factor', 'Status'];
    const rows = parsedBatchData.items.map(it => [
      it.id,
      it.raw,
      it.sourceValue !== null ? formatNumber(it.sourceValue, precision) : 'N/A',
      it.convertedValue !== null ? formatNumber(it.convertedValue, precision) : 'N/A',
      conversionResult.factor !== null ? conversionResult.factor.toString() : 'N/A',
      it.status
    ]);
    const tsvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsvContent);
    setCopiedBatch('tsv');
    setTimeout(() => setCopiedBatch(null), 2000);
  };

  const handleDownloadCSV = () => {
    if (parsedBatchData.items.length === 0) return;
    const headers = ['Index', 'Raw_Input', `Source_Value_${sourceCodeInput}`, `Converted_Value_${targetCodeInput}`, 'Conversion_Factor', 'Status', 'Error'];
    const rows = parsedBatchData.items.map(it => [
      it.id,
      `"${it.raw.replace(/"/g, '""')}"`,
      it.sourceValue !== null ? it.sourceValue : '',
      it.convertedValue !== null ? it.convertedValue : '',
      conversionResult.factor !== null ? conversionResult.factor : '',
      it.status,
      it.error ? `"${it.error.replace(/"/g, '""')}"` : ''
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch_conversion_${sourceCodeInput}_to_${targetCodeInput}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    if (parsedBatchData.items.length === 0) return;
    const payload = {
      meta: {
        sourceUnit: sourceCodeInput,
        targetUnit: targetCodeInput,
        conversionFactor: conversionResult.factor,
        timestamp: new Date().toISOString(),
        totalItems: parsedBatchData.items.length,
        validItems: parsedBatchData.stats?.count || 0
      },
      data: parsedBatchData.items.map(it => ({
        id: it.id,
        raw: it.raw,
        sourceValue: it.sourceValue,
        sourceUnit: sourceCodeInput,
        convertedValue: it.convertedValue,
        targetUnit: targetCodeInput,
        status: it.status,
        error: it.error || null
      }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch_conversion_${sourceCodeInput}_to_${targetCodeInput}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySingleRow = (id: number, val: number | null) => {
    if (val === null) return;
    navigator.clipboard.writeText(formatNumber(val, precision));
    setCopiedRowId(id);
    setTimeout(() => setCopiedRowId(null), 1500);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Record a successful batch operation to local state history (max 5 items)
  const recordBatchOperation = (customConfig?: {
    src?: string;
    tgt?: string;
    text?: string;
    delim?: 'auto' | 'newline' | 'comma' | 'tab' | 'semicolon';
    col?: number;
    file?: string | null;
    size?: number | null;
  }) => {
    const src = customConfig?.src || sourceCodeInput;
    const tgt = customConfig?.tgt || targetCodeInput;
    const text = customConfig?.text !== undefined ? customConfig.text : batchTextInput;
    const delim = customConfig?.delim || batchDelimiter;
    const col = customConfig?.col !== undefined ? customConfig.col : selectedColumnIndex;
    const file = customConfig?.file !== undefined ? customConfig.file : uploadedFileName;
    const size = customConfig?.size !== undefined ? customConfig.size : uploadedFileSize;

    if (!conversionResult.success || !parsedBatchData.stats || parsedBatchData.stats.count === 0) {
      return false;
    }

    const validItems = parsedBatchData.items.filter(it => it.status === 'valid');
    const previewVals = validItems.slice(0, 3).map(it => it.sourceValue).join(', ');
    const preview = previewVals ? `${previewVals}${validItems.length > 3 ? '...' : ''}` : 'Data values';

    const newItem: BatchHistoryItem = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      sourceUnit: src,
      targetUnit: tgt,
      factor: conversionResult.factor,
      dimension: currentSourceMeta?.dimension || 'MEASUREMENT',
      itemCount: parsedBatchData.items.length,
      validCount: parsedBatchData.stats.count,
      invalidCount: parsedBatchData.stats.invalidCount,
      textInput: text,
      fileName: file,
      fileSize: size,
      delimiter: delim,
      columnIndex: col,
      samplePreview: preview,
      srcMin: parsedBatchData.stats.srcMin,
      srcMax: parsedBatchData.stats.srcMax,
      tgtMin: parsedBatchData.stats.tgtMin,
      tgtMax: parsedBatchData.stats.tgtMax,
      srcAvg: parsedBatchData.stats.srcAvg,
      tgtAvg: parsedBatchData.stats.tgtAvg
    };

    setBatchHistory(prev => {
      if (
        prev.length > 0 &&
        prev[0].sourceUnit === src &&
        prev[0].targetUnit === tgt &&
        prev[0].textInput === text &&
        prev[0].columnIndex === col
      ) {
        return prev;
      }
      const updated = [newItem, ...prev.filter(i => i.id !== newItem.id)].slice(0, 5);
      try {
        localStorage.setItem('unit_converter_batch_history', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    setHistoryNotification(`Saved to history: ${src} → ${tgt} (${parsedBatchData.stats.count} values)`);
    setTimeout(() => setHistoryNotification(null), 3500);
    return true;
  };

  // Re-run a previous batch operation from history
  const handleRerunHistory = (item: BatchHistoryItem) => {
    setSourceCodeInput(item.sourceUnit);
    setTargetCodeInput(item.targetUnit);
    setBatchTextInput(item.textInput);
    setBatchDelimiter(item.delimiter);
    setSelectedColumnIndex(item.columnIndex);
    setUploadedFileName(item.fileName);
    setUploadedFileSize(item.fileSize);
    setBatchPage(1);
    setBatchFilterStatus('all');
    setBatchSearchQuery('');

    setHistoryNotification(`Re-running batch operation: ${item.sourceUnit} → ${item.targetUnit} (${item.validCount} valid entries)`);
    setTimeout(() => setHistoryNotification(null), 3500);

    setBatchHistory(prev => {
      const refreshed: BatchHistoryItem = {
        ...item,
        id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      const updated = [refreshed, ...prev.filter(i => i.id !== item.id)].slice(0, 5);
      try {
        localStorage.setItem('unit_converter_batch_history', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Clear all conversion history from local state
  const handleClearHistory = () => {
    setBatchHistory([]);
    try {
      localStorage.removeItem('unit_converter_batch_history');
    } catch {
      // ignore
    }
    setHistoryNotification('Conversion history cleared from local state');
    setTimeout(() => setHistoryNotification(null), 2500);
  };

  // Remove a single conversion history item
  const handleRemoveHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBatchHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem('unit_converter_batch_history', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Debounced auto-record for successful batch conversions
  useEffect(() => {
    if (converterMode !== 'batch') return;
    if (!conversionResult.success || !parsedBatchData.stats || parsedBatchData.stats.count === 0) return;

    const timer = setTimeout(() => {
      setBatchHistory(prev => {
        if (
          prev.length > 0 &&
          prev[0].sourceUnit === sourceCodeInput &&
          prev[0].targetUnit === targetCodeInput &&
          prev[0].textInput === batchTextInput &&
          prev[0].columnIndex === selectedColumnIndex
        ) {
          return prev;
        }

        const validItems = parsedBatchData.items.filter(it => it.status === 'valid');
        const previewVals = validItems.slice(0, 3).map(it => it.sourceValue).join(', ');
        const preview = previewVals ? `${previewVals}${validItems.length > 3 ? '...' : ''}` : 'Data values';

        const newItem: BatchHistoryItem = {
          id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: Date.now(),
          formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          sourceUnit: sourceCodeInput,
          targetUnit: targetCodeInput,
          factor: conversionResult.factor,
          dimension: currentSourceMeta?.dimension || 'MEASUREMENT',
          itemCount: parsedBatchData.items.length,
          validCount: parsedBatchData.stats?.count || 0,
          invalidCount: parsedBatchData.stats?.invalidCount || 0,
          textInput: batchTextInput,
          fileName: uploadedFileName,
          fileSize: uploadedFileSize,
          delimiter: batchDelimiter,
          columnIndex: selectedColumnIndex,
          samplePreview: preview,
          srcMin: parsedBatchData.stats?.srcMin,
          srcMax: parsedBatchData.stats?.srcMax,
          tgtMin: parsedBatchData.stats?.tgtMin,
          tgtMax: parsedBatchData.stats?.tgtMax,
          srcAvg: parsedBatchData.stats?.srcAvg,
          tgtAvg: parsedBatchData.stats?.tgtAvg
        };

        const updated = [newItem, ...prev].slice(0, 5);
        try {
          localStorage.setItem('unit_converter_batch_history', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    converterMode,
    batchTextInput,
    sourceCodeInput,
    targetCodeInput,
    batchDelimiter,
    selectedColumnIndex,
    uploadedFileName,
    uploadedFileSize,
    conversionResult.success,
    conversionResult.factor,
    parsedBatchData.stats?.count,
    currentSourceMeta?.dimension
  ]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header with Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            {converterMode === 'single' ? (
              <Calculator className="w-6 h-6" />
            ) : (
              <Layers className="w-6 h-6 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">
                {converterMode === 'single' ? 'Engineering Unit Converter' : 'Batch Unit Converter'}
              </h2>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${
                converterMode === 'single' 
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
                {converterMode === 'single' ? 'Live Factor Engine' : 'Multi-Value Batch Engine'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {converterMode === 'single' 
                ? 'Instant physical conversions based on official unit_dictionary.json conversion factors.' 
                : 'Upload or paste datasets to convert multiple values simultaneously with full statistical breakdown.'}
            </p>
          </div>
        </div>

        {/* Mode Selector & Precision Controls */}
        <div className="flex items-center gap-3 flex-wrap self-end lg:self-auto">
          {/* Mode Switch Pills */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setConverterMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition ${
                converterMode === 'single'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Single Value</span>
            </button>
            <button
              type="button"
              onClick={() => setConverterMode('batch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition ${
                converterMode === 'batch'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batch Conversion</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/30 text-emerald-200 font-bold border border-emerald-400/30">
                Batch
              </span>
            </button>
          </div>

          {/* Decimals Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Decimals:</span>
            <select
              value={precision}
              onChange={(e) => setPrecision(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value={2}>2 decimals</option>
              <option value={3}>3 decimals</option>
              <option value={4}>4 decimals</option>
              <option value={6}>6 decimals</option>
              <option value={8}>8 decimals</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setInputValue(100);
              setSourceCodeInput('kPa');
              setTargetCodeInput('bar');
              setDimensionFilter('ALL');
              if (converterMode === 'batch') {
                setBatchTextInput('12.4\n14.8\n16.2\n18.5\n21.0\n23.4\n25.8\n28.2\n31.5\n34.0\n37.2\n40.5\n43.8\n48.0\n52.5');
                setUploadedFileName(null);
                setUploadedFileSize(null);
                setBatchSearchQuery('');
                setBatchFilterStatus('all');
                setBatchPage(1);
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded transition"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODE 1: SINGLE VALUE CONVERSION */}
      {/* ============================================================== */}
      {converterMode === 'single' && (
        <div className="space-y-6">
          {/* Operator Quick Presets */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2.5">
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>OPERATOR QUICK BENCHMARKS &amp; PRESETS:</span>
              </span>
              <button
                type="button"
                onClick={() => setConverterMode('batch')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 hover:underline"
              >
                <span>Switch to Batch Conversion</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputValue(p.value);
                    setSourceCodeInput(p.from);
                    setTargetCodeInput(p.to);
                    setDimensionFilter('ALL');
                  }}
                  className="px-2.5 py-1.5 rounded bg-slate-950/70 hover:bg-cyan-950/40 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/50 text-xs font-mono transition flex items-center gap-1.5"
                >
                  <span className="text-amber-400 font-bold">{p.from}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-cyan-400 font-bold">{p.to}</span>
                  <span className="text-[11px] text-slate-400">({p.label.split(':')[0]})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Converter Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch bg-slate-950/70 p-5 rounded-xl border border-slate-800/80">
            {/* Input Value & Source Unit Code */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-amber-400" />
                  INPUT VALUE &amp; SOURCE UNIT
                </label>
                {currentSourceMeta && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {currentSourceMeta.dimension}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {/* Value Input */}
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={inputValue}
                    onChange={(e) => setInputValue(parseFloat(e.target.value) || 0)}
                    placeholder="Enter value..."
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-amber-400 rounded-lg px-3.5 py-2.5 text-base font-mono font-bold text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 pointer-events-none">
                    {currentSourceMeta?.symbol || sourceCodeInput}
                  </span>
                </div>

                {/* Quick Step Buttons for Input */}
                <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                  <span className="text-[11px] font-mono text-slate-500">Quick set:</span>
                  {[0.1, 1, 10, 25, 50, 100, 1000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setInputValue(val)}
                      className={`px-2 py-0.5 text-[11px] font-mono rounded border transition ${
                        inputValue === val 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold' 
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Searchable Autocomplete Dropdown for Source Unit */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                    <Search className="w-3.5 h-3.5 text-amber-400" />
                    SOURCE UNIT (SEARCH &amp; FILTER)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {allUnitsList.length} units available
                  </span>
                </div>
                <UnitAutocompleteDropdown
                  id="source-unit-select"
                  value={sourceCodeInput}
                  onChange={(newSrc) => {
                    setSourceCodeInput(newSrc);
                    const testRes = findConversion(newSrc, targetCodeInput);
                    if (!testRes.found) {
                      const validEdge = graph[newSrc]?.[0]?.to;
                      if (validEdge) setTargetCodeInput(validEdge);
                    }
                  }}
                  label="Source Unit"
                  accentColor="amber"
                  allUnits={allUnitsList}
                  unitMetaMap={unitMetaMap}
                  placeholder="Search source unit (e.g., kPa, bar, LMH, psi, gpm, m³/h)..."
                />
              </div>

              {/* Source Unit Info Description */}
              {currentSourceMeta && (
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-300 font-mono">
                    <span className="text-amber-400 font-bold">{currentSourceMeta.code}</span>
                    <span className="text-slate-400">Symbol: {currentSourceMeta.symbol}</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    {currentSourceMeta.description}
                  </p>
                </div>
              )}
            </div>

            {/* Swap Middle Column */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-2 lg:py-0">
              <button
                type="button"
                onClick={handleSwapUnits}
                className="p-3.5 rounded-full bg-slate-800 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500 shadow-md transition transform hover:scale-105 active:scale-95 cursor-pointer"
                title="Swap Source and Target Units"
              >
                <ArrowRightLeft className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-mono text-slate-500 mt-2 text-center uppercase tracking-wider">
                Swap Units
              </span>
            </div>

            {/* Target Unit & Result Display */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  TARGET UNIT &amp; CONVERTED VALUE
                </label>
                {currentTargetMeta && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    {currentTargetMeta.dimension}
                  </span>
                )}
              </div>

              {/* Searchable Autocomplete Dropdown for Target Unit */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                    <Search className="w-3.5 h-3.5 text-emerald-400" />
                    TARGET UNIT (SEARCH &amp; FILTER)
                  </span>
                  <span className="text-[10px] text-emerald-400/90 font-mono">
                    ✓ {compatibleUnits.length} compatible with {sourceCodeInput}
                  </span>
                </div>
                <UnitAutocompleteDropdown
                  id="target-unit-select"
                  value={targetCodeInput}
                  onChange={(newTgt) => setTargetCodeInput(newTgt)}
                  label="Target Unit"
                  accentColor="emerald"
                  allUnits={allUnitsList}
                  unitMetaMap={unitMetaMap}
                  compatibleUnits={compatibleUnits}
                  conversionFactors={compatibleFactorsMap}
                  sourceUnitCode={sourceCodeInput}
                  placeholder="Search target unit (e.g., bar, kPa, GFD, SCFM, L/min)..."
                />
              </div>

              {/* Prominent Result Card */}
              <div className={`p-4 rounded-xl border transition ${
                conversionResult.success 
                  ? 'bg-slate-900/90 border-emerald-500/40 shadow-emerald-950/20' 
                  : 'bg-rose-950/20 border-rose-800/50'
              }`}>
                {conversionResult.success && conversionResult.value !== null ? (
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-mono text-slate-400">CALCULATED RESULT:</span>
                      <button
                        type="button"
                        onClick={handleCopyResult}
                        className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-emerald-400 transition"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <span className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
                        {formatNumber(conversionResult.value, precision)}
                      </span>
                      <span className="text-lg font-mono font-bold text-slate-200">
                        {currentTargetMeta?.symbol || targetCodeInput}
                      </span>
                    </div>

                    {/* Mathematical Equation & Factor Path */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1 text-[11px] font-mono text-slate-400">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-300 font-semibold">Formula:</span>
                        <span>{inputValue} {sourceCodeInput}</span>
                        <span>×</span>
                        <span className="text-amber-300 font-bold">{conversionResult.factor?.toPrecision(6)}</span>
                        <span>=</span>
                        <span className="text-emerald-300 font-bold">{formatNumber(conversionResult.value, precision)} {targetCodeInput}</span>
                      </div>

                      {conversionResult.path && conversionResult.path.length > 2 && (
                        <div className="text-[10px] text-cyan-400/90 flex items-center gap-1">
                          <span>Hop Path:</span>
                          {conversionResult.path.map((step, idx) => (
                            <React.Fragment key={step}>
                              <span className="font-bold">{step}</span>
                              {idx < conversionResult.path.length - 1 && <span>→</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      )}

                      {conversionResult.specialNote && (
                        <div className="text-[11px] text-amber-400 font-sans mt-1">
                          {conversionResult.specialNote}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center text-xs text-rose-300 font-mono">
                    {conversionResult.message || 'Conversion not possible between incompatible dimensions.'}
                  </div>
                )}
              </div>

              {/* Target Unit Info Description */}
              {currentTargetMeta && (
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-300 font-mono">
                    <span className="text-emerald-400 font-bold">{currentTargetMeta.code}</span>
                    <span className="text-slate-400">Symbol: {currentTargetMeta.symbol}</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    {currentTargetMeta.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick link banner to Batch Conversion */}
          <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-slate-300">
                Need to convert multiple readings or an entire SCADA / Excel log simultaneously?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConverterMode('batch')}
              className="px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold transition flex items-center gap-1.5"
            >
              <span>Launch Batch Conversion</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Multi-Unit Comparative Breakdown Table */}
          {multiUnitConversions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  INSTANT CONVERSION TO ALL COMPATIBLE UNITS ({currentSourceMeta?.dimension || 'DIMENSION'})
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Showing {multiUnitConversions.length} equivalent units for <span className="text-amber-400 font-bold">{inputValue} {sourceCodeInput}</span>
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-3.5 py-2.5">Target Unit</th>
                      <th className="px-3.5 py-2.5">Symbol</th>
                      <th className="px-3.5 py-2.5">Conversion Factor</th>
                      <th className="px-3.5 py-2.5 text-right font-bold text-emerald-400">Calculated Value</th>
                      <th className="px-3.5 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {multiUnitConversions.map((row) => (
                      <tr 
                        key={row.unitCode} 
                        className={`hover:bg-slate-900/60 transition ${row.unitCode === targetCodeInput ? 'bg-emerald-950/20' : ''}`}
                      >
                        <td className="px-3.5 py-2 font-bold text-emerald-400">
                          {row.unitCode}
                          {row.unitCode === targetCodeInput && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2 text-slate-300">{row.symbol}</td>
                        <td className="px-3.5 py-2 text-slate-400 text-[11px]">
                          1 {sourceCodeInput} = {row.factor !== null ? row.factor.toPrecision(6) : 'N/A'} {row.unitCode}
                        </td>
                        <td className="px-3.5 py-2 text-right font-bold text-slate-100 text-sm">
                          {row.value !== null ? formatNumber(row.value, precision) : '—'}{' '}
                          <span className="text-xs font-normal text-slate-400">{row.symbol}</span>
                        </td>
                        <td className="px-3.5 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => setTargetCodeInput(row.unitCode)}
                            className="px-2 py-1 rounded text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/50 transition"
                          >
                            Set as Target
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: BATCH CONVERSION WORKSPACE */}
      {/* ============================================================== */}
      {converterMode === 'batch' && (
        <div className="space-y-6">
          {/* Unit Selection Bar (Source & Target with Autocomplete Dropdowns) */}
          <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800/90 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                BATCH CONVERSION UNIT CONFIGURATION
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Auto-updates table for all parsed input values
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Source Unit Dropdown */}
              <div className="lg:col-span-5 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Search className="w-3.5 h-3.5" />
                    SOURCE UNIT (INPUTS)
                  </span>
                  {currentSourceMeta && (
                    <span className="text-[10px] px-2 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      {currentSourceMeta.dimension}
                    </span>
                  )}
                </div>
                <UnitAutocompleteDropdown
                  id="batch-source-unit-select"
                  value={sourceCodeInput}
                  onChange={(newSrc) => {
                    setSourceCodeInput(newSrc);
                    const testRes = findConversion(newSrc, targetCodeInput);
                    if (!testRes.found) {
                      const validEdge = graph[newSrc]?.[0]?.to;
                      if (validEdge) setTargetCodeInput(validEdge);
                    }
                  }}
                  label="Source Unit"
                  accentColor="amber"
                  allUnits={allUnitsList}
                  unitMetaMap={unitMetaMap}
                  placeholder="Search source unit (e.g., kPa, bar, LMH, psi)..."
                />
              </div>

              {/* Swap Button */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center py-1">
                <button
                  type="button"
                  onClick={handleSwapUnits}
                  className="p-3 rounded-full bg-slate-800 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500 shadow-md transition transform hover:scale-105 active:scale-95 cursor-pointer"
                  title="Swap Source and Target Units"
                >
                  <ArrowRightLeft className="w-5 h-5" />
                </button>
                <span className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-wider">
                  Swap
                </span>
              </div>

              {/* Target Unit Dropdown */}
              <div className="lg:col-span-5 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Search className="w-3.5 h-3.5" />
                    TARGET UNIT (OUTPUTS)
                  </span>
                  <span className="text-[10px] text-emerald-400/90 font-mono">
                    ✓ {compatibleUnits.length} compatible
                  </span>
                </div>
                <UnitAutocompleteDropdown
                  id="batch-target-unit-select"
                  value={targetCodeInput}
                  onChange={(newTgt) => setTargetCodeInput(newTgt)}
                  label="Target Unit"
                  accentColor="emerald"
                  allUnits={allUnitsList}
                  unitMetaMap={unitMetaMap}
                  compatibleUnits={compatibleUnits}
                  conversionFactors={compatibleFactorsMap}
                  sourceUnitCode={sourceCodeInput}
                  placeholder="Search target unit (e.g., bar, kPa, GFD, SCFM)..."
                />
              </div>
            </div>

            {/* Live Factor & Compatibility Banner */}
            <div className={`p-3 rounded-lg border text-xs font-mono transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              conversionResult.success 
                ? 'bg-slate-900 border-emerald-500/30 text-slate-300' 
                : 'bg-rose-950/20 border-rose-800/50 text-rose-300'
            }`}>
              {conversionResult.success ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Compatible:
                  </span>
                  <span>1 <span className="font-bold text-amber-300">{sourceCodeInput}</span></span>
                  <span>×</span>
                  <span className="text-cyan-300 font-bold">{conversionResult.factor?.toPrecision(6)}</span>
                  <span>=</span>
                  <span className="font-bold text-emerald-300">1 {targetCodeInput}</span>
                  {currentSourceMeta?.dimension && (
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Dimension: {currentSourceMeta.dimension}
                    </span>
                  )}
                  {conversionResult.path && conversionResult.path.length > 2 && (
                    <span className="text-[10px] text-cyan-400">
                      (Via {conversionResult.path.join(' → ')})
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{conversionResult.message || 'Dimensions are incompatible. Please select a compatible target unit.'}</span>
                </div>
              )}

              <div className="text-[11px] text-slate-400 shrink-0">
                Precision: <span className="text-slate-200 font-bold">{precision} decimals</span>
              </div>
            </div>
          </div>

          {/* Operator Batch Presets */}
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>LOAD SAMPLE DATASETS FOR RAPID BATCH TESTING:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {batchPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setBatchTextInput(preset.data);
                    setSourceCodeInput(preset.from);
                    setTargetCodeInput(preset.to);
                    setUploadedFileName(null);
                    setUploadedFileSize(null);
                    setBatchPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded bg-slate-950/80 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 text-xs font-mono transition flex items-center gap-1.5"
                >
                  <FileText className="w-3 h-3 text-emerald-400" />
                  <span>{preset.name}</span>
                  <span className="text-[10px] text-amber-400 font-bold">({preset.from} → {preset.to})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Batch Input Workspace: File Upload & Text Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* File Upload Dropzone (4 cols) */}
            <div className="lg:col-span-4 space-y-3">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <FileUp className="w-3.5 h-3.5 text-emerald-400" />
                METHOD 1: UPLOAD FILE (.CSV / .TXT / .TSV)
              </label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt,.dat,.json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              {/* Dropzone Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-xl border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center text-center gap-2.5 ${
                  isDragging 
                    ? 'border-emerald-400 bg-emerald-950/30' 
                    : 'border-slate-700/80 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-950/90'
                }`}
              >
                <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-emerald-400">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-slate-200">
                    Click to browse or drop file here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports .csv, .tsv, .txt, .json, .dat files
                  </p>
                </div>
              </div>

              {/* Uploaded File Info Card */}
              {uploadedFileName && (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-emerald-300 font-bold truncate">{uploadedFileName}</p>
                      <p className="text-[10px] text-slate-400">
                        {uploadedFileSize !== null ? formatBytes(uploadedFileSize) : ''} • {parsedBatchData.items.length} lines parsed
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFileName(null);
                      setUploadedFileSize(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition shrink-0"
                    title="Remove uploaded file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {fileError && (
                <div className="p-2.5 rounded bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-bold text-slate-300">Format Guide:</p>
                <p>• Plain column of numbers (one per row)</p>
                <p>• Comma / Tab-separated Excel exports</p>
                <p>• Auto-strips quotes &amp; thousands commas</p>
              </div>
            </div>

            {/* Paste Text Area (8 cols) */}
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  METHOD 2: PASTE RAW VALUES OR DELIMITED TABLE
                </label>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span>{parsedBatchData.items.length} entries detected</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchTextInput('');
                      setUploadedFileName(null);
                      setUploadedFileSize(null);
                    }}
                    className="text-slate-400 hover:text-rose-400 transition ml-2 flex items-center gap-1"
                    title="Clear text"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Text Area */}
              <div className="relative">
                <textarea
                  rows={8}
                  value={batchTextInput}
                  onChange={(e) => {
                    setBatchTextInput(e.target.value);
                    setBatchPage(1);
                  }}
                  placeholder="Paste numbers here (one per line, or comma/tab separated like Excel)...&#10;Example:&#10;12.4&#10;15.8&#10;22.1&#10;28.5&#10;34.0"
                  className="w-full bg-slate-950 border border-slate-700/80 focus:border-emerald-400 rounded-lg p-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-y leading-relaxed"
                />
              </div>

              {/* Delimiter & Multi-Column Selection Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                {/* Delimiter selector */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Delimiter:</span>
                  <select
                    value={batchDelimiter}
                    onChange={(e) => setBatchDelimiter(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="auto">Auto-Detect</option>
                    <option value="newline">Newline (\n)</option>
                    <option value="comma">Comma (,)</option>
                    <option value="tab">Tab (\t - Excel)</option>
                    <option value="semicolon">Semicolon (;)</option>
                  </select>
                </div>

                {/* Column Selector if Multi-Column */}
                {parsedBatchData.hasMultipleColumns && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Column to Convert:</span>
                    <select
                      value={selectedColumnIndex}
                      onChange={(e) => setSelectedColumnIndex(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-700 text-emerald-300 font-bold text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-emerald-500"
                    >
                      {parsedBatchData.detectedColumns.map((colName, idx) => (
                        <option key={idx} value={idx}>
                          {colName} (Col {idx + 1})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 ml-auto">
                  {batchTextInput.length} chars • {batchTextInput.split(/\r?\n/).length} lines
                </div>
              </div>
            </div>
          </div>

          {/* Batch Summary Statistics Cards */}
          {parsedBatchData.stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Entries Count */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Batch Completeness</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {parsedBatchData.stats.count}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    / {parsedBatchData.items.length} valid
                  </span>
                </div>
                {/* Visual completion bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(parsedBatchData.stats.count / Math.max(1, parsedBatchData.items.length)) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-slate-500 flex justify-between pt-0.5">
                  <span>Valid: {parsedBatchData.stats.count}</span>
                  {parsedBatchData.stats.invalidCount > 0 && (
                    <span className="text-rose-400">Errors: {parsedBatchData.stats.invalidCount}</span>
                  )}
                </div>
              </div>

              {/* Card 2: Source Stats */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Source ({sourceCodeInput})</span>
                  <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                </span>
                <div className="flex items-baseline justify-between text-xs font-mono">
                  <span className="text-slate-400">Range:</span>
                  <span className="text-slate-200 font-bold">
                    {formatNumber(parsedBatchData.stats.srcMin, precision)} → {formatNumber(parsedBatchData.stats.srcMax, precision)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs font-mono">
                  <span className="text-slate-400">Average:</span>
                  <span className="text-amber-300 font-bold">
                    {formatNumber(parsedBatchData.stats.srcAvg, precision)} {currentSourceMeta?.symbol || sourceCodeInput}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-[11px] font-mono text-slate-400">
                  <span>Sum:</span>
                  <span>{formatNumber(parsedBatchData.stats.srcSum, precision)}</span>
                </div>
              </div>

              {/* Card 3: Target Stats */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Target ({targetCodeInput})</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </span>
                <div className="flex items-baseline justify-between text-xs font-mono">
                  <span className="text-slate-400">Range:</span>
                  <span className="text-slate-200 font-bold">
                    {formatNumber(parsedBatchData.stats.tgtMin, precision)} → {formatNumber(parsedBatchData.stats.tgtMax, precision)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs font-mono">
                  <span className="text-slate-400">Average:</span>
                  <span className="text-emerald-300 font-bold">
                    {formatNumber(parsedBatchData.stats.tgtAvg, precision)} {currentTargetMeta?.symbol || targetCodeInput}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-[11px] font-mono text-slate-400">
                  <span>Sum:</span>
                  <span>{formatNumber(parsedBatchData.stats.tgtSum, precision)}</span>
                </div>
              </div>

              {/* Card 4: Ratio & Factor */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Factor &amp; Dimension</span>
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                </span>
                <div className="text-xs font-mono text-slate-300">
                  <span className="text-slate-400">Multiplier: </span>
                  <span className="text-cyan-300 font-bold">
                    {conversionResult.factor !== null ? conversionResult.factor.toPrecision(6) : 'N/A'}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-300">
                  <span className="text-slate-400">Physical Dimension: </span>
                  <span className="text-slate-200 font-bold">
                    {currentSourceMeta?.dimension || 'UNKNOWN'}
                  </span>
                </div>
                <div className="pt-0.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    MATCH: READY
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Converted Values Table Component */}
          <div className="space-y-3 pt-2">
            {/* Table Toolbar: Filter, Search & Export Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-400" />
                  <span>CONVERTED BATCH TABLE</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                    {displayedBatchRows.length} rows
                  </span>
                </h3>

                {/* Filter Tabs */}
                <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-md text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => { setBatchFilterStatus('all'); setBatchPage(1); }}
                    className={`px-2 py-0.5 rounded transition ${
                      batchFilterStatus === 'all' 
                        ? 'bg-slate-800 text-slate-100 font-bold' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({parsedBatchData.items.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBatchFilterStatus('valid'); setBatchPage(1); }}
                    className={`px-2 py-0.5 rounded transition ${
                      batchFilterStatus === 'valid' 
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Valid ({parsedBatchData.stats?.count || 0})
                  </button>
                  {parsedBatchData.stats && parsedBatchData.stats.invalidCount > 0 && (
                    <button
                      type="button"
                      onClick={() => { setBatchFilterStatus('errors'); setBatchPage(1); }}
                      className={`px-2 py-0.5 rounded transition ${
                        batchFilterStatus === 'errors' 
                          ? 'bg-rose-500/20 text-rose-300 font-bold' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Errors ({parsedBatchData.stats.invalidCount})
                    </button>
                  )}
                </div>
              </div>

              {/* Export & Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search input in table */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={batchSearchQuery}
                    onChange={(e) => {
                      setBatchSearchQuery(e.target.value);
                      setBatchPage(1);
                    }}
                    placeholder="Search values..."
                    className="bg-slate-950 border border-slate-800 rounded pl-8 pr-2.5 py-1 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-36 sm:w-44"
                  />
                  {batchSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setBatchSearchQuery('')}
                      className="absolute right-2 top-1.5 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Copy Converted Column */}
                <button
                  type="button"
                  onClick={handleCopyBatchColumn}
                  disabled={!parsedBatchData.stats || parsedBatchData.stats.count === 0}
                  className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 text-xs font-mono transition flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
                  title="Copy just the converted numbers (newline separated) to paste into Excel"
                >
                  {copiedBatch === 'column' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Column</span>
                    </>
                  )}
                </button>

                {/* Copy TSV */}
                <button
                  type="button"
                  onClick={handleCopyBatchTSV}
                  disabled={parsedBatchData.items.length === 0}
                  className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 text-xs font-mono transition flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
                  title="Copy full table with headers for Excel"
                >
                  {copiedBatch === 'tsv' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-cyan-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy TSV</span>
                    </>
                  )}
                </button>

                {/* Download CSV */}
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  disabled={parsedBatchData.items.length === 0}
                  className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono transition flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
                  title="Download results as CSV spreadsheet"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>

                {/* Download JSON */}
                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  disabled={parsedBatchData.items.length === 0}
                  className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 text-xs font-mono transition flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
                  title="Download results as JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>

                {/* Save to History */}
                <button
                  type="button"
                  onClick={() => recordBatchOperation()}
                  disabled={!parsedBatchData.stats || parsedBatchData.stats.count === 0}
                  className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono transition flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  title="Snapshot and save this run to Conversion History"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Save Run</span>
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3.5 py-2.5 w-12 text-center text-slate-500">#</th>
                    <th className="px-3.5 py-2.5">Raw Input Text</th>
                    <th className="px-3.5 py-2.5">
                      Source Value ({sourceCodeInput})
                    </th>
                    <th className="px-3.5 py-2.5 text-right font-bold text-emerald-400">
                      Converted Value ({targetCodeInput})
                    </th>
                    <th className="px-3.5 py-2.5">Formula Multiplier</th>
                    <th className="px-3.5 py-2.5 text-center">Status</th>
                    <th className="px-3.5 py-2.5 text-center w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {paginatedBatchRows.length > 0 ? (
                    paginatedBatchRows.map((row) => (
                      <tr 
                        key={row.id} 
                        className={`hover:bg-slate-900/60 transition ${
                          row.status === 'invalid' ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="px-3.5 py-2 text-center text-slate-500 font-mono text-[11px]">
                          {row.id}
                        </td>
                        <td className="px-3.5 py-2 font-mono text-slate-300 truncate max-w-[180px]">
                          {row.raw}
                        </td>
                        <td className="px-3.5 py-2 font-mono text-amber-300 font-bold">
                          {row.sourceValue !== null ? formatNumber(row.sourceValue, precision) : '—'}{' '}
                          <span className="text-[11px] font-normal text-slate-400">
                            {currentSourceMeta?.symbol || sourceCodeInput}
                          </span>
                        </td>
                        <td className="px-3.5 py-2 text-right font-mono font-extrabold text-emerald-400 text-sm">
                          {row.convertedValue !== null ? formatNumber(row.convertedValue, precision) : '—'}{' '}
                          <span className="text-xs font-normal text-slate-400">
                            {currentTargetMeta?.symbol || targetCodeInput}
                          </span>
                        </td>
                        <td className="px-3.5 py-2 text-slate-400 text-[11px]">
                          {row.status === 'valid' && conversionResult.factor !== null ? (
                            <span>× {conversionResult.factor.toPrecision(6)}</span>
                          ) : (
                            <span className="text-rose-400/80">{row.error || 'N/A'}</span>
                          )}
                        </td>
                        <td className="px-3.5 py-2 text-center">
                          {row.status === 'valid' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <Check className="w-2.5 h-2.5" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Error
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleCopySingleRow(row.id, row.convertedValue)}
                            disabled={row.convertedValue === null}
                            className="p-1 rounded text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition disabled:opacity-20 disabled:pointer-events-none"
                            title="Copy converted value"
                          >
                            {copiedRowId === row.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-xs font-mono text-slate-500">
                        {batchTextInput.trim() 
                          ? 'No rows match current search and status filters.' 
                          : 'Paste values above or drop a file to generate the batch conversion table.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {displayedBatchRows.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-400 pt-1">
                <div className="flex items-center gap-2">
                  <span>
                    Showing {displayedBatchRows.length === 0 ? 0 : (currentBatchPage - 1) * (batchPageSize === -1 ? displayedBatchRows.length : batchPageSize) + 1} to {Math.min(currentBatchPage * (batchPageSize === -1 ? displayedBatchRows.length : batchPageSize), displayedBatchRows.length)} of {displayedBatchRows.length} entries
                  </span>
                  {displayedBatchRows.length !== parsedBatchData.items.length && (
                    <span className="text-slate-500">
                      (filtered from {parsedBatchData.items.length} total)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Page size dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span>Rows:</span>
                    <select
                      value={batchPageSize}
                      onChange={(e) => {
                        setBatchPageSize(Number(e.target.value));
                        setBatchPage(1);
                      }}
                      className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-emerald-500"
                    >
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={-1}>All</option>
                    </select>
                  </div>

                  {/* Prev / Next buttons */}
                  {batchPageSize !== -1 && totalBatchPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setBatchPage(p => Math.max(1, p - 1))}
                        disabled={currentBatchPage <= 1}
                        className="p-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 py-0.5 text-xs text-slate-300">
                        {currentBatchPage} / {totalBatchPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBatchPage(p => Math.min(totalBatchPages, p + 1))}
                        disabled={currentBatchPage >= totalBatchPages}
                        className="p-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition"
                        title="Next page"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* CONVERSION HISTORY SECTION (Last 5 Successful Batch Operations) */}
          {/* ============================================================== */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-800/90 p-5 space-y-4 shadow-lg">
            {/* History Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wide">
                      Conversion History
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-300">
                      {batchHistory.length} / 5 Saved Runs
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Stores the last 5 successful batch operations in local state. Click &apos;Re-run&apos; to instantly restore inputs or &apos;Clear History&apos; to reset.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => recordBatchOperation()}
                  disabled={!parsedBatchData.stats || parsedBatchData.stats.count === 0}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-mono transition flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  title="Record current batch run to history"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Current Run</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearHistory}
                  disabled={batchHistory.length === 0}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/30 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/40 text-xs font-mono transition flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="Clear all stored batch operations from local state"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              </div>
            </div>

            {/* Notification Toast */}
            {historyNotification && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{historyNotification}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryNotification(null)}
                  className="text-emerald-400 hover:text-emerald-200 ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* History Items List */}
            {batchHistory.length > 0 ? (
              <div className="space-y-2.5">
                {batchHistory.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800/90 hover:border-emerald-500/40 transition flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                  >
                    {/* Left Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          #{idx + 1}
                        </span>

                        <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{item.formattedTime}</span>
                        </span>

                        {/* Unit Conversion Flow */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-xs">
                          <span className="font-bold text-amber-300">{item.sourceUnit}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="font-bold text-emerald-300">{item.targetUnit}</span>
                        </div>

                        {item.dimension && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
                            {item.dimension}
                          </span>
                        )}

                        {item.factor !== null && (
                          <span className="text-[11px] font-mono text-slate-400">
                            Factor: <span className="text-cyan-300 font-semibold">{item.factor.toPrecision(6)}</span>
                          </span>
                        )}
                      </div>

                      {/* Sub-row: counts and preview */}
                      <div className="flex items-center gap-3 text-xs font-mono text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{item.validCount} valid {item.validCount === 1 ? 'value' : 'values'}</span>
                        </span>

                        {item.invalidCount > 0 && (
                          <span className="text-rose-400">
                            • {item.invalidCount} invalid
                          </span>
                        )}

                        <span className="text-slate-500">
                          • Source: {item.fileName ? `File "${item.fileName}"` : 'Pasted Text'}
                        </span>

                        {item.samplePreview && (
                          <span className="text-slate-500 truncate max-w-xs" title={item.samplePreview}>
                            • Preview: [{item.samplePreview}]
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => handleRerunHistory(item)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 hover:border-emerald-400 font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title="Restore this batch configuration and re-run calculation"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Re-run</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleRemoveHistoryItem(item.id, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/40 transition cursor-pointer"
                        title="Remove this entry from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 px-4 rounded-lg bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-2">
                <div className="w-8 h-8 mx-auto rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <p className="text-xs font-mono font-semibold text-slate-300">
                  No Batch Operations in History
                </p>
                <p className="text-[11px] font-mono text-slate-500 max-w-md mx-auto">
                  Your last 5 successful batch operations will appear here in local state. Click &apos;Save Current Run&apos; to snapshot the current dataset.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBatchTextInput('12.4\n14.8\n16.2\n18.5\n21.0\n23.4\n25.8\n28.2\n31.5\n34.0\n37.2\n40.5\n43.8\n48.0\n52.5');
                    setSourceCodeInput('kPa');
                    setTargetCodeInput('bar');
                    setUploadedFileName(null);
                    setUploadedFileSize(null);
                    recordBatchOperation({
                      src: 'kPa',
                      tgt: 'bar',
                      text: '12.4\n14.8\n16.2\n18.5\n21.0\n23.4\n25.8\n28.2\n31.5\n34.0\n37.2\n40.5\n43.8\n48.0\n52.5'
                    });
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3 text-emerald-400" />
                  <span>Load Baseline Sample &amp; Record</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
