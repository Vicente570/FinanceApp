import React from 'react';
import { useApp } from '../../../context/AppContext';
import { Card } from '../../Common/Card';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

const subsections = [
  { id: '1', name: 'Gráficos', icon: BarChart3, description: 'Visualiza gastos por período y categoría' },
  { id: '2', name: 'Estadísticas', icon: PieChart, description: 'Análisis detallado de gastos y tendencias' },
  { id: '3', name: 'Patrimonio Neto', icon: TrendingUp, description: 'Calcula tu patrimonio neto total' },
];

export function StatisticsOverview() {
  const { state, navigate } = useApp();
  const { expenses, budgets, accounts, assets, debts, properties = [] } = state;

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.allocated, 0);
  
  // Cálculo completo de activos (incluyendo propiedades)
  const liquidAssets = accounts.reduce((sum, account) => sum + Math.max(0, account.balance), 0);
  const investmentAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
  const propertyAssets = properties.reduce((sum, property) => sum + property.value, 0);
  const totalAssets = liquidAssets + investmentAssets + propertyAssets;
  
  // Cálculo completo de pasivos
  const creditCardDebt = accounts.reduce((sum, account) => sum + Math.max(0, -account.balance), 0);
  const financialDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);
  const totalLiabilities = creditCardDebt + financialDebt;
  
  // Patrimonio neto completo
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="space-y-6 pb-24">
      {/* Resumen estadístico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gastos Totales</p>
              <p className="text-2xl font-bold text-red-600">
                ${totalExpenses.toLocaleString()}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Presupuesto Total</p>
              <p className="text-2xl font-bold text-blue-600">
                ${totalBudget.toLocaleString()}
              </p>
            </div>
            <PieChart className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activos Totales</p>
              <p className="text-2xl font-bold text-green-600">
                ${totalAssets.toLocaleString()}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                <div>Efectivo: ${liquidAssets.toLocaleString()}</div>
                <div>Inversiones: ${investmentAssets.toLocaleString()}</div>
                <div>Propiedades: ${propertyAssets.toLocaleString()}</div>
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Patrimonio Neto</p>
              <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${netWorth.toLocaleString()}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                <div>Activos: ${totalAssets.toLocaleString()}</div>
                <div>Pasivos: ${totalLiabilities.toLocaleString()}</div>
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
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
              onClick={() => navigate({ section: 'C', subsection: subsection.id as any })}
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                  <Icon className="w-6 h-6 text-purple-600" />
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