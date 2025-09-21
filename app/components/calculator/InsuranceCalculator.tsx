import React, { useState, useEffect } from 'react';
import type { Car, InsuranceCalculatorParams, InsuranceCalculatorResult } from '../../types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatCurrency } from '../../utils/helpers';

interface InsuranceCalculatorProps {
  car: Car;
}

export const InsuranceCalculator: React.FC<InsuranceCalculatorProps> = ({ car }) => {
  const [params, setParams] = useState<InsuranceCalculatorParams>({
    carValue: car.price,
    carAge: new Date().getFullYear() - car.year,
    driverAge: 35,
    location: car.location.city,
    coverageType: 'comprehensive',
    deductible: 1000,
    annualMileage: 15000
  });

  const [result, setResult] = useState<InsuranceCalculatorResult | null>(null);

  const calculateInsurance = () => {
    // Base premium calculation (simplified algorithm)
    let basePremium = params.carValue * 0.03; // 3% of car value as base

    // Age adjustments
    if (params.carAge > 10) basePremium *= 0.8; // Older cars cost less
    if (params.carAge < 3) basePremium *= 1.2; // New cars cost more

    // Driver age adjustments
    if (params.driverAge < 25) basePremium *= 1.5;
    else if (params.driverAge < 30) basePremium *= 1.2;
    else if (params.driverAge > 65) basePremium *= 1.1;

    // Coverage type adjustments
    const coverageMultipliers = {
      basic: 0.6,
      comprehensive: 1.0,
      full: 1.4
    };
    basePremium *= coverageMultipliers[params.coverageType];

    // Deductible adjustments
    if (params.deductible >= 2000) basePremium *= 0.85;
    else if (params.deductible >= 1500) basePremium *= 0.9;
    else if (params.deductible <= 500) basePremium *= 1.15;

    // Mileage adjustments
    if (params.annualMileage > 20000) basePremium *= 1.2;
    else if (params.annualMileage < 10000) basePremium *= 0.9;

    // Location adjustments (simplified)
    const locationMultipliers: Record<string, number> = {
      'București': 1.3,
      'Cluj-Napoca': 1.1,
      'Timișoara': 1.1,
      'Iași': 1.0,
      'Constanța': 1.0
    };
    const locationMultiplier = locationMultipliers[params.location] || 1.0;
    basePremium *= locationMultiplier;

    const annualPremium = Math.round(basePremium);
    const monthlyPremium = Math.round(annualPremium / 12);

    // Coverage breakdown
    const coverageDetails = {
      liability: Math.round(annualPremium * 0.4),
      collision: Math.round(annualPremium * 0.3),
      comprehensive: Math.round(annualPremium * 0.2),
      personalInjury: Math.round(annualPremium * 0.1)
    };

    setResult({
      monthlyPremium,
      annualPremium,
      coverageDetails
    });
  };

  useEffect(() => {
    calculateInsurance();
  }, [params]);

  const handleParamChange = (field: keyof InsuranceCalculatorParams, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const coverageOptions = [
    { value: 'basic', label: 'RCA + Casco Parțial' },
    { value: 'comprehensive', label: 'Casco Complet' },
    { value: 'full', label: 'Casco Premium + Asistență' }
  ];

  const deductibleOptions = [
    { value: 500, label: '500 RON' },
    { value: 1000, label: '1.000 RON' },
    { value: 1500, label: '1.500 RON' },
    { value: 2000, label: '2.000 RON' },
    { value: 3000, label: '3.000 RON' }
  ];

  return (
    <div className="space-y-6">
      {/* Input Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valoarea mașinii
          </label>
          <Input
            type="number"
            value={params.carValue}
            onChange={(e) => handleParamChange('carValue', Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vârsta șoferului
          </label>
          <Input
            type="number"
            value={params.driverAge}
            onChange={(e) => handleParamChange('driverAge', Number(e.target.value))}
            className="w-full"
            min="18"
            max="80"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tip acoperire
          </label>
          <Select
            value={params.coverageType}
            onChange={(value) => handleParamChange('coverageType', value)}
            options={coverageOptions}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Franșiză
          </label>
          <Select
            value={params.deductible.toString()}
            onChange={(value) => handleParamChange('deductible', Number(value))}
            options={deductibleOptions.map(opt => ({ 
              value: opt.value.toString(), 
              label: opt.label 
            }))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kilometraj anual
          </label>
          <Input
            type="number"
            value={params.annualMileage}
            onChange={(e) => handleParamChange('annualMileage', Number(e.target.value))}
            className="w-full"
            step="1000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Localitatea
          </label>
          <Input
            type="text"
            value={params.location}
            onChange={(e) => handleParamChange('location', e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-green-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-green-900 mb-4">
            Estimare Asigurare
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Primă lunară</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(result.monthlyPremium)}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Primă anuală</div>
              <div className="text-xl font-semibold text-gray-900">
                {formatCurrency(result.annualPremium)}
              </div>
            </div>
          </div>

          {/* Coverage Breakdown */}
          <div className="bg-white rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">Detalii acoperire anuală</h5>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">RCA (Răspundere civilă):</span>
                <span className="font-medium">{formatCurrency(result.coverageDetails.liability)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Casco (Daune proprii):</span>
                <span className="font-medium">{formatCurrency(result.coverageDetails.collision)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Furt/Incendiu:</span>
                <span className="font-medium">{formatCurrency(result.coverageDetails.comprehensive)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Accidente personale:</span>
                <span className="font-medium">{formatCurrency(result.coverageDetails.personalInjury)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(result.annualPremium)}</span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Notă:</strong> Aceasta este o estimare aproximativă. 
              Prețurile reale pot varia în funcție de istoricul de conducere, 
              compania de asigurări și alte factori specifici.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};