import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Card } from '../../Common/Card';
import { Button } from '../../Common/Button';
import { EditModal } from '../../Common/EditModal';
import { Plus, ShoppingCart, Calendar, DollarSign, Edit } from 'lucide-react';

export function Spending() {
  const { state, addExpense, updateExpense, deleteExpense } = useApp();
  const { expenses, budgets } = state;
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [newExpense, setNewExpense] = useState({
    amount: 0,
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = budgets.map(b => b.category);
  
  const handleAddExpense = () => {
    if (newExpense.amount > 0 && newExpense.category && newExpense.description) {
      addExpense({
        amount: newExpense.amount,
        category: newExpense.category,
        description: newExpense.description,
        date: newExpense.date,
        currency: state.currency,
      });
      setNewExpense({
        amount: 0,
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddExpense(false);
    }
  };

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const expenseEditFields = [
    { key: 'amount', label: state.language === 'es' ? 'Monto' : 'Amount', type: 'number' as const, required: true },
    { key: 'category', label: state.language === 'es' ? 'Categoría' : 'Category', type: 'select' as const, options: categories.map(cat => ({ value: cat, label: cat })), required: true },
    { key: 'description', label: state.language === 'es' ? 'Descripción' : 'Description', type: 'text' as const, required: true },
    { key: 'date', label: state.language === 'es' ? 'Fecha' : 'Date', type: 'date' as const, required: true },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Resumen de gastos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {state.language === 'es' ? 'Gastos Totales' : 'Total Expenses'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalSpent.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {state.language === 'es' ? 'Transacciones' : 'Transactions'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {expenses.length}
              </p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {state.language === 'es' ? 'Promedio por día' : 'Average per day'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${(totalSpent / 30).toFixed(0)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>
      </div>

      {/* Agregar gasto */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {state.language === 'es' ? 'Gastos Recientes' : 'Recent Expenses'}
        </h2>
        <Button
          icon={Plus}
          onClick={() => setShowAddExpense(true)}
        >
          {state.language === 'es' ? 'Agregar Gasto' : 'Add Expense'}
        </Button>
      </div>

      {showAddExpense && (
        <Card>
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">
              {state.language === 'es' ? 'Nuevo Gasto' : 'New Expense'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                placeholder={state.language === 'es' ? 'Monto' : 'Amount'}
                value={newExpense.amount || ''}
                onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{state.language === 'es' ? 'Seleccionar categoría' : 'Select category'}</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder={state.language === 'es' ? 'Descripción' : 'Description'}
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAddExpense}>
                {state.language === 'es' ? 'Agregar Gasto' : 'Add Expense'}
              </Button>
              <Button
                onClick={() => setShowAddExpense(false)}
                variant="ghost"
              >
                {state.language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de gastos */}
      <div className="space-y-4">
        {expenses.slice().reverse().map((expense) => (
          <Card key={expense.id}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <h3 className="font-medium text-gray-900">{expense.description}</h3>
                    <p className="text-sm text-gray-600">{expense.category}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    -${expense.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setEditingExpense(expense)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title={state.language === 'es' ? 'Editar gasto' : 'Edit expense'}
                >
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Gastos por categoría */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {state.language === 'es' ? 'Gastos por Categoría' : 'Expenses by Category'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(expensesByCategory).map(([category, amount]) => (
            <Card key={category}>
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{category}</h4>
                <p className="font-semibold text-gray-900">
                  ${amount.toLocaleString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal de edición */}
      <EditModal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        onSave={(data) => updateExpense(editingExpense.id, data)}
        onDelete={() => deleteExpense(editingExpense.id)}
        title={state.language === 'es' ? 'Editar Gasto' : 'Edit Expense'}
        data={editingExpense || {}}
        fields={expenseEditFields}
      />
    </div>
  );
}