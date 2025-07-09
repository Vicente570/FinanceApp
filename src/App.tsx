import React from 'react';
import { useAuth, setProfileSuccessMessage } from './hooks/useAuth';
import { AppProvider } from './context/AppContext';
import { AuthForm } from './components/Auth/AuthForm';
import { LoadingScreen } from './components/Auth/LoadingScreen';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { SectionRenderer } from './components/Sections/SectionRenderer';
import { ProfileSetupForm } from './components/Auth/ProfileSetupForm';
import { ResetPasswordForm } from './components/Auth/ResetPasswordForm';

// Importar utilidades administrativas en desarrollo
if (import.meta.env.DEV) {
  import('./utils/adminUtils');
}

console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);

function AppContent() {
  const { user, profile, loading, signOut, needsProfileSetup } = useAuth();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);

  // Verificar si estamos en la página de reset-password
  const isResetPasswordPage = window.location.pathname === '/reset-password' || 
                             window.location.search.includes('token=');

  // Eliminar el useEffect que hace signOut automático

  // Manejar visibilidad de la página para evitar problemas de carga
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsActive(isVisible);
      
      // Si la página se vuelve visible y tenemos usuario pero no perfil, 
      // intentar recargar el perfil en lugar de hacer logout
      if (isVisible && user && !profile && !loading) {
        console.log('[DEBUG] Página vuelve visible, verificando sesión...');
        // La sesión se verificará automáticamente por onAuthStateChange
      }
    };
    
    const handleFocus = () => {
      setIsActive(true);
    };
    
    const handleBlur = () => {
      setIsActive(false);
    };
    
    // Agregar listener para cuando la página se vuelve visible
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [user, profile, loading]);

  console.log('🔍 App render state:', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    loading,
    isActive,
    needsProfileSetup,
    isResetPasswordPage
  });

  // Si estamos en la página de reset-password, mostrar el formulario
  if (isResetPasswordPage) {
    console.log('🔑 Showing reset password form');
    return <ResetPasswordForm language="es" />;
  }

  // Si hay un usuario autenticado pero no tenemos perfil aún, mostrar loading
  // Esto evita el "flash" del formulario de login durante cambios de pestaña
  if (user && !profile && !needsProfileSetup) {
    console.log('⏳ User authenticated but profile not loaded yet, showing loading screen');
    return <LoadingScreen language="es" />;
  }

  if (loading || loggingOut) {
    console.log('⏳ Showing loading screen');
    return <LoadingScreen language="es" />;
  }

  if (!user) {
    console.log('🔐 No user, showing auth form');
    return <AuthForm language="es" onRegisteringChange={setIsRegistering} />;
  }

  if (needsProfileSetup) {
    console.log('👤 User needs profile setup, showing ProfileSetupForm');
    // Mostrar el formulario de configuración de perfil si el usuario está autenticado pero no tiene perfil
    return <ProfileSetupForm language="es" />;
  }

  if (!profile) {
    console.log('❌ No profile and no setup needed, showing nothing');
    // Si por alguna razón no hay perfil y tampoco se requiere setup, no mostrar nada
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