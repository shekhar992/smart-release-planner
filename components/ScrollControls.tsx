import { useState, useEffect } from 'react';
import { useGantt } from '../contexts/GanttContext';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Calendar, Home, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

interface ScrollControlsProps {
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

export function ScrollControls({ scrollAreaRef, className }: ScrollControlsProps) {
  const { getDateRange, currentView, viewConfig, selectedYear, scrollToToday } = useGantt();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const { units, todayIndex } = getDateRange();
  const today = new Date();
  const isTodayInRange = todayIndex !== -1;

  const checkScrollability = () => {
    if (!scrollAreaRef.current) return;
    
    const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewport) return;

    const { scrollLeft, scrollWidth, clientWidth } = viewport;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewport) return;

    // Check initial state
    checkScrollability();

    // Listen for scroll events
    const handleScroll = () => {
      checkScrollability();
    };

    // Listen for resize events
    const handleResize = () => {
      checkScrollability();
    };

    viewport.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Use ResizeObserver to watch for content changes
    const resizeObserver = new ResizeObserver(checkScrollability);
    resizeObserver.observe(viewport);

    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [scrollAreaRef]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollAreaRef.current || isScrolling) return;

    const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewport) return;

    setIsScrolling(true);
    
    // Scroll by multiple units for more noticeable movement
    const scrollAmount = viewConfig.unitWidth * 5;
    const targetScrollLeft = direction === 'left' 
      ? viewport.scrollLeft - scrollAmount
      : viewport.scrollLeft + scrollAmount;

    viewport.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: 'smooth'
    });

    // Reset scrolling flag after animation
    setTimeout(() => setIsScrolling(false), 300);
  };

  const handleScrollToToday = () => {
    if (isTodayInRange && scrollToToday && !isScrolling) {
      setIsScrolling(true);
      scrollToToday();
      // Reset scrolling flag after animation
      setTimeout(() => setIsScrolling(false), 500);
    }
  };

  const scrollToStart = () => {
    if (!scrollAreaRef.current || isScrolling) return;

    const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewport) return;

    setIsScrolling(true);
    
    viewport.scrollTo({
      left: 0,
      behavior: 'smooth'
    });

    setTimeout(() => setIsScrolling(false), 500);
  };

  const scrollToEnd = () => {
    if (!scrollAreaRef.current || isScrolling) return;

    const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewport) return;

    setIsScrolling(true);
    
    viewport.scrollTo({
      left: viewport.scrollWidth,
      behavior: 'smooth'
    });

    setTimeout(() => setIsScrolling(false), 500);
  };

  // Don't render if timeline is too small to scroll
  const timelineWidth = units.length * viewConfig.unitWidth;
  const shouldShowControls = canScrollLeft || canScrollRight || timelineWidth > 1000;

  if (!shouldShowControls) {
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        Timeline fits in view
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Navigation arrows with enhanced styling */}
      <div className="flex items-center bg-white rounded-lg border shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => scroll('left')}
          disabled={!canScrollLeft || isScrolling}
          className="h-9 w-9 p-0 hover:bg-blue-50 border-r rounded-r-none"
          aria-label="Scroll left"
          title="Scroll left (or use ← key)"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => scroll('right')}
          disabled={!canScrollRight || isScrolling}
          className="h-9 w-9 p-0 hover:bg-blue-50 rounded-l-none"
          aria-label="Scroll right"
          title="Scroll right (or use → key)"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick navigation buttons with enhanced styling */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={scrollToStart}
          disabled={isScrolling || !canScrollLeft}
          className="h-9 px-3 bg-white hover:bg-gray-50"
          aria-label="Go to start"
          title="Go to start of timeline"
        >
          <Home className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">Start</span>
        </Button>

        {isTodayInRange ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleScrollToToday}
            disabled={isScrolling}
            className="h-9 px-3 bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-700 hover:from-red-100 hover:to-rose-100 hover:border-red-300 shadow-sm"
            aria-label="Go to today"
            title={`Go to today (${format(today, 'dd/MM/yyyy')}) - Press T key`}
          >
            <Calendar className="w-4 h-4 mr-1" />
            <span className="text-sm font-semibold">Today</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={scrollToEnd}
            disabled={isScrolling || !canScrollRight}
            className="h-9 px-3 bg-white hover:bg-gray-50"
            aria-label="Go to end"
            title="Go to end of timeline"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">End</span>
          </Button>
        )}
      </div>

      {/* Enhanced status indicator */}
      <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border ml-2 min-w-[120px]">
        <div className="font-medium">
          {isTodayInRange 
            ? `Today: ${format(today, 'dd/MM')}`
            : currentView === 'day' && selectedYear !== today.getFullYear()
            ? `Year: ${selectedYear}`
            : 'Navigate Timeline'
          }
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {canScrollLeft || canScrollRight ? 'Use controls or arrow keys' : 'Timeline fits in view'}
        </div>
      </div>
    </div>
  );
}