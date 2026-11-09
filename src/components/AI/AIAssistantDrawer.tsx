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
  Calculator
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

  // Auto-scroll when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, liveActivities]);

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
    setMessages((prev) => [...prev, tempUserMsg]);

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
        onChunk: () => {}
      });

      setMessages((prev) => [...prev, agentMsg]);
    } catch (e: any) {
      const errMsg: AgentMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        content: `Error during agent execution: ${e.message || 'Please check connection.'}`,
        timestamp: 'Just now'
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsProcessing(false);
      setLiveActivities([]);
    }
  };

  const handleClearChat = () => {
    agentMemoryService.clearHistory();
    setMessages(agentMemoryService.getSession().messages);
  };

  const handleCardAction = (card: AgentActionCard) => {
    if (card.type === 'investment_roi' && onOpenRoiCalculator) {
      onOpenRoiCalculator();
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

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200 select-none">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-blue-950 text-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div className="h-6 w-px bg-slate-700/60" />
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-xs tracking-tight text-white uppercase">Intelligence Agent</h3>
              <span className="text-[9px] font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 px-1.5 py-0.5 rounded uppercase flex items-center gap-1 shadow-xs">
                <span className="w-1 h-1 rounded-full bg-slate-950 animate-ping" />
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-300">Autonomous Real Estate & Geospatial Advisory</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClearChat}
            title="Reset Conversation"
            className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Live Map Context Badge Strip */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-600 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Viewport: <strong>Zoom {mapContext.zoom}</strong></span>
          <span className="text-slate-300">&bull;</span>
          <span><strong>{mapContext.visiblePropertiesCount}</strong> listings</span>
        </div>

        {mapContext.selectedProperty && (
          <span className="truncate max-w-[170px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
            {mapContext.selectedProperty.title}
          </span>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[94%] p-4 rounded-2xl leading-relaxed shadow-2xs ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white font-medium rounded-tr-sm'
                  : 'bg-slate-50 text-slate-800 rounded-tl-sm border border-slate-200/90'
              }`}
            >
              {/* Consultant Brand Identifier for Agent Responses */}
              {m.sender === 'agent' && (
                <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-200/60 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Real Estate Advisory Analysis</span>
                </div>
              )}

              {/* Clean Structured Content */}
              {m.sender === 'user' ? (
                <div className="whitespace-pre-wrap">{m.content}</div>
              ) : (
                <FormattedMessageContent content={m.content} />
              )}

              {/* Action Cards attached to message */}
              {m.cards && m.cards.length > 0 && (
                <div className="mt-3.5 space-y-2 pt-3 border-t border-slate-200">
                  {m.cards.map((card) => {
                    const isShortlist = card.type === 'property_shortlist';
                    const isROI = card.type === 'investment_roi';
                    const isNav = card.type === 'map_navigation';

                    return (
                      <div
                        key={card.id}
                        onClick={() => handleCardAction(card)}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                            {isShortlist && <Building className="w-3 h-3 text-blue-600" />}
                            {isROI && <Calculator className="w-3 h-3 text-emerald-600" />}
                            {isNav && <Compass className="w-3 h-3 text-indigo-600" />}
                            <span>{card.badge || 'Agent Action'}</span>
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

        {/* Live Agent Working Activities */}
        {isProcessing && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
              <span>AI Agent Investigating & Operating Map...</span>
            </div>
            <div className="space-y-1.5 pl-6">
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

      {/* Suggested Autonomous Prompt Chips */}
      <div className="p-3 border-t border-slate-100 bg-slate-50 flex-shrink-0">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Consultant Actions
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            'Show 3 BHK in Financial District under ₹1.8 Cr',
            'Evaluate 10-Yr ROI on ₹85L Property',
            'Find high rental yield properties in Bengaluru',
            'Compare Gachibowli vs Kondapur micro-markets'
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={isProcessing}
              className="text-[11px] font-semibold bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors active:scale-95 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Field */}
      <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 flex-shrink-0">
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend(inputQuestion);
          }}
          placeholder="Ask AI to search properties, analyze ROI, or inspect..."
          className="flex-1 h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
        />
        <button
          onClick={() => handleSend(inputQuestion)}
          disabled={!inputQuestion.trim() || isProcessing}
          className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shadow-xs flex-shrink-0 active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
    </>
  );
};

export default AIAssistantDrawer;
