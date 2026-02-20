import { forwardRef } from 'react';
import { Calendar } from 'lucide-react';

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
          <label className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={minDate}
            max={maxDate}
            required={required}
            placeholder={placeholder}
            className={`w-full px-3 py-2 pr-10 border bg-background rounded-md text-sm 
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent 
              transition-colors
              ${error ? 'border-destructive' : 'border-input'}
            `}
          />
          <Calendar 
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" 
          />
        </div>
        
        {helperText && !error && (
          <p className="text-xs text-muted-foreground">
            {helperText}
          </p>
        )}
        
        {error && (
          <p className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
