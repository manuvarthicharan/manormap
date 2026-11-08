import {
  AgentMessage,
  MapContextSnapshot,
  AgentActivityStep,
  AgentActionCard,
  AgentMapAction
} from '../types';
import {
  AGENT_TOOLS_DEFINITIONS,
  isBrowserMapTool,
  executeServerTool
} from './agentToolRegistry';
import { mapActionBridge } from './mapActionBridge';
import { agentMemoryService } from './agentMemoryService';
import { resolveLocality, compareTwoLocalities } from './localityIntelligenceService';
import { getAllProperties } from './propertyService';
import { calculateInvestmentIntelligence } from './investmentAnalysisService';
import { getApiEndpoint } from './apiConfig';

const SYSTEM_PROMPT = `You are an advanced autonomous real estate research and geospatial advisory agent operating inside the interactive property discovery platform.

You are not a generic chatbot. You are an experienced, analytical real estate consultant with direct access to the live Google Map, authoritative property database, geographical geocoding, local intelligence services, and investment calculators.

Your job is to investigate, explain, compare, and assist users in making informed, confident property decisions.

KEY OPERATIONAL CAPABILITIES:
1. You can inspect the live Google Map viewport (coordinates, zoom, visible listings, active overlays).
2. You can OPERATE the live map:
   - When asked to show a location, CALL 'move_map' to actually fly the user's browser to that area!
   - When asked to highlight listings, CALL 'highlight_properties'.
   - When asked to show an area boundary, CALL 'highlight_area' or 'draw_map_polygon'.
   - When asked to compare localities, move to and inspect both locations!
   - When asked to filter listings (e.g. 3BHK under 1 Cr), CALL 'apply_map_filters'.
3. You understand Indian real estate units & terminology:
   - Indian currency: Lakhs (₹L) and Crores (₹Cr). ₹1 Crore = 100 Lakhs = 10,000,000 INR.
   - Land units: Square Yards (Gaj), Gunthas (1 Guntha = 121 Sq. Yds), Acres (1 Acre = 40 Gunthas), Square Feet.
   - Layouts: 1 BHK, 2 BHK, 3 BHK, 4 BHK, Penthouses, Villas, Plots.
   - Vastu orientations: East, North, North-East.
   - Official RERA registration requirements and verification standards.
4. Autonomous Multi-Step Execution:
   - When asked a complex question (e.g. "Find me 2BHK properties under 80L near an IT corridor with good connectivity and check flood risk"):
     1. Search for matching real properties using 'search_properties'.
     2. Move the map to the area using 'move_map'.
     3. Highlight matching properties using 'highlight_properties'.
     4. Check flood risk and environmental buffer using 'get_environmental_risk'.
     5. Present findings with transparent evidence and practical recommendations.
5. Absolute Data Integrity:
   - Never fabricate property details, prices, or RERA numbers.
   - If something is an estimate (e.g. projected 3-year appreciation), clearly label it as an algorithmic estimate.
   - Keep answers structured with clear markdown, bullet points, and key takeaways.`;

export interface StreamCallbacks {
  onActivity: (activity: AgentActivityStep) => void;
  onCard: (card: AgentActionCard) => void;
  onChunk: (chunk: string) => void;
}

export class AIAgentService {
  private openRouterKey: string = import.meta.env.VITE_OPENROUTER_API_KEY || '';
  private modelName: string = 'google/gemini-2.5-flash';

  public async sendMessage(
    userText: string,
    mapContext: MapContextSnapshot,
    callbacks: StreamCallbacks
  ): Promise<AgentMessage> {
    const session = agentMemoryService.getSession();
    const messageId = `agent-msg-${Date.now()}`;
    const activities: AgentActivityStep[] = [];
    const cards: AgentActionCard[] = [];
    const executedActions: AgentMapAction[] = [];
    let fullResponseText = '';

    const addActivity = (desc: string, tool?: string) => {
      const act: AgentActivityStep = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        description: desc,
        tool,
        status: 'active',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      activities.push(act);
      callbacks.onActivity(act);
      return act;
    };

    const completeActivity = (act: AgentActivityStep) => {
      act.status = 'completed';
      callbacks.onActivity(act);
    };

    // Step 1: Record initial activity
    const initialAct = addActivity('Analyzing your property inquiry & map context...');

    // Try communicating via OpenRouter API with multi-step tool execution loop
    try {
      fullResponseText = await this.executeOpenRouterToolLoop(
        userText,
        mapContext,
        session,
        activities,
        cards,
        executedActions,
        callbacks,
        addActivity,
        completeActivity
      );
    } catch (apiError: any) {
      console.warn('OpenRouter online call failed, falling back to Autonomous Local Intelligence Agent:', apiError.message);
      completeActivity(initialAct);

      // Fallback: Autonomous Local Intelligence Agent
      fullResponseText = await this.executeLocalAgentLoop(
        userText,
        mapContext,
        session,
        activities,
        cards,
        executedActions,
        callbacks,
        addActivity,
        completeActivity
      );
    }

    const agentMessage: AgentMessage = {
      id: messageId,
      sender: 'agent',
      content: fullResponseText,
      activities,
      cards,
      mapActions: executedActions,
      timestamp: 'Just now'
    };

    agentMemoryService.addMessage({
      id: `user-${Date.now()}`,
      sender: 'user',
      content: userText,
      timestamp: 'Just now'
    });
    agentMemoryService.addMessage(agentMessage);

    return agentMessage;
  }

  /**
   * Executes multi-step OpenRouter function calling loop
   */
  private async executeOpenRouterToolLoop(
    userText: string,
    mapContext: MapContextSnapshot,
    session: any,
    _activities: AgentActivityStep[],
    cards: AgentActionCard[],
    executedActions: AgentMapAction[],
    callbacks: StreamCallbacks,
    addActivity: (desc: string, tool?: string) => AgentActivityStep,
    completeActivity: (act: AgentActivityStep) => void
  ): Promise<string> {
    const allProps = getAllProperties();
    const catalogSummary = allProps.map((p) => {
      const ppsf = p.areaSqFt > 0 ? Math.round(p.price / p.areaSqFt) : 0;
      return `• [ID: "${p.id}"] "${p.title}" | Price: ${p.priceDisplay} (₹${(p.price / 100000).toFixed(1)}L, ₹${ppsf.toLocaleString('en-IN')}/sq.ft) | Type: ${p.type} (${p.category}) | ${p.bhk} BHK, ${p.bathrooms} Bath (${p.areaSqFt} sq.ft) | Facing: ${p.facing || 'East'} | Locality: ${p.area}, ${p.city} | Coordinates: [Lng: ${p.coordinates[0]}, Lat: ${p.coordinates[1]}] | Status: ${p.readyToMove ? 'Ready to Move' : 'Under Construction'} | Verified: ${p.verified ? 'Yes (RERA: ' + (p.reraId || 'Verified') + ')' : 'Pending'} | Contact: ${p.contact.name}`;
    }).join('\n');

    const visibleSummary = (mapContext.visiblePropertiesList || []).map((p) => `• [ID: "${p.id}"] "${p.title}" in ${p.area}, ${p.city} (${p.priceDisplay})`).join('\n');
    const activeLocality = mapContext.currentLocality || 'Detected Area';
    const activeCity = mapContext.currentCity || 'India';

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'system',
        content: `LIVE MAP & PROPERTY DATABASE CONTEXT:
Active Locality Exploring: ${activeLocality}, ${activeCity}
Center Coordinates: [Lng: ${mapContext.center[0].toFixed(4)}, Lat: ${mapContext.center[1].toFixed(4)}]
Zoom Level: ${mapContext.zoom}
Active Filters: ${JSON.stringify(mapContext.activeFilters)}
Selected Property: ${mapContext.selectedProperty ? `"${mapContext.selectedProperty.title}" (ID: ${mapContext.selectedProperty.id}, Price: ${mapContext.selectedProperty.priceDisplay})` : 'None'}
Visible Listings in Current Viewport (${mapContext.visiblePropertiesCount}):
${visibleSummary || 'None in immediate zoom. You can move the map or search properties.'}

ACTIVE DATABASE OF PROPERTIES (${allProps.length} verified listings available):
${catalogSummary}

OPERATIONAL INSTRUCTIONS ON PROPERTIES:
- You are 100% aware of all the above real listings in the database!
- When the user asks about properties in any area (e.g. Gachibowli, Kondapur, Hitec City, Indiranagar, Whitefield, Bandra, etc.), or for a specific BHK or budget, proactively present and describe them with their exact prices, square feet, and features.
- If asked about the current area, refer to the active locality: "${activeLocality}, ${activeCity}". Do NOT assume or get stuck on Gachibowli unless the user is specifically viewing Gachibowli!
- You can call 'select_property' to view details on screen.
- You can call 'highlight_properties' to spotlight them on the live Google Map.
- You can call 'move_map' to fly the map right to their coordinates.`
      }
    ];

    // Include recent session history
    const recent = (session.messages || []).slice(-6);
    recent.forEach((m: any) => {
      messages.push({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content
      });
    });

    messages.push({ role: 'user', content: userText });

    let finalResponse = '';
    let loopCount = 0;
    const maxLoops = 6;

    while (loopCount < maxLoops) {
      loopCount++;

      // Post through secure server-side agent endpoint
      let response: Response;
      try {
        response = await fetch(getApiEndpoint('/api/agent/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages,
            tools: AGENT_TOOLS_DEFINITIONS,
            tool_choice: 'auto'
          })
        });
      } catch (networkErr) {
        // Fallback directly to OpenRouter if proxy unavailable
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.openRouterKey}`,
            'HTTP-Referer': 'https://realtyradar.internal',
            'X-Title': 'Real Estate Intelligence'
          },
          body: JSON.stringify({
            model: this.modelName,
            messages,
            tools: AGENT_TOOLS_DEFINITIONS,
            tool_choice: 'auto',
            temperature: 0.2,
            max_tokens: 3500
          })
        });
      }

      if (!response.ok) {
        throw new Error(`OpenRouter HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      if (!choice) throw new Error('No completion returned from OpenRouter');

      const message = choice.message;

      // If model returned tool calls, execute each tool!
      if (message.tool_calls && message.tool_calls.length > 0) {
        messages.push(message);

        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;
          let args: any = {};
          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            args = {};
          }

          const act = addActivity(`Executing: ${toolName.replace(/_/g, ' ')}...`, toolName);
          let toolResult: any;

          if (isBrowserMapTool(toolName)) {
            // Physical browser Google Maps execution
            const action: AgentMapAction = {
              actionId: `action-${Date.now()}`,
              tool: toolName,
              args,
              status: 'executing',
              timestamp: Date.now()
            };
            executedActions.push(action);

            const res = await mapActionBridge.executeAction(action);
            action.status = res.success ? 'confirmed' : 'failed';
            action.result = res.data;
            toolResult = res;

            if (toolName === 'move_map' || toolName === 'highlight_area') {
              cards.push({
                id: `card-${Date.now()}`,
                type: 'map_navigation',
                title: args.localityName ? `Viewing ${args.localityName}` : `Navigated on Google Maps`,
                subtitle: `Zoom: ${args.zoom || mapContext.zoom} • Coordinates set`,
                badge: 'Live Map Sync',
                data: args
              });
            }
          } else {
            // Server data execution
            toolResult = await executeServerTool(toolName, args, mapContext);

            if (toolName === 'get_locality_intelligence' && toolResult.name) {
              agentMemoryService.updateLastLocality(toolResult.name);
              cards.push({
                id: `card-${Date.now()}`,
                type: 'locality_comparison',
                title: `${toolResult.name} Intelligence Score: ${toolResult.scores?.overallScore}/100`,
                subtitle: `Avg ₹${toolResult.avgPricePerSqFt}/sq.ft • ${toolResult.appreciationLabel}`,
                badge: 'RERA Benchmark',
                data: toolResult
              });
            } else if (toolName === 'search_properties' && toolResult.properties && toolResult.properties.length > 0) {
              cards.push({
                id: `card-${Date.now()}`,
                type: 'property_shortlist',
                title: `Found ${toolResult.matchedCount} Matching Properties`,
                subtitle: `Showing top ${toolResult.properties.length} verified listings`,
                badge: 'Property Shortlist',
                data: toolResult.properties
              });
            } else if (toolName === 'calculate_investment_roi' && toolResult.breakEvenYears) {
              cards.push({
                id: `card-${Date.now()}`,
                type: 'investment_roi',
                title: `Investment ROI Analysis`,
                subtitle: toolResult.buyVsRent?.verdictSummary || `Break-even: ${toolResult.breakEvenYears} yrs`,
                badge: `Gross Yield: ${toolResult.grossRentalYield}%`,
                data: toolResult
              });
            } else if (toolName === 'get_property_details' && toolResult.property) {
              cards.push({
                id: `card-${Date.now()}`,
                type: 'property_shortlist',
                title: toolResult.property.title,
                subtitle: `${toolResult.property.priceDisplay} • ${toolResult.property.bhk} BHK in ${toolResult.property.area}`,
                badge: 'Property Detail',
                data: toolResult.property
              });
            }
          }

          completeActivity(act);

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult)
          });
        }
      } else {
        // Final message generated by model
        finalResponse = message.content || '';
        callbacks.onChunk(finalResponse);
        break;
      }
    }

    return finalResponse;
  }

  /**
   * Resilient Autonomous Local Intelligence Agent
   * Executes tools and performs comprehensive real estate reasoning when offline
   */
  private async executeLocalAgentLoop(
    userText: string,
    _mapContext: MapContextSnapshot,
    _session: any,
    _activities: AgentActivityStep[],
    cards: AgentActionCard[],
    executedActions: AgentMapAction[],
    callbacks: StreamCallbacks,
    addActivity: (desc: string, tool?: string) => AgentActivityStep,
    completeActivity: (act: AgentActivityStep) => void
  ): Promise<string> {
    const q = userText.toLowerCase();

    // 1. Locality Comparison Intent (e.g. "Compare Gachibowli and Kondapur")
    if (q.includes('compare') && (q.includes('and') || q.includes('vs'))) {
      const act = addActivity('Comparing target micro-markets across 6 neighborhood dimensions...');
      let locAId = 'gachibowli';
      let locBId = 'kondapur';

      if (q.includes('indiranagar') || q.includes('whitefield')) {
        locAId = 'indiranagar';
        locBId = 'whitefield';
      } else if (q.includes('bandra') || q.includes('golf course')) {
        locAId = 'bandrawest';
        locBId = 'golfcourseroad';
      }

      const comp = compareTwoLocalities(locAId, locBId);
      completeActivity(act);

      if (comp) {
        // Move to Locality A and highlight it
        const moveAction: AgentMapAction = {
          actionId: `action-${Date.now()}`,
          tool: 'highlight_area',
          args: { localityName: comp.localityA.name },
          status: 'executing',
          timestamp: Date.now()
        };
        executedActions.push(moveAction);
        await mapActionBridge.executeAction(moveAction);

        cards.push({
          id: `card-${Date.now()}`,
          type: 'locality_comparison',
          title: `${comp.localityA.name} (${comp.localityA.scores.overallScore}/100) vs ${comp.localityB.name} (${comp.localityB.scores.overallScore}/100)`,
          subtitle: comp.summaryVerdict,
          badge: 'Neighborhood Intelligence',
          data: comp
        });

        const reply = `### Locality Comparison: ${comp.localityA.name} vs ${comp.localityB.name}

I have highlighted **${comp.localityA.name}** on your live map and analyzed both micro-markets across all 6 Neighborhood Intelligence dimensions:

| Dimension | ${comp.localityA.name} | ${comp.localityB.name} | Advantage |
| :--- | :---: | :---: | :--- |
${comp.comparisonTable.map((t) => `| **${t.dimension}** | ${t.scoreA}/100 | ${t.scoreB}/100 | ${t.advantage === 'Equal' ? 'Evenly Matched' : t.advantage === 'A' ? comp.localityA.name : comp.localityB.name} |`).join('\n')}

#### Financial & Appreciation Metrics:
- **Price per Sq. Ft**: ${comp.localityA.name} averages **₹${comp.localityA.avgPricePerSqFt.toLocaleString('en-IN')}/sq.ft** vs **₹${comp.localityB.avgPricePerSqFt.toLocaleString('en-IN')}/sq.ft** in ${comp.localityB.name} (${comp.priceDifferencePercent > 0 ? `+${comp.priceDifferencePercent}% premium for ${comp.localityA.name}` : `${Math.abs(comp.priceDifferencePercent)}% discount`}).
- **Rental Yield**: ${comp.localityA.name} generates **${comp.localityA.rentalYieldPercent}%** vs **${comp.localityB.rentalYieldPercent}%** in ${comp.localityB.name}.
- **12-Month Growth**: ${comp.localityA.appreciationLabel} vs ${comp.localityB.appreciationLabel}.

**Executive Verdict**: ${comp.summaryVerdict}`;

        callbacks.onChunk(reply);
        return reply;
      }
    }

    // 2. Map Navigation Intent (e.g. "Take me to Gachibowli", "Go to Indiranagar")
    if (q.includes('take me to') || q.includes('go to') || q.includes('move to') || q.includes('navigate to') || q.includes('show me gachibowli')) {
      const act = addActivity('Resolving geographical coordinates and navigating map...');
      let targetLoc = resolveLocality('gachibowli')!;
      if (q.includes('kondapur')) targetLoc = resolveLocality('kondapur')!;
      if (q.includes('hitec')) targetLoc = resolveLocality('hiteccity')!;
      if (q.includes('indiranagar')) targetLoc = resolveLocality('indiranagar')!;
      if (q.includes('whitefield')) targetLoc = resolveLocality('whitefield')!;
      if (q.includes('bandra')) targetLoc = resolveLocality('bandrawest')!;

      agentMemoryService.updateLastLocality(targetLoc.name);

      const navAction: AgentMapAction = {
        actionId: `action-${Date.now()}`,
        tool: 'move_map',
        args: { lat: targetLoc.coordinates[1], lng: targetLoc.coordinates[0], zoom: 14 },
        status: 'executing',
        timestamp: Date.now()
      };
      executedActions.push(navAction);
      await mapActionBridge.executeAction(navAction);

      const highlightAction: AgentMapAction = {
        actionId: `action-${Date.now()}-hl`,
        tool: 'highlight_area',
        args: { localityName: targetLoc.name },
        status: 'executing',
        timestamp: Date.now()
      };
      executedActions.push(highlightAction);
      await mapActionBridge.executeAction(highlightAction);

      completeActivity(act);

      cards.push({
        id: `card-${Date.now()}`,
        type: 'map_navigation',
        title: `Viewing ${targetLoc.name}, ${targetLoc.city}`,
        subtitle: `Overall Locality Score: ${targetLoc.scores.overallScore}/100 • Avg ₹${targetLoc.avgPricePerSqFt}/sq.ft`,
        badge: 'Live Map Centered',
        data: targetLoc
      });

      const reply = `I have navigated the Google Map directly to **${targetLoc.name}, ${targetLoc.city}** (Zoom 14) and highlighted its micro-market boundary.

**Neighborhood Intelligence Overview:**
- **Overall Locality Score**: **${targetLoc.scores.overallScore}/100**
- **Average Price**: **₹${targetLoc.avgPricePerSqFt.toLocaleString('en-IN')}/sq.ft** (${targetLoc.appreciationLabel})
- **Rental Yield**: **${targetLoc.rentalYieldPercent}% gross yield**
- **Key Connectivity**: ${targetLoc.keyHighlights[0]}
- **Major Advantage**: ${targetLoc.pros[0]}`;

      callbacks.onChunk(reply);
      return reply;
    }

    // 3. Investment & Buy vs Rent ROI Analysis
    if (q.includes('roi') || q.includes('yield') || q.includes('buy vs rent') || q.includes('worth buying') || q.includes('75 lakh') || q.includes('investment')) {
      const act = addActivity('Running 10-year discounted cash flow & Buy vs Rent analysis...');
      const priceMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|cr|crore)/i);
      let purchasePrice = 7500000;
      if (priceMatch) {
        const val = parseFloat(priceMatch[1]);
        if (q.includes('cr') || q.includes('crore')) purchasePrice = val * 10000000;
        else purchasePrice = val * 100000;
      }

      const rentMatch = q.match(/(\d+)\s*(?:k|thousand|\/mo)/i);
      const monthlyRent = rentMatch ? parseInt(rentMatch[1], 10) * 1000 : 25000;

      const roi = calculateInvestmentIntelligence({
        purchasePrice,
        expectedMonthlyRent: monthlyRent
      });
      completeActivity(act);

      cards.push({
        id: `card-${Date.now()}`,
        type: 'investment_roi',
        title: `Investment Analysis: ₹${(purchasePrice / 100000).toFixed(1)} Lakh Property`,
        subtitle: roi.buyVsRent.verdictSummary,
        badge: `Break-even: ${roi.breakEvenYears} Yrs`,
        data: roi
      });

      const reply = `### Investment Intelligence & Buy vs Rent Analysis

Here is the financial breakdown for a **₹${(purchasePrice / 100000).toFixed(1)} Lakh** property compared to renting at **₹${monthlyRent.toLocaleString('en-IN')}/month**:

#### 1. Yield & Outflow Summary:
- **Estimated Monthly EMI**: **₹${roi.monthlyEMI.toLocaleString('en-IN')}/mo** (8.5% p.a., 20-Year tenure, 20% down payment)
- **Gross Rental Yield**: **${roi.grossRentalYield}%** | **Net Rental Yield**: **${roi.netRentalYield}%** (after maintenance & property tax)
- **Break-Even Period**: **${roi.breakEvenYears} Years**

#### 2. Capital Appreciation Scenarios:
- **Conservative (6% CAGR)**: 5-Year Value: **₹${(roi.scenarios[0].valueAfter5Y / 100000).toFixed(1)}L** | 10-Year Value: **₹${(roi.scenarios[0].valueAfter10Y / 100000).toFixed(1)}L**
- **Moderate (10% CAGR)**: 5-Year Value: **₹${(roi.scenarios[1].valueAfter5Y / 100000).toFixed(1)}L** | 10-Year Value: **₹${(roi.scenarios[1].valueAfter10Y / 100000).toFixed(1)}L**
- **Aggressive (14% CAGR)**: 5-Year Value: **₹${(roi.scenarios[2].valueAfter5Y / 100000).toFixed(1)}L** | 10-Year Value: **₹${(roi.scenarios[2].valueAfter10Y / 100000).toFixed(1)}L**

#### 3. Buy vs Rent Verdict:
- **Recommendation**: **${roi.buyVsRent.recommendation}**
- **Verdict**: ${roi.buyVsRent.verdictSummary}`;

      callbacks.onChunk(reply);
      return reply;
    }

    // 4. Property Search & Filter Intent (e.g. "Show 3BHK in Gachibowli under 1 crore")
    const act = addActivity('Executing database query & applying live map filters...');
    let bhk = undefined;
    if (q.includes('1 bhk') || q.includes('1bhk')) bhk = 1;
    if (q.includes('2 bhk') || q.includes('2bhk')) bhk = 2;
    if (q.includes('3 bhk') || q.includes('3bhk')) bhk = 3;
    if (q.includes('4 bhk') || q.includes('4bhk')) bhk = 4;

    const filterAction: AgentMapAction = {
      actionId: `action-${Date.now()}`,
      tool: 'apply_map_filters',
      args: { bhk, type: q.includes('rent') ? 'rent' : 'sale' },
      status: 'executing',
      timestamp: Date.now()
    };
    executedActions.push(filterAction);
    await mapActionBridge.executeAction(filterAction);

    // Resolve locality based on user text, or current map viewport locality
    const targetLocName = _mapContext.currentLocality || 'Gachibowli';
    const loc = resolveLocality(q) || resolveLocality(targetLocName) || resolveLocality('gachibowli')!;

    const moveAction: AgentMapAction = {
      actionId: `action-${Date.now()}-mv`,
      tool: 'move_map',
      args: { lat: loc.coordinates[1], lng: loc.coordinates[0], zoom: 14 },
      status: 'executing',
      timestamp: Date.now()
    };
    executedActions.push(moveAction);
    await mapActionBridge.executeAction(moveAction);

    // Query actual matching properties from database
    const all = getAllProperties();
    let matching = all.filter((p) => {
      const matchCity = p.city.toLowerCase() === loc.city.toLowerCase() || p.area.toLowerCase() === loc.name.toLowerCase();
      const matchBhk = bhk ? p.bhk === bhk : true;
      const matchType = q.includes('rent') ? p.type === 'rent' : p.type === 'sale';
      return matchCity && matchBhk && matchType;
    });

    if (matching.length === 0) {
      // Relax city constraint to return available listings
      matching = all.filter((p) => (bhk ? p.bhk === bhk : true));
    }

    if (matching.length > 0) {
      const highlightAction: AgentMapAction = {
        actionId: `action-${Date.now()}-hl`,
        tool: 'highlight_properties',
        args: { propertyIds: matching.map((p) => p.id) },
        status: 'executing',
        timestamp: Date.now()
      };
      executedActions.push(highlightAction);
      await mapActionBridge.executeAction(highlightAction);

      // Add property action cards to the drawer
      matching.slice(0, 3).forEach((p) => {
        cards.push({
          id: `card-${p.id}`,
          type: 'property_shortlist',
          title: p.title,
          subtitle: `${p.priceDisplay} • ${p.bhk} BHK • ${p.area}, ${p.city}`,
          badge: p.readyToMove ? 'Ready to Move' : 'Verified',
          data: { property: p }
        });
      });
    }

    completeActivity(act);

    const listingsText = matching.length > 0
      ? matching.slice(0, 4).map((p) => `- **${p.title}** (${p.bhk} BHK, ${p.areaSqFt} sq.ft) — **${p.priceDisplay}** in ${p.area}, ${p.city}`).join('\n')
      : `Currently no active listings match "${bhk ? `${bhk} BHK ` : ''}${loc.name}". You can click "+ Add Property" on the map to add one instantly!`;

    const reply = `I have navigated your map to **${loc.name}, ${loc.city}** and highlighted matching listings in the area:

${listingsText}

**Locality Benchmark:**
- **Overall Score**: **${loc.scores.overallScore}/100**
- **Avg Price**: **₹${loc.avgPricePerSqFt.toLocaleString('en-IN')}/sq.ft** (${loc.appreciationLabel})
- **Gross Rental Yield**: **${loc.rentalYieldPercent}%**

You can click any highlighted pin directly on the map or click the card above to inspect full photos, EMI breakdown, and live Gemini risk audit!`;

    callbacks.onChunk(reply);
    return reply;
  }
}

export const aiAgentService = new AIAgentService();
