import { useState, useEffect, useCallback } from 'react';

const useServiceWorker = () => {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          // Listen for new worker installation
          reg.onupdatefound = () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.onstatechange = () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New worker is waiting to be activated
                  setWaitingWorker(newWorker);
                  setIsUpdateAvailable(true);
                }
              };
            }
          };
        }
      }).catch(error => {
        console.warn('Could not get Service Worker registration:', error);
      });
      
      // Listen for controller change and reload the page
      const onControllerChange = () => {
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      };
    }
  }, []);

  const updateAssets = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [waitingWorker]);

  return { isUpdateAvailable, updateAssets };
};

export default useServiceWorker;
