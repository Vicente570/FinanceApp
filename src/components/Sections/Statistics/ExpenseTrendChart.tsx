import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { Card } from '../../Common/Card';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

export function ExpenseTrendChart() {
  const { state } = useApp();
  const { expenses } = state;
  
  // Función helper para formatear monedas
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(state.language === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: state.currency,
      minimumFractionDigits: (state.currency === 'JPY' || state.currency === 'CLP') ? 0 : 2,
      maximumFractionDigits: (state.currency === 'JPY' || state.currency === 'CLP') ? 0 : 4
    }).format(amount);
  };
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showMonthlyData, setShowMonthlyData] = useState(false);

  // Obtener años disponibles
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    expenses.forEach(expense => {
      const year = new Date(expense.date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [expenses]);

  // Obtener categorías disponibles
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    expenses.forEach(expense => {
      categories.add(expense.category);
    });
    return Array.from(categories).sort();
  }, [expenses]);

  // Filtrar gastos por año
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const date = new Date(expense.date);
      const year = date.getFullYear();
      
      if (year !== selectedYear) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(expense.category)) return false;
      
      return true;
    });
  }, [expenses, selectedYear, selectedCategories]);

  // Agrupar por mes para categorías seleccionadas
  const monthlyData = useMemo(() => {
    const data: Record<string, { total: number; categories: Record<string, number> }> = {};
    
    // Solo procesar gastos que realmente existen
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!data[monthKey]) {
        data[monthKey] = { total: 0, categories: {} };
      }
      
      data[monthKey].total += expense.amount;
      data[monthKey].categories[expense.category] = (data[monthKey].categories[expense.category] || 0) + expense.amount;
    });
    
    // Solo retornar meses que tienen datos reales
    return Object.entries(data)
      .filter(([key, value]) => value.total > 0) // Solo meses con gastos reales
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        // Crear la fecha correctamente para evitar problemas de zona horaria
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        
        return {
          month: date.toLocaleDateString(state.language === 'es' ? 'es-ES' : 'en-US', { 
            month: 'short', 
            year: 'numeric' 
          }),
          ...value
        };
      });
  }, [filteredExpenses, state.language]);

  // Agrupar por mes para el TOTAL (todos los gastos del año)
  const totalMonthlyData = useMemo(() => {
    const data: Record<string, { total: number; categories: Record<string, number> }> = {};
    
    // Procesar TODOS los gastos del año seleccionado
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const year = date.getFullYear();
      
      if (year === selectedYear) {
        const monthKey = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!data[monthKey]) {
          data[monthKey] = { total: 0, categories: {} };
        }
        
        data[monthKey].total += expense.amount;
        data[monthKey].categories[expense.category] = (data[monthKey].categories[expense.category] || 0) + expense.amount;
      }
    });
    
    // Solo retornar meses que tienen datos reales
    return Object.entries(data)
      .filter(([key, value]) => value.total > 0) // Solo meses con gastos reales
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        // Crear la fecha correctamente para evitar problemas de zona horaria
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        
        return {
          month: date.toLocaleDateString(state.language === 'es' ? 'es-ES' : 'en-US', { 
            month: 'short', 
            year: 'numeric' 
          }),
          ...value
        };
      });
  }, [expenses, selectedYear, state.language]);

  // Calcular categorías válidas (con al menos 2 meses de datos)
  const validCategories = useMemo(() => {
    const categoryMonths: Record<string, Set<string>> = {};
    
    // Contar meses únicos por categoría
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const year = date.getFullYear();
      if (year === selectedYear) {
        const monthKey = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!categoryMonths[expense.category]) {
          categoryMonths[expense.category] = new Set();
        }
        categoryMonths[expense.category].add(monthKey);
      }
    });
    
    // Filtrar categorías con al menos 2 meses
    return availableCategories.filter(category => 
      categoryMonths[category] && categoryMonths[category].size >= 2
    );
  }, [expenses, selectedYear, availableCategories]);

  // Filtrar categorías seleccionadas para mostrar solo las válidas
  const displayCategories = useMemo(() => {
    return selectedCategories.filter(category => 
      category === 'Total' || validCategories.includes(category)
    );
  }, [selectedCategories, validCategories]);

  // Calcular tendencia usando los mismos datos que el gráfico
  const trendAnalysis = useMemo(() => {
    const dataToUse = displayCategories.includes('Total') ? totalMonthlyData : monthlyData;
    
    if (dataToUse.length < 2) return null;
    
    const firstMonth = dataToUse[0].total;
    const lastMonth = dataToUse[dataToUse.length - 1].total;
    const change = lastMonth - firstMonth;
    const percentageChange = firstMonth > 0 ? (change / firstMonth) * 100 : 0;
    
    return {
      change,
      percentageChange,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  }, [displayCategories, totalMonthlyData, monthlyData]);

  // Colores para categorías (excluyendo el azul que usamos para Total)
  const categoryColors = [
    '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
    '#84CC16', '#F97316', '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  const getCategoryColor = (category: string) => {
    if (category === 'Total') return '#3B82F6'; // Azul único para Total
    const index = availableCategories.indexOf(category);
    return categoryColors[index % categoryColors.length];
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Debug: mostrar información sobre los datos
  console.log('ExpenseTrendChart Debug:', {
    expensesCount: expenses.length,
    selectedYear,
    selectedCategories,
    displayCategories,
    validCategories,
    monthlyDataLength: monthlyData.length,
    monthlyData,
    filteredExpenses: filteredExpenses.map(e => ({ date: e.date, amount: e.amount, category: e.category }))
  });

  // Determinar qué datos usar para el gráfico
  // Siempre usar totalMonthlyData si Total está seleccionado, sin importar otras categorías
  const chartData = displayCategories.includes('Total') 
    ? totalMonthlyData 
    : monthlyData;

  // Determinar qué datos usar para mostrar en la lista
  const displayData = displayCategories.includes('Total') 
    ? totalMonthlyData 
    : monthlyData;

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        {state.language === 'es' ? 'Tendencia de Gastos por Tiempo' : 'Expense Trend Over Time'}
      </h3>
      
      {/* Debug info */}
      <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm">
        <p><strong>Debug Info:</strong></p>
        <p>Expenses count: {expenses.length}</p>
        <p>Selected year: {selectedYear}</p>
        <p>Monthly data length: {monthlyData.length}</p>
        <p>Available years: {availableYears.join(', ') || 'None'}</p>
        <p>Available categories: {availableCategories.join(', ') || 'None'}</p>
        <p>Valid categories (2+ months): {validCategories.join(', ') || 'None'}</p>
        <p>Selected categories: {selectedCategories.join(', ') || 'None'}</p>
        <p>Display categories: {displayCategories.join(', ') || 'None'}</p>
        <p>Filtered expenses: {filteredExpenses.length}</p>
        <p>Chart data length: {chartData.length}</p>
        <p>Total monthly data length: {totalMonthlyData.length}</p>
        <p>Using totalMonthlyData: {displayCategories.includes('Total') ? 'YES' : 'NO'}</p>
        <p>Component loaded successfully!</p>
        <p><strong>All expenses details:</strong></p>
        {expenses.map((expense, index) => (
          <p key={index} className="text-xs">
            {expense.description}: ${expense.amount} - {expense.category} - {expense.date}
          </p>
        ))}
        <p><strong>Monthly data details:</strong></p>
        {monthlyData.map((data, index) => (
          <p key={index} className="text-xs">
            {data.month}: ${data.total}
          </p>
        ))}
        <p><strong>Raw monthly data:</strong></p>
        {monthlyData.map((data, index) => (
          <p key={index} className="text-xs">
            Index {index}: {JSON.stringify(data)}
          </p>
        ))}
        <p><strong>Total monthly data:</strong></p>
        {totalMonthlyData.map((data, index) => (
          <p key={index} className="text-xs">
            Total Index {index}: {JSON.stringify(data)}
          </p>
        ))}
      </div>

      {/* Filtros */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">
              {state.language === 'es' ? 'Año:' : 'Year:'}
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableYears.length > 0 ? (
                availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))
              ) : (
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              )}
            </select>
          </div>
        </div>

        {/* Filtro de categorías */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            {state.language === 'es' ? 'Categorías:' : 'Categories:'}
          </label>
          <div className="flex flex-wrap gap-2">
            {/* Opción Total siempre disponible */}
            <button
              onClick={() => toggleCategory('Total')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center space-x-2 ${
                selectedCategories.includes('Total')
                  ? 'border-2'
                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
              }`}
              style={{
                borderColor: selectedCategories.includes('Total') ? '#3B82F6' : undefined,
                backgroundColor: selectedCategories.includes('Total') ? '#3B82F615' : undefined,
                color: selectedCategories.includes('Total') ? '#3B82F6' : undefined
              }}
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: '#3B82F6' }}
              ></div>
              <span>{state.language === 'es' ? 'Total' : 'Total'}</span>
            </button>
            
            {/* Categorías válidas */}
            {validCategories.map(category => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center space-x-2 ${
                  selectedCategories.includes(category)
                    ? 'border-2'
                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                }`}
                style={{
                  borderColor: selectedCategories.includes(category) ? getCategoryColor(category) : undefined,
                  backgroundColor: selectedCategories.includes(category) ? `${getCategoryColor(category)}15` : undefined,
                  color: selectedCategories.includes(category) ? getCategoryColor(category) : undefined
                }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getCategoryColor(category) }}
                ></div>
                <span>{category}</span>
              </button>
            ))}
            
            {/* Categorías no válidas (deshabilitadas) */}
            {availableCategories.filter(cat => !validCategories.includes(cat)).map(category => (
              <button
                key={category}
                disabled
                className="px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
                title={state.language === 'es' ? 'Se necesitan al menos 2 meses de datos' : 'At least 2 months of data needed'}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* Mensaje informativo */}
          {selectedCategories.length > 0 && selectedCategories.some(cat => !validCategories.includes(cat) && cat !== 'Total') && (
            <p className="text-xs text-orange-600 mt-2">
              {state.language === 'es' 
                ? 'Algunas categorías seleccionadas no tienen suficientes datos y no se mostrarán en el gráfico.' 
                : 'Some selected categories don\'t have enough data and won\'t be shown in the chart.'}
            </p>
          )}
        </div>
      </div>

      {/* Análisis de tendencia */}
      {trendAnalysis && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            {trendAnalysis.trend === 'up' ? (
              <TrendingUp className="w-5 h-5 text-red-500" />
            ) : trendAnalysis.trend === 'down' ? (
              <TrendingDown className="w-5 h-5 text-green-500" />
            ) : (
              <div className="w-5 h-5 text-gray-500">─</div>
            )}
            <span className="font-medium text-gray-700">
              {state.language === 'es' ? 'Tendencia:' : 'Trend:'}
            </span>
            <span className={`font-bold ${
              trendAnalysis.trend === 'up' ? 'text-red-600' : 
              trendAnalysis.trend === 'down' ? 'text-green-600' : 'text-gray-600'
            }`}>
              {trendAnalysis.trend === 'up' ? (state.language === 'es' ? 'Aumentando' : 'Increasing') :
               trendAnalysis.trend === 'down' ? (state.language === 'es' ? 'Disminuyendo' : 'Decreasing') :
               (state.language === 'es' ? 'Estable' : 'Stable')}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {state.language === 'es' ? 'Cambio total:' : 'Total change:'} 
            <span className={`font-medium ml-1 ${
              trendAnalysis.change >= 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {trendAnalysis.change >= 0 ? '+' : ''}{formatCurrency(trendAnalysis.change)}
            </span>
            <span className="ml-2">
              ({trendAnalysis.percentageChange >= 0 ? '+' : ''}{trendAnalysis.percentageChange.toFixed(1)}%)
            </span>
          </div>
        </div>
      )}

      {/* Gráfico de líneas */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">
          {state.language === 'es' ? 'Gráfico de Tendencia:' : 'Trend Chart:'}
        </h4>
        <div className="h-64 bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
          {chartData.length > 1 ? (
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 800 200"
              style={{ minHeight: '200px' }}
            >
              {/* Grid lines */}
              {Array.from({ length: 5 }, (_, i) => (
                <line
                  key={`grid-${i}`}
                  x1="50"
                  y1={50 + i * 25}
                  x2="750"
                  y2={50 + i * 25}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}
              
              {/* X-axis line (base line) */}
              <line
                x1="50"
                y1="175"
                x2="750"
                y2="175"
                stroke="#d1d5db"
                strokeWidth="2"
              />

              {/* Y-axis labels */}
              {Array.from({ length: 6 }, (_, i) => {
                const maxValue = Math.max(...chartData.map(d => d.total));
                const value = maxValue - (maxValue / 5) * i;
                return (
                  <text
                    key={`y-label-${i}`}
                    x="10"
                    y={55 + i * 25}
                    fontSize="10"
                    fill="#6b7280"
                    textAnchor="start"
                  >
                    {formatCurrency(Math.round(value))}
                  </text>
                );
              })}

              {/* X-axis labels */}
              {chartData.map((point, index) => (
                <text
                  key={`x-label-${index}`}
                  x={50 + (index * 700) / (chartData.length - 1)}
                  y="190"
                  fontSize="10"
                  fill="#6b7280"
                  textAnchor="middle"
                >
                  {point.month}
                </text>
              ))}

              {/* Total line */}
              {displayCategories.includes('Total') && (
                <g>
                  <path
                    d={chartData.map((point, index) => {
                      const x = 50 + (index * 700) / (chartData.length - 1);
                      const maxValue = Math.max(...chartData.map(d => d.total));
                      const y = 50 + (125) * (1 - point.total / maxValue);
                      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    stroke="#3B82F6"
                    strokeWidth="3"
                    fill="none"
                  />
                  {chartData.map((point, index) => {
                    const x = 50 + (index * 700) / (chartData.length - 1);
                    const maxValue = Math.max(...chartData.map(d => d.total));
                    const y = 50 + (125) * (1 - point.total / maxValue);
                    return (
                      <circle
                        key={`total-point-${index}`}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#3B82F6"
                      />
                    );
                  })}
                </g>
              )}

              {/* Category lines */}
              {displayCategories.filter(category => category !== 'Total').map(category => (
                <g key={`category-${category}`}>
                  <path
                    d={chartData.map((point, index) => {
                      const x = 50 + (index * 700) / (chartData.length - 1);
                      const maxValue = Math.max(...chartData.map(d => d.total));
                      const value = point.categories[category] || 0;
                      const y = 50 + (125) * (1 - value / maxValue);
                      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    stroke={getCategoryColor(category)}
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5,5"
                  />
                  {chartData.map((point, index) => {
                    const x = 50 + (index * 700) / (chartData.length - 1);
                    const maxValue = Math.max(...chartData.map(d => d.total));
                    const value = point.categories[category] || 0;
                    const y = 50 + (125) * (1 - value / maxValue);
                    return (
                      <circle
                        key={`${category}-point-${index}`}
                        cx={x}
                        cy={y}
                        r="3"
                        fill={getCategoryColor(category)}
                      />
                    );
                  })}
                </g>
              ))}
            </svg>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {chartData.length === 0 ? 
                (state.language === 'es' ? 'No hay datos para el año seleccionado' : 'No data for selected year') :
                (state.language === 'es' ? 'Se necesitan al menos 2 meses de datos para mostrar el gráfico' : 'At least 2 months of data needed to show chart')
              }
            </div>
          )}
        </div>
      </div>

      {/* Datos mensuales - Barras */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-700">
            {state.language === 'es' ? 'Datos por Mes:' : 'Monthly Data:'}
          </h4>
          {displayData.length > 0 && (
            <button
              onClick={() => setShowMonthlyData(!showMonthlyData)}
              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              {showMonthlyData 
                ? (state.language === 'es' ? 'Ocultar' : 'Hide') 
                : (state.language === 'es' ? 'Mostrar' : 'Show')
              }
            </button>
          )}
        </div>
        
        {displayData.length > 0 ? (
          <>
            {/* Datos expandidos */}
            {showMonthlyData && (
              <div className="space-y-4">
                {displayData.map((point, index) => {
                  const maxAmount = Math.max(...displayData.map(d => d.total));
                  const percentage = (point.total / maxAmount) * 100;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">{point.month}</span>
                        <span className="text-gray-900">{formatCurrency(point.total)}</span>
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
            )}
          </>
        ) : (
          <p className="text-gray-500 text-center py-4">
            {state.language === 'es' ? 'No hay datos mensuales disponibles' : 'No monthly data available'}
          </p>
        )}
      </div>

    </Card>
  );
} 