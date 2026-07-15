import { useState, useEffect, useRef, useCallback } from 'react';
import { SEARCH_CONFIG, POPULAR_BRANDS } from '~/constants';

// Icons (using simple SVG icons for now)

const ClockIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const cn = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' ');

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'brand' | 'recent';
  category?: string;
}

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onSearch: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

// Brand suggestions use the platform taxonomy. We deliberately avoid invented
// models or "popular" queries: a suggestion must not imply a live offer exists.
const generateSuggestions = (query: string): SearchSuggestion[] => {
  if (!query || query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
    return [];
  }

  const suggestions: SearchSuggestion[] = [];
  const lowerQuery = query.toLowerCase();

  // Brand suggestions
  POPULAR_BRANDS.forEach((brand, index) => {
    if (brand.toLowerCase().includes(lowerQuery)) {
      suggestions.push({
        id: `brand-${index}`,
        text: brand,
        type: 'brand',
        category: 'Mărci'
      });
    }
  });

  return suggestions.slice(0, SEARCH_CONFIG.MAX_SUGGESTIONS);
};

// Get recent searches from localStorage
const getRecentSearches = (): SearchSuggestion[] => {
  try {
    const stored = localStorage.getItem('AutoFans_recent_searches');
    if (stored) {
      const recent = JSON.parse(stored) as string[];
      return recent.slice(0, SEARCH_CONFIG.MAX_RECENT_SEARCHES).map((text, index) => ({
        id: `recent-${index}`,
        text,
        type: 'recent' as const
      }));
    }
  } catch (error) {
    console.warn('Failed to load recent searches:', error);
  }
  return [];
};

// Save search to recent searches
const saveRecentSearch = (query: string) => {
  if (!query.trim()) return;
  
  try {
    const stored = localStorage.getItem('AutoFans_recent_searches');
    let recent: string[] = stored ? JSON.parse(stored) : [];
    
    // Remove if already exists
    recent = recent.filter(item => item !== query);
    
    // Add to beginning
    recent.unshift(query);
    
    // Keep only last N searches
    recent = recent.slice(0, SEARCH_CONFIG.MAX_RECENT_SEARCHES);
    
    localStorage.setItem('AutoFans_recent_searches', JSON.stringify(recent));
  } catch (error) {
    console.warn('Failed to save recent search:', error);
  }
};

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Caută mașina dorită...",
  value = "",
  onSearch,
  onSuggestionSelect,
  className,
  autoFocus = false,
  disabled = false
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Keep the input aligned with URL searches and with the reset-filters
  // action. The component still owns typing responsiveness between submits.
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (searchQuery.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH) {
        setSuggestions(generateSuggestions(searchQuery));
      } else {
        setSuggestions([]);
      }
    }, SEARCH_CONFIG.DEBOUNCE_DELAY);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedIndex(-1);
    
    if (newQuery.trim()) {
      debouncedSearch(newQuery);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (query.trim()) {
      setIsOpen(true);
    } else {
      // Recent searches belong to this browser; never fabricate popularity.
      const recent = getRecentSearches();
      setSuggestions(recent);
      setIsOpen(recent.length > 0);
    }
  };

  // Handle input blur
  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay closing to allow clicking on suggestions
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
      }
    }, 150);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setIsOpen(false);
    saveRecentSearch(suggestion.text);
    onSuggestionSelect?.(suggestion);
    onSearch(suggestion.text);
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      saveRecentSearch(query.trim());
      onSearch(query.trim());
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (query.trim()) {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Group suggestions by category
  const groupedSuggestions = suggestions.reduce((groups, suggestion) => {
    if (suggestion.type === 'recent') {
      if (!groups.recent) groups.recent = [];
      groups.recent.push(suggestion);
    } else {
      const category = suggestion.category || 'Sugestii';
      if (!groups[category]) groups[category] = [];
      groups[category].push(suggestion);
    }
    return groups;
  }, {} as Record<string, SearchSuggestion[]>);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Clean input container - similar to hero style */}
        <div className="relative bg-secondary-800/50 backdrop-blur-sm border border-accent-gold/30 rounded-xl overflow-hidden hover:border-accent-gold/50 transition-colors duration-300">
          {/* Search icon */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-accent-gold" />
          </div>

          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            disabled={disabled}
            aria-label={placeholder}
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={isOpen ? 'search-suggestions' : undefined}
            className={cn(
              'block w-full pl-12 pr-16 py-3 bg-transparent border-0',
              'placeholder-white/70 text-white',
              'focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-accent-gold',
              'transition-all duration-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Șterge căutarea"
              className="absolute inset-y-0 right-4 flex items-center text-accent-gold hover:text-accent-gold transition-colors"
            >
              <XIcon />
            </button>
          )}
        </div>
      </form>

      {isOpen && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            id="search-suggestions"
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 animate-[autofans-pop-in_160ms_ease-out] overflow-y-auto rounded-xl border border-white/20 bg-secondary-900/90 shadow-2xl backdrop-blur-xl"
          >
            <div className="py-2">
                {Object.entries(groupedSuggestions).map(([category, items]) => (
                  <div key={category}>
                    {category !== 'undefined' && (
                      <div className="px-4 py-2 text-xs font-semibold text-accent-gold uppercase tracking-wide border-b border-white/10 flex items-center bg-white/5">
                        {category === 'recent' && <ClockIcon className="mr-2 w-3 h-3 text-accent-gold" />}
                        {category === 'recent' ? 'Căutări recente' : category}
                      </div>
                    )}
                    {items.map((suggestion) => {
                      const globalIndex = suggestions.indexOf(suggestion);
                      return (
                        <button
                          key={suggestion.id}
                          type="button"
                          role="option"
                          aria-selected={globalIndex === selectedIndex}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={cn(
                            "w-full px-4 py-3 text-left hover:bg-accent-gold/10 transition-colors flex items-center text-white hover:text-accent-gold",
                            globalIndex === selectedIndex && "bg-accent-gold/20 text-accent-gold"
                          )}
                        >
                          <div className="flex items-center flex-1">
                            {suggestion.type === 'recent' && (
                              <ClockIcon className="mr-3 w-4 h-4 text-accent-gold" />
                            )}
                            {suggestion.type === 'brand' && (
                              <SearchIcon className="mr-3 w-4 h-4 text-accent-gold" />
                            )}
                            <span className="text-white">{suggestion.text}</span>
                          </div>
                          {suggestion.type === 'brand' && (
                            <span className="text-xs text-accent-gold bg-accent-gold/10 px-2 py-1 rounded-full border border-accent-gold/30">
                              Marcă
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
            </div>
          </div>
        )}
    </div>
  );
};
