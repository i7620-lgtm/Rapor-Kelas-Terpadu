import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';

export interface UseTableVirtualizerOptions {
  count: number;
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  estimateRowHeight: number;
  overscan?: number;
  getItemKey?: (index: number) => string | number;
}

export interface VirtualRangeResult {
  startIndex: number;
  endIndex: number;
  topSpacerHeight: number;
  bottomSpacerHeight: number;
  totalHeight: number;
  measureRow: (index: number, el: HTMLElement | null) => void;
  scrollToIndex: (index: number, align?: 'nearest' | 'start' | 'center') => void;
}

export function useTableVirtualizer({
  count,
  scrollContainerRef,
  estimateRowHeight,
  overscan = 8,
  getItemKey,
}: UseTableVirtualizerOptions): VirtualRangeResult {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState<number>(() =>
    typeof window !== 'undefined' ? Math.max(520, Math.round(window.innerHeight * 0.72)) : 680
  );
  const [theadHeight, setTheadHeight] = useState(0);
  const [measureVersion, setMeasureVersion] = useState(0);

  const sizeMapRef = useRef<Map<string | number, number>>(new Map());
  const rowElementsRef = useRef<Map<number, HTMLElement>>(new Map());
  const elementToKeyRef = useRef<WeakMap<Element, string | number>>(new WeakMap());
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const rafMeasureRef = useRef<number | null>(null);
  const rafScrollRef = useRef<number | null>(null);

  const getKeyForIndex = useCallback(
    (index: number): string | number => {
      if (getItemKey) return getItemKey(index);
      return index;
    },
    [getItemKey]
  );

  const scheduleMeasureBump = useCallback(() => {
    if (rafMeasureRef.current !== null) return;
    rafMeasureRef.current = requestAnimationFrame(() => {
      rafMeasureRef.current = null;
      setMeasureVersion((v) => v + 1);
    });
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver((entries) => {
      let changed = false;
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const key = elementToKeyRef.current.get(entry.target);
        if (key === undefined) continue;
        const measured = Math.round(
          entry.borderBoxSize?.[0]?.blockSize ??
            (entry.target as HTMLElement).getBoundingClientRect().height
        );
        if (measured > 0 && sizeMapRef.current.get(key) !== measured) {
          sizeMapRef.current.set(key, measured);
          changed = true;
        }
      }
      if (changed) {
        scheduleMeasureBump();
      }
    });

    resizeObserverRef.current = ro;
    return () => {
      ro.disconnect();
      resizeObserverRef.current = null;
      if (rafMeasureRef.current !== null) {
        cancelAnimationFrame(rafMeasureRef.current);
        rafMeasureRef.current = null;
      }
    };
  }, [scheduleMeasureBump]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateMetrics = () => {
      const nextHeight = container.clientHeight;
      if (nextHeight > 0) {
        setViewportHeight((prev) => (prev !== nextHeight ? nextHeight : prev));
      }
      const thead = container.querySelector('thead');
      const nextTheadHeight = thead ? Math.round(thead.getBoundingClientRect().height) : 0;
      setTheadHeight((prev) => (prev !== nextTheadHeight ? nextTheadHeight : prev));
      setScrollTop(container.scrollTop);
    };

    updateMetrics();

    const handleScroll = () => {
      const nextTop = container.scrollTop;
      if (rafScrollRef.current !== null) {
        cancelAnimationFrame(rafScrollRef.current);
      }
      rafScrollRef.current = requestAnimationFrame(() => {
        rafScrollRef.current = null;
        setScrollTop(nextTop);
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    let containerRo: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      containerRo = new ResizeObserver(() => {
        updateMetrics();
      });
      containerRo.observe(container);
      const thead = container.querySelector('thead');
      if (thead) containerRo.observe(thead);
    }

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafScrollRef.current !== null) {
        cancelAnimationFrame(rafScrollRef.current);
        rafScrollRef.current = null;
      }
      if (containerRo) {
        containerRo.disconnect();
      }
    };
  }, [scrollContainerRef, count]);

  const measureRow = useCallback(
    (index: number, el: HTMLElement | null) => {
      const prevEl = rowElementsRef.current.get(index);
      if (prevEl && prevEl !== el) {
        resizeObserverRef.current?.unobserve(prevEl);
        rowElementsRef.current.delete(index);
      }

      if (!el) return;

      const key = getKeyForIndex(index);
      rowElementsRef.current.set(index, el);
      elementToKeyRef.current.set(el, key);

      const height = Math.round(el.getBoundingClientRect().height);
      if (height > 0 && sizeMapRef.current.get(key) !== height) {
        sizeMapRef.current.set(key, height);
        scheduleMeasureBump();
      }

      resizeObserverRef.current?.observe(el);
    },
    [getKeyForIndex, scheduleMeasureBump]
  );

  const offsets = useMemo(() => {
    // Prefix sums array of length count + 1
    // Depend explicitly on measureVersion so newly measured row heights recompute offsets.
    void measureVersion;
    const prefix = new Float64Array(count + 1);
    prefix[0] = 0;
    for (let i = 0; i < count; i++) {
      const key = getKeyForIndex(i);
      const h = sizeMapRef.current.get(key) ?? estimateRowHeight;
      prefix[i + 1] = prefix[i] + h;
    }
    return prefix;
  }, [count, estimateRowHeight, getKeyForIndex, measureVersion]);

  const totalHeight = offsets[count] ?? 0;

  const findIndexAtOffset = useCallback(
    (offset: number): number => {
      if (count <= 0) return 0;
      let low = 0;
      let high = count - 1;
      while (low <= high) {
        const mid = (low + high) >>> 1;
        const start = offsets[mid];
        const end = offsets[mid + 1];
        if (offset < start) {
          high = mid - 1;
        } else if (offset >= end) {
          low = mid + 1;
        } else {
          return mid;
        }
      }
      return Math.max(0, Math.min(count - 1, low));
    },
    [count, offsets]
  );

  const { startIndex, endIndex, topSpacerHeight, bottomSpacerHeight } = useMemo(() => {
    if (count <= 0) {
      return {
        startIndex: 0,
        endIndex: -1,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
      };
    }

    const bodyViewport = Math.max(240, viewportHeight - theadHeight);
    const visibleStartOffset = Math.max(0, scrollTop);
    const visibleEndOffset = visibleStartOffset + bodyViewport;

    const rawStart = findIndexAtOffset(visibleStartOffset);
    const rawEnd = findIndexAtOffset(visibleEndOffset);

    const start = Math.max(0, rawStart - overscan);
    const end = Math.min(count - 1, rawEnd + overscan);

    const topSpacer = offsets[start] ?? 0;
    const bottomSpacer = Math.max(0, totalHeight - (offsets[end + 1] ?? totalHeight));

    return {
      startIndex: start,
      endIndex: end,
      topSpacerHeight: topSpacer,
      bottomSpacerHeight: bottomSpacer,
    };
  }, [count, viewportHeight, theadHeight, scrollTop, overscan, findIndexAtOffset, offsets, totalHeight]);

  const scrollToIndex = useCallback(
    (index: number, align: 'nearest' | 'start' | 'center' = 'nearest') => {
      if (count <= 0) return;
      const clamped = Math.max(0, Math.min(count - 1, index));
      const container = scrollContainerRef.current;
      if (!container) return;

      const rowTop = offsets[clamped] ?? 0;
      const rowBottom = offsets[clamped + 1] ?? rowTop + estimateRowHeight;
      const rowHeight = rowBottom - rowTop;
      const liveTheadHeight = (() => {
        const thead = container.querySelector('thead');
        return thead ? Math.round(thead.getBoundingClientRect().height) : theadHeight;
      })();
      const bodyViewport = Math.max(120, container.clientHeight - liveTheadHeight);
      const currentTop = container.scrollTop;

      let targetTop = currentTop;
      if (align === 'start') {
        targetTop = Math.max(0, rowTop - 8);
      } else if (align === 'center') {
        targetTop = Math.max(0, rowTop - Math.max(0, (bodyViewport - rowHeight) / 2));
      } else {
        const topPadding = 8;
        const bottomPadding = 20;
        if (rowTop < currentTop + topPadding) {
          targetTop = Math.max(0, rowTop - topPadding);
        } else if (rowBottom > currentTop + bodyViewport - bottomPadding) {
          targetTop = Math.max(0, rowBottom - bodyViewport + bottomPadding);
        }
      }

      if (Math.abs(targetTop - currentTop) >= 1) {
        container.scrollTop = targetTop;
        setScrollTop(targetTop);
      } else if (clamped < startIndex || clamped > endIndex) {
        // Force synchronous scrollTop state sync when row is just outside mounted window
        setScrollTop(targetTop);
      }
    },
    [count, scrollContainerRef, offsets, estimateRowHeight, theadHeight, startIndex, endIndex]
  );

  return {
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
    totalHeight,
    measureRow,
    scrollToIndex,
  };
}
