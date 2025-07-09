import React, { useState, useEffect } from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { useAuth } from '../../hooks/useAuth';
import { User, Lock, Mail, Calendar, UserCheck, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PasswordResetService } from '../../services/passwordResetService';

interface AuthFormProps {
  language: 'es' | 'en';
  onRegisteringChange?: (isRegistering: boolean) => void;
}

// Función para mapear errores técnicos a mensajes amigables
function mapAuthError(message: string, language: 'es' | 'en'): string {
  if (!message) return '';
  const msg = message.toLowerCase();
  if (msg.includes('user already registered') || msg.includes('already registered') || msg.includes('already exists') || msg.includes('user_already_exists')) {
    return language === 'es' ? 'Este email ya está registrado.' : 'This email is already registered.';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password') || msg.includes('invalid credentials')) {
    return language === 'es' ? 'Email o contraseña incorrectos.' : 'Incorrect email or password.';
  }
  if (msg.includes('user not found')) {
    return language === 'es' ? 'Usuario no encontrado.' : 'User not found.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
    return language === 'es' ? 'Problema de conexión. Intenta de nuevo.' : 'Connection problem. Please try again.';
  }
  if (msg.includes('password should be at least')) {
    return language === 'es' ? 'La contraseña es demasiado corta.' : 'Password is too short.';
  }
  if (msg.includes('email')) {
    return language === 'es' ? 'Email inválido o ya registrado.' : 'Invalid or already registered email.';
  }
  if (msg.includes('rate limit')) {
    return language === 'es' ? 'Demasiados intentos. Espera un momento.' : 'Too many attempts. Please wait.';
  }
  if (msg.includes('permission')) {
    return language === 'es' ? 'No tienes permisos para esta acción.' : 'You do not have permission for this action.';
  }
  // Mensaje genérico
  return language === 'es' ? 'Ocurrió un error. Intenta de nuevo.' : 'An error occurred. Please try again.';
}

export function AuthForm({ language, onRegisteringChange }: AuthFormProps) {
  const { signIn, signUp, loading, authError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    alias: '',
    age: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cookiesAccepted, setCookiesAccepted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cookiesAccepted') === 'true';
    }
    return false;
  });
  // Estado para recuperación de contraseña
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    // Mostrar mensaje de éxito si viene de la configuración de perfil
    if (typeof window !== 'undefined') {
      const msg = localStorage.getItem('profileSuccessMessage');
      if (msg) {
        setSuccessMessage(msg);
        localStorage.removeItem('profileSuccessMessage');
      }
    }
  }, []);

  // Expresiones regulares y helpers para validación
  const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
  const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
  const aliasMaxLength = 32;

  const validateForm = (fieldToValidate?: string, value?: string) => {
    const newErrors: Record<string, string> = { ...errors };
    const data = { ...formData, ...(fieldToValidate ? { [fieldToValidate]: value } : {}) };
    // Email
    if (!data.email) {
      newErrors.email = language === 'es' ? 'Email es requerido' : 'Email is required';
    } else if (!emailRegex.test(data.email)) {
      newErrors.email = language === 'es' ? 'Email inválido' : 'Invalid email';
    } else {
      delete newErrors.email;
    }
    // Password
    if (!data.password) {
      newErrors.password = language === 'es' ? 'Contraseña es requerida' : 'Password is required';
    } else if (data.password.length < 6) {
      newErrors.password = language === 'es' ? 'Contraseña debe tener al menos 6 caracteres' : 'Password must be at least 6 characters';
    } else if (/\s/.test(data.password)) {
      newErrors.password = language === 'es' ? 'La contraseña no puede tener espacios' : 'Password cannot contain spaces';
    } else {
      delete newErrors.password;
    }
    if (isSignUp) {
      // Username
      if (!data.username) {
        newErrors.username = language === 'es' ? 'Nombre de usuario es requerido' : 'Username is required';
      } else if (!usernameRegex.test(data.username)) {
        newErrors.username = language === 'es' ? 'Solo letras, números y guion bajo. Mínimo 3 caracteres.' : 'Only letters, numbers and underscore. At least 3 characters.';
      } else {
        delete newErrors.username;
      }
      // Alias
      if (!data.alias) {
        newErrors.alias = language === 'es' ? 'Alias es requerido' : 'Alias is required';
      } else if (data.alias.length > aliasMaxLength) {
        newErrors.alias = language === 'es' ? `Alias muy largo (máx. ${aliasMaxLength})` : `Alias too long (max ${aliasMaxLength})`;
      } else {
        delete newErrors.alias;
      }
      // Edad
      const age = parseInt(data.age);
      if (!data.age || isNaN(age) || age < 13 || age > 120) {
        newErrors.age = language === 'es' ? 'Edad debe estar entre 13 y 120 años' : 'Age must be between 13 and 120';
      } else {
        delete newErrors.age;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!validateForm()) return;
    
    // Marcar que estamos registrando si es signup
    if (isSignUp && onRegisteringChange) {
      onRegisteringChange(true);
    }
    
    // Verificar username en Supabase justo antes de registrar
    if (isSignUp) {
      const username = formData.username.trim();
      if (!username || username.length < 3) {
        setErrors(prev => ({ ...prev, username: language === 'es' ? 'Nombre de usuario inválido' : 'Invalid username' }));
        return;
      }
      
      console.log('[DEBUG] Verificando username en Supabase:', username);
      
      // Username permitido para registro
      console.log('[DEBUG] Procediendo con registro para username:', username);
    }
    try {
      let result;
      if (isSignUp) {
        result = await signUp({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          alias: formData.alias,
          age: parseInt(formData.age)
        });
        if (!result.success && (result as any).code === 'user_already_registered') {
          const userExistsMessage = language === 'es' 
            ? 'Este email ya está registrado. Cambiando a inicio de sesión...' 
            : 'This email is already registered. Switching to sign in...';
          setMessage(userExistsMessage);
          setTimeout(() => {
            setIsSignUp(false);
            setFormData(prev => ({ 
              ...prev, 
              password: '', 
              username: '', 
              alias: '', 
              age: '' 
            }));
            setMessage('');
          }, 2000);
          return;
        }
      } else {
        result = await signIn({
          email: formData.email,
          password: formData.password
        });
      }
      if (result.success) {
        setMessage(result.message);
        if (isSignUp) {
          setIsSignUp(false);
          setFormData({ email: formData.email, password: '', username: '', alias: '', age: '' });
        }
        // Limpiar mensaje de éxito de localStorage y del estado tras login exitoso
        if (typeof window !== 'undefined') {
          localStorage.removeItem('profileSuccessMessage');
        }
        setSuccessMessage('');
      } else {
        setMessage(mapAuthError(result.message, language));
      }
      
      // Resetear estado de registro
      if (isSignUp && onRegisteringChange) {
        onRegisteringChange(false);
      }
    } catch (error: any) {
      setMessage(mapAuthError(error?.message, language));
    } finally {
      // Resetear estado de registro en caso de error
      if (isSignUp && onRegisteringChange) {
        onRegisteringChange(false);
      }
    }
  };

  // Validación en tiempo real al escribir
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateForm(field, value);
    setMessage('');
  };

  // Función para enviar email de recuperación
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage('');
    if (!resetEmail || !emailRegex.test(resetEmail)) {
      setResetMessage(language === 'es' ? 'Ingresa un email válido.' : 'Enter a valid email.');
      return;
    }
    setResetLoading(true);
    try {
      const result = await PasswordResetService.requestPasswordReset(resetEmail);
      
      if (result.success) {
        if (result.message.includes('URL:')) {
          // Caso de desarrollo: mostrar URL manualmente
          setResetMessage(language === 'es' 
            ? `Token generado pero no se pudo enviar el email. Copia esta URL: ${result.message.split('URL: ')[1]}` 
            : `Token generated but email could not be sent. Copy this URL: ${result.message.split('URL: ')[1]}`
          );
        } else {
          // Caso normal: email enviado
          setResetMessage(language === 'es' 
            ? result.message 
            : result.message
          );
        }
      } else {
        setResetMessage(language === 'es' 
          ? result.message || 'No se pudo generar el token. Intenta de nuevo.' 
          : result.message || 'Could not generate token. Try again.'
        );
      }
    } catch (err) {
      setResetMessage(language === 'es' ? 'Error inesperado.' : 'Unexpected error.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg" role="img" aria-label="Logo de FinanceApp">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            FinanceApp
          </h1>
          <p className="text-gray-600 mt-2">
            {language === 'es' ? 'Tu gestor financiero personal' : 'Your personal finance manager'}
          </p>
        </div>

        {!cookiesAccepted && (
          <div className="bg-blue-100 border border-blue-300 text-blue-900 rounded-lg px-4 py-3 mb-6 text-center shadow animate-pulse" role="alert" aria-live="polite">
            <p className="mb-2 font-semibold">
              Para iniciar sesión debes aceptar el uso de cookies. Esto es necesario para guardar tu sesión y que la app funcione correctamente.
            </p>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => {
                localStorage.setItem('cookiesAccepted', 'true');
                setCookiesAccepted(true);
              }}
              aria-label={language === 'es' ? 'Aceptar el uso de cookies' : 'Accept cookie usage'}
            >
              Aceptar cookies
            </button>
          </div>
        )}

        {/* Mensaje de advertencia sobre el sistema de restablecimiento de contraseña */}
        <div className="mb-6 p-4 rounded-lg text-center font-semibold border bg-yellow-100 text-yellow-800 border-yellow-300 animate-pulse" role="alert" aria-live="polite">
          {language === 'es'
            ? '⚠️ El sistema de restablecimiento de contraseña está temporalmente inhabilitado. Por favor, guarda tu contraseña actual, ya que no se puede restablecer en este momento.'
            : '⚠️ The password reset system is temporarily disabled. Please keep your current password safe, as it cannot be reset at this time.'}
        </div>

        {/* Mensaje de éxito */}
        {successMessage && (
          <div 
            className="bg-green-100 border border-green-300 text-green-700 text-center rounded-lg px-4 py-3 mb-6 font-semibold animate-pulse"
            role="alert"
            aria-live="polite"
            aria-label={language === 'es' ? 'Mensaje de éxito' : 'Success message'}
          >
            {successMessage}
          </div>
        )}
        {/* Mensaje de error o informativo */}
        {message && (
          <div 
            className={`mb-4 p-3 rounded-lg text-center font-semibold border animate-pulse ${
              message.toLowerCase().includes('exito') || message.toLowerCase().includes('success')
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-red-100 text-red-700 border-red-200'
            }`}
            role="alert"
            aria-live="polite"
            aria-label={message.toLowerCase().includes('exito') || message.toLowerCase().includes('success') ? (language === 'es' ? 'Mensaje de éxito' : 'Success message') : (language === 'es' ? 'Mensaje de error' : 'Error message')}
          >
            {message}
          </div>
        )}

        {cookiesAccepted && (
          <Card className="shadow-xl border-0">
            <div className="p-8">
              {/* Mostrar error global de autenticación */}
              {authError && (
                <div 
                  className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 border border-red-200 text-center font-semibold animate-pulse"
                  role="alert"
                  aria-live="assertive"
                  aria-label={language === 'es' ? 'Error de autenticación' : 'Authentication error'}
                >
                  {authError}
                </div>
              )}
              {/* Tabs */}
              <div className="flex mb-6 bg-gray-100 rounded-lg p-1" role="tablist" aria-label={language === 'es' ? 'Opciones de autenticación' : 'Authentication options'}>
                <button
                  onClick={() => setIsSignUp(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    !isSignUp 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  role="tab"
                  aria-selected={!isSignUp}
                  aria-controls="auth-form"
                  id="tab-signin"
                >
                  {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
                </button>
                <button
                  onClick={() => setIsSignUp(true)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isSignUp 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  role="tab"
                  aria-selected={isSignUp}
                  aria-controls="auth-form"
                  id="tab-signup"
                >
                  {language === 'es' ? 'Registrarse' : 'Sign Up'}
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4" role="form" aria-labelledby={isSignUp ? "tab-signup" : "tab-signin"} id="auth-form">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" aria-hidden="true" />
                    {language === 'es' ? 'Correo Electrónico' : 'Email'}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors focus:outline-none ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={language === 'es' ? 'tu@email.com' : 'your@email.com'}
                    autoComplete="email"
                    onBlur={(e) => validateForm('email', e.target.value)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    aria-required="true"
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p id="email-error" className="text-red-500 text-xs mt-1" role="alert">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" aria-hidden="true" />
                    {language === 'es' ? 'Contraseña' : 'Password'}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors focus:outline-none ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={language === 'es' ? 'Contraseña' : 'Password'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    onBlur={(e) => validateForm('password', e.target.value)}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    aria-required="true"
                    aria-invalid={!!errors.password}
                  />
                  {errors.password && <p id="password-error" className="text-red-500 text-xs mt-1" role="alert">{errors.password}</p>}
                </div>

                {/* Enlace para recuperación de contraseña */}
                {!isSignUp && (
                  <div className="text-right mt-2 mb-4">
                    <button
                      className="text-blue-600 hover:underline text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                      onClick={() => setShowReset(true)}
                      type="button"
                      aria-label={language === 'es' ? 'Recuperar contraseña olvidada' : 'Recover forgotten password'}
                    >
                      {language === 'es' ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}
                    </button>
                  </div>
                )}

                {/* Campos adicionales para registro */}
                {isSignUp && (
                  <>
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-2" aria-hidden="true" />
                        {language === 'es' ? 'Nombre de Usuario' : 'Username'}
                      </label>
                      <input
                        id="username"
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors focus:outline-none ${
                          errors.username ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={language === 'es' ? 'usuario123' : 'user123'}
                        autoComplete="username"
                        onBlur={(e) => validateForm('username', e.target.value)}
                        aria-describedby={errors.username ? "username-error" : undefined}
                        aria-required="true"
                        aria-invalid={!!errors.username}
                      />
                      {errors.username && <p id="username-error" className="text-red-500 text-xs mt-1" role="alert">{errors.username}</p>}
                    </div>

                    <div>
                      <label htmlFor="alias" className="block text-sm font-medium text-gray-700 mb-2">
                        <UserCheck className="w-4 h-4 inline mr-2" aria-hidden="true" />
                        {language === 'es' ? 'Alias (Nombre para mostrar)' : 'Alias (Display Name)'}
                      </label>
                      <input
                        id="alias"
                        type="text"
                        value={formData.alias}
                        onChange={(e) => handleInputChange('alias', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors focus:outline-none ${
                          errors.alias ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={language === 'es' ? 'Juan Pérez' : 'John Doe'}
                        autoComplete="nickname"
                        onBlur={(e) => validateForm('alias', e.target.value)}
                        aria-describedby={errors.alias ? "alias-error" : undefined}
                        aria-required="true"
                        aria-invalid={!!errors.alias}
                      />
                      {errors.alias && <p id="alias-error" className="text-red-500 text-xs mt-1" role="alert">{errors.alias}</p>}
                    </div>

                    <div>
                      <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" aria-hidden="true" />
                        {language === 'es' ? 'Edad' : 'Age'}
                      </label>
                      <input
                        id="age"
                        type="number"
                        min="13"
                        max="120"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors focus:outline-none ${
                          errors.age ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="25"
                        autoComplete="bday"
                        onBlur={(e) => validateForm('age', e.target.value)}
                        aria-describedby={errors.age ? "age-error" : undefined}
                        aria-required="true"
                        aria-invalid={!!errors.age}
                      />
                      {errors.age && <p id="age-error" className="text-red-500 text-xs mt-1" role="alert">{errors.age}</p>}
                    </div>
                  </>
                )}

                {/* Botón de envío */}
                <Button
                  disabled={loading || Object.keys(errors).length > 0 || !cookiesAccepted}
                  className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={loading ? (language === 'es' ? 'Procesando solicitud' : 'Processing request') : isSignUp ? (language === 'es' ? 'Crear nueva cuenta' : 'Create new account') : (language === 'es' ? 'Iniciar sesión en la aplicación' : 'Sign in to application')}
                >
                  {loading ? (language === 'es' ? 'Cargando...' : 'Loading...') : isSignUp ? (language === 'es' ? 'Registrarse' : 'Sign Up') : (language === 'es' ? 'Iniciar Sesión' : 'Sign In')}
                </Button>
              </form>
            </div>
          </Card>
        )}

        {/* Formulario de recuperación de contraseña */}
        {showReset ? (
          <Card className="shadow-xl border-0">
            <div className="p-8">
              <h2 className="text-xl font-bold mb-4 text-blue-700 text-center">
                {language === 'es' ? 'Recuperar Contraseña' : 'Reset Password'}
              </h2>
              <form onSubmit={handleResetPassword} className="space-y-4" role="form" aria-label={language === 'es' ? 'Formulario de recuperación de contraseña' : 'Password reset form'}>
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                    {language === 'es' ? 'Correo Electrónico' : 'Email'}
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors focus:outline-none"
                    placeholder={language === 'es' ? 'Tu email' : 'Your email'}
                    autoComplete="email"
                    aria-describedby="reset-email-error"
                    aria-required="true"
                  />
                  {resetMessage && (
                    <div 
                      id="reset-email-error"
                      className={`p-3 rounded-lg text-sm text-center font-semibold border animate-pulse ${
                        resetMessage.toLowerCase().includes('revisa') || resetMessage.toLowerCase().includes('check')
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-red-100 text-red-700 border-red-200'
                      }`}
                      role="alert"
                      aria-live="polite"
                    >
                      {resetMessage}
                    </div>
                  )}
                </div>
                <Button
                  disabled={resetLoading}
                  className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={resetLoading ? (language === 'es' ? 'Enviando enlace de recuperación' : 'Sending reset link') : (language === 'es' ? 'Enviar enlace de recuperación' : 'Send reset link')}
                >
                  {resetLoading ? (language === 'es' ? 'Enviando...' : 'Sending...') : (language === 'es' ? 'Enviar enlace' : 'Send link')}
                </Button>
              </form>
              <button
                className="mt-4 text-blue-600 hover:underline w-full text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                onClick={() => {
                  setShowReset(false);
                  setResetEmail('');
                  setResetMessage('');
                }}
                aria-label={language === 'es' ? 'Volver al formulario de inicio de sesión' : 'Back to login form'}
              >
                {language === 'es' ? 'Volver al inicio de sesión' : 'Back to login'}
              </button>
            </div>
          </Card>
        ) : (
        <>
        {/* Enlace para recuperación de contraseña */}
        {!isSignUp && (
          <div className="text-right mt-2 mb-4">
            <button
              className="text-blue-600 hover:underline text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              onClick={() => setShowReset(true)}
              type="button"
              aria-label={language === 'es' ? 'Recuperar contraseña olvidada' : 'Recover forgotten password'}
            >
              {language === 'es' ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}
            </button>
          </div>
        )}
        </>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>
            {language === 'es' 
              ? 'Al registrarte, aceptas nuestros términos y condiciones.' 
              : 'By signing up, you agree to our terms and conditions.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}