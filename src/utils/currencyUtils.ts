/**
 * Utilidades para el formato de moneda
 */

export interface CurrencyFormatOptions {
  language?: 'es' | 'en';
  currency?: string;
}

/**
 * Formatea un número como moneda usando Intl.NumberFormat
 * @param amount - El monto a formatear
 * @param options - Opciones de formato (idioma y moneda)
 * @returns String formateado como moneda
 */
export const formatCurrency = (amount: number, options: CurrencyFormatOptions = {}) => {
  const { language = 'en', currency = 'USD' } = options;
  
  // Para USD, siempre usar formato en inglés para evitar inconsistencias
  const locale = currency === 'USD' ? 'en-US' : (language === 'es' ? 'es-ES' : 'en-US');
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: (currency === 'JPY' || currency === 'CLP') ? 0 : 2,
    maximumFractionDigits: (currency === 'JPY' || currency === 'CLP') ? 0 : 2
  }).format(amount);
};

/**
 * Formatea un número como porcentaje
 * @param value - El valor a formatear (0-1 o 0-100)
 * @param options - Opciones de formato
 * @returns String formateado como porcentaje
 */
export const formatPercentage = (value: number, options: { decimals?: number } = {}) => {
  const { decimals = 2 } = options;
  const percentage = value > 1 ? value : value * 100;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Formatea un número con separadores de miles
 * @param value - El número a formatear
 * @param options - Opciones de formato
 * @returns String formateado con separadores
 */
export const formatNumber = (value: number, options: { decimals?: number } = {}) => {
  const { decimals = 2 } = options;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}; 