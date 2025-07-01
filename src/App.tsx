import React from 'react';
import { useAuth } from './hooks/useAuth';
import { AppProvider } from './context/AppContext';
import { AuthForm } from './components/Auth/AuthForm';
import { ProfileSetupForm } from './components/Auth/ProfileSetupForm';
import { LoadingScreen } from './components/Auth/LoadingScreen';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { SectionRenderer } from './components/Sections/SectionRenderer';

// Importar utilidades administrativas en desarrollo
if (import.meta.env.DEV) {
  import('./utils/adminUtils');
}

function AppContent() {
  const { user, profile, loading, needsProfileSetup } = useAuth();

  console.log('🔍 App render state:', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    loading, 
    needsProfileSetup 
  });

  // Mostrar loading solo mientras se verifica auth
  if (loading) {
    console.log('⏳ Showing loading screen');
    return <LoadingScreen language="es" />;
  }

  // No hay usuario - mostrar login
  if (!user) {
    console.log('🔐 No user, showing auth form');
    return <AuthForm language="es" />;
  }

  // Usuario sin perfil - mostrar setup
  if (needsProfileSetup || !profile) {
    console.log('👤 User needs profile setup');
    return <ProfileSetupForm language="es" />;
  }

  // Usuario completo - mostrar app
  console.log('✅ User authenticated with profile, showing main app');
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-16">
          <Header />
          <main className="flex-1 p-6 overflow-y-auto">
            <SectionRenderer />
          </main>
        </div>
      </div>
    </AppProvider>
  );
}

function App() {
  return <AppContent />;
}

export default App;