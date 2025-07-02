import React from 'react';
import { useAuth, setProfileSuccessMessage } from './hooks/useAuth';
import { AppProvider } from './context/AppContext';
import { AuthForm } from './components/Auth/AuthForm';
import { LoadingScreen } from './components/Auth/LoadingScreen';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { SectionRenderer } from './components/Sections/SectionRenderer';

// Importar utilidades administrativas en desarrollo
if (import.meta.env.DEV) {
  import('./utils/adminUtils');
}

console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);

  React.useEffect(() => {
    // Solo hacer logout si el usuario no tiene perfil, no está en proceso de carga, y no está registrándose
    if (user && !profile && !loading && !isRegistering) {
      console.log('[DEBUG] Usuario sin perfil detectado en App, haciendo logout...');
      setLoggingOut(true);
      setProfileSuccessMessage('Tu cuenta fue creada exitosamente. Por favor, inicia sesión.');
      signOut().finally(() => setLoggingOut(false));
    }
  }, [user, profile, loading, signOut, isRegistering]);

  // Manejar visibilidad de la página para evitar problemas de carga
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      setIsActive(!document.hidden);
    };

    const handleFocus = () => {
      setIsActive(true);
    };

    const handleBlur = () => {
      setIsActive(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  console.log('🔍 App render state:', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    loading,
    isActive
  });

  if (loading || loggingOut) {
    console.log('⏳ Showing loading screen');
    return <LoadingScreen language="es" />;
  }

  if (!user) {
    console.log('🔐 No user, showing auth form');
    return <AuthForm language="es" onRegisteringChange={setIsRegistering} />;
  }

  if (!profile) {
    // Nunca mostrar mensaje de error, solo forzar logout
    return null;
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
        {/* Indicador de actividad */}
        {!isActive && (
          <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg z-50 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>Aplicación activa</span>
            </div>
          </div>
        )}
      </div>
    </AppProvider>
  );
}

function App() {
  return <AppContent />;
}

export default App;