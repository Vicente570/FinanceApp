import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import { Card } from '../../Common/Card';
import { Button } from '../../Common/Button';
import { EditModal } from '../../Common/EditModal';
import { StockSelector } from '../../Common/StockSelector';
import { RealTimeIndicator } from '../../Common/RealTimeIndicator';
import { AppleSelect } from '../../Common/AppleSelect';
import { Plus, TrendingUp, TrendingDown, Edit, Folder, FolderOpen, Users, BarChart3, ArrowRight, Calculator, RefreshCw, Wifi, WifiOff, Settings } from 'lucide-react';
import { stockApiService, StockData } from '../../../services/stockApi';
import { useRealTimeStocks } from '../../../hooks/useRealTimeStocks';

const assetTypes = [
  { value: 'stocks', label: 'Acciones' },
  { value: 'crypto', label: 'Criptomonedas' },
  { value: 'mutual_funds', label: 'Fondos Mutuos' },
  { value: 'bonds', label: 'Bonos' }
];

const riskLevels = [
  { value: 'low', label: 'Bajo', color: 'green' },
  { value: 'medium', label: 'Medio', color: 'yellow' },
  { value: 'high', label: 'Alto', color: 'red' },
  { value: 'very_high', label: 'Muy Alto', color: 'purple' }
];

const groupColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
];

export function Assets() {
  const { 
    state, 
    addAsset, 
    updateAsset, 
    deleteAsset, 
    addAssetGroup, 
    updateAssetGroup, 
    deleteAssetGroup,
    assignAssetToGroup,
    getAssetsByGroup,
    getUnassignedAssets,
    getEmergencyFundValue,
    syncEmergencyFund,
    navigate
  } = useApp();
  const { assets, assetGroups } = state;

  // Función helper para formatear monedas (los valores ya están convertidos en el estado)
  const formatCurrency = (amount: number) => {
    // Para USD, siempre usar formato inglés para consistencia
    const locale = state.currency === 'USD' ? 'en-US' : (state.language === 'es' ? 'es-ES' : 'en-US');
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: state.currency,
      minimumFractionDigits: (state.currency === 'JPY' || state.currency === 'CLP') ? 0 : 2,
      maximumFractionDigits: (state.currency === 'JPY' || state.currency === 'CLP') ? 0 : 4
    }).format(amount);
  };
  
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [showRealTimeSettings, setShowRealTimeSettings] = useState(false);
  const [realTimeSettings, setRealTimeSettings] = useState({
    enabled: true,
    updateInterval: 600000 // 10 minutos por defecto
  });
  const [tempRealTimeSettings, setTempRealTimeSettings] = useState({
    enabled: true,
    updateInterval: 600000 // 10 minutos por defecto
  });
  
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'stocks' as any,
    currentPrice: 0,
    purchasePrice: 0,
    quantity: 0,
    riskLevel: 'medium' as any,
    purchaseDate: new Date().toISOString().split('T')[0],
    reason: '',
    groupId: '',
    symbol: '', // Para acciones
    isConnectedToApi: false
  });
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    color: groupColors[0]
  });

  // Hook para actualizaciones en tiempo real
  const { 
    isUpdating: isRealTimeUpdating, 
    updateNow, 
    connectedStocksCount 
  } = useRealTimeStocks({
    updateInterval: realTimeSettings.updateInterval,
    enabled: realTimeSettings.enabled
  });

  // Sincronizar fondo de emergencia solo al montar el componente
  useEffect(() => {
    // Limpiar activos duplicados de emergencia primero
    const emergencyAssets = assets.filter(asset => asset.groupId === 'emergency-fund');
    if (emergencyAssets.length > 1) {
      console.log('🧹 Cleaning duplicate emergency assets on mount:', emergencyAssets.length);
      // Eliminar todos los activos de emergencia duplicados
      emergencyAssets.slice(1).forEach(asset => {
        deleteAsset(asset.id);
      });
    }
    
    // Solo sincronizar si hay cuentas de ahorro y no hay activos de emergencia
    const hasSavingsAccounts = state.accounts.some(account => account.type === 'savings');
    const hasEmergencyAsset = assets.some(asset => asset.groupId === 'emergency-fund');
    
    if (hasSavingsAccounts && !hasEmergencyAsset) {
      console.log('🔄 Initial sync of emergency fund');
      syncEmergencyFund();
    }
  }, []); // Solo se ejecuta al montar el componente

  // Cálculos automáticos para el nuevo activo
  const totalPurchaseValue = newAsset.purchasePrice * newAsset.quantity;
  const totalCurrentValue = newAsset.currentPrice * newAsset.quantity;
  const gainLoss = totalCurrentValue - totalPurchaseValue;
  const gainLossPercentage = totalPurchaseValue > 0 ? (gainLoss / totalPurchaseValue) * 100 : 0;

  // Manejar selección de stock desde la API
  const handleStockSelect = (stockData: StockData) => {
    setNewAsset(prev => ({
      ...prev,
      name: stockData.name,
      symbol: stockData.symbol,
      currentPrice: stockData.price,
      purchasePrice: stockData.price, // Inicialmente igual al precio actual
      isConnectedToApi: stockData.isConnected
    }));
  };

  // Actualizar precios de todas las acciones conectadas (manual)
  const updateAllStockPrices = async () => {
    setIsUpdatingPrices(true);
    await updateNow();
    setIsUpdatingPrices(false);
  };

  const handleAddAsset = () => {
    if (newAsset.name && newAsset.currentPrice > 0 && newAsset.purchasePrice > 0 && newAsset.quantity > 0) {
      addAsset({
        name: newAsset.name,
        type: newAsset.type,
        value: totalCurrentValue, // Valor actual calculado
        purchasePrice: totalPurchaseValue, // Valor total de compra
        quantity: newAsset.quantity,
        riskLevel: newAsset.riskLevel,
        purchaseDate: newAsset.purchaseDate,
        reason: newAsset.reason,
        currency: state.currency,
        groupId: newAsset.groupId || undefined,
        // Nuevos campos para mantener los precios unitarios
        currentPricePerUnit: newAsset.currentPrice,
        purchasePricePerUnit: newAsset.purchasePrice,
        symbol: newAsset.symbol || undefined,
        isConnectedToApi: newAsset.isConnectedToApi
      });
      setNewAsset({
        name: '',
        type: 'stocks',
        currentPrice: 0,
        purchasePrice: 0,
        quantity: 0,
        riskLevel: 'medium',
        purchaseDate: new Date().toISOString().split('T')[0],
        reason: '',
        groupId: '',
        symbol: '',
        isConnectedToApi: false
      });
      setShowAddAsset(false);
    }
  };

  const handleAddGroup = () => {
    if (newGroup.name) {
      addAssetGroup({
        name: newGroup.name,
        description: newGroup.description,
        color: newGroup.color,
        createdDate: new Date().toISOString(),
      });
      setNewGroup({
        name: '',
        description: '',
        color: groupColors[0]
      });
      setShowAddGroup(false);
    }
  };

  const handleViewGroupDetails = (groupId: string) => {
    navigate({ 
      section: 'B', 
      subsection: '1', 
      subsubsection: 'group-detail',
      groupId 
    });
  };

  const handleAssignToGroup = (assetId: string, groupId: string) => {
    assignAssetToGroup(assetId, groupId);
  };

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'very_high': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Función para calcular valores correctos de activos existentes
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

  const groupEditFields = [
    { key: 'name', label: 'Nombre del grupo', type: 'text' as const, required: true },
    { key: 'description', label: 'Descripción', type: 'text' as const },
  ];

  const unassignedAssets = getUnassignedAssets();

  // Función para manejar la eliminación de grupos
  const handleGroupDelete = () => {
    if (editingGroup && editingGroup.isSpecial !== true) {
      deleteAssetGroup(editingGroup.id);
    }
  };

  // Calcular estadísticas por grupo
  const getGroupStats = (groupId: string) => {
    const groupAssets = getAssetsByGroup(groupId);
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
      totalValue,
      totalCost,
      totalGainLoss,
      percentage,
      assetCount: groupAssets.length
    };
  };

  // Contar activos conectados a APIs
  const totalStocks = assets.filter(asset => asset.type === 'stocks').length;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {state.language === 'es' ? 'Mis Activos por Grupos' : 'My Assets by Groups'}
          </h2>
          {totalStocks > 0 && (
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Wifi className="w-4 h-4 text-green-500" />
                <span>
                  {connectedStocksCount} / {totalStocks} {state.language === 'es' ? 'acciones conectadas' : 'stocks connected'}
                </span>
              </div>
              <Button
                icon={RefreshCw}
                variant="outline"
                size="sm"
                onClick={updateAllStockPrices}
                disabled={isUpdatingPrices || isRealTimeUpdating}
                className={isUpdatingPrices || isRealTimeUpdating ? 'animate-pulse' : ''}
              >
                {isUpdatingPrices || isRealTimeUpdating
                  ? (state.language === 'es' ? 'Actualizando...' : 'Updating...') 
                  : (state.language === 'es' ? 'Actualizar Ahora' : 'Update Now')
                }
              </Button>
              <Button
                icon={Settings}
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTempRealTimeSettings(realTimeSettings);
                  setShowRealTimeSettings(!showRealTimeSettings);
                }}
              >
                {state.language === 'es' ? 'Configurar' : 'Settings'}
              </Button>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            icon={Folder}
            variant="outline"
            onClick={() => setShowAddGroup(true)}
          >
            {state.language === 'es' ? 'Crear Grupo' : 'Create Group'}
          </Button>
          <Button
            icon={Plus}
            onClick={() => setShowAddAsset(true)}
          >
            {state.language === 'es' ? 'Agregar Activo' : 'Add Asset'}
          </Button>
        </div>
      </div>

      {/* Indicador de tiempo real */}
      {connectedStocksCount > 0 && (
        <RealTimeIndicator 
          language={state.language}
          updateInterval={realTimeSettings.updateInterval}
          enabled={realTimeSettings.enabled}
        />
      )}

      {/* Configuración de tiempo real */}
      {showRealTimeSettings && (
        <Card className="border-blue-200 bg-blue-50">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600" />
              {state.language === 'es' ? 'Configuración de Tiempo Real' : 'Real-Time Settings'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tempRealTimeSettings.enabled}
                    onChange={(e) => setTempRealTimeSettings(prev => ({ ...prev, enabled: !!e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {state.language === 'es' ? 'Activar actualizaciones automáticas' : 'Enable automatic updates'}
                  </span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {state.language === 'es' ? 'Intervalo de actualización' : 'Update interval'}
                </label>
                <AppleSelect
                  value={String(tempRealTimeSettings.updateInterval)}
                  onChange={val => setTempRealTimeSettings(prev => ({ ...prev, updateInterval: Number(val) }))}
                  options={[
                    { value: '600000', label: `10 ${state.language === 'es' ? 'minutos' : 'minutes'}` },
                    { value: '1200000', label: `20 ${state.language === 'es' ? 'minutos' : 'minutes'}` },
                    { value: '1800000', label: `30 ${state.language === 'es' ? 'minutos' : 'minutes'}` },
                  ]}
                  placeholder={state.language === 'es' ? 'Intervalo' : 'Interval'}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>{state.language === 'es' ? 'Nota:' : 'Note:'}</strong> {' '}
                {state.language === 'es' 
                  ? 'Las actualizaciones automáticas se realizan cada 10-30 minutos para respetar los límites de las APIs gratuitas.'
                  : 'Automatic updates occur every 10-30 minutes to respect free API limits.'
                }
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setTempRealTimeSettings(realTimeSettings);
                  setShowRealTimeSettings(false);
                }}
              >
                {state.language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button
                onClick={() => {
                  setRealTimeSettings(tempRealTimeSettings);
                  setShowRealTimeSettings(false);
                }}
              >
                {state.language === 'es' ? 'Aceptar' : 'Accept'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Formulario para agregar grupo */}
      {showAddGroup && (
        <Card>
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">
              {state.language === 'es' ? 'Nuevo Grupo de Activos' : 'New Asset Group'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder={state.language === 'es' ? 'Nombre del grupo (ej: Acciones Tecnológicas)' : 'Group name (e.g: Tech Stocks)'}
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder={state.language === 'es' ? 'Descripción (opcional)' : 'Description (optional)'}
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {state.language === 'es' ? 'Color del grupo' : 'Group color'}
                </label>
                <div className="flex space-x-2">
                  {groupColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewGroup({ ...newGroup, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newGroup.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAddGroup}>
                {state.language === 'es' ? 'Crear Grupo' : 'Create Group'}
              </Button>
              <Button
                onClick={() => setShowAddGroup(false)}
                variant="ghost"
              >
                {state.language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Formulario para agregar activo con integración de APIs */}
      {showAddAsset && (
        <Card>
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <h3 className="font-medium text-gray-900">
                {state.language === 'es' ? 'Nuevo Activo - Cálculo Automático' : 'New Asset - Automatic Calculation'}
              </h3>
            </div>
            
            {/* Selector de tipo de activo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {state.language === 'es' ? 'Tipo de activo' : 'Asset type'}
              </label>
              <AppleSelect
                value={newAsset.type}
                onChange={val => setNewAsset({ ...newAsset, type: val as any })}
                options={assetTypes}
                placeholder={state.language === 'es' ? 'Tipo de activo' : 'Asset type'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Selector de acciones con API (solo para tipo 'stocks') */}
            {newAsset.type === 'stocks' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {state.language === 'es' ? 'Buscar y seleccionar acción' : 'Search and select stock'}
                </label>
                <StockSelector
                  onSelect={handleStockSelect}
                  selectedSymbol={newAsset.symbol}
                  language={state.language}
                />
              </div>
            )}

            {/* Campos manuales para otros tipos o cuando no se selecciona acción */}
            {(newAsset.type !== 'stocks' || !newAsset.symbol) && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder={state.language === 'es' ? 'Nombre del activo' : 'Asset name'}
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campos de entrada principales */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {state.language === 'es' ? 'Precio actual por unidad' : 'Current price per unit'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newAsset.currentPrice || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, currentPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={newAsset.type === 'stocks' && newAsset.symbol && newAsset.isConnectedToApi}
                />
                {newAsset.type === 'stocks' && newAsset.symbol && newAsset.isConnectedToApi && (
                  <p className="text-xs text-green-600 flex items-center">
                    <Wifi className="w-3 h-3 mr-1" />
                    {state.language === 'es' ? 'Precio actualizado automáticamente' : 'Price updated automatically'}
                  </p>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {state.language === 'es' ? 'Precio de compra por unidad' : 'Purchase price per unit'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newAsset.purchasePrice || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, purchasePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {state.language === 'es' ? 'Cantidad de unidades' : 'Number of units'}
                </label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0"
                  value={newAsset.quantity || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  {state.language === 'es' ? 'Nivel de riesgo' : 'Risk level'}
                </label>
                <AppleSelect
                  value={newAsset.riskLevel}
                  onChange={(value) => setNewAsset({ ...newAsset, riskLevel: value as any })}
                  options={riskLevels}
                  placeholder={state.language === 'es' ? 'Seleccionar nivel de riesgo' : 'Select risk level'}
                />
                <p className="text-xs text-gray-500">
                  {newAsset.riskLevel === 'low' && (
                    state.language === 'es' 
                      ? 'Bajo riesgo: Inversiones estables con menor volatilidad (ej: bonos gubernamentales, fondos indexados)'
                      : 'Low risk: Stable investments with lower volatility (e.g., government bonds, index funds)'
                  )}
                  {newAsset.riskLevel === 'medium' && (
                    state.language === 'es'
                      ? 'Riesgo medio: Inversiones balanceadas con volatilidad moderada (ej: acciones de empresas establecidas)'
                      : 'Medium risk: Balanced investments with moderate volatility (e.g., established company stocks)'
                  )}
                  {newAsset.riskLevel === 'high' && (
                    state.language === 'es'
                      ? 'Alto riesgo: Inversiones volátiles con mayor potencial de ganancia/pérdida (ej: criptomonedas, acciones de crecimiento)'
                      : 'High risk: Volatile investments with higher profit/loss potential (e.g., cryptocurrencies, growth stocks)'
                  )}
                </p>
              </div>
              
              <input
                type="date"
                value={newAsset.purchaseDate || ''}
                onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              
              <AppleSelect
                value={newAsset.groupId}
                onChange={val => setNewAsset({ ...newAsset, groupId: val })}
                options={[
                  { value: '', label: state.language === 'es' ? 'Seleccionar grupo' : 'Select group' },
                  ...assetGroups.map(group => ({ value: group.id, label: group.name }))
                ]}
                placeholder={state.language === 'es' ? 'Seleccionar grupo' : 'Select group'}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder={state.language === 'es' ? 'Razón de la inversión' : 'Investment reason'}
                  value={newAsset.reason}
                  onChange={(e) => setNewAsset({ ...newAsset, reason: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Panel de cálculos automáticos */}
            {(newAsset.currentPrice > 0 || newAsset.purchasePrice > 0 || newAsset.quantity > 0) && (
              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Calculator className="w-4 h-4 mr-2 text-blue-600" />
                  {state.language === 'es' ? 'Cálculos Automáticos' : 'Automatic Calculations'}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">{state.language === 'es' ? 'Valor de Compra' : 'Purchase Value'}</p>
                    <p className="font-bold text-gray-900">{formatCurrency(totalPurchaseValue)}</p>
                    <p className="text-xs text-gray-500">
                      ${newAsset.purchasePrice} × {newAsset.quantity}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">{state.language === 'es' ? 'Valor Actual' : 'Current Value'}</p>
                    <p className="font-bold text-gray-900">{formatCurrency(totalCurrentValue)}</p>
                    <p className="text-xs text-gray-500">
                      ${newAsset.currentPrice} × {newAsset.quantity}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">{state.language === 'es' ? 'Ganancia/Pérdida' : 'Gain/Loss'}</p>
                    <p className={`font-bold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">{state.language === 'es' ? 'Rendimiento' : 'Performance'}</p>
                    <p className={`font-bold ${gainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {gainLossPercentage >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button onClick={handleAddAsset}>
                {state.language === 'es' ? 'Agregar Activo' : 'Add Asset'}
              </Button>
              <Button
                onClick={() => setShowAddAsset(false)}
                variant="ghost"
              >
                {state.language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Vista de grupos */}
      <div className="space-y-6">
        {assetGroups.map((group) => {
          const groupAssets = getAssetsByGroup(group.id);
          const stats = getGroupStats(group.id);
          const isExpanded = expandedGroups.has(group.id);
          
          return (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                        {group.isSpecial && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            {state.language === 'es' ? 'ESPECIAL' : 'SPECIAL'}
                          </span>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-sm text-gray-600">{group.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      icon={BarChart3}
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewGroupDetails(group.id)}
                    >
                      {state.language === 'es' ? 'Ver Detalles' : 'View Details'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroupExpansion(group.id)}
                    >
                      {isExpanded ? 'Ocultar' : 'Mostrar'} Activos
                    </Button>
                    {!group.isSpecial && (
                      <button
                        onClick={() => setEditingGroup(group)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Estadísticas del grupo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">{state.language === 'es' ? 'Activos' : 'Assets'}</p>
                    <p className="text-lg font-semibold text-gray-900">{stats.assetCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">{state.language === 'es' ? 'Valor Total' : 'Total Value'}</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">{state.language === 'es' ? 'Ganancia/Pérdida' : 'Gain/Loss'}</p>
                    <p className={`text-lg font-semibold ${stats.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(stats.totalGainLoss)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">{state.language === 'es' ? 'Rendimiento' : 'Performance'}</p>
                    <p className={`text-lg font-semibold ${stats.percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.percentage >= 0 ? '+' : ''}{stats.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Activos del grupo - Solo cuando está expandido */}
                {isExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
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
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-gray-900">{asset.name}</h4>
                                  {asset.type === 'stocks' && (
                                    asset.isConnectedToApi ? (
                                      <Wifi className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <WifiOff className="w-4 h-4 text-orange-500" />
                                    )
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{typeLabel}</p>
                                {asset.symbol && (
                                  <p className="text-xs text-blue-600 font-mono">{asset.symbol}</p>
                                )}
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
                                >
                                  <Edit className="w-3 h-3 text-gray-500" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <p className="text-xl font-bold text-gray-900">{formatCurrency(calc.currentValue)}</p>
                              <div className="flex items-center justify-center space-x-2 mt-1">
                                {calc.gainLoss >= 0 ? (
                                  <TrendingUp className="w-4 h-4 text-green-500" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-500" />
                                )}
                                <div className="text-center">
                                  <span className={`font-semibold ${calc.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {calc.gainLoss >= 0 ? '+' : ''}{formatCurrency(calc.gainLoss)}
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
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Activos sin grupo - Con opción de asignar */}
      {unassignedAssets.length > 0 && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FolderOpen className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-orange-900">
                  {state.language === 'es' ? 'Activos Sin Asignar' : 'Unassigned Assets'}
                </h3>
              </div>
              <div className="text-sm text-orange-700 font-medium">
                {state.language === 'es' ? 'Asigna estos activos a un grupo' : 'Assign these assets to a group'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassignedAssets.map((asset) => {
                const calc = getAssetCalculations(asset);
                const typeLabel = assetTypes.find(t => t.value === asset.type)?.label || asset.type;
                const riskLabel = riskLevels.find(r => r.value === asset.riskLevel)?.label || asset.riskLevel;
                
                return (
                  <div key={asset.id} className="p-4 bg-white border border-orange-200 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{asset.name}</h4>
                            {asset.type === 'stocks' && (
                              asset.isConnectedToApi ? (
                                <Wifi className="w-4 h-4 text-green-500" />
                              ) : (
                                <WifiOff className="w-4 h-4 text-orange-500" />
                              )
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{typeLabel}</p>
                          {asset.symbol && (
                            <p className="text-xs text-blue-600 font-mono">{asset.symbol}</p>
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
                          >
                            <Edit className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(calc.currentValue)}</p>
                        <div className="flex items-center justify-center space-x-2 mt-1">
                          {calc.gainLoss >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-sm font-medium ${calc.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {calc.gainLoss >= 0 ? '+' : ''}{formatCurrency(calc.gainLoss)} ({calc.gainLoss >= 0 ? '+' : ''}{calc.gainLossPercentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>

                      {/* Selector de grupo */}
                      <div className="pt-2 border-t border-orange-200">
                        <label className="block text-xs font-medium text-orange-700 mb-1">
                          {state.language === 'es' ? 'Asignar a grupo:' : 'Assign to group:'}
                        </label>
                        <div className="flex space-x-2">
                          <AppleSelect
                            value={asset.groupId || ''}
                            onChange={val => {
                              if (val) handleAssignToGroup(asset.id, val);
                            }}
                            options={[
                              { value: '', label: state.language === 'es' ? 'Seleccionar...' : 'Select...' },
                              ...assetGroups.map(group => ({ value: group.id, label: group.name }))
                            ]}
                            placeholder={state.language === 'es' ? 'Seleccionar...' : 'Select...'}
                            className="flex-1 text-xs border border-orange-300 rounded px-2 py-1 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Modales de edición */}
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

      <EditModal
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        onSave={(data) => updateAssetGroup(editingGroup.id, data)}
        onDelete={editingGroup && editingGroup.isSpecial !== true ? handleGroupDelete : undefined}
        title={state.language === 'es' ? 'Editar Grupo' : 'Edit Group'}
        data={editingGroup || {}}
        fields={groupEditFields}
      />
    </div>
  );
}