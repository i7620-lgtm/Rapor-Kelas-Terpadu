import { getContextualValue } from '../../constants';

export const useDashboardStats = (settings: any, students: any[], setActivePage: any) => {
  return [
    {
      title: 'Jumlah Siswa',
      value: (students || []).length.toString(),
      description: 'Siswa yang terdaftar di kelas.',
      actionText: 'Tambah Siswa Pertama',
      onActionClick: () => setActivePage('DATA_SISWA'),
      showAction: (students || []).length === 0,
    },
    {
      title: 'Tahun Ajaran',
      value: settings.tahun_ajaran || '-',
      description: `Semester ${settings.semester || 'Ganjil'}`,
      actionText: 'Atur di Pengaturan',
      onActionClick: () => setActivePage('PENGATURAN'),
      showAction: !settings.tahun_ajaran,
    },
    {
      title: 'Kelas',
      value: settings.nama_kelas || '-',
      description: 'Nama kelas saat ini.',
      actionText: 'Atur di Pengaturan',
      onActionClick: () => setActivePage('PENGATURAN'),
      showAction: !settings.nama_kelas,
    },
    {
      title: 'Wali Kelas',
      value: getContextualValue(settings, 'nama_wali_kelas') || '-',
      description: 'Guru wali kelas saat ini.',
      actionText: 'Atur di Pengaturan',
      onActionClick: () => setActivePage('PENGATURAN'),
      showAction: !getContextualValue(settings, 'nama_wali_kelas'),
    },
  ];
};
