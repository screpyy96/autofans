import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '~/lib/utils';
import type { Car } from '~/types';
import { FuelType, TransmissionType } from '~/types';
import { Button } from './Button';
import { Badge } from './Badge';
import { useResponsive } from '~/hooks/useResponsive';

export interface ComparisonTableProps {
  cars: Car[];
  onRemoveCar: (carId: string) => void;
  onAddMore?: () => void;
  maxCars?: number;
  className?: string;
  enableExport?: boolean;
}

interface ComparisonRow {
  label: string;
  category: string;
  getValue: (car: Car) => string | number | boolean | null | undefined;
  format?: (value: any, car: Car) => string;
  highlight?: boolean;
}

const formatPrice = (price: number, currency: string = 'EUR') => {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(price);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('ro-RO').format(num);
};

const formatFuelType = (fuel: FuelType) => {
  const fuelLabels = {
    [FuelType.PETROL]: 'Benzină',
    [FuelType.DIESEL]: 'Diesel',
    [FuelType.HYBRID]: 'Hibrid',
    [FuelType.ELECTRIC]: 'Electric',
    [FuelType.LPG]: 'GPL',
    [FuelType.CNG]: 'CNG',
  };
  return fuelLabels[fuel] || fuel;
};

const formatTransmission = (transmission: TransmissionType) => {
  const transmissionLabels = {
    [TransmissionType.MANUAL]: 'Manuală',
    [TransmissionType.AUTOMATIC]: 'Automată',
    [TransmissionType.SEMI_AUTOMATIC]: 'Semi-automată',
    [TransmissionType.CVT]: 'CVT',
  };
  return transmissionLabels[transmission] || transmission;
};

export const ComparisonTable = ({
  cars,
  onRemoveCar,
  onAddMore,
  maxCars = 4,
  className,
  enableExport = true,
}: ComparisonTableProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCarIndex, setSelectedCarIndex] = useState<number>(0);
  const tableRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useResponsive();

  // Define comparison rows
  const comparisonRows: ComparisonRow[] = useMemo(() => [
    // Basic Info
    { label: 'Preț', category: 'basic', getValue: (car) => car.price, format: (price, car) => formatPrice(price, car.currency), highlight: true },
    { label: 'An fabricație', category: 'basic', getValue: (car) => car.year, highlight: true },
    { label: 'Kilometraj', category: 'basic', getValue: (car) => car.mileage, format: (km) => `${formatNumber(km)} km`, highlight: true },
    { label: 'Combustibil', category: 'basic', getValue: (car) => car.fuelType, format: formatFuelType },
    { label: 'Transmisie', category: 'basic', getValue: (car) => car.transmission, format: formatTransmission },
    
    // Engine & Performance
    { label: 'Capacitate motor', category: 'engine', getValue: (car) => car.specifications.engineSize, format: (size) => `${size}L` },
    { label: 'Putere', category: 'engine', getValue: (car) => car.specifications.power, format: (power) => `${power} CP` },
    { label: 'Cuplu', category: 'engine', getValue: (car) => car.specifications.torque, format: (torque) => torque ? `${torque} Nm` : 'N/A' },
    { label: 'Accelerație 0-100', category: 'engine', getValue: (car) => car.specifications.acceleration, format: (acc) => acc ? `${acc}s` : 'N/A' },
    { label: 'Viteză maximă', category: 'engine', getValue: (car) => car.specifications.topSpeed, format: (speed) => speed ? `${speed} km/h` : 'N/A' },
    
    // Consumption & Emissions
    { label: 'Consum urban', category: 'consumption', getValue: (car) => car.specifications.fuelConsumption?.city, format: (cons) => cons ? `${cons}L/100km` : 'N/A' },
    { label: 'Consum extra-urban', category: 'consumption', getValue: (car) => car.specifications.fuelConsumption?.highway, format: (cons) => cons ? `${cons}L/100km` : 'N/A' },
    { label: 'Consum mixt', category: 'consumption', getValue: (car) => car.specifications.fuelConsumption?.combined, format: (cons) => cons ? `${cons}L/100km` : 'N/A' },
    { label: 'Emisii CO2', category: 'consumption', getValue: (car) => car.specifications.co2Emissions, format: (em) => em ? `${em} g/km` : 'N/A' },
    { label: 'Normă Euro', category: 'consumption', getValue: (car) => car.specifications.euroStandard || 'N/A' },
    
    // Dimensions & Capacity
    { label: 'Număr uși', category: 'dimensions', getValue: (car) => car.specifications.doors },
    { label: 'Număr locuri', category: 'dimensions', getValue: (car) => car.specifications.seats },
    { label: 'Capacitate portbagaj', category: 'dimensions', getValue: (car) => car.specifications.trunkCapacity, format: (cap) => cap ? `${cap}L` : 'N/A' },
    { label: 'Greutate', category: 'dimensions', getValue: (car) => car.specifications.weight, format: (weight) => weight ? `${formatNumber(weight)} kg` : 'N/A' },
    
    // Condition & History
    { label: 'Stare generală', category: 'condition', getValue: (car) => car.condition.overall },
    { label: 'Proprietari declarați', category: 'condition', getValue: (car) => car.owners },
    { label: 'Istoric service', category: 'condition', getValue: (car) => car.serviceHistory, format: (value) => value ? 'Declarat' : 'Nedeclarat' },
    { label: 'Accidente', category: 'condition', getValue: (car) => car.condition.hasAccidents, format: (value) => value ? 'Declarate' : 'Nedeclarate' },
    { label: 'Garanție rămasă', category: 'condition', getValue: (car) => car.warrantyRemaining, format: (months) => months ? `${months} luni` : 'Nu' },
  ], [cars]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(comparisonRows.map(row => row.category))];
    const categoryLabels = {
      all: 'Toate',
      basic: 'Informații de bază',
      engine: 'Motor & Performanță',
      consumption: 'Consum & Emisii',
      dimensions: 'Dimensiuni & Capacitate',
      condition: 'Stare & Istoric',
    };
    return cats.map(cat => ({ value: cat, label: categoryLabels[cat as keyof typeof categoryLabels] || cat }));
  }, []);

  // Filter rows by category
  const filteredRows = useMemo(() => {
    if (selectedCategory === 'all') return comparisonRows;
    return comparisonRows.filter(row => row.category === selectedCategory);
  }, [comparisonRows, selectedCategory]);

  // Check if values are different across cars for highlighting
  const getValueDifferences = (getValue: (car: Car) => any) => {
    const values = cars.map(getValue);
    const uniqueValues = new Set(values);
    return uniqueValues.size > 1;
  };

  // Export functionality
  const handleExport = () => {
    const csvContent = [
      // Header
      ['Caracteristică', ...cars.map(car => `${car.brand} ${car.model} (${car.year})`)],
      // Rows
      ...filteredRows.map(row => [
        row.label,
        ...cars.map(car => {
          const value = row.getValue(car);
          if (value === null || value === undefined) return 'N/A';
          return row.format ? row.format(value, car) : String(value);
        })
      ])
    ];

    const csv = csvContent.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `comparatie-masini-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (cars.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="mx-auto">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 002 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 002 2v4m-6 0h6m-6 0v6" />
          </svg>
          <h3 className="mb-2 text-lg font-medium text-white">Nicio mașină selectată</h3>
          <p className="mb-4 text-gray-400">Adaugă mașini pentru a le compara caracteristicile.</p>
          {onAddMore && (
            <Button onClick={onAddMore} variant="primary">
              Adaugă mașini
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-3xl border border-white/10 bg-secondary-900/80 shadow-2xl', className)}>
      {/* Header */}
      <div className="border-b border-white/10 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Comparație mașini ({cars.length})
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Compară caracteristicile pentru a lua cea mai bună decizie
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Alege categoria de comparație"
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-accent-gold focus:ring-2 focus:ring-accent-gold"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            
            {/* Export Button */}
            {enableExport && (
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="whitespace-nowrap"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportă CSV
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Car Headers */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-secondary-950/95 backdrop-blur-xl">
        {isMobile ? (
          /* Mobile: Single car selector */
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-white">Selectează mașina:</h3>
              <span className="text-sm text-gray-400">{selectedCarIndex + 1} din {cars.length}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {cars.map((car, index) => (
                <button
                  key={car.id}
                  type="button"
                  onClick={() => setSelectedCarIndex(index)}
                  aria-pressed={selectedCarIndex === index}
                  className={cn(
                    "min-w-[120px] shrink-0 rounded-xl border p-3 transition-all",
                    selectedCarIndex === index
                      ? "border-accent-gold bg-accent-gold/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25"
                  )}
                >
                  {car.images.length > 0 && (
                    <div className="w-12 h-8 mx-auto mb-2 rounded overflow-hidden">
                      <img
                        src={car.images[0].thumbnailUrl || car.images[0].url}
                        alt={car.images[0].alt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="truncate text-xs font-medium text-white">
                      {car.brand} {car.model}
                    </p>
                    <p className="text-xs text-gray-400">{car.year}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Desktop: Grid layout */
          <div className="grid min-h-[120px] grid-cols-1 lg:grid-cols-[200px_1fr]">
            {/* Empty cell for row labels */}
            <div className="hidden border-r border-white/10 lg:block" />
            
            {/* Car cards */}
            <div className={cn(
              'grid gap-4 p-4',
              cars.length === 1 && 'grid-cols-1',
              cars.length === 2 && 'grid-cols-1 sm:grid-cols-2',
              cars.length === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
              cars.length >= 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            )}>
              {cars.map((car, index) => (
                <motion.div
                  key={car.id}
                  className="relative min-h-[100px] rounded-xl border border-white/10 bg-white/[0.04] p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Remove button */}
                  <button
                    onClick={() => onRemoveCar(car.id)}
                    className="absolute right-2 top-2 text-gray-400 transition-colors hover:text-red-300"
                    type="button"
                    aria-label={`Elimină ${car.title} din comparație`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  {/* Car image */}
                  {car.images.length > 0 && (
                    <div className="w-16 h-12 mx-auto mb-2 rounded overflow-hidden">
                      <img
                        src={car.images[0].thumbnailUrl || car.images[0].url}
                        alt={car.images[0].alt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Car info */}
                  <div className="text-center">
                    <h3 className="text-sm font-medium leading-tight text-white">
                      {car.brand} {car.model}
                    </h3>
                    <p className="mt-1 text-xs text-gray-400">
                      {car.year} • {formatNumber(car.mileage)} km
                    </p>
                    <p className="mt-1 text-sm font-semibold text-accent-gold">
                      {formatPrice(car.price, car.currency)}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {/* Add more button */}
              {onAddMore && cars.length < maxCars && (
                <motion.button
                  onClick={onAddMore}
                  className="flex min-h-[100px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 p-4 text-gray-400 transition-colors hover:border-accent-gold/60 hover:text-accent-gold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-medium">Adaugă mașină</span>
                </motion.button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comparison Table */}
      <div ref={tableRef} className="overflow-x-auto">
        <div className="min-w-full">
          <AnimatePresence>
            {filteredRows.map((row, rowIndex) => {
              const hasDifferences = getValueDifferences(row.getValue);
              
              return (
                <motion.div
                  key={`${row.category}-${row.label}`}
                  className={cn(
                    'border-b border-white/[0.07] transition-colors hover:bg-white/[0.025]',
                    row.highlight && hasDifferences && 'bg-accent-gold/[0.04]',
                    isMobile ? 'p-4' : 'grid grid-cols-1 lg:grid-cols-[200px_1fr]'
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: rowIndex * 0.02 }}
                >
                  {isMobile ? (
                    /* Mobile: Stacked layout */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">
                          {row.label}
                        </span>
                        {row.highlight && hasDifferences && (
                          <Badge variant="warning" size="sm">
                            Diferit
                          </Badge>
                        )}
                      </div>
                      
                      {/* Show only selected car's value on mobile */}
                      <div className="rounded-xl bg-white/[0.04] p-3">
                        {(() => {
                          const car = cars[selectedCarIndex];
                          const value = row.getValue(car);
                          const formattedValue = value === null || value === undefined 
                            ? 'N/A' 
                            : row.format 
                              ? row.format(value, car)
                              : String(value);
                          
                          return (
                            <div className={cn(
                              'text-sm font-medium',
                              value === null || value === undefined ? 'italic text-gray-500' : 'text-white'
                            )}>
                              {formattedValue}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    /* Desktop: Grid layout */
                    <>
                      {/* Row label */}
                      <div className="bg-white/[0.025] p-4 lg:border-r lg:border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {row.label}
                          </span>
                          {row.highlight && hasDifferences && (
                            <Badge variant="warning" size="sm">
                              Diferit
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Values */}
                      <div className={cn(
                        'grid gap-4 p-4',
                        cars.length === 1 && 'grid-cols-1',
                        cars.length === 2 && 'grid-cols-1 sm:grid-cols-2',
                        cars.length === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
                        cars.length >= 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                      )}>
                        {cars.map((car, carIndex) => {
                          const value = row.getValue(car);
                          const formattedValue = value === null || value === undefined 
                            ? 'N/A' 
                            : row.format 
                              ? row.format(value, car)
                              : String(value);
                          
                          // Check if this value is different from others
                          const otherValues = cars
                            .filter((_, i) => i !== carIndex)
                            .map(row.getValue);
                          const isDifferent = otherValues.some(otherValue => otherValue !== value);
                          
                          return (
                            <div
                              key={`${car.id}-${row.label}`}
                              className={cn(
                                'rounded-lg p-2 text-sm text-white',
                                row.highlight && isDifferent && hasDifferences && 'bg-accent-gold/10 font-medium text-accent-gold',
                                value === null || value === undefined && 'italic text-gray-500'
                              )}
                            >
                              {formattedValue}
                            </div>
                          );
                        })}
                        
                        {/* Empty cells for add more button alignment */}
                        {onAddMore && cars.length < maxCars && (
                          <div className="p-2" />
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 bg-white/[0.025] p-4 text-center">
        <p className="text-xs text-gray-400">
          * Valorile evidențiate în galben diferă între mașini
        </p>
      </div>
    </div>
  );
};
