import React, { useState, useEffect, useRef } from 'react';
import {
  Property,
  MapContextSnapshot,
  AgentMessage,
  AgentActivityStep,
  AgentActionCard
} from '../../types';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  ChevronRight,
  Check,
  Building,
  Compass,
  Calculator,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { aiAgentService } from '../../services/aiAgentService';
import { agentMemoryService } from '../../services/agentMemoryService';
import { mapActionBridge } from '../../services/mapActionBridge';
import { FormattedMessageContent } from './FormattedMessageContent';
import { Logo } from '../Common/Logo';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mapContext: MapContextSnapshot;
  onSelectProperty: (property: Property) => void;
  onOpenRoiCalculator?: (property?: Property) => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  mapContext,
  onSelectProperty,
  onOpenRoiCalculator
}) => {
  const [messages, setMessages] = useState<AgentMessage[]>(() => {
    return agentMemoryService.getSession().messages;
  });
  const [inputQuestion, setInputQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveActivities, setLiveActivities] = useState<AgentActivityStep[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastPersonalizedPropIdRef = useRef<string | null>(null);

  const selectedProp = mapContext.selectedProperty;

  // Auto-scroll when messages or live activities update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, liveActivities]);

  // Auto-personalize chat when a user clicks on a property tag and opens AI chat
  useEffect(() => {
    if (!isOpen || !selectedProp) return;

    if (lastPersonalizedPropIdRef.current !== selectedProp.id) {
      lastPersonalizedPropIdRef.current = selectedProp.id;

      const personalizedGreeting: AgentMessage = {
        id: `agent-prop-${selectedProp.id}-${Date.now()}`,
        sender: 'agent',
        content: `Hi there! Looking into **${selectedProp.title}** in ${selectedProp.area}, ${selectedProp.city}?\n\nIt's listed at **${selectedProp.priceDisplay}** (${selectedProp.areaSqFt} sq.ft, ${selectedProp.bhk > 0 ? `${selectedProp.bhk} BHK, ` : ''}${selectedProp.facing || 'East'} facing). As your dedicated property advisor, I can help you with genuine seller negotiations, rental yield, or scheduling a site visit right away. What would you like to know?`,
        timestamp: 'Just now'
      };

      setMessages((prev) => {
        // Prevent duplicate consecutive greetings for the same property
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.content.includes(selectedProp.title)) {
          return prev;
        }
        return [...prev, personalizedGreeting];
      });
    }
  }, [isOpen, selectedProp]);

  if (!isOpen) return null;

  const handleSend = async (userPrompt: string) => {
    if (!userPrompt.trim() || isProcessing) return;

    const query = userPrompt.trim();
    setInputQuestion('');
    setIsProcessing(true);
    setLiveActivities([]);

    const tempUserMsg: AgentMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: 'Just now'
    };

    const streamingAgentMsgId = `agent-stream-${Date.now()}`;
    const tempAgentMsg: AgentMessage = {
      id: streamingAgentMsgId,
      sender: 'agent',
      content: '',
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAgentMsg]);

    const activeActivities: AgentActivityStep[] = [];
    const activeCards: AgentActionCard[] = [];

    try {
      const agentMsg = await aiAgentService.sendMessage(query, mapContext, {
        onActivity: (act) => {
          setLiveActivities((prev) => {
            const existingIdx = prev.findIndex((a) => a.id === act.id);
            if (existingIdx >= 0) {
              const updated = [...prev];
              updated[existingIdx] = act;
              return updated;
            }
            return [...prev, act];
          });
          activeActivities.push(act);
        },
        onCard: (card) => {
          activeCards.push(card);
        },
        onChunk: (progressiveText) => {
          // Stream progressive tokens live into the active message
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingAgentMsgId
                ? { ...m, content: progressiveText }
                : m
            )
          );
        }
      });

      // Finalize with complete message payload (cards, actions, timestamps)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingAgentMsgId
            ? { ...agentMsg, id: streamingAgentMsgId }
            : m
        )
      );
    } catch (e: any) {
      const errMsg = `I ran into an issue connecting to the advisory server. Please try again!`;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingAgentMsgId
            ? { ...m, content: errMsg }
            : m
        )
      );
    } finally {
      setIsProcessing(false);
      setLiveActivities([]);
    }
  };

  const handleClearChat = () => {
    agentMemoryService.clearHistory();
    setMessages(agentMemoryService.getSession().messages);
    lastPersonalizedPropIdRef.current = null;
  };

  const handleCardAction = (card: AgentActionCard) => {
    if (card.type === 'investment_roi' && onOpenRoiCalculator) {
      onOpenRoiCalculator(selectedProp || undefined);
    } else if (card.type === 'property_shortlist') {
      const targetProp = Array.isArray(card.data) ? card.data[0] : (card.data?.properties?.[0] || card.data?.property);
      if (targetProp) {
        onSelectProperty(targetProp);
      }
    } else if (card.data?.property) {
      onSelectProperty(card.data.property);
    } else if (card.type === 'map_navigation' && card.data?.coordinates) {
      mapActionBridge.executeAction({
        actionId: `action-${Date.now()}`,
        tool: 'move_map',
        args: { lat: card.data.coordinates[1], lng: card.data.coordinates[0], zoom: 15 },
        status: 'executing',
        timestamp: Date.now()
      });
    }
  };

  const dynamicChips = selectedProp ? [
    `Is ${selectedProp.priceDisplay} price negotiable?`,
    `Schedule site visit with owner`,
    `Expected rental yield & ROI`,
    `Nearby metro, schools & hospitals`,
    `Water & flood risk check`
  ] : [
    'Show 3 BHK in Financial District under ₹1.8 Cr',
    'Evaluate 10-Yr ROI on ₹85L Property',
    'Find high rental yield properties in Bengaluru',
    'Compare Gachibowli vs Kondapur micro-markets'
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Main Drawer Container - Full Light Theme */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200/90 animate-in slide-in-from-right duration-200">
        
        {/* Header Bar - Light Themed, Professional & Modern */}
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-white text-slate-800 flex-shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900">
                  MapEstate AI Advisor
                </h3>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Advisor
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Personal real estate consultant & verified property advisor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClearChat}
              title="Reset Conversation"
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selected Property Context Card (Displayed when a property tag was clicked) */}
        {selectedProp ? (
          <div className="p-3 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/80 border-b border-blue-100 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={selectedProp.images[0]}
                alt={selectedProp.title}
                className="w-11 h-11 rounded-xl object-cover border border-blue-200/80 flex-shrink-0 shadow-2xs"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded uppercase">
                    Personalized Property
                  </span>
                  {selectedProp.verified && (
                    <span title="Verified Listing" className="flex items-center">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {selectedProp.title}
                </div>
                <div className="text-[11px] text-slate-600 font-semibold flex items-center gap-1.5">
                  <span className="text-blue-700 font-extrabold">{selectedProp.priceDisplay}</span>
                  <span>&bull;</span>
                  <span>{selectedProp.bhk > 0 ? `${selectedProp.bhk} BHK` : 'Studio'}</span>
                  <span>&bull;</span>
                  <span className="truncate">{selectedProp.area}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectProperty(selectedProp)}
              className="px-2.5 py-1.5 bg-white hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-[10px] font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 flex-shrink-0"
              title="Focus on Map"
            >
              <MapPin className="w-3 h-3" />
              <span>Focus</span>
            </button>
          </div>
        ) : (
          /* General Live Viewport Strip */
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Viewport: <strong>Zoom {mapContext.zoom}</strong></span>
              <span className="text-slate-300">&bull;</span>
              <span><strong>{mapContext.visiblePropertiesCount}</strong> listings</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {mapContext.currentLocality || 'Discover Area'}
            </span>
          </div>
        )}

        {/* Messages Scroll Area - Clean Light Theme */}
        <div ref={scrollRef} className="p-4 flex-1 overflow-y-auto space-y-3.5 text-xs bg-slate-50/40">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] p-3.5 sm:p-4 rounded-2xl leading-relaxed shadow-2xs ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white font-medium rounded-tr-xs'
                    : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/90 shadow-2xs'
                }`}
              >
                {/* Advisor Brand Identifier for Agent Responses */}
                {m.sender === 'agent' && (
                  <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-100 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Property Advisor</span>
                  </div>
                )}

                {/* Content */}
                {m.sender === 'user' ? (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                ) : (
                  <div>
                    {m.content ? (
                      <FormattedMessageContent content={m.content} />
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400 py-1 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                        <span className="text-[11px] ml-1">Drafting advice...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Cards attached to message */}
                {m.cards && m.cards.length > 0 && (
                  <div className="mt-3 space-y-2 pt-2.5 border-t border-slate-100">
                    {m.cards.map((card) => {
                      const isShortlist = card.type === 'property_shortlist';
                      const isROI = card.type === 'investment_roi';
                      const isNav = card.type === 'map_navigation';

                      return (
                        <div
                          key={card.id}
                          onClick={() => handleCardAction(card)}
                          className="p-3 bg-slate-50/70 hover:bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                              {isShortlist && <Building className="w-3 h-3 text-blue-600" />}
                              {isROI && <Calculator className="w-3 h-3 text-emerald-600" />}
                              {isNav && <Compass className="w-3 h-3 text-indigo-600" />}
                              <span>{card.badge || 'Advisor Action'}</span>
                            </span>
                            <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                              <span>Open</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-1">{card.title}</div>
                          {card.subtitle && (
                            <div className="text-[11px] text-slate-500 mt-0.5">{card.subtitle}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <span className="text-[9px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}

          {/* Live Agent Investigating Box */}
          {isProcessing && (
            <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                <span>Checking verified details...</span>
              </div>
              <div className="space-y-1 pl-6">
                {liveActivities.map((act) => (
                  <div key={act.id} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                    {act.status === 'completed' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                    )}
                    <span>{act.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Suggested Prompt Chips - Dynamic & Context Aware */}
        <div className="p-3 border-t border-slate-100 bg-white flex-shrink-0">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>{selectedProp ? 'Quick Property Questions' : 'Suggested Inquiries'}</span>
            <span className="text-[9px] font-normal text-slate-400">Tap to ask</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {dynamicChips.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isProcessing}
                className="text-[11px] font-semibold bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200/90 text-slate-700 px-3 py-1 rounded-full transition-all active:scale-95 disabled:opacity-50 shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar - Clean Light Theme */}
        <div className="p-3 border-t border-slate-200/90 bg-white flex items-center gap-2 flex-shrink-0">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend(inputQuestion);
            }}
            placeholder={
              selectedProp
                ? `Ask about ${selectedProp.title} (price, visit, amenities)...`
                : "Ask anything about properties, ROI, or localities..."
            }
            className="flex-1 h-10 px-3.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
          <button
            onClick={() => handleSend(inputQuestion)}
            disabled={!inputQuestion.trim() || isProcessing}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shadow-xs flex-shrink-0 active:scale-95"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
};

export default AIAssistantDrawer;
