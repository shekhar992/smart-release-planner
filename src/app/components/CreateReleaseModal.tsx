import { useState, useMemo } from 'react';
import { X, ChevronRight, ChevronLeft, Zap, Calendar, Settings2 } from 'lucide-react';
import { Product, Sprint, StoryPointMapping, SP_PRESETS, SPMappingPreset, SPMappingEntry } from '../data/mockData';

interface CreateReleaseModalProps {
  onClose: () => void;
  onCreate: (productId: string, name: string, startDate: Date, endDate: Date, importedData?: any, sprints?: Sprint[], storyPointMapping?: StoryPointMapping) => void;
  products: Product[];
  /** When provided, the product is pre-selected and the dropdown is hidden */
  defaultProductId?: string;
}

type DurationOption = { label: string; days: number };

const SPRINT_DURATIONS: DurationOption[] = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '3 weeks', days: 21 },
  { label: '4 weeks', days: 28 },
];

export function CreateReleaseModal({ onClose, onCreate, products, defaultProductId }: CreateReleaseModalProps) {
  // ── Step 1 state ──
  const [step, setStep] = useState<1 | 2>(1);
  const [productId, setProductId] = useState(defaultProductId || products[0]?.id || '');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ── Step 2 state ──
  const [sprintDuration, setSprintDuration] = useState(14);
  const [wantSprints, setWantSprints] = useState(true);

  // ── SP mapping state ──
  const [spPreset, setSpPreset] = useState<SPMappingPreset>('fibonacci');
  const [customEntries, setCustomEntries] = useState<SPMappingEntry[]>([
    { sp: 1, days: 1 }, { sp: 2, days: 2 }, { sp: 3, days: 3 },
    { sp: 5, days: 5 }, { sp: 8, days: 8 }, { sp: 13, days: 13 },
  ]);
  const [showMappingDetail, setShowMappingDetail] = useState(false);

  const currentMapping: StoryPointMapping = useMemo(() => {
    if (spPreset === 'custom') return { preset: 'custom', entries: customEntries };
    return SP_PRESETS[spPreset];
  }, [spPreset, customEntries]);

  const datesInvalid = startDate && endDate && endDate < startDate;
  const step1Valid = productId && name.trim() && startDate && endDate && !datesInvalid;

  const productName = products.find(p => p.id === productId)?.name || '';

  // ── Auto-calculate sprints ──
  const generatedSprints = useMemo(() => {
    if (!startDate || !endDate || datesInvalid) return [];
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const totalDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const count = Math.floor(totalDays / sprintDuration);
    if (count <= 0) return [];

    const sprints: Sprint[] = [];
    for (let i = 0; i < count; i++) {
      const sprintStart = new Date(start.getTime() + i * sprintDuration * 24 * 60 * 60 * 1000);
      const sprintEnd = new Date(sprintStart.getTime() + (sprintDuration - 1) * 24 * 60 * 60 * 1000);
      sprints.push({
        id: `sprint-${Date.now()}-${i}`,
        name: `Sprint ${i + 1}`,
        startDate: sprintStart,
        endDate: sprintEnd,
      });
    }
    return sprints;
  }, [startDate, endDate, sprintDuration, datesInvalid]);

  // Days remaining after sprints
  const remainingDays = useMemo(() => {
    if (!startDate || !endDate || datesInvalid) return 0;
    const totalDays = Math.round(
      (new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / (24 * 60 * 60 * 1000)
    );
    return totalDays - generatedSprints.length * sprintDuration;
  }, [startDate, endDate, generatedSprints, sprintDuration, datesInvalid]);

  const handleSubmit = () => {
    if (!step1Valid) return;
    const sprintsToCreate = wantSprints ? generatedSprints : [];
    onCreate(
      productId,
      name.trim(),
      new Date(startDate + 'T00:00:00'),
      new Date(endDate + 'T00:00:00'),
      undefined,
      sprintsToCreate,
      currentMapping,
    );
    onClose();
  };

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {step === 1 ? 'Create Release' : 'Sprint Setup'}
            </h2>
            {defaultProductId && productName && (
              <p className="text-xs text-gray-500 mt-0.5">for {productName}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* ── Step 1: Release Details ── */}
        {step === 1 && (
          <div>
            <div className="px-6 py-6 space-y-4">
              {/* Product selector — only shown when no default product */}
              {!defaultProductId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Product</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Release Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Q1 2026 Release, v2.0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {datesInvalid && (
                <p className="text-xs text-red-500">End date must be on or after start date</p>
              )}

              {/* ── Story Points → Days Mapping ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5 text-gray-400" />
                    Story Points Scale
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMappingDetail(!showMappingDetail)}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showMappingDetail ? 'Hide details' : 'View mapping'}
                  </button>
                </div>

                <div className="flex gap-2">
                  {(['fibonacci', 'linear', 'custom'] as SPMappingPreset[]).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSpPreset(preset)}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                        spPreset === preset
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {preset === 'fibonacci' ? 'Fibonacci' : preset === 'linear' ? 'Linear (1:1)' : 'Custom'}
                    </button>
                  ))}
                </div>

                {/* Mapping detail table */}
                {showMappingDetail && (
                  <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[1fr_1fr] gap-x-4 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Story Points</span>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Days</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {currentMapping.entries.map((entry, i) => (
                        <div key={i} className="grid grid-cols-[1fr_1fr] gap-x-4 px-3 py-2 items-center">
                          {spPreset === 'custom' ? (
                            <>
                              <input
                                type="number"
                                min={1}
                                value={entry.sp}
                                onChange={(e) => {
                                  const updated = [...customEntries];
                                  updated[i] = { ...updated[i], sp: parseInt(e.target.value) || 1 };
                                  setCustomEntries(updated);
                                }}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center"
                              />
                              <input
                                type="number"
                                min={0.25}
                                step={0.25}
                                value={entry.days}
                                onChange={(e) => {
                                  const updated = [...customEntries];
                                  updated[i] = { ...updated[i], days: parseFloat(e.target.value) || 0.5 };
                                  setCustomEntries(updated);
                                }}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center"
                              />
                            </>
                          ) : (
                            <>
                              <span className="text-sm text-gray-900 font-medium">{entry.sp} SP</span>
                              <span className="text-sm text-gray-600">{entry.days} day{entry.days !== 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    {spPreset === 'custom' && (
                      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => setCustomEntries([...customEntries, { sp: customEntries.length > 0 ? customEntries[customEntries.length - 1].sp + 1 : 1, days: customEntries.length > 0 ? customEntries[customEntries.length - 1].days + 1 : 1 }])}
                          className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                        >
                          + Add row
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[11px] text-gray-400 mt-1.5">
                  {spPreset === 'fibonacci'
                    ? 'Fibonacci: 1 SP = 0.5d, 3 SP = 2d, 8 SP = 5d'
                    : spPreset === 'linear'
                      ? 'Linear: 1 SP = 1 day (story points equal days)'
                      : 'Custom mapping — edit the table above'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Sprints
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Sprint Auto-Generation ── */}
        {step === 2 && (
          <div>
            <div className="px-6 py-6 space-y-5">
              {/* Release summary */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="text-xs text-blue-700">
                  <span className="font-medium">{name}</span>
                  <span className="mx-1.5">&middot;</span>
                  {fmtDate(new Date(startDate + 'T00:00:00'))} &ndash; {fmtDate(new Date(endDate + 'T00:00:00'))}
                </div>
              </div>

              {/* Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Auto-generate sprints</p>
                  <p className="text-xs text-gray-500 mt-0.5">Split the release into equal-length sprints</p>
                </div>
                <button
                  onClick={() => setWantSprints(!wantSprints)}
                  className={`relative rounded-full transition-colors ${wantSprints ? 'bg-blue-600' : 'bg-gray-300'}`}
                  style={{ width: 40, height: 22 }}
                >
                  <span
                    className="absolute top-0.5 bg-white rounded-full shadow-sm transition-transform"
                    style={{ width: 18, height: 18, left: wantSprints ? 20 : 2 }}
                  />
                </button>
              </div>

              {wantSprints && (
                <>
                  {/* Duration presets */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Sprint Duration</label>
                    <div className="flex gap-2">
                      {SPRINT_DURATIONS.map((d) => (
                        <button
                          key={d.days}
                          onClick={() => setSprintDuration(d.days)}
                          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                            sprintDuration === d.days
                              ? 'bg-blue-50 border-blue-300 text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-calculated summary */}
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700">
                      {generatedSprints.length > 0 ? (
                        <>
                          <span className="font-semibold">{generatedSprints.length} sprint{generatedSprints.length !== 1 ? 's' : ''}</span>
                          {' '}will be created
                          {remainingDays > 0 && <span> ({remainingDays} day{remainingDays !== 1 ? 's' : ''} buffer remaining)</span>}
                        </>
                      ) : (
                        'Release duration is shorter than one sprint — adjust the duration'
                      )}
                    </p>
                  </div>

                  {/* Sprint preview table */}
                  {generatedSprints.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-[1fr_auto] gap-x-4 px-3 py-2 bg-gray-50 border-b border-gray-200">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Sprint</span>
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date Range</span>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto divide-y divide-gray-100">
                        {generatedSprints.map((sprint, i) => (
                          <div key={i} className="grid grid-cols-[1fr_auto] gap-x-4 px-3 py-2.5 items-center">
                            <span className="text-sm text-gray-900">{sprint.name}</span>
                            <span className="text-xs text-gray-500 tabular-nums">
                              {fmtDate(sprint.startDate)} &ndash; {fmtDate(sprint.endDate)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/60">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                {wantSprints && generatedSprints.length > 0
                  ? `Create with ${generatedSprints.length} Sprint${generatedSprints.length !== 1 ? 's' : ''}`
                  : 'Create Release'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
