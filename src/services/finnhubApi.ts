// Servicio para obtener datos de acciones en tiempo real usando Finnhub API
// Finnhub ofrece 60 llamadas/minuto gratis

interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

interface FinnhubSymbolSearch {
  count: number;
  result: Array<{
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  lastUpdated: string;
  isConnected: boolean;
  high: number;
  low: number;
  open: number;
  previousClose: number;
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

class FinnhubApiService {
  private readonly API_KEY = 'd1g52fpr01qk4ao15em0d1g52fpr01qk4ao15emg'; // Tu API key real de Finnhub
  private readonly BASE_URL = 'https://finnhub.io/api/v1';
  
  private cache = new Map<string, { data: StockData; timestamp: number }>();
  private readonly CACHE_DURATION = 60000; // 1 minuto
  private requestCount = 0;
  private readonly MAX_REQUESTS_PER_MINUTE = 60;
  private requestResetTime = Date.now() + 60000;
  private apiKeyValid = true; // Track API key validity

  // Lista de acciones conocidas con sus nombres
  private readonly STOCK_NAMES: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc. Class A',
    'GOOG': 'Alphabet Inc. Class C',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'NVDA': 'NVIDIA Corporation',
    'META': 'Meta Platforms Inc.',
    'NFLX': 'Netflix Inc.',
    'BRK.B': 'Berkshire Hathaway Inc. Class B',
    'UNH': 'UnitedHealth Group Inc.',
    'JNJ': 'Johnson & Johnson',
    'V': 'Visa Inc.',
    'PG': 'Procter & Gamble Co.',
    'JPM': 'JPMorgan Chase & Co.',
    'MA': 'Mastercard Inc.',
    'HD': 'Home Depot Inc.',
    'CVX': 'Chevron Corporation',
    'LLY': 'Eli Lilly and Company',
    'ABBV': 'AbbVie Inc.',
    'PFE': 'Pfizer Inc.',
    'KO': 'Coca-Cola Company',
    'AVGO': 'Broadcom Inc.',
    'PEP': 'PepsiCo Inc.',
    'TMO': 'Thermo Fisher Scientific Inc.',
    'COST': 'Costco Wholesale Corporation',
    'WMT': 'Walmart Inc.',
    'MRK': 'Merck & Co. Inc.',
    'BAC': 'Bank of America Corporation',
    'XOM': 'Exxon Mobil Corporation',
    'DIS': 'Walt Disney Company',
    'ABT': 'Abbott Laboratories',
    'CRM': 'Salesforce Inc.',
    'VZ': 'Verizon Communications Inc.',
    'ADBE': 'Adobe Inc.',
    'CMCSA': 'Comcast Corporation',
    'ACN': 'Accenture plc',
    'NKE': 'Nike Inc.',
    'DHR': 'Danaher Corporation',
    'TXN': 'Texas Instruments Inc.',
    'NEE': 'NextEra Energy Inc.',
    'RTX': 'Raytheon Technologies Corporation',
    'QCOM': 'QUALCOMM Inc.',
    'PM': 'Philip Morris International Inc.',
    'SPGI': 'S&P Global Inc.',
    'HON': 'Honeywell International Inc.',
    'UNP': 'Union Pacific Corporation',
    'T': 'AT&T Inc.',
    'LOW': 'Lowe\'s Companies Inc.',
    'IBM': 'International Business Machines Corporation',
    'AMGN': 'Amgen Inc.',
    'SBUX': 'Starbucks Corporation',
    'CAT': 'Caterpillar Inc.',
    'GS': 'Goldman Sachs Group Inc.',
    'AXP': 'American Express Company',
    'BLK': 'BlackRock Inc.',
    'DE': 'Deere & Company',
    'AMD': 'Advanced Micro Devices Inc.'
  };

  // Función auxiliar para redondear a 2 decimales
  private roundTo2Decimals(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  // Verificar límites de API
  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Resetear contador cada minuto
    if (now > this.requestResetTime) {
      this.requestCount = 0;
      this.requestResetTime = now + 60000;
    }
    
    return this.requestCount < this.MAX_REQUESTS_PER_MINUTE;
  }

  // Verificar si estamos usando la clave demo
  private isDemoKey(): boolean {
    return this.API_KEY === 'demo';
  }

  // Obtener cotización en tiempo real de Finnhub
  async getQuote(symbol: string): Promise<StockData | null> {
    // Si la API key no es válida, usar datos de respaldo directamente
    if (!this.apiKeyValid) {
      console.warn('⚠️ API key invalid, using fallback data');
      return this.getFallbackData(symbol);
    }

    if (!this.checkRateLimit()) {
      console.warn('Finnhub API rate limit reached, using cached data');
      const cached = this.cache.get(symbol.toUpperCase());
      return cached ? cached.data : null;
    }

    try {
      this.requestCount++;
      
      console.log(`🔄 Fetching real-time data for ${symbol} from Finnhub API...`);
      
      const response = await fetch(
        `${this.BASE_URL}/quote?symbol=${symbol.toUpperCase()}&token=${this.API_KEY}`
      );
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error('❌ Finnhub API authentication failed. API key is invalid or expired.');
          this.apiKeyValid = false; // Mark API key as invalid
          console.log('🔄 Switching to simulated data mode');
          return this.getFallbackData(symbol);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: FinnhubQuote = await response.json();
      
      // Verificar si los datos son válidos
      if (data.c === 0 || data.c === null || data.c === undefined) {
        console.warn(`⚠️ No valid data for symbol: ${symbol}, using fallback`);
        return this.getFallbackData(symbol);
      }
      
      const stockData: StockData = {
        symbol: symbol.toUpperCase(),
        name: this.getStockName(symbol.toUpperCase()),
        price: this.roundTo2Decimals(data.c),
        change: this.roundTo2Decimals(data.d),
        changePercent: this.roundTo2Decimals(data.dp),
        currency: 'USD',
        lastUpdated: new Date().toISOString(),
        isConnected: true, // Datos reales de la API
        high: this.roundTo2Decimals(data.h),
        low: this.roundTo2Decimals(data.l),
        open: this.roundTo2Decimals(data.o),
        previousClose: this.roundTo2Decimals(data.pc)
      };
      
      // Guardar en cache
      this.cache.set(symbol.toUpperCase(), { 
        data: stockData, 
        timestamp: Date.now() 
      });
      
      console.log(`✅ Real-time data fetched for ${symbol}: $${data.c.toFixed(2)} (${data.dp >= 0 ? '+' : ''}${data.dp.toFixed(2)}%)`);
      
      return stockData;
      
    } catch (error) {
      console.error(`❌ Error fetching quote for ${symbol}:`, error);
      
      // Si es un error de autenticación, marcar la API key como inválida
      if (error instanceof Error && error.message.includes('403')) {
        this.apiKeyValid = false;
        console.log('🔄 API key marked as invalid, switching to simulated data');
      }
      
      return this.getFallbackData(symbol);
    }
  }

  // Buscar símbolos de acciones
  async searchSymbols(query: string): Promise<StockSearchResult[]> {
    // Si la API key no es válida, usar búsqueda local
    if (!this.apiKeyValid) {
      console.warn('⚠️ API key invalid, using local search');
      return this.searchLocalSymbols(query);
    }

    if (!this.checkRateLimit()) {
      console.warn('Finnhub API rate limit reached for search');
      return this.searchLocalSymbols(query);
    }

    try {
      this.requestCount++;
      
      console.log(`🔍 Searching symbols for: "${query}"`);
      
      const response = await fetch(
        `${this.BASE_URL}/search?q=${encodeURIComponent(query)}&token=${this.API_KEY}`
      );
      
      if (!response.ok) {
        // Si hay error de autenticación, usar búsqueda local
        if (response.status === 401 || response.status === 403) {
          console.warn('⚠️ API authentication failed for search, using local search');
          this.apiKeyValid = false;
          return this.searchLocalSymbols(query);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: FinnhubSymbolSearch = await response.json();
      
      console.log(`✅ Found ${data.result.length} symbols from API`);
      
      return data.result.slice(0, 10).map(item => ({
        symbol: item.symbol,
        name: item.description,
        type: item.type,
        region: 'United States',
        marketOpen: '09:30',
        marketClose: '16:00',
        timezone: 'UTC-05',
        currency: 'USD'
      }));
      
    } catch (error) {
      console.error('❌ Error searching symbols:', error);
      
      // Si es un error de autenticación, marcar la API key como inválida
      if (error instanceof Error && error.message.includes('403')) {
        this.apiKeyValid = false;
      }
      
      return this.searchLocalSymbols(query);
    }
  }

  // Búsqueda local en la lista de acciones conocidas
  private searchLocalSymbols(query: string): StockSearchResult[] {
    const searchTerm = query.toLowerCase();
    const results: StockSearchResult[] = [];
    
    console.log(`🔍 Performing local search for: "${query}"`);
    
    // Buscar por símbolo o nombre
    for (const [symbol, name] of Object.entries(this.STOCK_NAMES)) {
      if (
        symbol.toLowerCase().includes(searchTerm) ||
        name.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          symbol,
          name,
          type: 'Common Stock',
          region: 'United States',
          marketOpen: '09:30',
          marketClose: '16:00',
          timezone: 'UTC-05',
          currency: 'USD'
        });
      }
    }
    
    // Si no hay resultados específicos, devolver acciones recomendadas
    if (results.length === 0) {
      console.log('📋 No local matches found, returning recommended stocks');
      return this.getRecommendedStocks().slice(0, 5);
    }
    
    console.log(`✅ Found ${results.length} local matches`);
    return results.slice(0, 10);
  }

  // Obtener datos de respaldo cuando la API falla
  private getFallbackData(symbol: string): StockData {
    const upperSymbol = symbol.toUpperCase();
    
    // Verificar cache primero
    const cached = this.cache.get(upperSymbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION * 5) { // Cache extendido para fallback
      console.log(`📦 Using extended cache for ${symbol}`);
      return { ...cached.data, isConnected: false };
    }
    
    console.log(`🎲 Generating simulated data for ${symbol}`);
    
    // Generar datos simulados realistas
    const mockPrices: Record<string, number> = {
      'AAPL': 185.50, 'MSFT': 420.30, 'GOOGL': 140.75, 'GOOG': 138.25,
      'AMZN': 155.20, 'TSLA': 248.90, 'NVDA': 875.40, 'META': 485.60,
      'NFLX': 485.30, 'BRK.B': 425.80, 'UNH': 520.15, 'JNJ': 158.75,
      'V': 265.40, 'PG': 155.20, 'JPM': 168.90, 'MA': 425.60,
      'HD': 385.25, 'CVX': 158.40, 'LLY': 785.30, 'ABBV': 165.80
    };
    
    const basePrice = mockPrices[upperSymbol] || 100;
    const seed = upperSymbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomFactor = (Math.sin(seed + Date.now() / 86400000) * 0.03); // Variación del 3%
    const currentPrice = this.roundTo2Decimals(basePrice * (1 + randomFactor));
    const change = this.roundTo2Decimals(currentPrice - basePrice);
    
    const stockData: StockData = {
      symbol: upperSymbol,
      name: this.getStockName(upperSymbol),
      price: currentPrice,
      change: change,
      changePercent: this.roundTo2Decimals((change / basePrice) * 100),
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
      isConnected: false, // Datos simulados
      high: this.roundTo2Decimals(currentPrice * 1.02),
      low: this.roundTo2Decimals(currentPrice * 0.98),
      open: this.roundTo2Decimals(basePrice),
      previousClose: this.roundTo2Decimals(basePrice)
    };

    // Guardar en cache los datos simulados
    this.cache.set(upperSymbol, { 
      data: stockData, 
      timestamp: Date.now() 
    });

    return stockData;
  }

  // Obtener nombre de la acción
  private getStockName(symbol: string): string {
    return this.STOCK_NAMES[symbol] || symbol;
  }

  // Obtener acciones recomendadas
  getRecommendedStocks(): StockSearchResult[] {
    return [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: 'Common Stock',
        region: 'United States',
        marketOpen: '09:30',
        marketClose: '16:00',
        timezone: 'UTC-05',
        currency: 'USD'
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        type: 'Common Stock',
        region: 'United States',
        marketOpen: '09:30',
        marketClose: '16:00',
        timezone: 'UTC-05',
        currency: 'USD'
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        type: 'Common Stock',
        region: 'United States',
        marketOpen: '09:30',
        marketClose: '16:00',
        timezone: 'UTC-05',
        currency: 'USD'
      },
      {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        type: 'Common Stock',
        region: 'United States',
        marketOpen: '09:30',
        marketClose: '16:00',
        timezone: 'UTC-05',
        currency: 'USD'
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        type: 'Common Stock',
        region: 'United States',
        marketOpen: '09:30',
        marketClose: '16:00',
        timezone: 'UTC-05',
        currency: 'USD'
      },
      {
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        type: 'Common Stock',
        region: 'United States',
        marketOpen: '09:30',
        marketClose: '16:00',
        timezone: 'UTC-05',
        currency: 'USD'
      },
      {
        symbol: 'META',
        name: 'Meta Platforms Inc.',
        type: 'Common Stock',
        region: 'United States',
        marketOpen: '09:30',
        marketClose: '16:00',
        timezone: 'UTC-05',
        currency: 'USD'
      },
      {
        symbol: 'NFLX',
        name: 'Netflix Inc.',
        type: 'Common Stock',
        region: 'United States',
        marketOpen: '09:30',
        marketClose: '16:00',
        timezone: 'UTC-05',
        currency: 'USD'
      }
    ];
  }

  // Verificar si una acción es conocida
  isKnownStock(symbol: string): boolean {
    return symbol.toUpperCase() in this.STOCK_NAMES;
  }

  // Limpiar cache
  clearCache(): void {
    this.cache.clear();
  }

  // Obtener estadísticas de uso de API
  getApiStats() {
    return {
      requestCount: this.requestCount,
      maxRequests: this.MAX_REQUESTS_PER_MINUTE,
      resetTime: this.requestResetTime,
      cacheSize: this.cache.size,
      usingDemoKey: this.isDemoKey(),
      apiKeyValid: this.apiKeyValid,
      apiKey: this.API_KEY.substring(0, 8) + '...' // Mostrar solo los primeros caracteres por seguridad
    };
  }
}

export const finnhubApiService = new FinnhubApiService();
export type { StockData, StockSearchResult };