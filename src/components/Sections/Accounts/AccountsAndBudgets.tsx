import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Card } from '../../Common/Card';
import { Button } from '../../Common/Button';
import { EditModal } from '../../Common/EditModal';
import { Plus, Wallet, TrendingUp, TrendingDown, Edit, Info, Shield, X } from 'lucide-react';
import { AppleSelect } from '../../Common/AppleSelect';
import { formatCurrency } from '../../../utils/currencyUtils';

const accountTypes = [
  { value: 'checking', label: 'Cuenta Corriente' },
  { value: 'savings', label: 'Ahorros' },
  { value: 'credit', label: 'Tarjeta de Crédito' }
];

export function AccountsAndBudgets() {
  const { state, addAccount, addBudget, updateAccount, updateBudget, deleteAccount, deleteBudget, getEmergencyFundValue } = useApp();
  const { accounts, budgets } = state;
  
  // Función helper para formatear monedas usando la utilidad centralizada
  const formatCurrencyWithState = (amount: number) => {
    return formatCurrency(amount, {
      language: state.language as 'es' | 'en',
      currency: state.currency
    });
  };
  
  // Obtener el valor del fondo de emergencia
  const emergencyFundValue = getEmergencyFundValue();
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [showEmergencyFundInfo, setShowEmergencyFundInfo] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: '', allocated: 0 });
  const [newAccount, setNewAccount] = useState({ name: '', type: 'checking', balance: 0 });

  const handleAddBudget = () => {
    if (newBudget.category && newBudget.allocated > 0) {
      addBudget({
        category: newBudget.category,
        allocated: newBudget.allocated,
        spent: 0,
        currency: state.currency,
      });
      setNewBudget({ category: '', allocated: 0 });
      setShowAddBudget(false);
    }
  };

  const handleAddAccount = () => {
    if (newAccount.name && newAccount.type) {
      addAccount({
        name: newAccount.name,
        type: newAccount.type as any,
        balance: newAccount.balance,
        currency: state.currency,
      });
      setNewAccount({ name: '', type: 'checking', balance: 0 });
      setShowAddAccount(false);
    }
  };

  const accountEditFields = [
    { key: 'name', label: 'Nombre de la cuenta', type: 'text' as const, required: true },
    { key: 'type', label: 'Tipo de cuenta', type: 'select' as const, options: accountTypes, required: true },
    { key: 'balance', label: 'Saldo', type: 'number' as const, required: true },
  ];

  const budgetEditFields = [
    { key: 'category', label: 'Categoría', type: 'text' as const, required: true },
    { key: 'allocated', label: 'Monto asignado', type: 'number' as const, required: true },
    { key: 'spent', label: 'Monto gastado', type: 'number' as const, required: true },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Cuentas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Mis Cuentas</h2>
          <Button 
            icon={Plus} 
            variant="outline" 
            size="sm"
            onClick={() => setShowAddAccount(true)}
          >
            Agregar Cuenta
          </Button>
        </div>

        {showAddAccount && (
          <Card className="mb-4">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Nueva Cuenta</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Nombre de la cuenta"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <AppleSelect
                  value={newAccount.type}
                  onChange={val => setNewAccount({ ...newAccount, type: val })}
                  options={accountTypes}
                  placeholder="Tipo de cuenta"
                  className="w-full px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Saldo inicial"
                  value={newAccount.balance || ''}
                  onChange={(e) => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) || 0 })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleAddAccount} size="sm">
                  Agregar
                </Button>
                <Button
                  onClick={() => setShowAddAccount(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            // Si es una cuenta de ahorro, mostrar el valor del fondo de emergencia
            const isEmergencyFundAccount = account.type === 'savings';
            const displayValue = isEmergencyFundAccount ? emergencyFundValue : account.balance;
            
            return (
            <Card key={account.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{account.name}</h3>
                      {isEmergencyFundAccount && (
                        <button
                          onClick={() => setShowEmergencyFundInfo(true)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          title={state.language === 'es' 
                            ? 'Información sobre el Fondo de Emergencia'
                            : 'Emergency Fund Information'
                          }
                        >
                          <Info className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 capitalize">
                      {accountTypes.find(t => t.value === account.type)?.label}
                      {isEmergencyFundAccount && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({state.language === 'es' ? 'Solo lectura' : 'Read-only'})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Wallet className="w-6 h-6 text-blue-500" />
                  {!isEmergencyFundAccount && (
                    <button
                      onClick={() => setEditingAccount(account)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <p className={`text-xl font-bold ${displayValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrencyWithState(Math.abs(displayValue))}
                </p>
                {displayValue < 0 && (
                  <p className="text-xs text-red-500">Saldo deudor</p>
                )}
                {isEmergencyFundAccount && (
                  <p className="text-xs text-gray-500 mt-1">
                    {state.language === 'es' ? 'Sincronizado automáticamente' : 'Automatically synced'}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
        </div>
      </div>

      {/* Presupuestos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Presupuestos</h2>
          <Button
            icon={Plus}
            variant="outline"
            size="sm"
            onClick={() => setShowAddBudget(true)}
          >
            Agregar Categoría
          </Button>
        </div>

        {showAddBudget && (
          <Card className="mb-4">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Nueva Categoría</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nombre de la categoría"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Monto asignado"
                  value={newBudget.allocated || ''}
                  onChange={(e) => setNewBudget({ ...newBudget, allocated: parseFloat(e.target.value) || 0 })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleAddBudget} size="sm">
                  Agregar
                </Button>
                <Button
                  onClick={() => setShowAddBudget(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const percentage = (budget.spent / budget.allocated) * 100;
            const remaining = budget.allocated - budget.spent;
            
            return (
              <Card key={budget.id}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{budget.category}</h3>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {formatCurrencyWithState(budget.spent)} / {formatCurrencyWithState(budget.allocated)}
                        </p>
                        <p className={`text-sm ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {remaining >= 0 ? (
                            <><TrendingUp className="w-4 h-4 inline mr-1" />Disponible: {formatCurrencyWithState(remaining)}</>
                          ) : (
                            <><TrendingDown className="w-4 h-4 inline mr-1" />Excedido: {formatCurrencyWithState(Math.abs(remaining))}</>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingBudget(budget)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        percentage <= 75 ? 'bg-green-500' :
                        percentage <= 90 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    {percentage.toFixed(1)}% utilizado
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modales de edición */}
      <EditModal
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        onSave={(data) => updateAccount(editingAccount.id, data)}
        onDelete={() => deleteAccount(editingAccount.id)}
        title="Editar Cuenta"
        data={editingAccount || {}}
        fields={accountEditFields}
      />

      <EditModal
        isOpen={!!editingBudget}
        onClose={() => setEditingBudget(null)}
        onSave={(data) => updateBudget(editingBudget.id, data)}
        onDelete={() => deleteBudget(editingBudget.id)}
        title="Editar Presupuesto"
        data={editingBudget || {}}
        fields={budgetEditFields}
      />

      {/* Modal de información del Fondo de Emergencia */}
      {showEmergencyFundInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {state.language === 'es' ? 'Fondo de Emergencia' : 'Emergency Fund'}
                </h2>
              </div>
              <button
                onClick={() => setShowEmergencyFundInfo(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-900 mb-2">
                  {state.language === 'es' ? '¿Qué es el Fondo de Emergencia?' : 'What is the Emergency Fund?'}
                </h3>
                <p className="text-sm text-red-800">
                  {state.language === 'es' 
                    ? 'El Fondo de Emergencia es dinero que debe estar disponible en liquidez para cubrir gastos imprevistos como emergencias médicas, reparaciones urgentes o pérdida de empleo.'
                    : 'The Emergency Fund is money that should be available in liquidity to cover unexpected expenses such as medical emergencies, urgent repairs, or job loss.'
                  }
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">
                  {state.language === 'es' ? '¿Cómo funciona?' : 'How does it work?'}
                </h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>
                      {state.language === 'es' 
                        ? 'Se calcula automáticamente sumando todas tus cuentas de ahorro'
                        : 'It is automatically calculated by adding all your savings accounts'
                      }
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>
                      {state.language === 'es' 
                        ? 'Se sincroniza con el grupo "Fondo de Emergencia" en la sección de Activos'
                        : 'It syncs with the "Emergency Fund" group in the Assets section'
                      }
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>
                      {state.language === 'es' 
                        ? 'Este valor es de solo lectura y no se puede modificar directamente'
                        : 'This value is read-only and cannot be modified directly'
                      }
                    </span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">
                  {state.language === 'es' ? '¿Cómo modificarlo?' : 'How to modify it?'}
                </h3>
                <p className="text-sm text-green-800">
                  {state.language === 'es' 
                    ? 'Para cambiar el valor del fondo de emergencia, ve a la sección de Activos > Fondo de Emergencia, o modifica tus cuentas de ahorro en esta sección.'
                    : 'To change the emergency fund value, go to Assets section > Emergency Fund, or modify your savings accounts in this section.'
                  }
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowEmergencyFundInfo(false)}
                  variant="outline"
                >
                  {state.language === 'es' ? 'Entendido' : 'Got it'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}