export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { imageBase64, mimeType } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY tidak dikonfigurasi di server." });
      }

      // Late dynamic import so it doesn't break if not using it
      const { GoogleGenAI, Type } = await import("@google/genai");

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Anda adalah asisten OCR untuk RPP/Modul Ajar Guru. 
Ekstrak 'Lingkup Materi' (biasanya berupa judul Bab/Tema) dan 'Tujuan Pembelajaran' (TP, biasanya berupa daftar) dari gambar ini.
Hanya ekstrak data tersebut. Ubah ke struktur JSON.`;

      // Fallback model list
      const modelsToTry = [
        "gemini-3.1-flash-lite", // Priority 1: Flash Lite
        "gemini-3.5-flash",      // Priority 2: Flash
        "gemini-3.1-pro-preview" // Priority 3: Pro
      ];

      let lastError = null;
      let successData = null;
      let modelUsed = null;

      for (const modelName of modelsToTry) {
        try {
          console.log(`Mengusahakan OCR menggunakan model: ${modelName}...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    data: imageBase64,
                    mimeType: mimeType || "image/jpeg"
                  }
                },
                { text: prompt }
              ]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                description: "Daftar unit Lingkup Materi beserta Tujuan Pembelajarannya (TP)",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: "Nama Bab / Lingkup Materi. (misal: 'Bab 1: Hakikat Fisika')"
                    },
                    tps: {
                      type: Type.ARRAY,
                      description: "Daftar Tujuan Pembelajaran pada bab/lingkup materi tersebut",
                      items: {
                        type: Type.STRING
                      }
                    }
                  },
                  required: ["name", "tps"]
                }
              }
            }
          });

          const text = response.text;
          successData = JSON.parse(text);
          modelUsed = modelName;
          console.log(`Berhasil menggunakan model: ${modelName}`);
          break; // Exit the loop on success
        } catch (err) {
          console.warn(`Gagal memproses dengan model: ${modelName}. Error:`, err.message || err);
          lastError = err;
          // Continue to the next model in list
        }
      }

      if (successData) {
        return res.status(200).json({ result: successData, modelUsed });
      } else {
        throw new Error(`Semua model Gemini yang dicoba (Flash Lite, Flash, Pro) gagal atau melebihi kuota. Detail error terakhir: ${lastError ? lastError.message : 'Unknown'}`);
      }
    } catch (err) {
      console.error("Gemini OCR Error:", err);
      return res.status(500).json({ error: "Gagal memproses gambar melalui Gemini.", details: err.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
