import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '~/lib/utils';
import { Select } from '~/components/ui/Select';
import type { SortOption } from '~/types';
import { SORT_OPTIONS } from '~/constants';

// Icons
const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const SortIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
  </svg>
);

export type ViewMode = 'grid' | 'list';
export type ResultsPerPage = 12 | 24 | 48;

export interface SortControlsProps {
  // Sort options
  sortOptions?: readonly SortOption[] | SortOption[];
  activeSort: string;
  onSortChange: (sortValue: string) => void;
  
  // View mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  
  // Results per page
  resultsPerPage: ResultsPerPage;
  onResultsPerPageChange: (count: ResultsPerPage) => void;
  
  // Results info
  totalResults?: number;
  currentPage?: number;
  showResultsInfo?: boolean;
  
  // Styling
  className?: string;
  compact?: boolean;
}

// View mode toggle component
interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  compact?: boolean;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onViewModeChange,
  compact = false
}) => {
  return (
    <div className="flex items-center bg-secondary-800/80 border border-accent-gold/30 rounded-xl p-1 shadow-[0_4px_16px_rgba(15,23,42,0.35)] backdrop-blur hover:shadow-glow transition-shadow">
      <motion.button
        onClick={() => onViewModeChange('grid')}
        className={cn(
          "flex items-center justify-center rounded-lg transition-all duration-200",
          compact ? "px-2 py-1" : "px-3 py-2",
          viewMode === 'grid'
            ? "bg-gold-gradient text-secondary-900 shadow-card"
            : "text-white/60 hover:text-accent-gold hover:bg-accent-gold/10"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <GridIcon />
        {!compact && <span className="ml-2 text-sm font-medium">Grid</span>}
      </motion.button>
      
      <motion.button
        onClick={() => onViewModeChange('list')}
        className={cn(
          "flex items-center justify-center rounded-lg transition-all duration-200",
          compact ? "px-2 py-1" : "px-3 py-2",
          viewMode === 'list'
            ? "bg-gold-gradient text-secondary-900 shadow-card"
            : "text-white/60 hover:text-accent-gold hover:bg-accent-gold/10"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ListIcon />
        {!compact && <span className="ml-2 text-sm font-medium">Listă</span>}
      </motion.button>
    </div>
  );
};

// Results per page selector
interface ResultsPerPageSelectorProps {
  resultsPerPage: ResultsPerPage;
  onResultsPerPageChange: (count: ResultsPerPage) => void;
  compact?: boolean;
}

const ResultsPerPageSelector: React.FC<ResultsPerPageSelectorProps> = ({
  resultsPerPage,
  onResultsPerPageChange,
  compact = false
}) => {
  const options = [
    { value: 12, label: '12' },
    { value: 24, label: '24' },
    { value: 48, label: '48' }
  ];

  return (
    <div className="flex items-center space-x-2">
      {!compact && (
        <span className="text-sm text-white/70 whitespace-nowrap">
          Rezultate pe pagină:
        </span>
      )}
      <Select
        value={resultsPerPage.toString()}
        onChange={(e) => onResultsPerPageChange(Number(e.target.value) as ResultsPerPage)}
        options={options.map(opt => ({ value: opt.value.toString(), label: opt.label }))}
        className="w-20"
      />
    </div>
  );
};

// Sort dropdown component
interface SortDropdownProps {
  sortOptions: readonly SortOption[] | SortOption[];
  activeSort: string;
  onSortChange: (sortValue: string) => void;
  compact?: boolean;
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  sortOptions,
  activeSort,
  onSortChange,
  compact = false
}) => {
  return (
    <div className="flex items-center space-x-2">
      {!compact && (
        <div className="flex items-center space-x-1 text-white/70">
          <SortIcon />
          <span className="text-sm whitespace-nowrap">Sortează după:</span>
        </div>
      )}
      <Select
        value={activeSort}
        onChange={(e) => onSortChange(e.target.value)}
        options={sortOptions.map(option => ({
          value: option.value,
          label: option.label
        }))}
        className={compact ? "w-40" : "w-48"}
        placeholder="Selectează sortarea"
      />
    </div>
  );
};

// Results info component
interface ResultsInfoProps {
  totalResults: number;
  currentPage: number;
  resultsPerPage: number;
  compact?: boolean;
}

const ResultsInfo: React.FC<ResultsInfoProps> = ({
  totalResults,
  currentPage,
  resultsPerPage,
  compact = false
}) => {
  const startResult = (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(currentPage * resultsPerPage, totalResults);

  if (compact) {
    return (
      <span className="text-sm text-white">
        {totalResults.toLocaleString()} rezultate
      </span>
    );
  }

  return (
    <div className="text-sm text-white">
      <span>
        Afișează <strong>{startResult.toLocaleString()}</strong> - <strong>{endResult.toLocaleString()}</strong> din <strong>{totalResults.toLocaleString()}</strong> rezultate
      </span>
    </div>
  );
};

// Main SortControls component
export const SortControls: React.FC<SortControlsProps> = ({
  sortOptions = SORT_OPTIONS,
  activeSort,
  onSortChange,
  viewMode,
  onViewModeChange,
  resultsPerPage,
  onResultsPerPageChange,
  totalResults,
  currentPage = 1,
  showResultsInfo = true,
  className,
  compact = false
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle view mode change with animation
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    if (mode !== viewMode) {
      setIsAnimating(true);
      onViewModeChange(mode);
      
      // Reset animation state after transition
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  }, [viewMode, onViewModeChange]);

  if (compact) {
    return (
      <div className={cn("flex items-center justify-between gap-4", className)}>
        <div className="flex items-center space-x-4">
          <SortDropdown
            sortOptions={sortOptions}
            activeSort={activeSort}
            onSortChange={onSortChange}
            compact
          />
          <ViewModeToggle
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            compact
          />
        </div>
        
        <div className="flex items-center space-x-4">
          {showResultsInfo && totalResults !== undefined && (
            <ResultsInfo
              totalResults={totalResults}
              currentPage={currentPage}
              resultsPerPage={resultsPerPage}
              compact
            />
          )}
          <ResultsPerPageSelector
            resultsPerPage={resultsPerPage}
            onResultsPerPageChange={onResultsPerPageChange}
            compact
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "bg-white rounded-lg shadow-sm border border-gray-200 p-4",
        className
      )}
      animate={isAnimating ? { scale: [1, 0.98, 1] } : {}}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <SortDropdown
            sortOptions={sortOptions}
            activeSort={activeSort}
            onSortChange={onSortChange}
          />
          
          <div className="h-6 w-px bg-gray-300" />
          
          <ViewModeToggle
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />
        </div>
        
        <div className="flex items-center space-x-6">
          {showResultsInfo && totalResults !== undefined && (
            <>
              <ResultsInfo
                totalResults={totalResults}
                currentPage={currentPage}
                resultsPerPage={resultsPerPage}
              />
              <div className="h-6 w-px bg-gray-300" />
            </>
          )}
          
          <ResultsPerPageSelector
            resultsPerPage={resultsPerPage}
            onResultsPerPageChange={onResultsPerPageChange}
          />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-between">
          <ViewModeToggle
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />
          
          {totalResults !== undefined && (
            <ResultsInfo
              totalResults={totalResults}
              currentPage={currentPage}
              resultsPerPage={resultsPerPage}
              compact
            />
          )}
        </div>
        
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1">
            <SortDropdown
              sortOptions={sortOptions}
              activeSort={activeSort}
              onSortChange={onSortChange}
              compact
            />
          </div>
          
          <ResultsPerPageSelector
            resultsPerPage={resultsPerPage}
            onResultsPerPageChange={onResultsPerPageChange}
            compact
          />
        </div>
      </div>
    </motion.div>
  );
};
