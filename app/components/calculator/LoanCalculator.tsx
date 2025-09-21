import React, { useState, useEffect } from 'react';
import type { Car, LoanCalculatorParams, LoanCalculatorResult } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/helpers';

interface LoanCalculatorProps {
  car: Car;
}

export const LoanCalculator: React.FC<LoanCalculatorProps> = ({ car }) => {
  const [params, setParams] = useState<LoanCalculatorParams>({
    carPrice: car.price,
    downPayment: Math.round(car.price * 0.2), // 20% default
    loanTerm: 60, // 5 years default
    interestRate: 7.5, // 7.5% default
    tradeInValue: 0
  });

  const [result, setResult] = useState<LoanCalculatorResult | null>(null);

  const calculateLoan = () => {
    const loanAmount = params.carPrice - params.downPayment - (params.tradeInValue || 0);
    const monthlyRate = params.interestRate / 100 / 12;
    const numPayments = params.loanTerm;

    if (loanAmount <= 0) {
      setResult({
        monthlyPayment: 0,
        totalInterest: 0,
        totalAmount: params.carPrice,
        loanAmount: 0
      });
      return;
    }

    const monthlyPayment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    const totalAmount = monthlyPayment * numPayments;
    const totalInterest = totalAmount - loanAmount;

    setResult({
      monthlyPayment,
      totalInterest,
      totalAmount: totalAmount + params.downPayment + (params.tradeInValue || 0),
      loanAmount
    });
  };

  useEffect(() => {
    calculateLoan();
  }, [params]);

  const handleParamChange = (field: keyof LoanCalculatorParams, value: number) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Input Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preț Mașină
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
            Avans ({Math.round((params.downPayment / params.carPrice) * 100)}%)
          </label>
          <Input
            type="number"
            value={params.downPayment}
            onChange={(e) => handleParamChange('downPayment', Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Perioada (luni)
          </label>
          <select
            value={params.loanTerm}
            onChange={(e) => handleParamChange('loanTerm', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={12}>1 an</option>
            <option value={24}>2 ani</option>
            <option value={36}>3 ani</option>
            <option value={48}>4 ani</option>
            <option value={60}>5 ani</option>
            <option value={72}>6 ani</option>
            <option value={84}>7 ani</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rata dobânzii (% anual)
          </label>
          <Input
            type="number"
            step="0.1"
            value={params.interestRate}
            onChange={(e) => handleParamChange('interestRate', Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valoare Trade-in (opțional)
          </label>
          <Input
            type="number"
            value={params.tradeInValue || 0}
            onChange={(e) => handleParamChange('tradeInValue', Number(e.target.value))}
            className="w-full"
            placeholder="0"
          />
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-4">
            Rezultate Finanțare
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Rata lunară</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(result.monthlyPayment)}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Suma finanțată</div>
              <div className="text-xl font-semibold text-gray-900">
                {formatCurrency(result.loanAmount)}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Total dobândă</div>
              <div className="text-xl font-semibold text-orange-600">
                {formatCurrency(result.totalInterest)}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Cost total</div>
              <div className="text-xl font-semibold text-gray-900">
                {formatCurrency(result.totalAmount)}
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Preț mașină:</span>
                <span>{formatCurrency(params.carPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Avans:</span>
                <span>-{formatCurrency(params.downPayment)}</span>
              </div>
              {params.tradeInValue && params.tradeInValue > 0 && (
                <div className="flex justify-between">
                  <span>Trade-in:</span>
                  <span>-{formatCurrency(params.tradeInValue)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium border-t pt-1">
                <span>Suma de finanțat:</span>
                <span>{formatCurrency(result.loanAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleParamChange('downPayment', Math.round(params.carPrice * 0.1))}
        >
          Avans 10%
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleParamChange('downPayment', Math.round(params.carPrice * 0.2))}
        >
          Avans 20%
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleParamChange('downPayment', Math.round(params.carPrice * 0.3))}
        >
          Avans 30%
        </Button>
      </div>
    </div>
  );
};