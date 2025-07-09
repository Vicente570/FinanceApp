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
  private usdRatesCache: { data: Record<string, number>; timestamp: number } | null = null;

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

  // Obtener tasas USD de manera eficiente (cache específico para USD)
  private async getUSDRates(): Promise<Record<string, number>> {
    if (this.usdRatesCache && Date.now() - this.usdRatesCache.timestamp < this.CACHE_DURATION) {
      return this.usdRatesCache.data;
    }

    try {
      console.log(`🔄 Fetching USD exchange rates`);
      const response = await fetch(`${this.BASE_URL}/USD`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ExchangeRateResponse = await response.json();
      
      this.usdRatesCache = {
        data: data.rates,
        timestamp: Date.now()
      };
      
      console.log(`✅ USD rates cached successfully`);
      return data.rates;
      
    } catch (error) {
      console.error('❌ Error fetching USD rates:', error);
      // Devolver tasas de respaldo
      const fallbackRates = this.getFallbackExchangeRates('USD');
      const rates: Record<string, number> = {};
      fallbackRates.forEach(rate => {
        rates[rate.currency] = rate.rate;
      });
      return rates;
    }
  }

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
    // Las tasas están en formato "1 USD = X [moneda]"
    const mockRates: Record<string, Record<string, number>> = {
      'USD': {
        'EUR': 0.85, 'GBP': 0.73, 'JPY': 110.0, 'CAD': 1.25, 'AUD': 1.35,
        'CHF': 0.92, 'CNY': 6.45, 'MXN': 20.5, 'CLP': 800.0, 'COP': 4000.0
      },
      'EUR': {
        'USD': 1.18, 'GBP': 0.86, 'JPY': 129.0, 'CAD': 1.47, 'AUD': 1.59,
        'CHF': 1.08, 'CNY': 7.60, 'MXN': 24.2, 'CLP': 942.0, 'COP': 4720.0
      },
      'GBP': {
        'USD': 1.37, 'EUR': 1.16, 'JPY': 150.0, 'CAD': 1.71, 'AUD': 1.85,
        'CHF': 1.26, 'CNY': 8.84, 'MXN': 28.1, 'CLP': 1096.0, 'COP': 5480.0
      },
      'JPY': {
        'USD': 0.0091, 'EUR': 0.0077, 'GBP': 0.0067, 'CAD': 0.0114, 'AUD': 0.0123,
        'CHF': 0.0084, 'CNY': 0.059, 'MXN': 0.187, 'CLP': 7.27, 'COP': 36.4
      },
      'CAD': {
        'USD': 0.80, 'EUR': 0.68, 'GBP': 0.58, 'JPY': 88.0, 'AUD': 1.08,
        'CHF': 0.74, 'CNY': 5.16, 'MXN': 16.4, 'CLP': 640.0, 'COP': 3200.0
      },
      'AUD': {
        'USD': 0.74, 'EUR': 0.63, 'GBP': 0.54, 'JPY': 81.5, 'CAD': 0.93,
        'CHF': 0.68, 'CNY': 4.78, 'MXN': 15.2, 'CLP': 592.0, 'COP': 2960.0
      },
      'CHF': {
        'USD': 1.09, 'EUR': 0.93, 'GBP': 0.79, 'JPY': 119.6, 'CAD': 1.36,
        'AUD': 1.47, 'CNY': 7.01, 'MXN': 22.3, 'CLP': 870.0, 'COP': 4350.0
      },
      'CNY': {
        'USD': 0.155, 'EUR': 0.132, 'GBP': 0.113, 'JPY': 17.1, 'CAD': 0.194,
        'AUD': 0.209, 'CHF': 0.143, 'MXN': 3.18, 'CLP': 124.0, 'COP': 620.0
      },
      'MXN': {
        'USD': 0.049, 'EUR': 0.041, 'GBP': 0.036, 'JPY': 5.37, 'CAD': 0.061,
        'AUD': 0.066, 'CHF': 0.045, 'CNY': 0.31, 'CLP': 39.0, 'COP': 195.0
      },
      'CLP': {
        'USD': 0.00125, 'EUR': 0.00106, 'GBP': 0.00091, 'JPY': 0.138, 'CAD': 0.00156,
        'AUD': 0.00169, 'CHF': 0.00115, 'CNY': 0.008, 'MXN': 0.026, 'COP': 5.0
      },
      'COP': {
        'USD': 0.00025, 'EUR': 0.00021, 'GBP': 0.00018, 'JPY': 0.0275, 'CAD': 0.00031,
        'AUD': 0.00034, 'CHF': 0.00023, 'CNY': 0.00161, 'MXN': 0.0051, 'CLP': 0.2
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

  // Convertir monto entre monedas usando USD como moneda base
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return amount;
    
    try {
      console.log(`🔄 Converting ${amount} from ${fromCurrency} to ${toCurrency} via USD`);
      
      // Obtener todas las tasas USD de una vez (cacheado)
      const usdRates = await this.getUSDRates();
      
      // Convertir a USD primero
      let usdAmount: number;
      
      if (fromCurrency === 'USD') {
        usdAmount = amount;
      } else {
        const usdRate = usdRates[fromCurrency];
        
        if (usdRate) {
          // Para convertir de otra moneda a USD, dividimos por la tasa
          // Ej: 800 CLP ÷ 800 = 1 USD
          usdAmount = this.roundTo2Decimals(amount / usdRate);
          console.log(`✅ ${fromCurrency} to USD: ${amount} ÷ ${usdRate} = ${usdAmount} USD`);
        } else {
          console.log(`⚠️ No USD rate found for ${fromCurrency}, returning original amount`);
          return amount;
        }
      }
      
      // Convertir de USD a la moneda destino
      if (toCurrency === 'USD') {
        console.log(`✅ Final result: ${usdAmount} USD`);
        return usdAmount;
      } else {
        const targetRate = usdRates[toCurrency];
        
        if (targetRate) {
          // Para convertir de USD a otra moneda, multiplicamos por la tasa
          // Ej: 1 USD × 800 = 800 CLP
          const result = this.roundTo2Decimals(usdAmount * targetRate);
          console.log(`✅ USD to ${toCurrency}: ${usdAmount} × ${targetRate} = ${result} ${toCurrency}`);
          return result;
        } else {
          console.log(`⚠️ No conversion rate found for USD to ${toCurrency}, returning USD amount`);
          return usdAmount;
        }
      }
      
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
    // Usar toFixed para evitar problemas de precisión de punto flotante
    return parseFloat(num.toFixed(2));
  }

  private roundTo4Decimals(num: number): number {
    // Usar toFixed para evitar problemas de precisión de punto flotante
    return parseFloat(num.toFixed(4));
  }

  // Limpiar cache
  clearCache(): void {
    this.cache.clear();
    this.usdRatesCache = null;
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