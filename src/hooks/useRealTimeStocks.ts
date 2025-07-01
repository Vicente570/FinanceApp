import { useEffect, useRef, useState } from 'react';
import { stockApiService } from '../services/stockApi';
import { useApp } from '../context/AppContext';

interface UseRealTimeStocksOptions {
  updateInterval?: number; // en milisegundos
  enabled?: boolean;
}

interface StockUpdateSchedule {
  assetId: string;
  symbol: string;
  nextUpdateTime: number;
  updateInterval: number; // Intervalo específico para esta acción
}

export function useRealTimeStocks(options: UseRealTimeStocksOptions = {}) {
  const { updateInterval = 180000, enabled = true } = options; // Default: 3 minutos
  const { state, updateAsset } = useApp();
  const { assets } = state;
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [currentlyUpdatingStock, setCurrentlyUpdatingStock] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scheduleRef = useRef<StockUpdateSchedule[]>([]);
  const lastScheduleUpdateRef = useRef<number>(0);

  // Crear horario de actualizaciones escalonadas
  const createUpdateSchedule = (connectedStocks: any[]): StockUpdateSchedule[] => {
    if (connectedStocks.length === 0) return [];

    const now = Date.now();
    const baseInterval = 180000; // 3 minutos base
    
    console.log(`📅 Creando horario escalonado para ${connectedStocks.length} acciones`);
    
    return connectedStocks.map((asset, index) => {
      // Distribuir las actualizaciones a lo largo de 3 minutos
      // Si tenemos N acciones, cada una se actualiza cada N*3 minutos, pero empezando en momentos diferentes
      const staggerDelay = (index * (baseInterval / Math.max(connectedStocks.length, 1))) % baseInterval;
      const individualInterval = Math.max(baseInterval, connectedStocks.length * 30000); // Mínimo 30s entre acciones
      
      const schedule: StockUpdateSchedule = {
        assetId: asset.id,
        symbol: asset.symbol!,
        nextUpdateTime: now + staggerDelay + 5000, // Empezar después de 5 segundos + delay
        updateInterval: individualInterval
      };
      
      console.log(`📊 ${asset.symbol}: Primera actualización en ${Math.round(staggerDelay/1000)}s, luego cada ${Math.round(individualInterval/60000)} min`);
      
      return schedule;
    });
  };

  // Actualizar una sola acción
  const updateSingleStock = async (schedule: StockUpdateSchedule) => {
    const asset = assets.find(a => a.id === schedule.assetId);
    if (!asset || !asset.symbol) return false;

    setCurrentlyUpdatingStock(asset.symbol);
    
    try {
      console.log(`🔄 Actualizando ${asset.symbol}...`);
      
      const stockData = await stockApiService.getStockData(asset.symbol);
      if (stockData) {
        const newValue = stockData.price * asset.quantity;
        updateAsset(asset.id, {
          value: newValue,
          currentPricePerUnit: stockData.price,
          isConnectedToApi: stockData.isConnected
        });
        
        console.log(`✅ ${asset.symbol}: $${stockData.price.toFixed(2)} (${stockData.isConnected ? 'API' : 'Simulado'})`);
        
        // Mostrar notificación individual
        showStockUpdateNotification(asset.symbol, stockData.price, stockData.change, stockData.isConnected);
        
        return true;
      } else {
        console.warn(`⚠️ No se pudieron obtener datos para ${asset.symbol}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error actualizando ${asset.symbol}:`, error);
      setErrors(prev => [...prev.slice(-4), `Error al actualizar ${asset.symbol}`]); // Mantener solo los últimos 5 errores
      return false;
    } finally {
      setCurrentlyUpdatingStock(null);
    }
  };

  // Procesar actualizaciones programadas
  const processScheduledUpdates = async () => {
    if (!enabled || scheduleRef.current.length === 0) return;

    const now = Date.now();
    const stocksToUpdate = scheduleRef.current.filter(schedule => now >= schedule.nextUpdateTime);
    
    if (stocksToUpdate.length === 0) return;

    setIsUpdating(true);
    
    try {
      // Actualizar solo una acción por vez para respetar los límites de API
      const schedule = stocksToUpdate[0];
      const success = await updateSingleStock(schedule);
      
      if (success) {
        setUpdateCount(prev => prev + 1);
        setLastUpdate(new Date());
      }
      
      // Programar la siguiente actualización para esta acción
      const scheduleIndex = scheduleRef.current.findIndex(s => s.assetId === schedule.assetId);
      if (scheduleIndex !== -1) {
        scheduleRef.current[scheduleIndex].nextUpdateTime = now + schedule.updateInterval;
        console.log(`⏰ Próxima actualización de ${schedule.symbol} en ${Math.round(schedule.updateInterval/60000)} min`);
      }
      
    } catch (error) {
      console.error('❌ Error en actualización programada:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Mostrar notificación de actualización individual
  const showStockUpdateNotification = (symbol: string, price: number, change: number, isConnected: boolean) => {
    const notification = document.createElement('div');
    const changeColor = change >= 0 ? 'bg-green-500' : 'bg-red-500';
    const changeIcon = change >= 0 ? '📈' : '📉';
    const connectionIcon = isConnected ? '🔗' : '🎲';
    
    notification.className = `fixed top-4 right-4 ${changeColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-0 text-sm`;
    
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span>${connectionIcon}</span>
        <span class="font-mono font-bold">${symbol}</span>
        <span>$${price.toFixed(2)}</span>
        <span>${changeIcon} ${change >= 0 ? '+' : ''}${change.toFixed(2)}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  // Actualización manual de todas las acciones (respetando límites)
  const updateAllConnectedStocks = async () => {
    const connectedStocks = assets.filter(
      asset => asset.type === 'stocks' && asset.symbol && asset.isConnectedToApi
    );

    if (connectedStocks.length === 0) {
      console.log('📊 No hay acciones conectadas para actualizar');
      return;
    }

    setIsUpdating(true);
    setErrors([]);
    
    try {
      console.log(`🔄 Actualización manual iniciada para ${connectedStocks.length} acciones...`);
      
      // Actualizar una por una con delay para respetar límites de API
      let successCount = 0;
      const newErrors: string[] = [];
      
      for (let i = 0; i < connectedStocks.length; i++) {
        const asset = connectedStocks[i];
        
        try {
          setCurrentlyUpdatingStock(asset.symbol!);
          
          const stockData = await stockApiService.getStockData(asset.symbol!);
          if (stockData) {
            const newValue = stockData.price * asset.quantity;
            updateAsset(asset.id, {
              value: newValue,
              currentPricePerUnit: stockData.price,
              isConnectedToApi: stockData.isConnected
            });
            successCount++;
            console.log(`✅ ${asset.symbol}: $${stockData.price.toFixed(2)}`);
          } else {
            newErrors.push(`Error al actualizar ${asset.symbol}`);
          }
        } catch (error) {
          console.error(`❌ Error updating ${asset.symbol}:`, error);
          newErrors.push(`Error al actualizar ${asset.symbol}`);
        }
        
        // Delay entre actualizaciones para respetar límites de API (1 segundo)
        if (i < connectedStocks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setLastUpdate(new Date());
      setUpdateCount(prev => prev + successCount);
      setErrors(newErrors);
      
      // Mostrar notificación de resumen
      showBatchUpdateNotification(successCount, newErrors.length);
      
      console.log(`✅ Actualización manual completada: ${successCount}/${connectedStocks.length} acciones actualizadas`);
      
    } catch (error) {
      console.error('❌ Error en actualización manual:', error);
      setErrors(['Error general en la actualización manual']);
    } finally {
      setIsUpdating(false);
      setCurrentlyUpdatingStock(null);
    }
  };

  // Mostrar notificación de actualización por lotes
  const showBatchUpdateNotification = (successCount: number, errorCount: number) => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${
      errorCount > 0 ? 'bg-yellow-500' : 'bg-blue-500'
    } text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-0`;
    
    const icon = errorCount > 0 ? '⚠️' : '🔄';
    const message = errorCount > 0 
      ? `${successCount} ${state.language === 'es' ? 'actualizadas' : 'updated'}, ${errorCount} ${state.language === 'es' ? 'errores' : 'errors'}`
      : `${successCount} ${state.language === 'es' ? 'acciones actualizadas manualmente' : 'stocks updated manually'}`;
    
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span>${icon}</span>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 4000);
  };

  // Configurar sistema de actualizaciones escalonadas
  useEffect(() => {
    if (!enabled) {
      console.log('🔕 Actualizaciones automáticas deshabilitadas');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const connectedStocks = assets.filter(
      asset => asset.type === 'stocks' && asset.symbol && asset.isConnectedToApi
    );

    if (connectedStocks.length === 0) {
      console.log('📊 No hay acciones conectadas para actualizar');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Recrear horario solo si cambió la lista de acciones
    const currentStockIds = connectedStocks.map(s => s.id).sort().join(',');
    const lastStockIds = scheduleRef.current.map(s => s.assetId).sort().join(',');
    
    if (currentStockIds !== lastStockIds || Date.now() - lastScheduleUpdateRef.current > 300000) { // Recrear cada 5 min
      console.log('🔄 Recreando horario de actualizaciones...');
      scheduleRef.current = createUpdateSchedule(connectedStocks);
      lastScheduleUpdateRef.current = Date.now();
    }

    // Configurar verificación cada 10 segundos
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(processScheduledUpdates, 10000);
    
    console.log(`🚀 Sistema de actualizaciones escalonadas iniciado para ${connectedStocks.length} acciones`);
    console.log(`⏰ Verificación cada 10 segundos, actualizaciones individuales cada 3+ minutos`);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [assets, enabled]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Obtener próxima actualización
  const getNextUpdateInfo = () => {
    if (scheduleRef.current.length === 0) return null;
    
    const now = Date.now();
    const nextUpdate = scheduleRef.current.reduce((earliest, schedule) => {
      return schedule.nextUpdateTime < earliest.nextUpdateTime ? schedule : earliest;
    });
    
    const timeUntilNext = Math.max(0, nextUpdate.nextUpdateTime - now);
    
    return {
      symbol: nextUpdate.symbol,
      timeUntilNext: Math.ceil(timeUntilNext / 1000), // en segundos
      totalScheduled: scheduleRef.current.length
    };
  };

  return {
    isUpdating,
    lastUpdate,
    updateCount,
    errors,
    currentlyUpdatingStock,
    updateNow: updateAllConnectedStocks,
    connectedStocksCount: assets.filter(
      asset => asset.type === 'stocks' && asset.symbol && asset.isConnectedToApi
    ).length,
    totalStocksCount: assets.filter(asset => asset.type === 'stocks').length,
    nextUpdateInfo: getNextUpdateInfo(),
    schedule: scheduleRef.current
  };
}