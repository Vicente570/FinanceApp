import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Card } from '../../Common/Card';
import { Button } from '../../Common/Button';
import { EditModal } from '../../Common/EditModal';
import { Plus, Home, Building, Landmark, CreditCard, Edit, TrendingUp, TrendingDown } from 'lucide-react';

const debtTypes = [
  { value: 'mortgage', label: 'Hipoteca' },
  { value: 'auto', label: 'Préstamo Auto' },
  { value: 'personal', label: 'Préstamo Personal' },
  { value: 'credit_card', label: 'Tarjeta de Crédito' }
];

const propertyTypes = [
  { value: 'house', label: 'Casa' },
  { value: 'apartment', label: 'Departamento' },
  { value: 'land', label: 'Terreno' },
  { value: 'commercial', label: 'Comercial' },
  { value: 'other', label: 'Otro' }
];

export function DebtsAndAssets() {
  const { state, addDebt, addProperty, updateDebt, updateProperty, deleteDebt, deleteProperty } = useApp();
  const { debts, properties } = state;
  
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  
  const [newDebt, setNewDebt] = useState({
    name: '',
    type: 'personal' as any,
    amount: 0,
    interestRate: 0,
    monthlyPayment: 0
  });
  
  const [newProperty, setNewProperty] = useState({
    name: '',
    type: 'house' as any,
    value: 0,
    purchasePrice: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  const handleAddDebt = () => {
    if (newDebt.name && newDebt.amount > 0 && newDebt.monthlyPayment > 0) {
      addDebt({
        name: newDebt.name,
        type: newDebt.type,
        amount: newDebt.amount,
        interestRate: newDebt.interestRate,
        monthlyPayment: newDebt.monthlyPayment,
        currency: state.currency,
      });
      setNewDebt({
        name: '',
        type: 'personal',
        amount: 0,
        interestRate: 0,
        monthlyPayment: 0
      });
      setShowAddDebt(false);
    }
  };

  const handleAddProperty = () => {
    if (newProperty.name && newProperty.value > 0 && newProperty.purchasePrice > 0) {
      addProperty({
        name: newProperty.name,
        type: newProperty.type,
        value: newProperty.value,
        purchasePrice: newProperty.purchasePrice,
        purchaseDate: newProperty.purchaseDate,
        description: newProperty.description,
        currency: state.currency,
      });
      setNewProperty({
        name: '',
        type: 'house',
        value: 0,
        purchasePrice: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        description: ''
      });
      setShowAddProperty(false);
    }
  };

  const totalDebtAmount = debts.reduce((sum, debt) => sum + debt.amount, 0);
  const totalMonthlyPayments = debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
  const totalPropertyValue = properties.reduce((sum, property) => sum + property.value, 0);
  const totalPropertyCost = properties.reduce((sum, property) => sum + property.purchasePrice, 0);
  const propertyGainLoss = totalPropertyValue - totalPropertyCost;

  const debtEditFields = [
    { key: 'name', label: 'Nombre de la deuda', type: 'text' as const, required: true },
    { key: 'type', label: 'Tipo', type: 'select' as const, options: debtTypes, required: true },
    { key: 'amount', label: 'Monto total', type: 'number' as const, required: true },
    { key: 'interestRate', label: 'Tasa de interés (%)', type: 'number' as const, required: true },
    { key: 'monthlyPayment', label: 'Pago mensual', type: 'number' as const, required: true },
  ];

  const propertyEditFields = [
    { key: 'name', label: 'Nombre de la propiedad', type: 'text' as const, required: true },
    { key: 'type', label: 'Tipo', type: 'select' as const, options: propertyTypes, required: true },
    { key: 'value', label: 'Valor actual', type: 'number' as const, required: true },
    { key: 'purchasePrice', label: 'Precio de compra', type: 'number' as const, required: true },
    { key: 'purchaseDate', label: 'Fecha de compra', type: 'date' as const, required: true },
    { key: 'description', label: 'Descripción', type: 'text' as const },
  ];

  const getDebtIcon = (type: string) => {
    switch (type) {
      case 'mortgage': return Home;
      case 'auto': return Building;
      case 'personal': return Landmark;
      case 'credit_card': return CreditCard;
      default: return Landmark;
    }
  };

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case 'house': return Home;
      case 'apartment': return Building;
      default: return Home;
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-gray-900">
        {state.language === 'es' ? 'Deudas y Patrimonio' : 'Debts & Assets'}
      </h2>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {state.language === 'es' ? 'Deudas Totales' : 'Total Debts'}
              </p>
              <p className="text-2xl font-bold text-red-600">
                ${totalDebtAmount.toLocaleString()}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {state.language === 'es' ? 'Pagos Mensuales' : 'Monthly Payments'}
              </p>
              <p className="text-2xl font-bold text-orange-600">
                ${totalMonthlyPayments.toLocaleString()}
              </p>
            </div>
            <Landmark className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {state.language === 'es' ? 'Valor Propiedades' : 'Property Value'}
              </p>
              <p className="text-2xl font-bold text-green-600">
                ${totalPropertyValue.toLocaleString()}
              </p>
            </div>
            <Home className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {state.language === 'es' ? 'Ganancia Propiedades' : 'Property Gain'}
              </p>
              <p className={`text-2xl font-bold ${propertyGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {propertyGainLoss >= 0 ? '+' : ''}${propertyGainLoss.toLocaleString()}
              </p>
            </div>
            {propertyGainLoss >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-500" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-500" />
            )}
          </div>
        </Card>
      </div>

      {/* Deudas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {state.language === 'es' ? 'Deudas Financieras' : 'Financial Debts'}
          </h3>
          <Button
            icon={Plus}
            onClick={() => setShowAddDebt(true)}
          >
            {state.language === 'es' ? 'Agregar Deuda' : 'Add Debt'}
          </Button>
        </div>

        {showAddDebt && (
          <Card className="mb-4">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">
                {state.language === 'es' ? 'Nueva Deuda' : 'New Debt'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder={state.language === 'es' ? 'Nombre de la deuda' : 'Debt name'}
                  value={newDebt.name}
                  onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <select
                  value={newDebt.type}
                  onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value as any })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  {debtTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder={state.language === 'es' ? 'Monto total' : 'Total amount'}
                  value={newDebt.amount || ''}
                  onChange={(e) => setNewDebt({ ...newDebt, amount: parseFloat(e.target.value) || 0 })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder={state.language === 'es' ? 'Tasa de interés (%)' : 'Interest rate (%)'}
                  value={newDebt.interestRate || ''}
                  onChange={(e) => setNewDebt({ ...newDebt, interestRate: parseFloat(e.target.value) || 0 })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <input
                  type="number"
                  placeholder={state.language === 'es' ? 'Pago mensual' : 'Monthly payment'}
                  value={newDebt.monthlyPayment || ''}
                  onChange={(e) => setNewDebt({ ...newDebt, monthlyPayment: parseFloat(e.target.value) || 0 })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debts.map((debt) => {
            const Icon = getDebtIcon(debt.type);
            const typeLabel = debtTypes.find(t => t.value === debt.type)?.label || debt.type;
            
            return (
              <Card key={debt.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-red-100">
                      <Icon className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{debt.name}</h4>
                      <p className="text-sm text-gray-600">{typeLabel}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingDebt(debt)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      {state.language === 'es' ? 'Monto total:' : 'Total amount:'}
                    </span>
                    <span className="font-semibold text-red-600">
                      ${debt.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      {state.language === 'es' ? 'Pago mensual:' : 'Monthly payment:'}
                    </span>
                    <span className="font-medium text-gray-900">
                      ${debt.monthlyPayment.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      {state.language === 'es' ? 'Tasa de interés:' : 'Interest rate:'}
                    </span>
                    <span className="font-medium text-gray-900">
                      {debt.interestRate}%
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Propiedades */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {state.language === 'es' ? 'Propiedades' : 'Properties'}
          </h3>
          <Button
            icon={Plus}
            onClick={() => setShowAddProperty(true)}
          >
            {state.language === 'es' ? 'Agregar Propiedad' : 'Add Property'}
          </Button>
        </div>

        {showAddProperty && (
          <Card className="mb-4">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">
                {state.language === 'es' ? 'Nueva Propiedad' : 'New Property'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder={state.language === 'es' ? 'Nombre de la propiedad' : 'Property name'}
                  value={newProperty.name}
                  onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <select
                  value={newProperty.type}
                  onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value as any })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder={state.language === 'es' ? 'Valor actual' : 'Current value'}
                  value={newProperty.value || ''}
                  onChange={(e) => setNewProperty({ ...newProperty, value: parseFloat(e.target.value) || 0 })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="number"
                  placeholder={state.language === 'es' ? 'Precio de compra' : 'Purchase price'}
                  value={newProperty.purchasePrice || ''}
                  onChange={(e) => setNewProperty({ ...newProperty, purchasePrice: parseFloat(e.target.value) || 0 })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="date"
                  value={newProperty.purchaseDate}
                  onChange={(e) => setNewProperty({ ...newProperty, purchaseDate: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="text"
                  placeholder={state.language === 'es' ? 'Descripción' : 'Description'}
                  value={newProperty.description}
                  onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleAddProperty}>
                  {state.language === 'es' ? 'Agregar' : 'Add'}
                </Button>
                <Button
                  onClick={() => setShowAddProperty(false)}
                  variant="ghost"
                >
                  {state.language === 'es' ? 'Cancelar' : 'Cancel'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((property) => {
            const Icon = getPropertyIcon(property.type);
            const typeLabel = propertyTypes.find(t => t.value === property.type)?.label || property.type;
            const gainLoss = property.value - property.purchasePrice;
            const gainLossPercentage = property.purchasePrice > 0 ? (gainLoss / property.purchasePrice) * 100 : 0;
            
            return (
              <Card key={property.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-green-100">
                      <Icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{property.name}</h4>
                      <p className="text-sm text-gray-600">{typeLabel}</p>
                      {property.description && (
                        <p className="text-xs text-gray-500">{property.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingProperty(property)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      {state.language === 'es' ? 'Valor actual:' : 'Current value:'}
                    </span>
                    <span className="font-semibold text-green-600">
                      ${property.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      {state.language === 'es' ? 'Precio compra:' : 'Purchase price:'}
                    </span>
                    <span className="font-medium text-gray-900">
                      ${property.purchasePrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      {state.language === 'es' ? 'Ganancia/Pérdida:' : 'Gain/Loss:'}
                    </span>
                    <div className="text-right">
                      <span className={`font-medium ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {gainLoss >= 0 ? '+' : ''}${gainLoss.toLocaleString()}
                      </span>
                      <span className={`text-xs ml-2 ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ({gainLoss >= 0 ? '+' : ''}{gainLossPercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      {state.language === 'es' ? 'Fecha compra:' : 'Purchase date:'}
                    </span>
                    <span className="text-sm text-gray-900">
                      {new Date(property.purchaseDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modales de edición */}
      <EditModal
        isOpen={!!editingDebt}
        onClose={() => setEditingDebt(null)}
        onSave={(data) => updateDebt(editingDebt.id, data)}
        onDelete={() => deleteDebt(editingDebt.id)}
        title={state.language === 'es' ? 'Editar Deuda' : 'Edit Debt'}
        data={editingDebt || {}}
        fields={debtEditFields}
      />

      <EditModal
        isOpen={!!editingProperty}
        onClose={() => setEditingProperty(null)}
        onSave={(data) => updateProperty(editingProperty.id, data)}
        onDelete={() => deleteProperty(editingProperty.id)}
        title={state.language === 'es' ? 'Editar Propiedad' : 'Edit Property'}
        data={editingProperty || {}}
        fields={propertyEditFields}
      />
    </div>
  );
}