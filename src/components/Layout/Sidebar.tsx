import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Wallet, TrendingUp, BarChart3, Settings, ChevronRight, Save, Sparkles, DollarSign, Target } from 'lucide-react';

const sections = [
  { 
    id: 'A' as const, 
    name: 'Cuentas', 
    nameEn: 'Accounts',
    icon: Wallet, 
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    subsections: [
      { id: '1', name: 'Cuentas y Presupuestos', nameEn: 'Accounts & Budgets' },
      { id: '2', name: 'Gastos', nameEn: 'Expenses' },
      { id: '3', name: 'Deudas Interpersonales', nameEn: 'Personal Debts' }
    ]
  },
  { 
    id: 'B' as const, 
    name: 'Inversiones', 
    nameEn: 'Investments',
    icon: TrendingUp, 
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
    subsections: [
      { id: '1', name: 'Activos', nameEn: 'Assets' },
      { id: '2', name: 'Gráficos', nameEn: 'Charts' },
      { id: '3', name: 'Deudas y Patrimonio', nameEn: 'Debts & Assets' }
    ]
  },
  { 
    id: 'C' as const, 
    name: 'Estadísticas', 
    nameEn: 'Statistics',
    icon: BarChart3, 
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    subsections: [
      { id: '1', name: 'Gráficos', nameEn: 'Charts' },
      { id: '2', name: 'Estadísticas', nameEn: 'Statistics' },
      { id: '3', name: 'Patrimonio Neto', nameEn: 'Net Worth' }
    ]
  },
  { 
    id: 'D' as const, 
    name: 'Configuración', 
    nameEn: 'Settings',
    icon: Settings, 
    color: 'gray',
    gradient: 'from-gray-500 to-gray-600',
    subsections: [
      { id: '1', name: 'General', nameEn: 'General' }
    ]
  },
];

const colorClasses = {
  blue: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25',
  emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25',
  purple: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25',
  gray: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25',
};

const inactiveColorClasses = {
  blue: 'text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:shadow-md transition-all duration-300',
  emerald: 'text-emerald-600 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 hover:shadow-md transition-all duration-300',
  purple: 'text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:shadow-md transition-all duration-300',
  gray: 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:shadow-md transition-all duration-300',
};

const subsectionColorClasses = {
  blue: 'text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-l-4 border-blue-400',
  emerald: 'text-emerald-700 bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border-l-4 border-emerald-400',
  purple: 'text-purple-700 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-l-4 border-purple-400',
  gray: 'text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-l-4 border-gray-400',
};

export function Sidebar() {
  const { state, navigate, saveData } = useApp();
  const { navigation, accounts, assets, expenses } = state;
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    saveData();
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setIsCollapsed(false);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsCollapsed(true);
    }, 300);
    setHoverTimeout(timeout);
  };

  // Calcular estadísticas rápidas
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
  const recentExpenses = expenses.slice(-3).reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <>
      {/* Área de activación invisible en el borde izquierdo */}
      <div 
        className="fixed left-0 top-0 w-3 h-full z-50"
        onMouseEnter={handleMouseEnter}
      />
      
      <div 
        className={`bg-white shadow-2xl border-r border-gray-200 h-screen flex flex-col transition-all duration-500 ease-in-out fixed left-0 top-0 z-40 ${
          isCollapsed ? 'w-12' : 'w-72'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header con logo - SIN efectos de hover/active */}
        <div className={`p-2 border-b border-gray-200 flex items-center transition-all duration-500 ${
          isCollapsed ? 'h-12 justify-center' : 'h-16 justify-center'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center transition-all duration-500 ${
              isCollapsed ? 'w-8 h-8' : 'w-10 h-10'
            }`}>
              <Sparkles className={`text-white transition-all duration-500 ${
                isCollapsed ? 'w-4 h-4' : 'w-5 h-5'
              }`} />
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  FinanceApp
                </h1>
                <p className="text-xs text-gray-500 -mt-1">
                  {state.language === 'es' ? 'Tu gestor financiero' : 'Your finance manager'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contenido scrolleable - incluye estadísticas, botón guardar y navegación */}
        <div className="flex-1 overflow-y-auto">
          {/* Estadísticas rápidas - ahora dentro del área scrolleable */}
          {!isCollapsed && (
            <div className="px-2 py-3 border-b border-gray-100 animate-fade-in">
              <div className="space-y-2">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-md p-2 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-medium text-green-700">
                        {state.language === 'es' ? 'Balance' : 'Balance'}
                      </span>
                    </div>
                    <span className={`text-xs font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${Math.abs(totalBalance).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-2 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">
                        {state.language === 'es' ? 'Inversiones' : 'Investments'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-blue-600">
                      ${totalAssets.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-md p-2 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Target className="w-3 h-3 text-orange-600" />
                      <span className="text-xs font-medium text-orange-700">
                        {state.language === 'es' ? 'Gastos' : 'Expenses'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-orange-600">
                      ${recentExpenses.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón de guardar - ahora dentro del área scrolleable */}
          {!isCollapsed && (
            <div className="px-2 py-3 border-b border-gray-100">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 ${
                  isSaving ? 'animate-pulse' : ''
                }`}
              >
                <Save className={`w-3 h-3 transition-transform duration-300 ${isSaving ? 'animate-spin' : ''}`} />
                <span>
                  {isSaving 
                    ? (state.language === 'es' ? 'Guardando...' : 'Saving...') 
                    : (state.language === 'es' ? 'Guardar Datos' : 'Save Data')
                  }
                </span>
              </button>
            </div>
          )}
          
          {/* Navegación principal */}
          <nav className="p-2 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = navigation.section === section.id;
              const sectionName = state.language === 'es' ? section.name : section.nameEn;
              
              return (
                <div key={section.id} className="space-y-1">
                  <button
                    onClick={() => navigate({ section: section.id })}
                    className={`
                      w-full flex items-center rounded-xl transition-all duration-300 font-medium transform hover:scale-105
                      ${isCollapsed 
                        ? 'justify-center px-2 py-3' 
                        : 'justify-between px-3 py-3'
                      }
                      ${isActive 
                        ? colorClasses[section.color] 
                        : `${inactiveColorClasses[section.color]} hover:shadow-sm`
                      }
                    `}
                    title={isCollapsed ? sectionName : ''}
                  >
                    <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="animate-fade-in">{sectionName}</span>
                      )}
                    </div>
                    {!isCollapsed && isActive && (
                      <ChevronRight className="w-4 h-4 animate-pulse" />
                    )}
                  </button>
                  
                  {/* Subsecciones con animación mejorada - SOLO cuando NO está colapsada */}
                  {isActive && !isCollapsed && (
                    <div className="ml-2 space-y-1 animate-fade-in">
                      {section.subsections.map((subsection) => {
                        const isSubActive = navigation.subsection === subsection.id;
                        const subsectionName = state.language === 'es' ? subsection.name : subsection.nameEn;
                        
                        return (
                          <button
                            key={subsection.id}
                            onClick={() => navigate({ 
                              section: navigation.section, 
                              subsection: subsection.id as any 
                            })}
                            className={`
                              w-full text-left px-4 py-2 rounded-lg text-sm transition-all duration-300 transform hover:scale-105
                              ${isSubActive 
                                ? `${colorClasses[section.color]} shadow-md` 
                                : `${subsectionColorClasses[section.color]}`
                              }
                            `}
                          >
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                isSubActive ? 'bg-white' : `bg-${section.color}-400`
                              }`} />
                              <span>{subsectionName}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Espaciado adicional al final para permitir scroll completo */}
            <div className="h-32"></div>
          </nav>
        </div>
        
        {/* Footer fijo en la parte inferior */}
        {!isCollapsed && (
          <div className="p-3 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-xs font-medium text-gray-700">
                  FinanceApp MVP v1.0
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {state.language === 'es' ? 'Datos guardados localmente' : 'Data saved locally'}
              </p>
              <div className="flex items-center justify-center space-x-1 text-xs text-gray-400">
                <Sparkles className="w-3 h-3" />
                <span>
                  {state.language === 'es' ? 'Hecho con' : 'Made with'} ❤️
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}