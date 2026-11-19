import { useState, useEffect, useCallback, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { flushAllPendingWrites } from '../stores/customPersistStorage';
import { flushRegisteredInputs } from '../utils/dataIntegrity';

const UPDATE_CHECK_THROTTLE_MS = 15 * 1000;

const useServiceWorker = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateSwFnRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined);
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let isMounted = true;
    const hadControllerOnMount = Boolean(navigator.serviceWorker.controller);

    const checkForUpdate = (force = false) => {
      const reg = registrationRef.current;
      if (!reg) return;
      const now = Date.now();
      if (!force && now - lastCheckRef.current < UPDATE_CHECK_THROTTLE_MS) {
        return;
      }
      lastCheckRef.current = now;
      reg.update().catch(() => {});
    };

    try {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          if (isMounted) {
            setIsUpdateAvailable(true);
          }
        },
        onRegisteredSW(_swUrl, registration) {
          registrationRef.current = registration;
          if (registration?.waiting && isMounted) {
            setIsUpdateAvailable(true);
          }
          checkForUpdate(true);
        },
        onRegisterError(error) {
          console.warn('[RKT] Service Worker registration skipped/failed:', error);
        },
      });

      updateSwFnRef.current = updateSW;
    } catch (error) {
      console.warn('[RKT] Failed initializing PWA registration:', error);
    }

    const handleControllerChange = () => {
      if (hadControllerOnMount && isMounted) {
        setIsUpdateAvailable(true);
      }
    };

    const handleFocus = () => {
      checkForUpdate(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate(false);
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const updateAssets = useCallback(async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      flushRegisteredInputs();
      await flushAllPendingWrites();
      const hasWaitingWorker = Boolean(registrationRef.current?.waiting);
      if (hasWaitingWorker && updateSwFnRef.current) {
        await updateSwFnRef.current(true);
        window.setTimeout(() => {
          window.location.reload();
        }, 1200);
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
