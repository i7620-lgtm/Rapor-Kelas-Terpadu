import React from 'react';

const TermsPage: React.FC = () => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Ketentuan Layanan</h1>
      <div className="text-slate-700 space-y-4">
        <p>Selamat datang di RKT - Rapor Kelas Terpadu. Dengan menggunakan aplikasi kami, Anda setuju untuk terikat oleh ketentuan layanan berikut. Harap baca dengan saksama.</p>
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Penggunaan Aplikasi</h2>
          <p>Aplikasi ini ditujukan untuk penggunaan oleh guru wali kelas untuk mengelola data akademik siswa. Anda bertanggung jawab atas semua data yang Anda masukkan dan kelola melalui aplikasi ini.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">2. Akun Pengguna</h2>
          <p>Aplikasi ini beroperasi secara lokal di perangkat Anda. Tidak ada data yang dikirim atau disimpan di server kami. Anda bertanggung jawab penuh untuk menjaga keamanan data di perangkat Anda.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">3. Data Siswa</h2>
          <p>Anda setuju untuk hanya memasukkan data siswa yang akurat dan relevan untuk tujuan pendidikan. Anda harus memiliki otorisasi yang sesuai untuk mengelola data pribadi siswa sesuai dengan peraturan yang berlaku.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">4. Batasan Tanggung Jawab</h2>
          <p>Aplikasi ini disediakan "sebagaimana adanya". Kami tidak bertanggung jawab atas kehilangan data atau kerusakan apa pun yang timbul dari penggunaan aplikasi ini. Sangat disarankan untuk secara teratur mengekspor dan mencadangkan data Anda.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">5. Perubahan pada Ketentuan</h2>
          <p>Kami dapat memperbarui ketentuan layanan ini dari waktu ke waktu. Perubahan akan diposting di halaman ini. Penggunaan aplikasi secara berkelanjutan setelah perubahan merupakan penerimaan Anda terhadap ketentuan baru.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
