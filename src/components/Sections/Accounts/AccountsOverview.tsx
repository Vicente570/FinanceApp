import React from 'react';
import { useApp } from '../../../context/AppContext';
import { Card } from '../../Common/Card';
import { Button } from '../../Common/Button';
import { Wallet, CreditCard, PiggyBank, Plus } from 'lucide-react';

export function AccountsOverview() {
  const { state, navigate } = useApp();
  const { accounts, budgets, expenses } = state;

  const subsections = [
    { 
      id: '1', 
      name: state.language === 'es' ? 'Cuentas y Presupuestos' : 'Accounts & Budgets', 
      icon: Wallet, 
      description: state.language === 'es' ? 'Gestiona tus cuentas y presupuestos' : 'Manage your accounts and budgets'
    },
    { 
      id: '2', 
      name: state.language === 'es' ? 'Gastos' : 'Expenses', 
      icon: CreditCard, 
      description: state.language === 'es' ? 'Registra y categoriza gastos' : 'Record and categorize expenses'
    },
    { 
      id: '3', 
      name: state.language === 'es' ? 'Deudas Interpersonales' : 'Personal Debts', 
      icon: PiggyBank, 
      description: state.language === 'es' ? 'Gestiona deudas con personas' : 'Manage debts with people'
    },
  ];

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.allocated, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);

  return (
    <div className="space-y-6 pb-24">
      {/* Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {state.language === 'es' ? 'Balance Total' : 'Total Balance'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalBalance.toLocaleString()}
              </p>
            </div>
            <Wallet className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {state.language === 'es' ? 'Presupuesto Total' : 'Total Budget'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalBudget.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {state.language === 'es' ? 'Gastado: ' : 'Spent: '}${totalSpent.toLocaleString()}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {state.language === 'es' ? 'Gastos este mes' : 'This month expenses'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ${expenses.slice(0, 5).reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
              </p>
            </div>
            <PiggyBank className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Botones de subsecciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subsections.map((subsection) => {
          const Icon = subsection.icon;
          return (
            <Card
              key={subsection.id}
              hover
              onClick={() => navigate({ section: 'A', subsection: subsection.id as any })}
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{subsection.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{subsection.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}