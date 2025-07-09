import React, { useState, useEffect } from 'react';
import { Card } from '../Common/Card';
import { Button } from '../Common/Button';
import { useAuth } from '../../hooks/useAuth';
import { User, UserCheck, Calendar, Sparkles, Save } from 'lucide-react';

interface ProfileSetupFormProps {
  language: 'es' | 'en';
}

export function ProfileSetupForm({ language }: ProfileSetupFormProps) {
  const { setupProfile, loading, profile, signOut, reloadProfile, needsProfileSetup } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    alias: '',
    age: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && needsProfileSetup === false) {
      window.location.href = '/';
    }
  }, [loading, needsProfileSetup]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) return;

    try {
      const result = await setupProfile({
        username: formData.username,
        alias: formData.alias,
        age: parseInt(formData.age)
      });

      if (result.success) {
        // Guardar mensaje en localStorage para mostrarlo en el login
        if (typeof window !== 'undefined') {
          localStorage.setItem('profileSuccessMessage', language === 'es' ? 'Perfil configurado exitosamente' : 'Profile set up successfully');
          await signOut();
          window.location.href = '/';
        }
        return;
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage(language === 'es' ? 'Error inesperado' : 'Unexpected error');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
            {language === 'es' ? 'Configurar Perfil' : 'Setup Profile'}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === 'es' 
              ? 'Completa tu perfil para continuar' 
              : 'Complete your profile to continue'
            }
          </p>
          <Button
            className="mt-6 mb-4 w-full py-3 text-base font-bold border-2 border-blue-500 text-blue-700 bg-white hover:bg-blue-50 shadow"
            variant="outline"
            onClick={async () => {
              await signOut();
              window.location.reload();
            }}
            icon={User}
          >
            {language === 'es' ? 'Volver al inicio de sesión' : 'Back to Login'}
          </Button>
        </div>

        <Card className="shadow-xl border-0">
          <div className="p-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">
                    {language === 'es' ? 'Perfil Incompleto' : 'Incomplete Profile'}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {language === 'es' 
                      ? 'Necesitamos algunos datos adicionales para configurar tu cuenta.'
                      : 'We need some additional information to set up your account.'
                    }
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
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

              {/* Alias */}
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
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'es' 
                    ? 'Este nombre aparecerá en tu perfil y configuración'
                    : 'This name will appear in your profile and settings'
                  }
                </p>
              </div>

              {/* Age */}
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

              {/* Mensaje */}
              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.includes('exitoso') || message.includes('successfully') 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              {/* Botón de envío */}
              <Button
                disabled={loading}
                className="w-full py-3 text-base font-medium"
                icon={Save}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{language === 'es' ? 'Configurando...' : 'Setting up...'}</span>
                  </div>
                ) : (
                  language === 'es' ? 'Completar Perfil' : 'Complete Profile'
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                {language === 'es' ? '¿Por qué necesitamos esta información?' : 'Why do we need this information?'}
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {language === 'es' ? 'Personalizar tu experiencia' : 'Personalize your experience'}</li>
                <li>• {language === 'es' ? 'Identificarte en la aplicación' : 'Identify you in the app'}</li>
                <li>• {language === 'es' ? 'Guardar tus datos de forma segura' : 'Save your data securely'}</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>
            {language === 'es' 
              ? 'Podrás cambiar esta información más tarde en configuración' 
              : 'You can change this information later in settings'
            }
          </p>
        </div>
      </div>
    </div>
  );
}