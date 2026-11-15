import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import localforage from "localforage";

localforage.config({
  name: "ERaporApp",
  version: 1.0,
  storeName: "erapor_data",
  description: "E-Rapor Application Data",
});

import { NAV_ITEMS } from "./constants";
import useServiceWorker from "./hooks/useServiceWorker";
import useWindowDimensions from "./hooks/useWindowDimensions";

import { useAppStorage } from "./hooks/useAppStorage";
import { useDataSyncCoordinators } from "./hooks/useDataSyncCoordinators";
import { useExcelManager } from "./hooks/useExcelManager";
import { useExitWarning } from "./hooks/useExitWarning";
import { useSettingsStore } from "./stores/useSettingsStore";
import { flushAllPendingWrites } from "./stores/customPersistStorage";
import { flushRegisteredInputs } from "./utils/dataIntegrity";

import Navigation from "./components/Navigation";
import ActivePageRenderer from "./components/ActivePageRenderer";
import Toast from "./components/Toast";
import { ExitConfirmationModal } from "./components/ExitConfirmationModal";

const ERaporProcessorModal = lazy(() => import("./components/ERaporProcessorModal"));

const App = () => {
  const { isUpdateAvailable, isUpdating, updateAssets } = useServiceWorker();
  const [activePage, setActivePage] = useState("DASHBOARD");
  const [targetSection, setTargetSection] = useState(null);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isSessionClosed, setIsSessionClosed] = useState(false);
  const mainRef = useRef(null);

  const handleNavigate = useCallback((page, target = null) => {
    setActivePage(page);
    setTargetSection(target);
  }, []);

  useEffect(() => {
    if (targetSection) {
      setTimeout(() => {
        const el = document.getElementById(targetSection);
        if (el && mainRef.current) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    } else if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activePage, targetSection]);

  const { isMobile } = useWindowDimensions();

  const {
    toast,
    setToast,
    showToast,
    isLoading,
    setIsLoading,
    activeNilaiTab,
    setActiveNilaiTab,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isERaporModalOpen,
    setIsERaporModalOpen,
    isDataLoaded,
  } = useAppStorage();

  const enableExitWarning = useSettingsStore((state) => Boolean(state.settings?.enableExitWarning));

  useDataSyncCoordinators(isDataLoaded);

  const { handleExportAll, handleImportAll } = useExcelManager({
    setIsLoading,
    showToast,
  });

  useExitWarning({
    enabled: enableExitWarning,
    isSessionClosed,
  });

  const handleDirectExit = useCallback(async () => {
    flushRegisteredInputs();
    await flushAllPendingWrites();
    setIsExitModalOpen(false);
    setIsSessionClosed(true);
  }, []);

  const handleDownloadAndExit = useCallback(async (): Promise<boolean> => {
    const ok = await handleExportAll();
    if (ok) {
      await flushAllPendingWrites();
      setIsExitModalOpen(false);
      setIsSessionClosed(true);
    }
    return ok;
  }, [handleExportAll]);

  if (isSessionClosed) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 font-sans transition-colors">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 sm:p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Sesi Kerja Diakhiri</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Seluruh perubahan data telah disimpan ke penyimpanan lokal browser. Anda sekarang dapat menutup tab browser dengan aman.
          </p>
          <button
            type="button"
            onClick={() => setIsSessionClosed(false)}
            className="mt-6 w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            Kembali ke Aplikasi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navigation
          activePage={activePage}
          setActivePage={handleNavigate}
          onExport={handleExportAll}
          onImport={handleImportAll}
          onIsiERapor={() => setIsERaporModalOpen(true)}
          isMobile={isMobile}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          currentPageName={NAV_ITEMS.find((i) => i.id === activePage)?.label || "Dashboard"}
          enableExitWarning={enableExitWarning}
          onRequestExit={() => setIsExitModalOpen(true)}
        />
        <main ref={mainRef} className="flex-1 flex flex-col min-h-0 min-w-0 overflow-auto px-3 pb-4 sm:px-6 sm:pb-6 pt-3 sm:pt-4">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3 text-slate-500 dark:text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Memuat data aplikasi...</span>
            </div>
          ) : (
            <ActivePageRenderer
              activePage={activePage}
              handleNavigate={handleNavigate}
              activeNilaiTab={activeNilaiTab}
              setActiveNilaiTab={setActiveNilaiTab}
              showToast={showToast}
              isUpdateAvailable={isUpdateAvailable}
              isUpdating={isUpdating}
              onUpdateApp={updateAssets}
            />
          )}
        </main>
      </div>

      {isERaporModalOpen && (
        <Suspense fallback={null}>
          <ERaporProcessorModal
            onClose={() => setIsERaporModalOpen(false)}
            showToast={showToast}
          />
        </Suspense>
      )}

      <ExitConfirmationModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onDirectExit={handleDirectExit}
        onDownloadAndExit={handleDownloadAndExit}
      />
    </div>
  );
};

export default App;

