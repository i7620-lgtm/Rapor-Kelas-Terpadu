
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useStudentsStore } from '../../stores/useStudentsStore';
import { useNilaiStore } from '../../stores/useNilaiStore';
import { useNotesStore } from '../../stores/useNotesStore';
import { useCocurricularStore } from '../../stores/useCocurricularStore';
import { useAttendanceStore } from '../../stores/useAttendanceStore';
import { useExtracurricularStore } from '../../stores/useExtracurricularStore';
import { getContextualValue } from '../../constants';

import { useDashboardStats } from './useDashboardStats';
import { useDashboardAlerts } from './useDashboardAlerts';
import { useDashboardCompleteness } from './useDashboardCompleteness';

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
  const storeSettings = useSettingsStore((state) => state.settings);
  const storeSubjects = useSettingsStore((state) => state.subjects);
  const storeStudents = useStudentsStore((state) => state.students);
  const storeGrades = useNilaiStore((state) => state.grades);
  const storeNotes = useNotesStore((state) => state.notes);
  const storeCocurricularData = useCocurricularStore((state) => state.cocurricularData);
  const storeAttendance = useAttendanceStore((state) => state.attendance);
  const storeStudentExtracurriculars = useExtracurricularStore((state) => state.studentExtracurriculars);

  const settings = propSettings || storeSettings || {};
  const subjects = propSubjects || storeSubjects || [];
  const students = propStudents || storeStudents || [];
  const grades = propGrades || storeGrades || [];
  const notes = propNotes || storeNotes || {};
  const cocurricularData = propCocurricularData || storeCocurricularData || {};
  const attendance = propAttendance || storeAttendance || [];
  const studentExtracurriculars = propStudentExtracurriculars || storeStudentExtracurriculars || [];

  const waliKelasName = getContextualValue(settings, 'nama_wali_kelas') || 'Wali Kelas';

  const stats = useDashboardStats(settings, students, setActivePage);
  const academicAlerts = useDashboardAlerts(settings, subjects, students, grades, cocurricularData, studentExtracurriculars, attendance, notes, setActivePage, onNavigateToNilai);
  const completenessChecks = useDashboardCompleteness(settings, subjects, students, grades, cocurricularData, studentExtracurriculars, attendance, notes, setActivePage, onNavigateToNilai);

  return {
    waliKelasName,
    stats,
    academicAlerts,
    completenessChecks,
  };
};
