// Servicio para obtener tipos de cambio en tiempo real
interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export interface ExchangeRate {
  currency: string;
  name: string;
  symbol: string;
  flag: string;
  rate: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

class ExchangeRateApiService {
  private readonly BASE_URL = 'https://api.exchangerate-api.com/v4/latest';
  private cache = new Map<string, { data: ExchangeRate[]; timestamp: number }>();
  private readonly CACHE_DURATION = 300000; // 5 minutos

  // Información de monedas más utilizadas + Chile
  private readonly CURRENCY_INFO: Record<string, CurrencyInfo> = {
    'USD': { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    'EUR': { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    'GBP': { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    'JPY': { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    'CAD': { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
    'AUD': { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
    'CHF': { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
    'CNY': { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
    'MXN': { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
    'CLP': { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱' },
    'COP': { code: 'COP', name: 'Colombian Peso', symbol: '$', flag: '🇨🇴' }
  };

  // Obtener tipos de cambio desde una moneda base
  async getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRate[]> {
    const cacheKey = baseCurrency;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      console.log(`🔄 Fetching exchange rates for base currency: ${baseCurrency}`);
      
      const response = await fetch(`${this.BASE_URL}/${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ExchangeRateResponse = await response.json();
      
      // Convertir a nuestro formato y filtrar solo las monedas que nos interesan
      const exchangeRates: ExchangeRate[] = Object.entries(this.CURRENCY_INFO)
        .filter(([code]) => code !== baseCurrency) // Excluir la moneda base
        .map(([code, info]) => {
          const rate = data.rates[code] || 1;
          
          // Simular cambio (en una implementación real, esto vendría de datos históricos)
          const mockChange = (Math.sin(Date.now() / 86400000 + code.charCodeAt(0)) * 0.02) * rate;
          const changePercent = (mockChange / rate) * 100;
          
          return {
            currency: code,
            name: info.name,
            symbol: info.symbol,
            flag: info.flag,
            rate: this.roundTo4Decimals(rate),
            change: this.roundTo4Decimals(mockChange),
            changePercent: this.roundTo2Decimals(changePercent),
            lastUpdated: new Date().toISOString()
          };
        })
        .sort((a, b) => a.currency.localeCompare(b.currency));

      // Guardar en cache
      this.cache.set(cacheKey, {
        data: exchangeRates,
        timestamp: Date.now()
      });

      console.log(`✅ Exchange rates fetched successfully for ${baseCurrency}`);
      return exchangeRates;
      
    } catch (error) {
      console.error('❌ Error fetching exchange rates:', error);
      
      // Devolver datos simulados en caso de error
      return this.getFallbackExchangeRates(baseCurrency);
    }
  }

  // Obtener datos de respaldo cuando la API falla
  private getFallbackExchangeRates(baseCurrency: string): ExchangeRate[] {
    console.log(`🎲 Generating fallback exchange rates for ${baseCurrency}`);
    
    // Tasas de cambio aproximadas (estas deberían actualizarse periódicamente)
    const mockRates: Record<string, Record<string, number>> = {
      'USD': {
        'EUR': 0.85, 'GBP': 0.73, 'JPY': 110.0, 'CAD': 1.25, 'AUD': 1.35,
        'CHF': 0.92, 'CNY': 6.45, 'MXN': 20.5, 'CLP': 800.0, 'COP': 4000.0
      },
      'EUR': {
        'USD': 1.18, 'GBP': 0.86, 'JPY': 129.0, 'CAD': 1.47, 'AUD': 1.59,
        'CHF': 1.08, 'CNY': 7.60, 'MXN': 24.2, 'CLP': 942.0, 'COP': 4720.0
      },
      'MXN': {
        'USD': 0.049, 'EUR': 0.041, 'GBP': 0.036, 'JPY': 5.37, 'CAD': 0.061,
        'AUD': 0.066, 'CHF': 0.045, 'CNY': 0.31, 'CLP': 39.0, 'COP': 195.0
      },
      'CLP': {
        'USD': 0.00125, 'EUR': 0.00106, 'GBP': 0.00091, 'JPY': 0.138, 'CAD': 0.00156,
        'AUD': 0.00169, 'CHF': 0.00115, 'CNY': 0.008, 'MXN': 0.026, 'COP': 5.0
      }
    };

    const baseRates = mockRates[baseCurrency] || mockRates['USD'];
    
    return Object.entries(this.CURRENCY_INFO)
      .filter(([code]) => code !== baseCurrency)
      .map(([code, info]) => {
        const rate = baseRates[code] || 1;
        const mockChange = (Math.sin(Date.now() / 86400000 + code.charCodeAt(0)) * 0.02) * rate;
        const changePercent = (mockChange / rate) * 100;
        
        return {
          currency: code,
          name: info.name,
          symbol: info.symbol,
          flag: info.flag,
          rate: this.roundTo4Decimals(rate),
          change: this.roundTo4Decimals(mockChange),
          changePercent: this.roundTo2Decimals(changePercent),
          lastUpdated: new Date().toISOString()
        };
      })
      .sort((a, b) => a.currency.localeCompare(b.currency));
  }

  // Convertir monto entre monedas
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return amount;
    
    try {
      const rates = await this.getExchangeRates(fromCurrency);
      const targetRate = rates.find(rate => rate.currency === toCurrency);
      
      if (targetRate) {
        return this.roundTo2Decimals(amount * targetRate.rate);
      }
      
      // Si no encontramos la tasa directa, intentar conversión inversa
      const inverseRates = await this.getExchangeRates(toCurrency);
      const inverseRate = inverseRates.find(rate => rate.currency === fromCurrency);
      
      if (inverseRate) {
        return this.roundTo2Decimals(amount / inverseRate.rate);
      }
      
      return amount; // Si no podemos convertir, devolver el monto original
      
    } catch (error) {
      console.error('Error converting currency:', error);
      return amount;
    }
  }

  // Obtener información de una moneda específica
  getCurrencyInfo(currencyCode: string): CurrencyInfo | null {
    return this.CURRENCY_INFO[currencyCode] || null;
  }

  // Obtener lista de monedas soportadas
  getSupportedCurrencies(): CurrencyInfo[] {
    return Object.values(this.CURRENCY_INFO);
  }

  // Funciones auxiliares para redondeo
  private roundTo2Decimals(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  private roundTo4Decimals(num: number): number {
    return Math.round((num + Number.EPSILON) * 10000) / 10000;
  }

  // Limpiar cache
  clearCache(): void {
    this.cache.clear();
  }

  // Obtener estadísticas del servicio
  getStats() {
    return {
      cacheSize: this.cache.size,
      supportedCurrencies: Object.keys(this.CURRENCY_INFO).length,
      cacheDuration: this.CACHE_DURATION / 1000 // en segundos
    };
  }
}

export const exchangeRateApiService = new ExchangeRateApiService();