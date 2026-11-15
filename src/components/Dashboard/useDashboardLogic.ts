import { useMemo, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  computeSummarySnapshot,
  useSummaryStore,
} from '../../stores/useSummaryStore';

interface Subject {
  id: string;
  fullName: string;
  label: string;
  active: boolean;
}

interface Student {
  id: string;
  namaLengkap: string;
  nisn: string;
  agama?: string;
  [key: string]: any;
}

interface UseDashboardLogicProps {
  setActivePage: (page: string, anchor?: string) => void;
  onNavigateToNilai?: (id: string, anchor?: string) => void;
  settings?: any;
  students?: Student[];
  grades?: any[];
  subjects?: Subject[];
  notes?: Record<string, string>;
  cocurricularData?: any;
  attendance?: any[];
  studentExtracurriculars?: any[];
}

export const useDashboardLogic = ({
  setActivePage,
  onNavigateToNilai,
  settings: propSettings,
  students: propStudents,
  grades: propGrades,
  subjects: propSubjects,
  notes: propNotes,
  cocurricularData: propCocurricularData,
  attendance: propAttendance,
  studentExtracurriculars: propStudentExtracurriculars,
}: UseDashboardLogicProps) => {
  const hasExplicitOverrides = Boolean(
    propSettings !== undefined ||
      propStudents !== undefined ||
      propGrades !== undefined ||
      propSubjects !== undefined ||
      propNotes !== undefined ||
      propCocurricularData !== undefined ||
      propAttendance !== undefined ||
      propStudentExtracurriculars !== undefined
  );

  const {
    waliKelasName: storeWaliKelasName,
    stats: rawStoreStats,
    completenessChecks: rawStoreCompleteness,
    academicAlerts: rawStoreAlerts,
    hasComputed,
    recomputeSummary,
  } = useSummaryStore(
    useShallow((state) => ({
      waliKelasName: state.waliKelasName,
      stats: state.stats,
      completenessChecks: state.completenessChecks,
      academicAlerts: state.academicAlerts,
      hasComputed: state.hasComputed,
      recomputeSummary: state.recomputeSummary,
    }))
  );

  useEffect(() => {
    if (!hasExplicitOverrides && !hasComputed) {
      recomputeSummary();
    }
  }, [hasExplicitOverrides, hasComputed, recomputeSummary]);

  const overrideSnapshot = useMemo(() => {
    if (!hasExplicitOverrides) return null;
    return computeSummarySnapshot({
      settings: propSettings || {},
      subjects: propSubjects || [],
      students: propStudents || [],
      grades: propGrades || [],
      cocurricularData: propCocurricularData || {},
      studentExtracurriculars: propStudentExtracurriculars || [],
      attendance: propAttendance || [],
      notes: propNotes || {},
    });
  }, [
    hasExplicitOverrides,
    propSettings,
    propSubjects,
    propStudents,
    propGrades,
    propCocurricularData,
    propStudentExtracurriculars,
    propAttendance,
    propNotes,
  ]);

  const activeSnapshot = overrideSnapshot || {
    waliKelasName: storeWaliKelasName,
    stats: rawStoreStats,
    completenessChecks: rawStoreCompleteness,
    academicAlerts: rawStoreAlerts,
  };

  const stats = useMemo(
    () =>
      activeSnapshot.stats.map((stat) => ({
        ...stat,
        onActionClick: () => setActivePage(stat.targetPage),
      })),
    [activeSnapshot.stats, setActivePage]
  );

  const completenessChecks = useMemo(
    () =>
      activeSnapshot.completenessChecks.map((check) => ({
        ...check,
        onActionClick: () => setActivePage(check.targetPage, check.targetAnchor),
      })),
    [activeSnapshot.completenessChecks, setActivePage]
  );

  const academicAlerts = useMemo(
    () =>
      activeSnapshot.academicAlerts.map((alert) => ({
        ...alert,
        ...(alert.targetPage
          ? {
              onActionClick: () => {
                if (alert.subjectId && onNavigateToNilai) {
                  onNavigateToNilai(alert.subjectId, alert.targetAnchor);
                } else {
                  setActivePage(alert.targetPage!, alert.targetAnchor);
                }
              },
            }
          : {}),
        ...(alert.missingItems
          ? {
              missingItems: alert.missingItems.map((item) => ({
                label: item.label,
                onClick: () => {
                  if (item.subjectId && onNavigateToNilai) {
                    onNavigateToNilai(item.subjectId, item.targetAnchor);
                  } else {
                    setActivePage(item.targetPage, item.targetAnchor);
                  }
                },
              })),
            }
          : {}),
      })),
    [activeSnapshot.academicAlerts, setActivePage, onNavigateToNilai]
  );

  return {
    waliKelasName: activeSnapshot.waliKelasName,
    stats,
    academicAlerts,
    completenessChecks,
  };
};

