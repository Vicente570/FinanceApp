import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { NavigationState, Account, Budget, Expense, Asset, AssetGroup, Debt, InterpersonalDebt, Property } from '../types';
import { exchangeRateApiService } from '../services/exchangeRateApi';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useAuth } from '../hooks/useAuth';

interface AppState {
  navigation: NavigationState;
  accounts: Account[];
  budgets: Budget[];
  expenses: Expense[];
  assets: Asset[];
  assetGroups: AssetGroup[];
  debts: Debt[];
  properties: Property[];
  interpersonalDebts: InterpersonalDebt[];
  currency: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'es' | 'en';
}

interface AppContextType {
  state: AppState;
  navigate: (navigation: NavigationState) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  addAssetGroup: (group: Omit<AssetGroup, 'id'>) => void;
  addDebt: (debt: Omit<Debt, 'id'>) => void;
  addProperty: (property: Omit<Property, 'id'>) => void;
  addInterpersonalDebt: (debt: Omit<InterpersonalDebt, 'id'>) => void;
  updateSettings: (settings: Partial<Pick<AppState, 'currency' | 'theme' | 'language'>>) => void;
  saveData: () => void;
  loadData: () => void;
  // Funciones de edición
  updateAccount: (id: string, updates: Partial<Account>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  updateAssetGroup: (id: string, updates: Partial<AssetGroup>) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  updateInterpersonalDebt: (id: string, updates: Partial<InterpersonalDebt>) => void;
  // Funciones de eliminación
  deleteAccount: (id: string) => void;
  deleteBudget: (id: string) => void;
  deleteExpense: (id: string) => void;
  deleteAsset: (id: string) => void;
  deleteAssetGroup: (id: string) => void;
  deleteDebt: (id: string) => void;
  deleteProperty: (id: string) => void;
  deleteInterpersonalDebt: (id: string) => void;
  // Funciones específicas para grupos
  assignAssetToGroup: (assetId: string, groupId: string | null) => void;
  getAssetsByGroup: (groupId: string) => Asset[];
  getUnassignedAssets: () => Asset[];
  getEmergencyFundValue: () => number;
  syncEmergencyFund: () => void;
  cleanDuplicateEmergencyAssets: () => void;
  resetAppData: () => void;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => Promise<number>;
  testConversions: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState = {
  navigation: { section: 'A' },
  accounts: [
    { id: '1', name: 'Cuenta Corriente', type: 'checking', balance: 2500, currency: 'USD' },
    { id: '2', name: 'Ahorros', type: 'savings', balance: 15000, currency: 'USD' },
    { id: '3', name: 'Tarjeta Crédito', type: 'credit', balance: -1200, currency: 'USD' },
  ],
  budgets: [
    { id: '1', category: 'Casa', allocated: 1500, spent: 1200, currency: 'USD' },
    { id: '2', category: 'Comida', allocated: 800, spent: 650, currency: 'USD' },
    { id: '3', category: 'Transporte', allocated: 400, spent: 380, currency: 'USD' },
    { id: '4', category: 'Entretenimiento', allocated: 300, spent: 150, currency: 'USD' },
  ],
  expenses: [
    { id: '1', amount: 450, category: 'Casa', description: 'Alquiler', date: '2025-01-15', currency: 'USD' },
    { id: '2', amount: 85, category: 'Comida', description: 'Supermercado', date: '2025-01-14', currency: 'USD' },
    { id: '3', amount: 60, category: 'Transporte', description: 'Gasolina', date: '2025-01-13', currency: 'USD' },
  ],
  assets: [
    { id: '1', name: 'Apple Inc.', type: 'stocks', value: 18500, purchasePrice: 15000, quantity: 100, currency: 'USD', riskLevel: 'medium', purchaseDate: '2024-01-15', reason: 'Inversión a largo plazo en tecnología', groupId: 'tech-group' },
    { id: '2', name: 'Bitcoin', type: 'crypto', value: 5200, purchasePrice: 4000, quantity: 0.1, currency: 'USD', riskLevel: 'high', purchaseDate: '2024-03-10', reason: 'Diversificación en criptomonedas' },
    { id: '3', name: 'S&P 500 ETF', type: 'mutual_funds', value: 12000, purchasePrice: 10000, quantity: 250, currency: 'USD', riskLevel: 'low', purchaseDate: '2024-02-20', reason: 'Inversión diversificada en el mercado', groupId: 'funds-group' },
  ],
  assetGroups: [
    { id: 'emergency-fund', name: 'Fondo de Emergencia', description: 'Parte del ahorro que debe estar en liquidez para cubrir gastos imprevistos', color: '#EF4444', createdDate: '2024-01-01', isSpecial: true },
    { id: 'tech-group', name: 'Acciones Tecnológicas', description: 'Empresas de tecnología y software', color: '#3B82F6', createdDate: '2024-01-01' },
    { id: 'funds-group', name: 'Fondos Mutuos', description: 'Fondos de inversión diversificados', color: '#10B981', createdDate: '2024-01-01' },
  ],
  debts: [
    { id: '1', name: 'Hipoteca Casa', type: 'mortgage', amount: 180000, interestRate: 3.5, monthlyPayment: 1500, currency: 'USD' },
    { id: '2', name: 'Préstamo Auto', type: 'auto', amount: 25000, interestRate: 4.2, monthlyPayment: 450, currency: 'USD' },
  ],
  properties: [
    { id: '1', name: 'Casa Principal', type: 'house', value: 250000, purchasePrice: 200000, purchaseDate: '2022-06-15', currency: 'USD', description: 'Casa familiar de 3 habitaciones' },
    { id: '2', name: 'Departamento Centro', type: 'apartment', value: 120000, purchasePrice: 100000, purchaseDate: '2023-03-20', currency: 'USD', description: 'Departamento de inversión para renta' },
  ],
  interpersonalDebts: [
    { id: '1', name: 'Juan', amount: 200, type: 'owe', description: 'Cena restaurant', date: '2025-01-10', currency: 'USD', isSettled: false },
    { id: '2', name: 'María', amount: 150, type: 'owed', description: 'Préstamo emergencia', date: '2025-01-08', currency: 'USD', isSettled: false },
  ],
  currency: 'USD',
  theme: 'light',
  language: 'es',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [isConverting, setIsConverting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Función para generar IDs únicos
  const generateId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const perfTime = window.performance.now().toString().replace('.', '');
    return `${timestamp}_${random}_${perfTime}`;
  };
  
  const { isAuthenticated, user } = useAuth();
  const { saveAllAppData, loadAllAppData } = useSupabaseData();

  // Resetear dataLoaded cuando cambia el usuario autenticado
  useEffect(() => {
    setDataLoaded(false);
  }, [user?.id]);

  // Cargar datos cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && !dataLoaded) {
      console.log('🔄 User authenticated, loading data...');
      loadData();
    }
  }, [isAuthenticated, dataLoaded]);



  // Guardar automáticamente cuando cambien los datos importantes
  useEffect(() => {
    if (isAuthenticated && dataLoaded) {
      console.log('🔄 Data changed, scheduling auto-save...', {
        expensesCount: state.expenses.length,
        accountsCount: state.accounts.length,
        budgetsCount: state.budgets.length,
        assetsCount: state.assets.length,
        debtsCount: state.debts.length,
        propertiesCount: state.properties.length,
        interpersonalDebtsCount: state.interpersonalDebts.length
      });
      const timeoutId = setTimeout(() => {
        console.log('💾 Executing auto-save...');
        saveData();
      }, 1000); // Guardar después de 1 segundo de inactividad
      
      return () => clearTimeout(timeoutId);
    }
  }, [state.expenses, state.accounts, state.budgets, state.assets, state.debts, state.properties, state.interpersonalDebts, isAuthenticated, dataLoaded]);

  // Función para convertir un valor monetario usando USD como moneda base
  const convertAmount = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
    if (fromCurrency === toCurrency) return amount;
    
    try {
      const convertedAmount = await exchangeRateApiService.convertCurrency(amount, fromCurrency, toCurrency);
      // Usar toFixed para evitar problemas de precisión de punto flotante
      const result = parseFloat(convertedAmount.toFixed(2));
      
      // Validación simplificada: solo verificar conversiones significativas
      if (Math.abs(amount) > 1) { // Solo validar para valores mayores a 1
        const backConversion = await exchangeRateApiService.convertCurrency(result, toCurrency, fromCurrency);
        const backResult = parseFloat(backConversion.toFixed(2));
        const difference = Math.abs(amount - backResult);
        const percentDifference = (difference / amount) * 100;
        
        if (percentDifference > 0.5) { // Si la diferencia es mayor al 0.5%
          console.warn(`⚠️ Conversion precision warning: ${amount} ${fromCurrency} -> ${result} ${toCurrency} -> ${backResult} ${fromCurrency} (${percentDifference.toFixed(3)}% difference)`);
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error converting ${amount} from ${fromCurrency} to ${toCurrency}:`, error);
      return amount; // Si falla la conversión, devolver el valor original
    }
  };

  // Función de prueba para verificar conversiones
  const testConversions = async () => {
    console.log('🧪 Testing currency conversions...');
    
    const testCases = [
      { amount: 100, from: 'USD', to: 'CLP' },
      { amount: 80000, from: 'CLP', to: 'USD' },
      { amount: 100, from: 'USD', to: 'EUR' },
      { amount: 85, from: 'EUR', to: 'USD' },
      { amount: 1000, from: 'USD', to: 'JPY' },
      { amount: 110000, from: 'JPY', to: 'USD' }
    ];
    
    for (const testCase of testCases) {
      const result = await convertAmount(testCase.amount, testCase.from, testCase.to);
      const backResult = await convertAmount(result, testCase.to, testCase.from);
      const difference = Math.abs(testCase.amount - backResult);
      const percentDifference = (difference / testCase.amount) * 100;
      
      console.log(`🧪 Test: ${testCase.amount} ${testCase.from} -> ${result} ${testCase.to} -> ${backResult} ${testCase.from} (${percentDifference.toFixed(3)}% difference)`);
    }
  };

  // Función para convertir todos los valores monetarios
  const convertAllValues = async (newCurrency: string) => {
    if (newCurrency === state.currency) return;
    
    setIsConverting(true);
    
    try {
      console.log(`🔄 Converting all values from ${state.currency} to ${newCurrency}...`);
      
      // Mostrar notificación de inicio de conversión
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
      notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>${state.language === 'es' ? 'Convirtiendo valores a' : 'Converting values to'} ${newCurrency}...</span>
        </div>
      `;
      document.body.appendChild(notification);

      // Convertir cuentas
      const convertedAccounts = await Promise.all(
        state.accounts.map(async (account) => ({
          ...account,
          balance: await convertAmount(account.balance, account.currency, newCurrency),
          currency: newCurrency
        }))
      );

      // Convertir presupuestos
      const convertedBudgets = await Promise.all(
        state.budgets.map(async (budget) => ({
          ...budget,
          allocated: await convertAmount(budget.allocated, budget.currency, newCurrency),
          spent: await convertAmount(budget.spent, budget.currency, newCurrency),
          currency: newCurrency
        }))
      );

      // Convertir gastos
      const convertedExpenses = await Promise.all(
        state.expenses.map(async (expense) => ({
          ...expense,
          amount: await convertAmount(expense.amount, expense.currency, newCurrency),
          currency: newCurrency
        }))
      );

      // Convertir activos
      const convertedAssets = await Promise.all(
        state.assets.map(async (asset) => {
          const convertedValue = await convertAmount(asset.value, asset.currency, newCurrency);
          const convertedPurchasePrice = await convertAmount(asset.purchasePrice, asset.currency, newCurrency);
          
          // Convertir precios unitarios si existen
          let convertedCurrentPricePerUnit = asset.currentPricePerUnit;
          let convertedPurchasePricePerUnit = asset.purchasePricePerUnit;
          
          if (asset.currentPricePerUnit) {
            convertedCurrentPricePerUnit = await convertAmount(asset.currentPricePerUnit, asset.currency, newCurrency);
          }
          
          if (asset.purchasePricePerUnit) {
            convertedPurchasePricePerUnit = await convertAmount(asset.purchasePricePerUnit, asset.currency, newCurrency);
          }
          
          return {
            ...asset,
            value: convertedValue,
            purchasePrice: convertedPurchasePrice,
            currentPricePerUnit: convertedCurrentPricePerUnit,
            purchasePricePerUnit: convertedPurchasePricePerUnit,
            currency: newCurrency
          };
        })
      );

      // Convertir deudas
      const convertedDebts = await Promise.all(
        state.debts.map(async (debt) => ({
          ...debt,
          amount: await convertAmount(debt.amount, debt.currency, newCurrency),
          monthlyPayment: await convertAmount(debt.monthlyPayment, debt.currency, newCurrency),
          currency: newCurrency
        }))
      );

      // Convertir propiedades
      const convertedProperties = await Promise.all(
        state.properties.map(async (property) => ({
          ...property,
          value: await convertAmount(property.value, property.currency, newCurrency),
          purchasePrice: await convertAmount(property.purchasePrice, property.currency, newCurrency),
          currency: newCurrency
        }))
      );

      // Convertir deudas interpersonales
      const convertedInterpersonalDebts = await Promise.all(
        state.interpersonalDebts.map(async (debt) => ({
          ...debt,
          amount: await convertAmount(debt.amount, debt.currency, newCurrency),
          currency: newCurrency
        }))
      );

      // Actualizar el estado con todos los valores convertidos
      setState(prev => ({
        ...prev,
        accounts: convertedAccounts,
        budgets: convertedBudgets,
        expenses: convertedExpenses,
        assets: convertedAssets,
        debts: convertedDebts,
        properties: convertedProperties,
        interpersonalDebts: convertedInterpersonalDebts,
        currency: newCurrency
      }));

      // Remover notificación de carga y mostrar éxito
      document.body.removeChild(notification);
      
      const successNotification = document.createElement('div');
      successNotification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
      successNotification.innerHTML = `
        <div class="flex items-center space-x-2">
          <span>✅</span>
          <span>${state.language === 'es' ? 'Valores convertidos exitosamente a' : 'Values successfully converted to'} ${newCurrency}</span>
        </div>
      `;
      document.body.appendChild(successNotification);
      
      setTimeout(() => {
        successNotification.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(successNotification)) {
            document.body.removeChild(successNotification);
          }
        }, 300);
      }, 3000);

      console.log(`✅ All values converted successfully to ${newCurrency}`);
      
    } catch (error) {
      console.error('Error converting currency values:', error);
      
      // Mostrar notificación de error
      const errorNotification = document.createElement('div');
      errorNotification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      errorNotification.innerHTML = `
        <div class="flex items-center space-x-2">
          <span>❌</span>
          <span>${state.language === 'es' ? 'Error al convertir valores' : 'Error converting values'}</span>
        </div>
      `;
      document.body.appendChild(errorNotification);
      
      setTimeout(() => {
        if (document.body.contains(errorNotification)) {
          document.body.removeChild(errorNotification);
        }
      }, 5000);
    } finally {
      setIsConverting(false);
    }
  };

  const navigate = (navigation: NavigationState) => {
    setState(prev => ({ ...prev, navigation }));
  };

  const addAccount = (account: Omit<Account, 'id'>) => {
    setState(prev => ({
      ...prev,
      accounts: [...prev.accounts, { ...account, id: generateId() }]
    }));
    // Sincronizar fondo de emergencia si es una cuenta de ahorro
    if (account.type === 'savings') {
      setTimeout(() => syncEmergencyFund(), 100);
    }
  };

  const addBudget = (budget: Omit<Budget, 'id'>) => {
    setState(prev => ({
      ...prev,
      budgets: [...prev.budgets, { ...budget, id: generateId() }]
    }));
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setState(prev => {
      const newState = {
        ...prev,
        expenses: [...prev.expenses, { ...expense, id: generateId() }]
      };
      
      // Actualizar el presupuesto correspondiente
      const updatedBudgets = newState.budgets.map(budget => {
        if (budget.category === expense.category) {
          return { ...budget, spent: budget.spent + expense.amount };
        }
        return budget;
      });
      
      return { ...newState, budgets: updatedBudgets };
    });
  };

  const addAsset = useCallback((asset: Omit<Asset, 'id'>) => {
    setState(prev => {
      let newAsset = { ...asset, id: generateId() };
      
      // Si es un activo del fondo de emergencia, configurar valores especiales
      if (asset.groupId === 'emergency-fund') {
        newAsset = {
          ...newAsset,
          currentPricePerUnit: 1,
          purchasePricePerUnit: 1,
          quantity: asset.value,
          value: asset.value,
          purchasePrice: asset.value
        };
      }
      
      const updatedAssets = [...prev.assets, newAsset];
      
      // Si se agregó un activo al fondo de emergencia, sincronizar las cuentas
      if (asset.groupId === 'emergency-fund') {
        const savingsAccounts = prev.accounts.filter(account => account.type === 'savings');
        if (savingsAccounts.length > 0) {
          const updatedAccounts = prev.accounts.map(account => 
            account.id === savingsAccounts[0].id ? { ...account, balance: asset.value } : account
          );
          return { ...prev, assets: updatedAssets, accounts: updatedAccounts };
        }
      }
      
      return { ...prev, assets: updatedAssets };
    });
  }, []);

  const addAssetGroup = (group: Omit<AssetGroup, 'id'>) => {
    setState(prev => ({
      ...prev,
      assetGroups: [...prev.assetGroups, { ...group, id: generateId() }]
    }));
  };

  const addDebt = (debt: Omit<Debt, 'id'>) => {
    setState(prev => ({
      ...prev,
      debts: [...prev.debts, { ...debt, id: generateId() }]
    }));
  };

  const addProperty = (property: Omit<Property, 'id'>) => {
    setState(prev => ({
      ...prev,
      properties: [...prev.properties, { ...property, id: generateId() }]
    }));
  };

  const addInterpersonalDebt = (debt: Omit<InterpersonalDebt, 'id'>) => {
    setState(prev => ({
      ...prev,
      interpersonalDebts: [...prev.interpersonalDebts, { ...debt, id: generateId() }]
    }));
  };

  const updateSettings = async (settings: Partial<Pick<AppState, 'currency' | 'theme' | 'language'>>) => {
    // Si se está cambiando la moneda, convertir todos los valores
    if (settings.currency && settings.currency !== state.currency) {
      await convertAllValues(settings.currency);
    } else {
      // Para otros cambios de configuración, actualizar directamente
      setState(prev => ({ ...prev, ...settings }));
    }
  };

  // Funciones de actualización
  const updateAccount = (id: string, updates: Partial<Account>) => {
    setState(prev => {
      const updatedAccounts = prev.accounts.map(account => 
        account.id === id ? { ...account, ...updates } : account
      );
      return { ...prev, accounts: updatedAccounts };
    });
    
    // Sincronizar fondo de emergencia si se modificó una cuenta de ahorro
    // Solo si no es una actualización desde el fondo de emergencia
    const account = state.accounts.find(acc => acc.id === id);
    if (account?.type === 'savings') {
      setTimeout(() => syncEmergencyFund(), 100);
    }
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.map(budget => 
        budget.id === id ? { ...budget, ...updates } : budget
      )
    }));
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setState(prev => {
      const oldExpense = prev.expenses.find(expense => expense.id === id);
      const newExpenses = prev.expenses.map(expense => 
        expense.id === id ? { ...expense, ...updates } : expense
      );
      
      // Actualizar presupuestos si cambió la categoría o el monto
      let updatedBudgets = prev.budgets;
      if (oldExpense) {
        // Restar el monto anterior de la categoría anterior
        updatedBudgets = updatedBudgets.map(budget => {
          if (budget.category === oldExpense.category) {
            return { ...budget, spent: Math.max(0, budget.spent - oldExpense.amount) };
          }
          return budget;
        });
        
        // Agregar el nuevo monto a la nueva categoría
        const newExpense = { ...oldExpense, ...updates };
        updatedBudgets = updatedBudgets.map(budget => {
          if (budget.category === newExpense.category) {
            return { ...budget, spent: budget.spent + newExpense.amount };
          }
          return budget;
        });
      }
      
      return { ...prev, expenses: newExpenses, budgets: updatedBudgets };
    });
  };

  const updateAsset = useCallback((id: string, updates: Partial<Asset>) => {
    setState(prev => {
      const updatedAssets = prev.assets.map(asset => 
        asset.id === id ? { ...asset, ...updates } : asset
      );
      
      // Si se actualizó un activo del fondo de emergencia, sincronizar las cuentas
      const updatedAsset = prev.assets.find(asset => asset.id === id);
      if (updatedAsset?.groupId === 'emergency-fund') {
        // Para el fondo de emergencia, usar el valor actualizado directamente
        // y asegurar que los precios unitarios sean 1 para evitar cálculos incorrectos
        let newEmergencyValue = updates.value !== undefined ? updates.value : updatedAsset.value;
        
        // Si se actualizó currentPricePerUnit, usar ese valor directamente
        if (updates.currentPricePerUnit !== undefined) {
          newEmergencyValue = updates.currentPricePerUnit;
        }
        
        const savingsAccounts = prev.accounts.filter(account => account.type === 'savings');
        if (savingsAccounts.length > 0) {
          const updatedAccounts = prev.accounts.map(account => 
            account.id === savingsAccounts[0].id ? { ...account, balance: newEmergencyValue } : account
          );
          
          // Actualizar también el activo para que tenga valores consistentes
          const finalUpdatedAssets = updatedAssets.map(asset => 
            asset.id === id ? {
              ...asset,
              value: newEmergencyValue,
              currentPricePerUnit: 1,
              purchasePricePerUnit: 1,
              quantity: newEmergencyValue
            } : asset
          );
          
          return { ...prev, assets: finalUpdatedAssets, accounts: updatedAccounts };
        }
      }
      
      return { ...prev, assets: updatedAssets };
    });
  }, []);

  const updateAssetGroup = (id: string, updates: Partial<AssetGroup>) => {
    setState(prev => ({
      ...prev,
      assetGroups: prev.assetGroups.map(group => 
        group.id === id ? { ...group, ...updates } : group
      )
    }));
  };

  const updateDebt = (id: string, updates: Partial<Debt>) => {
    setState(prev => ({
      ...prev,
      debts: prev.debts.map(debt => 
        debt.id === id ? { ...debt, ...updates } : debt
      )
    }));
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    setState(prev => ({
      ...prev,
      properties: prev.properties.map(property => 
        property.id === id ? { ...property, ...updates } : property
      )
    }));
  };

  const updateInterpersonalDebt = (id: string, updates: Partial<InterpersonalDebt>) => {
    setState(prev => ({
      ...prev,
      interpersonalDebts: prev.interpersonalDebts.map(debt => 
        debt.id === id ? { ...debt, ...updates } : debt
      )
    }));
  };

  // Funciones de eliminación
  const deleteAccount = (id: string) => {
    setState(prev => {
      const accountToDelete = prev.accounts.find(account => account.id === id);
      const updatedAccounts = prev.accounts.filter(account => account.id !== id);
      return { ...prev, accounts: updatedAccounts };
    });
    // Sincronizar fondo de emergencia si se eliminó una cuenta de ahorro
    setTimeout(() => syncEmergencyFund(), 100);
  };

  const deleteBudget = (id: string) => {
    setState(prev => ({
      ...prev,
      budgets: prev.budgets.filter(budget => budget.id !== id)
    }));
  };

  const deleteExpense = (id: string) => {
    setState(prev => {
      const expenseToDelete = prev.expenses.find(expense => expense.id === id);
      const newExpenses = prev.expenses.filter(expense => expense.id !== id);
      
      // Actualizar el presupuesto correspondiente
      let updatedBudgets = prev.budgets;
      if (expenseToDelete) {
        updatedBudgets = prev.budgets.map(budget => {
          if (budget.category === expenseToDelete.category) {
            return { ...budget, spent: Math.max(0, budget.spent - expenseToDelete.amount) };
          }
          return budget;
        });
      }
      
      return { ...prev, expenses: newExpenses, budgets: updatedBudgets };
    });
  };

  const deleteAsset = useCallback((id: string) => {
    setState(prev => {
      const assetToDelete = prev.assets.find(asset => asset.id === id);
      const isEmergencyFundAsset = assetToDelete?.groupId === 'emergency-fund';
      
      const updatedAssets = prev.assets.filter(asset => asset.id !== id);
      
      // Si se eliminó un activo del fondo de emergencia, sincronizar las cuentas
      if (isEmergencyFundAsset) {
        const savingsAccounts = prev.accounts.filter(account => account.type === 'savings');
        if (savingsAccounts.length > 0) {
          const updatedAccounts = prev.accounts.map(account => 
            account.id === savingsAccounts[0].id ? { ...account, balance: 0 } : account
          );
          return { ...prev, assets: updatedAssets, accounts: updatedAccounts };
        }
      }
      
      return { ...prev, assets: updatedAssets };
    });
  }, []);

  const deleteAssetGroup = (id: string) => {
    setState(prev => {
      const groupToDelete = prev.assetGroups.find(group => group.id === id);
      
      // No permitir eliminar grupos especiales como el fondo de emergencia
      if (groupToDelete?.isSpecial) {
        console.warn('No se puede eliminar un grupo especial');
        return prev;
      }
      
      return {
        ...prev,
        assetGroups: prev.assetGroups.filter(group => group.id !== id),
        // Remover la asignación de grupo de todos los activos que pertenecían a este grupo
        assets: prev.assets.map(asset => 
          asset.groupId === id ? { ...asset, groupId: undefined } : asset
        )
      };
    });
  };

  const deleteDebt = (id: string) => {
    setState(prev => ({
      ...prev,
      debts: prev.debts.filter(debt => debt.id !== id)
    }));
  };

  const deleteProperty = (id: string) => {
    setState(prev => ({
      ...prev,
      properties: prev.properties.filter(property => property.id !== id)
    }));
  };

  const deleteInterpersonalDebt = (id: string) => {
    setState(prev => ({
      ...prev,
      interpersonalDebts: prev.interpersonalDebts.filter(debt => debt.id !== id)
    }));
  };

  // Funciones específicas para grupos
  const assignAssetToGroup = (assetId: string, groupId: string | null) => {
    setState(prev => ({
      ...prev,
      assets: prev.assets.map(asset => 
        asset.id === assetId ? { ...asset, groupId: groupId || undefined } : asset
      )
    }));
  };

  const getAssetsByGroup = (groupId: string) => {
    return state.assets.filter(asset => asset.groupId === groupId);
  };

  const getUnassignedAssets = () => {
    return state.assets.filter(asset => !asset.groupId);
  };

  // Función para obtener el valor del fondo de emergencia
  const getEmergencyFundValue = useCallback(() => {
    // Sumar todas las cuentas de ahorro (savings)
    return state.accounts
      .filter(account => account.type === 'savings')
      .reduce((sum, account) => sum + Math.max(0, account.balance), 0);
  }, [state.accounts]);

  // Flag para evitar ejecuciones simultáneas de syncEmergencyFund
  const isSyncingRef = useRef(false);

  // Función para sincronizar el fondo de emergencia
  // Función para limpiar activos duplicados de emergencia
  const cleanDuplicateEmergencyAssets = useCallback(() => {
    setState(prev => {
      const emergencyAssets = prev.assets.filter(asset => asset.groupId === 'emergency-fund');
      if (emergencyAssets.length > 1) {
        console.log('🧹 Cleaning duplicate emergency assets:', emergencyAssets.length);
        // Mantener solo el primer activo de emergencia
        const firstEmergencyAsset = emergencyAssets[0];
        const cleanedAssets = prev.assets.filter(asset => 
          asset.groupId !== 'emergency-fund' || asset.id === firstEmergencyAsset.id
        );
        return { ...prev, assets: cleanedAssets };
      }
      return prev;
    });
  }, []);

  const syncEmergencyFund = useCallback(() => {
    console.log('🔄 syncEmergencyFund called');
    
    // Evitar ejecuciones simultáneas
    if (isSyncingRef.current) {
      console.log('⏳ syncEmergencyFund already running, skipping...');
      return;
    }
    
    isSyncingRef.current = true;
    
    const emergencyFundValue = getEmergencyFundValue();
    console.log('💰 Emergency fund value:', emergencyFundValue);
    
    setState(prev => {
      // Buscar todos los activos de fondo de emergencia
      const emergencyAssets = prev.assets.filter(asset => asset.groupId === 'emergency-fund');
      console.log('🔍 Found emergency assets:', emergencyAssets.length, emergencyAssets.map(a => a.id));
      
      let updatedAssets = [...prev.assets];
      
      // Si ya hay un activo de emergencia, solo actualizarlo
      if (emergencyAssets.length > 0) {
        const firstEmergencyAsset = emergencyAssets[0];
        updatedAssets = updatedAssets.map(asset => 
          asset.id === firstEmergencyAsset.id ? {
            ...asset,
            value: emergencyFundValue,
            purchasePrice: emergencyFundValue,
            quantity: emergencyFundValue,
            currentPricePerUnit: 1,
            purchasePricePerUnit: 1
          } : asset
        );
        console.log('🔄 Updated existing emergency asset');
      } else if (emergencyFundValue > 0) {
        // Solo crear un nuevo activo si no existe y hay valor
        const newEmergencyAsset: Asset = {
          id: generateId(),
          name: 'Fondo de Emergencia',
          type: 'bonds',
          value: emergencyFundValue,
          purchasePrice: emergencyFundValue,
          quantity: emergencyFundValue,
          currency: prev.currency,
          riskLevel: 'low',
          purchaseDate: new Date().toISOString().split('T')[0],
          reason: 'Fondo de emergencia - liquidez para gastos imprevistos',
          groupId: 'emergency-fund',
          currentPricePerUnit: 1,
          purchasePricePerUnit: 1
        };
        console.log('🆕 Creating new emergency asset with ID:', newEmergencyAsset.id);
        updatedAssets.push(newEmergencyAsset);
      }
      
      return { ...prev, assets: updatedAssets };
    });
    
    // Reset del flag después de completar
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 100);
  }, [getEmergencyFundValue]);

  // Función para resetear todos los datos locales
  const resetAppData = () => {
    setState(prev => ({
      navigation: prev.navigation,
      accounts: [],
      budgets: [],
      expenses: [],
      assets: [],
      assetGroups: [],
      debts: [],
      properties: [],
      interpersonalDebts: [],
      currency: prev.currency,
      theme: prev.theme,
      language: prev.language
    }));
  };

  const saveData = async () => {
    console.log('🔍 saveData called, isAuthenticated:', isAuthenticated);
    if (!isAuthenticated) {
      console.warn('User not authenticated, cannot save to Supabase');
      return;
    }

    try {
      console.log('📊 Preparing data for save...');
      const appData = {
        accounts: state.accounts,
        budgets: state.budgets,
        expenses: state.expenses,
        assets: state.assets,
        assetGroups: state.assetGroups,
        debts: state.debts,
        properties: state.properties,
        interpersonalDebts: state.interpersonalDebts,
        currency: state.currency,
        theme: state.theme,
        language: state.language
      };

      console.log('💾 Calling saveAllAppData...');
      const result = await saveAllAppData(appData);
      console.log('📋 Save result:', result);
      
      // Mostrar notificación
      const notification = document.createElement('div');
      notification.className = `fixed top-4 right-4 ${
        result.success ? 'bg-green-500' : 'bg-red-500'
      } text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300`;
      notification.textContent = result.success ? '✓ Datos guardados en Supabase' : '✗ Error al guardar en Supabase';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 2000);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const loadData = async () => {
    if (!isAuthenticated) {
      console.warn('User not authenticated, cannot load from Supabase');
      setDataLoaded(true);
      return;
    }

    try {
      console.log('📥 Loading data from Supabase...');
      const loadedData = await loadAllAppData();
      
      if (loadedData) {
        // Limpiar activos duplicados de emergencia antes de cargar
        let cleanedAssets = loadedData.assets || [];
        const emergencyAssets = cleanedAssets.filter((asset: any) => asset.groupId === 'emergency-fund');
        
        if (emergencyAssets.length > 1) {
          console.log('🧹 Cleaning duplicate emergency assets:', emergencyAssets.length);
          // Mantener solo el primer activo de emergencia
          const firstEmergencyAsset = emergencyAssets[0];
          cleanedAssets = cleanedAssets.filter((asset: any) => 
            asset.groupId !== 'emergency-fund' || asset.id === firstEmergencyAsset.id
          );
        }
        
        setState(prev => ({
          ...prev,
          ...loadedData,
          assets: cleanedAssets,
          // Asegurar que todos los campos existen
          assetGroups: loadedData.assetGroups || prev.assetGroups,
          interpersonalDebts: (loadedData.interpersonalDebts || []).map((debt: any) => ({
            ...debt,
            isSettled: debt.isSettled || false
          })),
          theme: (loadedData.theme as 'light' | 'dark' | 'auto') || prev.theme,
          language: (loadedData.language as 'es' | 'en') || prev.language,
          navigation: prev.navigation // Mantener navegación actual
        }));
        
        console.log('✅ Data loaded from Supabase successfully');
        
        // Limpiar activos duplicados después de cargar
        setTimeout(() => cleanDuplicateEmergencyAssets(), 100);
      } else {
        console.log('📋 No data found in Supabase, using initial state');
      }
      
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading data:', error);
      setDataLoaded(true);
    }
  };

  const value: AppContextType = {
    state,
    navigate,
    addAccount,
    addBudget,
    addExpense,
    addAsset,
    addAssetGroup,
    addDebt,
    addProperty,
    addInterpersonalDebt,
    updateSettings,
    saveData,
    loadData,
    // Funciones de edición
    updateAccount,
    updateBudget,
    updateExpense,
    updateAsset,
    updateAssetGroup,
    updateDebt,
    updateProperty,
    updateInterpersonalDebt,
    // Funciones de eliminación
    deleteAccount,
    deleteBudget,
    deleteExpense,
    deleteAsset,
    deleteAssetGroup,
    deleteDebt,
    deleteProperty,
    deleteInterpersonalDebt,
    // Funciones específicas para grupos
    assignAssetToGroup,
    getAssetsByGroup,
    getUnassignedAssets,
    getEmergencyFundValue,
    syncEmergencyFund,
    cleanDuplicateEmergencyAssets,
    resetAppData,
    // Funciones de conversión
    convertAmount,
    testConversions,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}