
export default async function handler(req, res) {
  // Hanya izinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = JSON.parse(req.body);

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // 1. Validasi token ke Server Google secara langsung
    // Ini memastikan token valid dan milik user yang sebenarnya
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!googleResponse.ok) {
      return res.status(401).json({ error: 'Token Google tidak valid atau kadaluwarsa' });
    }

    const userData = await googleResponse.json();
    const userEmail = userData.email;

    // 2. Ambil daftar email yang diizinkan dari Environment Variable server
    // Variabel ini (ALLOWED_EMAILS) harus disetting di Vercel Dashboard atau .env
    // Format: "email1@gmail.com,email2@sekolah.id"
    const allowedEmailsString = process.env.ALLOWED_EMAILS;

    // Jika variabel belum disetting, demi keamanan blokir semua (atau izinkan mode debug)
    if (!allowedEmailsString) {
      console.error('SERVER CONFIG ERROR: ALLOWED_EMAILS environment variable is not set.');
      return res.status(500).json({ 
        error: 'Konfigurasi Server Belum Lengkap. Admin harus mengatur ALLOWED_EMAILS.' 
      });
    }

    const allowedEmails = allowedEmailsString.split(',').map(e => e.trim().toLowerCase());

    // 3. Cek apakah email user ada di daftar whitelist
    // Kita cek email spesifik ATAU domain (jika didaftarkan format *@sekolah.id)
    const isEmailAllowed = allowedEmails.includes(userEmail.toLowerCase());
    const isDomainAllowed = allowedEmails.some(allowed => allowed.startsWith('@') && userEmail.toLowerCase().endsWith(allowed));

    if (isEmailAllowed || isDomainAllowed) {
      // Lolos verifikasi
      return res.status(200).json(userData);
    } else {
      // Ditolak
      console.warn(`Login attempt blocked for email: ${userEmail}`);
      return res.status(403).json({ 
        error: 'Email Anda tidak terdaftar dalam sistem atau tidak memiliki izin akses.' 
      });
    }

  } catch (error) {
    console.error('Verification Error:', error);
    return res.status(500).json({ error: 'Internal Server Error during verification' });
  }
}
