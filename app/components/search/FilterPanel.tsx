import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/Button';
import { Checkbox } from '~/components/ui/Checkbox';
import { Input } from '~/components/ui/Input';
import '~/styles/range-slider.css';
import type { FilterState, PriceRange, YearRange, MileageRange } from '~/types';
import { FuelType, TransmissionType, ConditionType } from '~/types';
import { 
  POPULAR_BRANDS, 
  FUEL_TYPE_OPTIONS, 
  TRANSMISSION_OPTIONS, 
  CONDITION_OPTIONS,
  PRICE_LIMITS,
  YEAR_LIMITS,
  MILEAGE_LIMITS,
  ROMANIAN_COUNTIES
} from '~/constants';
import { useResponsive } from '~/hooks/useResponsive';

// Icons
const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const BookmarkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

// Range Slider Component
interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  formatValue?: (value: number) => string;
  className?: string;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  step = 1,
  formatValue = (v) => v.toString(),
  className
}) => {
  const [minValue, maxValue] = value;
  
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), maxValue - step);
    onChange([newMin, maxValue]);
  };
  
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), minValue + step);
    onChange([minValue, newMax]);
  };

  const minPercent = ((minValue - min) / (max - min)) * 100;
  const maxPercent = ((maxValue - min) / (max - min)) * 100;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative h-2">
        <div className="absolute inset-0 rounded-full bg-white/25" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/45 via-white/15 to-transparent" aria-hidden="true" />
        {/* Active range */}
        <div 
          className="absolute h-2 rounded-full bg-gradient-to-r from-accent-gold via-primary-400 to-primary-700 shadow-[0_0_12px_rgba(212,175,55,0.35)]"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(0, maxPercent - minPercent)}%`
          }}
        ></div>
        
        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          value={minValue}
          step={step}
          onChange={handleMinChange}
          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
        />
        
        {/* Max slider */}
        <input
          type="range"
          min={min}
          max={max}
          value={maxValue}
          step={step}
          onChange={handleMaxChange}
          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
        />
      </div>
      
      {/* Value display */}
      <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wide text-white/60">
        <span className="tabular-nums drop-shadow">{formatValue(minValue)}</span>
        <span className="tabular-nums drop-shadow">{formatValue(maxValue)}</span>
      </div>
    </div>
  );
};

// Filter Group Component
interface FilterGroupProps {
  title: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  count?: number;
}

const FilterGroup: React.FC<FilterGroupProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  count
}) => {
  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-white transition-all duration-200 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
      >
        <div className="flex items-center space-x-3">
          {icon && <div className="text-white/50">{icon}</div>}
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">{title}</span>
          {count !== undefined && count > 0 && (
            <span className="rounded-full bg-accent-gold/15 px-2 py-0.5 text-xs font-semibold text-accent-gold">
              {count}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-5 pb-5 pt-0 text-white/70">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Quick Filter Chip Component
interface QuickFilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  onRemove?: () => void;
}

const QuickFilterChip: React.FC<QuickFilterChipProps> = ({
  label,
  isActive,
  onClick,
  onRemove
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-200",
        isActive
          ? "bg-accent-gold/20 text-white border border-accent-gold/60 shadow-[0_0_18px_rgba(212,175,55,0.25)]"
          : "bg-white/6 text-white/70 border border-white/10 hover:bg-white/12 hover:text-white"
      )}
    >
      <span>{label}</span>
      {isActive && onRemove && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onRemove();
            }
          }}
          className="ml-1 rounded-full bg-white/10 p-1 text-accent-gold hover:bg-accent-gold/30 focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
        >
          <XIcon />
        </span>
      )}
    </button>
  );
};

// Main FilterPanel Component
export interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  onSaveSearch?: (name: string, filters: FilterState) => void;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  onApply?: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onReset,
  onSaveSearch,
  className,
  isCollapsed = false,
  onToggleCollapse,
  onClose,
  onApply
}) => {
  const { isMobile, isTouchDevice } = useResponsive();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    price: true,
    brand: !isMobile, // Collapse brand on mobile by default
    specs: false,
    location: false,
    features: false
  });

  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Toggle group open/closed
  const toggleGroup = useCallback((groupName: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  }, []);

  // Update filters helper
  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  }, [filters, onFiltersChange]);

  // Handle brand selection
  const handleBrandChange = useCallback((brand: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const currentBrands = filters.brand || [];
    const newBrands = checked
      ? [...currentBrands, brand]
      : currentBrands.filter(b => b !== brand);
    
    updateFilters({ 
      brand: newBrands.length > 0 ? newBrands : undefined,
      model: undefined // Reset model when brand changes
    });
  }, [filters.brand, updateFilters]);

  // Handle fuel type selection
  const handleFuelTypeChange = useCallback((fuelType: FuelType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const currentTypes = filters.fuelType || [];
    const newTypes = checked
      ? [...currentTypes, fuelType]
      : currentTypes.filter(t => t !== fuelType);
    
    updateFilters({ fuelType: newTypes.length > 0 ? newTypes : undefined });
  }, [filters.fuelType, updateFilters]);

  // Handle transmission selection
  const handleTransmissionChange = useCallback((transmission: TransmissionType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const currentTypes = filters.transmission || [];
    const newTypes = checked
      ? [...currentTypes, transmission]
      : currentTypes.filter(t => t !== transmission);
    
    updateFilters({ transmission: newTypes.length > 0 ? newTypes : undefined });
  }, [filters.transmission, updateFilters]);

  // Handle condition selection
  const handleConditionChange = useCallback((condition: ConditionType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const currentConditions = filters.condition || [];
    const newConditions = checked
      ? [...currentConditions, condition]
      : currentConditions.filter(c => c !== condition);
    
    updateFilters({ condition: newConditions.length > 0 ? newConditions : undefined });
  }, [filters.condition, updateFilters]);

  // Handle price range change
  const handlePriceRangeChange = useCallback((range: [number, number]) => {
    updateFilters({ 
      priceRange: { min: range[0], max: range[1] }
    });
  }, [updateFilters]);

  // Handle year range change
  const handleYearRangeChange = useCallback((range: [number, number]) => {
    updateFilters({ 
      yearRange: { min: range[0], max: range[1] }
    });
  }, [updateFilters]);

  // Handle mileage range change
  const handleMileageRangeChange = useCallback((range: [number, number]) => {
    updateFilters({ 
      mileageRange: { min: range[0], max: range[1] }
    });
  }, [updateFilters]);

  // Handle save search
  const handleSaveSearch = useCallback(() => {
    if (saveSearchName.trim() && onSaveSearch) {
      onSaveSearch(saveSearchName.trim(), filters);
      setSaveSearchName('');
      setShowSaveDialog(false);
    }
  }, [saveSearchName, filters, onSaveSearch]);

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return true;
    return value !== undefined && value !== null;
  }).length;

  // Quick filters
  const quickFilters = [
    { 
      label: 'Diesel', 
      active: filters.fuelType?.includes(FuelType.DIESEL) || false, 
      onClick: () => {
        const isActive = filters.fuelType?.includes(FuelType.DIESEL);
        const currentTypes = filters.fuelType || [];
        const newTypes = isActive
          ? currentTypes.filter(t => t !== FuelType.DIESEL)
          : [...currentTypes, FuelType.DIESEL];
        updateFilters({ fuelType: newTypes.length > 0 ? newTypes : undefined });
      }
    },
    { 
      label: 'Automatic', 
      active: filters.transmission?.includes(TransmissionType.AUTOMATIC) || false, 
      onClick: () => {
        const isActive = filters.transmission?.includes(TransmissionType.AUTOMATIC);
        const currentTypes = filters.transmission || [];
        const newTypes = isActive
          ? currentTypes.filter(t => t !== TransmissionType.AUTOMATIC)
          : [...currentTypes, TransmissionType.AUTOMATIC];
        updateFilters({ transmission: newTypes.length > 0 ? newTypes : undefined });
      }
    },
    { 
      label: 'Sub 30.000 RON', 
      active: filters.priceRange?.max === 30000 || false, 
      onClick: () => updateFilters({ priceRange: { min: PRICE_LIMITS.MIN, max: 30000 } }) 
    },
    { 
      label: 'Recent (2020+)', 
      active: filters.yearRange?.min === 2020 || false, 
      onClick: () => updateFilters({ yearRange: { min: 2020, max: YEAR_LIMITS.MAX } }) 
    },
  ];

  if (isCollapsed) {
    return (
      <div
        className={cn(
          "rounded-3xl border border-primary-700/40 bg-secondary-900/70 text-white shadow-[0_20px_50px_rgba(8,12,24,0.55)] backdrop-blur-xl",
          className
        )}
      >
        <div className={cn("px-5 py-4", isMobile && "px-4 py-3")}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-gold/15 text-accent-gold">
                <FilterIcon />
              </span>
              <span className={cn("text-sm font-semibold uppercase tracking-wide", isMobile ? "text-xs" : "text-sm")}>Filtre</span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-accent-gold/20 px-2 py-0.5 text-[11px] font-semibold text-accent-gold">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleCollapse}
              className="border-white/20 text-white/80 hover:border-accent-gold hover:text-white"
            >
              Extinde
            </Button>
          </div>

        <div className={cn("mt-4 flex flex-wrap gap-1.5", isMobile && "mt-3 gap-1") }>
          {quickFilters.map((filter, index) => (
            <QuickFilterChip
              key={index}
              label={filter.label}
              isActive={filter.active}
                onClick={filter.onClick}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-primary-700/40 bg-secondary-900/70 text-white shadow-[0_25px_60px_rgba(8,12,24,0.55)] backdrop-blur-xl",
        className
      )}
    >
      <div className="pointer-events-none absolute -top-24 right-10 h-40 w-40 rounded-full bg-primary-600/25 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-28 left-6 h-36 w-36 rounded-full bg-accent-gold/25 blur-3xl" aria-hidden="true" />

      {/* Header */}
      <div className={cn("relative border-b border-white/12 px-5 py-5", isMobile && "px-4 py-4")}>
        <div className={cn("flex items-center justify-between", isMobile && "flex-col items-start space-y-3") }>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-gold/15 text-accent-gold">
              <FilterIcon />
            </span>
            <div>
              <h2 className={cn("text-lg font-semibold leading-snug", isMobile && "text-base")}>Filtre premium</h2>
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">personalizează căutarea</p>
            </div>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-accent-gold/20 px-2 py-0.5 text-xs font-semibold text-accent-gold">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className={cn("flex items-center gap-2", isMobile && "w-full flex-wrap justify-end") }>
            {isMobile && (onClose || onToggleCollapse) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (onClose) onClose();
                  else onToggleCollapse?.();
                }}
                className="h-9 w-9 rounded-xl border border-white/20 bg-white/10 p-0 text-white/70 hover:text-white"
                aria-label="Închide filtrele"
              >
                <XIcon />
              </Button>
            )}
            {onSaveSearch && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                className={cn("border-white/20 bg-white/12 text-white hover:border-accent-gold hover:text-white", isMobile && "flex-1 min-w-[130px]")}
              >
                <BookmarkIcon />
                {!isMobile && "Salvează"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={activeFilterCount === 0}
              className={cn(
                "border-white/20 bg-white/12 text-white transition-colors hover:border-accent-gold hover:text-white disabled:opacity-40",
                isMobile ? "flex-1 min-w-[130px]" : ""
              )}
            >
              Resetează
            </Button>
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className={cn("text-white/70 hover:text-white", isMobile ? "flex-1" : "")}
              >
                Minimizează
              </Button>
            )}
          </div>
        </div>

        <div className={cn("mt-3 flex flex-wrap gap-1.5", isMobile && "mt-2 gap-1")}>
          {quickFilters.map((filter, index) => (
            <QuickFilterChip
              key={index}
              label={filter.label}
              isActive={filter.active}
              onClick={filter.onClick}
            />
          ))}
        </div>
      </div>

      {/* Filter Groups */}
      <div className="relative divide-y divide-white/12 pb-20 text-sm sm:pb-10">
        {/* Price Range */}
        <FilterGroup
          title="Preț"
          isOpen={openGroups.price}
          onToggle={() => toggleGroup('price')}
          count={filters.priceRange ? 1 : 0}
        >
          <RangeSlider
            min={PRICE_LIMITS.MIN}
            max={PRICE_LIMITS.MAX}
            value={[
              filters.priceRange?.min || PRICE_LIMITS.DEFAULT_RANGE.MIN,
              filters.priceRange?.max || PRICE_LIMITS.DEFAULT_RANGE.MAX
            ]}
            onChange={handlePriceRangeChange}
            step={1000}
            formatValue={(value) => `${(value / 1000).toFixed(0)}k RON`}
          />
        </FilterGroup>

        {/* Year Range */}
        <FilterGroup
          title="An fabricație"
          isOpen={openGroups.specs}
          onToggle={() => toggleGroup('specs')}
          count={filters.yearRange ? 1 : 0}
        >
          <RangeSlider
            min={YEAR_LIMITS.MIN}
            max={YEAR_LIMITS.MAX}
            value={[
              filters.yearRange?.min || YEAR_LIMITS.DEFAULT_RANGE.MIN,
              filters.yearRange?.max || YEAR_LIMITS.DEFAULT_RANGE.MAX
            ]}
            onChange={handleYearRangeChange}
            step={1}
            formatValue={(value) => value.toString()}
          />
        </FilterGroup>

        {/* Mileage Range */}
        <FilterGroup
          title="Kilometraj"
          isOpen={openGroups.specs}
          onToggle={() => toggleGroup('specs')}
          count={filters.mileageRange ? 1 : 0}
        >
          <RangeSlider
            min={MILEAGE_LIMITS.MIN}
            max={MILEAGE_LIMITS.MAX}
            value={[
              filters.mileageRange?.min || MILEAGE_LIMITS.DEFAULT_RANGE.MIN,
              filters.mileageRange?.max || MILEAGE_LIMITS.DEFAULT_RANGE.MAX
            ]}
            onChange={handleMileageRangeChange}
            step={5000}
            formatValue={(value) => `${(value / 1000).toFixed(0)}k km`}
          />
        </FilterGroup>

        {/* Brand */}
        <FilterGroup
          title="Marcă"
          isOpen={openGroups.brand}
          onToggle={() => toggleGroup('brand')}
          count={filters.brand?.length || 0}
        >
          <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1 text-white/70">
            {POPULAR_BRANDS.map((brand) => (
              <Checkbox
                key={brand}
                id={`brand-${brand}`}
                checked={filters.brand?.includes(brand) || false}
                onChange={handleBrandChange(brand)}
                label={brand}
              />
            ))}
          </div>
        </FilterGroup>

        {/* Fuel Type */}
        <FilterGroup
          title="Combustibil"
          isOpen={openGroups.specs}
          onToggle={() => toggleGroup('specs')}
          count={filters.fuelType?.length || 0}
        >
          <div className="space-y-2">
            {FUEL_TYPE_OPTIONS.map((option) => (
              <Checkbox
                key={option.value}
                id={`fuel-${option.value}`}
                checked={filters.fuelType?.includes(option.value) || false}
                onChange={handleFuelTypeChange(option.value)}
                label={
                  <div className="flex items-center space-x-2 text-white/70">
                    <span className="text-accent-gold/80">{option.icon}</span>
                    <span>{option.label}</span>
                  </div>
                }
              />
            ))}
          </div>
        </FilterGroup>

        {/* Transmission */}
        <FilterGroup
          title="Transmisie"
          isOpen={openGroups.specs}
          onToggle={() => toggleGroup('specs')}
          count={filters.transmission?.length || 0}
        >
          <div className="space-y-2">
            {TRANSMISSION_OPTIONS.map((option) => (
              <Checkbox
                key={option.value}
                id={`transmission-${option.value}`}
                checked={filters.transmission?.includes(option.value) || false}
                onChange={handleTransmissionChange(option.value)}
                label={
                  <div className="flex items-center space-x-2 text-white/70">
                    <span className="text-accent-gold/80">{option.icon}</span>
                    <span>{option.label}</span>
                  </div>
                }
              />
            ))}
          </div>
        </FilterGroup>

        {/* Condition */}
        <FilterGroup
          title="Stare"
          isOpen={openGroups.features}
          onToggle={() => toggleGroup('features')}
          count={filters.condition?.length || 0}
        >
          <div className="space-y-2">
            {CONDITION_OPTIONS.map((option) => (
              <Checkbox
                key={option.value}
                id={`condition-${option.value}`}
                checked={filters.condition?.includes(option.value) || false}
                onChange={handleConditionChange(option.value)}
                label={
                  <div className="flex items-center space-x-2 text-white/70">
                    <span className="text-accent-gold/80">{option.icon}</span>
                    <span>{option.label}</span>
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  </div>
                }
              />
            ))}
          </div>
        </FilterGroup>
      </div>

      {isMobile && (
        <div className="sticky bottom-0 left-0 right-0 border-t border-white/12 bg-secondary-900/95 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="flex-1 border border-white/12 bg-white/6 text-white/80 hover:text-white"
              onClick={() => {
                if (onClose) onClose();
                else onToggleCollapse?.();
              }}
            >
              Închide
            </Button>
            <Button
              className="flex-1 bg-gold-gradient text-secondary-900 hover:shadow-glow"
              onClick={() => {
                onApply?.();
                if (onClose) onClose();
                else onToggleCollapse?.();
              }}
            >
              Aplică filtre
            </Button>
          </div>
        </div>
      )}

      {/* Save Search Dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-900/80 backdrop-blur-xl"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-md rounded-3xl border border-primary-700/40 bg-secondary-900/80 p-6 text-white shadow-[0_25px_60px_rgba(8,12,24,0.55)]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold tracking-tight">
                Salvează căutarea
              </h3>
              <p className="mt-1 text-sm text-white/60">
                Dă-i un nume pentru a o regăsi rapid în lista de căutări salvate.
              </p>
              <div className="mt-4">
                <Input
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  placeholder="Numele căutării..."
                  autoFocus
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowSaveDialog(false)}
                  className="text-white/70 hover:text-white"
                >
                  Anulează
                </Button>
                <Button
                  onClick={handleSaveSearch}
                  disabled={!saveSearchName.trim()}
                  className="disabled:opacity-40"
                >
                  Salvează
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
