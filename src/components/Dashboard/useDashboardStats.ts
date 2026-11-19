import { useMemo } from 'react';
import { getContextualValue } from '../../constants';

export const useDashboardStats = (settings: any, students: any[], setActivePage: any) => {
  const studentCount = (students || []).length;
  const tahunAjaran = settings.tahun_ajaran;
  const semester = settings.semester || 'Ganjil';
  const namaKelas = settings.nama_kelas;
  const waliKelas = getContextualValue(settings, 'nama_wali_kelas');

  return useMemo(() => [
    {
      title: 'Jumlah Siswa',
      value: studentCount.toString(),
      description: 'Siswa yang terdaftar di kelas.',
      actionText: 'Tambah Siswa Pertama',
      onActionClick: () => setActivePage('DATA_SISWA'),
      showAction: studentCount === 0,
    },
    {
      title: 'Tahun Ajaran',
      value: tahunAjaran || '-',
      description: `Semester ${semester}`,
      actionText: 'Atur di Pengaturan',
      onActionClick: () => setActivePage('PENGATURAN'),
      showAction: !tahunAjaran,
    },
    {
      title: 'Kelas',
      value: namaKelas || '-',
      description: 'Nama kelas saat ini.',
      actionText: 'Atur di Pengaturan',
      onActionClick: () => setActivePage('PENGATURAN'),
      showAction: !namaKelas,
    },
    {
      title: 'Wali Kelas',
      value: waliKelas || '-',
      description: 'Guru wali kelas saat ini.',
      actionText: 'Atur di Pengaturan',
      onActionClick: () => setActivePage('PENGATURAN'),
      showAction: !waliKelas,
    },
  ], [studentCount, tahunAjaran, semester, namaKelas, waliKelas, setActivePage]);
};
