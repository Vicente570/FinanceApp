import React from 'react';
import { useApp } from '../../../context/AppContext';
import { Card } from '../../Common/Card';

export function Charts() {
  const { state } = useApp();
  const { expenses, budgets } = state;

  // Gastos por categoría
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  // Gastos por mes (últimos 6 meses)
  const monthlyExpenses = expenses.reduce((acc, expense) => {
    const month = new Date(expense.date).toLocaleDateString(state.language === 'es' ? 'es-ES' : 'en-US', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  // Presupuesto vs Gastos
  const budgetComparison = budgets.map(budget => ({
    category: budget.category,
    allocated: budget.allocated,
    spent: budget.spent,
    percentage: (budget.spent / budget.allocated) * 100
  }));

  // Crear gráfico de torta para gastos por categoría
  const createExpensePieChart = (expensesByCategory: Record<string, number>) => {
    const total = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);
    let cumulativePercentage = 0;
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];
    
    return Object.entries(expensesByCategory).map(([category, amount], index) => {
      const percentage = total > 0 ? (amount / total) * 100 : 0;
      cumulativePercentage += percentage;
      
      return {
        category,
        amount,
        percentage,
        color: colors[index % colors.length]
      };
    });
  };

  const expensePieData = createExpensePieChart(expensesByCategory);
  const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-gray-900">
        {state.language === 'es' ? 'Gráficos Financieros' : 'Financial Charts'}
      </h2>

      {/* Gastos por Categoría - Gráfico de Torta */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {state.language === 'es' ? 'Gastos por Categoría' : 'Expenses by Category'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gráfico de Torta */}
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="10"
                />
                {expensePieData.map((item, index) => {
                  const circumference = 2 * Math.PI * 35;
                  const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((expensePieData.slice(0, index).reduce((sum, prev) => sum + prev.percentage, 0) / 100) * circumference);
                  
                  return (
                    <circle
                      key={item.category}
                      cx="50"
                      cy="50"
                      r="35"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="10"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300 hover:stroke-width-12"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">${totalExpenses.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">
                    {state.language === 'es' ? 'Total' : 'Total'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Leyenda */}
          <div className="space-y-3">
            {expensePieData.map((item) => (
              <div key={item.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-gray-700">{item.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-900 font-semibold">${item.amount.toLocaleString()}</span>
                  <span className="text-gray-500 text-sm ml-2">({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Presupuesto vs Gastos */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {state.language === 'es' ? 'Presupuesto vs Gastos Reales' : 'Budget vs Actual Expenses'}
        </h3>
        <div className="space-y-4">
          {budgetComparison.map((item) => (
            <div key={item.category} className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">{item.category}</span>
                <span className="text-sm text-gray-600">
                  ${item.spent.toLocaleString()} / ${item.allocated.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    item.percentage <= 75 ? 'bg-green-500' :
                    item.percentage <= 90 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${
                  item.percentage <= 75 ? 'text-green-600' :
                  item.percentage <= 90 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {item.percentage.toFixed(1)}% {state.language === 'es' ? 'utilizado' : 'used'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Gastos Mensuales */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {state.language === 'es' ? 'Tendencia de Gastos Mensuales' : 'Monthly Expense Trends'}
        </h3>
        <div className="space-y-4">
          {Object.entries(monthlyExpenses).map(([month, amount]) => {
            const maxAmount = Math.max(...Object.values(monthlyExpenses));
            const percentage = (amount / maxAmount) * 100;
            
            return (
              <div key={month} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">{month}</span>
                  <span className="text-gray-900">${amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}