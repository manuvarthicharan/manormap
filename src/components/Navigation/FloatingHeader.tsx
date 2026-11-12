import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  X,
  MapPin,
  Building,
  SlidersHorizontal,
  Plus,
  TrendingUp,
  LayoutGrid,
  Sparkles,
  Scale,
  Sun,
  Moon
} from 'lucide-react';
import { searchLocations } from '../../services/geocoding';
import { SearchResult, FilterState } from '../../types';
import { getUserProfile } from '../../services/userService';
import { parseNaturalLanguageQuery } from '../../services/aiIntelligenceService';
import { Logo } from '../Common/Logo';

interface FloatingHeaderProps {
  onOpenMenu: () => void;
  onOpenProfile: () => void;
  onOpenAddProperty: () => void;
  onSelectLocation: (result: SearchResult) => void;
  filterState: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onOpenAdvancedFilters: () => void;
  propertiesCount?: number;
  onToggleTray?: () => void;
  isTrayOpen?: boolean;
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
    title: 'Koregaon Park, Pune',
    subTitle: 'North Main Road',
    priceTrend: 'Avg ₹12,600/sqft (+10.1% YoY)',
    coords: [73.8943, 18.5362] as [number, number]
  },
  {
    title: 'OMR IT Expressway, Chennai',
    subTitle: 'Sholinganallur & Perungudi',
    priceTrend: 'Avg ₹7,200/sqft (+8.6% YoY)',
    coords: [80.2464, 12.9463] as [number, number]
  }
];

export const FloatingHeader: React.FC<FloatingHeaderProps> = ({
  onOpenMenu,
  onOpenProfile,
  onOpenAddProperty,
  onSelectLocation,
  filterState,
  onFilterChange,
  onOpenAdvancedFilters,
  propertiesCount = 0,
  onToggleTray,
  isTrayOpen = false,
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
  const [aiFeedbackMessage, setAiFeedbackMessage] = useState<string | null>(null);
  const userProfile = getUserProfile();

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = searchContainerRef.current?.querySelector('input');
        input?.focus();
        setShowDropdown(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(query);
        setSuggestions(results);
        setShowDropdown(true);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 220);

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

  const handleSelect = (item: SearchResult) => {
    setQuery(item.title);
    setShowDropdown(false);
    onSelectLocation(item);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    setAiFeedbackMessage(null);
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
      {/* Top Floating SaaS Command Bar */}
      <div 
        ref={searchContainerRef}
        className="fixed top-3 left-3 right-3 sm:top-4 sm:left-6 sm:w-auto sm:max-w-2xl z-30 pointer-events-auto"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 bg-white rounded-2xl shadow-lg border border-slate-200/90 p-1 sm:p-1.5 transition-all focus-within:border-blue-500">
          {/* Logo & Menu Button */}
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenMenu}
              title="Open Navigation Menu"
              className="w-9 h-9 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 flex-shrink-0"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Logo Pic */}
            <div 
              onClick={onOpenMenu}
              className="flex items-center pr-1.5 sm:pr-2.5 border-r border-slate-200 cursor-pointer select-none group flex-shrink-0"
              title="Menu"
            >
              <div className="sm:hidden">
                <Logo size="xs" />
              </div>
              <div className="hidden sm:block">
                <Logo size="md" />
              </div>
            </div>
          </div>

          {/* Omnisearch Input Field with AI natural language search */}
          <div className="relative flex-1 flex items-center min-w-0">
            <Search className="w-4 h-4 text-slate-400 ml-1 sm:ml-1.5 mr-1.5 sm:mr-2 pointer-events-none flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExecuteAISearch();
              }}
              placeholder="Search locality, e.g. Gachibowli..."
              className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none pr-6 sm:pr-7 py-1.5 font-medium truncate"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-1 text-slate-400 hover:text-slate-600 p-1"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* AI Search Action Button */}
          {query.trim().length > 3 && (
            <button
              type="button"
              onClick={handleExecuteAISearch}
              title="Parse with AI Search"
              className="hidden sm:flex items-center gap-1 h-8 px-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex-shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>AI Search</span>
            </button>
          )}

          {/* Quick Inline Switcher: Buy vs Rent */}
          <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold text-slate-600 flex-shrink-0 h-8">
            <button
              type="button"
              onClick={() => onFilterChange({ ...filterState, type: filterState.type === 'sale' ? 'all' : 'sale' })}
              className={`h-7 px-3 rounded-md transition-colors ${
                filterState.type === 'sale' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filterState, type: filterState.type === 'rent' ? 'all' : 'rent' })}
              className={`h-7 px-3 rounded-md transition-colors ${
                filterState.type === 'rent' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Rent
            </button>
          </div>

          {/* Advanced Filter Modal Trigger with Counter */}
          <button
            type="button"
            onClick={onOpenAdvancedFilters}
            title="Advanced Filters"
            className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors flex-shrink-0 ${
              activeFilterCount > 0
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Compare Pill Trigger */}
          {comparedCount > 0 && onOpenCompare && (
            <button
              type="button"
              onClick={onOpenCompare}
              className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold transition-all hover:bg-indigo-100 shadow-xs flex-shrink-0"
              title="Open Property Comparison"
            >
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              <span>{comparedCount}</span>
            </button>
          )}

          {/* AI Advisor Button */}
          {onOpenAIAdvisor && (
            <button
              type="button"
              onClick={onOpenAIAdvisor}
              title="Open AI Real Estate Advisor"
              className="hidden sm:flex w-9 h-9 items-center justify-center text-blue-600 hover:bg-blue-50 rounded-xl transition-colors flex-shrink-0"
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </button>
          )}

          {/* View List / Tray Toggle Button */}
          {onToggleTray && propertiesCount > 0 && (
            <button
              type="button"
              onClick={onToggleTray}
              title={isTrayOpen ? 'Hide Cards Tray' : 'Show Cards Tray'}
              className={`hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold transition-colors flex-shrink-0 ${
                isTrayOpen
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{propertiesCount}</span>
            </button>
          )}

          {/* Theme Mode Toggle (Light / Dark) */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="hidden sm:flex w-9 h-9 items-center justify-center text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          )}

          {/* List Property Primary SaaS CTA (Desktop Header) */}
          <button
            type="button"
            onClick={onOpenAddProperty}
            className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600 stroke-[2.5]" />
            <span>List Property</span>
          </button>

          <div className="hidden sm:block w-[1px] h-5 bg-slate-200 dark:bg-slate-700 flex-shrink-0" />

          {/* User Profile Avatar with Online Status */}
          <button
            type="button"
            onClick={onOpenProfile}
            title="Account & Settings"
            className="hidden sm:flex relative w-9 h-9 rounded-xl overflow-hidden border border-slate-200 hover:ring-2 hover:ring-blue-500/30 transition-all items-center justify-center text-xs font-bold text-slate-700 active:scale-95 flex-shrink-0"
            aria-label="Profile"
          >
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
          </button>
        </div>

        {/* AI Feedback Banner */}
        {aiFeedbackMessage && (
          <div className="mt-2 p-2.5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl shadow-lg border border-blue-700 text-xs flex items-center justify-between gap-2 animate-in fade-in">
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

        {/* Omnisearch Dropdown with Trending Indian Hubs */}
        {showDropdown && (
          <div className="mt-2 bg-white/98 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-floating-lg border border-slate-100 overflow-hidden divide-y divide-slate-100 animate-in fade-in duration-150 max-h-[60dvh] sm:max-h-88 overflow-y-auto">
            {isSearching && (
              <div className="p-3 text-xs text-slate-400 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Searching Indian real estate locations...</span>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  {item.type === 'city' ? (
                    <Building className="w-4 h-4" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                    {item.title}
                  </div>
                  {item.subTitle && (
                    <div className="text-[11px] text-slate-400 truncate">
                      {item.subTitle}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                  {item.type}
                </span>
              </div>
            ))}

            {/* Trending Hotspots Section (When input is empty or query is short) */}
            {suggestions.length === 0 && !isSearching && (
              <div className="p-3 sm:p-4">
                <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>High-Demand Micro-Markets</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold lowercase">Q4 Market Trends</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TRENDING_HUBS.map((loc) => (
                    <div
                      key={loc.title}
                      onClick={() =>
                        handleSelect({
                          id: loc.title,
                          title: loc.title,
                          subTitle: loc.subTitle,
                          coordinates: loc.coords,
                          type: 'area'
                        })
                      }
                      className="p-2.5 rounded-2xl hover:bg-blue-50/60 cursor-pointer text-left transition-colors flex items-center gap-2.5 group border border-slate-100/60"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-700 text-slate-600 flex items-center justify-center flex-shrink-0 transition-colors">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate flex-1">
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate">
                          {loc.title}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold truncate">
                          {loc.priceTrend}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
