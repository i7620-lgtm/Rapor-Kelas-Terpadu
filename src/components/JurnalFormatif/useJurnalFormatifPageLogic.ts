import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStudentsStore } from '../../stores/useStudentsStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useNilaiStore } from '../../stores/useNilaiStore';
import { useFormativeStore } from '../../stores/useFormativeStore';
import { useCurriculumStore } from '../../stores/useCurriculumStore';

export const useJurnalFormatifPageLogic = (props: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const storeStudents = useStudentsStore(useShallow((state) => state.students));
  const { settings: storeSettings, subjects: storeSubjects } = useSettingsStore(
    useShallow((state) => ({
      settings: state.settings,
      subjects: state.subjects,
    }))
  );
  const storeGrades = useNilaiStore(useShallow((state) => state.grades));
  const storeFormative = useFormativeStore(useShallow((state) => state.formativeJournal));
  const storePredefined = useCurriculumStore(useShallow((state) => state.predefinedCurriculum));

  const students = props.students || storeStudents;
  const settings = props.settings || storeSettings;
  const subjects = props.subjects || storeSubjects;
  const grades = props.grades || storeGrades;
  const formativeJournal = props.formativeJournal || storeFormative;
  const predefinedCurriculum = props.predefinedCurriculum || storePredefined;

  const currentSemester = settings?.semester || 'Ganjil';

  const handleUpdate = props.onUpdate || ((sid: string, data: any) => {
    useFormativeStore.getState().setFormativeJournal((prev: any) => {
      const next = { ...prev };
      if (!next[sid]) next[sid] = [];
      const idx = next[sid].findIndex((n: any) => n.id === data.id);
      if (idx > -1) next[sid][idx] = data;
      else next[sid].push({ ...data, id: Date.now().toString() });
      return next;
    });
  });

  const handleDelete = props.onDelete || ((sid: string, id: any) => {
    useFormativeStore.getState().setFormativeJournal((prev: any) => ({
      ...prev,
      [sid]: prev[sid].filter((n: any) => n.id !== id),
    }));
  });

  const handleOpenModal = (student: any) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  return {
    students,
    settings,
    subjects,
    grades,
    formativeJournal,
    predefinedCurriculum,
    currentSemester,
    isModalOpen,
    setIsModalOpen,
    selectedStudent,
    setSelectedStudent,
    handleUpdate,
    handleDelete,
    handleOpenModal,
  };
};
