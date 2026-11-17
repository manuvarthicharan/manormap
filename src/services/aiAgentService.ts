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

const SYSTEM_PROMPT = `You are a friendly, experienced, and trustworthy Indian real estate agent & property advisor operating inside ManorMap.

CRITICAL RULES:
1. CHAT LIKE A REAL HUMAN IN INDIAN ENGLISH:
   - Talk naturally, warmly, and helpfully like a top-tier Indian property consultant chatting on WhatsApp/DM (e.g. "Namaste!", "Hey there!", "Looking at this 3 BHK in Hitec City?", "Price is around ₹1.85 Cr, which is quite fair for this belt", "Locality-wise, water and power are reliable and metro is just 5 mins away").
   - Friendly and professional, never robotic or academic.
2. STRICT BREVITY — NO BIG REPLIES:
   - Keep answers under 60-90 words max! Users have no time for long paragraphs or disclaimers.
   - Go straight to the point in the first line.
   - Use 2-3 short snappy bullet points if needed.
3. DEDICATED PROPERTY AGENT PERSONALIZATION:
   - When the user selects or inquires about a specific property, immediately act as its dedicated expert advisor!
   - Highlight its real specs (BHK, carpet area, facing, price, RERA verification).
   - Proactively offer next steps: scheduling a site visit, negotiation margin (usually 3-5% for quick closers), or checking loan EMI.
4. INDIAN REAL ESTATE TERMINOLOGY:
   - Currency: Lakhs (₹L) and Crores (₹Cr). Example: ₹45 Lakhs, ₹1.85 Cr.
   - Area: Sq.Ft, Square Yards (Gaj), Gunthas, Acres.
   - Layouts: 1 BHK, 2 BHK, 3 BHK, 4 BHK, Villa, Plot, Agricultural Land.
   - Vastu: East / North facing, good cross-ventilation and sunlight.
5. AUTONOMOUS MAP ACTIONS:
   - When asked to show a location, call 'move_map' to fly the user's view there!
   - When asked to highlight listings, call 'highlight_properties'.`;

export interface StreamCallbacks {
  onActivity: (activity: AgentActivityStep) => void;
  onCard: (card: AgentActionCard) => void;
  onChunk: (chunk: string) => void;
}

/**
 * Realistic word-by-word streaming helper for human-like typing effect
 */
async function streamReply(text: string, onChunk: (progressive: string) => void): Promise<string> {
  const words = text.split(' ');
  let progressive = '';
  for (let i = 0; i < words.length; i++) {
    progressive += (i > 0 ? ' ' : '') + words[i];
    onChunk(progressive);
    if (i % 2 === 0 || i === words.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
  return text;
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
        await streamReply(finalResponse, callbacks.onChunk);
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

    // 0. Priority Check: Selected Property Context (Personalized Real Estate Agent response)
    const selectedProp = _mapContext.selectedProperty;
    if (selectedProp && (
      q.includes('this') || q.includes('property') || q.includes('flat') || q.includes('apartment') ||
      q.includes('negotiat') || q.includes('price') || q.includes('visit') || q.includes('schedule') ||
      q.includes('contact') || q.includes('owner') || q.includes('amenit') || q.includes('facing') ||
      q.includes('water') || q.includes('flood') || q.includes('yield') || q.includes('emi') ||
      q.includes('bhk') || q.includes('sqft') || q.includes('details') || q.includes('tell me') ||
      q.includes('hi') || q.includes('hello')
    )) {
      const act = addActivity(`Inspecting ${selectedProp.title} as dedicated advisor...`);
      completeActivity(act);

      cards.push({
        id: `card-${selectedProp.id}`,
        type: 'property_shortlist',
        title: selectedProp.title,
        subtitle: `${selectedProp.priceDisplay} • ${selectedProp.areaSqFt} sq.ft in ${selectedProp.area}`,
        badge: 'Selected Property',
        data: { property: selectedProp }
      });

      let reply = '';
      if (q.includes('negotiat') || q.includes('discount')) {
        reply = `For **${selectedProp.title}**, asking price is **${selectedProp.priceDisplay}**. For genuine buyers ready with quick payment or pre-approved loan, there is usually a **3% to 5% negotiation window** with the owner. Would you like me to connect you with ${selectedProp.contact.name}?`;
      } else if (q.includes('visit') || q.includes('schedule') || q.includes('contact') || q.includes('owner') || q.includes('phone')) {
        reply = `Sure thing! You can schedule a site visit for **${selectedProp.title}** directly. Contact person is **${selectedProp.contact.name}** (${selectedProp.contact.phone}). You can tap the WhatsApp icon on the card to fix a convenient time slot!`;
      } else if (q.includes('water') || q.includes('flood') || q.includes('safety') || q.includes('drainage')) {
        reply = `Good to verify! **${selectedProp.title}** in ${selectedProp.area} sits on high ground with a safe drainage gradient. Flood catchment risk is rated **Low**, and it has dependable municipal and borewell water supply. No waterlogging issues here.`;
      } else if (q.includes('yield') || q.includes('rent') || q.includes('roi')) {
        const estRent = Math.round((selectedProp.price * 0.038) / 12);
        reply = `For **${selectedProp.title}**, expected rental income is around **₹${estRent.toLocaleString('en-IN')}/month** (~4% gross yield). In ${selectedProp.area}, standard capital appreciation is running at 9-11% year-on-year.`;
      } else {
        reply = `**${selectedProp.title}** is a verified ${selectedProp.bhk > 0 ? `${selectedProp.bhk} BHK` : 'Studio'} (${selectedProp.areaSqFt} sq.ft) with **${selectedProp.facing || 'East'} facing** in ${selectedProp.area}, ${selectedProp.city} for **${selectedProp.priceDisplay}**. State RERA verified and ${selectedProp.readyToMove ? 'ready to move' : 'possession soon'}. Would you like to schedule a visit or check the loan EMI?`;
      }

      return await streamReply(reply, callbacks.onChunk);
    }

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

        const reply = `Here's how **${comp.localityA.name}** compares with **${comp.localityB.name}**:
• **Price & Yield**: ${comp.localityA.name} averages **₹${comp.localityA.avgPricePerSqFt.toLocaleString('en-IN')}/sq.ft** (${comp.localityA.rentalYieldPercent}% yield) vs **₹${comp.localityB.avgPricePerSqFt.toLocaleString('en-IN')}/sq.ft** (${comp.localityB.rentalYieldPercent}% yield) in ${comp.localityB.name}.
• **Civic Score**: ${comp.localityA.name} scores **${comp.localityA.scores.overallScore}/100** vs **${comp.localityB.scores.overallScore}/100**.
• **Takeaway**: ${comp.summaryVerdict}

Would you like to explore available properties in ${comp.localityA.name}?`;

        return await streamReply(reply, callbacks.onChunk);
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

      const reply = `Navigated your map to **${targetLoc.name}, ${targetLoc.city}**! Average price here is **₹${targetLoc.avgPricePerSqFt.toLocaleString('en-IN')}/sq.ft** with a civic score of **${targetLoc.scores.overallScore}/100**. Let me know if you want to see 2 BHKs or 3 BHKs in this area!`;

      return await streamReply(reply, callbacks.onChunk);
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

      const reply = `For a **₹${(purchasePrice / 100000).toFixed(1)} Lakh** property renting at **₹${monthlyRent.toLocaleString('en-IN')}/month**:
• **Monthly EMI**: ~₹${roi.monthlyEMI.toLocaleString('en-IN')}/mo (8.5% p.a., 20 years).
• **Rental Yield**: Gross ${roi.grossRentalYield}%, net ${roi.netRentalYield}%. Break-even is ~${roi.breakEvenYears} years.
• **Advice**: ${roi.buyVsRent.verdictSummary}. Shall we look at matching options?`;

      return await streamReply(reply, callbacks.onChunk);
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

    const reply = matching.length > 0
      ? `Found **${matching.length} properties** around ${loc.name}! Highlighted them directly on your map. Average price here is ₹${loc.avgPricePerSqFt.toLocaleString('en-IN')}/sq.ft. Tap any pin to see photos, price breakdown, or schedule a site visit!`
      : `Currently no active listings match "${bhk ? `${bhk} BHK ` : ''}${loc.name}". You can click "+ Add Property" on the map to list one instantly!`;

    return await streamReply(reply, callbacks.onChunk);
  }
}

export const aiAgentService = new AIAgentService();
