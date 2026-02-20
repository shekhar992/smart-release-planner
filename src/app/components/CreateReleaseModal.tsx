import { useState, useMemo } from 'react';
import { X, ChevronRight, ChevronLeft, Zap, Calendar } from 'lucide-react';
import { Product, Sprint } from '../data/mockData';
import { DatePicker } from './DatePicker';

interface CreateReleaseModalProps {
  onClose: () => void;
  onCreate: (productId: string, name: string, startDate: Date, endDate: Date, importedData?: any, sprints?: Sprint[]) => void;
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
      sprintsToCreate
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
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  required
                  helperText="Defines the overall release period for phase planning"
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  minDate={startDate}
                  required
                  error={datesInvalid ? "End date must be on or after start date" : undefined}
                  helperText={!datesInvalid ? "All release phases must fit within this period" : undefined}
                />
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
