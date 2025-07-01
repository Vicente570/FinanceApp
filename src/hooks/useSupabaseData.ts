import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface AppData {
  accounts: any[];
  budgets: any[];
  expenses: any[];
  assets: any[];
  assetGroups: any[];
  debts: any[];
  properties: any[];
  interpersonalDebts: any[];
  currency: string;
  theme: string;
  language: string;
}

export function useSupabaseData() {
  const { user, isAuthenticated } = useAuth();

  // Guardar datos en Supabase
  const saveToSupabase = useCallback(async (dataType: string, data: any) => {
    if (!user || !isAuthenticated) return { success: false, message: 'Usuario no autenticado' };

    try {
      const { error } = await supabase
        .from('user_app_data')
        .upsert({
          user_id: user.id,
          data_type: dataType,
          data: data
        });

      if (error) throw error;

      return { success: true, message: 'Datos guardados exitosamente' };
    } catch (error: any) {
      console.error(`Error saving ${dataType}:`, error);
      return { 
        success: false, 
        message: error.message || `Error al guardar ${dataType}` 
      };
    }
  }, [user, isAuthenticated]);

  // Cargar datos desde Supabase
  const loadFromSupabase = useCallback(async (dataType: string) => {
    if (!user || !isAuthenticated) return null;

    try {
      const { data, error } = await supabase
        .from('user_app_data')
        .select('data')
        .eq('user_id', user.id)
        .eq('data_type', dataType)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data?.data || null;
    } catch (error: any) {
      console.error(`Error loading ${dataType}:`, error);
      return null;
    }
  }, [user, isAuthenticated]);

  // Cargar todos los datos de la aplicación
  const loadAllAppData = useCallback(async (): Promise<Partial<AppData> | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      const { data, error } = await supabase
        .from('user_app_data')
        .select('data_type, data')
        .eq('user_id', user.id);

      if (error) throw error;

      const appData: Partial<AppData> = {};
      
      data?.forEach(item => {
        appData[item.data_type as keyof AppData] = item.data;
      });

      return appData;
    } catch (error: any) {
      console.error('Error loading app data:', error);
      return null;
    }
  }, [user, isAuthenticated]);

  // Guardar todos los datos de la aplicación
  const saveAllAppData = useCallback(async (appData: AppData) => {
    if (!user || !isAuthenticated) return { success: false, message: 'Usuario no autenticado' };

    try {
      const dataEntries = Object.entries(appData).map(([dataType, data]) => ({
        user_id: user.id,
        data_type: dataType,
        data: data
      }));

      const { error } = await supabase
        .from('user_app_data')
        .upsert(dataEntries);

      if (error) throw error;

      return { success: true, message: 'Todos los datos guardados exitosamente' };
    } catch (error: any) {
      console.error('Error saving all app data:', error);
      return { 
        success: false, 
        message: error.message || 'Error al guardar datos' 
      };
    }
  }, [user, isAuthenticated]);

  return {
    saveToSupabase,
    loadFromSupabase,
    loadAllAppData,
    saveAllAppData,
    isAuthenticated
  };
}