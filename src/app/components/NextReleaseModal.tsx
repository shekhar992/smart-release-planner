import { useState, useMemo } from 'react';
import { X, CalendarDays, Package, ArrowRight, ChevronRight, ChevronLeft, Layers, GitBranch, Check, Plus } from 'lucide-react';
import { Ticket, Release, Sprint, Phase, PhaseType } from '../data/mockData';
import { cn } from './ui/utils';

export interface ConfiguredPhase {
  name: string;
  type: PhaseType;
  weeks: number;
  allowsWork: boolean;
}

export interface NextReleaseConfig {
  releaseName: string;
  startDate: Date;
  endDate: Date;
  phases: Phase[];
  sprints: Sprint[];
}

interface NextReleaseModalProps {
  currentRelease: Release;
  stagedTickets: Ticket[];
  onConfirm: (config: NextReleaseConfig) => void;
  onClose: () => void;
}

// Default phase template — matches getMockPhasesForRelease proportions
const DEFAULT_PHASES: ConfiguredPhase[] = [
  { name: 'Dev Window', type: 'DevWindow', weeks: 6, allowsWork: true },
  { name: 'SIT',        type: 'Testing',   weeks: 2, allowsWork: false },
  { name: 'UAT',        type: 'Testing',   weeks: 2, allowsWork: false },
  { name: 'Go-Live',    type: 'Launch',    weeks: 0, allowsWork: false }, // 1-day, handled specially
];

// SDLC lifecycle preset templates
interface SdlcPreset {
  id: string;
  label: string;
  description: string;
  phases: ConfiguredPhase[];
}

const SDLC_PRESETS: SdlcPreset[] = [
  {
    id: 'standard',
    label: 'Standard SDLC',
    description: 'Traditional waterfall: Development → SIT → UAT → Go-Live',
    phases: [
      { name: 'Dev Window', type: 'DevWindow', weeks: 6, allowsWork: true },
      { name: 'SIT',        type: 'Testing',   weeks: 2, allowsWork: false },
      { name: 'UAT',        type: 'Testing',   weeks: 2, allowsWork: false },
      { name: 'Go-Live',    type: 'Launch',    weeks: 0, allowsWork: false },
    ],
  },
  {
    id: 'agile',
    label: 'Agile Release',
    description: 'Iterative development with UAT hardening sprint',
    phases: [
      { name: 'Dev Sprints',      type: 'DevWindow',   weeks: 6, allowsWork: true },
      { name: 'UAT',             type: 'Testing',     weeks: 1, allowsWork: false },
      { name: 'Hardening Sprint', type: 'Deployment',  weeks: 2, allowsWork: false },
      { name: 'Production',      type: 'Launch',      weeks: 0, allowsWork: false },
    ],
  },
  {
    id: 'fasttrack',
    label: 'Fast-track',
    description: 'Compressed timeline: Dev 4w · SIT 1w · UAT 1w · Go-Live 1d',
    phases: [
      { name: 'Dev Window', type: 'DevWindow', weeks: 4, allowsWork: true },
      { name: 'SIT',        type: 'Testing',   weeks: 1, allowsWork: false },
      { name: 'UAT',        type: 'Testing',   weeks: 1, allowsWork: false },
      { name: 'Go-Live',    type: 'Launch',    weeks: 0, allowsWork: false },
    ],
  },
  {
    id: 'extended',
    label: 'Extended SDLC',
    description: 'Longer validation: Dev 8w · SIT 3w · UAT 2w · Go-Live 1d',
    phases: [
      { name: 'Dev Window', type: 'DevWindow', weeks: 8, allowsWork: true },
      { name: 'SIT',        type: 'Testing',   weeks: 3, allowsWork: false },
      { name: 'UAT',        type: 'Testing',   weeks: 2, allowsWork: false },
      { name: 'Go-Live',    type: 'Launch',    weeks: 0, allowsWork: false },
    ],
  },
];

// ── Shared helpers ───────────────────────────────────────────────────────────

function formatDateInput(d: Date): string {
  // Use local date to avoid UTC-shift day-off-by-one
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysLocal(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function parseDateLocal(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Build Phase[] from ConfiguredPhase[] + release start date
function buildPhases(releaseId: string, startDate: Date, endDate: Date, cfg: ConfiguredPhase[]): Phase[] {
  const phases: Phase[] = [];
  let cursor = new Date(startDate);
  const goLive = new Date(endDate);

  // All phases except last (Go-Live)
  const mainPhases = cfg.slice(0, -1);
  const goLivePhase = cfg[cfg.length - 1];

  for (let i = 0; i < mainPhases.length; i++) {
    const p = mainPhases[i];
    const phaseStart = new Date(cursor);
    // Last main phase ends the day before Go-Live
    const phaseEnd = i === mainPhases.length - 1
      ? addDaysLocal(goLive, -1)
      : addDaysLocal(cursor, p.weeks * 7 - 1);
    phases.push({
      id: `phase-${p.type.toLowerCase()}-${releaseId}`,
      releaseId,
      name: p.name,
      type: p.type,
      startDate: phaseStart,
      endDate: phaseEnd,
      allowsWork: p.allowsWork,
      order: i + 1,
    });
    cursor = addDaysLocal(phaseEnd, 1);
  }

  // Go-Live — always single day (endDate)
  phases.push({
    id: `phase-golive-${releaseId}`,
    releaseId,
    name: goLivePhase.name,
    type: goLivePhase.type,
    startDate: goLive,
    endDate: goLive,
    allowsWork: false,
    order: cfg.length,
  });

  return phases;
}

// Generate sprints inside the Dev Window
function buildSprints(phases: Phase[], sprintLengthDays: number): Sprint[] {
  const devPhase = phases.find(p => p.allowsWork);
  if (!devPhase) return [];

  const sprints: Sprint[] = [];
  let cursor = new Date(devPhase.startDate);
  const devEnd = new Date(devPhase.endDate);
  let n = 1;

  while (cursor <= devEnd) {
    const end = addDaysLocal(cursor, sprintLengthDays - 1);
    const sprintEnd = end > devEnd ? devEnd : end;
    sprints.push({
      id: crypto.randomUUID(),
      name: `Sprint ${n}`,
      startDate: new Date(cursor),
      endDate: new Date(sprintEnd),
    });
    cursor = addDaysLocal(sprintEnd, 1);
    n++;
    if (cursor > devEnd) break;
  }

  return sprints;
}

// ── Phase colour map ─────────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  DevWindow: { bg: 'bg-blue-100 dark:bg-blue-950/50',   border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-800 dark:text-blue-300' },
  Testing:   { bg: 'bg-purple-100 dark:bg-purple-950/50', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-800 dark:text-purple-300' },
  Launch:    { bg: 'bg-emerald-100 dark:bg-emerald-950/50', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-800 dark:text-emerald-300' },
  Deployment:{ bg: 'bg-amber-100 dark:bg-amber-950/50', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-800 dark:text-amber-300' },
  Approval:  { bg: 'bg-orange-100 dark:bg-orange-950/50', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-800 dark:text-orange-300' },
  Custom:    { bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-300 dark:border-slate-600', text: 'text-slate-700 dark:text-slate-300' },
};

function phaseColor(type: string) {
  return PHASE_COLORS[type] ?? PHASE_COLORS.Custom;
}

// ── Step indicators ──────────────────────────────────────────────────────────

const STEPS = [
  { icon: Package, label: 'Basics' },
  { icon: Layers,  label: 'Phases' },
  { icon: GitBranch, label: 'Sprints' },
];

// ── Main component ───────────────────────────────────────────────────────────

export function NextReleaseModal({ currentRelease, stagedTickets, onConfirm, onClose }: NextReleaseModalProps) {
  // ── Step 1 state ────────────────────────────────────────────────────────────
  const defaultStart = addDaysLocal(new Date(currentRelease.endDate), 1);
  const defaultEnd = addDaysLocal(defaultStart, 10 * 7); // 10 weeks default

  const [step, setStep] = useState(0);
  const [releaseName, setReleaseName] = useState(`${currentRelease.name} — Phase 2`);
  const [startDateStr, setStartDateStr] = useState(formatDateInput(defaultStart));
  const [endDateStr, setEndDateStr] = useState(formatDateInput(defaultEnd));
  const [nameError, setNameError] = useState('');

  // ── Step 2 state ────────────────────────────────────────────────────────────
  const [phaseConfig, setPhaseConfig] = useState<ConfiguredPhase[]>(DEFAULT_PHASES);
  const [phaseMode, setPhaseMode] = useState<'template' | 'custom'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // ── Step 3 state ────────────────────────────────────────────────────────────
  const [sprintLengthDays, setSprintLengthDays] = useState(14);

  // ── Derived values ──────────────────────────────────────────────────────────
  const startDate = useMemo(() => parseDateLocal(startDateStr), [startDateStr]);
  const endDate   = useMemo(() => parseDateLocal(endDateStr),   [endDateStr]);

  const totalDays = useMemo(() => {
    const ms = endDate.getTime() - startDate.getTime();
    return Math.max(1, Math.ceil(ms / 86400000) + 1);
  }, [startDate, endDate]);

  // Weeks used by configured phases (excluding Go-Live which is always 1 day)
  const weeksUsed = useMemo(
    () => phaseConfig.slice(0, -1).reduce((s, p) => s + p.weeks, 0),
    [phaseConfig]
  );

  // Total weeks available (minus 1 day for Go-Live)
  const totalWeeksAvail = useMemo(() => Math.floor((totalDays - 1) / 7), [totalDays]);

  // Build preview phases from current config
  const previewPhases = useMemo(() => {
    const newId = '_preview_';
    return buildPhases(newId, startDate, endDate, phaseConfig);
  }, [startDate, endDate, phaseConfig]);

  // Build preview sprints
  const previewSprints = useMemo(
    () => buildSprints(previewPhases, sprintLengthDays),
    [previewPhases, sprintLengthDays]
  );

  // ── Phase relative widths for bar visualisation ───────────────────────────
  const phaseWidths = useMemo(() => {
    const mainPhases = phaseConfig.slice(0, -1);
    const mainTotal = mainPhases.reduce((s, p) => s + Math.max(p.weeks, 0.5), 0);
    const goLiveWeight = 0.5;
    const grandTotal = mainTotal + goLiveWeight;
    return phaseConfig.map((p, i) =>
      i < phaseConfig.length - 1
        ? Math.max(p.weeks, 0.5) / grandTotal
        : goLiveWeight / grandTotal
    );
  }, [phaseConfig]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (step === 0) {
      if (!releaseName.trim()) { setNameError('Release name is required'); return; }
      if (endDate <= startDate) { setNameError('End date must be after start date'); return; }
    }
    if (step === 1 && phaseMode === 'template' && !selectedTemplate) {
      setNameError('Please select a template or switch to Custom');
      return;
    }
    setNameError('');
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handlePhaseWeeks = (idx: number, val: number) => {
    setPhaseConfig(prev => prev.map((p, i) => i === idx ? { ...p, weeks: Math.max(0, val) } : p));
  };

  const handleTemplateSelect = (presetId: string) => {
    setSelectedTemplate(presetId);
    const preset = SDLC_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setPhaseConfig([...preset.phases]);
    }
  };

  const handleAddCustomPhase = () => {
    setPhaseConfig(prev => [
      ...prev.slice(0, -1),
      { name: 'Custom Phase', type: 'Custom' as PhaseType, weeks: 1, allowsWork: false },
      prev[prev.length - 1],
    ]);
  };

  const handleConfirm = () => {
    const newId = crypto.randomUUID();
    const phases = buildPhases(newId, startDate, endDate, phaseConfig);
    const sprints = buildSprints(phases, sprintLengthDays);
    onConfirm({ releaseName: releaseName.trim(), startDate, endDate, phases, sprints });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-orange-50/60 dark:bg-orange-950/20 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Package className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Create Next Release</h2>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* ── Step pills ──────────────────────────────────────── */}
        <div className="flex items-center gap-0 px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex-shrink-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className="flex items-center">
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  active  && "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300",
                  done    && "text-emerald-600 dark:text-emerald-400",
                  !active && !done && "text-slate-400 dark:text-slate-500"
                )}>
                  {done
                    ? <Check className="w-3 h-3" />
                    : <Icon className="w-3 h-3" />
                  }
                  {s.label}
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 mx-0.5 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Body (scrollable) ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ══ STEP 1: Basics ══════════════════════════════════ */}
          {step === 0 && (
            <>
              {/* Staged ticket summary */}
              <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 p-3">
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-2">
                  {stagedTickets.length} ticket{stagedTickets.length !== 1 ? 's' : ''} will be moved to this release
                </p>
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {stagedTickets.map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                      <ArrowRight className="w-3 h-3 text-orange-400 flex-shrink-0" />
                      <span className="truncate">{t.title}</span>
                      <span className="text-slate-400 dark:text-slate-500 flex-shrink-0">{t.assignedTo}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Release name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Release name</label>
                <input
                  type="text"
                  value={releaseName}
                  onChange={e => { setReleaseName(e.target.value); setNameError(''); }}
                  className={cn(
                    "w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400",
                    nameError ? "border-red-400 dark:border-red-600" : "border-slate-300 dark:border-slate-600"
                  )}
                  placeholder="e.g. Q3 Release — Phase 2"
                />
                {nameError && <p className="text-[11px] text-red-500 mt-1">{nameError}</p>}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    <CalendarDays className="w-3 h-3 inline mr-1" />Start date
                  </label>
                  <input type="date" value={startDateStr}
                    onChange={e => { setStartDateStr(e.target.value); setNameError(''); }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    <CalendarDays className="w-3 h-3 inline mr-1" />End date
                  </label>
                  <input type="date" value={endDateStr}
                    onChange={e => { setEndDateStr(e.target.value); setNameError(''); }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
                  />
                </div>
              </div>
            </>
          )}

          {/* ══ STEP 2: Phases ══════════════════════════════════ */}
          {step === 1 && (
            <>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Phase Setup</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure release phases for better timeline management.
                </p>
              </div>

              {/* Important callout */}
              <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/20 p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <span className="text-sm leading-none mt-0.5">💡</span>
                  <span>
                    <strong>Important:</strong> Define your Dev Window phase carefully.
                    Staged tickets will only be scheduled within this window. Available capacity
                    is calculated from Dev Window duration.
                  </span>
                </p>
              </div>

              {/* Mode selector */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: 'template', label: 'Use Template', desc: 'Choose from predefined phase structures' },
                  { id: 'custom',   label: 'Custom',       desc: 'Build your own phase structure' },
                ] as const).map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setPhaseMode(m.id);
                      if (m.id === 'custom') {
                        setSelectedTemplate(null);
                        setPhaseConfig([...DEFAULT_PHASES]);
                      }
                    }}
                    className={cn(
                      "p-3.5 rounded-xl border-2 text-left transition-all shadow-sm hover:shadow-md",
                      phaseMode === m.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 hover:border-blue-300 dark:hover:border-blue-700"
                    )}
                  >
                    <div className="text-xs font-semibold text-slate-900 dark:text-white mb-0.5">{m.label}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{m.desc}</div>
                  </button>
                ))}
              </div>

              {/* Template gallery — shown when template mode + no template selected */}
              {phaseMode === 'template' && !selectedTemplate && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Select Template</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {SDLC_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => handleTemplateSelect(preset.id)}
                        className="text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-slate-900 hover:shadow-md shadow-sm transition-all"
                      >
                        <div className="text-xs font-semibold text-slate-900 dark:text-white mb-1">{preset.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">{preset.description}</div>
                      </button>
                    ))}
                  </div>
                  {nameError && <p className="text-[11px] text-red-500">{nameError}</p>}
                </div>
              )}

              {/* Phase review — shown after template selected or in custom mode */}
              {(selectedTemplate || phaseMode === 'custom') && (
                <div className="space-y-3">
                  {/* Header with "Change Template" */}
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Review Phases ({phaseConfig.length})
                      <span className={cn("ml-2 font-normal", weeksUsed > totalWeeksAvail ? "text-red-500" : "text-slate-400 dark:text-slate-500")}>
                        · {weeksUsed}/{totalWeeksAvail} wks
                      </span>
                    </label>
                    {phaseMode === 'template' && (
                      <button
                        onClick={() => { setSelectedTemplate(null); setNameError(''); }}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium"
                      >
                        Change Template
                      </button>
                    )}
                  </div>

                  {/* Phase bar visualisation */}
                  <div className="flex h-7 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    {phaseConfig.map((p, i) => {
                      const c = phaseColor(p.type);
                      return (
                        <div
                          key={i}
                          className={cn("flex items-center justify-center overflow-hidden transition-all", c.bg)}
                          style={{ flexBasis: `${phaseWidths[i] * 100}%` }}
                          title={p.name}
                        >
                          <span className={cn("text-[10px] font-semibold truncate px-1", c.text)}>
                            {i < phaseConfig.length - 1 ? `${p.weeks}w` : '1d'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Phase rows */}
                  <div className="space-y-1.5">
                    {phaseConfig.map((p, i) => {
                      const c = phaseColor(p.type);
                      const isGoLive = i === phaseConfig.length - 1;
                      return (
                        <div key={i} className={cn("flex items-center gap-3 px-3 py-2 rounded-xl border", c.bg, c.border)}>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs font-semibold", c.text)}>{p.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {p.allowsWork ? 'Dev work allowed' : 'No dev work'}
                            </p>
                          </div>
                          {isGoLive ? (
                            <span className="text-xs font-medium text-slate-400 flex-shrink-0">1 day</span>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => handlePhaseWeeks(i, p.weeks - 1)}
                                disabled={p.weeks <= 1}
                                className="w-6 h-6 rounded-md bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-700 disabled:opacity-30 transition-colors"
                              >−</button>
                              <span className="w-10 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">{p.weeks}w</span>
                              <button
                                onClick={() => handlePhaseWeeks(i, p.weeks + 1)}
                                className="w-6 h-6 rounded-md bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                              >+</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Custom Phase dashed button */}
                  <button
                    onClick={handleAddCustomPhase}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-all text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Custom Phase
                  </button>

                  {weeksUsed > totalWeeksAvail && (
                    <p className="text-[11px] text-red-500 dark:text-red-400">⚠ Phase weeks exceed available time. Shorten phases or extend the release end date.</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* ══ STEP 3: Sprints ══════════════════════════════════ */}
          {step === 2 && (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sprints are generated inside the <span className="font-semibold text-blue-600 dark:text-blue-400">Dev Window</span>. You can adjust individual sprints on the canvas after creation.
              </p>

              {/* Sprint length picker */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sprint length</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Used for all sprints in this release</p>
                </div>
                <div className="flex items-center gap-2">
                  {[7, 10, 14, 21].map(d => (
                    <button
                      key={d}
                      onClick={() => setSprintLengthDays(d)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors",
                        sprintLengthDays === d
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >{d === 7 ? '1w' : d === 14 ? '2w' : d === 21 ? '3w' : '10d'}</button>
                  ))}
                </div>
              </div>

              {/* Sprint preview list */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {previewSprints.length} sprint{previewSprints.length !== 1 ? 's' : ''} will be created
                  </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                  {previewSprints.length === 0 ? (
                    <p className="p-3 text-xs text-slate-400 dark:text-slate-500">No sprints — Dev Window is too short or phases exceed total duration.</p>
                  ) : (
                    previewSprints.map((s, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded-full">{i + 1}</span>
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{s.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {formatDateInput(s.startDate)} → {formatDateInput(s.endDate)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between flex-shrink-0">
          <button
            onClick={step === 0 ? onClose : handleBack}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors flex items-center gap-1.5"
          >
            {step > 0 && <ChevronLeft className="w-3 h-3" />}
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < 2 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              Next<ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={previewSprints.length === 0 && weeksUsed === 0}
              className="px-4 py-2 text-xs font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Package className="w-3 h-3" />Create Release &amp; Move Tickets
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
