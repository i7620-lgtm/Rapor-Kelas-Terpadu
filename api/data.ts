import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

// The data structure for the entire application state
// This should match the structure sent from the frontend
interface AppData {
  settings: any;
  students: any[];
  grades: any[];
  attendance: any[];
  learningObjectives: any;
  studentDescriptions: any;
  subjects: any[];
  extracurriculars: any[];
  studentExtracurriculars: any[];
  studentNotes: any;
  noteTemplates: any[];
  p5Projects: any[];
  p5ProjectAssessments: any[];
}

// A single key to store all application data in the database
const DATA_KEY = 'app_state';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Ensure the table exists
    await sql`
      CREATE TABLE IF NOT EXISTS rkt_data (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL
      );
    `;

    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT value FROM rkt_data WHERE key = ${DATA_KEY};
      `;
      
      if (rows.length > 0) {
        res.status(200).json(rows[0].value);
      } else {
        // If no data is found, return an empty/default structure
        const defaultData: Partial<AppData> = {};
        res.status(200).json(defaultData);
      }
    } else if (req.method === 'POST') {
      const data: AppData = req.body;

      // Basic validation to ensure we're not saving empty/malformed data
      if (!data || typeof data.settings !== 'object' || !Array.isArray(data.students)) {
        return res.status(400).json({ error: 'Invalid data format' });
      }

      // Use INSERT with ON CONFLICT to perform an "upsert"
      await sql`
        INSERT INTO rkt_data (key, value)
        VALUES (${DATA_KEY}, ${JSON.stringify(data)}::jsonb)
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value;
      `;
      
      res.status(200).json({ message: 'Data saved successfully' });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    // Avoid sending detailed error messages to the client in production
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: 'Internal Server Error', details: errorMessage });
  }
}
