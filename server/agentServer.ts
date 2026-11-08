import http from 'http';
import url from 'url';

const PORT = process.env.PORT || 3001;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

/**
 * ManorMap Autonomous Agent Standalone Backend Server
 * Securely encapsulates OpenRouter API keys and provides agent orchestration endpoints.
 */
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url || '', true);

  if (parsedUrl.pathname === '/api/health' || parsedUrl.pathname === '/api/agent/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'online',
        service: 'ManorMap Autonomous Agent Server',
        model: OPENROUTER_MODEL,
        timestamp: new Date().toISOString()
      })
    );
    return;
  }

  if (parsedUrl.pathname === '/api/agent/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { messages, tools, tool_choice, max_tokens } = payload;

        const requestBody: any = {
          model: OPENROUTER_MODEL,
          messages,
          temperature: 0.2,
          max_tokens: max_tokens || 3500
        };

        if (tools && Array.isArray(tools) && tools.length > 0) {
          requestBody.tools = tools;
          requestBody.tool_choice = tool_choice || 'auto';
        }

        // Forward to OpenRouter securely with server-side key
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://manormap.internal',
            'X-Title': 'ManorMap Autonomous Agent'
          },
          body: JSON.stringify(requestBody)
        });

        const data = await openRouterResponse.json();
        res.writeHead(openRouterResponse.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Internal Agent Server Error' }));
      }
    });
    return;
  }

  // 2. Live AI Neighborhood Intelligence via Gemini Flash
  if (parsedUrl.pathname === '/api/agent/neighborhood' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
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

        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
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

        const data = await openRouterResponse.json();
        const textContent = data.choices?.[0]?.message?.content || '{}';
        const cleanJson = textContent.replace(/^```json/m, '').replace(/^```/m, '').replace(/```$/m, '').trim();
        const parsed = JSON.parse(cleanJson);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: parsed }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 3. Live AI Property Risk & Investment Audit via Gemini Flash
  if (parsedUrl.pathname === '/api/agent/property-audit' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
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

        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
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

        const data = await openRouterResponse.json();
        const textContent = data.choices?.[0]?.message?.content || '{}';
        const cleanJson = textContent.replace(/^```json/m, '').replace(/^```/m, '').replace(/```$/m, '').trim();
        const parsed = JSON.parse(cleanJson);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: parsed }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[ManorMap Agent Server] Listening on http://localhost:${PORT}`);
  });
}

export default server;

