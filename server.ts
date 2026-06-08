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

      const [response, ausbildungResponse, arbeitsagenturResponse] = await Promise.all([
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: `Find German Ausbildung Nursing (Pflegefachmann/Pflegefachfrau) openings in hospitals and care homes. 
                     Focus on ${query || 'various major cities across Germany'}. 
                     This is page ${page} of the search results.
                     Provide a list of 10 real (or highly realistic) hospitals and care homes.
                     Make sure to precisely specify the city name in the 'location' field.
                     Return the data in the requested JSON structure.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  hospitalName: { type: Type.STRING, description: 'The name of the hospital or institution.' },
                  contactNumber: { type: Type.STRING, description: 'The contact phone number.' },
                  mailId: { type: Type.STRING, description: 'The email address.' },
                  location: { type: Type.STRING, description: 'The city or region.' },
                  website: { type: Type.STRING, description: 'The official website URL.' },
                  history: { type: Type.STRING, description: 'A brief background.' },
                  openingDetails: { type: Type.STRING, description: 'Details about the openings.' },
                  postedDaysAgo: { type: Type.INTEGER, description: 'Days ago posted.' }
                },
                required: ['hospitalName', 'contactNumber', 'mailId', 'location', 'website', 'history', 'openingDetails', 'postedDaysAgo'],
              },
            },
          },
        }),
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: `Find German Ausbildung Nursing (Pflegefachmann/Pflegefachfrau) openings in hospitals and care homes sourced specifically as if from Ausbildung.de. 
                     Focus on ${query || 'various major cities across Germany'}. 
                     This is page ${page} of the search results.
                     Provide a list of 10 real (or highly realistic) hospitals and care homes from Ausbildung.de listings.
                     Make sure to precisely specify the city name in the 'location' field.
                     Return the data in the requested JSON structure.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  hospitalName: { type: Type.STRING, description: 'The name of the hospital or institution.' },
                  contactNumber: { type: Type.STRING, description: 'The contact phone number.' },
                  mailId: { type: Type.STRING, description: 'The email address.' },
                  location: { type: Type.STRING, description: 'The city or region.' },
                  website: { type: Type.STRING, description: 'The official website URL.' },
                  history: { type: Type.STRING, description: 'A brief background.' },
                  openingDetails: { type: Type.STRING, description: 'Details about the openings.' },
                  postedDaysAgo: { type: Type.INTEGER, description: 'Days ago posted.' }
                },
                required: ['hospitalName', 'contactNumber', 'mailId', 'location', 'website', 'history', 'openingDetails', 'postedDaysAgo'],
              },
            },
          },
        }),
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: `Find German Ausbildung Nursing (Pflegefachmann/Pflegefachfrau) job/apprenticeship vacancies sourced specifically as if from web.arbeitsagentur.de (Bundesagentur für Arbeit search portal).
                     Focus on ${query || 'various major cities across Germany'}. 
                     This is page ${page} of the search results.
                     Provide a list of 10 real (or highly realistic) hospitals and care homes from arbeitsagentur.de listings.
                     Make sure to precisely specify the city name in the 'location' field.
                     Return the data in the requested JSON structure.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  hospitalName: { type: Type.STRING, description: 'The name of the hospital or institution.' },
                  contactNumber: { type: Type.STRING, description: 'The contact phone number.' },
                  mailId: { type: Type.STRING, description: 'The email address.' },
                  location: { type: Type.STRING, description: 'The city or region.' },
                  website: { type: Type.STRING, description: 'The official website URL.' },
                  history: { type: Type.STRING, description: 'A brief background.' },
                  openingDetails: { type: Type.STRING, description: 'Details about the openings.' },
                  postedDaysAgo: { type: Type.INTEGER, description: 'Days ago posted.' }
                },
                required: ['hospitalName', 'contactNumber', 'mailId', 'location', 'website', 'history', 'openingDetails', 'postedDaysAgo'],
              },
            },
          },
        })
      ]);

      let results = [];
      let ausbildungResults = [];
      let arbeitsagenturResults = [];
      
      const verifyEmails = async (list: any[]) => {
        return Promise.all(list.map(async (hospital: any) => {
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
                isEmailVerified = false;
              }
            }
          }
          return { ...hospital, isEmailVerified };
        }));
      };

      if (response.text) {
        results = await verifyEmails(JSON.parse(response.text.trim()) || []);
      }
      if (ausbildungResponse.text) {
        ausbildungResults = await verifyEmails(JSON.parse(ausbildungResponse.text.trim()) || []);
      }
      if (arbeitsagenturResponse.text) {
        arbeitsagenturResults = await verifyEmails(JSON.parse(arbeitsagenturResponse.text.trim()) || []);
      }

      res.json({ results, ausbildungResults, arbeitsagenturResults });
    } catch (error: any) {
      console.error('Error in /api/search:', error);
      const is429 = error?.status === 429 || error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('429') || error?.message?.includes('quota');
      const is503 = error?.status === 503 || error?.status === 'UNAVAILABLE' || error?.code === 503 || error?.message?.includes('503');
      const statusValue = is429 ? 429 : (is503 ? 503 : 500);
      const errorMsg = is503 ? 'The AI model is currently experiencing high demand. Please try again in a few moments.' : (error?.message || 'Failed to search for nursing openings');
      res.status(statusValue).json({ error: errorMsg });
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
