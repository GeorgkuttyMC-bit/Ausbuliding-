import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dns from 'dns';
import util from 'util';

const resolveMx = util.promisify(dns.resolveMx);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/search', async (req, res) => {
    try {
      const { query, page = 1 } = req.body;
      
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
        model: 'gemini-3.1-flash-lite',
        contents: `Find German Ausbildung Nursing (Pflegefachmann/Pflegefachfrau) openings in hospitals and care homes. 
                   Focus on ${query || 'various major cities across Germany'}. 
                   This is page ${page} of the search results.
                   Provide a list of 25 real (or highly realistic) hospitals and care homes.
                   Make sure to precisely specify the city name in the 'location' field.
                   Return the data in the requested JSON structure. Do not duplicate results from earlier pages.`,
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
                },
                history: {
                  type: Type.STRING,
                  description: 'A brief history or background of the hospital or care home.',
                },
                openingDetails: {
                  type: Type.STRING,
                  description: 'Details about the Ausbildung (apprenticeship) openings, requirements, or benefits.',
                }
              },
              required: ['hospitalName', 'contactNumber', 'mailId', 'location', 'history', 'openingDetails'],
            },
          },
        },
      });

      let results = [];
      if (response.text) {
        results = JSON.parse(response.text.trim());
        
        // Verify email domains concurrently
        results = await Promise.all(results.map(async (hospital: any) => {
          let isEmailVerified = false;
          if (hospital.mailId) {
            const parts = hospital.mailId.split('@');
            if (parts.length === 2) {
              const domain = parts[1];
              try {
                const mxRecords = await resolveMx(domain);
                if (mxRecords && mxRecords.length > 0) {
                  isEmailVerified = true;
                }
              } catch (e) {
                // Domain doesn't have MX records or unresolvable
                isEmailVerified = false;
              }
            }
          }
          return { ...hospital, isEmailVerified };
        }));
      }

      res.json({ results });
    } catch (error: any) {
      console.error('Error in /api/search:', error);
      const statusValue = error?.status === 429 || error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('429') || error?.message?.includes('quota') ? 429 : 500;
      res.status(statusValue).json({ error: error?.message || 'Failed to search for nursing openings' });
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
