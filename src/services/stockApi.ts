// Servicio principal que integra Finnhub y otros proveedores
import { finnhubApiService, StockData as FinnhubStockData, StockSearchResult as FinnhubStockSearchResult } from './finnhubApi';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  lastUpdated: string;
  isConnected: boolean;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
}

interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  marketOpen: string;
  marketClose: string;
  timezone: string;
  currency: string;
}

interface DividendData {
  symbol: string;
  dividendYield: number;
  exDividendDate: string;
  paymentDate: string;
  amount: number;
}

class StockApiService {
  private cache = new Map<string, { data: StockData; timestamp: number }>();
  private readonly CACHE_DURATION = 60000; // 1 minuto

  // Método principal para obtener datos de acciones
  async getStockData(symbol: string): Promise<StockData | null> {
    const upperSymbol = symbol.toUpperCase();
    
    // Verificar cache primero
    const cached = this.cache.get(upperSymbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Intentar obtener datos de Finnhub
      const stockData = await finnhubApiService.getQuote(upperSymbol);
      
      if (stockData) {
        // Convertir formato de Finnhub al formato interno
        const convertedData: StockData = {
          symbol: stockData.symbol,
          name: stockData.name,
          price: stockData.price,
          change: stockData.change,
          changePercent: stockData.changePercent,
          currency: stockData.currency,
          lastUpdated: stockData.lastUpdated,
          isConnected: stockData.isConnected,
          high: stockData.high,
          low: stockData.low,
          open: stockData.open,
          previousClose: stockData.previousClose
        };
        
        // Guardar en cache
        this.cache.set(upperSymbol, { 
          data: convertedData, 
          timestamp: Date.now() 
        });
        
        return convertedData;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      return null;
    }
  }

  // Buscar acciones
  async searchStocks(query: string): Promise<StockSearchResult[]> {
    try {
      const results = await finnhubApiService.searchSymbols(query);
      return results.map(result => ({
        symbol: result.symbol,
        name: result.name,
        type: result.type,
        region: result.region,
        marketOpen: result.marketOpen,
        marketClose: result.marketClose,
        timezone: result.timezone,
        currency: result.currency
      }));
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }

  // Obtener datos de dividendos (simulados por ahora)
  async getDividendData(symbol: string): Promise<DividendData | null> {
    try {
      // Datos simulados de dividendos para acciones conocidas
      const mockDividends: Record<string, DividendData> = {
        'AAPL': {
          symbol: 'AAPL',
          dividendYield: 0.52,
          exDividendDate: '2024-02-09',
          paymentDate: '2024-02-16',
          amount: 0.24
        },
        'MSFT': {
          symbol: 'MSFT',
          dividendYield: 0.72,
          exDividendDate: '2024-02-14',
          paymentDate: '2024-03-14',
          amount: 0.75
        },
        'GOOGL': {
          symbol: 'GOOGL',
          dividendYield: 0.0,
          exDividendDate: '',
          paymentDate: '',
          amount: 0
        },
        'AMZN': {
          symbol: 'AMZN',
          dividendYield: 0.0,
          exDividendDate: '',
          paymentDate: '',
          amount: 0
        },
        'TSLA': {
          symbol: 'TSLA',
          dividendYield: 0.0,
          exDividendDate: '',
          paymentDate: '',
          amount: 0
        },
        'NVDA': {
          symbol: 'NVDA',
          dividendYield: 0.03,
          exDividendDate: '2024-02-21',
          paymentDate: '2024-03-21',
          amount: 0.04
        },
        'V': {
          symbol: 'V',
          dividendYield: 0.74,
          exDividendDate: '2024-02-07',
          paymentDate: '2024-03-05',
          amount: 0.52
        },
        'JNJ': {
          symbol: 'JNJ',
          dividendYield: 3.15,
          exDividendDate: '2024-02-26',
          paymentDate: '2024-03-12',
          amount: 1.19
        },
        'PG': {
          symbol: 'PG',
          dividendYield: 2.41,
          exDividendDate: '2024-01-19',
          paymentDate: '2024-02-15',
          amount: 0.9133
        },
        'KO': {
          symbol: 'KO',
          dividendYield: 3.07,
          exDividendDate: '2024-03-14',
          paymentDate: '2024-04-01',
          amount: 0.485
        }
      };
      
      return mockDividends[symbol.toUpperCase()] || null;
    } catch (error) {
      console.error('Error fetching dividend data:', error);
      return null;
    }
  }

  // Obtener acciones recomendadas
  getRecommendedStocks(): StockSearchResult[] {
    return finnhubApiService.getRecommendedStocks();
  }

  // Verificar si una acción es conocida
  isKnownStock(symbol: string): boolean {
    return finnhubApiService.isKnownStock(symbol);
  }

  // Limpiar cache
  clearCache(): void {
    this.cache.clear();
    finnhubApiService.clearCache();
  }

  // Obtener estadísticas de uso
  getApiStats() {
    return {
      ...finnhubApiService.getApiStats(),
      localCacheSize: this.cache.size
    };
  }
}

export const stockApiService = new StockApiService();
export type { StockData, StockSearchResult, DividendData };