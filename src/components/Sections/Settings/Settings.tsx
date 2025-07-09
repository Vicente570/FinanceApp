import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../hooks/useAuth';
import { Card } from '../../Common/Card';
import { Button } from '../../Common/Button';
import { Globe, Palette, DollarSign, RefreshCw, TrendingUp, TrendingDown, Eye, EyeOff, User, UserCheck, Calendar, LogOut, Save, Settings as SettingsIcon } from 'lucide-react';
import { exchangeRateApiService, ExchangeRate } from '../../../services/exchangeRateApi';
import { supabase } from '../../../lib/supabase';
import { AppleSelect } from '../../Common/AppleSelect';

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', flag: '🇨🇴' }
];

const themes = [
  { value: 'light', label: 'Claro', labelEn: 'Light' },
  { value: 'dark', label: 'Oscuro', labelEn: 'Dark' },
  { value: 'auto', label: 'Automático', labelEn: 'Auto' }
];

const languages = [
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'en', label: 'English', flag: '🇺🇸' }
];

export function Settings() {
  const { state, updateSettings, loadData, resetAppData, navigate } = useApp();
  const { profile, updateProfile, signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'profile'>('general');
  
  // Determinar la pestaña activa basada en la navegación
  React.useEffect(() => {
    if (state.navigation.subsection === '2') {
      setActiveTab('profile');
    } else {
      setActiveTab('general');
    }
  }, [state.navigation.subsection]);
  const [showExchangeRates, setShowExchangeRates] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    username: profile?.username || '',
    alias: profile?.alias || '',
    age: profile?.age || 18
  });
  const [profileMessage, setProfileMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const currentCurrency = currencies.find(c => c.code === state.currency) || currencies[0];

  const loadExchangeRates = async () => {
    setIsLoadingRates(true);
    try {
      const rates = await exchangeRateApiService.getExchangeRates(state.currency);
      setExchangeRates(rates);
      setLastUpdated(new Date().toLocaleString(state.language === 'es' ? 'es-ES' : 'en-US'));
    } catch (error) {
      console.error('Error loading exchange rates:', error);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    updateSettings({ currency: newCurrency });
    
    // Si están mostrando tipos de cambio, recargar con la nueva moneda base
    if (showExchangeRates) {
      setIsLoadingRates(true);
      try {
        const rates = await exchangeRateApiService.getExchangeRates(newCurrency);
        setExchangeRates(rates);
        setLastUpdated(new Date().toLocaleString(state.language === 'es' ? 'es-ES' : 'en-US'));
      } catch (error) {
        console.error('Error loading exchange rates:', error);
      } finally {
        setIsLoadingRates(false);
      }
    }
  };

  const toggleExchangeRates = () => {
    if (!showExchangeRates) {
      loadExchangeRates();
    }
    setShowExchangeRates(!showExchangeRates);
  };

  const handleUpdateProfile = async () => {
    const result = await updateProfile(profileData);
    setProfileMessage(result.message);
    if (result.success) {
      setIsEditingProfile(false);
    }
    setTimeout(() => setProfileMessage(''), 3000);
  };

  const handleSignOut = async () => {
    if (window.confirm(state.language === 'es' ? '¿Estás seguro de que quieres cerrar sesión?' : 'Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(state.language === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 4
    }).format(amount);
  };

  // Función para restaurar datos de fábrica
  const handleFactoryReset = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      state.language === 'es'
        ? '¿Estás seguro de que quieres borrar todos tus datos? Esta acción no se puede deshacer.'
        : 'Are you sure you want to delete all your data? This action cannot be undone.'
    );
    if (!confirmed) return;
    
    try {
      // Usar la función mejorada resetAppData que limpia tanto local como Supabase
      await resetAppData();
      setResetMessage(state.language === 'es' ? '¡Datos restaurados a fábrica!' : 'Data reset to factory!');
      setTimeout(() => setResetMessage(''), 3000);
    } catch (err) {
      setResetMessage(state.language === 'es' ? 'Error al restaurar datos.' : 'Error resetting data.');
      setTimeout(() => setResetMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-gray-900">
        {state.language === 'es' ? 'Configuración' : 'Settings'}
      </h2>



      {/* Contenido de la pestaña General */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Configuración de Moneda */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <DollarSign className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {state.language === 'es' ? 'Moneda Principal' : 'Primary Currency'}
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {state.language === 'es' ? 'Seleccionar moneda base' : 'Select base currency'}
                </label>
                <AppleSelect
                  value={state.currency}
                  onChange={handleCurrencyChange}
                  options={currencies.map(currency => ({
                    value: currency.code,
                    label: `${currency.flag} ${currency.code} - ${currency.name}`
                  }))}
                  placeholder={state.language === 'es' ? 'Seleccionar moneda' : 'Select currency'}
                  className="w-full"
                />
              </div>

              {/* Botón para ver tipos de cambio */}
              <div className="flex justify-between items-center">
                <Button
                  icon={showExchangeRates ? EyeOff : Eye}
                  variant="outline"
                  onClick={toggleExchangeRates}
                  disabled={isLoadingRates}
                >
                  {isLoadingRates 
                    ? (state.language === 'es' ? 'Cargando...' : 'Loading...')
                    : showExchangeRates 
                    ? (state.language === 'es' ? 'Ocultar Tipos de Cambio' : 'Hide Exchange Rates')
                    : (state.language === 'es' ? 'Ver Tipos de Cambio' : 'View Exchange Rates')
                  }
                </Button>
                
                {showExchangeRates && (
                  <Button
                    icon={RefreshCw}
                    variant="ghost"
                    size="sm"
                    onClick={loadExchangeRates}
                    disabled={isLoadingRates}
                    className={isLoadingRates ? 'animate-pulse' : ''}
                  >
                    {state.language === 'es' ? 'Actualizar' : 'Refresh'}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Panel de Tipos de Cambio */}
          {showExchangeRates && (
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {state.language === 'es' ? 'Tipos de Cambio Actuales' : 'Current Exchange Rates'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {state.language === 'es' ? 'Base:' : 'Base:'} 1 {currentCurrency.code}
                    </p>
                  </div>
                </div>
                {lastUpdated && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {state.language === 'es' ? 'Última actualización:' : 'Last updated:'}
                    </p>
                    <p className="text-xs text-gray-600 font-medium">{lastUpdated}</p>
                  </div>
                )}
              </div>

              {isLoadingRates ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  <span className="ml-3 text-gray-700">
                    {state.language === 'es' ? 'Cargando tipos de cambio...' : 'Loading exchange rates...'}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exchangeRates.map((rate) => (
                    <div
                      key={rate.currency}
                      className="bg-gray-50 rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{rate.flag}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{rate.currency}</p>
                            <p className="text-xs text-gray-600">{rate.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatCurrency(rate.rate, rate.currency)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center space-x-1 ${
                          rate.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {rate.change >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span className="text-xs font-medium">
                            {rate.change >= 0 ? '+' : ''}{rate.changePercent.toFixed(2)}%
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {rate.change >= 0 ? '+' : ''}{formatCurrency(Math.abs(rate.change), rate.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Configuración de Idioma */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {state.language === 'es' ? 'Idioma' : 'Language'}
              </h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {state.language === 'es' ? 'Seleccionar idioma' : 'Select language'}
              </label>
              <AppleSelect
                value={state.language}
                onChange={(val) => updateSettings({ language: val as 'es' | 'en' })}
                options={languages.map(lang => ({
                  value: lang.value,
                  label: `${lang.flag} ${lang.label}`
                }))}
                placeholder={state.language === 'es' ? 'Seleccionar idioma' : 'Select language'}
                className="w-full"
              />
            </div>
          </Card>

          {/* Configuración de Tema */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <Palette className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {state.language === 'es' ? 'Tema' : 'Theme'}
              </h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {state.language === 'es' ? 'Seleccionar tema' : 'Select theme'}
              </label>
              <AppleSelect
                value={state.theme}
                onChange={(val) => updateSettings({ theme: val as 'light' | 'dark' | 'auto' })}
                options={themes.map(theme => ({
                  value: theme.value,
                  label: state.language === 'es' ? theme.label : theme.labelEn
                }))}
                placeholder={state.language === 'es' ? 'Seleccionar tema' : 'Select theme'}
                className="w-full"
              />
            </div>
          </Card>

          {/* Información de la aplicación */}
          <Card className="border-gray-200 bg-gray-50">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">FinanceApp MVP</h3>
              <p className="text-sm text-gray-600">
                {state.language === 'es' 
                  ? 'Versión 1.0 - Tu gestor financiero personal'
                  : 'Version 1.0 - Your personal finance manager'
                }
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <span>
                  {state.language === 'es' ? 'Datos sincronizados con Supabase' : 'Data synced with Supabase'}
                </span>
                <span>•</span>
                <span>
                  {state.language === 'es' ? 'Privacidad garantizada' : 'Privacy guaranteed'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Contenido de la pestaña Perfil */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Perfil de Usuario */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {state.language === 'es' ? 'Perfil de Usuario' : 'User Profile'}
              </h3>
            </div>
            
            {profile && (
              <div className="space-y-4">
                {!isEditingProfile ? (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {state.language === 'es' ? 'Nombre de Usuario' : 'Username'}
                        </label>
                        <p className="text-lg font-semibold text-gray-900">{profile.username}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {state.language === 'es' ? 'Alias' : 'Alias'}
                        </label>
                        <p className="text-lg font-semibold text-gray-900">{profile.alias}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {state.language === 'es' ? 'Edad' : 'Age'}
                        </label>
                        <p className="text-lg font-semibold text-gray-900">{profile.age} {state.language === 'es' ? 'años' : 'years'}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProfileData({
                            username: profile.username,
                            alias: profile.alias,
                            age: profile.age
                          });
                          setIsEditingProfile(true);
                        }}
                      >
                        {state.language === 'es' ? 'Editar Perfil' : 'Edit Profile'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User className="w-4 h-4 inline mr-2" />
                          {state.language === 'es' ? 'Nombre de Usuario' : 'Username'}
                        </label>
                        <input
                          type="text"
                          value={profileData.username}
                          onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <UserCheck className="w-4 h-4 inline mr-2" />
                          {state.language === 'es' ? 'Alias' : 'Alias'}
                        </label>
                        <input
                          type="text"
                          value={profileData.alias}
                          onChange={(e) => setProfileData(prev => ({ ...prev, alias: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="w-4 h-4 inline mr-2" />
                          {state.language === 'es' ? 'Edad' : 'Age'}
                        </label>
                        <input
                          type="number"
                          min="13"
                          max="120"
                          value={profileData.age}
                          onChange={(e) => setProfileData(prev => ({ ...prev, age: parseInt(e.target.value) || 18 }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    {profileMessage && (
                      <div className={`p-3 rounded-lg text-sm ${
                        profileMessage.includes('exitoso') || profileMessage.includes('successfully') 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {profileMessage}
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button
                        icon={Save}
                        onClick={handleUpdateProfile}
                      >
                        {state.language === 'es' ? 'Guardar Cambios' : 'Save Changes'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileMessage('');
                        }}
                      >
                        {state.language === 'es' ? 'Cancelar' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Contraseña */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <Eye className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {state.language === 'es' ? 'Contraseña' : 'Password'}
              </h3>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={state.language === 'es' ? 'Coloca tu contraseña' : 'Enter your password'}
                className="border border-gray-300 rounded-lg px-3 py-2 w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword
                  ? (state.language === 'es' ? 'Ocultar contraseña' : 'Hide Password')
                  : (state.language === 'es' ? 'Mostrar contraseña' : 'Show Password')}
              </Button>
            </div>
          </Card>

          {/* Restaurar configuración */}
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <RefreshCw className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {state.language === 'es' ? 'Restaurar configuración' : 'Reset Configuration'}
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFactoryReset}
            >
              {state.language === 'es' ? 'Restaurar y borrar todos mis datos' : 'Reset and delete all my data'}
            </Button>
            {resetMessage && (
              <div className="mt-2 text-sm font-semibold text-red-600">{resetMessage}</div>
            )}
          </Card>

          {/* Cerrar Sesión */}
          <Card className="border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-red-900">
                  {state.language === 'es' ? 'Cerrar Sesión' : 'Sign Out'}
                </h3>
                <p className="text-sm text-red-700">
                  {state.language === 'es' 
                    ? 'Cierra tu sesión de forma segura' 
                    : 'Sign out of your account securely'
                  }
                </p>
              </div>
              <Button
                icon={LogOut}
                variant="outline"
                onClick={handleSignOut}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                {state.language === 'es' ? 'Cerrar Sesión' : 'Sign Out'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}