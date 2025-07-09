import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Clock, TrendingUp, AlertCircle, Settings, ChevronDown, ChevronUp, Calendar, Timer } from 'lucide-react';
import { useRealTimeStocks } from '../../hooks/useRealTimeStocks';

interface RealTimeIndicatorProps {
  language: 'es' | 'en';
  updateInterval?: number;
  enabled?: boolean;
}

export function RealTimeIndicator({ 
  language, 
  updateInterval = 180000, // 3 minutos por defecto
  enabled = true 
}: RealTimeIndicatorProps) {
  const { 
    isUpdating, 
    lastUpdate, 
    updateCount, 
    errors,
    currentlyUpdatingStock,
    updateNow, 
    connectedStocksCount,
    totalStocksCount,
    nextUpdateInfo,
    schedule
  } = useRealTimeStocks({ updateInterval, enabled });

  const [isExpanded, setIsExpanded] = useState(false);

  if (totalStocksCount === 0) return null;

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return language === 'es' ? 'Nunca' : 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor((diffMs % 60000) / 1000);
    
    if (diffMinutes < 1) {
      return diffSeconds < 10 
        ? (language === 'es' ? 'Ahora mismo' : 'Just now')
        : `${diffSeconds}s`;
    } else if (diffMinutes < 60) {
      return language === 'es' 
        ? `Hace ${diffMinutes} min` 
        : `${diffMinutes} min ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  const formatTimeUntilNext = (seconds: number) => {
    if (seconds <= 0) return language === 'es' ? 'Ahora' : 'Now';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusColor = () => {
    if (isUpdating) return 'text-blue-500';
    if (errors.length > 0) return 'text-yellow-500';
    if (connectedStocksCount > 0) return 'text-green-500';
    return 'text-gray-500';
  };

  const getStatusIcon = () => {
    if (isUpdating) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (errors.length > 0) return <AlertCircle className="w-4 h-4" />;
    if (connectedStocksCount > 0) return <Wifi className="w-4 h-4" />;
    return <WifiOff className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isUpdating) {
      if (currentlyUpdatingStock) {
        return language === 'es' ? `Actualizando ${currentlyUpdatingStock}...` : `Updating ${currentlyUpdatingStock}...`;
      }
      return language === 'es' ? 'Actualizando...' : 'Updating...';
    }
    if (errors.length > 0) {
      return language === 'es' ? 'Actualizado con errores' : 'Updated with errors';
    }
    if (connectedStocksCount > 0) {
      return language === 'es' ? 'Sistema Escalonado Activo' : 'Staggered System Active';
    }
    return language === 'es' ? 'Desconectado' : 'Disconnected';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header principal */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`${getStatusColor()} transition-colors duration-300`}>
              {getStatusIcon()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-900">
                  {language === 'es' ? 'Actualizaciones Escalonadas' : 'Staggered Updates'}
                </p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isUpdating ? 'bg-blue-100 text-blue-700' :
                  errors.length > 0 ? 'bg-yellow-100 text-yellow-700' :
                  connectedStocksCount > 0 ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {getStatusText()}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {connectedStocksCount} / {totalStocksCount} {language === 'es' ? 'acciones conectadas' : 'stocks connected'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={updateNow}
              disabled={isUpdating}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{language === 'es' ? 'Actualizar Todo' : 'Update All'}</span>
            </button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Información de próxima actualización */}
        {enabled && connectedStocksCount > 0 && nextUpdateInfo && (
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  {language === 'es' ? 'Próxima actualización:' : 'Next update:'}
                </span>
                <span className="font-mono font-bold text-blue-700">{nextUpdateInfo.symbol}</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">
                  {formatTimeUntilNext(nextUpdateInfo.timeUntilNext)}
                </p>
                <p className="text-xs text-gray-500">
                  {nextUpdateInfo.totalScheduled} {language === 'es' ? 'programadas' : 'scheduled'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel expandido */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">{language === 'es' ? 'Actualizaciones' : 'Updates'}</p>
              <p className="text-lg font-bold text-gray-900">{updateCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">{language === 'es' ? 'Conectadas' : 'Connected'}</p>
              <p className="text-lg font-bold text-green-600">{connectedStocksCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">{language === 'es' ? 'Total' : 'Total'}</p>
              <p className="text-lg font-bold text-gray-600">{totalStocksCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">{language === 'es' ? 'Errores' : 'Errors'}</p>
              <p className={`text-lg font-bold ${errors.length > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {errors.length}
              </p>
            </div>
          </div>



          {/* Última actualización */}
          {lastUpdate && (
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>
                {language === 'es' ? 'Última actualización:' : 'Last update:'} {formatLastUpdate(lastUpdate)}
              </span>
            </div>
          )}

          {/* Errores */}
          {errors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800">
                  {language === 'es' ? 'Errores recientes:' : 'Recent errors:'}
                </p>
              </div>
              <div className="space-y-1">
                {errors.slice(-3).map((error, index) => (
                  <p key={index} className="text-xs text-yellow-700">• {error}</p>
                ))}
              </div>
            </div>
          )}

          {/* Información del sistema */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                {language === 'es' ? 'Sistema escalonado: 3+ min/acción' : 'Staggered system: 3+ min/stock'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-xs text-gray-500">
                {enabled 
                  ? (language === 'es' ? 'Activo' : 'Active')
                  : (language === 'es' ? 'Pausado' : 'Paused')
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}