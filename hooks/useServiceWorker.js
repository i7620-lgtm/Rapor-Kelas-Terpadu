
import { useState, useEffect, useCallback } from 'react';

const useServiceWorker = () => {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleSW = async () => {
        try {
          // Dapatkan pendaftaran SW yang sudah ada
          const reg = await navigator.serviceWorker.getRegistration();
          
          if (reg) {
            // PENTING: Paksa browser untuk mengecek apakah ada file sw.js baru di server.
            // Tanpa ini, browser mungkin hanya menggunakan versi cache sampai 24 jam.
            console.log('[RKT] Checking for Service Worker updates...');
            await reg.update();

            // 1. Cek worker yang sudah menunggu (waiting)
            if (reg.waiting) {
              console.log('[RKT] Found waiting worker (update ready).');
              setWaitingWorker(reg.waiting);
              setIsUpdateAvailable(true);
            }

            // 2. Dengarkan jika ada worker baru yang sedang diinstall
            reg.onupdatefound = () => {
              const newWorker = reg.installing;
              console.log('[RKT] Update found, installing...');
              if (newWorker) {
                newWorker.onstatechange = () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[RKT] New worker installed and ready.');
                    setWaitingWorker(newWorker);
                    setIsUpdateAvailable(true);
                  }
                };
              }
            };
          }
        } catch (error) {
          console.error('[RKT] Service Worker error:', error);
        }
      };

      handleSW();
      
      // Listen for controller change and reload the page
      const onControllerChange = () => {
        console.log('[RKT] Controller changed, reloading page...');
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
      console.log('[RKT] Sending SKIP_WAITING to new worker...');
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [waitingWorker]);

  return { isUpdateAvailable, updateAssets };
};

export default useServiceWorker;
