import { useEffect, useState, useRef } from 'react';

export function usePullToRefresh(onRefresh, scrollContainerRef = null) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const isEligible = useRef(false);

  const THRESHOLD = 80;

  useEffect(() => {
    // Determine the scroll container
    const element = scrollContainerRef ? scrollContainerRef.current : window;
    const getScrollTop = () => {
      if (element === window) {
        return window.scrollY || document.documentElement.scrollTop;
      }
      return element.scrollTop;
    };

    if (!element && scrollContainerRef) return;

    const handleTouchStart = (e) => {
      // Check if we are at mobile breakpoint
      if (window.innerWidth >= 640) return;

      // Only eligible if scrolled to the absolute top
      if (getScrollTop() <= 0) {
        isEligible.current = true;
        startY.current = e.touches[0].clientY;
      } else {
        isEligible.current = false;
      }
    };

    const handleTouchMove = (e) => {
      if (!isEligible.current || isRefreshing || window.innerWidth >= 640) return;

      currentY.current = e.touches[0].clientY;
      const pullDistance = currentY.current - startY.current;

      if (pullDistance > 0) {
        setIsPulling(true);
        const progress = Math.min((pullDistance * 0.4) / THRESHOLD, 1);
        setPullProgress(progress);
        
        if (e.cancelable) {
          e.preventDefault();
        }
      } else {
        setIsPulling(false);
        setPullProgress(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isEligible.current || isRefreshing || window.innerWidth >= 640) return;

      const pullDistance = currentY.current - startY.current;
      const progress = (pullDistance * 0.4) / THRESHOLD;

      if (progress >= 1 && onRefresh) {
        setIsRefreshing(true);
        setIsPulling(false);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullProgress(0);
        }
      } else {
        setIsPulling(false);
        setPullProgress(0);
      }
      
      isEligible.current = false;
    };

    const target = element === window ? document : element;

    target.addEventListener('touchstart', handleTouchStart, { passive: true });
    target.addEventListener('touchmove', handleTouchMove, { passive: false });
    target.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchmove', handleTouchMove);
      target.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, scrollContainerRef, isRefreshing]);

  return { isPulling, pullProgress, isRefreshing };
}
