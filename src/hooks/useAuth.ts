import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  needsProfileSetup: boolean;
}

interface SignUpData {
  email: string;
  password: string;
  username: string;
  alias: string;
  age: number;
}

interface SignInData {
  email: string;
  password: string;
}

interface ProfileSetupData {
  username: string;
  alias: string;
  age: number;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    needsProfileSetup: false
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Utilidad para forzar carga de perfil con reintentos
  const fetchProfileWithRetry = async (userId: string, maxTries = 2, delayMs = 500) => {
    if (isLoadingProfile) {
      console.log('[DEBUG] Ya se está cargando el perfil, saltando llamada duplicada');
      return { profile: null, error: new Error('Carga en progreso') };
    }
    
    setIsLoadingProfile(true);
    console.log(`[DEBUG] fetchProfileWithRetry iniciado para userId=${userId}`);
    let lastError = null;
    
    try {
      for (let i = 0; i < maxTries; i++) {
        console.log(`[DEBUG] Intento ${i + 1}/${maxTries} de cargar perfil`);
        
        try {
          console.log(`[DEBUG] Ejecutando consulta Supabase para intento ${i + 1}`);
          
          // Agregar timeout a la consulta
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout en consulta Supabase')), 1500);
          });
          
          const queryPromise = supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          const { data: profile, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
          
          console.log(`[DEBUG] Intento ${i + 1} de cargar perfil para userId=${userId}:`, { profile, error });
          console.log(`[DEBUG] Consulta completada para intento ${i + 1}`);
          
          if (profile) {
            console.log('[DEBUG] Perfil encontrado, retornando');
            return { profile };
          }
          
          lastError = error;
          
          // Si es error 406 (no rows), no hay perfil, no seguir intentando
          if (error && error.code === 'PGRST116') {
            console.log('[DEBUG] Error 406 detectado - no hay perfil para este usuario');
            return { profile: null, error };
          }
          
          if (i < maxTries - 1) {
            console.log(`[DEBUG] Esperando ${delayMs}ms antes del siguiente intento`);
            await new Promise(res => setTimeout(res, delayMs));
          }
        } catch (error: any) {
          console.error(`[DEBUG] Error en intento ${i + 1}:`, error);
          lastError = error;
          
          if (i < maxTries - 1) {
            console.log(`[DEBUG] Esperando ${delayMs}ms antes del siguiente intento`);
            await new Promise(res => setTimeout(res, delayMs));
          }
        }
      }
      
      console.warn('[DEBUG] No se pudo cargar el perfil tras reintentos:', lastError);
      return { profile: null, error: lastError };
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    setAuthError(null);

    const initAuth = async () => {
      try {
        // Reducir el timeout para que sea más rápido
        timeoutId = setTimeout(() => {
          if (mounted) {
            setAuthState(prev => ({ ...prev, loading: false }));
            console.warn('[DEBUG] Timeout verificando autenticación.');
          }
        }, 3000); // Reducido de 5000 a 3000ms
        
        console.log('[DEBUG] Llamando supabase.auth.getSession()...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('[DEBUG] Resultado de getSession:', { session, sessionError });
        
        if (sessionError) {
          if (mounted) {
            clearTimeout(timeoutId);
            setAuthState({ user: null, profile: null, session: null, loading: false, needsProfileSetup: false });
            setAuthError('Error obteniendo sesión.');
            console.error('[DEBUG] Error obteniendo sesión:', sessionError);
          }
          return;
        }
        
        if (!mounted) return;
        
        if (session?.user) {
          console.log('[DEBUG] Sesión encontrada, intentando cargar perfil...');
          const { profile, error } = await fetchProfileWithRetry(session.user.id);
          clearTimeout(timeoutId);
          
          // Si no hay perfil y es error 406, mantener la sesión para permitir creación de perfil
          if (!profile && error && error.code === 'PGRST116') {
            console.log('[DEBUG] Usuario sin perfil detectado en initAuth, manteniendo sesión...');
            setAuthState({ user: session.user, profile: null, session, loading: false, needsProfileSetup: true });
            return;
          }
          
          if (profile) {
            console.log('[DEBUG] Perfil cargado correctamente:', profile);
            setAuthState({ user: session.user, profile, session, loading: false, needsProfileSetup: false });
          } else {
            console.warn('[DEBUG] No se encontró perfil para el usuario. Error:', error);
            setAuthState({ user: session.user, profile: null, session, loading: false, needsProfileSetup: true });
            if (error && error.code !== 'PGRST116') setAuthError('Error cargando perfil: ' + error.message);
          }
        } else {
          clearTimeout(timeoutId);
          setAuthState({ user: null, profile: null, session: null, loading: false, needsProfileSetup: false });
          console.log('[DEBUG] No hay sesión activa.');
        }
      } catch (error: any) {
        if (mounted) {
          clearTimeout(timeoutId);
          setAuthState({ user: null, profile: null, session: null, loading: false, needsProfileSetup: false });
          setAuthError(error.message || 'Error desconocido en autenticación.');
          console.error('[DEBUG] Error inesperado en initAuth:', error);
        }
      }
    };
    
    initAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      setAuthError(null);
      console.log('[DEBUG] Evento onAuthStateChange:', event, session);
      
      if (event === 'SIGNED_OUT' || !session) {
        setAuthState({ user: null, profile: null, session: null, loading: false, needsProfileSetup: false });
        console.log('[DEBUG] Usuario deslogueado o sin sesión.');
      } else if (session?.user) {
        console.log('[DEBUG] Usuario autenticado, estableciendo loading: true');
        setAuthState(prev => ({ ...prev, loading: true }));
        
        try {
          console.log('[DEBUG] Llamando fetchProfileWithRetry para userId:', session.user.id);
          const { profile, error } = await fetchProfileWithRetry(session.user.id);
          console.log('[DEBUG] Resultado de fetchProfileWithRetry:', { profile, error });
          
          // Si no hay perfil y es error 406, pero estamos en proceso de registro, no hacer logout
          if (!profile && error && error.code === 'PGRST116') {
            console.log('[DEBUG] Usuario sin perfil detectado durante registro, manteniendo sesión...');
            setAuthState({
              user: session.user,
              profile: null,
              session,
              loading: false,
              needsProfileSetup: true
            });
            return;
          }
          
          console.log('[DEBUG] Estableciendo estado final con loading: false');
          setAuthState({
            user: session.user,
            profile: profile || null,
            session,
            loading: false,
            needsProfileSetup: !profile
          });
          console.log('[DEBUG] Estado tras onAuthStateChange:', {
            user: session.user,
            profile,
            session
          });
        } catch (error: any) {
          console.error('[DEBUG] Error inesperado en onAuthStateChange:', error);
          // Asegurar que siempre se establezca loading: false
          setAuthState({
            user: session.user,
            profile: null,
            session,
            loading: false,
            needsProfileSetup: true
          });
          setAuthError('Error cargando perfil: ' + error.message);
        }
      }
    });
    
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);



  const signUp = async (data: SignUpData) => {
    setActionLoading(true);
    setAuthError(null);
    
    // Marcar que estamos en proceso de registro para evitar logout automático
    const isRegistering = true;
    
    try {
      console.log('[DEBUG] Intentando registrar usuario:', data.email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password
      });
      console.log('[DEBUG] Resultado de signUp:', { authData, authError });
      if (authError) {
        const errorMessage = authError.message.toLowerCase();
        if (errorMessage.includes('already registered') || errorMessage.includes('already exists') || authError.code === 'user_already_exists') {
          return { success: false, message: 'User already registered', code: 'user_already_registered' };
        }
        throw authError;
      }
      if (authData.user) {
        let userId = authData.user.id;
        console.log('[DEBUG] Intentando crear perfil para userId:', userId, 'con datos:', { username: data.username, alias: data.alias, age: data.age });
        
        // Crear el perfil inmediatamente
        console.log('[DEBUG] Creando perfil para usuario:', userId);
        
        // Intentar crear el perfil
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({ 
            id: userId, 
            username: data.username, 
            alias: data.alias, 
            age: data.age 
          });
        
        console.log('[DEBUG] Resultado de creación de perfil:', { profileError });
        
        if (profileError) {
          console.error('[DEBUG] Error al crear perfil:', profileError);
          

          
          // Si es error de RLS, mostrar mensaje específico
          if (profileError.code === '42501') {
            console.log('[DEBUG] Error de RLS detectado, mostrando error');
            
            return { 
              success: false, 
              message: 'Error de permisos. Por favor, contacta al administrador.'
            };
          }
          
          // Para otros errores, mostrar mensaje genérico
          console.error('[DEBUG] Error al crear perfil:', profileError);
          setAuthError(profileError?.message || 'Error al crear el perfil');
          return { success: false, message: profileError?.message || 'Error al crear el perfil' };
        }
        
        // Perfil creado exitosamente
        console.log('[DEBUG] Perfil creado exitosamente');
        await reloadProfile();
        return { success: true, message: 'Usuario registrado exitosamente' };
      }
      return { success: false, message: 'Error al crear usuario' };
    } catch (error: any) {
      setAuthError(error.message || 'Error al registrar usuario');
      console.error('[DEBUG] Error inesperado en signUp:', error);
      return { success: false, message: error.message || 'Error al registrar usuario' };
    } finally {
      setActionLoading(false);
    }
  };

  const signIn = async (data: SignInData) => {
    setActionLoading(true);
    setAuthError(null);
    try {
      console.log('[DEBUG] Intentando iniciar sesión:', data.email);
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });
      console.log('[DEBUG] Resultado de signInWithPassword:', { error });
      if (error) throw error;
      await reloadProfile();
      return { success: true, message: 'Inicio de sesión exitoso' };
    } catch (error: any) {
      setAuthError(error.message || 'Error al iniciar sesión');
      console.error('[DEBUG] Error inesperado en signIn:', error);
      return { success: false, message: error.message || 'Error al iniciar sesión' };
    } finally {
      setActionLoading(false);
    }
  };

  const signOut = async () => {
    setActionLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      return { success: true, message: 'Sesión cerrada exitosamente' };
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      return { 
        success: false, 
        message: error.message || 'Error al cerrar sesión' 
      };
    } finally {
      setActionLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'username' | 'alias' | 'age'>>) => {
    setActionLoading(true);
    try {
      if (!authState.user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', authState.user.id);

      if (error) throw error;

      // Actualizar estado local
      setAuthState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...updates } : null
      }));
      
      return { success: true, message: 'Perfil actualizado exitosamente' };
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      return { 
        success: false, 
        message: error.message || 'Error al actualizar perfil' 
      };
    } finally {
      setActionLoading(false);
    }
  };

  const setupProfile = async (data: ProfileSetupData) => {
    setActionLoading(true);
    try {
      if (!authState.user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: authState.user.id,
          username: data.username,
          alias: data.alias,
          age: data.age
        });

      if (error) {
        return {
          success: false,
          message: error.message || 'Error al configurar perfil'
        };
      }

      // Solo si no hay error, actualizar estado local y avanzar
      const newProfile: UserProfile = {
        id: authState.user.id,
        username: data.username,
        alias: data.alias,
        age: data.age,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setAuthState(prev => ({
        ...prev,
        profile: newProfile,
        needsProfileSetup: false
      }));
      
      return { success: true, message: 'Perfil configurado exitosamente' };
    } catch (error: any) {
      console.error('❌ Profile setup error:', error);
      return { 
        success: false, 
        message: error.message || 'Error al configurar perfil' 
      };
    } finally {
      setActionLoading(false);
    }
  };

  // Nueva función para recargar el perfil del usuario
  const reloadProfile = async () => {
    if (!authState.user) return;
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authState.user.id)
      .single();
    if (!error && profile) {
      setAuthState(prev => ({
        ...prev,
        profile: profile,
        needsProfileSetup: false
      }));
    }
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    setupProfile,
    reloadProfile,
    loading: authState.loading || actionLoading,
    isAuthenticated: !!authState.user && !!authState.profile && !authState.needsProfileSetup,
    authError
  };
}

// Añadir función auxiliar para guardar mensaje de éxito en localStorage
export function setProfileSuccessMessage(msg: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('profileSuccessMessage', msg);
  }
}