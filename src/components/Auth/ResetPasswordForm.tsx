import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { PasswordResetService } from '../../services/passwordResetService';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

interface ResetPasswordFormProps {
  language: 'es' | 'en';
}

export function ResetPasswordForm({ language }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    console.log('[DEBUG] ResetPasswordForm montado');
    console.log('[DEBUG] URL completa:', window.location.href);
    
    // Verificar si hay un token en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    console.log('[DEBUG] Token extraído:', token);
    
    if (!token) {
      setMessage(language === 'es' 
        ? 'Enlace inválido. Solicita un nuevo enlace de recuperación.' 
        : 'Invalid link. Please request a new recovery link.'
      );
      return;
    }

    // Verificar el token usando nuestro servicio personalizado
    const verifyToken = async () => {
      try {
        console.log('[DEBUG] Verificando token personalizado:', token);
        const result = await PasswordResetService.verifyToken(token);
        
        if (result.success) {
          console.log('[DEBUG] Token válido para email:', result.email);
          // El token es válido, el usuario puede cambiar la contraseña
        } else {
          console.error('[DEBUG] Token inválido:', result.message);
          setMessage(language === 'es' 
            ? result.message || 'Token inválido o expirado. Solicita un nuevo enlace.' 
            : result.message || 'Invalid or expired token. Please request a new link.'
          );
        }
      } catch (err) {
        console.error('[DEBUG] Error verificando token:', err);
        setMessage(language === 'es' 
          ? 'Error inesperado al verificar el token.' 
          : 'Unexpected error verifying token.'
        );
      }
    };
    
    verifyToken();
  }, [language]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = language === 'es' ? 'Contraseña es requerida' : 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = language === 'es' ? 'Contraseña debe tener al menos 6 caracteres' : 'Password must be at least 6 characters';
    } else if (/\s/.test(password)) {
      newErrors.password = language === 'es' ? 'La contraseña no puede tener espacios' : 'Password cannot contain spaces';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = language === 'es' ? 'Confirma tu contraseña' : 'Confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) return;

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setMessage(language === 'es' 
        ? 'Token no encontrado. Solicita un nuevo enlace de recuperación.' 
        : 'Token not found. Please request a new recovery link.'
      );
      return;
    }

    setLoading(true);
    try {
      console.log('[DEBUG] Actualizando contraseña con token:', token);
      
      // Usar nuestro servicio personalizado para actualizar la contraseña
      const result = await PasswordResetService.resetPassword(token, password);

      if (result.success) {
        console.log('[DEBUG] Contraseña actualizada exitosamente');
        setSuccess(true);
        setMessage(language === 'es' 
          ? '¡Contraseña actualizada exitosamente! Redirigiendo al inicio de sesión...' 
          : 'Password updated successfully! Redirecting to login...'
        );
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        console.error('[DEBUG] Error al actualizar contraseña:', result.message);
        setMessage(language === 'es' 
          ? `Error: ${result.message || 'No se pudo actualizar la contraseña'}` 
          : `Error: ${result.message || 'Could not update password'}`
        );
      }
    } catch (err: any) {
      console.error('[DEBUG] Excepción al actualizar contraseña:', err);
      setMessage(language === 'es' 
        ? `Error inesperado: ${err?.message || 'Error desconocido'}` 
        : `Unexpected error: ${err?.message || 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'password') {
      setPassword(value);
    } else if (field === 'confirmPassword') {
      setConfirmPassword(value);
    }
    
    // Limpiar error del campo cuando el usuario empiece a escribir
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
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {language === 'es' ? 'Nueva Contraseña' : 'New Password'}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === 'es' 
              ? 'Ingresa tu nueva contraseña' 
              : 'Enter your new password'
            }
          </p>
        </div>

        {/* Mensaje de advertencia */}
        <div className="mb-6 p-4 rounded-lg text-center font-semibold border bg-yellow-100 text-yellow-800 border-yellow-300 animate-pulse" role="alert" aria-live="polite">
          {language === 'es'
            ? '⚠️ El sistema de restablecimiento de contraseña está temporalmente inhabilitado. Por favor, guarda tu contraseña actual, ya que no se puede restablecer en este momento.'
            : '⚠️ The password reset system is temporarily disabled. Please keep your current password safe, as it cannot be reset at this time.'}
        </div>

        {/* Mensaje de éxito/error */}
        {message && (
          <div 
            className={`mb-6 p-4 rounded-lg text-center font-semibold border animate-pulse ${
              success 
                ? 'bg-green-100 text-green-700 border-green-200' 
                : 'bg-red-100 text-red-700 border-red-200'
            }`}
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-center justify-center space-x-2">
              {success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message}</span>
            </div>
          </div>
        )}

        <Card className="shadow-xl border-0">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nueva contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  {language === 'es' ? 'Nueva Contraseña' : 'New Password'}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors focus:outline-none ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={language === 'es' ? 'Nueva contraseña' : 'New password'}
                    autoComplete="new-password"
                    aria-describedby={errors.password ? "password-error" : undefined}
                    aria-required="true"
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                    aria-label={showPassword ? (language === 'es' ? 'Ocultar contraseña' : 'Hide password') : (language === 'es' ? 'Mostrar contraseña' : 'Show password')}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
                {errors.password && <p id="password-error" className="text-red-500 text-xs mt-1" role="alert">{errors.password}</p>}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  {language === 'es' ? 'Confirmar Contraseña' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors focus:outline-none ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={language === 'es' ? 'Confirma tu contraseña' : 'Confirm your password'}
                    autoComplete="new-password"
                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                    aria-required="true"
                    aria-invalid={!!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                    aria-label={showConfirmPassword ? (language === 'es' ? 'Ocultar contraseña' : 'Hide password') : (language === 'es' ? 'Mostrar contraseña' : 'Show password')}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
                {errors.confirmPassword && <p id="confirmPassword-error" className="text-red-500 text-xs mt-1" role="alert">{errors.confirmPassword}</p>}
              </div>

              {/* Botón de envío */}
              <Button
                disabled={loading || success}
                className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={loading ? (language === 'es' ? 'Actualizando contraseña' : 'Updating password') : (language === 'es' ? 'Actualizar contraseña' : 'Update password')}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{language === 'es' ? 'Actualizando...' : 'Updating...'}</span>
                  </div>
                ) : (
                  language === 'es' ? 'Actualizar Contraseña' : 'Update Password'
                )}
              </Button>
            </form>

            {/* Enlaces de navegación */}
            <div className="mt-6 text-center space-y-2">
              <button
                onClick={() => window.location.href = '/'}
                className="text-blue-600 hover:underline text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded block w-full"
                aria-label={language === 'es' ? 'Volver al inicio de sesión' : 'Back to login'}
              >
                {language === 'es' ? '← Volver al inicio de sesión' : '← Back to login'}
              </button>
              
              {/* Mostrar botón para solicitar nuevo enlace si el token expiró */}
              {message && (message.includes('expirado') || message.includes('expired') || message.includes('inválido') || message.includes('invalid')) && (
                <button
                  onClick={() => window.location.href = '/'}
                  className="text-green-600 hover:underline text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded block w-full"
                  aria-label={language === 'es' ? 'Solicitar nuevo enlace de recuperación' : 'Request new recovery link'}
                >
                  {language === 'es' ? '🔄 Solicitar nuevo enlace' : '🔄 Request new link'}
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 