import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  language: 'es' | 'en';
}

export function LoadingScreen({ language }: LoadingScreenProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          FinanceApp
        </h1>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 min-w-[120px] text-left">
            {language === 'es' ? 'Cargando' : 'Loading'}{dots}
          </p>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          {language === 'es' ? 'Verificando autenticación...' : 'Verifying authentication...'}
        </p>
      </div>
    </div>
  );
}