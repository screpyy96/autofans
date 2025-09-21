import React, { useState, useEffect } from 'react';
import type { Car, OwnershipCostParams, OwnershipCostResult } from '../../types';
import { FuelType } from '../../types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatCurrency } from '../../utils/helpers';

interface OwnershipCostCalculatorProps {
  car: Car;
}

export const OwnershipCostCalculator: React.FC<OwnershipCostCalculatorProps> = ({ car }) => {
  const [params, setParams] = useState<OwnershipCostParams>({
    carPrice: car.price,
    carAge: new Date().getFullYear() - car.year,
    annualMileage: 15000,
    fuelType: car.fuelType,
    fuelConsumption: car.specifications.fuelConsumption?.combined || 7.5,
    ownershipPeriod: 5,
    location: car.location.city
  });

  const [result, setResult] = useState<OwnershipCostResult | null>(null);

  const calculateOwnershipCost = () => {
    const { carPrice, carAge, annualMileage, fuelType, fuelConsumption, ownershipPeriod } = params;

    // Depreciation calculation
    let annualDepreciationRate = 0.15; // 15% per year base
    if (carAge > 5) annualDepreciationRate = 0.08; // Slower depreciation for older cars
    if (carAge > 10) annualDepreciationRate = 0.05;
    
    const totalDepreciation = carPrice * (1 - Math.pow(1 - annualDepreciationRate, ownershipPeriod));

    // Fuel costs
    const fuelPrices: Record<FuelType, number> = {
      [FuelType.PETROL]: 6.5, // RON per liter
      [FuelType.DIESEL]: 6.8,
      [FuelType.HYBRID]: 6.5, // Assuming petrol hybrid
      [FuelType.ELECTRIC]: 0.7, // RON per kWh equivalent
      [FuelType.LPG]: 3.2,
      [FuelType.CNG]: 4.5
    };

    const fuelPrice = fuelPrices[fuelType];
    const annualFuelCost = (annualMileage / 100) * fuelConsumption * fuelPrice;
    const totalFuelCost = annualFuelCost * ownershipPeriod;

    // Insurance costs (simplified)
    let annualInsurance = carPrice * 0.03; // 3% of car value
    if (carAge > 5) annualInsurance *= 0.8;
    if (carAge > 10) annualInsurance *= 0.7;
    const totalInsurance = annualInsurance * ownershipPeriod;

    // Maintenance costs
    let annualMaintenance = 2000; // Base maintenance
    annualMaintenance += (annualMileage / 1000) * 50; // Per 1000km
    if (carAge > 5) annualMaintenance *= 1.3;
    if (carAge > 10) annualMaintenance *= 1.6;
    if (fuelType === FuelType.ELECTRIC) annualMaintenance *= 0.6; // EVs need less maintenance
    const totalMaintenance = annualMaintenance * ownershipPeriod;

    // Registration and taxes
    const annualRegistration = 500; // Simplified
    const totalRegistration = annualRegistration * ownershipPeriod;

    // Financing costs (assuming 20% down payment, 7.5% interest)
    const loanAmount = carPrice * 0.8;
    const monthlyRate = 0.075 / 12;
    const numPayments = ownershipPeriod * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const totalFinancing = (monthlyPayment * numPayments) - loanAmount;

    const totalCost = totalDepreciation + totalFuelCost + totalInsurance + totalMaintenance + totalRegistration + totalFinancing;
    const monthlyCost = totalCost / (ownershipPeriod * 12);

    // Yearly breakdown
    const yearlyBreakdown = Array.from({ length: ownershipPeriod }, (_, index) => {
      const year = index + 1;
      const yearDepreciation = carPrice * annualDepreciationRate * Math.pow(1 - annualDepreciationRate, index);
      
      return {
        year,
        depreciation: yearDepreciation,
        fuel: annualFuelCost,
        insurance: annualInsurance,
        maintenance: annualMaintenance * (1 + index * 0.05), // Increasing maintenance
        registration: annualRegistration,
        financing: totalFinancing / ownershipPeriod,
        total: yearDepreciation + annualFuelCost + annualInsurance + (annualMaintenance * (1 + index * 0.05)) + annualRegistration + (totalFinancing / ownershipPeriod)
      };
    });

    setResult({
      totalCost,
      monthlyCost,
      breakdown: {
        depreciation: totalDepreciation,
        fuel: totalFuelCost,
        insurance: totalInsurance,
        maintenance: totalMaintenance,
        registration: totalRegistration,
        financing: totalFinancing
      },
      yearlyBreakdown
    });
  };

  useEffect(() => {
    calculateOwnershipCost();
  }, [params]);

  const handleParamChange = (field: keyof OwnershipCostParams, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  const ownershipPeriodOptions = [
    { value: '1', label: '1 an' },
    { value: '2', label: '2 ani' },
    { value: '3', label: '3 ani' },
    { value: '5', label: '5 ani' },
    { value: '7', label: '7 ani' },
    { value: '10', label: '10 ani' }
  ];

  return (
    <div className="space-y-6">
      {/* Input Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preț achiziție
          </label>
          <Input
            type="number"
            value={params.carPrice}
            onChange={(e) => handleParamChange('carPrice', Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Perioada deținere
          </label>
          <Select
            value={params.ownershipPeriod.toString()}
            onChange={(value) => handleParamChange('ownershipPeriod', Number(value))}
            options={ownershipPeriodOptions}
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
            Consum combustibil (l/100km)
          </label>
          <Input
            type="number"
            step="0.1"
            value={params.fuelConsumption}
            onChange={(e) => handleParamChange('fuelConsumption', Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-purple-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-purple-900 mb-4">
            Cost Total de Deținere
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Cost lunar mediu</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(result.monthlyCost)}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Cost total ({params.ownershipPeriod} ani)</div>
              <div className="text-xl font-semibold text-gray-900">
                {formatCurrency(result.totalCost)}
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white rounded-lg p-4 mb-4">
            <h5 className="font-medium text-gray-900 mb-3">Detalii costuri</h5>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Depreciere:</span>
                <span className="font-medium">{formatCurrency(result.breakdown.depreciation)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Combustibil:</span>
                <span className="font-medium">{formatCurrency(result.breakdown.fuel)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Asigurare:</span>
                <span className="font-medium">{formatCurrency(result.breakdown.insurance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Întreținere:</span>
                <span className="font-medium">{formatCurrency(result.breakdown.maintenance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Înmatriculare/Taxe:</span>
                <span className="font-medium">{formatCurrency(result.breakdown.registration)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Finanțare (dobândă):</span>
                <span className="font-medium">{formatCurrency(result.breakdown.financing)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(result.totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Yearly Breakdown */}
          <div className="bg-white rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">Costuri pe ani</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">An</th>
                    <th className="text-right py-2">Depreciere</th>
                    <th className="text-right py-2">Combustibil</th>
                    <th className="text-right py-2">Întreținere</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {result.yearlyBreakdown.map((year) => (
                    <tr key={year.year} className="border-b">
                      <td className="py-2">{year.year}</td>
                      <td className="text-right py-2">{formatCurrency(year.depreciation)}</td>
                      <td className="text-right py-2">{formatCurrency(year.fuel)}</td>
                      <td className="text-right py-2">{formatCurrency(year.maintenance)}</td>
                      <td className="text-right py-2 font-medium">{formatCurrency(year.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Notă:</strong> Calculele sunt estimative și se bazează pe valori medii. 
              Costurile reale pot varia în funcție de stilul de conducere, 
              condițiile de utilizare și fluctuațiile prețurilor.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};