
import { useState, useEffect, useCallback } from 'react';

const useServiceWorker = () => {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          // 1. CEK PENTING: Jika sudah ada worker yang menunggu (diunduh di background sebelumnya)
          // Ini menangani kasus dimana browser sudah download update tapi belum diterapkan.
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setIsUpdateAvailable(true);
          }

          // 2. Dengarkan instalasi worker baru
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
      // Ini memastikan saat tombol "Update" diklik, halaman refresh otomatis
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
      // Mengirim pesan ke SW untuk menghentikan penundaan dan segera aktif
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [waitingWorker]);

  return { isUpdateAvailable, updateAssets };
};

export default useServiceWorker;
