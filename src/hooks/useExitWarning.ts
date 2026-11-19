import { useEffect } from 'react';
import { flushAllPendingWrites } from '../stores/customPersistStorage';
import { flushRegisteredInputs } from '../utils/dataIntegrity';

interface UseExitWarningOptions {
  enabled: boolean;
  isSessionClosed: boolean;
}

export const useExitWarning = ({ enabled, isSessionClosed }: UseExitWarningOptions) => {
  useEffect(() => {
    const handlePageHideOrBlur = () => {
      flushRegisteredInputs();
      void flushAllPendingWrites();
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      flushRegisteredInputs();
      void flushAllPendingWrites();

      if (enabled && !isSessionClosed) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHideOrBlur);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHideOrBlur);
    };
  }, [enabled, isSessionClosed]);
};
