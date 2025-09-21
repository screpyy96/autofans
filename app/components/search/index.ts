// Search components
export { SearchBar } from './SearchBar';
export type { SearchBarProps, SearchSuggestion } from './SearchBar';

export { FilterPanel } from './FilterPanel';
export type { FilterPanelProps } from './FilterPanel';

export { SortControls } from './SortControls';
export type { SortControlsProps, ViewMode, ResultsPerPage } from './SortControls';

export { SavedSearches } from './SavedSearches';

// Hooks
export { useSearch } from '~/hooks/useSearch';
export type { UseSearchOptions, UseSearchReturn } from '~/hooks/useSearch';

export { useFilters } from '~/hooks/useFilters';
export type { UseFiltersOptions, UseFiltersReturn } from '~/hooks/useFilters';

export { useSortAndView } from '~/hooks/useSortAndView';
export type { UseSortAndViewOptions, UseSortAndViewReturn } from '~/hooks/useSortAndView';

// Services
export { searchService } from '~/services/searchService';
export type { SearchSuggestionOptions, SearchResult } from '~/services/searchService';