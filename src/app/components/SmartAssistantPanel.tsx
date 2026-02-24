/**
 * Smart Assistant Panel (Phase 3)
 * 
 * Proactive AI-like assistant that surfaces insights and enables what-if scenarios.
 * - Shows release summary
 * - Lists actionable insights with Apply/Dismiss buttons
 * - Enables what-if simulations
 * - Persists open/closed state
 */

import { useState, useEffect } from 'react';
import { X, Lightbulb, AlertTriangle, Info, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import designTokens from '../lib/designTokens';
import type { Insight } from '../lib/insightEngine';

interface SmartAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Release summary data
  totalTickets: number;
  totalSprints: number;
  capacityPercentage: number;
  healthStatus: 'healthy' | 'at-risk' | 'critical';
  
  // Insights
  insights: Insight[];
  onApplyInsight: (insightId: string) => void;
  onDismissInsight: (insightId: string) => void;
  onViewInsight: (insightId: string) => void;
  
  // What-if scenarios
  onAddHoliday?: () => void;
  onAddPTO?: () => void;
  onSimulateReallocation?: () => void;
}

export function SmartAssistantPanel({
  isOpen,
  onClose,
  totalTickets,
  totalSprints,
  capacityPercentage,
  healthStatus,
  insights,
  onApplyInsight,
  onDismissInsight,
  onViewInsight,
  onAddHoliday,
  onAddPTO,
  onSimulateReallocation
}: SmartAssistantPanelProps) {
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    insights: true,
    whatIf: false
  });
  
  // Load dismissed insights from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dismissedInsights');
    if (stored) {
      try {
        setDismissedInsights(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error('Failed to load dismissed insights:', e);
      }
    }
  }, []);
  
  // Save dismissed insights to localStorage
  const handleDismiss = (insightId: string) => {
    const updated = new Set(dismissedInsights);
    updated.add(insightId);
    setDismissedInsights(updated);
    localStorage.setItem('dismissedInsights', JSON.stringify([...updated]));
    onDismissInsight(insightId);
  };
  
  // Filter out dismissed insights
  const visibleInsights = insights.filter(i => !dismissedInsights.has(i.id));
  
  // Group insights by type/severity (error=critical, warning=warning, success/info=info)
  const criticalInsights = visibleInsights.filter(i => i.type === 'error');
  const warningInsights = visibleInsights.filter(i => i.type === 'warning');
  const infoInsights = visibleInsights.filter(i => i.type === 'success' || i.type === 'info');
  
  // Health badge colors
  const getHealthColor = () => {
    if (healthStatus === 'critical') return designTokens.colors.semantic.error;
    if (healthStatus === 'at-risk') return designTokens.colors.semantic.warning;
    return designTokens.colors.semantic.success;
  };
  
  const getHealthIcon = () => {
    if (healthStatus === 'critical') return '🔴';
    if (healthStatus === 'at-risk') return '🟡';
    return '🟢';
  };
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop - Click outside to close */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[50]"
        onClick={onClose}
        style={{
          animation: 'fadeIn 0.2s ease-out'
        }}
      />
      
      <div
        className="fixed top-0 right-0 h-full bg-white border-l-2 border-gray-200 shadow-2xl z-[60] flex flex-col"
        style={{
          width: '400px',
          animation: 'slideInFromRight 0.25s ease-out',
          paddingTop: '57px'
        }}
      >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-white">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-blue-600" strokeWidth={2} />
          <h2 className="text-base font-semibold text-gray-900 tracking-tight">Smart Assistant</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/70 transition-all duration-200 shadow-sm hover:shadow"
          title="Close assistant"
        >
          <X className="w-4 h-4 text-gray-500" strokeWidth={2} />
        </button>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Release Summary Section */}
        <div className="border-b-2 border-gray-100">
          <button
            onClick={() => toggleSection('summary')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all duration-200"
          >
            <span className="text-sm font-semibold text-gray-900 tracking-tight">📊 Release Summary</span>
            {expandedSections.summary ? (
              <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2} />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" strokeWidth={2} />
            )}
          </button>
          
          {expandedSections.summary && (
            <div className="px-6 pb-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Tickets</div>
                  <div className="text-3xl font-bold text-gray-900 tabular-nums leading-tight">{totalTickets}</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Sprints</div>
                  <div className="text-3xl font-bold text-gray-900 tabular-nums leading-tight">{totalSprints}</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Capacity Used</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full transition-all duration-300 ease-out rounded-full"
                      style={{
                        width: `${Math.min(capacityPercentage, 100)}%`,
                        backgroundColor: capacityPercentage > 100
                          ? designTokens.colors.semantic.error
                          : capacityPercentage >= 80
                            ? designTokens.colors.semantic.warning
                            : designTokens.colors.semantic.success
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 tabular-nums min-w-[3ch] text-right">
                    {Math.round(capacityPercentage)}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-500">Health Status</span>
                <span
                  className="text-xs font-semibold px-2 py-1 rounded"
                  style={{
                    backgroundColor: `${getHealthColor()}15`,
                    color: getHealthColor()
                  }}
                >
                  {getHealthIcon()} {healthStatus === 'healthy' ? 'On Track' : healthStatus === 'at-risk' ? 'At Risk' : 'Critical'}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Insights Section */}
        <div className="border-b-2 border-gray-100">
          <button
            onClick={() => toggleSection('insights')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 tracking-tight">💡 Insights</span>
              {visibleInsights.length > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 shadow-sm">
                  {visibleInsights.length}
                </span>
              )}
            </div>
            {expandedSections.insights ? (
              <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2} />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" strokeWidth={2} />
            )}
          </button>
          
          {expandedSections.insights && (
            <div className="px-6 pb-5 space-y-3">
              {visibleInsights.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  <Lightbulb className="w-10 h-10 mx-auto mb-3 text-gray-300" strokeWidth={1.5} />
                  <p className="font-medium text-gray-700">Everything looks good!</p>
                  <p className="text-xs mt-2 text-gray-500">No issues or suggestions at this time.</p>
                </div>
              ) : (
                <>
                  {/* Critical Insights */}
                  {criticalInsights.map(insight => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onApply={() => onApplyInsight(insight.id)}
                      onDismiss={() => handleDismiss(insight.id)}
                      onView={() => onViewInsight(insight.id)}
                    />
                  ))}
                  
                  {/* Warning Insights */}
                  {warningInsights.map(insight => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onApply={() => onApplyInsight(insight.id)}
                      onDismiss={() => handleDismiss(insight.id)}
                      onView={() => onViewInsight(insight.id)}
                    />
                  ))}
                  
                  {/* Info Insights */}
                  {infoInsights.map(insight => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onApply={() => onApplyInsight(insight.id)}
                      onDismiss={() => handleDismiss(insight.id)}
                      onView={() => onViewInsight(insight.id)}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        
        {/* What-If Scenarios Section */}
        <div>
          <button
            onClick={() => toggleSection('whatIf')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all duration-200"
          >
            <span className="text-sm font-semibold text-gray-900 tracking-tight">🔮 What-If Scenarios</span>
            {expandedSections.whatIf ? (
              <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2} />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" strokeWidth={2} />
            )}
          </button>
          
          {expandedSections.whatIf && (
            <div className="px-6 pb-5 space-y-3">
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Simulate changes before committing them
              </p>
              
              <button
                onClick={onAddHoliday}
                disabled={!onAddHoliday}
                className="w-full text-left px-4 py-3 text-sm bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg transition-all duration-200 border-2 border-blue-200 hover:border-blue-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-50 disabled:to-gray-100 disabled:border-gray-200"
              >
                <div className="font-medium text-gray-900">+ Add Holiday</div>
                <div className="text-xs text-gray-500 mt-1">See impact on schedule</div>
              </button>
              
              <button
                onClick={onAddPTO}
                disabled={!onAddPTO}
                className="w-full text-left px-4 py-3 text-sm bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg transition-all duration-200 border-2 border-purple-200 hover:border-purple-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-50 disabled:to-gray-100 disabled:border-gray-200"
              >
                <div className="font-medium text-gray-900">+ Add PTO</div>
                <div className="text-xs text-gray-500 mt-1">Check developer availability</div>
              </button>
              
              <button
                onClick={onSimulateReallocation}
                disabled={!onSimulateReallocation}
                className="w-full text-left px-4 py-3 text-sm bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 rounded-lg transition-all duration-200 border-2 border-emerald-200 hover:border-emerald-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-50 disabled:to-gray-100 disabled:border-gray-200"
              >
                <div className="font-medium text-gray-900">⚡ Simulate Reallocation</div>
                <div className="text-xs text-gray-500 mt-1">Preview auto-allocation changes</div>
              </button>
              
              {(!onAddHoliday && !onAddPTO && !onSimulateReallocation) && (
                <p className="text-xs text-gray-400 italic mt-4 text-center">
                  What-if scenarios coming soon...
                </p>
              )}
            </div>
          )}
        </div>
        
      </div>
      
      <style>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
    </>
  );
}

// Individual Insight Card Component
function InsightCard({
  insight,
  onApply,
  onDismiss,
  onView
}: {
  insight: Insight;
  onApply: () => void;
  onDismiss: () => void;
  onView: () => void;
}) {
  const getIconAndColor = () => {
    // Map insight.type to visual severity (error=critical, warning=warning, success/info=info)
    if (insight.type === 'error') {
      return { icon: <AlertTriangle className="w-4 h-4" strokeWidth={2} />, color: designTokens.colors.semantic.error, bg: '#FEF2F2', border: '#FEE2E2' };
    }
    if (insight.type === 'warning') {
      return { icon: <AlertTriangle className="w-4 h-4" strokeWidth={2} />, color: designTokens.colors.semantic.warning, bg: '#FFFBEB', border: '#FEF3C7' };
    }
    return { icon: <Info className="w-4 h-4" strokeWidth={2} />, color: designTokens.colors.semantic.info, bg: '#EFF6FF', border: '#DBEAFE' };
  };
  
  const { icon, color, bg, border } = getIconAndColor();
  
  return (
    <div
      className="rounded-lg border-2 p-4 space-y-3 shadow-sm hover:shadow-md transition-all duration-200"
      style={{
        backgroundColor: bg,
        borderColor: border
      }}
    >
      <div className="flex items-start gap-3">
        <div style={{ color, flexShrink: 0 }} className="mt-0.5">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 mb-1.5 leading-snug">
            {insight.title}
          </div>
          <div className="text-xs text-gray-600 leading-relaxed">
            {insight.message}
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {insight.actionLabel && (
          <button
            onClick={onApply}
            className="px-3 py-2 text-xs font-semibold bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
          >
            {insight.actionLabel}
          </button>
        )}
        <button
          onClick={onView}
          className="px-3 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-white/60 rounded-lg transition-all duration-200"
        >
          View
        </button>
        <button
          onClick={onDismiss}
          className="ml-auto px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-lg transition-all duration-200"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
