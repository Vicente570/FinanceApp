import React from 'react';
import { useApp } from '../../../context/AppContext';
import { Card } from '../../Common/Card';
import { TrendingUp, DollarSign, PieChart, Target } from 'lucide-react';

const subsections = [
  { id: '1', name: 'Activos', icon: TrendingUp, description: 'Gestiona tus inversiones y activos' },
  { id: '2', name: 'Gráficos', icon: PieChart, description: 'Visualiza el rendimiento de tus inversiones' },
  { id: '3', name: 'Deudas', icon: Target, description: 'Gestiona deudas financieras y logros' },
];

export function InvestmentsOverview() {
  const { state, navigate } = useApp();
  const { assets, debts } = state;

  const totalInvestmentValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalInvestmentCost = assets.reduce((sum, asset) => sum + asset.purchasePrice, 0);
  const totalGainLoss = totalInvestmentValue - totalInvestmentCost;
  const totalDebtAmount = debts.reduce((sum, debt) => sum + debt.amount, 0);

  return (
    <div className="space-y-6 pb-24">
      {/* Resumen de inversiones */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalInvestmentValue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Costo Total</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalInvestmentCost.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ganancia/Pérdida</p>
              <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {totalInvestmentCost > 0 ? ((totalGainLoss / totalInvestmentCost) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <PieChart className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Deudas Totales</p>
              <p className="text-2xl font-bold text-red-600">
                ${totalDebtAmount.toLocaleString()}
              </p>
            </div>
            <Target className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Botones de subsecciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subsections.map((subsection) => {
          const Icon = subsection.icon;
          return (
            <Card
              key={subsection.id}
              hover
              onClick={() => navigate({ section: 'B', subsection: subsection.id as any })}
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg">
                  <Icon className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{subsection.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{subsection.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}