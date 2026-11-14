import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Menu,
  Search,
  X,
  MapPin,
  SlidersHorizontal,
  Plus,
  Sparkles,
  Scale,
  Sun,
  Moon,
  ArrowRight,
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

const MARKET_HUBS = [
  {
    title: 'Hitec City',
    city: 'Hyderabad',
    subTitle: 'IT Corridor & Knowledge City',
    rate: '₹8,400 / sq ft',
    change: '+14.2% YoY',
    coords: [78.3820, 17.4474] as [number, number]
  },
  {
    title: 'Kokapet',
    city: 'Hyderabad',
    subTitle: 'Neopolis & Golden Mile',
    rate: '₹11,200 / sq ft',
    change: '+19.8% YoY',
    coords: [78.3245, 17.3980] as [number, number]
  },
  {
    title: 'Indiranagar',
    city: 'Bengaluru',
    subTitle: 'Defence Colony & 100ft Road',
    rate: '₹15,800 / sq ft',
    change: '+11.8% YoY',
    coords: [77.6412, 12.9784] as [number, number]
  },
  {
    title: 'Bandra West',
    city: 'Mumbai',
    subTitle: 'Pali Hill & Carter Road',
    rate: '₹52,000 / sq ft',
    change: '+9.4% YoY',
    coords: [72.8295, 19.0596] as [number, number]
  },
  {
    title: 'Golf Course Road',
    city: 'Gurugram',
    subTitle: 'DLF Phase 5',
    rate: '₹28,500 / sq ft',
    change: '+16.5% YoY',
    coords: [77.1052, 28.4595] as [number, number]
  },
  {
    title: 'Whitefield',
    city: 'Bengaluru',
    subTitle: 'Outer Ring Road & ITPL',
    rate: '₹9,600 / sq ft',
    change: '+12.4% YoY',
    coords: [77.7500, 12.9698] as [number, number]
  }
];

const PROPERTY_TYPES: { label: string; value: PropertyCategory; note: string }[] = [
  { label: 'Apartments', value: 'Apartment', note: 'Gated high-rises' },
  { label: 'Villas & Houses', value: 'Villa', note: 'Independent residences' },
  { label: 'Agricultural Land', value: 'Agricultural Land', note: 'Surveyed parcels & farms' },
  { label: 'Plots & Layouts', value: 'Plot', note: 'Approved residential plots' },
  { label: 'Commercial Spaces', value: 'Commercial', note: 'Offices & retail units' }
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

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
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

  // Real-time matching properties
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

  const handleSelectLocation = (item: SearchResult) => {
    setQuery(item.title);
    setShowDropdown(false);
    onSelectLocation(item);
  };

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

  // AI Natural Language Query Execution
  const handleExecuteAISearch = async () => {
    if (!query.trim()) return;

    const parsed = parseNaturalLanguageQuery(query);
    const updatedFilters = { ...filterState, ...parsed.filters };
    onFilterChange(updatedFilters);

    setAiFeedbackMessage(parsed.summary);
    setTimeout(() => setAiFeedbackMessage(null), 4500);

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
      {/* Flat Editorial Command Bar */}
      <header
        ref={searchContainerRef}
        className="fixed top-3 inset-x-3 sm:top-4 sm:left-5 sm:right-auto z-30 pointer-events-auto"
      >
        <div className="flex items-stretch bg-[#fbf9f6]/95 dark:bg-[#181716]/95 backdrop-blur-md rounded-xs border border-[#e7e5e4] dark:border-[#292524] shadow-[0_1px_3px_rgba(0,0,0,0.04)] h-11 transition-colors">
          
          {/* Menu & Brand Logo */}
          <div className="flex items-center pl-2 pr-2.5 border-r border-[#e7e5e4] dark:border-[#292524] gap-1 flex-shrink-0">
            <button
              onClick={onOpenMenu}
              title="Menu"
              className="w-7 h-7 flex items-center justify-center text-[#78716c] dark:text-[#a8a29e] hover:text-[#1c1917] dark:hover:text-[#f5f5f4] transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-4 h-4 stroke-[1.75]" />
            </button>

            <div
              onClick={onOpenMenu}
              className="cursor-pointer select-none pl-1 flex items-center"
              title="ManorMap"
            >
              <Logo size="xs" />
            </div>
          </div>

          {/* Omnisearch Input Field */}
          <div className="relative flex-1 flex items-center min-w-[200px] sm:min-w-[320px] lg:min-w-[380px] px-3">
            <Search className={`w-3.5 h-3.5 mr-2 pointer-events-none flex-shrink-0 transition-colors ${
              query ? 'text-[#8b3a24]' : 'text-[#a8a29e]'
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
              placeholder="Search locality, project, or landmark"
              className="w-full bg-transparent text-xs text-[#1c1917] dark:text-[#f5f5f4] placeholder-[#a8a29e] dark:placeholder-[#78716c] focus:outline-none font-normal"
              autoComplete="off"
              spellCheck="false"
            />

            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[#a8a29e] hover:text-[#1c1917] dark:hover:text-[#f5f5f4] p-1 transition-colors"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {!query && (
              <span className="hidden xl:inline text-[10px] text-[#a8a29e] font-mono tracking-wider ml-1">
                ⌘K
              </span>
            )}
          </div>

          {/* AI Search Pill when query entered */}
          {query.trim().length > 2 && (
            <div className="flex items-center px-2 border-l border-[#e7e5e4] dark:border-[#292524]">
              <button
                type="button"
                onClick={handleExecuteAISearch}
                title="Search with AI"
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#8b3a24] bg-[#fbf2ed] dark:bg-[#2b1f1a] hover:bg-[#f7e6dc] border border-[#ecd5c8] dark:border-[#422c22] rounded-xs transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Search with AI</span>
              </button>
            </div>
          )}

          {/* Buy / Rent Toggle */}
          <div className="hidden md:flex items-center px-2 border-l border-[#e7e5e4] dark:border-[#292524] gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => onFilterChange({ ...filterState, type: filterState.type === 'sale' ? 'all' : 'sale' })}
              className={`px-2.5 py-1 rounded-xs transition-colors font-medium ${
                filterState.type === 'sale'
                  ? 'bg-[#1c1917] dark:bg-[#f5f5f4] text-[#fbf9f6] dark:text-[#1c1917]'
                  : 'text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4]'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filterState, type: filterState.type === 'rent' ? 'all' : 'rent' })}
              className={`px-2.5 py-1 rounded-xs transition-colors font-medium ${
                filterState.type === 'rent'
                  ? 'bg-[#1c1917] dark:bg-[#f5f5f4] text-[#fbf9f6] dark:text-[#1c1917]'
                  : 'text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4]'
              }`}
            >
              Rent
            </button>
          </div>

          {/* Filters Button */}
          <div className="flex items-center px-1 border-l border-[#e7e5e4] dark:border-[#292524]">
            <button
              type="button"
              onClick={onOpenAdvancedFilters}
              title="Filters"
              className={`h-8 px-2 flex items-center gap-1.5 rounded-xs text-xs transition-colors ${
                activeFilterCount > 0
                  ? 'text-[#8b3a24] bg-[#fbf2ed] dark:bg-[#2b1f1a]'
                  : 'text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {activeFilterCount > 0 && (
                <span className="text-[10px] font-mono font-bold text-[#8b3a24]">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Compare Counter */}
          {comparedCount > 0 && onOpenCompare && (
            <div className="hidden sm:flex items-center px-2 border-l border-[#e7e5e4] dark:border-[#292524]">
              <button
                type="button"
                onClick={onOpenCompare}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-[#8b3a24] bg-[#fbf2ed] dark:bg-[#2b1f1a] border border-[#ecd5c8] dark:border-[#422c22] rounded-xs transition-colors"
                title="Compare properties"
              >
                <Scale className="w-3 h-3" />
                <span>Compare ({comparedCount})</span>
              </button>
            </div>
          )}

          {/* AI Advisor Button */}
          {onOpenAIAdvisor && (
            <div className="hidden lg:flex items-center px-1 border-l border-[#e7e5e4] dark:border-[#292524]">
              <button
                type="button"
                onClick={onOpenAIAdvisor}
                title="Advisor"
                className="w-7 h-7 flex items-center justify-center text-[#78716c] hover:text-[#8b3a24] dark:hover:text-[#f5f5f4] transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Theme Toggle */}
          {onToggleTheme && (
            <div className="hidden lg:flex items-center px-1 border-l border-[#e7e5e4] dark:border-[#292524]">
              <button
                type="button"
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                className="w-7 h-7 flex items-center justify-center text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f5f5f4] transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Primary Action: Add Listing */}
          <div className="hidden sm:flex items-center px-2 border-l border-[#e7e5e4] dark:border-[#292524]">
            <button
              type="button"
              onClick={onOpenAddProperty}
              className="h-7 px-3 bg-[#1c1917] dark:bg-[#f5f5f4] text-[#fbf9f6] dark:text-[#1c1917] hover:bg-[#8b3a24] dark:hover:bg-[#8b3a24] dark:hover:text-white rounded-xs text-[11px] font-medium tracking-wide uppercase transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3 stroke-[2]" />
              <span>Add listing</span>
            </button>
          </div>

          {/* User Profile */}
          <div className="hidden sm:flex items-center px-2 border-l border-[#e7e5e4] dark:border-[#292524]">
            <button
              type="button"
              onClick={onOpenProfile}
              title="Account"
              className="w-6 h-6 rounded-xs overflow-hidden border border-[#d6d3d1] dark:border-[#44403c] transition-opacity hover:opacity-80"
              aria-label="Profile"
            >
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>

        {/* AI Query Banner */}
        {aiFeedbackMessage && (
          <div className="mt-1.5 p-2 bg-[#1c1917] dark:bg-[#292524] text-[#f5f5f4] text-xs flex items-center justify-between gap-2 border border-[#44403c] rounded-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8b3a24]" />
              <span>Filtered by: <strong>{aiFeedbackMessage}</strong></span>
            </div>
            <button
              onClick={() => setAiFeedbackMessage(null)}
              className="text-[#a8a29e] hover:text-[#f5f5f4]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Flat Editorial Search Dropdown */}
        {showDropdown && (
          <div className="mt-1.5 w-full sm:w-[620px] bg-[#fbf9f6] dark:bg-[#181716] border border-[#e7e5e4] dark:border-[#292524] rounded-xs shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden animate-in fade-in duration-100 max-h-[75dvh] overflow-y-auto">
            
            {/* Loading indicator */}
            {isSearching && (
              <div className="p-2.5 text-xs text-[#78716c] flex items-center gap-2 border-b border-[#e7e5e4] dark:border-[#292524] bg-[#f5f2eb]/60 dark:bg-[#211f1d]/60 font-mono">
                <Loader2 className="w-3 h-3 text-[#8b3a24] animate-spin" />
                <span>Searching Indian localities and properties...</span>
              </div>
            )}

            {/* SECTION: MATCHING PROPERTIES */}
            {matchingProperties.length > 0 && (
              <div className="border-b border-[#e7e5e4] dark:border-[#292524]">
                <div className="text-[10px] uppercase font-mono tracking-widest text-[#78716c] px-3 pt-2.5 pb-1">
                  Matching properties ({matchingProperties.length})
                </div>

                <div className="divide-y divide-[#e7e5e4] dark:divide-[#292524]">
                  {matchingProperties.map((prop, idx) => {
                    const isSelected = highlightedIndex === idx;
                    return (
                      <div
                        key={prop.id}
                        onClick={() => handleSelectMatchingProperty(prop)}
                        className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                          isSelected
                            ? 'bg-[#f5f2eb] dark:bg-[#211f1d]'
                            : 'hover:bg-[#f5f2eb]/80 dark:hover:bg-[#211f1d]/80'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[#1c1917] dark:text-[#f5f5f4] truncate">
                            {prop.title}
                          </div>
                          <div className="text-[11px] text-[#78716c] truncate">
                            {prop.area || prop.address}, {prop.city} • <span className="font-mono text-[10px]">{prop.category}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono text-xs font-semibold text-[#8b3a24]">
                            {formatIndianCurrency(prop.price, prop.type)}
                          </span>
                          <ArrowRight className="w-3 h-3 text-[#a8a29e]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION: LOCALITIES & CITIES */}
            {suggestions.length > 0 && (
              <div className="border-b border-[#e7e5e4] dark:border-[#292524]">
                <div className="text-[10px] uppercase font-mono tracking-widest text-[#78716c] px-3 pt-2.5 pb-1">
                  Localities & PIN codes
                </div>

                <div className="divide-y divide-[#e7e5e4] dark:divide-[#292524]">
                  {suggestions.map((item, idx) => {
                    const actualIdx = matchingProperties.length + idx;
                    const isSelected = highlightedIndex === actualIdx;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectLocation(item)}
                        className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                          isSelected
                            ? 'bg-[#f5f2eb] dark:bg-[#211f1d]'
                            : 'hover:bg-[#f5f2eb]/80 dark:hover:bg-[#211f1d]/80'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-[#8b3a24] flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-[#1c1917] dark:text-[#f5f5f4] truncate">
                              {item.title}
                            </div>
                            {item.subTitle && (
                              <div className="text-[11px] text-[#78716c] truncate">
                                {item.subTitle}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 text-[#78716c] bg-[#e7e5e4]/50 dark:bg-[#292524] rounded-xs flex-shrink-0">
                          {item.type}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ASYMMETRICAL EDITORIAL FOLIO: MARKET OVERVIEW (60%) & PROPERTY TYPES (40%) */}
            {query.trim().length < 2 && (
              <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#e7e5e4] dark:divide-[#292524]">
                
                {/* 60% Column: Key Micro-Markets */}
                <div className="md:col-span-7 p-3 sm:p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#78716c]">
                      Market overview
                    </span>
                    <span className="text-[10px] font-mono text-[#8b3a24]">
                      YoY change
                    </span>
                  </div>

                  <div className="divide-y divide-[#e7e5e4]/60 dark:divide-[#292524]/60">
                    {MARKET_HUBS.map((loc) => (
                      <div
                        key={loc.title}
                        onClick={() =>
                          handleSelectLocation({
                            id: loc.title,
                            title: `${loc.title}, ${loc.city}`,
                            subTitle: loc.subTitle,
                            coordinates: loc.coords,
                            type: 'area'
                          })
                        }
                        className="py-1.5 px-1.5 hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d] cursor-pointer transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-[#1c1917] dark:text-[#f5f5f4] truncate">
                            {loc.title} <span className="text-[#a8a29e] font-normal">• {loc.city}</span>
                          </div>
                          <div className="text-[10px] text-[#78716c] truncate">
                            {loc.subTitle}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="font-mono text-[11px] text-[#1c1917] dark:text-[#f5f5f4]">
                            {loc.rate}
                          </div>
                          <div className="font-mono text-[10px] text-[#8b3a24]">
                            {loc.change}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 40% Column: Curated Property Types */}
                <div className="md:col-span-5 p-3 sm:p-3.5 bg-[#f5f2eb]/40 dark:bg-[#211f1d]/40">
                  <div className="text-[10px] uppercase font-mono tracking-widest text-[#78716c] mb-2">
                    Property type
                  </div>

                  <div className="space-y-1">
                    {PROPERTY_TYPES.map((cat) => {
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
                          className={`w-full text-left px-2 py-1.5 rounded-xs text-xs transition-colors flex items-center justify-between ${
                            isActive
                              ? 'bg-[#1c1917] dark:bg-[#f5f5f4] text-[#fbf9f6] dark:text-[#1c1917] font-medium'
                              : 'hover:bg-[#f5f2eb] dark:hover:bg-[#211f1d] text-[#1c1917] dark:text-[#f5f5f4]'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-xs leading-tight">
                              {cat.label}
                            </div>
                            <div className={`text-[10px] ${isActive ? 'text-[#a8a29e]' : 'text-[#78716c]'}`}>
                              {cat.note}
                            </div>
                          </div>

                          {isActive && <Check className="w-3 h-3 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* EMPTY STATE */}
            {query.trim().length >= 2 && !isSearching && suggestions.length === 0 && matchingProperties.length === 0 && (
              <div className="p-4 text-left space-y-2">
                <div className="text-xs text-[#1c1917] dark:text-[#f5f5f4]">
                  No properties matching "<strong>{query}</strong>"
                </div>
                <p className="text-[11px] text-[#78716c] max-w-sm">
                  Search by major locality (e.g. Kokapet, Indiranagar, Bandra), or run an AI natural language query.
                </p>
                <button
                  type="button"
                  onClick={handleExecuteAISearch}
                  className="px-2.5 py-1 text-xs font-medium text-[#8b3a24] bg-[#fbf2ed] hover:bg-[#f7e6dc] border border-[#ecd5c8] rounded-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Search with AI for "{query}"</span>
                  <CornerDownLeft className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};

export default FloatingHeader;
