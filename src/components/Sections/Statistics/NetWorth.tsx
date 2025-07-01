import React from 'react';
import { useApp } from '../../../context/AppContext';
import { Card } from '../../Common/Card';
import { TrendingUp, TrendingDown, DollarSign, Home, Wallet, CreditCard, Target, Users } from 'lucide-react';

export function NetWorth() {
  const { state } = useApp();
  const { accounts, assets, debts, properties, interpersonalDebts } = state;

  // Calcular activos líquidos (efectivo)
  const liquidAssets = accounts.reduce((sum, account) => sum + Math.max(0, account.balance), 0);
  
  // Calcular inversiones
  const investmentAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
  
  // Calcular valor de propiedades
  const propertyAssets = properties.reduce((sum, property) => sum + property.value, 0);
  
  // Total de activos
  const totalAssets = liquidAssets + investmentAssets + propertyAssets;

  // Calcular deudas de tarjetas de crédito (saldos negativos en cuentas)
  const creditCardDebt = accounts.reduce((sum, account) => sum + Math.max(0, -account.balance), 0);
  
  // Calcular deudas financieras
  const financialDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);
  
  // Calcular deudas interpersonales netas
  const interpersonalOwed = interpersonalDebts
    .filter(debt => debt.type === 'owe' && !debt.isSettled)
    .reduce((sum, debt) => sum + debt.amount, 0);
  
  // Total de pasivos
  const totalLiabilities = creditCardDebt + financialDebt + interpersonalOwed;
  
  // Patrimonio neto
  const netWorth = totalAssets - totalLiabilities;

  // Calcular ganancia/pérdida en inversiones
  const investmentCost = assets.reduce((sum, asset) => sum + asset.purchasePrice, 0);
  const investmentGainLoss = investmentAssets - investmentCost;
  
  // Calcular ganancia/pérdida en propiedades
  const propertyCost = properties.reduce((sum, property) => sum + property.purchasePrice, 0);
  const propertyGainLoss = propertyAssets - propertyCost;

  // Desglose detallado de activos
  const assetBreakdown = [
    {
      category: state.language === 'es' ? 'Efectivo y Equivalentes' : 'Cash & Equivalents',
      amount: liquidAssets,
      icon: Wallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      accounts: accounts.filter(account => account.balance > 0)
    },
    {
      category: state.language === 'es' ? 'Inversiones' : 'Investments',
      amount: investmentAssets,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      gainLoss: investmentGainLoss,
      items: assets
    },
    {
      category: state.language === 'es' ? 'Propiedades' : 'Properties',
      amount: propertyAssets,
      icon: Home,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      gainLoss: propertyGainLoss,
      items: properties
    }
  ];

  // Desglose detallado de pasivos
  const liabilityBreakdown = [
    {
      category: state.language === 'es' ? 'Tarjetas de Crédito' : 'Credit Cards',
      amount: creditCardDebt,
      icon: CreditCard,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      accounts: accounts.filter(account => account.balance < 0)
    },
    {
      category: state.language === 'es' ? 'Deudas Financieras' : 'Financial Debts',
      amount: financialDebt,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      items: debts
    },
    {
      category: state.language === 'es' ? 'Deudas Interpersonales' : 'Personal Debts',
      amount: interpersonalOwed,
      icon: Users,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      items: interpersonalDebts.filter(debt => debt.type === 'owe' && !debt.isSettled)
    }
  ];

  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-gray-900">
        {state.language === 'es' ? 'Patrimonio Neto' : 'Net Worth'}
      </h2>

      {/* Resumen Principal */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-emerald-50">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <DollarSign className="w-12 h-12 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700">
              {state.language === 'es' ? 'Patrimonio Neto Total' : 'Total Net Worth'}
            </h3>
            <p className={`text-4xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netWorth.toLocaleString()}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-gray-600">{state.language === 'es' ? 'Activos Totales' : 'Total Assets'}</p>
              <p className="text-2xl font-bold text-green-600">${totalAssets.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{state.language === 'es' ? 'Pasivos Totales' : 'Total Liabilities'}</p>
              <p className="text-2xl font-bold text-red-600">${totalLiabilities.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Desglose de Activos */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {state.language === 'es' ? 'Desglose de Activos' : 'Assets Breakdown'}
        </h3>
        
        <div className="space-y-6">
          {assetBreakdown.map((category) => {
            const Icon = category.icon;
            const percentage = totalAssets > 0 ? (category.amount / totalAssets) * 100 : 0;
            
            return (
              <div key={category.category} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${category.bgColor}`}>
                      <Icon className={`w-5 h-5 ${category.color}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{category.category}</h4>
                      {category.gainLoss !== undefined && (
                        <div className={`flex items-center space-x-1 text-sm ${
                          category.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {category.gainLoss >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>
                            {category.gainLoss >= 0 ? '+' : ''}${category.gainLoss.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${category.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{percentage.toFixed(1)}%</p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      category.category.includes('Efectivo') || category.category.includes('Cash') ? 'bg-blue-500' :
                      category.category.includes('Inversiones') || category.category.includes('Investments') ? 'bg-emerald-500' :
                      'bg-purple-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Detalles de elementos */}
                {category.accounts && category.accounts.length > 0 && (
                  <div className="ml-10 space-y-1">
                    {category.accounts.map((account) => (
                      <div key={account.id} className="flex justify-between text-sm text-gray-600">
                        <span>{account.name}</span>
                        <span>${account.balance.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {category.items && category.items.length > 0 && (
                  <div className="ml-10 space-y-1">
                    {category.items.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm text-gray-600">
                        <span>{item.name}</span>
                        <span>${item.value.toLocaleString()}</span>
                      </div>
                    ))}
                    {category.items.length > 3 && (
                      <div className="text-xs text-gray-500">
                        {state.language === 'es' ? `... y ${category.items.length - 3} más` : `... and ${category.items.length - 3} more`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Desglose de Pasivos */}
      {totalLiabilities > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {state.language === 'es' ? 'Desglose de Pasivos' : 'Liabilities Breakdown'}
          </h3>
          
          <div className="space-y-6">
            {liabilityBreakdown.filter(category => category.amount > 0).map((category) => {
              const Icon = category.icon;
              const percentage = totalLiabilities > 0 ? (category.amount / totalLiabilities) * 100 : 0;
              
              return (
                <div key={category.category} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${category.bgColor}`}>
                        <Icon className={`w-5 h-5 ${category.color}`} />
                      </div>
                      <h4 className="font-medium text-gray-900">{category.category}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">${category.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {/* Detalles de elementos */}
                  {category.accounts && category.accounts.length > 0 && (
                    <div className="ml-10 space-y-1">
                      {category.accounts.map((account) => (
                        <div key={account.id} className="flex justify-between text-sm text-gray-600">
                          <span>{account.name}</span>
                          <span>${Math.abs(account.balance).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {category.items && category.items.length > 0 && (
                    <div className="ml-10 space-y-1">
                      {category.items.slice(0, 3).map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm text-gray-600">
                          <span>{item.name}</span>
                          <span>${item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                      {category.items.length > 3 && (
                        <div className="text-xs text-gray-500">
                          {state.language === 'es' ? `... y ${category.items.length - 3} más` : `... and ${category.items.length - 3} more`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Análisis de Rendimiento */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {state.language === 'es' ? 'Análisis de Rendimiento' : 'Performance Analysis'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rendimiento de Inversiones */}
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h4 className="font-medium text-emerald-900">
                {state.language === 'es' ? 'Rendimiento de Inversiones' : 'Investment Performance'}
              </h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-emerald-700">{state.language === 'es' ? 'Valor actual:' : 'Current value:'}</span>
                <span className="font-semibold text-emerald-900">${investmentAssets.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-emerald-700">{state.language === 'es' ? 'Costo inicial:' : 'Initial cost:'}</span>
                <span className="font-semibold text-emerald-900">${investmentCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-emerald-700">{state.language === 'es' ? 'Ganancia/Pérdida:' : 'Gain/Loss:'}</span>
                <span className={`font-bold ${investmentGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {investmentGainLoss >= 0 ? '+' : ''}${investmentGainLoss.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-emerald-700">{state.language === 'es' ? 'Rendimiento:' : 'Return:'}</span>
                <span className={`font-bold ${investmentGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {investmentCost > 0 ? ((investmentGainLoss / investmentCost) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Rendimiento de Propiedades */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2 mb-3">
              <Home className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-purple-900">
                {state.language === 'es' ? 'Rendimiento de Propiedades' : 'Property Performance'}
              </h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-purple-700">{state.language === 'es' ? 'Valor actual:' : 'Current value:'}</span>
                <span className="font-semibold text-purple-900">${propertyAssets.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-purple-700">{state.language === 'es' ? 'Costo inicial:' : 'Initial cost:'}</span>
                <span className="font-semibold text-purple-900">${propertyCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-purple-700">{state.language === 'es' ? 'Ganancia/Pérdida:' : 'Gain/Loss:'}</span>
                <span className={`font-bold ${propertyGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {propertyGainLoss >= 0 ? '+' : ''}${propertyGainLoss.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-purple-700">{state.language === 'es' ? 'Rendimiento:' : 'Return:'}</span>
                <span className={`font-bold ${propertyGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {propertyCost > 0 ? ((propertyGainLoss / propertyCost) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}