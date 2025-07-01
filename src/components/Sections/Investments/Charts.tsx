import React from 'react';
import { useApp } from '../../../context/AppContext';
import { Card } from '../../Common/Card';
import { TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react';

export function Charts() {
  const { state, getAssetsByGroup } = useApp();
  const { assets, assetGroups } = state;

  // Función para calcular valores correctos de activos
  const getAssetCalculations = (asset: any) => {
    if (asset.currentPricePerUnit && asset.purchasePricePerUnit) {
      const totalCurrent = asset.currentPricePerUnit * asset.quantity;
      const totalPurchase = asset.purchasePricePerUnit * asset.quantity;
      return {
        currentValue: totalCurrent,
        purchaseValue: totalPurchase,
        gainLoss: totalCurrent - totalPurchase,
        gainLossPercentage: totalPurchase > 0 ? ((totalCurrent - totalPurchase) / totalPurchase) * 100 : 0
      };
    } else {
      return {
        currentValue: asset.value,
        purchaseValue: asset.purchasePrice,
        gainLoss: asset.value - asset.purchasePrice,
        gainLossPercentage: asset.purchasePrice > 0 ? ((asset.value - asset.purchasePrice) / asset.purchasePrice) * 100 : 0
      };
    }
  };

  // Calcular distribución por tipo de activo
  const assetsByType = assets.reduce((acc, asset) => {
    const calc = getAssetCalculations(asset);
    if (!acc[asset.type]) {
      acc[asset.type] = { value: 0, count: 0 };
    }
    acc[asset.type].value += calc.currentValue;
    acc[asset.type].count += 1;
    return acc;
  }, {} as Record<string, { value: number; count: number }>);

  const totalAssetValue = Object.values(assetsByType).reduce((sum, type) => sum + type.value, 0);

  // Crear datos para gráfico de torta de tipos de activos
  const createAssetTypePieChart = () => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    const typeLabels = {
      stocks: state.language === 'es' ? 'Acciones' : 'Stocks',
      crypto: state.language === 'es' ? 'Criptomonedas' : 'Crypto',
      mutual_funds: state.language === 'es' ? 'Fondos Mutuos' : 'Mutual Funds',
      bonds: state.language === 'es' ? 'Bonos' : 'Bonds'
    };

    return Object.entries(assetsByType).map(([type, data], index) => {
      const percentage = totalAssetValue > 0 ? (data.value / totalAssetValue) * 100 : 0;
      return {
        type,
        label: typeLabels[type as keyof typeof typeLabels] || type,
        value: data.value,
        count: data.count,
        percentage,
        color: colors[index % colors.length]
      };
    });
  };

  // Calcular estadísticas por grupo
  const getGroupStats = () => {
    return assetGroups.map(group => {
      const groupAssets = getAssetsByGroup(group.id);
      let totalValue = 0;
      let totalCost = 0;
      
      groupAssets.forEach(asset => {
        const calc = getAssetCalculations(asset);
        totalValue += calc.currentValue;
        totalCost += calc.purchaseValue;
      });
      
      const totalGainLoss = totalValue - totalCost;
      const percentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
      
      return {
        ...group,
        totalValue,
        totalCost,
        totalGainLoss,
        percentage,
        assetCount: groupAssets.length
      };
    });
  };

  // Crear datos para gráfico de torta de grupos
  const createGroupPieChart = () => {
    const groupStats = getGroupStats();
    const totalGroupValue = groupStats.reduce((sum, group) => sum + group.totalValue, 0);
    
    return groupStats.map(group => {
      const percentage = totalGroupValue > 0 ? (group.totalValue / totalGroupValue) * 100 : 0;
      return {
        ...group,
        percentage
      };
    });
  };

  const assetTypePieData = createAssetTypePieChart();
  const groupPieData = createGroupPieChart();

  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-gray-900">
        {state.language === 'es' ? 'Gráficos de Inversiones' : 'Investment Charts'}
      </h2>

      {/* Distribución por Tipo de Activo */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {state.language === 'es' ? 'Distribución por Tipo de Activo' : 'Distribution by Asset Type'}
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
                {assetTypePieData.map((item, index) => {
                  const circumference = 2 * Math.PI * 35;
                  const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((assetTypePieData.slice(0, index).reduce((sum, prev) => sum + prev.percentage, 0) / 100) * circumference);
                  
                  return (
                    <circle
                      key={item.type}
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
                  <p className="text-xl font-bold text-gray-900">${totalAssetValue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">
                    {state.language === 'es' ? 'Total' : 'Total'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Leyenda */}
          <div className="space-y-3">
            {assetTypePieData.map((item) => (
              <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <p className="text-xs text-gray-500">{item.count} {state.language === 'es' ? 'activos' : 'assets'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-gray-900 font-semibold">${item.value.toLocaleString()}</span>
                  <span className="text-gray-500 text-sm ml-2">({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Distribución por Grupos de Inversión */}
      {assetGroups.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {state.language === 'es' ? 'Distribución por Grupos de Inversión' : 'Distribution by Investment Groups'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Gráfico de Torta de Grupos */}
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
                  {groupPieData.map((group, index) => {
                    const circumference = 2 * Math.PI * 35;
                    const strokeDasharray = `${(group.percentage / 100) * circumference} ${circumference}`;
                    const strokeDashoffset = -((groupPieData.slice(0, index).reduce((sum, prev) => sum + prev.percentage, 0) / 100) * circumference);
                    
                    return (
                      <circle
                        key={group.id}
                        cx="50"
                        cy="50"
                        r="35"
                        fill="none"
                        stroke={group.color}
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
                    <p className="text-xl font-bold text-gray-900">
                      ${groupPieData.reduce((sum, group) => sum + group.totalValue, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {state.language === 'es' ? 'En Grupos' : 'In Groups'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Leyenda de Grupos */}
            <div className="space-y-3">
              {groupPieData.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <div>
                      <span className="font-medium text-gray-700">{group.name}</span>
                      <p className="text-xs text-gray-500">{group.assetCount} {state.language === 'es' ? 'activos' : 'assets'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-900 font-semibold">${group.totalValue.toLocaleString()}</span>
                    <span className="text-gray-500 text-sm ml-2">({group.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Rendimiento por Grupo */}
      {assetGroups.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {state.language === 'es' ? 'Rendimiento por Grupo' : 'Performance by Group'}
          </h3>
          <div className="space-y-4">
            {getGroupStats().map((group) => (
              <div key={group.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="font-medium text-gray-700">{group.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      ${group.totalValue.toLocaleString()}
                    </span>
                    <div className={`flex items-center space-x-1 ${
                      group.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {group.totalGainLoss >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="font-medium">
                        {group.totalGainLoss >= 0 ? '+' : ''}${group.totalGainLoss.toLocaleString()}
                      </span>
                      <span className="text-sm">
                        ({group.totalGainLoss >= 0 ? '+' : ''}{group.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      group.percentage >= 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min(Math.abs(group.percentage), 100)}%`,
                      backgroundColor: group.color,
                      opacity: group.percentage >= 0 ? 1 : 0.7
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Resumen de Rendimiento Total */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {state.language === 'es' ? 'Resumen de Rendimiento Total' : 'Total Performance Summary'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {(() => {
            const totalCurrentValue = assets.reduce((sum, asset) => {
              const calc = getAssetCalculations(asset);
              return sum + calc.currentValue;
            }, 0);
            
            const totalPurchaseValue = assets.reduce((sum, asset) => {
              const calc = getAssetCalculations(asset);
              return sum + calc.purchaseValue;
            }, 0);
            
            const totalGainLoss = totalCurrentValue - totalPurchaseValue;
            const totalPercentage = totalPurchaseValue > 0 ? (totalGainLoss / totalPurchaseValue) * 100 : 0;
            
            return (
              <>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-600">{state.language === 'es' ? 'Valor Actual' : 'Current Value'}</p>
                  <p className="text-xl font-bold text-gray-900">${totalCurrentValue.toLocaleString()}</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Target className="w-6 h-6 text-purple-500" />
                  </div>
                  <p className="text-sm text-gray-600">{state.language === 'es' ? 'Inversión Total' : 'Total Investment'}</p>
                  <p className="text-xl font-bold text-gray-900">${totalPurchaseValue.toLocaleString()}</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {totalGainLoss >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{state.language === 'es' ? 'Ganancia/Pérdida' : 'Gain/Loss'}</p>
                  <p className={`text-xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString()}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {totalPercentage >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{state.language === 'es' ? 'Rendimiento' : 'Performance'}</p>
                  <p className={`text-xl font-bold ${totalPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalPercentage >= 0 ? '+' : ''}{totalPercentage.toFixed(1)}%
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      </Card>
    </div>
  );
}