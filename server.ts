import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Let Express handle heavy JSON payloads if we upload base64 images
  app.use(express.json({ limit: "50mb" }));

  // API Route for Gemini OCR
  app.post("/api/ocr", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY tidak dikonfigurasi di server." });
      }

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

      const response = await ai.models.generateContent({
        // model: "gemini-3.5-flash", 
        // fallback to gemini-3.1-flash-lite since user asked for "gemini flash lite"
        model: "gemini-3.1-flash-lite",
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
      const data = JSON.parse(text);
      res.json({ result: data });
    } catch (err) {
      console.error("Gemini OCR Error:", err);
      res.status(500).json({ error: "Gagal memproses gambar melalui Gemini.", details: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
