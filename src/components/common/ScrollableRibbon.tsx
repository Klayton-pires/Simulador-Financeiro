import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollableRibbonProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  scrollAmount?: number;
  showFadeGradients?: boolean;
  arrowSize?: 'sm' | 'md' | 'lg';
  id?: string;
  ariaLabel?: string;
}

export const ScrollableRibbon: React.FC<ScrollableRibbonProps> = ({
  children,
  className = '',
  containerClassName = '',
  scrollAmount = 280,
  showFadeGradients = true,
  arrowSize = 'md',
  id,
  ariaLabel = 'Barra de navegação horizontal com opções'
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Check scroll capability
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    // Allow a small 2px tolerance for subpixel rounding
    const hasLeft = scrollLeft > 2;
    const hasRight = scrollLeft < scrollWidth - clientWidth - 2;

    setCanScrollLeft(hasLeft);
    setCanScrollRight(hasRight);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    // Also observe content mutations / size changes
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;

    const delta = direction === 'left' ? -scrollAmount : scrollAmount;
    el.scrollBy({ left: delta, behavior: 'smooth' });

    // Update state quickly and then again after animation completes
    setTimeout(updateScrollState, 100);
    setTimeout(updateScrollState, 350);
  };

  const buttonSizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  }[arrowSize];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }[arrowSize];

  return (
    <div
      id={id}
      role="region"
      aria-label={ariaLabel}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex items-center group/ribbon w-full select-none ${containerClassName}`}
    >
      {/* Left Navigation Arrow */}
      <button
        type="button"
        id={id ? `${id}-nav-left` : undefined}
        onClick={() => handleScroll('left')}
        disabled={!canScrollLeft}
        aria-label="Rolar opções para a esquerda"
        title="Rolar para a esquerda"
        className={`shrink-0 z-20 mr-1.5 flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer ${buttonSizeClasses} ${
          canScrollLeft
            ? 'bg-slate-800/95 hover:bg-indigo-600 text-slate-200 hover:text-white border-slate-700 hover:border-indigo-500 shadow-md shadow-slate-950/40 hover:scale-105 active:scale-95'
            : 'bg-slate-900/40 text-slate-600 border-slate-800/50 cursor-not-allowed opacity-30 pointer-events-none'
        }`}
      >
        <ChevronLeft className={`${iconSizes} stroke-[2.5]`} />
      </button>

      {/* Left Edge Gradient Fade Mask */}
      {showFadeGradients && canScrollLeft && (
        <div className="absolute left-10 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none transition-opacity duration-200" />
      )}

      {/* Scrollable Items Container */}
      <div
        ref={scrollRef}
        className={`flex items-center gap-2 overflow-x-auto scroll-smooth no-scrollbar flex-1 py-1 px-0.5 ${className}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {children}
      </div>

      {/* Right Edge Gradient Fade Mask */}
      {showFadeGradients && canScrollRight && (
        <div className="absolute right-10 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none transition-opacity duration-200" />
      )}

      {/* Right Navigation Arrow */}
      <button
        type="button"
        id={id ? `${id}-nav-right` : undefined}
        onClick={() => handleScroll('right')}
        disabled={!canScrollRight}
        aria-label="Rolar opções para a direita"
        title="Rolar para a direita"
        className={`shrink-0 z-20 ml-1.5 flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer ${buttonSizeClasses} ${
          canScrollRight
            ? 'bg-slate-800/95 hover:bg-indigo-600 text-slate-200 hover:text-white border-slate-700 hover:border-indigo-500 shadow-md shadow-slate-950/40 hover:scale-105 active:scale-95'
            : 'bg-slate-900/40 text-slate-600 border-slate-800/50 cursor-not-allowed opacity-30 pointer-events-none'
        }`}
      >
        <ChevronRight className={`${iconSizes} stroke-[2.5]`} />
      </button>
    </div>
  );
};
