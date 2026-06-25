import React from 'react';
import Dashboard from "./Dashboard";
import PanduanPage from "./PanduanPage";
import DataSiswaPage from "./DataSiswaPage";
import DataNilaiPage from "./DataNilaiPage";
import DataKokurikulerPage from "./DataKokurikulerPage";
import SettingsPage from "./SettingsPage";
import DataAbsensiPage from "./DataAbsensiPage";
import CatatanWaliKelasPage from "./CatatanWaliKelasPage";
import DataEkstrakurikulerPage from "./DataEkstrakurikulerPage";
import PrintRaporPage from "./PrintRaporPage";
import PrintPiagamPage from "./PrintPiagamPage";
import PrintLegerPage from "./PrintLegerPage";
import JurnalFormatifPage from "./JurnalFormatifPage";
import PlaceholderPage from "./PlaceholderPage";


const ActivePageRenderer = ({
  activePage,
  handleNavigate,
  activeNilaiTab,
  setActiveNilaiTab,
  showToast
}) => {
  if (activePage === "DASHBOARD") {
    return React.createElement(Dashboard, {
      setActivePage: handleNavigate,
      onNavigateToNilai: (id) => {
        setActiveNilaiTab(id);
        handleNavigate("DATA_NILAI");
      },
    });
  }

  if (activePage === "PANDUAN") {
    return React.createElement(PanduanPage, {
      setActivePage: handleNavigate,
    });
  }

  if (activePage === "DATA_SISWA") {
    return React.createElement(DataSiswaPage, {
      showToast,
    });
  }

  if (activePage === "DATA_NILAI") {
    return React.createElement(DataNilaiPage, {
      activeTab: activeNilaiTab,
      onTabChange: setActiveNilaiTab,
      showToast,
    });
  }

  if (activePage === "DATA_KOKURIKULER") {
    return React.createElement(DataKokurikulerPage, {
      showToast,
    });
  }

  if (activePage === "PENGATURAN") {
    return React.createElement(SettingsPage, {
      onSave: () => {},
      showToast,
    });
  }

  if (activePage === "DATA_ABSENSI") {
    return React.createElement(DataAbsensiPage, {
      showToast,
    });
  }

  if (activePage === "CATATAN_WALI_KELAS") {
    return React.createElement(CatatanWaliKelasPage, {
      showToast,
    });
  }

  if (activePage === "DATA_EKSTRAKURIKULER") {
    return React.createElement(DataEkstrakurikulerPage, {
      showToast,
    });
  }

  if (activePage === "PRINT_RAPOR") {
    return React.createElement(PrintRaporPage, {
      showToast,
    });
  }

  if (activePage === "PRINT_PIAGAM") {
    return React.createElement(PrintPiagamPage, {
      showToast,
    });
  }

  if (activePage === "PRINT_LEGER") {
    return React.createElement(PrintLegerPage, {
      showToast,
    });
  }

  if (activePage === "JURNAL_FORMATIF") {
    return React.createElement(JurnalFormatifPage, {
      showToast,
    });
  }

  return React.createElement(PlaceholderPage, { title: activePage });
};

export default ActivePageRenderer;
