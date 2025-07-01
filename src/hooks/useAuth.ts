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

  useEffect(() => {
    console.log('[DEBUG] useEffect de autenticación montado');
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        
        // Timeout de seguridad - máximo 5 segundos (aumentado)
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('⏰ Auth timeout reached, stopping loading');
            console.log('[DEBUG] Estado global al timeout:', {
              user: authState.user,
              profile: authState.profile,
              session: authState.session,
              loading: authState.loading,
              needsProfileSetup: authState.needsProfileSetup
            });
            setAuthState(prev => ({ ...prev, loading: false }));
          }
        }, 5000);
        
        // Obtener sesión actual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('[DEBUG] Resultado de getSession:', { session, sessionError });
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          if (mounted) {
            clearTimeout(timeoutId);
            setAuthState({
              user: null,
              profile: null,
              session: null,
              loading: false,
              needsProfileSetup: false
            });
          }
          return;
        }

        if (!mounted) return;

        if (session?.user) {
          console.log('✅ Session found, loading profile...');
          
          try {
            // Cargar perfil con timeout
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            console.log('[DEBUG] Resultado de buscar perfil:', { profile, profileError });
            if (!mounted) return;
            clearTimeout(timeoutId);

            if (profileError && profileError.code !== 'PGRST116') {
              // Error real, no solo "no rows"
              console.error('❌ Profile error:', profileError);
              setAuthState({
                user: session.user,
                profile: null,
                session: session,
                loading: false,
                needsProfileSetup: true
              });
              return;
            }

            if (profile) {
              console.log('✅ Profile loaded successfully');
              setAuthState({
                user: session.user,
                profile: profile,
                session: session,
                loading: false,
                needsProfileSetup: false
              });
            } else {
              console.log('👤 User exists but no profile found, needs setup');
              setAuthState({
                user: session.user,
                profile: null,
                session: session,
                loading: false,
                needsProfileSetup: true
              });
            }
          } catch (profileError) {
            console.error('❌ Profile loading error:', profileError);
            if (mounted) {
              clearTimeout(timeoutId);
              setAuthState({
                user: session.user,
                profile: null,
                session: session,
                loading: false,
                needsProfileSetup: true
              });
            }
          }
        } else {
          console.log('📭 No session found');
          if (mounted) {
            clearTimeout(timeoutId);
            setAuthState({
              user: null,
              profile: null,
              session: null,
              loading: false,
              needsProfileSetup: false
            });
          }
        }
      } catch (error) {
        console.error('❌ Auth init error:', error);
        if (mounted) {
          clearTimeout(timeoutId);
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            needsProfileSetup: false
          });
        }
      }
    };

    initAuth();

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state changed:', event);

        if (event === 'SIGNED_OUT' || !session) {
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            needsProfileSetup: false
          });
        } else if (session?.user) {
          setAuthState(prev => ({ ...prev, loading: true }));
          try {
            // Cargar perfil
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (mounted) {
              setAuthState({
                user: session.user,
                profile: profile || null,
                session: session,
                loading: false,
                needsProfileSetup: !profile
              });
            }
          } catch (error) {
            console.error('❌ Profile loading error in listener:', error);
            if (mounted) {
              setAuthState({
                user: session.user,
                profile: null,
                session: session,
                loading: false,
                needsProfileSetup: true
              });
            }
          }
        }
      }
    );

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (data: SignUpData) => {
    setActionLoading(true);
    try {
      console.log('📝 Signing up user:', data.email);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password
      });

      if (authError) {
        // More flexible error checking for existing users
        const errorMessage = authError.message.toLowerCase();
        if (errorMessage.includes('already registered') || 
            errorMessage.includes('already exists') ||
            authError.code === 'user_already_exists') {
          return { 
            success: false, 
            message: 'User already registered',
            code: 'user_already_registered'
          };
        }
        throw authError;
      }

      if (authData.user) {
        console.log('✅ User created, waiting for user to be available in auth.users...');

        let userId = authData.user.id;
        let maxTries = 5;
        let created = false;
        let lastError = null;

        for (let i = 0; i < maxTries; i++) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: userId,
              username: data.username,
              alias: data.alias,
              age: data.age
            });

          if (!profileError) {
            created = true;
            break;
          } else {
            lastError = profileError;
            // Si el error es de username duplicado, devolver mensaje especial
            if (profileError.message && profileError.message.toLowerCase().includes('duplicate key value') && profileError.message.toLowerCase().includes('username')) {
              return {
                success: false,
                message: 'Ese nombre de usuario ya está ocupado, elige otro.'
              };
            }
            await new Promise(res => setTimeout(res, 500));
          }
        }

        if (!created) {
          console.error('❌ Profile creation error:', lastError);
          return {
            success: false,
            message: lastError?.message || 'Error al crear el perfil'
          };
        }

        console.log('✅ Profile created successfully');
        return { success: true, message: 'Usuario registrado exitosamente' };
      }

      return { success: false, message: 'Error al crear usuario' };
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      return { 
        success: false, 
        message: error.message || 'Error al registrar usuario' 
      };
    } finally {
      setActionLoading(false);
    }
  };

  const signIn = async (data: SignInData) => {
    setActionLoading(true);
    try {
      console.log('🔑 Signing in user:', data.email);

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) throw error;

      // Forzar recarga del perfil después de iniciar sesión
      await reloadProfile();

      return { success: true, message: 'Inicio de sesión exitoso' };
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      return { 
        success: false, 
        message: error.message || 'Error al iniciar sesión' 
      };
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
        // Si el error es de username duplicado, devolver mensaje especial
        if (error.message && error.message.toLowerCase().includes('duplicate key value') && error.message.toLowerCase().includes('username')) {
          return {
            success: false,
            message: 'Ese nombre de usuario ya está ocupado, elige otro.'
          };
        }
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
    loading: authState.loading || actionLoading, // Combinar ambos estados de carga
    isAuthenticated: !!authState.user && !!authState.profile && !authState.needsProfileSetup
  };
}