import React from 'react';
import { useApp } from '../../../context/AppContext';
import { Card } from '../../Common/Card';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, Users } from 'lucide-react';

export function DetailedStatistics() {
  const { state } = useApp();
  const { expenses, budgets, accounts, assets, debts, properties, interpersonalDebts } = state;

  // Análisis de gastos
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averageExpensePerDay = totalExpenses / 30;

  // Análisis de presupuestos
  const budgetAnalysis = budgets.map(budget => ({
    ...budget,
    remaining: budget.allocated - budget.spent,
    percentage: (budget.spent / budget.allocated) * 100,
    status: budget.spent > budget.allocated ? 'exceeded' : 
            budget.spent > budget.allocated * 0.9 ? 'warning' : 'good'
  }));

  const totalBudgetAllocated = budgets.reduce((sum, budget) => sum + budget.allocated, 0);
  const totalBudgetSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const budgetUtilization = totalBudgetAllocated > 0 ? (totalBudgetSpent / totalBudgetAllocated) * 100 : 0;

  // Análisis de cuentas
  const liquidAssets = accounts.reduce((sum, account) => sum + Math.max(0, account.balance), 0);
  const creditCardDebt = accounts.reduce((sum, account) => sum + Math.max(0, -account.balance), 0);

  // Análisis de inversiones
  const investmentAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
  const investmentCost = assets.reduce((sum, asset) => sum + asset.purchasePrice, 0);
  const investmentGainLoss = investmentAssets - investmentCost;
  const investmentReturn = investmentCost > 0 ? (investmentGainLoss / investmentCost) * 100 : 0;

  // Análisis de propiedades
  const propertyValue = properties.reduce((sum, property) => sum + property.value, 0);
  const propertyCost = properties.reduce((sum, property) => sum + property.purchasePrice, 0);
  const propertyGainLoss = propertyValue - propertyCost;

  // Análisis de deudas
  const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);
  const monthlyDebtPayments = debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);

  // Deudas interpersonales
  const interpersonalOwed = interpersonalDebts
    .filter(debt => debt.type === 'owe' && !debt.isSettled)
    .reduce((sum, debt) => sum + debt.amount, 0);
  const interpersonalOwing = interpersonalDebts
    .filter(debt => debt.type === 'owed' && !debt.isSettled)
    .reduce((sum, debt) => sum + debt.amount, 0);

  // Patrimonio neto
  const totalAssets = liquidAssets + investmentAssets + propertyValue;
  const totalLiabilities = creditCardDebt + totalDebt + interpersonalOwed;
  const netWorth = totalAssets - totalLiabilities;

  // Análisis de flujo de efectivo
  const monthlyIncome = 5000; // Esto debería venir de datos reales
  const monthlyCashFlow = monthlyIncome - averageExpensePerDay * 30 - monthlyDebtPayments;

  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-gray-900">
        {state.language === 'es' ? 'Estadísticas Detalladas' : 'Detailed Statistics'}
      </h2>

      {/* Resumen Financiero General */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {state.language === 'es' ? 'Resumen Financiero General' : 'General Financial Summary'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm text-gray-600">{state.language === 'es' ? 'Patrimonio Neto' : 'Net Worth'}</p>
            <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netWorth.toLocaleString()}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600">{state.language === 'es' ? 'Activos Totales' : 'Total Assets'}</p>
            <p className="text-2xl font-bold text-blue-600">${totalAssets.toLocaleString()}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm text-gray-600">{state.language === 'es' ? 'Pasivos Totales' : 'Total Liabilities'}</p>
            <p className="text-2xl font-bold text-red-600">${totalLiabilities.toLocaleString()}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-sm text-gray-600">{state.language === 'es' ? 'Flujo Mensual' : 'Monthly Cash Flow'}</p>
            <p className={`text-2xl font-bold ${monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${monthlyCashFlow.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Análisis de Gastos */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {state.language === 'es' ? 'Análisis de Gastos' : 'Expense Analysis'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">{state.language === 'es' ? 'Gastos Totales' : 'Total Expenses'}</p>
            <p className="text-xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">{state.language === 'es' ? 'Promedio Diario' : 'Daily Average'}</p>
            <p className="text-xl font-bold text-orange-600">${averageExpensePerDay.toFixed(0)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">{state.language === 'es' ? 'Categorías' : 'Categories'}</p>
            <p className="text-xl font-bold text-blue-600">{Object.keys(expensesByCategory).length}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">
            {state.language === 'es' ? 'Gastos por Categoría' : 'Expenses by Category'}
          </h4>
          {Object.entries(expensesByCategory)
            .sort(([,a], [,b]) => b - a)
            .map(([category, amount]) => {
              const percentage = (amount / totalExpenses) * 100;
              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">{category}</span>
                    <span className="text-gray-900">${amount.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </Card>

      {/* Análisis de Presupuestos */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {state.language === 'es' ? 'Análisis de Presupuestos' : 'Budget Analysis'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">{state.language === 'es' ? 'Presupuesto Total' : 'Total Budget'}</p>
            <p className="text-xl font-bold text-blue-600">${totalBudgetAllocated.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">{state.language === 'es' ? 'Gastado' : 'Spent'}</p>
            <p className="text-xl font-bold text-orange-600">${totalBudgetSpent.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">{state.language === 'es' ? 'Utilización' : 'Utilization'}</p>
            <p className={`text-xl font-bold ${budgetUtilization > 100 ? 'text-red-600' : budgetUtilization > 90 ? 'text-yellow-600' : 'text-green-600'}`}>
              {budgetUtilization.toFixed(1)}%
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">
            {state.language === 'es' ? 'Estado por Categoría' : 'Status by Category'}
          </h4>
          {budgetAnalysis.map((budget) => (
            <div key={budget.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">{budget.category}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    ${budget.spent.toLocaleString()} / ${budget.allocated.toLocaleString()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    budget.status === 'exceeded' ? 'bg-red-100 text-red-700' :
                    budget.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {budget.status === 'exceeded' ? (state.language === 'es' ? 'Excedido' : 'Exceeded') :
                     budget.status === 'warning' ? (state.language === 'es' ? 'Advertencia' : 'Warning') :
                     (state.language === 'es' ? 'Bien' : 'Good')}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    budget.status === 'exceeded' ? 'bg-red-500' :
                    budget.status === 'warning' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Análisis de Inversiones */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {state.language === 'es' ? 'Análisis de Inversiones' : 'Investment Analysis'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600">{state.language === 'es' ? 'Valor Actual' : 'Current Value'}</p>
            <p className="text-xl font-bold text-blue-600">${investmentAssets.toLocaleString()}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-sm text-gray-600">{state.language === 'es' ? 'Costo Total' : 'Total Cost'}</p>
            <p className="text-xl font-bold text-gray-600">${investmentCost.toLocaleString()}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              {investmentGainLoss >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-500" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-500" />
              )}
            </div>
            <p className="text-sm text-gray-600">{state.language === 'es' ? 'Ganancia/Pérdida' : 'Gain/Loss'}</p>
            <p className={`text-xl font-bold ${investmentGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {investmentGainLoss >= 0 ? '+' : ''}${investmentGainLoss.toLocaleString()}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-sm text-gray-600">{state.language === 'es' ? 'Rendimiento' : 'Return'}</p>
            <p className={`text-xl font-bold ${investmentReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {investmentReturn >= 0 ? '+' : ''}{investmentReturn.toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Análisis de Deudas Interpersonales */}
      {interpersonalDebts.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {state.language === 'es' ? 'Análisis de Deudas Interpersonales' : 'Personal Debts Analysis'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm text-gray-600">{state.language === 'es' ? 'Debes' : 'You Owe'}</p>
              <p className="text-xl font-bold text-red-600">${interpersonalOwed.toLocaleString()}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-sm text-gray-600">{state.language === 'es' ? 'Te Deben' : 'They Owe You'}</p>
              <p className="text-xl font-bold text-green-600">${interpersonalOwing.toLocaleString()}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-sm text-gray-600">{state.language === 'es' ? 'Balance Neto' : 'Net Balance'}</p>
              <p className={`text-xl font-bold ${(interpersonalOwing - interpersonalOwed) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${(interpersonalOwing - interpersonalOwed).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}