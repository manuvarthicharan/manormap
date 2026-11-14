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
  Sun,
  Moon,
  Tag,
  ArrowRight,
  Compass,
  CornerDownLeft,
  Loader2,
  Check
} from 'lucide-react';
import { searchLocations } from '../../services/geocoding';
import { SearchResult, FilterState, Property, PropertyCategory } from '../../types';
import { getUserProfile } from '../../services/userService';
import { parseNaturalLanguageQuery } from '../../services/aiIntelligenceService';
import { formatIndianCurrency } from '../../services/propertyService';
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
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
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
  theme = 'light',
  onToggleTheme
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [aiFeedbackMessage, setAiFeedbackMessage] = useState<string | null>(null);
  const userProfile = getUserProfile();

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // AI Natural Language Search Execution
  const handleExecuteAISearch = async () => {
    if (!query.trim()) return;

    const parsed = parseNaturalLanguageQuery(query);
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
      */}
      <div
        ref={searchContainerRef}
        className="fixed top-3 left-3 right-3 sm:top-4 sm:left-6 sm:right-auto sm:w-[380px] md:w-[440px] lg:w-[480px] z-30 pointer-events-auto transition-all"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-900/5 dark:shadow-black/40 border border-slate-200/90 dark:border-slate-800 p-1.5 sm:p-2 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
          
          {/* Logo & Navigation Menu Button */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onOpenMenu}
              title="Open Navigation Menu"
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 flex-shrink-0"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* ManorMap Brand Logo */}
            <div
              onClick={onOpenMenu}
              className="flex items-center pr-1.5 sm:pr-2 border-r border-slate-200/80 dark:border-slate-800 cursor-pointer select-none group flex-shrink-0"
              title="ManorMap Menu"
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
            <Search className={`w-4 h-4 ml-1 mr-1.5 pointer-events-none flex-shrink-0 transition-colors ${
              query ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
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
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none pr-7 py-1 font-medium truncate"
              autoComplete="off"
              spellCheck="false"
            />

            {/* Clear Button */}
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Cmd/Ctrl + K Indicator */}
            {!query && (
              <span className="hidden xl:flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold select-none mr-1">
                ⌘K
              </span>
            )}
          </div>

          {/* Advanced Filter Trigger with Vibrant Counter Badge */}
          <button
            type="button"
            onClick={onOpenAdvancedFilters}
            title="Advanced Filters"
            className={`relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl transition-all flex-shrink-0 active:scale-95 ${
              activeFilterCount > 0
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
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
          <div className="mt-2 w-full bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 animate-in fade-in slide-in-from-top-1 duration-150 max-h-[70dvh] sm:max-h-[460px] overflow-y-auto">
            
            {/* Live Search Spinner */}
            {isSearching && (
              <div className="p-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/40">
                <Loader2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
                <span>Searching Google Maps & real estate database...</span>
              </div>
            )}

            {/* SECTION 1: MATCHING PROPERTIES & PROJECTS */}
            {matchingProperties.length > 0 && (
              <div className="p-2 sm:p-2.5">
                <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Matching Listings ({matchingProperties.length})</span>
                  </div>
                  <span className="text-[9px] text-slate-400">Jump to property</span>
                </div>

                <div className="space-y-1 mt-1">
                  {matchingProperties.map((prop, idx) => {
                    const isSelected = highlightedIndex === idx;
                    return (
                      <div
                        key={prop.id}
                        onClick={() => handleSelectMatchingProperty(prop)}
                        className={`p-2 rounded-xl cursor-pointer flex items-center justify-between gap-2.5 transition-all ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-500/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {prop.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                              <span>{prop.area || prop.address}, {prop.city}</span>
                              <span>•</span>
                              <span className="text-slate-400 dark:text-slate-500">{prop.category}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-lg shadow-2xs">
                            {formatIndianCurrency(prop.price, prop.type)}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
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
                <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
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
                        className={`p-2 sm:p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-2.5 transition-all text-left ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-500/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 flex items-center justify-center flex-shrink-0">
                            {item.type === 'city' ? (
                              <Building2 className="w-4 h-4" />
                            ) : (
                              <MapPin className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {item.title}
                            </div>
                            {item.subTitle && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {item.subTitle}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex-shrink-0">
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
                  <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Premier Indian Micro-Markets</span>
                    </div>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">Q4 Yield</span>
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
                        className="p-2 rounded-xl hover:bg-blue-50/70 dark:hover:bg-blue-950/40 cursor-pointer text-left transition-all flex items-center gap-2 group border border-slate-100 dark:border-slate-800/80"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 group-hover:text-blue-700 dark:group-hover:text-blue-300 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Compass className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                            {loc.title}
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                            {loc.priceTrend}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Explore by Property Type */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
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
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95 ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
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
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  No exact match for "{query}"
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Try a locality (e.g. Kokapet, Tellapur) or press Enter to trigger AI search.
                </p>
                <button
                  type="button"
                  onClick={handleExecuteAISearch}
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
        <div className="flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-1 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md shadow-slate-900/5 text-xs font-bold text-slate-600 dark:text-slate-300 h-10">
          <button
            type="button"
            onClick={() => onFilterChange({ ...filterState, type: filterState.type === 'sale' ? 'all' : 'sale' })}
            className={`h-8 px-3 rounded-xl transition-all ${
              filterState.type === 'sale'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ ...filterState, type: filterState.type === 'rent' ? 'all' : 'rent' })}
            className={`h-8 px-3 rounded-xl transition-all ${
              filterState.type === 'rent'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Rent
          </button>
        </div>

        {/* Compare Pill Trigger */}
        {comparedCount > 0 && onOpenCompare && (
          <button
            type="button"
            onClick={onOpenCompare}
            className="flex items-center gap-1.5 h-10 px-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all hover:bg-indigo-100 dark:hover:bg-indigo-900/80 shadow-md active:scale-95"
            title="Open Property Comparison"
          >
            <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Compare ({comparedCount})</span>
          </button>
        )}

        {/* AI Advisor Button */}
        {onOpenAIAdvisor && (
          <button
            type="button"
            onClick={onOpenAIAdvisor}
            title="Open AI Real Estate Advisor"
            className="w-10 h-10 flex items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-2xl shadow-md transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}

        {/* Theme Mode Toggle (Light / Dark) */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="w-10 h-10 flex items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl shadow-md transition-all active:scale-95"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        )}

        {/* Primary SaaS CTA: List Property */}
        <button
          type="button"
          onClick={onOpenAddProperty}
          className="flex items-center gap-1.5 h-10 px-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600 stroke-[2.5]" />
          <span>List Property</span>
        </button>

        {/* User Profile Avatar with Online Status */}
        <button
          type="button"
          onClick={onOpenProfile}
          title="Account & Settings"
          className="relative w-10 h-10 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-blue-500/30 transition-all flex items-center justify-center text-xs font-bold text-slate-700 shadow-md active:scale-95"
          aria-label="Profile"
        >
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.name}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
        </button>
      </div>
    </>
  );
};

export default FloatingHeader;
