import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/search', async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({ error: 'Gemini API Key is missing. Please configure it in your environment settings.' });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Find German Ausbildung Nursing (Pflegefachmann/Pflegefachfrau) openings or major hospitals offering these programs in Germany. 
                   Focus on ${query || 'entire Germany'}. 
                   Provide 5-10 real (or highly realistic) hospitals.
                   Return the data in the requested JSON structure.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                hospitalName: {
                  type: Type.STRING,
                  description: 'The name of the hospital or institution.',
                },
                contactNumber: {
                  type: Type.STRING,
                  description: 'The contact phone number for the nursing apprenticeship department.',
                },
                mailId: {
                  type: Type.STRING,
                  description: 'The email address for apprenticeship applications or inquiries.',
                },
                location: {
                  type: Type.STRING,
                  description: 'The city or region where the hospital is located.',
                }
              },
              required: ['hospitalName', 'contactNumber', 'mailId', 'location'],
            },
          },
        },
      });

      let results = [];
      if (response.text) {
        results = JSON.parse(response.text.trim());
      }

      res.json({ results });
    } catch (error: any) {
      console.error('Error in /api/search:', error);
      res.status(500).json({ error: error?.message || 'Failed to search for nursing openings' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
