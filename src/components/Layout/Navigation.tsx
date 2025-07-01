import React from 'react';
import { useApp } from '../../context/AppContext';
import { Wallet, TrendingUp, BarChart3, Settings } from 'lucide-react';

const sections = [
  { id: 'A' as const, name: 'Cuentas', icon: Wallet, color: 'blue' },
  { id: 'B' as const, name: 'Inversiones', icon: TrendingUp, color: 'emerald' },
  { id: 'C' as const, name: 'Estadísticas', icon: BarChart3, color: 'purple' },
  { id: 'D' as const, name: 'Configuración', icon: Settings, color: 'gray' },
];

const colorClasses = {
  blue: 'bg-blue-500 text-white border-blue-600',
  emerald: 'bg-emerald-500 text-white border-emerald-600',
  purple: 'bg-purple-500 text-white border-purple-600',
  gray: 'bg-gray-500 text-white border-gray-600',
};

const inactiveColorClasses = {
  blue: 'text-blue-600 hover:bg-blue-50 border-blue-200',
  emerald: 'text-emerald-600 hover:bg-emerald-50 border-emerald-200',
  purple: 'text-purple-600 hover:bg-purple-50 border-purple-200',
  gray: 'text-gray-600 hover:bg-gray-50 border-gray-200',
};

export function Navigation() {
  const { state, navigate } = useApp();
  const { navigation } = state;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:relative md:border-t-0 md:bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-4 gap-2 py-2 md:flex md:space-x-4 md:py-6">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = navigation.section === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => navigate({ section: section.id })}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200
                  md:flex-row md:space-x-2 md:px-6 md:py-3
                  ${isActive 
                    ? colorClasses[section.color] 
                    : `bg-white ${inactiveColorClasses[section.color]}`
                  }
                `}
              >
                <Icon className="w-6 h-6 md:w-5 md:h-5" />
                <span className="text-xs mt-1 md:text-sm md:mt-0 font-medium">
                  {section.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}