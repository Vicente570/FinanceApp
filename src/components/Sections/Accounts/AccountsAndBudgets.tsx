import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Card } from '../../Common/Card';
import { Button } from '../../Common/Button';
import { EditModal } from '../../Common/EditModal';
import { Plus, Wallet, TrendingUp, TrendingDown, Edit } from 'lucide-react';

const accountTypes = [
  { value: 'checking', label: 'Cuenta Corriente' },
  { value: 'savings', label: 'Ahorros' },
  { value: 'credit', label: 'Tarjeta de Crédito' }
];

export function AccountsAndBudgets() {
  const { state, addAccount, addBudget, updateAccount, updateBudget, deleteAccount, deleteBudget } = useApp();
  const { accounts, budgets } = state;
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editingBudget, setEditingBudget] = useState<any>(null);
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
                <select
                  value={newAccount.type}
                  onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {accountTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
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
          {accounts.map((account) => (
            <Card key={account.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{account.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{accountTypes.find(t => t.value === account.type)?.label}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Wallet className="w-6 h-6 text-blue-500" />
                  <button
                    onClick={() => setEditingAccount(account)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <p className={`text-xl font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(account.balance).toLocaleString()}
                </p>
                {account.balance < 0 && (
                  <p className="text-xs text-red-500">Saldo deudor</p>
                )}
              </div>
            </Card>
          ))}
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
                          ${budget.spent.toLocaleString()} / ${budget.allocated.toLocaleString()}
                        </p>
                        <p className={`text-sm ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {remaining >= 0 ? (
                            <><TrendingUp className="w-4 h-4 inline mr-1" />Disponible: ${remaining.toLocaleString()}</>
                          ) : (
                            <><TrendingDown className="w-4 h-4 inline mr-1" />Excedido: ${Math.abs(remaining).toLocaleString()}</>
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
    </div>
  );
}