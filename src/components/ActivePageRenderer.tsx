import React, { Suspense, lazy } from 'react';
import Dashboard from "./Dashboard";

const PanduanPage = lazy(() => import("./PanduanPage"));
const DataSiswaPage = lazy(() => import("./DataSiswaPage"));
const DataNilaiPage = lazy(() => import("./DataNilaiPage"));
const DataKokurikulerPage = lazy(() => import("./DataKokurikulerPage"));
const SettingsPage = lazy(() => import("./SettingsPage"));
const DataAbsensiPage = lazy(() => import("./DataAbsensiPage"));
const CatatanWaliKelasPage = lazy(() => import("./CatatanWaliKelasPage"));
const DataEkstrakurikulerPage = lazy(() => import("./DataEkstrakurikulerPage"));
const PrintRaporPage = lazy(() => import("./PrintRaporPage"));
const PrintPiagamPage = lazy(() => import("./PrintPiagamPage"));
const PrintLegerPage = lazy(() => import("./PrintLegerPage"));
const JurnalFormatifPage = lazy(() => import("./JurnalFormatifPage"));
const PlaceholderPage = lazy(() => import("./PlaceholderPage"));

const PageSuspenseFallback = () => (
  <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3 text-slate-500 dark:text-slate-400">
    <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-medium">Memuat halaman...</span>
  </div>
);

const ActivePageRenderer = ({
  activePage,
  handleNavigate,
  activeNilaiTab,
  setActiveNilaiTab,
  showToast,
  isUpdateAvailable,
  isUpdating,
  onUpdateApp,
}: any) => {
  if (activePage === "DASHBOARD") {
    return (
      <Dashboard
        setActivePage={handleNavigate}
        onNavigateToNilai={(id: string, target?: string) => {
          setActiveNilaiTab(id);
          handleNavigate("DATA_NILAI", target);
        }}
        isUpdateAvailable={isUpdateAvailable}
        isUpdating={isUpdating}
        onUpdateApp={onUpdateApp}
      />
    );
  }

  let pageElement: React.ReactNode;

  if (activePage === "PANDUAN") {
    pageElement = <PanduanPage setActivePage={handleNavigate} />;
  } else if (activePage === "DATA_SISWA") {
    pageElement = <DataSiswaPage showToast={showToast} />;
  } else if (activePage === "DATA_NILAI") {
    pageElement = (
      <DataNilaiPage
        activeTab={activeNilaiTab}
        onTabChange={setActiveNilaiTab}
        setActivePage={handleNavigate}
        showToast={showToast}
      />
    );
  } else if (activePage === "DATA_KOKURIKULER") {
    pageElement = <DataKokurikulerPage setActivePage={handleNavigate} showToast={showToast} />;
  } else if (activePage === "PENGATURAN") {
    pageElement = <SettingsPage onSave={() => {}} showToast={showToast} />;
  } else if (activePage === "DATA_ABSENSI") {
    pageElement = <DataAbsensiPage setActivePage={handleNavigate} showToast={showToast} />;
  } else if (activePage === "CATATAN_WALI_KELAS") {
    pageElement = <CatatanWaliKelasPage setActivePage={handleNavigate} showToast={showToast} />;
  } else if (activePage === "DATA_EKSTRAKURIKULER") {
    pageElement = <DataEkstrakurikulerPage setActivePage={handleNavigate} showToast={showToast} />;
  } else if (activePage === "PRINT_RAPOR") {
    pageElement = <PrintRaporPage setActivePage={handleNavigate} showToast={showToast} />;
  } else if (activePage === "PRINT_PIAGAM") {
    pageElement = <PrintPiagamPage setActivePage={handleNavigate} showToast={showToast} />;
  } else if (activePage === "PRINT_LEGER") {
    pageElement = <PrintLegerPage setActivePage={handleNavigate} showToast={showToast} />;
  } else if (activePage === "JURNAL_FORMATIF") {
    pageElement = <JurnalFormatifPage setActivePage={handleNavigate} showToast={showToast} />;
  } else {
    pageElement = <PlaceholderPage title={activePage} />;
  }

  return (
    <Suspense fallback={<PageSuspenseFallback />}>
      {pageElement}
    </Suspense>
  );
};

export default ActivePageRenderer;
