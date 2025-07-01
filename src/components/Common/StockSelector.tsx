import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Wifi, WifiOff, DollarSign, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { stockApiService, StockData, StockSearchResult, DividendData } from '../../services/stockApi';

interface StockSelectorProps {
  onSelect: (stock: StockData) => void;
  selectedSymbol?: string;
  language: 'es' | 'en';
}

export function StockSelector({ onSelect, selectedSymbol, language }: StockSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [dividendData, setDividendData] = useState<DividendData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [showRecommended, setShowRecommended] = useState(true);

  const recommendedStocks = stockApiService.getRecommendedStocks();

  // Buscar acciones cuando cambia la consulta
  useEffect(() => {
    const searchStocks = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowRecommended(true);
        return;
      }

      setIsSearching(true);
      setShowRecommended(false);
      
      try {
        const results = await stockApiService.searchStocks(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching stocks:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchStocks, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Cargar datos del símbolo seleccionado
  useEffect(() => {
    if (selectedSymbol) {
      loadStockData(selectedSymbol);
    }
  }, [selectedSymbol]);

  const loadStockData = async (symbol: string) => {
    setIsLoadingPrice(true);
    try {
      const [stockData, dividends] = await Promise.all([
        stockApiService.getStockData(symbol),
        stockApiService.getDividendData(symbol)
      ]);
      
      if (stockData) {
        setSelectedStock(stockData);
        setDividendData(dividends);
        onSelect(stockData);
      }
    } catch (error) {
      console.error('Error loading stock data:', error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const handleStockSelect = (stock: StockSearchResult) => {
    setSearchQuery(stock.symbol);
    loadStockData(stock.symbol);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // Determinar el estado de conexión y el mensaje apropiado
  const getConnectionStatus = () => {
    if (!selectedStock) return null;
    
    const isKnownStock = stockApiService.isKnownStock(selectedStock.symbol);
    
    if (selectedStock.isConnected) {
      return {
        type: 'connected',
        icon: <Wifi className="w-4 h-4 text-green-500" />,
        text: language === 'es' ? 'Conectado - Actualizaciones automáticas' : 'Connected - Automatic updates',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else if (isKnownStock) {
      return {
        type: 'simulated',
        icon: <CheckCircle className="w-4 h-4 text-blue-500" />,
        text: language === 'es' ? 'Acción reconocida - Precios simulados realistas' : 'Recognized stock - Realistic simulated prices',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    } else {
      return {
        type: 'unknown',
        icon: <AlertCircle className="w-4 h-4 text-orange-500" />,
        text: language === 'es' ? 'Acción no reconocida - Sin actualizaciones automáticas' : 'Unknown stock - No automatic updates',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'es' ? 'Buscar acciones (ej: AAPL, Microsoft)' : 'Search stocks (e.g: AAPL, Microsoft)'}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Información del stock seleccionado */}
      {selectedStock && (
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{selectedStock.symbol}</h3>
              <span className="text-sm text-gray-600">{selectedStock.name}</span>
              {connectionStatus && (
                <div className="flex items-center space-x-1">
                  {connectionStatus.icon}
                  <span className={`text-xs ${connectionStatus.color}`}>
                    {connectionStatus.type === 'connected' && (language === 'es' ? 'En vivo' : 'Live')}
                    {connectionStatus.type === 'simulated' && (language === 'es' ? 'Simulado' : 'Simulated')}
                    {connectionStatus.type === 'unknown' && (language === 'es' ? 'Manual' : 'Manual')}
                  </span>
                </div>
              )}
            </div>
            {isLoadingPrice && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">{language === 'es' ? 'Precio Actual' : 'Current Price'}</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(selectedStock.price, selectedStock.currency)}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">{language === 'es' ? 'Cambio' : 'Change'}</p>
              <div className={`flex items-center justify-center space-x-1 ${
                selectedStock.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {selectedStock.change >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-semibold">
                  {formatCurrency(Math.abs(selectedStock.change), selectedStock.currency)}
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">{language === 'es' ? 'Cambio %' : 'Change %'}</p>
              <p className={`font-bold ${
                selectedStock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(selectedStock.changePercent)}
              </p>
            </div>

            {dividendData && dividendData.dividendYield > 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-600">{language === 'es' ? 'Dividendo' : 'Dividend'}</p>
                <div className="flex items-center justify-center space-x-1 text-purple-600">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-semibold">{dividendData.dividendYield.toFixed(2)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Información adicional de dividendos */}
          {dividendData && dividendData.dividendYield > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">{language === 'es' ? 'Próximo dividendo:' : 'Next dividend:'}</span>
                  <span className="ml-2 font-medium">{formatCurrency(dividendData.amount)}</span>
                </div>
                <div>
                  <span className="text-gray-600">{language === 'es' ? 'Fecha ex-dividendo:' : 'Ex-dividend date:'}</span>
                  <span className="ml-2 font-medium">
                    {dividendData.exDividendDate ? new Date(dividendData.exDividendDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 text-xs text-gray-500 text-center">
            {language === 'es' ? 'Última actualización:' : 'Last updated:'} {' '}
            {new Date(selectedStock.lastUpdated).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Resultados de búsqueda o recomendaciones */}
      <div className="max-h-64 overflow-y-auto">
        {showRecommended ? (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {language === 'es' ? 'Acciones Recomendadas' : 'Recommended Stocks'}
            </h4>
            <div className="space-y-2">
              {recommendedStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleStockSelect(stock)}
                  className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{stock.symbol}</span>
                        <CheckCircle className="w-4 h-4 text-green-500" title={language === 'es' ? 'Acción reconocida' : 'Recognized stock'} />
                      </div>
                      <div className="text-sm text-gray-600">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{stock.currency}</div>
                      <div className="text-xs text-gray-400">{stock.region}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {language === 'es' ? 'Resultados de Búsqueda' : 'Search Results'}
            </h4>
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((stock) => {
                  const isKnown = stockApiService.isKnownStock(stock.symbol);
                  return (
                    <button
                      key={stock.symbol}
                      onClick={() => handleStockSelect(stock)}
                      className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{stock.symbol}</span>
                            {isKnown ? (
                              <CheckCircle className="w-4 h-4 text-green-500" title={language === 'es' ? 'Acción reconocida' : 'Recognized stock'} />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-orange-500" title={language === 'es' ? 'Acción no reconocida' : 'Unknown stock'} />
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{stock.name}</div>
                          <div className="text-xs text-gray-500">{stock.type} • {stock.region}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">{stock.currency}</div>
                          <div className="text-xs text-gray-400">
                            {stock.marketOpen} - {stock.marketClose}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                {language === 'es' ? 'No se encontraron resultados' : 'No results found'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Estado de conexión mejorado */}
      {connectionStatus && (
        <div className={`${connectionStatus.bgColor} border ${connectionStatus.borderColor} rounded-lg p-3`}>
          <div className="flex items-center space-x-2">
            {connectionStatus.icon}
            <div className={`text-sm ${connectionStatus.color}`}>
              <p className="font-medium">
                {connectionStatus.type === 'connected' && (language === 'es' ? 'Conectado en tiempo real' : 'Connected in real-time')}
                {connectionStatus.type === 'simulated' && (language === 'es' ? 'Acción reconocida' : 'Recognized stock')}
                {connectionStatus.type === 'unknown' && (language === 'es' ? 'Acción no reconocida' : 'Unknown stock')}
              </p>
              <p className="text-xs mt-1">
                {connectionStatus.text}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}