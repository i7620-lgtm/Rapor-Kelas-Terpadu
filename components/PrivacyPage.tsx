import React from 'react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Kebijakan Privasi</h1>
      <div className="text-slate-700 space-y-4">
        <p>Kebijakan Privasi ini menjelaskan bagaimana RKT - Rapor Kelas Terpadu ("Aplikasi") menangani data Anda.</p>
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Pengumpulan dan Penggunaan Data</h2>
          <p>Aplikasi ini dirancang untuk beroperasi sepenuhnya secara offline di perangkat Anda. Kami tidak mengumpulkan, menyimpan, atau mentransmisikan data pribadi apa pun, termasuk data siswa, data nilai, atau informasi pribadi Anda, ke server kami atau pihak ketiga mana pun.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">2. Penyimpanan Data</h2>
          <p>Semua data yang Anda masukkan ke dalam Aplikasi, seperti informasi siswa, nilai, dan pengaturan, disimpan secara lokal di dalam browser Anda menggunakan mekanisme penyimpanan web (seperti state React). Data ini tetap berada di perangkat Anda dan tidak dapat diakses oleh kami atau pihak lain.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">3. Keamanan Data</h2>
          <p>Anda bertanggung jawab untuk mengamankan perangkat yang Anda gunakan untuk mengakses Aplikasi ini. Karena data disimpan secara lokal, keamanan data bergantung pada keamanan perangkat dan browser Anda. Kami menyarankan untuk menggunakan perangkat yang aman dan terlindungi kata sandi.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">4. Ekspor dan Impor Data</h2>
          <p>Aplikasi menyediakan fungsionalitas untuk mengekspor data Anda ke file lokal (misalnya, file Excel). Proses ini sepenuhnya dikendalikan oleh Anda dan terjadi di perangkat Anda. Data yang diekspor adalah tanggung jawab Anda untuk disimpan dan diamankan. Demikian pula, saat mengimpor data, file tersebut dibaca secara lokal oleh browser Anda dan tidak diunggah ke server mana pun.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">5. Perubahan pada Kebijakan Privasi</h2>
          <p>Setiap perubahan pada kebijakan privasi ini akan tercermin dalam pembaruan Aplikasi. Kami mendorong Anda untuk meninjau kebijakan ini secara berkala.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
