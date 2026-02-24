/**
 * DateField - Timezone-Safe Date Input
 * 
 * A wrapper around DatePicker that ensures all date handling is timezone-safe.
 * Uses toLocalDateString() and parseLocalDate() utilities to prevent timezone bugs.
 * 
 * This is the ONE date input component used everywhere in the app.
 * 
 * Usage:
 * ```tsx
 * <DateField
 *   label="Start Date"
 *   value={startDate}
 *   onChange={setStartDate}
 *   helperText="Working days only"
 *   error={errors.startDate}
 * />
 * ```
 */

import { forwardRef } from 'react';
import { DatePicker } from '../DatePicker';
import { toLocalDateString, parseLocalDate } from '../../lib/dateUtils';

interface DateFieldProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  helperText?: string;
  error?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * DateField Component
 * 
 * Handles conversion between Date objects and string representations
 * using timezone-safe utilities.
 */
export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  (
    {
      label,
      value,
      onChange,
      helperText,
      error,
      placeholder,
      minDate,
      maxDate,
      required = false,
      className = '',
    },
    ref
  ) => {
    // Convert Date to YYYY-MM-DD string for input
    const stringValue = value ? toLocalDateString(value) : '';

    // Convert string back to Date using timezone-safe parsing
    const handleChange = (newValue: string) => {
      if (!newValue) {
        onChange(null);
        return;
      }

      try {
        const parsedDate = parseLocalDate(newValue);
        onChange(parsedDate);
      } catch (err) {
        console.error('DateField parse error:', err);
        onChange(null);
      }
    };

    return (
      <DatePicker
        ref={ref}
        label={label}
        value={stringValue}
        onChange={handleChange}
        helperText={helperText}
        error={error}
        placeholder={placeholder}
        minDate={minDate ? toLocalDateString(minDate) : undefined}
        maxDate={maxDate ? toLocalDateString(maxDate) : undefined}
        required={required}
        className={className}
      />
    );
  }
);

DateField.displayName = 'DateField';
