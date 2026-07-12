import { SearchBar } from '~/components/search/SearchBar';
import { SortControls } from '~/components/search';
import type { ViewMode } from '~/components/search';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { Filter, X } from 'lucide-react';
import { cn } from '~/lib/utils';

interface SearchHeaderProps {
  onSearch: (query: string) => void;
  displayedCarsCount: number;
  comparisonCarsCount: number;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  activeFilterCount: number;
  hasActiveFilters: boolean;
  resetFilters: () => void;
  activeSort: string;
  setActiveSort: (sort: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export function SearchHeader({
  onSearch,
  displayedCarsCount,
  comparisonCarsCount,
  showFilters,
  setShowFilters,
  activeFilterCount,
  hasActiveFilters,
  resetFilters,
  activeSort,
  setActiveSort,
  viewMode,
  setViewMode,
}: SearchHeaderProps) {
  return (
    <div className="mb-6 sm:mb-10 w-full">
      
      {/* Title Section (Hidden on mobile to save space, visible on desktop) */}
      <div className="hidden sm:block text-center mb-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
          Caută mașini
        </h1>
        <p className="text-lg text-gray-300 mx-auto leading-relaxed">
          Găsește mașina perfectă din peste{' '}
          <span className="text-accent-gold font-semibold">15,000</span>{' '}
          de anunțuri verificate
        </p>
      </div>

      {/* Main Container with Glassmorphism */}
      <div className="rounded-[22px] border border-white/10 bg-white/5 p-1 backdrop-blur-xl shadow-[0_20px_60px_rgba(10,18,36,0.4)]">
        <div className="rounded-[20px] border border-white/10 bg-secondary-900/40 shadow-inner overflow-hidden">
          
          {/* Content (Compact padding on mobile, standard on desktop) */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-4">
            
            {/* Search Input field */}
            <div className="w-full">
              <SearchBar
                onSearch={onSearch}
                placeholder="Caută după marcă, model, oraș..."
                className="w-full"
              />
            </div>

            {/* Controls Row (Filters, sorting, grid/list view toggle) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3.5 border-t border-white/5">
              
              {/* Left actions: Filters Toggle, Reset, and Count */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={showFilters ? "primary" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border text-xs py-2 px-3.5 transition-all",
                    showFilters
                      ? "bg-gold-gradient text-secondary-900 border-transparent shadow-glow font-bold"
                      : "bg-white/5 text-white border-white/10 hover:border-accent-gold/40 hover:bg-accent-gold/5 font-semibold"
                  )}
                >
                  <Filter className="h-3.5 w-3.5 text-accent-gold" />
                  Filtre
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" size="sm" className="bg-red-500/20 text-red-300 border-red-500/30">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>

                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] sm:text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Șterge
                  </button>
                )}

                {/* Inline Count Indicator */}
                <span className="text-xs text-gray-400 ml-1.5 font-medium">
                  {displayedCarsCount} {displayedCarsCount === 1 ? 'mașină găsită' : 'mașini găsite'}
                </span>
                
                {/* Comparison Badge (small inline) */}
                {comparisonCarsCount > 0 && (
                  <Badge variant="primary" className="bg-accent-gold/15 text-accent-gold border-accent-gold/20 text-[10px] py-0.5 px-2">
                    {comparisonCarsCount} în comparație
                  </Badge>
                )}
              </div>

              {/* Right actions: Sorting Dropdown & Layout Grid/List Toggle */}
              <div className="flex items-center gap-2.5 sm:ml-auto">
                <SortControls
                  activeSort={activeSort}
                  onSortChange={setActiveSort}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  resultsPerPage={12}
                  onResultsPerPageChange={() => {}}
                  totalResults={displayedCarsCount}
                  showResultsInfo={false}
                  compact={true}
                />
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
