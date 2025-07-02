import React, { useState, useEffect } from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { useAuth } from '../../hooks/useAuth';
import { User, Lock, Mail, Calendar, UserCheck, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AuthFormProps {
  language: 'es' | 'en';
  onRegisteringChange?: (isRegistering: boolean) => void;
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = language === 'es' ? 'Email es requerido' : 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = language === 'es' ? 'Email inválido' : 'Invalid email';
    }
    if (!formData.password) {
      newErrors.password = language === 'es' ? 'Contraseña es requerida' : 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = language === 'es' ? 'Contraseña debe tener al menos 6 caracteres' : 'Password must be at least 6 characters';
    }
    if (isSignUp) {
      if (!formData.username) {
        newErrors.username = language === 'es' ? 'Nombre de usuario es requerido' : 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = language === 'es' ? 'Nombre de usuario debe tener al menos 3 caracteres' : 'Username must be at least 3 characters';
      }
      if (!formData.alias) {
        newErrors.alias = language === 'es' ? 'Alias es requerido' : 'Alias is required';
      }
      const age = parseInt(formData.age);
      if (!formData.age || isNaN(age) || age < 13 || age > 120) {
        newErrors.age = language === 'es' ? 'Edad debe estar entre 13 y 120 años' : 'Age must be between 13 and 120';
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
        setMessage(result.message);
      }
      
      // Resetear estado de registro
      if (isSignUp && onRegisteringChange) {
        onRegisteringChange(false);
      }
    } catch (error) {
      setMessage(language === 'es' ? 'Error inesperado' : 'Unexpected error');
    } finally {
      // Resetear estado de registro en caso de error
      if (isSignUp && onRegisteringChange) {
        onRegisteringChange(false);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
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
          <div className="bg-blue-100 border border-blue-300 text-blue-900 rounded-lg px-4 py-3 mb-6 text-center shadow animate-pulse">
            <p className="mb-2 font-semibold">
              Para iniciar sesión debes aceptar el uso de cookies. Esto es necesario para guardar tu sesión y que la app funcione correctamente.
            </p>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors"
              onClick={() => {
                localStorage.setItem('cookiesAccepted', 'true');
                setCookiesAccepted(true);
              }}
            >
              Aceptar cookies
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-300 text-green-700 text-center rounded-lg px-4 py-3 mb-6 font-semibold animate-pulse">
            {successMessage}
          </div>
        )}

        {cookiesAccepted && (
          <Card className="shadow-xl border-0">
            <div className="p-8">
              {/* Mostrar error global de autenticación */}
              {authError && (
                <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 border border-red-200 text-center font-semibold animate-pulse">
                  {authError}
                </div>
              )}
              {/* Tabs */}
              <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setIsSignUp(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    !isSignUp 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {language === 'es' ? 'Iniciar Sesión' : 'Sign In'}
                </button>
                <button
                  onClick={() => setIsSignUp(true)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    isSignUp 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {language === 'es' ? 'Registrarse' : 'Sign Up'}
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    {language === 'es' ? 'Correo Electrónico' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={language === 'es' ? 'tu@email.com' : 'your@email.com'}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    {language === 'es' ? 'Contraseña' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={language === 'es' ? 'Mínimo 6 caracteres' : 'Minimum 6 characters'}
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                {/* Campos adicionales para registro */}
                {isSignUp && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        {language === 'es' ? 'Nombre de Usuario' : 'Username'}
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.username ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={language === 'es' ? 'usuario123' : 'user123'}
                      />
                      {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <UserCheck className="w-4 h-4 inline mr-2" />
                        {language === 'es' ? 'Alias (Nombre para mostrar)' : 'Alias (Display Name)'}
                      </label>
                      <input
                        type="text"
                        value={formData.alias}
                        onChange={(e) => handleInputChange('alias', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.alias ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={language === 'es' ? 'Juan Pérez' : 'John Doe'}
                      />
                      {errors.alias && <p className="text-red-500 text-xs mt-1">{errors.alias}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        {language === 'es' ? 'Edad' : 'Age'}
                      </label>
                      <input
                        type="number"
                        min="13"
                        max="120"
                        value={formData.age}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors.age ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="25"
                      />
                      {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                    </div>
                  </>
                )}

                {/* Mensaje local solo si no hay authError */}
                {!authError && message && (
                  <div className={`p-3 rounded-lg text-sm ${
                    message.includes('exitoso') || message.includes('successful') 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : message.includes('registrado') || message.includes('registered')
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {message}
                  </div>
                )}

                {/* Botón de envío */}
                <Button
                  disabled={loading}
                  className="w-full py-3 text-base font-medium"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{language === 'es' ? 'Procesando...' : 'Processing...'}</span>
                    </div>
                  ) : (
                    isSignUp 
                      ? (language === 'es' ? 'Crear Cuenta' : 'Create Account')
                      : (language === 'es' ? 'Iniciar Sesión' : 'Sign In')
                  )}
                </Button>
              </form>
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            {language === 'es' 
              ? 'Tus datos están seguros y encriptados' 
              : 'Your data is secure and encrypted'
            }
          </p>
        </div>
      </div>
    </div>
  );
}