/**
 * Tooltip Component
 * 
 * Provides accessible tooltips with configurable delay for text overflow and hover states.
 * Implements WCAG 2.1 guidelines for supplementary information.
 * 
 * Phase 1.3.3: Text Overflow Handling
 */

import { useState, useRef, useEffect, ReactNode } from 'react';
import designTokens from '../lib/designTokens';

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  className?: string;
}

export function Tooltip({ 
  content, 
  children, 
  delay = 500,
  position = 'top',
  disabled = false,
  className = ''
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = (e: React.MouseEvent) => {
    if (disabled) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    // Calculate position based on prop
    let x = 0;
    let y = 0;
    
    switch (position) {
      case 'top':
        x = rect.left + rect.width / 2;
        y = rect.top - 8;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2;
        y = rect.bottom + 8;
        break;
      case 'left':
        x = rect.left - 8;
        y = rect.top + rect.height / 2;
        break;
      case 'right':
        x = rect.right + 8;
        y = rect.top + rect.height / 2;
        break;
    }
    
    setCoords({ x, y });
    
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTransformOrigin = () => {
    switch (position) {
      case 'top': return 'bottom center';
      case 'bottom': return 'top center';
      case 'left': return 'right center';
      case 'right': return 'left center';
      default: return 'bottom center';
    }
  };

  const getTranslate = () => {
    switch (position) {
      case 'top': return 'translate(-50%, -100%)';
      case 'bottom': return 'translate(-50%, 0)';
      case 'left': return 'translate(-100%, -50%)';
      case 'right': return 'translate(0, -50%)';
      default: return 'translate(-50%, -100%)';
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className={className}
      >
        {children}
      </div>

      {/* Portal-style tooltip */}
      {isVisible && !disabled && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-[1000] pointer-events-none"
          style={{
            left: coords.x,
            top: coords.y,
            transform: getTranslate(),
            transformOrigin: getTransformOrigin(),
            animation: 'tooltipFadeIn 0.15s ease-out',
          }}
        >
          <div
            className="px-2.5 py-1.5 rounded max-w-xs"
            style={{
              backgroundColor: designTokens.colors.neutral[800],
              color: '#ffffff',
              fontSize: designTokens.typography.fontSize.xs,
              fontWeight: designTokens.typography.fontWeight.medium,
              lineHeight: designTokens.typography.lineHeight.tight,
              boxShadow: designTokens.shadows.lg,
              wordWrap: 'break-word',
            }}
          >
            {content}
          </div>
          
          {/* Arrow */}
          <div
            className="absolute"
            style={{
              width: 0,
              height: 0,
              borderStyle: 'solid',
              ...(position === 'top' && {
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
                borderWidth: '4px 4px 0 4px',
                borderColor: `${designTokens.colors.neutral[800]} transparent transparent transparent`,
              }),
              ...(position === 'bottom' && {
                top: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
                borderWidth: '0 4px 4px 4px',
                borderColor: `transparent transparent ${designTokens.colors.neutral[800]} transparent`,
              }),
              ...(position === 'left' && {
                right: '-4px',
                top: '50%',
                transform: 'translateY(-50%)',
                borderWidth: '4px 0 4px 4px',
                borderColor: `transparent transparent transparent ${designTokens.colors.neutral[800]}`,
              }),
              ...(position === 'right' && {
                left: '-4px',
                top: '50%',
                transform: 'translateY(-50%)',
                borderWidth: '4px 4px 4px 0',
                borderColor: `transparent ${designTokens.colors.neutral[800]} transparent transparent`,
              }),
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes tooltipFadeIn {
          from {
            opacity: 0;
            transform: ${getTranslate()} scale(0.95);
          }
          to {
            opacity: 1;
            transform: ${getTranslate()} scale(1);
          }
        }
      `}</style>
    </>
  );
}

/**
 * TruncatedText Component
 * 
 * Smart text truncation with automatic tooltip on hover.
 * Only shows tooltip if text is actually truncated.
 */

interface TruncatedTextProps {
  text: string;
  className?: string;
  maxLines?: number;
  delay?: number;
}

export function TruncatedText({ 
  text, 
  className = '', 
  maxLines = 1,
  delay = 500 
}: TruncatedTextProps) {
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (textRef.current) {
      const element = textRef.current;
      // Check if text is truncated
      const truncated = element.scrollWidth > element.clientWidth || 
                       element.scrollHeight > element.clientHeight;
      setIsTruncated(truncated);
    }
  }, [text]);

  return (
    <Tooltip 
      content={text} 
      disabled={!isTruncated}
      delay={delay}
    >
      <span
        ref={textRef}
        className={`truncate ${className}`}
        style={{
          display: maxLines === 1 ? 'block' : '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {text}
      </span>
    </Tooltip>
  );
}
