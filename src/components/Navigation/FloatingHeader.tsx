import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Menu,
  Search,
  X,
  MapPin,
  Building2,
  SlidersHorizontal,
  Plus,
  TrendingUp,
  Sparkles,
  Scale,
  Tag,
  ArrowRight,
  Compass,
  CornerDownLeft,
  Loader2,
  Check,
  Mic,
  Ruler,
  CreditCard
} from 'lucide-react';
import { searchLocations } from '../../services/geocoding';
import { SearchResult, FilterState, Property, PropertyCategory, AreaUnit } from '../../types';
import { getUserProfile } from '../../services/userService';
import { parseNaturalLanguageQuery } from '../../services/aiIntelligenceService';
import { formatIndianCurrency } from '../../services/propertyService';
import { notificationService } from '../../services/notificationService';
import { Logo } from '../Common/Logo';

interface FloatingHeaderProps {
  onOpenMenu: () => void;
  onOpenProfile: () => void;
  onOpenAddProperty: () => void;
  onSelectLocation: (result: SearchResult) => void;
  properties?: Property[];
  onSelectProperty?: (property: Property) => void;
  filterState: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onOpenAdvancedFilters: () => void;
  comparedCount?: number;
  onOpenCompare?: () => void;
  onOpenAIAdvisor?: () => void;
  activeMapTypeId?: string;
  areaUnit?: AreaUnit;
  onAreaUnitChange?: (unit: AreaUnit) => void;
  onOpenPricing?: () => void;
}

const TRENDING_HUBS = [
  {
    title: 'Hitec City, Hyderabad',
    subTitle: 'Cyberabad IT Corridor',
    priceTrend: 'Avg ₹8,400/sqft (+14.2% YoY)',
    coords: [78.3820, 17.4474] as [number, number]
  },
  {
    title: 'Kokapet, Hyderabad',
    subTitle: 'Neopolis & Golden Mile',
    priceTrend: 'Avg ₹11,200/sqft (+19.8% YoY)',
    coords: [78.3245, 17.3980] as [number, number]
  },
  {
    title: 'Indiranagar, Bengaluru',
    subTitle: '100ft Road & Defence Colony',
    priceTrend: 'Avg ₹15,800/sqft (+11.8% YoY)',
    coords: [77.6412, 12.9784] as [number, number]
  },
  {
    title: 'Bandra West, Mumbai',
    subTitle: 'Carter Road & Pali Hill',
    priceTrend: 'Avg ₹52,000/sqft (+9.4% YoY)',
    coords: [72.8295, 19.0596] as [number, number]
  },
  {
    title: 'Golf Course Road, Gurgaon',
    subTitle: 'DLF Phase 5, Delhi-NCR',
    priceTrend: 'Avg ₹28,500/sqft (+16.5% YoY)',
    coords: [77.1052, 28.4595] as [number, number]
  },
  {
    title: 'Whitefield, Bengaluru',
    subTitle: 'ITPL & Outer Ring Road',
    priceTrend: 'Avg ₹9,600/sqft (+12.4% YoY)',
    coords: [77.7500, 12.9698] as [number, number]
  }
];

const EXPLORE_CATEGORIES: { label: string; value: PropertyCategory; icon: string }[] = [
  { label: 'Villas', value: 'Villa', icon: '🏡' },
  { label: 'Apartments', value: 'Apartment', icon: '🏢' },
  { label: 'Agri Land', value: 'Agricultural Land', icon: '🌾' },
  { label: 'Plots', value: 'Plot', icon: '📐' },
  { label: 'Commercial', value: 'Commercial', icon: '🌆' }
];

export const FloatingHeader: React.FC<FloatingHeaderProps> = ({
  onOpenMenu,
  onOpenProfile,
  onOpenAddProperty,
  onSelectLocation,
  properties = [],
  onSelectProperty,
  filterState,
  onFilterChange,
  onOpenAdvancedFilters,
  comparedCount = 0,
  onOpenCompare,
  onOpenAIAdvisor,
  activeMapTypeId = 'hybrid',
  areaUnit = 'sqft',
  onAreaUnitChange,
  onOpenPricing
}) => {
  const isDarkMap = activeMapTypeId === 'hybrid' || activeMapTypeId === 'satellite';
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [aiFeedbackMessage, setAiFeedbackMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<any>(null);
  const userProfile = getUserProfile();

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Web Speech API Voice Search with mic verification & live real-time speech feedback
  const handleToggleVoiceSearch = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      notificationService.addNotification({
        title: 'Voice Search Unsupported',
        message: 'Your current browser does not support the Web Speech API. Please use Google Chrome or Microsoft Edge.',
        type: 'system'
      });
      return;
    }

    if (isListening) {
      try {
        speechRecognitionRef.current?.stop();
      } catch (_) { }
      setIsListening(false);
      return;
    }

    // Proactively verify / prompt microphone permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (permErr: any) {
        if (permErr?.name === 'NotAllowedError' || permErr?.name === 'PermissionDeniedError') {
          notificationService.addNotification({
            title: 'Microphone Permission Needed',
            message: 'Please allow microphone access in your browser address bar to use voice search.',
            type: 'system'
          });
          return;
        }
      }
    }

    try {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.abort(); } catch (_) { }
      }

      const recognition = new SpeechRecognition();
      speechRecognitionRef.current = recognition;
      recognition.lang = 'en-IN'; // Indian English recognition
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setShowDropdown(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        if (currentTranscript) {
          setQuery(currentTranscript);
        }

        if (isFinal && currentTranscript.trim()) {
          setIsListening(false);
          const finalQ = currentTranscript.trim();
          setTimeout(() => {
            handleExecuteAISearch(finalQ);
          }, 350);
        }
      };

      recognition.onerror = (e: any) => {
        setIsListening(false);
        if (e.error === 'not-allowed') {
          notificationService.addNotification({
            title: 'Microphone Blocked',
            message: 'Please allow microphone permission in your browser address bar to use voice search.',
            type: 'system'
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Voice recognition startup error:', err);
      setIsListening(false);
    }
  };

  // Keyboard shortcut listener: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowDropdown(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-time matching properties from active database
  const matchingProperties = useMemo(() => {
    if (!query.trim() || query.trim().length < 2 || !properties.length) return [];
    const q = query.trim().toLowerCase();
    return properties
      .filter((p) => {
        const areaName = (p.area || '').toLowerCase();
        const cityName = (p.city || '').toLowerCase();
        const contactName = (p.contact?.name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        return (
          title.includes(q) ||
          areaName.includes(q) ||
          cityName.includes(q) ||
          contactName.includes(q) ||
          cat.includes(q)
        );
      })
      .slice(0, 4);
  }, [query, properties]);

  // Debounced search for locations via Google Geocoder + pre-indexed database
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(query);
        setSuggestions(results);
      } catch (e) {
        console.error('Location search error', e);
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside search dismisses dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle location selection
  const handleSelectLocation = (item: SearchResult) => {
    setQuery(item.title);
    setShowDropdown(false);
    onSelectLocation(item);
  };

  // Handle direct property selection from search
  const handleSelectMatchingProperty = (prop: Property) => {
    setQuery(prop.title);
    setShowDropdown(false);
    if (onSelectProperty) {
      onSelectProperty(prop);
    } else {
      onSelectLocation({
        id: prop.id,
        title: prop.title,
        subTitle: `${prop.area || prop.address}, ${prop.city}`,
        coordinates: prop.coordinates,
        type: 'address'
      });
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    setAiFeedbackMessage(null);
    inputRef.current?.focus();
  };

  // AI Natural Language Search Execution (with optional voice/custom query)
  const handleExecuteAISearch = async (customQuery?: string) => {
    const qToUse = customQuery !== undefined ? customQuery : query;
    if (!qToUse.trim()) return;

    const parsed = parseNaturalLanguageQuery(qToUse);
    const updatedFilters = { ...filterState, ...parsed.filters };
    onFilterChange(updatedFilters);

    setAiFeedbackMessage(parsed.summary);
    setTimeout(() => setAiFeedbackMessage(null), 4500);

    // If locality detected, pan to it
    if (parsed.localityQuery) {
      try {
        const results = await searchLocations(parsed.localityQuery);
        if (results && results.length > 0) {
          onSelectLocation(results[0]);
        }
      } catch (e) {
        console.error('Locality pan failed', e);
      }
    }

    setShowDropdown(false);
  };

  // Keyboard navigation within suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalSelectable = matchingProperties.length + suggestions.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showDropdown) setShowDropdown(true);
      setHighlightedIndex((prev) => (prev + 1 < totalSelectable ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalSelectable - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        if (highlightedIndex < matchingProperties.length) {
          handleSelectMatchingProperty(matchingProperties[highlightedIndex]);
        } else {
          const locIdx = highlightedIndex - matchingProperties.length;
          if (suggestions[locIdx]) {
            handleSelectLocation(suggestions[locIdx]);
          }
        }
      } else {
        handleExecuteAISearch();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Count active filters
  const activeFilterCount = [
    filterState.type && filterState.type !== 'all',
    filterState.category && filterState.category !== 'all',
    filterState.bhk && filterState.bhk !== 'all',
    filterState.minPrice !== undefined,
    filterState.maxPrice !== undefined,
    filterState.minArea !== undefined,
    filterState.maxArea !== undefined,
    filterState.furnishing && filterState.furnishing !== 'all',
    filterState.readyToMove,
    filterState.verifiedOnly,
    filterState.facing && filterState.facing !== 'all'
  ].filter(Boolean).length;

  return (
    <>
      {/* 
        1. TOP-LEFT SAAS SEARCH COMMAND BAR 
        Clean, bounded width on desktop so it never stretches across the whole screen.
        Dynamic theme adapts automatically to dark (hybrid/satellite) vs light (roadmap/terrain) background.
      */}
      <div
        ref={searchContainerRef}
        className="fixed top-3 left-3 right-3 sm:top-4 sm:left-6 sm:right-auto sm:w-[380px] md:w-[440px] lg:w-[480px] z-30 pointer-events-auto transition-all"
      >
        <div className={`flex items-center gap-1.5 sm:gap-2 rounded-2xl shadow-xl transition-all focus-within:ring-2 focus-within:ring-blue-500/30 ${isDarkMap
          ? 'bg-slate-950 border border-slate-700 shadow-black/50 text-white focus-within:border-blue-500'
          : 'bg-white border border-slate-200 shadow-slate-900/10 text-slate-900 focus-within:border-blue-500'
          } p-1.5 sm:p-2`}>

          {/* Logo & Navigation Menu Button */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onOpenMenu}
              title="Open Navigation Menu"
              className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all active:scale-95 flex-shrink-0 ${isDarkMap
                ? 'text-slate-200 hover:text-white hover:bg-slate-800/80'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* MapEstate Brand Logo */}
            <div
              onClick={onOpenMenu}
              className={`flex items-center pr-1.5 sm:pr-2 border-r cursor-pointer select-none group flex-shrink-0 ${isDarkMap ? 'border-slate-800' : 'border-slate-200/80'
                }`}
              title="MapEstate Menu"
            >
              <div className="sm:hidden">
                <Logo size="xs" />
              </div>
              <div className="hidden sm:block">
                <Logo size="sm" />
              </div>
            </div>
          </div>

          {/* Omnisearch Hero Input Field */}
          <div className="relative flex-1 flex items-center min-w-0">
            <Search className={`w-4 h-4 ml-1 mr-1.5 pointer-events-none flex-shrink-0 transition-colors ${query ? 'text-blue-500' : (isDarkMap ? 'text-slate-400' : 'text-slate-400')
              }`} />

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
                setHighlightedIndex(-1);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search locality, project, or PIN..."
              className={`w-full bg-transparent text-xs sm:text-sm focus:outline-none pr-7 py-1 font-medium truncate ${isDarkMap
                ? 'text-white placeholder-slate-400'
                : 'text-slate-900 placeholder-slate-400'
                }`}
              autoComplete="off"
              spellCheck="false"
            />

            {/* Voice Search (Web Speech API with Indian Shorthand Recognition) */}
            <button
              type="button"
              onClick={handleToggleVoiceSearch}
              className={`p-1 mr-1 rounded-lg transition-all flex items-center justify-center ${isListening
                ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-400'
                : isDarkMap
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
                }`}
              title={isListening ? 'Listening (Speak now in Indian English)...' : 'Search by Voice'}
            >
              <Mic className="w-3.5 h-3.5" />
            </button>

            {/* Clear Button */}
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className={`absolute right-0.5 p-1 rounded-lg transition-colors ${isDarkMap
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Cmd/Ctrl + K Indicator */}
            {!query && (
              <span className={`hidden xl:flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold select-none mr-1 ${isDarkMap
                ? 'bg-slate-800 text-slate-300 border border-slate-700/60'
                : 'bg-slate-100 text-slate-400'
                }`}>
                ⌘K
              </span>
            )}
          </div>

          {/* Advanced Filter Trigger with Vibrant Counter Badge */}
          <button
            type="button"
            onClick={onOpenAdvancedFilters}
            title="Advanced Filters"
            className={`relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all flex-shrink-0 active:scale-95 ${activeFilterCount > 0
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
              : isDarkMap
                ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Live Voice Search Listening Banner */}
        {isListening && (
          <div className="mt-2 p-2.5 bg-rose-600 text-white rounded-xl shadow-xl flex items-center justify-between gap-2 text-xs font-bold animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span>Listening... Speak property search (e.g. Kokapet 3 BHK under 2 Cr)</span>
            </div>
            <button
              type="button"
              onClick={() => {
                try { speechRecognitionRef.current?.stop(); } catch (_) { }
                setIsListening(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-white text-rose-700 font-extrabold text-[11px] shadow-xs hover:bg-rose-50"
            >
              Stop & Search
            </button>
          </div>
        )}

        {/* AI Natural Language Query Feedback Banner */}
        {aiFeedbackMessage && (
          <div className="mt-2 p-2.5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl shadow-lg border border-blue-700 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>AI Applied: <strong>{aiFeedbackMessage}</strong></span>
            </div>
            <button
              onClick={() => setAiFeedbackMessage(null)}
              className="text-slate-300 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Omnisearch Enhanced Dropdown Menu - Aligned directly with Searchbar */}
        {showDropdown && (
          <div className={`mt-2 w-full rounded-2xl shadow-2xl border overflow-hidden divide-y animate-in fade-in slide-from-top-1 duration-150 max-h-[70dvh] sm:max-h-[460px] overflow-y-auto ${isDarkMap
            ? 'bg-slate-950 border-slate-700 shadow-black/80 divide-slate-800 text-slate-100'
            : 'bg-white border-slate-200 divide-slate-100 text-slate-900 shadow-slate-900/15'
            }`}>

            {/* Live Search Spinner */}
            {isSearching && (
              <div className={`p-3 text-xs flex items-center gap-2 ${isDarkMap ? 'text-slate-400 bg-slate-900/60' : 'text-slate-500 bg-slate-50/50'
                }`}>
                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                <span>Searching Google Maps & real estate database...</span>
              </div>
            )}

            {/* SECTION 1: MATCHING PROPERTIES & PROJECTS */}
            {matchingProperties.length > 0 && (
              <div className="p-2 sm:p-2.5">
                <div className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 flex items-center justify-between ${isDarkMap ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                  <div className="flex items-center gap-1.5">
                    <Building2 className={`w-3.5 h-3.5 ${isDarkMap ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span>Matching Listings ({matchingProperties.length})</span>
                  </div>
                  <span className={`text-[9px] font-semibold ${isDarkMap ? 'text-slate-400' : 'text-slate-500'}`}>Jump to property</span>
                </div>

                <div className="space-y-1 mt-1">
                  {matchingProperties.map((prop, idx) => {
                    const isSelected = highlightedIndex === idx;
                    return (
                      <div
                        key={prop.id}
                        onClick={() => handleSelectMatchingProperty(prop)}
                        className={`p-2 rounded-xl cursor-pointer flex items-center justify-between gap-2.5 transition-all ${isSelected
                          ? isDarkMap
                            ? 'bg-blue-950/70 ring-1 ring-blue-500/60'
                            : 'bg-blue-50 ring-1 ring-blue-500/40'
                          : isDarkMap
                            ? 'hover:bg-slate-900/80'
                            : 'hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs ${isDarkMap
                            ? 'bg-blue-950/80 text-blue-400 border border-blue-800/80'
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className={`text-xs sm:text-sm font-extrabold truncate ${isDarkMap ? 'text-white' : 'text-slate-900'
                              }`}>
                              {prop.title}
                            </div>
                            <div className={`text-[11px] truncate flex items-center gap-1.5 font-medium ${isDarkMap ? 'text-slate-300' : 'text-slate-600'
                              }`}>
                              <span>{prop.area || prop.address}, {prop.city}</span>
                              <span>•</span>
                              <span className={isDarkMap ? 'text-blue-300' : 'text-blue-700 font-semibold'}>{prop.category}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-black px-2 py-0.5 rounded-lg shadow-2xs ${isDarkMap
                            ? 'text-emerald-300 bg-emerald-950/80 border border-emerald-800/80'
                            : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            }`}>
                            {formatIndianCurrency(prop.price, prop.type)}
                          </span>
                          <ArrowRight className={`w-3.5 h-3.5 ${isDarkMap ? 'text-slate-400' : 'text-slate-400'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 2: LOCALITY & CITY SUGGESTIONS */}
            {suggestions.length > 0 && (
              <div className="p-2 sm:p-2.5">
                <div className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 flex items-center gap-1.5 ${isDarkMap ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                  <MapPin className={`w-3.5 h-3.5 ${isDarkMap ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span>Localities, Cities & PIN Codes</span>
                </div>

                <div className="space-y-1 mt-1">
                  {suggestions.map((item, idx) => {
                    const actualIdx = matchingProperties.length + idx;
                    const isSelected = highlightedIndex === actualIdx;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectLocation(item)}
                        className={`p-2 sm:p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-2.5 transition-all text-left ${isSelected
                          ? isDarkMap
                            ? 'bg-blue-950/70 ring-1 ring-blue-500/60'
                            : 'bg-blue-50 ring-1 ring-blue-500/40'
                          : isDarkMap
                            ? 'hover:bg-slate-900/80'
                            : 'hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isDarkMap
                            ? 'bg-blue-950/80 text-blue-400 border border-blue-800/80'
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                            {item.type === 'city' ? (
                              <Building2 className="w-4 h-4" />
                            ) : (
                              <MapPin className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className={`text-xs sm:text-sm font-extrabold truncate ${isDarkMap ? 'text-white' : 'text-slate-900'
                              }`}>
                              {item.title}
                            </div>
                            {item.subTitle && (
                              <div className={`text-[11px] font-medium truncate ${isDarkMap ? 'text-slate-300' : 'text-slate-600'
                                }`}>
                                {item.subTitle}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex-shrink-0 ${isDarkMap
                          ? 'bg-slate-800 text-slate-200 border border-slate-700'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                          {item.type}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 3: WHEN QUERY IS EMPTY - SHOW TRENDING HUBS & CATEGORIES */}
            {query.trim().length < 2 && (
              <div className="p-3 sm:p-4 space-y-3.5">

                {/* Micro-Markets Grid */}
                <div>
                  <div className={`text-[10px] font-extrabold uppercase tracking-wider mb-2 flex items-center justify-between ${isDarkMap ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className={`w-3.5 h-3.5 ${isDarkMap ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span>Premier Indian Micro-Markets</span>
                    </div>
                    <span className={`text-[9px] font-bold ${isDarkMap ? 'text-emerald-400' : 'text-emerald-700'}`}>Q4 Yield</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {TRENDING_HUBS.map((loc) => (
                      <div
                        key={loc.title}
                        onClick={() =>
                          handleSelectLocation({
                            id: loc.title,
                            title: loc.title,
                            subTitle: loc.subTitle,
                            coordinates: loc.coords,
                            type: 'area'
                          })
                        }
                        className={`p-2 rounded-xl cursor-pointer text-left transition-all flex items-center gap-2 group border ${isDarkMap
                          ? 'hover:bg-slate-900 border-slate-800 bg-slate-900/60'
                          : 'hover:bg-blue-50/80 border-slate-200/90 bg-white shadow-2xs'
                          }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isDarkMap
                          ? 'bg-slate-800 text-slate-200 group-hover:bg-blue-900 group-hover:text-blue-300'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700'
                          }`}>
                          <Compass className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate flex-1 min-w-0">
                          <div className={`text-xs font-extrabold truncate ${isDarkMap
                            ? 'text-white group-hover:text-blue-400'
                            : 'text-slate-900 group-hover:text-blue-600'
                            }`}>
                            {loc.title}
                          </div>
                          <div className={`text-[10px] font-bold truncate ${isDarkMap ? 'text-emerald-400' : 'text-emerald-700'
                            }`}>
                            {loc.priceTrend}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Explore by Property Type */}
                <div className={`pt-2 border-t ${isDarkMap ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className={`text-[10px] font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${isDarkMap ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                    <Tag className={`w-3.5 h-3.5 ${isDarkMap ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    <span>Explore by Asset Class</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {EXPLORE_CATEGORIES.map((cat) => {
                      const isActive = filterState.category === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => {
                            onFilterChange({
                              ...filterState,
                              category: isActive ? 'all' : cat.value
                            });
                            setShowDropdown(false);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : isDarkMap
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80'
                            }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                          {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: NO RESULTS STATE */}
            {query.trim().length >= 2 && !isSearching && suggestions.length === 0 && matchingProperties.length === 0 && (
              <div className="p-4 text-center space-y-2">
                <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${isDarkMap ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'
                  }`}>
                  <Search className="w-4 h-4" />
                </div>
                <div className={`text-xs font-bold ${isDarkMap ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                  No exact match for "{query}"
                </div>
                <p className={`text-[11px] max-w-xs mx-auto ${isDarkMap ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                  Try a locality (e.g. Kokapet, Tellapur) or press Enter to trigger AI search.
                </p>
                <button
                  type="button"
                  onClick={() => handleExecuteAISearch()}
                  className="mt-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Run AI Search for "{query}"</span>
                  <CornerDownLeft className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 
        2. TOP-RIGHT QUICK ACTION BAR (Desktop & Tablet)
        Anchored on the right, completely independent of the searchbar so they never collide!
      */}
      <div className="hidden sm:flex items-center gap-2 fixed top-4 right-6 z-30 pointer-events-auto">
        {/* Inline Segmented Switch: Buy vs Rent */}
        <div className={`flex items-center p-1 rounded-2xl border shadow-md text-xs font-bold h-10 ${isDarkMap
          ? 'bg-slate-950 border-slate-700 shadow-black/40 text-slate-300'
          : 'bg-white border-slate-200 shadow-slate-900/10 text-slate-600'
          }`}>
          <button
            type="button"
            onClick={() => onFilterChange({ ...filterState, type: filterState.type === 'sale' ? 'all' : 'sale' })}
            className={`h-8 px-3 rounded-xl transition-all ${filterState.type === 'sale'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : isDarkMap
                ? 'hover:text-white'
                : 'hover:text-slate-900'
              }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ ...filterState, type: filterState.type === 'rent' ? 'all' : 'rent' })}
            className={`h-8 px-3 rounded-xl transition-all ${filterState.type === 'rent'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : isDarkMap
                ? 'hover:text-white'
                : 'hover:text-slate-900'
              }`}
          >
            Rent
          </button>
        </div>

        {/* Universal Indian Area Unit Switcher */}
        {onAreaUnitChange && (
          <div className={`hidden md:flex items-center p-1 rounded-2xl border shadow-md text-xs font-bold h-10 ${isDarkMap
            ? 'bg-slate-950 border-slate-700 shadow-black/40 text-slate-300'
            : 'bg-white border-slate-200 shadow-slate-900/10 text-slate-600'
            }`}>
            <span className="px-2 text-[10px] uppercase font-extrabold text-slate-400 flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5 text-blue-500" />
              <span>Unit:</span>
            </span>
            <button
              type="button"
              onClick={() => onAreaUnitChange('sqft')}
              className={`h-8 px-2.5 rounded-xl transition-all ${areaUnit === 'sqft'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : isDarkMap ? 'hover:text-white' : 'hover:text-slate-900'
                }`}
              title="Carpet & Built-Up Sq. Ft."
            >
              Sq. Ft.
            </button>
            <button
              type="button"
              onClick={() => onAreaUnitChange('sqyard')}
              className={`h-8 px-2.5 rounded-xl transition-all ${areaUnit === 'sqyard'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : isDarkMap ? 'hover:text-white' : 'hover:text-slate-900'
                }`}
              title="Plots & Land in Sq. Yards (Gaj)"
            >
              Sq. Yds (Gaj)
            </button>
            <button
              type="button"
              onClick={() => onAreaUnitChange('acre_gunta')}
              className={`h-8 px-2.5 rounded-xl transition-all ${areaUnit === 'acre_gunta'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : isDarkMap ? 'hover:text-white' : 'hover:text-slate-900'
                }`}
              title="Farmland in Acres & Guntas"
            >
              Acres & Gts
            </button>
          </div>
        )}

        {/* Compare Pill Trigger */}
        {comparedCount > 0 && onOpenCompare && (
          <button
            type="button"
            onClick={onOpenCompare}
            className={`flex items-center gap-1.5 h-10 px-3 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 border ${isDarkMap
              ? 'bg-indigo-950/80 border-indigo-800 text-indigo-300 hover:bg-indigo-900/80'
              : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              }`}
            title="Open Property Comparison"
          >
            <Scale className="w-4 h-4 text-indigo-400" />
            <span>Compare ({comparedCount})</span>
          </button>
        )}

        {/* Razorpay Plans & Passes Button */}
        {onOpenPricing && (
          <button
            type="button"
            onClick={onOpenPricing}
            title="Monetization Plans & Owner Passes (Razorpay)"
            className={`hidden md:flex items-center gap-1.5 h-10 px-3 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 border ${isDarkMap
              ? 'bg-slate-950 border-slate-700 text-slate-100 hover:text-white hover:bg-slate-900 shadow-black/40'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-slate-900/5'
              }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-500" />
            <span>Plans</span>
          </button>
        )}

        {/* AI Advisor Button */}
        {onOpenAIAdvisor && (
          <button
            type="button"
            onClick={onOpenAIAdvisor}
            title="Open AI Real Estate Advisor"
            className={`w-10 h-10 flex items-center justify-center rounded-2xl shadow-md transition-all active:scale-95 border ${isDarkMap
              ? 'bg-slate-950 border-slate-700 text-slate-100 hover:text-white hover:bg-slate-900 shadow-black/40'
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-slate-900/5'
              }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </button>
        )}

        {/* Primary SaaS CTA: List Property */}
        <button
          type="button"
          onClick={onOpenAddProperty}
          className="flex items-center gap-1.5 h-10 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 text-white stroke-[2.5]" />
          <span>List Property</span>
        </button>

        {/* User Profile Avatar with Online Status */}
        <button
          type="button"
          onClick={onOpenProfile}
          title="Account & Settings"
          className={`relative w-10 h-10 rounded-2xl overflow-hidden border hover:ring-2 hover:ring-blue-500/30 transition-all flex items-center justify-center text-xs font-bold shadow-md active:scale-95 ${isDarkMap ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-700'
            }`}
          aria-label="Profile"
        >
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.name}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
        </button>
      </div>
    </>
  );
};

export default FloatingHeader;
