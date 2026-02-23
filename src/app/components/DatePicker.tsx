import { forwardRef } from 'react';
import { Calendar } from 'lucide-react';
import designTokens from '../lib/designTokens';

interface DatePickerProps {
  value: string; // ISO date string (yyyy-MM-dd)
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
  className?: string;
  error?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ 
    value, 
    onChange, 
    label, 
    helperText,
    error,
    placeholder = 'dd/mm/yyyy',
    minDate,
    maxDate,
    required = false,
    className = '',
  }, ref) => {
    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && (
          <label 
            className="text-sm font-semibold text-slate-900 dark:text-white"
            style={{
              fontSize: designTokens.typography.fontSize.sm,
              fontWeight: designTokens.typography.fontWeight.semibold,
              letterSpacing: designTokens.typography.letterSpacing.normal
            }}
          >
            {label}
            {required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative group">
          <input
            ref={ref}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={minDate}
            max={maxDate}
            required={required}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 pr-10 border border-slate-300 dark:border-slate-600 
              bg-white dark:bg-slate-800 
              text-slate-900 dark:text-white 
              placeholder-slate-400 dark:placeholder-slate-500 
              rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
              hover:border-slate-400 dark:hover:border-slate-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              shadow-sm"
            style={{
              fontSize: designTokens.typography.fontSize.sm,
              borderRadius: designTokens.borderRadius.md,
              boxShadow: error ? designTokens.shadows.conflictError : designTokens.shadows.sm,
              borderColor: error ? designTokens.colors.semantic.error : undefined
            }}
          />
          <Calendar 
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none
              group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-200" 
          />
        </div>
        
        {helperText && !error && (
          <p 
            className="text-xs text-slate-600 dark:text-slate-400"
            style={{
              fontSize: designTokens.typography.fontSize.xs
            }}
          >
            {helperText}
          </p>
        )}
        
        {error && (
          <p 
            className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
            style={{
              fontSize: designTokens.typography.fontSize.xs
            }}
          >
            <span>⚠️</span> {error}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
