
import { getContextualValue } from "../../constants";
export const useDashboardCompleteness = (settings: any, subjects: any[], students: any[], grades: any[], cocurricularData: any, studentExtracurriculars: any[], attendance: any[], notes: any[], setActivePage: any, _onNavigateToNilai: any) => {
  
    const results: any[] = [];
    const activeSubjects = (subjects || []).filter((s) => s.active);
    const currentStudents = students || [];
    const currentGrades = grades || [];
    const currentAttendance = attendance || [];
    const currentStudentExtracurriculars = studentExtracurriculars || [];
    const totalStudents = currentStudents.length;

    // 1. Informasi Dasar
    const settingsFields = ['nama_sekolah', 'nama_wali_kelas', 'nama_kelas', 'tahun_ajaran', 'semester'];
    let filledSettingsFields = settingsFields.filter((key) => {
      const val = key === 'nama_wali_kelas' ? getContextualValue(settings, 'nama_wali_kelas') : settings[key];
      return val && val.trim() !== '';
    }).length;
    const settingsPercentage = Math.floor((filledSettingsFields / settingsFields.length) * 100);

    if (filledSettingsFields === settingsFields.length) {
      results.push({
        category: 'Pengaturan',
        title: 'Informasi Dasar',
        status: 'good',
        message: 'Informasi dasar sekolah, kelas, dan wali kelas sudah terisi.',
        actionText: 'Lihat Pengaturan',
        onActionClick: () => setActivePage('PENGATURAN'),
        percentage: 100,
      });
    } else {
      const missingSettings = settingsFields.filter((key) => {
        const val = key === 'nama_wali_kelas' ? getContextualValue(settings, 'nama_wali_kelas') : settings[key];
        return !val || val.trim() === '';
      });
      results.push({
        category: 'Pengaturan',
        title: 'Informasi Dasar',
        status: 'bad',
        message: `Data berikut belum diisi: ${missingSettings.join(', ')}.`,
        actionText: 'Lengkapi di Pengaturan',
        onActionClick: () => setActivePage('PENGATURAN', missingSettings[0]),
        percentage: settingsPercentage,
      });
    }

    if (totalStudents === 0) {
      const emptyDataMessages = [
        { category: 'Data Siswa', title: 'Data Siswa', message: 'Belum ada data siswa.', actionText: 'Tambah Siswa', page: 'DATA_SISWA' },
        { category: 'Data Nilai', title: 'Data Nilai', message: 'Belum ada data siswa.', actionText: 'Periksa Data Nilai', page: 'DATA_NILAI' },
        { category: 'Data Lainnya', title: 'Kokurikuler', message: 'Belum ada data siswa.', actionText: 'Isi Penilaian', page: 'DATA_KOKURIKULER' },
        { category: 'Data Lainnya', title: 'Ekstrakurikuler', message: 'Belum ada data siswa.', actionText: 'Atur Ekstrakurikuler', page: 'DATA_EKSTRAKURIKULER' },
        { category: 'Data Lainnya', title: 'Data Absensi', message: 'Belum ada data siswa.', actionText: 'Periksa Data Absensi', page: 'DATA_ABSENSI' },
        { category: 'Data Lainnya', title: 'Catatan Wali Kelas', message: 'Belum ada data siswa.', actionText: 'Isi Catatan', page: 'CATATAN_WALI_KELAS' },
      ];
      emptyDataMessages.forEach((item) =>
        results.push({ ...item, status: 'bad', onActionClick: () => setActivePage(item.page), percentage: 0 })
      );
      return results;
    }

    // 2. Data Siswa
    const studentDataFieldsToCheck = [
      'namaLengkap',
      'namaPanggilan',
      'nis',
      'nisn',
      'ttl',
      'jenisKelamin',
      'agama',
      'asalTk',
      'alamatSiswa',
      'diterimaDiKelas',
      'diterimaTanggal',
      'namaAyah',
      'namaIbu',
      'pekerjaanAyah',
      'pekerjaanIbu',
      'alamatOrangTua',
      'teleponOrangTua',
    ];
    const totalStudentDataFields = totalStudents * studentDataFieldsToCheck.length;
    let filledStudentDataFields = currentStudents.reduce(
      (acc, student) =>
        acc +
        studentDataFieldsToCheck.filter((field) => student[field] && String(student[field]).trim() !== '').length,
      0
    );
    const studentDataPercentage =
      totalStudentDataFields > 0 ? Math.floor((filledStudentDataFields / totalStudentDataFields) * 100) : 100;

    if (filledStudentDataFields === totalStudentDataFields) {
      results.push({
        category: 'Data Siswa',
        title: 'Data Siswa',
        status: 'good',
        message: 'Data pribadi dan orang tua untuk semua siswa telah terisi lengkap.',
        actionText: 'Lihat Data Siswa',
        onActionClick: () => setActivePage('DATA_SISWA'),
        percentage: 100,
      });
    } else {
      results.push({
        category: 'Data Siswa',
        title: 'Data Siswa',
        status: 'bad',
        message: `Terdapat ${totalStudentDataFields - filledStudentDataFields} data pribadi/orang tua yang belum diisi.`,
        actionText: 'Lengkapi Data Siswa',
        onActionClick: () => setActivePage('DATA_SISWA'),
        percentage: studentDataPercentage,
      });
    }

    // 3. Data Nilai
    let totalRequiredGrades = 0;
    let totalFilledGrades = 0;

    currentStudents.forEach((student) => {
      const studentGrade = currentGrades.find((g) => g.studentId === student.id);
      const studentReligion = String(student.agama || '').trim().toLowerCase();

      const relevantSubjects = activeSubjects.filter((subject) => {
        const subjectName = subject.fullName.toLowerCase();

        // Handle Kepercayaan explicitly
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

      relevantSubjects.forEach((sub) => {
        totalRequiredGrades++;
        const grade = studentGrade?.finalGrades?.[sub.id];
        if (grade !== undefined && grade !== null && grade !== '') {
          totalFilledGrades++;
        }
      });
    });

    const gradesPercentage =
      totalRequiredGrades > 0
        ? Math.floor((totalFilledGrades / totalRequiredGrades) * 100)
        : totalStudents > 0
        ? 0
        : 100;

    if (totalFilledGrades === totalRequiredGrades && totalRequiredGrades > 0) {
      results.push({
        category: 'Data Nilai',
        title: 'Data Nilai',
        status: 'good',
        message: 'Nilai akhir untuk semua siswa telah terisi.',
        actionText: 'Lihat Data Nilai',
        onActionClick: () => setActivePage('DATA_NILAI'),
        percentage: 100,
      });
    } else if (totalRequiredGrades === 0) {
      results.push({
        category: 'Data Nilai',
        title: 'Data Nilai',
        status: 'bad',
        message: 'Belum ada mata pelajaran yang aktif.',
        actionText: 'Pilih Mata Pelajaran',
        onActionClick: () => setActivePage('PENGATURAN'),
        percentage: 0,
      });
    } else {
      const missingCount = totalRequiredGrades - totalFilledGrades;
      results.push({
        category: 'Data Nilai',
        title: 'Data Nilai',
        status: 'bad',
        message: `Terdapat ${missingCount} nilai mata pelajaran yang belum terisi.`,
        actionText: 'Lengkapi Data Nilai',
        onActionClick: () => setActivePage('DATA_NILAI'),
        percentage: gradesPercentage,
      });
    }

    // 4. Kokurikuler
    const cocurricData = cocurricularData || {};
    const currentSemester = settings?.semester || 'Ganjil';
    const coDimensionField = currentSemester === 'Genap' ? 'dimensionRatings_Genap' : 'dimensionRatings';
    let studentsWithCo = currentStudents.filter((s) => {
      const studentCoData = cocurricData[s.id];
      return studentCoData && Object.values(studentCoData[coDimensionField] || {}).some((r) => r);
    }).length;
    const coPercentage = Math.floor((studentsWithCo / totalStudents) * 100);
    if (studentsWithCo === totalStudents) {
      results.push({
        category: 'Data Lainnya',
        title: 'Kokurikuler',
        status: 'good',
        message: `Semua siswa telah memiliki penilaian kokurikuler.`,
        actionText: 'Lihat Kokurikuler',
        onActionClick: () => setActivePage('DATA_KOKURIKULER'),
        percentage: 100,
      });
    } else {
      results.push({
        category: 'Data Lainnya',
        title: 'Kokurikuler',
        status: 'bad',
        message: `${totalStudents - studentsWithCo} siswa belum memiliki penilaian kokurikuler.`,
        actionText: 'Isi Penilaian',
        onActionClick: () => setActivePage('DATA_KOKURIKULER'),
        percentage: coPercentage,
      });
    }

    // 5. Ekstrakurikuler
    let studentsWithExtra = currentStudents.filter((s) =>
      currentStudentExtracurriculars.some(
        (se) =>
          se.studentId === s.id &&
          (se.semester || 'Ganjil') === currentSemester &&
          se.assignedActivities?.some((activity: any) => activity !== null)
      )
    ).length;
    const extraPercentage = Math.floor((studentsWithExtra / totalStudents) * 100);
    if (studentsWithExtra === totalStudents) {
      results.push({
        category: 'Data Lainnya',
        title: 'Ekstrakurikuler',
        status: 'good',
        message: 'Semua siswa memiliki setidaknya satu ekstrakurikuler.',
        actionText: 'Lihat Ekstrakurikuler',
        onActionClick: () => setActivePage('DATA_EKSTRAKURIKULER'),
        percentage: 100,
      });
    } else {
      results.push({
        category: 'Data Lainnya',
        title: 'Ekstrakurikuler',
        status: 'bad',
        message: `${totalStudents - studentsWithExtra} siswa belum memiliki ekstrakurikuler.`,
        actionText: 'Atur Ekstrakurikuler',
        onActionClick: () => setActivePage('DATA_EKSTRAKURIKULER'),
        percentage: extraPercentage,
      });
    }

    // 6. Data Absensi
    let studentsWithAttendance = currentStudents.filter((s) =>
      currentAttendance.some(
        (a) =>
          a.studentId === s.id &&
          (a.semester || 'Ganjil') === currentSemester &&
          (a.sakit !== null || a.izin !== null || a.alpa !== null)
      )
    ).length;
    const attendancePercentage = Math.floor((studentsWithAttendance / totalStudents) * 100);
    if (studentsWithAttendance === totalStudents) {
      results.push({
        category: 'Data Lainnya',
        title: 'Data Absensi',
        status: 'good',
        message: 'Data absensi semua siswa telah terisi.',
        actionText: 'Lihat Data Absensi',
        onActionClick: () => setActivePage('DATA_ABSENSI'),
        percentage: 100,
      });
    } else {
      results.push({
        category: 'Data Lainnya',
        title: 'Data Absensi',
        status: 'bad',
        message: `${totalStudents - studentsWithAttendance} siswa belum memiliki catatan absensi.`,
        actionText: 'Periksa Data Absensi',
        onActionClick: () => setActivePage('DATA_ABSENSI'),
        percentage: attendancePercentage,
      });
    }

    // 7. Catatan Wali Kelas
    const checkSimpleCompletion = (data: any, key: string, titleName: string, pageName: string) => {
      const getNoteKey = (studentId: string) => (currentSemester === 'Genap' ? studentId + '_Genap' : studentId);
      let completed = currentStudents.filter((s) => {
        const noteKey = getNoteKey(s.id);
        return data[noteKey] && data[noteKey].trim() !== '';
      }).length;
      const percentage = Math.floor((completed / totalStudents) * 100);
      if (completed === totalStudents) {
        results.push({
          category: 'Data Lainnya',
          title: titleName,
          status: 'good',
          message: `Semua siswa telah memiliki ${titleName.toLowerCase()}.`,
          actionText: `Lihat ${titleName}`,
          onActionClick: () => setActivePage(pageName),
          percentage: 100,
        });
      } else {
        results.push({
          category: 'Data Lainnya',
          title: titleName,
          status: 'bad',
          message: `${totalStudents - completed} siswa belum memiliki ${titleName.toLowerCase()}.`,
          actionText: 'Isi Catatan',
          onActionClick: () => setActivePage(pageName),
          percentage,
        });
      }
    };
    checkSimpleCompletion(notes, 'notes', 'Catatan Wali Kelas', 'CATATAN_WALI_KELAS');
    return results;
};
