import { useEffect } from 'react';

interface TimelineEnhancementsProps {
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  viewConfig: { unitWidth: number };
}

export function TimelineEnhancements({ scrollAreaRef, viewConfig }: TimelineEnhancementsProps) {
  useEffect(() => {
    if (!scrollAreaRef.current) return;

    const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewport) return;

    // Enhanced mouse wheel horizontal scrolling
    const handleWheel = (e: WheelEvent) => {
      // If shift is held, scroll horizontally
      if (e.shiftKey) {
        e.preventDefault();
        viewport.scrollBy({
          left: e.deltaY > 0 ? viewConfig.unitWidth * 2 : -viewConfig.unitWidth * 2,
          behavior: 'smooth'
        });
      }
      // If ctrl/cmd is held, zoom functionality could be added here
      else if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        // Future: implement zoom in/out
      }
      // Normal scroll: if there's no vertical scroll needed, scroll horizontally
      else if (viewport.scrollHeight <= viewport.clientHeight && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault();
        viewport.scrollBy({
          left: e.deltaY > 0 ? viewConfig.unitWidth : -viewConfig.unitWidth,
          behavior: 'smooth'
        });
      }
    };

    // Enhanced keyboard navigation
    const handleKeydown = (e: KeyboardEvent) => {
      if (!scrollAreaRef.current?.contains(document.activeElement)) return;

      const scrollAmount = viewConfig.unitWidth * 3;
      
      switch (e.key) {
        case 'PageUp':
          e.preventDefault();
          viewport.scrollBy({ left: -scrollAmount * 3, behavior: 'smooth' });
          break;
        case 'PageDown':
          e.preventDefault();
          viewport.scrollBy({ left: scrollAmount * 3, behavior: 'smooth' });
          break;
        case ' ': // Spacebar
          if (e.shiftKey) {
            e.preventDefault();
            viewport.scrollBy({ left: -scrollAmount * 2, behavior: 'smooth' });
          } else {
            e.preventDefault();
            viewport.scrollBy({ left: scrollAmount * 2, behavior: 'smooth' });
          }
          break;
      }
    };

    // Mouse drag to scroll (like timeline scrubbing)
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;

    const handleMouseDown = (e: MouseEvent) => {
      // Only start dragging if clicking in empty timeline area
      const target = e.target as HTMLElement;
      if (target.closest('[draggable="true"]') || target.closest('button') || target.closest('[role="button"]')) {
        return;
      }

      isDragging = true;
      startX = e.pageX - viewport.offsetLeft;
      scrollLeft = viewport.scrollLeft;
      viewport.style.cursor = 'grabbing';
      viewport.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - viewport.offsetLeft;
      const walk = (x - startX) * 2; // Multiply for faster scrolling
      viewport.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
      isDragging = false;
      viewport.style.cursor = '';
      viewport.style.userSelect = '';
    };

    // Add event listeners
    viewport.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeydown);
    viewport.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Cleanup
    return () => {
      viewport.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeydown);
      viewport.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [scrollAreaRef, viewConfig]);

  return null;
}
