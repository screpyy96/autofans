import { SearchBar } from '~/components/search/SearchBar';
import { SortControls } from '~/components/search';
import type { ViewMode } from '~/components/search';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
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
    <div className="mb-8 sm:mb-12">
      {/* Clean Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
          Caută mașini
        </h1>
        <p className="text-lg text-gray-300 mx-auto  leading-relaxed">
          Găsește mașina perfectă din peste{' '}
          <span className="text-accent-gold font-semibold">15,000</span>{' '}
          de anunțuri verificate
        </p>
      </div>

      {/* Clean Search Container - Similar to Hero */}
      <div className="rounded-[26px] border border-white/10 bg-white/5 p-1 backdrop-blur-xl shadow-[0_20px_60px_rgba(10,18,36,0.4)]">
        <div className="rounded-[24px] border border-white/10 bg-secondary-900/40 shadow-inner overflow-hidden">
          
          {/* Content */}
          <div className="relative p-8 sm:p-10 lg:p-12 space-y-8">
            {/* Search Bar Section */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:gap-12">
              <div className="w-full xl:flex-1">
                <SearchBar
                  onSearch={onSearch}
                  placeholder="Caută după marcă, model, oraș..."
                  className="w-full"
                />
              </div>

              {/* Clean Results Info */}
              <div className="flex w-full flex-col gap-3 mt-6 xl:mt-0 xl:w-auto xl:items-end xl:text-right">
                <div className="flex flex-wrap items-center gap-3 justify-center xl:justify-end">
                  {/* Results Badge */}
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-semibold text-white backdrop-blur-sm">
                    <div className="w-2 h-2 bg-accent-gold rounded-full"></div>
                    {displayedCarsCount} rezultate
                  </span>
                  
                  {/* Comparison Badge */}
                  {comparisonCarsCount > 0 && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-accent-gold/30 bg-accent-gold/15 px-4 py-2 font-semibold text-accent-gold backdrop-blur-sm">
                      <div className="w-2 h-2 bg-accent-gold rounded-full animate-pulse"></div>
                      {comparisonCarsCount} în comparație
                    </span>
                  )}
                </div>
                
                {/* Status Indicator */}
                <p className="text-xs text-white/50 sm:text-sm">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  Actualizat automat după aplicarea filtrelor
                </p>
              </div>
            </div>

            {/* Clean Controls Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant={showFilters ? "primary" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border-2 transition-all duration-200",
                    showFilters
                      ? "bg-gold-gradient text-secondary-900 shadow-lg shadow-accent-gold/25 border-accent-gold"
                      : "bg-white/10 text-white hover:bg-accent-gold/10 border-white/20 hover:border-accent-gold/50"
                  )}
                >
                  <Filter className="h-4 w-4" />
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
                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition-all duration-200 hover:bg-red-500/20 hover:border-red-500/30"
                  >
                    <X className="h-4 w-4" />
                    Șterge filtrele
                  </button>
                )}
              </div>

              <div className="sm:ml-auto">
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
