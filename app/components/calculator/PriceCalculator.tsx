import React, { useState } from 'react';
import type { Car } from '../../types';
import { LoanCalculator } from './LoanCalculator';
import { InsuranceCalculator } from './InsuranceCalculator';
import { OwnershipCostCalculator } from './OwnershipCostCalculator';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface PriceCalculatorProps {
  car: Car;
  className?: string;
}

type CalculatorTab = 'loan' | 'insurance' | 'ownership';

export const PriceCalculator: React.FC<PriceCalculatorProps> = ({
  car,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('loan');

  const tabs = [
    { id: 'loan' as const, label: 'Finanțare', icon: '💰' },
    { id: 'insurance' as const, label: 'Asigurare', icon: '🛡️' },
    { id: 'ownership' as const, label: 'Cost Total', icon: '📊' }
  ];

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Calculator Preț
        </h3>
        <p className="text-gray-600">
          Calculează costurile pentru {car.brand} {car.model} ({car.year})
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'loan' && <LoanCalculator car={car} />}
        {activeTab === 'insurance' && <InsuranceCalculator car={car} />}
        {activeTab === 'ownership' && <OwnershipCostCalculator car={car} />}
      </div>
    </Card>
  );
};