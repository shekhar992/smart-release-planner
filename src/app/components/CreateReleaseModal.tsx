import { useState, useMemo } from 'react';
import { X, ChevronRight, ChevronLeft, Zap, Calendar, Rocket } from 'lucide-react';
import { cn } from './ui/utils';
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
    <>
      <style>{`
        .modal-appear {
          animation: modalAppear 0.2s ease-out;
        }
        @keyframes modalAppear {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
        <div
          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 modal-appear"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  {step === 1 ? 'Create Release' : 'Sprint Setup'}
                </h2>
                {defaultProductId && productName && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">for {productName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Step indicator */}
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-200",
                  step === 1 ? 'bg-blue-600 shadow-lg shadow-blue-500/50' : 'bg-slate-300 dark:bg-slate-600'
                )} />
                <span className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-200",
                  step === 2 ? 'bg-blue-600 shadow-lg shadow-blue-500/50' : 'bg-slate-300 dark:bg-slate-600'
                )} />
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
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
                    <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Product</label>
                    <select
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Release Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Q1 2026 Release, v2.0"
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
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

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!step1Valid}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  Next: Sprints
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Sprint Auto-Generation ── */}
          {step === 2 && (
            <div>
              <div className="px-6 py-6 space-y-5">
                {/* Release summary */}
                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <span className="font-semibold">{name}</span>
                    <span className="mx-1.5">&middot;</span>
                    {fmtDate(new Date(startDate + 'T00:00:00'))} &ndash; {fmtDate(new Date(endDate + 'T00:00:00'))}
                  </div>
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Auto-generate sprints</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Split the release into equal-length sprints</p>
                  </div>
                  <button
                    onClick={() => setWantSprints(!wantSprints)}
                    className={cn(
                      "relative rounded-full transition-all duration-200",
                      wantSprints ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'bg-slate-300 dark:bg-slate-600'
                    )}
                    style={{ width: 44, height: 24 }}
                  >
                    <span
                      className="absolute top-0.5 bg-white rounded-full shadow-sm transition-transform duration-200"
                      style={{ width: 20, height: 20, left: wantSprints ? 22 : 2 }}
                    />
                  </button>
                </div>

                {wantSprints && (
                  <>
                    {/* Duration presets */}
                    <div>
                      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">Sprint Duration</label>
                      <div className="grid grid-cols-4 gap-2">
                        {SPRINT_DURATIONS.map((d) => (
                          <button
                            key={d.days}
                            onClick={() => setSprintDuration(d.days)}
                            className={cn(
                              "px-3 py-2.5 text-xs font-semibold rounded-lg border transition-all duration-200",
                              sprintDuration === d.days
                                ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 shadow-sm'
                                : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            )}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Auto-calculated summary */}
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <p className="text-sm text-amber-700 dark:text-amber-300">
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
                      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white/50 dark:bg-slate-800/50">
                        <div className="grid grid-cols-[1fr_auto] gap-x-4 px-4 py-3 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Sprint</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Date Range</span>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700">
                          {generatedSprints.map((sprint, i) => (
                            <div key={i} className="grid grid-cols-[1fr_auto] gap-x-4 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                              <span className="text-sm font-medium text-slate-900 dark:text-white">{sprint.name}</span>
                              <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
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

              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30"
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
    </>
  );
}
