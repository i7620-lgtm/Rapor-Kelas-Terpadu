import { useState, useEffect, useRef, useCallback } from 'react';

interface UseProgressiveRenderOptions<T> {
  items: T[];
  batchSize?: number;
  enabled?: boolean;
}

export function useProgressiveRender<T>({
  items,
  batchSize = 3,
  enabled = true,
}: UseProgressiveRenderOptions<T>) {
  const [renderedCount, setRenderedCount] = useState<number>(() => {
    if (!enabled || items.length <= batchSize) return items.length;
    return batchSize;
  });

  const isMountedRef = useRef(true);
  const idleHandleRef = useRef<number | null>(null);
  const timeoutHandleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending scheduling handles
  const cancelScheduledBatch = useCallback(() => {
    if (idleHandleRef.current !== null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
      (window as any).cancelIdleCallback(idleHandleRef.current);
      idleHandleRef.current = null;
    }
    if (timeoutHandleRef.current !== null) {
      clearTimeout(timeoutHandleRef.current);
      timeoutHandleRef.current = null;
    }
  }, []);

  // Reset count whenever items list or enabled flag changes
  useEffect(() => {
    cancelScheduledBatch();
    if (!enabled || items.length <= batchSize) {
      setRenderedCount(items.length);
    } else {
      setRenderedCount(batchSize);
    }
  }, [items.length, enabled, batchSize, cancelScheduledBatch]);

  // Progressive batch loop
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled || renderedCount >= items.length) {
      return;
    }

    const scheduleNextBatch = () => {
      cancelScheduledBatch();

      const loadNext = () => {
        if (!isMountedRef.current) return;
        setRenderedCount((prev) => Math.min(prev + batchSize, items.length));
      };

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        idleHandleRef.current = (window as any).requestIdleCallback(loadNext, { timeout: 400 });
      } else {
        timeoutHandleRef.current = setTimeout(loadNext, 60);
      }
    };

    scheduleNextBatch();

    return () => {
      cancelScheduledBatch();
    };
  }, [renderedCount, items.length, batchSize, enabled, cancelScheduledBatch]);

  // Cleanup on unmount (navigation to other pages)
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cancelScheduledBatch();
    };
  }, [cancelScheduledBatch]);

  // Force-render all remaining items (e.g. before print)
  const flushAll = useCallback(() => {
    cancelScheduledBatch();
    setRenderedCount(items.length);
  }, [items.length, cancelScheduledBatch]);

  const renderedItems = items.slice(0, renderedCount);
  const isBatchComplete = renderedCount >= items.length;

  return {
    renderedItems,
    renderedCount,
    totalCount: items.length,
    isBatchComplete,
    flushAll,
  };
}
