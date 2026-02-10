/**
 * CSV Parser Utility
 * Handles parsing CSV files and converting to typed data structures
 */

export interface CSVParseResult<T> {
  data: T[];
  errors: ParseError[];
  warnings: string[];
}

export interface ParseError {
  row: number;
  field: string;
  message: string;
  value: any;
}

export interface ColumnMapping {
  csvColumn: string;
  dataField: string;
  required: boolean;
  validator?: (value: any) => boolean;
  transformer?: (value: any) => any;
}

/**
 * Parse CSV file content into array of objects
 */
export const parseCSV = (csvContent: string): { headers: string[]; rows: string[][] } => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const rows = lines.slice(1).map(line => parseCSVLine(line));
  
  return { headers, rows };
};

/**
 * Parse a single CSV line, handling quoted values
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Handle escaped quotes
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

/**
 * Validate and transform CSV data based on column mappings
 */
export const validateAndTransformCSV = <T>(
  headers: string[],
  rows: string[][],
  mappings: ColumnMapping[]
): CSVParseResult<T> => {
  const data: T[] = [];
  const errors: ParseError[] = [];
  const warnings: string[] = [];
  
  // Check for required columns
  const requiredMappings = mappings.filter(m => m.required);
  for (const mapping of requiredMappings) {
    if (!headers.includes(mapping.csvColumn)) {
      errors.push({
        row: 0,
        field: mapping.csvColumn,
        message: `Required column "${mapping.csvColumn}" not found in CSV`,
        value: null
      });
    }
  }
  
  // If missing required columns, return early
  if (errors.length > 0) {
    return { data: [], errors, warnings };
  }
  
  // Create column index map
  const columnIndexMap = new Map<string, number>();
  headers.forEach((header, index) => {
    columnIndexMap.set(header, index);
  });
  
  // Process each row
  rows.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2; // +2 because row 1 is header, and we're 0-indexed
    const item: any = {};
    let hasErrors = false;
    
    for (const mapping of mappings) {
      const columnIndex = columnIndexMap.get(mapping.csvColumn);
      
      if (columnIndex === undefined) {
        // Column not found - skip if not required
        if (mapping.required) {
          errors.push({
            row: rowNumber,
            field: mapping.csvColumn,
            message: `Required column "${mapping.csvColumn}" not found`,
            value: null
          });
          hasErrors = true;
        }
        continue;
      }
      
      let value = row[columnIndex];
      
      // Check for empty required fields
      if (mapping.required && (!value || value.trim() === '')) {
        errors.push({
          row: rowNumber,
          field: mapping.csvColumn,
          message: `Required field "${mapping.csvColumn}" is empty`,
          value: null
        });
        hasErrors = true;
        continue;
      }
      
      // Transform value if transformer provided
      if (mapping.transformer) {
        try {
          value = mapping.transformer(value);
        } catch (error) {
          errors.push({
            row: rowNumber,
            field: mapping.csvColumn,
            message: `Failed to transform value: ${error}`,
            value
          });
          hasErrors = true;
          continue;
        }
      }
      
      // Validate value if validator provided
      if (mapping.validator && !mapping.validator(value)) {
        errors.push({
          row: rowNumber,
          field: mapping.csvColumn,
          message: `Invalid value for "${mapping.csvColumn}"`,
          value
        });
        hasErrors = true;
        continue;
      }
      
      item[mapping.dataField] = value;
    }
    
    if (!hasErrors) {
      data.push(item as T);
    }
  });
  
  return { data, errors, warnings };
};

/**
 * Common transformers for CSV data
 */
export const transformers = {
  toString: (value: any): string => String(value || '').trim(),
  
  toNumber: (value: any): number => {
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`Cannot convert "${value}" to number`);
    }
    return num;
  },
  
  toDate: (value: any): Date => {
    if (!value) throw new Error('Date value is empty');
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: "${value}". Expected format: YYYY-MM-DD`);
    }
    return date;
  },
  
  toBoolean: (value: any): boolean => {
    const str = String(value).toLowerCase().trim();
    if (['true', 'yes', '1', 'y'].includes(str)) return true;
    if (['false', 'no', '0', 'n', ''].includes(str)) return false;
    throw new Error(`Cannot convert "${value}" to boolean`);
  },
  
  toEnum: <T extends string>(allowedValues: T[]) => (value: any): T => {
    const str = String(value).trim();
    if (!allowedValues.includes(str as T)) {
      throw new Error(`Value must be one of: ${allowedValues.join(', ')}`);
    }
    return str as T;
  }
};

/**
 * Common validators for CSV data
 */
export const validators = {
  isNotEmpty: (value: any): boolean => {
    return value !== null && value !== undefined && String(value).trim() !== '';
  },
  
  isNumber: (value: any): boolean => {
    return !isNaN(Number(value));
  },
  
  isPositive: (value: any): boolean => {
    return Number(value) > 0;
  },
  
  isDate: (value: any): boolean => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  },
  
  isEmail: (value: any): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(value));
  },
  
  isInRange: (min: number, max: number) => (value: any): boolean => {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max;
  }
};

/**
 * Export data to CSV format
 */
export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) {
    throw new Error('No data to export');
  }
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => {
      return headers.map(header => {
        const value = row[header];
        
        // Handle special values
        if (value === null || value === undefined) {
          return '';
        }
        
        // Handle dates
        if (value instanceof Date) {
          return value.toISOString().split('T')[0];
        }
        
        // Escape values with commas or quotes
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        
        return str;
      }).join(',');
    })
  ];
  
  const csv = csvRows.join('\n');
  
  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};
