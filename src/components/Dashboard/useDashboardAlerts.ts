
export const useDashboardAlerts = (settings: any, subjects: any[], students: any[], grades: any[], cocurricularData: any, studentExtracurriculars: any[], attendance: any[], notes: any[], setActivePage: any, onNavigateToNilai: any) => {
  
    const items: any[] = [];
    const minGrade = parseInt(settings.predikats?.c || '70', 10);
    const activeSubjects = (subjects || []).filter((s: any) => s.active);
    const currentStudents = students || [];
    const currentGrades = grades || [];
    const currentSemester = settings?.semester || 'Ganjil';
    const coDimensionField = currentSemester === 'Genap' ? 'dimensionRatings_Genap' : 'dimensionRatings';
    const getNoteKey = (studentId: string) => (currentSemester === 'Genap' ? studentId + '_Genap' : studentId);

    if (currentStudents.length === 0) {
      return items;
    }

    const studentDataFieldsToCheck = [
      'namaLengkap', 'namaPanggilan', 'nis', 'nisn', 'ttl', 'jenisKelamin', 'agama',
      'asalTk', 'alamatSiswa', 'diterimaDiKelas', 'diterimaTanggal', 'namaAyah',
      'namaIbu', 'pekerjaanAyah', 'pekerjaanIbu', 'alamatOrangTua', 'teleponOrangTua',
    ];

    currentStudents.forEach((student: any) => {
      const missingStudentFields = studentDataFieldsToCheck.filter(
        (field) => !student[field] || String(student[field]).trim() === ''
      );

      const studentGrade = currentGrades.find((g: any) => g.studentId === student.id);
      const studentReligion = String(student.agama || '').trim().toLowerCase();
      const relevantSubjects = activeSubjects.filter((subject: any) => {
        const subjectName = subject.fullName.toLowerCase();
        if (subject.id === 'PAKTTMYME' || subjectName.includes('kepercayaan terhadap tuhan')) {
          return studentReligion === 'kepercayaan';
        }
        if (subjectName.startsWith('pendidikan agama')) {
          if (!studentReligion) return false;
          const subjectReligionMatch = subjectName.match(/\(([^)]+)\)/);
          if (subjectReligionMatch) {
            return subjectReligionMatch[1].trim().toLowerCase() === studentReligion;
          }
          return false;
        }
        return true;
      });

      const failingSubjects: any[] = [];
      const missingSubjects: any[] = [];
      relevantSubjects.forEach((subject: any) => {
        let grade = studentGrade?.finalGrades?.[subject.id];
        const hasGrade = grade !== undefined && grade !== null && grade !== '';
        if (!hasGrade) {
          missingSubjects.push(subject);
        } else {
          if (typeof grade === 'string') grade = parseFloat(grade);
          if (!isNaN(grade) && !isNaN(minGrade) && grade < minGrade) {
            failingSubjects.push({ ...subject, grade });
          }
        }
      });

      const studentCoData = cocurricularData?.[student.id];
      const hasCocurricular = studentCoData && Object.values(studentCoData[coDimensionField] || {}).some((r) => r);

      const hasExtra = (studentExtracurriculars || []).some(
        (se: any) =>
          se.studentId === student.id &&
          (se.semester || 'Ganjil') === currentSemester &&
          se.assignedActivities?.some((activity: any) => activity !== null)
      );

      const hasAttendance = (attendance || []).some(
        (a: any) =>
          a.studentId === student.id &&
          (a.semester || 'Ganjil') === currentSemester &&
          (a.sakit !== null || a.izin !== null || a.alpa !== null)
      );

      const noteKey = getNoteKey(student.id);
      const hasNote = notes?.[noteKey] && String(notes[noteKey]).trim() !== '';

      const studentAlerts: { label: string; onClick: () => void }[] = [];
      if (missingStudentFields.length > 0) {
        studentAlerts.push({ label: `${missingStudentFields.length} data profil`, onClick: () => setActivePage('DATA_SISWA', student.id) });
      }
      if (missingSubjects.length > 0) {
        studentAlerts.push({ label: `Nilai mapel (${missingSubjects.length})`, onClick: () => (onNavigateToNilai && missingSubjects[0]) ? onNavigateToNilai(missingSubjects[0].id, student.id) : setActivePage('DATA_NILAI', student.id) });
      }
      if (!hasCocurricular) {
        studentAlerts.push({ label: 'Kokurikuler', onClick: () => setActivePage('DATA_KOKURIKULER', student.id) });
      }
      if (!hasExtra) {
        studentAlerts.push({ label: 'Ekstrakurikuler', onClick: () => setActivePage('DATA_EKSTRAKURIKULER', student.id) });
      }
      if (!hasAttendance) {
        studentAlerts.push({ label: 'Absensi', onClick: () => setActivePage('DATA_ABSENSI', student.id) });
      }
      if (!hasNote) {
        studentAlerts.push({ label: 'Catatan WK', onClick: () => setActivePage('CATATAN_WALI_KELAS', student.id) });
      }

      if (failingSubjects.length > 0) {
        items.push({
          title: student.namaLengkap,
          description: `Nilai di bawah KKM (${minGrade}): ${failingSubjects.map((s: any) => `${s.label} (${s.grade})`).join(', ')}`,
          status: 'attention',
          actionText: 'Lihat Nilai',
          onActionClick: () => (onNavigateToNilai && failingSubjects[0]) ? onNavigateToNilai(failingSubjects[0].id, student.id) : setActivePage('DATA_NILAI', student.id),
        });
      }

      if (studentAlerts.length > 0) {
        items.push({
          title: student.namaLengkap,
          description: 'Data belum lengkap',
          missingItems: studentAlerts,
          status: 'incomplete',
          actionSubjectId: null,
        });
      }
    });
    return items;
};
