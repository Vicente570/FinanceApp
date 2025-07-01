import { supabase } from '../lib/supabase';

// ⚠️ FUNCIONES ADMINISTRATIVAS - USAR CON PRECAUCIÓN ⚠️
// Estas funciones eliminan TODOS los datos de la base de datos

export class AdminUtils {
  
  // Eliminar todos los perfiles de usuario
  static async deleteAllUserProfiles() {
    try {
      console.log('🗑️ Eliminando todos los perfiles de usuario...');
      
      const { data, error } = await supabase
        .from('user_profiles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos excepto un ID imposible
      
      if (error) throw error;
      
      console.log('✅ Perfiles de usuario eliminados exitosamente');
      return { success: true, message: 'Perfiles eliminados' };
    } catch (error: any) {
      console.error('❌ Error eliminando perfiles:', error);
      return { success: false, message: error.message };
    }
  }

  // Eliminar todos los datos de aplicación
  static async deleteAllAppData() {
    try {
      console.log('🗑️ Eliminando todos los datos de aplicación...');
      
      const { data, error } = await supabase
        .from('user_app_data')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos
      
      if (error) throw error;
      
      console.log('✅ Datos de aplicación eliminados exitosamente');
      return { success: true, message: 'Datos de aplicación eliminados' };
    } catch (error: any) {
      console.error('❌ Error eliminando datos de aplicación:', error);
      return { success: false, message: error.message };
    }
  }

  // Función principal para limpiar toda la base de datos
  static async cleanDatabase() {
    console.log('🧹 INICIANDO LIMPIEZA COMPLETA DE BASE DE DATOS');
    console.log('⚠️ ESTA ACCIÓN NO SE PUEDE DESHACER ⚠️');
    
    const results = [];
    
    // 1. Eliminar datos de aplicación
    const appDataResult = await this.deleteAllAppData();
    results.push(appDataResult);
    
    // 2. Eliminar perfiles de usuario
    const profilesResult = await this.deleteAllUserProfiles();
    results.push(profilesResult);
    
    // Mostrar resumen
    console.log('📊 RESUMEN DE LIMPIEZA:');
    results.forEach((result, index) => {
      const step = index === 0 ? 'Datos de aplicación' : 'Perfiles de usuario';
      console.log(`${result.success ? '✅' : '❌'} ${step}: ${result.message}`);
    });
    
    const allSuccess = results.every(r => r.success);
    
    if (allSuccess) {
      console.log('🎉 LIMPIEZA COMPLETADA EXITOSAMENTE');
      console.log('💡 Nota: Los usuarios de autenticación aún existen en Supabase Auth');
      console.log('💡 Para eliminarlos completamente, hazlo desde el panel de Supabase');
    } else {
      console.log('⚠️ LIMPIEZA COMPLETADA CON ERRORES');
    }
    
    return {
      success: allSuccess,
      results: results
    };
  }

  // Obtener estadísticas de la base de datos
  static async getDatabaseStats() {
    try {
      console.log('📊 Obteniendo estadísticas de la base de datos...');
      
      // Contar perfiles
      const { count: profileCount, error: profileError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      
      if (profileError) throw profileError;
      
      // Contar datos de aplicación
      const { count: appDataCount, error: appDataError } = await supabase
        .from('user_app_data')
        .select('*', { count: 'exact', head: true });
      
      if (appDataError) throw appDataError;
      
      const stats = {
        userProfiles: profileCount || 0,
        appDataRecords: appDataCount || 0
      };
      
      console.log('📈 ESTADÍSTICAS DE BASE DE DATOS:');
      console.log(`👥 Perfiles de usuario: ${stats.userProfiles}`);
      console.log(`📁 Registros de datos: ${stats.appDataRecords}`);
      
      return stats;
    } catch (error: any) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  }

  // Función de confirmación para uso seguro
  static async confirmAndClean() {
    const confirmation = prompt(
      '⚠️ ADVERTENCIA: Esta acción eliminará TODOS los datos de la base de datos.\n\n' +
      'Esto incluye:\n' +
      '• Todos los perfiles de usuario\n' +
      '• Todos los datos financieros\n' +
      '• Todas las configuraciones\n\n' +
      'Esta acción NO SE PUEDE DESHACER.\n\n' +
      'Para confirmar, escribe: ELIMINAR TODO'
    );
    
    if (confirmation === 'ELIMINAR TODO') {
      console.log('🔓 Confirmación recibida, procediendo con la limpieza...');
      
      // Mostrar estadísticas antes de limpiar
      await this.getDatabaseStats();
      
      // Ejecutar limpieza
      const result = await this.cleanDatabase();
      
      // Mostrar estadísticas después de limpiar
      console.log('\n📊 ESTADÍSTICAS DESPUÉS DE LA LIMPIEZA:');
      await this.getDatabaseStats();
      
      return result;
    } else {
      console.log('❌ Confirmación incorrecta. Operación cancelada.');
      return { success: false, message: 'Operación cancelada por el usuario' };
    }
  }
}

// Función global para fácil acceso desde la consola
(window as any).AdminUtils = AdminUtils;

// Función de acceso rápido
(window as any).cleanDatabase = () => AdminUtils.confirmAndClean();
(window as any).dbStats = () => AdminUtils.getDatabaseStats();

console.log('🔧 AdminUtils cargado. Funciones disponibles:');
console.log('• cleanDatabase() - Limpiar toda la base de datos (con confirmación)');
console.log('• dbStats() - Ver estadísticas de la base de datos');
console.log('• AdminUtils.cleanDatabase() - Limpiar sin confirmación (PELIGROSO)');