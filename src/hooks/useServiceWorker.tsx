import { useState, useEffect, useCallback, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { flushAllPendingWrites } from '../stores/customPersistStorage';

const UPDATE_CHECK_INTERVAL_MS = 15 * 60 * 1000;

const useServiceWorker = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateSwFnRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let isMounted = true;
    let swRegistration: ServiceWorkerRegistration | undefined;

    try {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          if (isMounted) {
            setIsUpdateAvailable(true);
          }
        },
        onRegisteredSW(_swUrl, registration) {
          swRegistration = registration;
          if (registration?.waiting && isMounted) {
            setIsUpdateAvailable(true);
          }
        },
        onRegisterError(error) {
          console.warn('[RKT] Service Worker registration skipped/failed:', error);
        },
      });

      updateSwFnRef.current = updateSW;
    } catch (error) {
      console.warn('[RKT] Failed initializing PWA registration:', error);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !swRegistration) return;
      const now = Date.now();
      if (now - lastCheckRef.current > UPDATE_CHECK_INTERVAL_MS) {
        lastCheckRef.current = now;
        swRegistration.update().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const updateAssets = useCallback(async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await flushAllPendingWrites();
      if (updateSwFnRef.current) {
        await updateSwFnRef.current(true);
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('[RKT] Failed applying Service Worker update:', err);
      setIsUpdating(false);
    }
  }, [isUpdating]);

  return { isUpdateAvailable, isUpdating, updateAssets };
};

export default useServiceWorker;
