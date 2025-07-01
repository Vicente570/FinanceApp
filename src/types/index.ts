export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
  currency: string;
}

export interface Budget {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  currency: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  currency: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'stocks' | 'crypto' | 'mutual_funds' | 'bonds';
  value: number; // Valor total actual (precio actual × cantidad)
  purchasePrice: number; // Valor total de compra (precio compra × cantidad)
  quantity: number;
  currency: string;
  riskLevel: 'low' | 'medium' | 'high';
  purchaseDate?: string;
  reason?: string;
  groupId?: string;
  // Nuevos campos para mantener precios unitarios y conexión API
  currentPricePerUnit?: number; // Precio actual por unidad
  purchasePricePerUnit?: number; // Precio de compra por unidad
  symbol?: string; // Símbolo de la acción (para APIs)
  isConnectedToApi?: boolean; // Si está conectado a APIs en tiempo real
}

export interface AssetGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdDate: string;
}

export interface Debt {
  id: string;
  name: string;
  type: 'mortgage' | 'auto' | 'personal' | 'credit_card';
  amount: number;
  interestRate: number;
  monthlyPayment: number;
  currency: string;
}

export interface Property {
  id: string;
  name: string;
  type: 'house' | 'apartment' | 'land' | 'commercial' | 'other';
  value: number;
  purchasePrice: number;
  purchaseDate: string;
  currency: string;
  description?: string;
}

export interface InterpersonalDebt {
  id: string;
  name: string;
  amount: number;
  type: 'owe' | 'owed';
  description: string;
  date: string;
  currency: string;
  isSettled?: boolean; // Nuevo campo para marcar como saldada
}

export interface ExchangeRate {
  currency: string;
  name: string;
  rate: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export type SectionId = 'A' | 'B' | 'C' | 'D';
export type SubsectionId = '1' | '2' | '3';

export interface NavigationState {
  section: SectionId;
  subsection?: SubsectionId;
  subsubsection?: string;
  groupId?: string; // Para navegación a grupos específicos
}