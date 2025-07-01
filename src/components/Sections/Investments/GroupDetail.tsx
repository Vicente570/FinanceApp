import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Card } from '../../Common/Card';
import { Button } from '../../Common/Button';
import { EditModal } from '../../Common/EditModal';
import { ArrowLeft, TrendingUp, TrendingDown, Edit, DollarSign, Target, Calendar } from 'lucide-react';

const assetTypes = [
  { value: 'stocks', label: 'Acciones' },
  { value: 'crypto', label: 'Criptomonedas' },
  { value: 'mutual_funds', label: 'Fondos Mutuos' },
  { value: 'bonds', label: 'Bonos' }
];

const riskLevels = [
  { value: 'low', label: 'Bajo', color: 'green' },
  { value: 'medium', label: 'Medio', color: 'yellow' },
  { value: 'high', label: 'Alto', color: 'red' }
];

export function GroupDetail() {
  const { state, navigate, getAssetsByGroup, updateAsset, deleteAsset } = useApp();
  const { navigation, assetGroups } = state;
  
  const [editingAsset, setEditingAsset] = useState<any>(null);
  
  const groupId = navigation.groupId;
  const group = assetGroups.find(g => g.id === groupId);
  const groupAssets = groupId ? getAssetsByGroup(groupId) : [];

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {state.language === 'es' ? 'Grupo no encontrado' : 'Group not found'}
        </p>
        <Button
          onClick={() => navigate({ section: 'B', subsection: '1' })}
          className="mt-4"
        >
          {state.language === 'es' ? 'Volver a Activos' : 'Back to Assets'}
        </Button>
      </div>
    );
  }

  // Función para calcular valores correctos de activos
  const getAssetCalculations = (asset: any) => {
    // Si el activo tiene los nuevos campos, usarlos
    if (asset.currentPricePerUnit && asset.purchasePricePerUnit) {
      const totalCurrent = asset.currentPricePerUnit * asset.quantity;
      const totalPurchase = asset.purchasePricePerUnit * asset.quantity;
      return {
        currentValue: totalCurrent,
        purchaseValue: totalPurchase,
        gainLoss: totalCurrent - totalPurchase,
        gainLossPercentage: totalPurchase > 0 ? ((totalCurrent - totalPurchase) / totalPurchase) * 100 : 0,
        currentPricePerUnit: asset.currentPricePerUnit,
        purchasePricePerUnit: asset.purchasePricePerUnit
      };
    } else {
      // Para activos existentes sin los nuevos campos, usar la lógica anterior
      return {
        currentValue: asset.value,
        purchaseValue: asset.purchasePrice,
        gainLoss: asset.value - asset.purchasePrice,
        gainLossPercentage: asset.purchasePrice > 0 ? ((asset.value - asset.purchasePrice) / asset.purchasePrice) * 100 : 0,
        currentPricePerUnit: asset.quantity > 0 ? asset.value / asset.quantity : 0,
        purchasePricePerUnit: asset.quantity > 0 ? asset.purchasePrice / asset.quantity : 0
      };
    }
  };

  // Calcular estadísticas del grupo
  let totalValue = 0;
  let totalCost = 0;
  
  groupAssets.forEach(asset => {
    const calc = getAssetCalculations(asset);
    totalValue += calc.currentValue;
    totalCost += calc.purchaseValue;
  });
  
  const totalGainLoss = totalValue - totalCost;
  const totalPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  // Crear datos para el gráfico de torta
  const createPieChart = (assets: any[]) => {
    let cumulativePercentage = 0;
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];
    
    return assets.map((asset, index) => {
      const calc = getAssetCalculations(asset);
      const percentage = totalValue > 0 ? (calc.currentValue / totalValue) * 100 : 0;
      cumulativePercentage += percentage;
      
      return {
        ...asset,
        ...calc,
        percentage,
        color: colors[index % colors.length]
      };
    });
  };

  const pieData = createPieChart(groupAssets);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Campos para editar activos
  const assetEditFields = [
    { key: 'name', label: 'Nombre del activo', type: 'text' as const, required: true },
    { key: 'type', label: 'Tipo', type: 'select' as const, options: assetTypes, required: true },
    { key: 'currentPricePerUnit', label: 'Precio actual por unidad', type: 'number' as const, required: true },
    { key: 'purchasePricePerUnit', label: 'Precio de compra por unidad', type: 'number' as const, required: true },
    { key: 'quantity', label: 'Cantidad', type: 'number' as const, required: true },
    { key: 'riskLevel', label: 'Nivel de riesgo', type: 'select' as const, options: riskLevels, required: true },
    { key: 'purchaseDate', label: 'Fecha de compra', type: 'date' as const },
    { key: 'reason', label: 'Razón de inversión', type: 'text' as const },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            icon={ArrowLeft}
            variant="ghost"
            onClick={() => navigate({ section: 'B', subsection: '1' })}
          >
            {state.language === 'es' ? 'Volver' : 'Back'}
          </Button>
          <div className="flex items-center space-x-3">
            <div 
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: group.color }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              {group.description && (
                <p className="text-gray-600">{group.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {state.language === 'es' ? 'Activos' : 'Assets'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{groupAssets.length}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {state.language === 'es' ? 'Valor Total' : 'Total Value'}
              </p>
              <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {state.language === 'es' ? 'Ganancia/Pérdida' : 'Gain/Loss'}
              </p>
              <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString()}
              </p>
            </div>
            {totalGainLoss >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-500" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-500" />
            )}
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {state.language === 'es' ? 'Rendimiento' : 'Performance'}
              </p>
              <p className={`text-2xl font-bold ${totalPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPercentage >= 0 ? '+' : ''}{totalPercentage.toFixed(1)}%
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Gráficos y análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de distribución */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {state.language === 'es' ? 'Distribución de Activos' : 'Asset Distribution'}
          </h3>
          
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="20"
                />
                {pieData.map((item, index) => {
                  const circumference = 2 * Math.PI * 40;
                  const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((pieData.slice(0, index).reduce((sum, prev) => sum + prev.percentage, 0) / 100) * circumference);
                  
                  return (
                    <circle
                      key={item.id}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="20"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">
                    {state.language === 'es' ? 'Total' : 'Total'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {pieData.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-gray-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-900 font-semibold">${item.currentValue.toLocaleString()}</span>
                  <span className="text-gray-500 text-sm ml-2">({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Rendimiento por activo */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {state.language === 'es' ? 'Rendimiento por Activo' : 'Performance by Asset'}
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {groupAssets.map((asset) => {
              const calc = getAssetCalculations(asset);
              const daysSincePurchase = asset.purchaseDate ? 
                Math.floor((new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
              
              return (
                <div key={asset.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900">{asset.name}</h4>
                        <button
                          onClick={() => setEditingAsset({
                            ...asset,
                            currentPricePerUnit: calc.currentPricePerUnit,
                            purchasePricePerUnit: calc.purchasePricePerUnit
                          })}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title={state.language === 'es' ? 'Editar activo' : 'Edit asset'}
                        >
                          <Edit className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">
                        {assetTypes.find(t => t.value === asset.type)?.label || asset.type}
                      </p>
                      {asset.reason && (
                        <p className="text-xs text-gray-500 mt-1">
                          {state.language === 'es' ? 'Razón: ' : 'Reason: '}{asset.reason}
                        </p>
                      )}
                      {asset.purchaseDate && (
                        <p className="text-xs text-gray-500">
                          {state.language === 'es' 
                            ? `Mantenido por ${daysSincePurchase} días`
                            : `Held for ${daysSincePurchase} days`
                          }
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        ${calc.currentValue.toLocaleString()}
                      </p>
                      <div className={`text-sm font-medium ${calc.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <p>{calc.gainLoss >= 0 ? '+' : ''}${calc.gainLoss.toLocaleString()}</p>
                        <p>{calc.gainLoss >= 0 ? '+' : ''}{calc.gainLossPercentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {state.language === 'es' ? 'Precio compra: ' : 'Purchase price: '}
                      ${calc.purchasePricePerUnit.toFixed(2)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(asset.riskLevel)}`}>
                      {riskLevels.find(r => r.value === asset.riskLevel)?.label || asset.riskLevel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Lista detallada de activos */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {state.language === 'es' ? 'Todos los Activos del Grupo' : 'All Group Assets'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupAssets.map((asset) => {
            const calc = getAssetCalculations(asset);
            const typeLabel = assetTypes.find(t => t.value === asset.type)?.label || asset.type;
            const riskLabel = riskLevels.find(r => r.value === asset.riskLevel)?.label || asset.riskLevel;
            const daysSincePurchase = asset.purchaseDate ? 
              Math.floor((new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
            
            return (
              <div key={asset.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{asset.name}</h4>
                      <p className="text-sm text-gray-600">{typeLabel}</p>
                      {asset.reason && (
                        <p className="text-xs text-gray-500 mt-1">{asset.reason}</p>
                      )}
                      {asset.purchaseDate && (
                        <p className="text-xs text-gray-500">
                          {state.language === 'es' 
                            ? `Mantenido por ${daysSincePurchase} días`
                            : `Held for ${daysSincePurchase} days`
                          }
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(asset.riskLevel)}`}>
                        {riskLabel}
                      </span>
                      <button
                        onClick={() => setEditingAsset({
                          ...asset,
                          currentPricePerUnit: calc.currentPricePerUnit,
                          purchasePricePerUnit: calc.purchasePricePerUnit
                        })}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title={state.language === 'es' ? 'Editar activo' : 'Edit asset'}
                      >
                        <Edit className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">${calc.currentValue.toLocaleString()}</p>
                    <div className="flex items-center justify-center space-x-2 mt-1">
                      {calc.gainLoss >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <div className="text-center">
                        <span className={`font-semibold ${calc.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {calc.gainLoss >= 0 ? '+' : ''}${calc.gainLoss.toLocaleString()}
                        </span>
                        <span className={`text-sm ml-2 ${calc.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ({calc.gainLoss >= 0 ? '+' : ''}{calc.gainLossPercentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>{state.language === 'es' ? 'Precio actual:' : 'Current price:'}</span>
                      <span>${calc.currentPricePerUnit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{state.language === 'es' ? 'Precio compra:' : 'Purchase price:'}</span>
                      <span>${calc.purchasePricePerUnit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{state.language === 'es' ? 'Cantidad:' : 'Quantity:'}</span>
                      <span>{asset.quantity}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Modal de edición de activos */}
      <EditModal
        isOpen={!!editingAsset}
        onClose={() => setEditingAsset(null)}
        onSave={(data) => {
          // Recalcular valores totales basados en precios unitarios
          const totalCurrent = data.currentPricePerUnit * data.quantity;
          const totalPurchase = data.purchasePricePerUnit * data.quantity;
          
          updateAsset(editingAsset.id, {
            ...data,
            value: totalCurrent,
            purchasePrice: totalPurchase
          });
        }}
        onDelete={() => deleteAsset(editingAsset.id)}
        title={state.language === 'es' ? 'Editar Activo' : 'Edit Asset'}
        data={editingAsset || {}}
        fields={assetEditFields}
      />
    </div>
  );
}