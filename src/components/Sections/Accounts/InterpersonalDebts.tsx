import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Card } from '../../Common/Card';
import { Button } from '../../Common/Button';
import { EditModal } from '../../Common/EditModal';
import { Plus, ArrowUp, ArrowDown, User, Edit, Check, X } from 'lucide-react';

const debtTypes = [
  { value: 'owe', label: 'Le debo' },
  { value: 'owed', label: 'Me debe' }
];

export function InterpersonalDebts() {
  const { state, addInterpersonalDebt, updateInterpersonalDebt, deleteInterpersonalDebt } = useApp();
  const { interpersonalDebts } = state;
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [newDebt, setNewDebt] = useState({
    name: '',
    amount: 0,
    type: 'owe' as 'owe' | 'owed',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddDebt = () => {
    if (newDebt.name && newDebt.amount > 0 && newDebt.description) {
      addInterpersonalDebt({
        name: newDebt.name,
        amount: newDebt.amount,
        type: newDebt.type,
        description: newDebt.description,
        date: newDebt.date,
        currency: state.currency,
        isSettled: false,
      });
      setNewDebt({
        name: '',
        amount: 0,
        type: 'owe',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddDebt(false);
    }
  };

  const handleToggleSettled = (debtId: string, currentSettled: boolean) => {
    updateInterpersonalDebt(debtId, { isSettled: !currentSettled });
  };

  const activeDebts = interpersonalDebts.filter(debt => !debt.isSettled);
  const settledDebts = interpersonalDebts.filter(debt => debt.isSettled);

  const totalOwed = activeDebts
    .filter(debt => debt.type === 'owe')
    .reduce((sum, debt) => sum + debt.amount, 0);
    
  const totalOwing = activeDebts
    .filter(debt => debt.type === 'owed')
    .reduce((sum, debt) => sum + debt.amount, 0);

  const editFields = [
    { key: 'name', label: state.language === 'es' ? 'Nombre de la persona' : 'Person name', type: 'text' as const, required: true },
    { key: 'amount', label: state.language === 'es' ? 'Monto' : 'Amount', type: 'number' as const, required: true },
    { key: 'type', label: state.language === 'es' ? 'Tipo' : 'Type', type: 'select' as const, options: debtTypes, required: true },
    { key: 'description', label: state.language === 'es' ? 'Descripción' : 'Description', type: 'text' as const, required: true },
    { key: 'date', label: state.language === 'es' ? 'Fecha' : 'Date', type: 'date' as const, required: true },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {state.language === 'es' ? 'Debes' : 'You owe'}
              </p>
              <p className="text-2xl font-bold text-red-600">
                ${totalOwed.toLocaleString()}
              </p>
            </div>
            <ArrowUp className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {state.language === 'es' ? 'Te deben' : 'They owe you'}
              </p>
              <p className="text-2xl font-bold text-green-600">
                ${totalOwing.toLocaleString()}
              </p>
            </div>
            <ArrowDown className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Agregar deuda */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {state.language === 'es' ? 'Deudas Interpersonales' : 'Personal Debts'}
        </h2>
        <Button
          icon={Plus}
          onClick={() => setShowAddDebt(true)}
        >
          {state.language === 'es' ? 'Agregar Deuda' : 'Add Debt'}
        </Button>
      </div>

      {showAddDebt && (
        <Card>
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">
              {state.language === 'es' ? 'Nueva Deuda' : 'New Debt'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder={state.language === 'es' ? 'Nombre de la persona' : 'Person name'}
                value={newDebt.name}
                onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                placeholder={state.language === 'es' ? 'Monto' : 'Amount'}
                value={newDebt.amount || ''}
                onChange={(e) => setNewDebt({ ...newDebt, amount: parseFloat(e.target.value) || 0 })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={newDebt.type}
                onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value as 'owe' | 'owed' })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {debtTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <input
                type="date"
                value={newDebt.date}
                onChange={(e) => setNewDebt({ ...newDebt, date: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder={state.language === 'es' ? 'Descripción' : 'Description'}
                  value={newDebt.description}
                  onChange={(e) => setNewDebt({ ...newDebt, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAddDebt}>
                {state.language === 'es' ? 'Agregar' : 'Add'}
              </Button>
              <Button
                onClick={() => setShowAddDebt(false)}
                variant="ghost"
              >
                {state.language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de deudas activas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {state.language === 'es' ? 'Deudas Activas' : 'Active Debts'}
        </h3>
        {activeDebts.map((debt) => (
          <Card key={debt.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${debt.type === 'owe' ? 'bg-red-100' : 'bg-green-100'}`}>
                  <User className={`w-5 h-5 ${debt.type === 'owe' ? 'text-red-600' : 'text-green-600'}`} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{debt.name}</h3>
                  <p className="text-sm text-gray-600">{debt.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(debt.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className={`font-semibold ${debt.type === 'owe' ? 'text-red-600' : 'text-green-600'}`}>
                    {debt.type === 'owe' ? '-' : '+'}${debt.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {debt.type === 'owe' 
                      ? (state.language === 'es' ? 'Le debes' : 'You owe') 
                      : (state.language === 'es' ? 'Te debe' : 'They owe you')
                    }
                  </p>
                </div>
                <button
                  onClick={() => handleToggleSettled(debt.id, debt.isSettled || false)}
                  className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                  title={state.language === 'es' ? 'Marcar como saldada' : 'Mark as settled'}
                >
                  <Check className="w-4 h-4 text-green-600" />
                </button>
                <button
                  onClick={() => setEditingDebt(debt)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title={state.language === 'es' ? 'Editar deuda' : 'Edit debt'}
                >
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Lista de deudas saldadas */}
      {settledDebts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <span>{state.language === 'es' ? 'Deudas Saldadas' : 'Settled Debts'}</span>
            <span className="text-sm text-gray-500">({settledDebts.length})</span>
          </h3>
          {settledDebts.map((debt) => (
            <Card key={debt.id} className="opacity-75">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-gray-100">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 line-through">{debt.name}</h3>
                    <p className="text-sm text-gray-500 line-through">{debt.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(debt.date).toLocaleDateString()} - {state.language === 'es' ? 'Saldada' : 'Settled'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="font-semibold text-gray-500 line-through">
                      {debt.type === 'owe' ? '-' : '+'}${debt.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 font-medium">
                      ✓ {state.language === 'es' ? 'Saldada' : 'Settled'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSettled(debt.id, debt.isSettled || false)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    title={state.language === 'es' ? 'Marcar como activa' : 'Mark as active'}
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                  <button
                    onClick={() => setEditingDebt(debt)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title={state.language === 'es' ? 'Editar deuda' : 'Edit debt'}
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <EditModal
        isOpen={!!editingDebt}
        onClose={() => setEditingDebt(null)}
        onSave={(data) => updateInterpersonalDebt(editingDebt.id, data)}
        onDelete={() => deleteInterpersonalDebt(editingDebt.id)}
        title={state.language === 'es' ? 'Editar Deuda Interpersonal' : 'Edit Personal Debt'}
        data={editingDebt || {}}
        fields={editFields}
      />
    </div>
  );
}