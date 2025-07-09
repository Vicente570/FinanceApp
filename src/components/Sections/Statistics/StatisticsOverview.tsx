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
  
  // Función helper para formatear monedas
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(state.language === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: state.currency,
      minimumFractionDigits: (state.currency === 'JPY' || state.currency === 'CLP') ? 0 : 2,
      maximumFractionDigits: (state.currency === 'JPY' || state.currency === 'CLP') ? 0 : 4
    }).format(amount);
  };

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
                {formatCurrency(totalExpenses)}
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
                {formatCurrency(totalBudget)}
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
                {formatCurrency(totalAssets)}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                <div>Efectivo: {formatCurrency(liquidAssets)}</div>
                <div>Inversiones: {formatCurrency(investmentAssets)}</div>
                <div>Propiedades: {formatCurrency(propertyAssets)}</div>
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
                {formatCurrency(netWorth)}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                <div>Activos: {formatCurrency(totalAssets)}</div>
                <div>Pasivos: {formatCurrency(totalLiabilities)}</div>
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