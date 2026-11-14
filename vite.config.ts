import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'manormap-agent-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          // Health check
          if (req.url === '/api/agent/health' && req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                status: 'online',
                agent: 'ManorMap Real Estate Autonomous Agent',
                model: OPENROUTER_MODEL,
                timestamp: new Date().toISOString()
              })
            );
            return;
          }

          // Helper to read JSON request body
          const parseBody = () => {
            return new Promise<any>((resolve, reject) => {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', () => {
                try {
                  resolve(JSON.parse(body || '{}'));
                } catch (e) {
                  reject(e);
                }
              });
              req.on('error', reject);
            });
          };

          // 1. Full Multi-step Tool Calling Agent
          if (req.url === '/api/agent/chat' && req.method === 'POST') {
            try {
              const payload = await parseBody();
              const requestBody: any = {
                model: OPENROUTER_MODEL,
                messages: payload.messages,
                temperature: 0.2,
                max_tokens: payload.max_tokens || 3500
              };

              if (payload.tools && Array.isArray(payload.tools) && payload.tools.length > 0) {
                requestBody.tools = payload.tools;
                requestBody.tool_choice = payload.tool_choice || 'auto';
              }

              const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${OPENROUTER_KEY}`,
                  'HTTP-Referer': 'https://manormap.internal',
                  'X-Title': 'ManorMap Real Estate Intelligence'
                },
                body: JSON.stringify(requestBody)
              });

              const data = await response.json();
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = response.status;
              res.end(JSON.stringify(data));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Agent Server Middleware Error' }));
            }
            return;
          }

          // 2. Live AI Neighborhood Intelligence via Gemini Flash
          if (req.url === '/api/agent/neighborhood' && req.method === 'POST') {
            try {
              const payload = await parseBody();
              const locality = payload.localityName || 'Local Area';
              const city = payload.city || 'India';

              const prompt = `You are ManorMap's Principal Geospatial & Real Estate Intelligence AI.
Perform an in-depth, rigorous neighborhood intelligence audit of: "${locality}, ${city}".
You MUST respond with ONLY valid, raw JSON (no backticks, no markdown fencing, no commentary) matching this schema:
{
  "name": "${locality}",
  "city": "${city}",
  "overallScore": 88,
  "scores": {
    "connectivity": 92,
    "education": 88,
    "healthcare": 85,
    "employment": 90,
    "environment": 80,
    "infrastructure": 92
  },
  "tagline": "Brief punchy 1-sentence descriptor of this locality",
  "executiveSummary": "Comprehensive 3-4 sentence appraisal of this micro-market's livability, demographics, investment trajectory and lifestyle.",
  "strengths": [
    "Key advantage 1 with specific local context",
    "Key advantage 2 with specific infrastructure",
    "Key advantage 3 with commercial or lifestyle details"
  ],
  "watchpoints": [
    "Potential drawback or bottleneck 1 (e.g. peak traffic, water table, noise)",
    "Potential drawback or bottleneck 2"
  ],
  "floodRisk": "Low" | "Moderate" | "High",
  "floodRiskDetails": "Specific topographic terrain, elevation, storm drainage and lake overflow catchment analysis for ${locality}",
  "upcomingInfrastructure": [
    "Upcoming infrastructure project 1 (e.g. Metro phase, flyover, ring road)",
    "Upcoming infrastructure project 2"
  ],
  "rentalYieldRange": "3.5% - 4.8%",
  "appreciationOutlook": "Expected 24-month capital appreciation forecast based on local absorption and demand intensity",
  "waterPowerReliability": "Municipal supply reliability, groundwater table health and electrical grid stability assessment"
}`;

              const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${OPENROUTER_KEY}`,
                  'HTTP-Referer': 'https://manormap.internal',
                  'X-Title': 'ManorMap Real Estate Intelligence'
                },
                body: JSON.stringify({
                  model: OPENROUTER_MODEL,
                  messages: [{ role: 'user', content: prompt }],
                  temperature: 0.1,
                  max_tokens: 2000
                })
              });

              const data = await response.json();
              const textContent = data.choices?.[0]?.message?.content || '{}';
              const cleanJson = textContent.replace(/^```json/m, '').replace(/^```/m, '').replace(/```$/m, '').trim();
              const parsed = JSON.parse(cleanJson);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, data: parsed }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
            return;
          }

          // 3. Live AI Property Risk & Investment Audit via Gemini Flash
          if (req.url === '/api/agent/property-audit' && req.method === 'POST') {
            try {
              const payload = await parseBody();
              const p = payload.property;

              const prompt = `You are ManorMap's Senior Real Estate Investment Analyst & Geospatial Auditor.
Conduct a deep institutional audit of this property:
- Title: "${p.title}"
- Price: ₹${p.price} (${p.priceDisplay})
- Type: ${p.type} (${p.category})
- BHK: ${p.bhk} BHK, Bathrooms: ${p.bathrooms}
- Area: ${p.areaSqFt} sq.ft
- Facing: ${p.facing || 'East'}
- Address: ${p.address}, ${p.area}, ${p.city}, ${p.state} - ${p.pinCode}
- Coordinates: [Lat: ${p.coordinates[1]}, Lng: ${p.coordinates[0]}]
- Amenities: ${(p.features || []).join(', ')}

Respond ONLY with valid, raw JSON (no backticks, no markdown fencing, no commentary) matching this schema:
{
  "overallRating": 8.8,
  "investmentVerdict": "Concise high-conviction recommendation (e.g. 'Strong Buy for Long-term Capital Growth')",
  "pros": [
    "Specific advantage 1 (analyzing facing direction, layout, and price fairness)",
    "Specific advantage 2 (connectivity, metro, nearby hubs)",
    "Specific advantage 3 (society amenities and livability quotient)"
  ],
  "cons": [
    "Specific watchpoint 1 (potential noise, traffic, pricing premium, maintenance)",
    "Specific watchpoint 2"
  ],
  "floodRisk": "Low" | "Moderate" | "High",
  "floodRiskDetails": "Geospatial terrain elevation and rainwater drainage assessment for ${p.area}, ${p.city}",
  "facingBenefits": "Specific sunlight, cross-ventilation, and Vastu compliance impact of ${p.facing || 'East'} facing",
  "priceAssessment": "Price per sq.ft benchmark compared to recent RERA transactions in ${p.area}",
  "fiveYearAppreciationForecast": "Projected 5-year CAGR range and key demand drivers",
  "grossRentalYieldEstimate": "3.8% - 4.4%"
}`;

              const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${OPENROUTER_KEY}`,
                  'HTTP-Referer': 'https://manormap.internal',
                  'X-Title': 'ManorMap Real Estate Intelligence'
                },
                body: JSON.stringify({
                  model: OPENROUTER_MODEL,
                  messages: [{ role: 'user', content: prompt }],
                  temperature: 0.1,
                  max_tokens: 2000
                })
              });

              const data = await response.json();
              const textContent = data.choices?.[0]?.message?.content || '{}';
              const cleanJson = textContent.replace(/^```json/m, '').replace(/^```/m, '').replace(/```$/m, '').trim();
              const parsed = JSON.parse(cleanJson);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, data: parsed }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
            return;
          }

          next();
        });
      }
    }
  ],
  server: {
    port: 5173,
    host: true
  }
});
