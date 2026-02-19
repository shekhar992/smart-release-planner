import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useParams } from 'react-router';
import { PageShell } from './PageShell';
import { DatePicker } from './DatePicker';
import { loadTeamMembersByProduct, saveTeamMembers, loadHolidays } from '../lib/localStorage';
import type { TeamMember, PTOEntry, Holiday } from '../data/mockData';

// Deterministic color assignment for developers
const DEV_COLOR_VARS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'];

function getDevColorVar(memberId: string): string {
  const hash = memberId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEV_COLOR_VARS[hash % DEV_COLOR_VARS.length];
}

export function PTOCalendar() {
  const { productId } = useParams();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'team' | 'individual'>('team');
  const [showAddPTO, setShowAddPTO] = useState(false);
  const [ptoStartDate, setPTOStartDate] = useState<Date>(new Date());
  const [ptoEndDate, setPTOEndDate] = useState<Date>(new Date());
  const [ptoName, setPTOName] = useState('');
  const [overflowPopup, setOverflowPopup] = useState<{ dateKey: string; members: TeamMember[]; ptoNames: string[] } | null>(null);

  useEffect(() => {
    if (productId) {
      const members = loadTeamMembersByProduct(productId) || [];
      setTeamMembers(members);
      if (members.length > 0 && !selectedMemberId) {
        setSelectedMemberId(members[0].id);
      }
    }
    // Load holidays
    const loadedHolidays = loadHolidays() || [];
    setHolidays(loadedHolidays);
  }, [productId, selectedMemberId]);

  // Close overflow popup when clicking outside
  useEffect(() => {
    if (overflowPopup) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.overflow-popup-container')) {
          setOverflowPopup(null);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [overflowPopup]);

  const selectedMember = teamMembers.find(m => m.id === selectedMemberId);

  const normalizedTeamMembers = useMemo(() => {
    return teamMembers
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [teamMembers]);

  const membersOnPTO = (date: Date) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return normalizedTeamMembers.filter(member => {
      const ptoEntries = member.pto || [];
      return ptoEntries.some(pto => {
        const ptoStart = new Date(pto.startDate);
        const ptoEnd = new Date(pto.endDate);
        ptoStart.setHours(0, 0, 0, 0);
        ptoEnd.setHours(0, 0, 0, 0);
        return checkDate >= ptoStart && checkDate <= ptoEnd;
      });
    });
  };

  const getDayPTOInfo = (date: Date | null) => {
    if (!date) return { members: [], ptoNames: [] };
    const members = membersOnPTO(date);
    const ptoNames = members.map(m => {
      const entry = (m.pto || []).find(pto => {
        const ptoStart = new Date(pto.startDate);
        const ptoEnd = new Date(pto.endDate);
        ptoStart.setHours(0, 0, 0, 0);
        ptoEnd.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate >= ptoStart && checkDate <= ptoEnd;
      });
      return entry ? entry.name : 'PTO';
    });
    return { members, ptoNames };
  };

  const getHolidaysForDay = (date: Date | null) => {
    if (!date) return [];
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    return holidays.filter(holiday => {
      const holidayStart = new Date(holiday.startDate);
      const holidayEnd = new Date(holiday.endDate);
      holidayStart.setHours(0, 0, 0, 0);
      holidayEnd.setHours(0, 0, 0, 0);
      return checkDate >= holidayStart && checkDate <= holidayEnd;
    });
  };

  const handleQuickAddPTO = (date: Date) => {
    setPTOStartDate(date);
    setPTOEndDate(date);
    setPTOName('');
    setShowAddPTO(true);
  };

  const handleAddPTO = () => {
    if (!selectedMemberId || !ptoName.trim()) {
      alert('Please fill in all PTO fields');
      return;
    }

    const newPTO: PTOEntry = {
      id: `pto-${Date.now()}`,
      name: ptoName.trim(),
      startDate: ptoStartDate,
      endDate: ptoEndDate
    };

    const updatedMembers = teamMembers.map(m =>
      m.id === selectedMemberId
        ? { ...m, pto: [...(m.pto || []), newPTO] }
        : m
    );

    setTeamMembers(updatedMembers);
    saveTeamMembers(updatedMembers);
    
    // Dispatch event for auto-refresh in planning view
    window.dispatchEvent(new Event('teamMembersUpdated'));

    // Reset form
    setPTOStartDate(new Date());
    setPTOEndDate(new Date());
    setPTOName('');
    setShowAddPTO(false);
  };

  const handleDeletePTO = (ptoId: string) => {
    if (!confirm('Delete this PTO entry?')) return;

    const updatedMembers = teamMembers.map(m =>
      m.id === selectedMemberId
        ? { ...m, pto: (m.pto || []).filter(p => p.id !== ptoId) }
        : m
    );

    setTeamMembers(updatedMembers);
    saveTeamMembers(updatedMembers);
    
    // Dispatch event for auto-refresh
    window.dispatchEvent(new Event('teamMembersUpdated'));
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isPTODay = (date: Date | null) => {
    if (!date || !selectedMember) return false;
    const ptoEntries = selectedMember.pto || [];
    return ptoEntries.some(pto => {
      const ptoStart = new Date(pto.startDate);
      const ptoEnd = new Date(pto.endDate);
      ptoStart.setHours(0, 0, 0, 0);
      ptoEnd.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate >= ptoStart && checkDate <= ptoEnd;
    });
  };

  const monthDays = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <PageShell
      breadcrumbs={[
        { label: 'Products', to: '/' },
        {
          label: 'Team',
          to: productId ? `/product/${productId}/team` : '/team'
        },
        { label: 'PTO Calendar' }
      ]}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">PTO Calendar</h1>
          <p className="text-sm text-muted-foreground">Manage team member time off. Changes automatically update capacity planning.</p>
        </div>

        {/* Toolbar: View toggle + Developer selector + Add CTA */}
        <div className="mb-4 flex items-center justify-between gap-4 p-3 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center rounded-md border border-border bg-muted overflow-hidden">
              <button
                type="button"
                onClick={() => setCalendarView('team')}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  calendarView === 'team'
                    ? 'bg-card text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                All team
              </button>
              <button
                type="button"
                onClick={() => setCalendarView('individual')}
                className={`px-3 py-1.5 text-sm transition-colors border-l border-border ${
                  calendarView === 'individual'
                    ? 'bg-card text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                Individual
              </button>
            </div>

            {/* Developer selector - only show in individual view */}
            {calendarView === 'individual' && (
              <div className="flex items-center gap-2">
                <label htmlFor="member-select" className="text-sm font-medium text-foreground">
                  Team member:
                </label>
                <select
                  id="member-select"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="px-3 py-1.5 border border-border rounded-md text-sm bg-card text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {normalizedTeamMembers.length === 0 ? (
                    <option value="">No team members found</option>
                  ) : (
                    normalizedTeamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Primary Add PTO CTA */}
          <button
            onClick={() => {
              setPTOStartDate(new Date());
              setPTOEndDate(new Date());
              setPTOName('');
              setShowAddPTO(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-primary-foreground bg-primary hover:bg-primary-hover rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedMemberId}
          >
            <Plus className="w-4 h-4" />
            Add PTO
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-muted border-b border-border">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-card rounded transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-semibold text-gray-900">{monthName}</h2>

            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-card rounded transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Day of week headers */}
          <div className="grid grid-cols-7 bg-muted border-b border-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="px-3 py-5 text-center text-base font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {monthDays.map((date, index) => {
              const isPTO = isPTODay(date);
              const isWeekend = date ? (date.getDay() === 0 || date.getDay() === 6) : false;
              const dayPTOInfo = getDayPTOInfo(date);
              const hasPTO = (calendarView === 'individual' && isPTO) || (calendarView === 'team' && dayPTOInfo.members.length > 0);

              // Overflow members for tooltip
              const visibleMembers = dayPTOInfo.members.slice(0, 2);
              const overflowMembers = dayPTOInfo.members.slice(2);
              const dateKey = date ? date.toISOString() : `empty-${index}`;
              const isOverflowOpen = overflowPopup?.dateKey === dateKey;

              return (
                <div
                  key={index}
                  className={`group relative min-h-[125px] border-r border-b border-border p-3 ${
                    date ? 'bg-card' : 'bg-muted'
                  } ${isWeekend ? 'bg-muted' : ''} ${hasPTO ? 'bg-[color:var(--pto-overlay)]' : ''}`}
                >
                  {date && (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-lg font-medium text-foreground">
                          {date.getDate()}
                        </div>
                        {/* Quick add icon - visible on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAddPTO(date);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-all"
                          aria-label={`Add PTO for ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                          title="Add PTO for this day"
                        >
                          <Plus className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </div>

                      {/* Color tabs for team view */}
                      {calendarView === 'team' && (
                        <div className="flex flex-col gap-1 mt-1">
                          {/* Holidays */}
                          {getHolidaysForDay(date).map((holiday) => (
                            <div
                              key={holiday.id}
                              className="text-xs px-2 py-1 rounded-sm bg-amber-500 text-white font-medium truncate"
                              title={holiday.name}
                            >
                              🎉 {holiday.name}
                            </div>
                          ))}
                          
                          {/* Team PTOs */}
                          {dayPTOInfo.members.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {visibleMembers.map((member) => (
                                <div
                                  key={member.id}
                                  className="text-sm px-2 py-1 rounded-sm text-white font-medium truncate max-w-full"
                                  style={{ backgroundColor: `var(${getDevColorVar(member.id)})` }}
                                  title={member.name}
                                >
                                  {member.name}
                                </div>
                              ))}
                              {overflowMembers.length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isOverflowOpen) {
                                      setOverflowPopup(null);
                                    } else {
                                      setOverflowPopup({ 
                                        dateKey, 
                                        members: overflowMembers,
                                        ptoNames: dayPTOInfo.ptoNames.slice(2)
                                      });
                                    }
                                  }}
                                  className="overflow-popup-container text-sm px-2 py-1 bg-muted-foreground text-white rounded-sm font-medium cursor-pointer hover:bg-muted-foreground/80 transition-colors"
                                >
                                  +{overflowMembers.length}
                                </button>
                              )}
                              {/* Overflow popup */}
                              {isOverflowOpen && overflowPopup && (
                                <div className="overflow-popup-container absolute z-50 mt-1 bg-card border border-border rounded-md shadow-lg p-2 min-w-[200px] left-0 top-full">
                                  <div className="space-y-1">
                                    {overflowPopup.members.map((member, idx) => (
                                      <div
                                        key={member.id}
                                        className="text-sm px-2 py-1.5 rounded-sm text-white font-medium"
                                        style={{ backgroundColor: `var(${getDevColorVar(member.id)})` }}
                                      >
                                        {member.name}: {overflowPopup.ptoNames[idx]}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* PTO indicator for individual view */}
                      {calendarView === 'individual' && isPTO && selectedMember && (
                        <div className="mt-1">
                          <div
                            className="text-sm px-2 py-1 rounded-sm text-white font-medium inline-block"
                            style={{ backgroundColor: `var(${getDevColorVar(selectedMemberId)})` }}
                          >
                            {selectedMember.name}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* PTO List for Selected Member */}
        {calendarView === 'individual' && selectedMember && selectedMember.pto && selectedMember.pto.length > 0 && (
          <div className="mt-6 bg-card rounded-lg border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              PTO Entries for {selectedMember.name}
            </h3>
            <div className="space-y-2">
              {selectedMember.pto.map(pto => (
                <div
                  key={pto.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-md border border-border"
                >
                  <div>
                    <div className="font-medium text-sm text-foreground">{pto.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {new Date(pto.startDate).toLocaleDateString()} - {new Date(pto.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePTO(pto.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-card rounded transition-colors"
                    title="Delete PTO"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add PTO Modal */}
      {showAddPTO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md mx-4 border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Add PTO</h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="pto-member" className="block text-sm font-medium text-foreground mb-1">
                  Team Member
                </label>
                <select
                  id="pto-member"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {normalizedTeamMembers.length === 0 ? (
                    <option value="">No team members found</option>
                  ) : (
                    normalizedTeamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="pto-name" className="block text-sm font-medium text-foreground mb-1">
                  Notes/Reason
                </label>
                <input
                  id="pto-name"
                  type="text"
                  value={ptoName}
                  onChange={(e) => setPTOName(e.target.value)}
                  placeholder="e.g., Vacation, Sick Leave"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Start Date
                </label>
                <DatePicker
                  value={ptoStartDate}
                  onChange={setPTOStartDate}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  End Date
                </label>
                <DatePicker
                  value={ptoEndDate}
                  onChange={setPTOEndDate}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddPTO(false);
                  setPTOStartDate(new Date());
                  setPTOEndDate(new Date());
                  setPTOName('');
                }}
                className="px-4 py-2 text-sm text-foreground hover:bg-muted border border-border rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPTO}
                className="px-4 py-2 text-sm text-primary-foreground bg-primary hover:bg-primary-hover rounded-md transition-colors"
              >
                Add PTO
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
