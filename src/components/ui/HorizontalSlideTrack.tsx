import React, { useRef, useState, useEffect, useCallback } from 'react';

interface HorizontalSlideTrackProps {
  children: React.ReactNode;
  /** Classes for outer wrapper */
  className?: string;
  /** Classes for scrollable inner row */
  trackClassName?: string;
  /** Visual accent of moving indicator thumb */
  accent?: 'dark' | 'primary';
  /** Indicator rail width style */
  indicatorSize?: 'compact' | 'wide';
  /** Alignment of indicator rail below content */
  indicatorAlign?: 'center' | 'start';
  /** When to render indicator: 'auto' (whenever overflowing), 'mobile-only' (md:hidden when overflowing), 'always' */
  visibility?: 'auto' | 'mobile-only' | 'always';
  /** Apply soft gradient fade mask on overflowing edges */
  fadeEdges?: boolean;
  /** Optional active key — smoothly centers the child marked with data-slide-active="true" */
  activeKey?: string | number;
  /** Extra classes for the indicator container */
  indicatorClassName?: string;
}

export const HorizontalSlideTrack: React.FC<HorizontalSlideTrackProps> = ({
  children,
  className = '',
  trackClassName = 'flex items-center gap-2',
  accent = 'dark',
  indicatorSize = 'compact',
  indicatorAlign = 'center',
  visibility = 'auto',
  fadeEdges = true,
  activeKey,
  indicatorClassName = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const moveTimerRef = useRef<number | null>(null);
  const pointerDragRef = useRef<{
    active: boolean;
    startX: number;
    startScrollLeft: number;
    moved: boolean;
  }>({ active: false, startX: 0, startScrollLeft: 0, moved: false });
  const suppressNextClickRef = useRef(false);

  const [metrics, setMetrics] = useState({
    hasOverflow: false,
    canScrollLeft: false,
    canScrollRight: false,
    progress: 0,
    thumbRatio: 0.45,
    thumbPxWidth: 28,
    thumbPxX: 0,
  });
  const [isMoving, setIsMoving] = useState(false);

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const hasOverflow = maxScroll > 2;
    const progress = hasOverflow ? Math.min(1, Math.max(0, scrollLeft / maxScroll)) : 0;
    const thumbRatio = scrollWidth > 0 ? Math.min(0.82, Math.max(0.24, clientWidth / scrollWidth)) : 0.45;

    const railW = railRef.current?.clientWidth || (indicatorSize === 'wide' ? 140 : 76);
    const thumbPxWidth = hasOverflow ? Math.max(18, Math.round(railW * thumbRatio)) : Math.round(railW * 0.56);
    const maxTravel = Math.max(0, railW - thumbPxWidth);
    const thumbPxX = hasOverflow ? progress * maxTravel : 0;

    setMetrics({
      hasOverflow,
      canScrollLeft: hasOverflow && scrollLeft > 3,
      canScrollRight: hasOverflow && scrollLeft < maxScroll - 3,
      progress,
      thumbRatio,
      thumbPxWidth,
      thumbPxX,
    });
  }, [indicatorSize]);

  const pulseMotion = useCallback(() => {
    setIsMoving(true);
    if (moveTimerRef.current) window.clearTimeout(moveTimerRef.current);
    moveTimerRef.current = window.setTimeout(() => {
      setIsMoving(false);
      moveTimerRef.current = null;
    }, 220);
  }, []);

  useEffect(() => {
    measure();
    const el = scrollRef.current;
    const rail = railRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (rail) ro.observe(rail);
    Array.from(el.children).forEach((child) => ro.observe(child));
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, children]);

  // Smoothly bring the active item into comfortable reach when activeKey changes
  useEffect(() => {
    if (activeKey === undefined) return;
    const el = scrollRef.current;
    if (!el) return;
    const activeNode = el.querySelector<HTMLElement>('[data-slide-active="true"]');
    if (!activeNode) return;

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    if (maxScroll <= 2) return;

    const targetLeft =
      activeNode.offsetLeft - el.clientWidth / 2 + activeNode.offsetWidth / 2;
    const clamped = Math.max(0, Math.min(maxScroll, targetLeft));
    if (Math.abs(clamped - el.scrollLeft) > 4) {
      el.scrollTo({ left: clamped, behavior: 'smooth' });
      pulseMotion();
    }
  }, [activeKey, pulseMotion]);

  useEffect(() => {
    return () => {
      if (moveTimerRef.current) window.clearTimeout(moveTimerRef.current);
    };
  }, []);

  const handleScroll = () => {
    measure();
    pulseMotion();
  };

  // Mouse-only click-drag convenience (touch uses native momentum pan-x)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !metrics.hasOverflow) return;
    const el = scrollRef.current;
    if (!el) return;
    pointerDragRef.current = {
      active: true,
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const drag = pointerDragRef.current;
      if (!drag.active || !scrollRef.current) return;
      const dx = e.clientX - drag.startX;
      if (Math.abs(dx) > 5) {
        drag.moved = true;
      }
      if (drag.moved) {
        scrollRef.current.scrollLeft = drag.startScrollLeft - dx;
      }
    };
    const onMouseUp = () => {
      const drag = pointerDragRef.current;
      if (!drag.active) return;
      if (drag.moved) {
        suppressNextClickRef.current = true;
        window.setTimeout(() => {
          suppressNextClickRef.current = false;
        }, 40);
      }
      drag.active = false;
      drag.moved = false;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressNextClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleRailClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    const rail = railRef.current;
    if (!el || !rail || !metrics.hasOverflow) return;
    const rect = rail.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    el.scrollTo({ left: ratio * maxScroll, behavior: 'smooth' });
    pulseMotion();
  };

  // Dynamic edge fade mask when content overflows left/right
  const maskStyle: React.CSSProperties | undefined =
    fadeEdges && (metrics.canScrollLeft || metrics.canScrollRight)
      ? {
          maskImage: `linear-gradient(to right, ${
            metrics.canScrollLeft ? 'transparent 0px, black 16px' : 'black 0px'
          }, ${
            metrics.canScrollRight ? 'black calc(100% - 16px), transparent 100%' : 'black 100%'
          })`,
          WebkitMaskImage: `linear-gradient(to right, ${
            metrics.canScrollLeft ? 'transparent 0px, black 16px' : 'black 0px'
          }, ${
            metrics.canScrollRight ? 'black calc(100% - 16px), transparent 100%' : 'black 100%'
          })`,
        }
      : undefined;

  const showIndicator = visibility === 'always' || metrics.hasOverflow;
  const visibilityClass = visibility === 'mobile-only' ? 'md:hidden' : '';

  const thumbRestColor =
    accent === 'primary' ? 'bg-[#ee2e65]/80' : 'bg-[#1C1D21]/75';
  const thumbActiveColor =
    accent === 'primary'
      ? 'bg-[#ee2e65] shadow-[0_0_10px_rgba(238,46,101,0.45)]'
      : 'bg-[#1C1D21] shadow-[0_1px_8px_rgba(28,29,33,0.3)]';

  return (
    <div className={`min-w-0 ${className}`}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onClickCapture={handleClickCapture}
        style={maskStyle}
        className={`no-scrollbar overflow-x-auto touch-pan-x ${trackClassName}`}
      >
        {children}
      </div>

      {showIndicator && (
        <div
          className={`animate-ui-fade mt-1.5 flex ${
            indicatorAlign === 'center' ? 'justify-center' : 'justify-start'
          } ${visibilityClass} ${indicatorClassName}`}
        >
          <div
            ref={railRef}
            role="presentation"
            onClick={handleRailClick}
            title="Geser atau ketuk untuk melihat item lainnya"
            className={`relative h-[4px] rounded-full bg-black/[0.08] cursor-pointer transition-all duration-200 ${
              indicatorSize === 'wide' ? 'w-32 sm:w-40' : 'w-[76px]'
            } ${isMoving ? 'bg-black/[0.12]' : ''}`}
          >
            <span
              className={`slide-indicator-thumb absolute top-0 left-0 h-full rounded-full pointer-events-none ${
                isMoving
                  ? `${thumbActiveColor} scale-y-[1.45] scale-x-[1.05]`
                  : `${thumbRestColor} scale-100`
              }`}
              style={{
                width: `${metrics.thumbPxWidth}px`,
                transform: `translate3d(${metrics.thumbPxX}px, 0, 0)`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
