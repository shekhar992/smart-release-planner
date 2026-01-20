import React from 'react';
import { cn } from './utils';
import { cva, type VariantProps } from 'class-variance-authority';

// Modern Card System - Inspired by Linear & Notion
const modernCardVariants = cva(
  "bg-white dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-800/60 rounded-xl transition-all duration-200 ease-out relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "shadow-sm hover:shadow-md hover:border-gray-300/60 dark:hover:border-gray-700/60",
        elevated: "shadow-lg hover:shadow-xl border-gray-100 dark:border-gray-800",
        flat: "shadow-none border-gray-200/40 dark:border-gray-800/40 hover:border-gray-300/60 dark:hover:border-gray-700/60",
        glass: "backdrop-blur-md bg-white/80 dark:bg-gray-900/40 border-white/20 dark:border-gray-700/30 shadow-lg",
        interactive: "shadow-sm hover:shadow-lg hover:scale-[1.02] cursor-pointer border-gray-200/60 hover:border-blue-300/60 dark:hover:border-blue-600/40"
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10"
      },
      spacing: {
        tight: "space-y-2",
        default: "space-y-4",
        relaxed: "space-y-6",
        loose: "space-y-8"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      spacing: "default"
    }
  }
);

export interface ModernCardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof modernCardVariants> {}

export const ModernCard = React.forwardRef<HTMLDivElement, ModernCardProps>(
  ({ className, variant, size, spacing, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(modernCardVariants({ variant, size, spacing }), className)}
      {...props}
    />
  )
);
ModernCard.displayName = "ModernCard";

// Enhanced Button System - Inspired by Linear's refined buttons
const modernButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md active:bg-blue-800 focus-visible:ring-blue-500/40",
        secondary: "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 hover:shadow-md dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
        outline: "border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:bg-gray-800/50",
        ghost: "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md",
        success: "bg-green-600 text-white shadow-sm hover:bg-green-700 hover:shadow-md",
        premium: "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-blue-700"
      },
      size: {
        xs: "h-7 px-2.5 text-xs",
        sm: "h-8 px-3 text-sm",
        default: "h-9 px-4 py-2",
        lg: "h-10 px-6 text-base",
        xl: "h-12 px-8 text-lg",
        icon: "h-9 w-9 p-0"
      },
      rounded: {
        default: "rounded-lg",
        full: "rounded-full",
        none: "rounded-none"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      rounded: "default"
    }
  }
);

export interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof modernButtonVariants> {
  loading?: boolean;
}

export const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ className, variant, size, rounded, loading, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(modernButtonVariants({ variant, size, rounded }), className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </div>
      )}
      <span className={cn("flex items-center gap-2", loading && "opacity-0")}>
        {children}
      </span>
    </button>
  )
);
ModernButton.displayName = "ModernButton";

// Enhanced Input System
const modernInputVariants = cva(
  "flex w-full rounded-lg border bg-white px-3 py-2 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-900/50",
  {
    variants: {
      variant: {
        default: "border-gray-300 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-gray-700 dark:focus-visible:border-blue-400",
        error: "border-red-500 focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/20",
        success: "border-green-500 focus-visible:border-green-500 focus-visible:ring-2 focus-visible:ring-green-500/20"
      },
      size: {
        sm: "h-8 px-2.5 text-xs",
        default: "h-9 px-3",
        lg: "h-10 px-4 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ModernInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof modernInputVariants> {}

export const ModernInput = React.forwardRef<HTMLInputElement, ModernInputProps>(
  ({ className, variant, size, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(modernInputVariants({ variant, size }), className)}
      {...props}
    />
  )
);
ModernInput.displayName = "ModernInput";

// Status Badge System - Inspired by Linear's status indicators
const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        primary: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusBadgeVariants> {
  dot?: boolean;
}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant, size, dot, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(statusBadgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && <div className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
);
StatusBadge.displayName = "StatusBadge";

// Modern Progress Bar
export interface ModernProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  className?: string;
}

export const ModernProgress = React.forwardRef<HTMLDivElement, ModernProgressProps>(
  ({ value, max = 100, size = 'default', variant = 'default', showLabel = false, className }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    const sizeClasses = {
      sm: 'h-1.5',
      default: 'h-2',
      lg: 'h-3'
    };
    
    const variantClasses = {
      default: 'bg-blue-500',
      success: 'bg-green-500',
      warning: 'bg-amber-500',
      error: 'bg-red-500'
    };
    
    return (
      <div ref={ref} className={cn("relative", className)}>
        <div className={cn(
          "w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden",
          sizeClasses[size]
        )}>
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 block">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }
);
ModernProgress.displayName = "ModernProgress";

// Floating Action Button - Inspired by modern mobile patterns
export interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'default' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ className, size = 'default', position = 'bottom-right', children, ...props }, ref) => {
    const sizeClasses = {
      default: 'h-12 w-12',
      lg: 'h-14 w-14'
    };
    
    const positionClasses = {
      'bottom-right': 'fixed bottom-6 right-6',
      'bottom-left': 'fixed bottom-6 left-6',
      'top-right': 'fixed top-6 right-6',
      'top-left': 'fixed top-6 left-6'
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 transition-all duration-200 z-50",
          sizeClasses[size],
          positionClasses[position],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
FloatingActionButton.displayName = "FloatingActionButton";

// Enhanced Sidebar with modern navigation
export interface ModernSidebarProps extends React.HTMLAttributes<HTMLElement> {
  collapsed?: boolean;
  variant?: 'default' | 'glass' | 'minimal';
}

export const ModernSidebar = React.forwardRef<HTMLElement, ModernSidebarProps>(
  ({ className, collapsed = false, variant = 'default', children, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
      glass: 'backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-r border-white/20 dark:border-gray-700/30',
      minimal: 'bg-gray-50 dark:bg-gray-950 border-r border-gray-200/50 dark:border-gray-800/50'
    };
    
    return (
      <aside
        ref={ref}
        className={cn(
          "flex flex-col transition-all duration-300 ease-out",
          collapsed ? "w-16" : "w-64",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </aside>
    );
  }
);
ModernSidebar.displayName = "ModernSidebar";

// Command Palette - Inspired by Linear's command palette
export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
}

export const CommandPalette = React.forwardRef<HTMLDivElement, CommandPaletteProps>(
  ({ open, onOpenChange, placeholder = "Type a command or search..." }, ref) => {
    if (!open) return null;
    
    return (
      <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
        <div className="fixed left-1/2 top-1/4 -translate-x-1/2 w-full max-w-lg">
          <div
            ref={ref}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 flex-1">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  className="flex-1 bg-transparent border-0 outline-none text-sm placeholder-gray-500"
                  placeholder={placeholder}
                  autoFocus
                />
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {/* Command items would go here */}
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No results found
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
CommandPalette.displayName = "CommandPalette";

export {
  modernCardVariants,
  modernButtonVariants,
  modernInputVariants,
  statusBadgeVariants
};
