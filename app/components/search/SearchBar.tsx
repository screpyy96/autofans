import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '~/lib/utils';
import { Input } from '~/components/ui/Input';
import { Spinner } from '~/components/ui/Spinner';
import { SEARCH_CONFIG, POPULAR_BRANDS } from '~/constants';

// Icons (using simple SVG icons for now)

const ClockIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrendingIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'brand' | 'model' | 'query' | 'recent' | 'popular';
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

// Mock suggestions generator (in real app, this would come from API)
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

  // Model suggestions (mock data)
  const popularModels = [
    'Seria 3', 'Seria 5', 'X3', 'X5', // BMW
    'A4', 'A6', 'Q5', 'Q7', // Audi
    'C-Class', 'E-Class', 'GLC', 'GLE', // Mercedes
    'Golf', 'Passat', 'Tiguan', 'Touareg', // VW
    'Octavia', 'Superb', 'Kodiaq', // Skoda
  ];

  popularModels.forEach((model, index) => {
    if (model.toLowerCase().includes(lowerQuery)) {
      suggestions.push({
        id: `model-${index}`,
        text: model,
        type: 'model',
        category: 'Modele'
      });
    }
  });

  // Generic query suggestions
  const queryTemplates = [
    `${query} diesel`,
    `${query} automatic`,
    `${query} 2020`,
    `${query} sub 30000`,
  ];

  queryTemplates.forEach((template, index) => {
    if (template !== query) {
      suggestions.push({
        id: `query-${index}`,
        text: template,
        type: 'query'
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

// Popular searches (mock data)
const getPopularSearches = (): SearchSuggestion[] => [
  { id: 'popular-1', text: 'BMW Seria 3', type: 'popular' },
  { id: 'popular-2', text: 'Audi A4', type: 'popular' },
  { id: 'popular-3', text: 'VW Golf', type: 'popular' },
  { id: 'popular-4', text: 'Mercedes C-Class', type: 'popular' },
  { id: 'popular-5', text: 'Skoda Octavia', type: 'popular' },
];

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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (searchQuery.length >= SEARCH_CONFIG.MIN_QUERY_LENGTH) {
        setIsLoading(true);
        // Simulate API delay
        setTimeout(() => {
          const newSuggestions = generateSuggestions(searchQuery);
          setSuggestions(newSuggestions);
          setIsLoading(false);
        }, 150);
      } else {
        setSuggestions([]);
        setIsLoading(false);
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
      // Show recent and popular searches when focused with empty query
      const recent = getRecentSearches();
      const popular = getPopularSearches();
      setSuggestions([...recent, ...popular]);
      setIsOpen(true);
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
    } else if (suggestion.type === 'popular') {
      if (!groups.popular) groups.popular = [];
      groups.popular.push(suggestion);
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
        <Input
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
          leftIcon={<SearchIcon className="h-5 w-5 text-white/80" />}
          leftIconClassName="text-white/80"
          className={isLoading ? "pr-20" : "pr-16"}
        />
        {isLoading && (
          <div className="pointer-events-none absolute inset-y-0 right-12 flex items-center text-accent-gold">
            <Spinner size="sm" />
          </div>
        )}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-4 flex items-center text-white/60 hover:text-accent-gold transition-colors"
          >
            <XIcon />
          </button>
        )}
      </form>

      <AnimatePresence>
        {isOpen && (suggestions.length > 0 || isLoading) && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 bg-glass backdrop-blur-xl border border-premium rounded-2xl shadow-modal max-h-96 overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-4 text-center">
                <Spinner size="sm" className="mx-auto" />
                <p className="text-sm text-gray-400 mt-2">Se caută...</p>
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(groupedSuggestions).map(([category, items]) => (
                  <div key={category}>
                    {category !== 'undefined' && (
                      <div className="px-4 py-2 text-xs font-semibold text-accent-gold uppercase tracking-wide border-b border-premium flex items-center">
                        {category === 'recent' && <ClockIcon className="mr-2" />}
                        {category === 'popular' && <TrendingIcon className="mr-2" />}
                        {category === 'recent' ? 'Căutări recente' : 
                         category === 'popular' ? 'Căutări populare' : category}
                      </div>
                    )}
                    {items.map((suggestion, index) => {
                      const globalIndex = suggestions.indexOf(suggestion);
                      return (
                        <motion.button
                          key={suggestion.id}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={cn(
                            "w-full px-4 py-3 text-left hover:bg-accent-gold/10 transition-colors flex items-center text-gray-300 hover:text-accent-gold",
                            globalIndex === selectedIndex && "bg-accent-gold/20 text-accent-gold"
                          )}
                          whileHover={{ backgroundColor: "rgba(212, 175, 55, 0.1)" }}
                        >
                          <div className="flex items-center flex-1">
                            {suggestion.type === 'recent' && (
                              <ClockIcon className="mr-3 text-accent-gold" />
                            )}
                            {suggestion.type === 'popular' && (
                              <TrendingIcon className="mr-3 text-accent-gold" />
                            )}
                            {(suggestion.type === 'brand' || suggestion.type === 'model') && (
                              <SearchIcon className="mr-3 text-accent-gold" />
                            )}
                            <span className="text-white">{suggestion.text}</span>
                          </div>
                          {suggestion.type === 'brand' && (
                            <span className="text-xs text-accent-gold bg-accent-gold/20 px-2 py-1 rounded border border-accent-gold/30">
                              Marcă
                            </span>
                          )}
                          {suggestion.type === 'model' && (
                            <span className="text-xs text-accent-gold bg-accent-gold/20 px-2 py-1 rounded border border-accent-gold/30">
                              Model
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
