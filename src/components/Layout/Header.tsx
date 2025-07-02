import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, Home } from 'lucide-react';

const sectionNames = {
  A: { es: 'Cuentas', en: 'Accounts' },
  B: { es: 'Inversiones', en: 'Investments' },
  C: { es: 'Estadísticas', en: 'Statistics' },
  D: { es: 'Configuración', en: 'Settings' }
};

const subsectionNames = {
  A: [
    { es: 'Cuentas y Presupuestos', en: 'Accounts & Budgets' },
    { es: 'Gastos', en: 'Expenses' },
    { es: 'Deudas Interpersonales', en: 'Personal Debts' }
  ],
  B: [
    { es: 'Activos', en: 'Assets' },
    { es: 'Gráficos', en: 'Charts' },
    { es: 'Deudas y Patrimonio', en: 'Debts & Assets' }
  ],
  C: [
    { es: 'Gráficos', en: 'Charts' },
    { es: 'Estadísticas', en: 'Statistics' },
    { es: 'Patrimonio Neto', en: 'Net Worth' }
  ],
  D: [
    { es: 'General', en: 'General' },
    { es: '', en: '' },
    { es: '', en: '' }
  ]
};

export function Header() {
  const { state, navigate } = useApp();
  const { user, profile } = useAuth();
  const { navigation } = state;

  const canGoBack = navigation.subsection || navigation.subsubsection;

  const handleBack = () => {
    if (navigation.subsubsection) {
      navigate({ section: navigation.section, subsection: navigation.subsection });
    } else if (navigation.subsection) {
      navigate({ section: navigation.section });
    }
  };

  const handleHome = () => {
    navigate({ section: navigation.section });
  };

  const getBreadcrumb = () => {
    const lang = state.language;
    let breadcrumb = sectionNames[navigation.section][lang];
    
    if (navigation.subsection) {
      const subsectionIndex = parseInt(navigation.subsection) - 1;
      const subsectionName = subsectionNames[navigation.section][subsectionIndex]?.[lang];
      if (subsectionName) {
        breadcrumb += ` / ${subsectionName}`;
      }
    }
    
    return breadcrumb;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            {canGoBack && (
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            
            <button
              onClick={handleHome}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="text-sm text-gray-500">
              {getBreadcrumb()}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              Hola, {profile?.username || 'Usuario'}
            </div>
            <div className="text-xs text-gray-500">
              {state.currency}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}