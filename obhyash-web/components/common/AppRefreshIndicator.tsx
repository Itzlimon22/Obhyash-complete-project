'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AppRefreshIndicatorProps {
  children: ReactNode;
  onRefresh?: () => Promise<void> | void;
  disabled?: boolean;
  displacement?: number; // Resting position during refresh, default 48px
  threshold?: number; // Pull threshold to trigger refresh, default 55px
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

/**
 * AppRefreshIndicator
 * 1:1 Flutter-identical Pull-to-Refresh widget for the web app mobile experience.
 * Detects downward pull gestures on touch devices when scroll offset is at the top,
 * renders a crisp floating circular badge with stroke progress & spinner,
 * provides subtle haptic feedback, and invokes the refresh action.
 */
export const AppRefreshIndicator: React.FC<AppRefreshIndicatorProps> = ({
  children,
  onRefresh,
  disabled = false,
  displacement = 48,
  threshold = 55,
  scrollContainerRef,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const startYRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);
  const isAtTopRef = useRef<boolean>(false);
  const isRefreshingRef = useRef<boolean>(false);

  // Keep ref in sync
  isRefreshingRef.current = isRefreshing;

  // Resolve target scroll element
  const getScrollElement = useCallback((): HTMLElement | Window => {
    if (scrollContainerRef?.current) {
      return scrollContainerRef.current;
    }
    if (containerRef.current) {
      // Find nearest scrollable parent
      let el: HTMLElement | null = containerRef.current.parentElement;
      while (el) {
        const style = window.getComputedStyle(el);
        if (
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          el.scrollHeight > el.clientHeight
        ) {
          return el;
        }
        el = el.parentElement;
      }
    }
    return window;
  }, [scrollContainerRef]);

  // Check if target is at scrollTop <= 0
  const checkIsAtTop = useCallback((): boolean => {
    const el = getScrollElement();
    if (el === window) {
      return window.scrollY <= 0;
    }
    return (el as HTMLElement).scrollTop <= 0;
  }, [getScrollElement]);

  useEffect(() => {
    if (disabled || !onRefresh) return;

    const target = scrollContainerRef?.current || containerRef.current;
    if (!target) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;
      if (e.touches.length !== 1) return;

      if (checkIsAtTop()) {
        startYRef.current = e.touches[0].clientY;
        startXRef.current = e.touches[0].clientX;
        isAtTopRef.current = true;
        isPullingRef.current = false;
      } else {
        isAtTopRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;
      if (!isAtTopRef.current) return;
      if (e.touches.length !== 1) return;

      // Re-verify we are still at top
      if (!checkIsAtTop()) {
        isAtTopRef.current = false;
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - startYRef.current;
      const deltaX = currentX - startXRef.current;

      // If user moved horizontally more than vertically, do not intercept (e.g. tabs or swipe)
      if (!isPullingRef.current && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isAtTopRef.current = false;
        return;
      }

      // If dragging downward at top
      if (deltaY > 0) {
        isPullingRef.current = true;

        // Prevent native browser page bounce/reload conflict
        if (e.cancelable && deltaY > 8) {
          e.preventDefault();
        }

        // Apply Flutter-like resistance damping curve
        const dampened = Math.min(85, Math.pow(deltaY, 0.82) * 1.6);
        setPullDistance(dampened);
      } else {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (isRefreshingRef.current) return;

      if (isPullingRef.current && pullDistance >= threshold) {
        // Trigger Refresh!
        setIsRefreshing(true);
        setPullDistance(displacement);

        // Haptic feedback matching Flutter HapticFeedback.lightImpact()
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
          try {
            window.navigator.vibrate(15);
          } catch {
            // Safe fallback
          }
        }

        try {
          await onRefresh();
        } catch (err) {
          console.error('[AppRefreshIndicator] onRefresh error:', err);
        } finally {
          // Smooth glide back
          setPullDistance(0);
          setTimeout(() => {
            setIsRefreshing(false);
          }, 260);
        }
      } else {
        // Did not reach threshold: snap back smoothly
        setPullDistance(0);
      }

      isPullingRef.current = false;
      isAtTopRef.current = false;
    };

    target.addEventListener('touchstart', handleTouchStart, { passive: true });
    target.addEventListener('touchmove', handleTouchMove, { passive: false });
    target.addEventListener('touchend', handleTouchEnd, { passive: true });
    target.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchmove', handleTouchMove);
      target.removeEventListener('touchend', handleTouchEnd);
      target.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [disabled, onRefresh, displacement, threshold, checkIsAtTop, pullDistance, scrollContainerRef]);

  const progress = Math.min(1, pullDistance / threshold);
  const isVisible = pullDistance > 4 || isRefreshing;
  const opacity = isRefreshing ? 1 : Math.min(1, pullDistance / 18);

  // SVG circumference: r = 9 => 2 * pi * 9 ~= 56.55
  const circumference = 56.55;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div ref={containerRef} className={cn('relative w-full h-full flex flex-col', className)}>
      {/* Floating Refresh Indicator Badge (Flutter Parity) */}
      {isVisible && (
        <div
          style={{
            transform: `translate(-50%, ${pullDistance}px)`,
            opacity: opacity,
            transition: isPullingRef.current ? 'none' : 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease',
          }}
          className="fixed top-2 left-1/2 z-50 pointer-events-none select-none"
        >
          <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1C1C1E] border border-neutral-200/90 dark:border-[#27272A] shadow-lg flex items-center justify-center">
            {isRefreshing ? (
              // Active Spinning Loader
              <div className="w-5 h-5 rounded-full border-[2.5px] border-neutral-200 dark:border-neutral-700 border-t-[#10B981] dark:border-t-[#34D399] animate-spin" />
            ) : (
              // Progress Ring + Rotating Arrow
              <div className="relative w-6 h-6 flex items-center justify-center">
                <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    className="stroke-neutral-100 dark:stroke-neutral-800"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    className="stroke-[#10B981] dark:stroke-[#34D399]"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    fill="none"
                  />
                </svg>
                <ArrowDown
                  size={12}
                  className="absolute text-[#10B981] dark:text-[#34D399] transition-transform duration-75"
                  style={{
                    transform: `rotate(${progress * 180}deg)`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
};

export default AppRefreshIndicator;
