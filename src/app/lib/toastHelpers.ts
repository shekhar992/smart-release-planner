/**
 * Toast Helper Functions
 * 
 * Semantic wrappers around sonner's toast() for consistent messaging.
 * All toasts use design tokens for colors and follow the same pattern.
 * 
 * Usage:
 * ```tsx
 * import { toastSuccess, toastWarning, toastError, toastInfo } from '../lib/toastHelpers';
 * 
 * toastSuccess('Holiday added', '3 tickets recalculated automatically');
 * toastWarning('Sprint 2 at 92% capacity');
 * toastError('Failed to import tickets', 'Please check the CSV format');
 * toastInfo('Ticket moved to Mar 16');
 * ```
 */

import { toast } from 'sonner';
import designTokens from './designTokens';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

/**
 * Success toast - Green
 * Use for: Completed actions, successful operations
 */
export const toastSuccess = (
  message: string,
  description?: string,
  duration?: number
) => {
  return toast.success(message, {
    description,
    duration: duration || 4000,
    style: {
      background: designTokens.colors.semantic.success,
      color: '#FFFFFF',
      border: 'none'
    }
  });
};

/**
 * Warning toast - Amber
 * Use for: At-risk conditions, attention needed
 */
export const toastWarning = (
  message: string,
  description?: string,
  duration?: number
) => {
  return toast.warning(message, {
    description,
    duration: duration || 5000,
    style: {
      background: designTokens.colors.semantic.warning,
      color: '#1F2937',
      border: 'none'
    }
  });
};

/**
 * Error toast - Red
 * Use for: Errors, failures, destructive outcomes
 */
export const toastError = (
  message: string,
  description?: string,
  duration?: number
) => {
  return toast.error(message, {
    description,
    duration: duration || 6000,
    style: {
      background: designTokens.colors.semantic.error,
      color: '#FFFFFF',
      border: 'none'
    }
  });
};

/**
 * Info toast - Blue
 * Use for: Informational messages, neutral updates
 */
export const toastInfo = (
  message: string,
  description?: string,
  duration?: number
) => {
  return toast.info(message, {
    description,
    duration: duration || 4000,
    style: {
      background: designTokens.colors.semantic.info,
      color: '#FFFFFF',
      border: 'none'
    }
  });
};

/**
 * Insight toast - Special styling for assistant/proactive messages
 * Use for: Smart suggestions, proactive insights from engines
 */
export const toastInsight = (
  title: string,
  description: string,
  action?: ToastAction,
  duration?: number
) => {
  return toast(title, {
    description,
    duration: duration || 7000,
    action: action
      ? {
          label: action.label,
          onClick: action.onClick
        }
      : undefined,
    style: {
      background: '#F3F4F6',
      color: '#1F2937',
      border: `1px solid ${designTokens.colors.neutral[300]}`
    }
  });
};

/**
 * Promise toast - Shows loading → success/error
 * Use for: Long-running operations (import, export, allocation)
 */
export const toastPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) => {
  return toast.promise(promise, messages);
};

/**
 * Dismiss a specific toast
 */
export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};
