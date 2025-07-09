import { supabase } from '../lib/supabase';
import { EmailService } from './emailService';

export interface PasswordResetToken {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export class PasswordResetService {
  // Generar un token único
  private static generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Solicitar recuperación de contraseña
  static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar que el email existe usando el método estándar de Supabase
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'temporary_password_that_will_fail'
      });

      // Si el error es "Invalid login credentials", significa que el email existe
      // Si es "User not found", significa que el email no existe
      if (signInError && signInError.message.includes('User not found')) {
        return { success: false, message: 'No existe una cuenta con este email' };
      }

      // Limpiar tokens expirados
      await this.cleanupExpiredTokens();

      // Generar nuevo token
      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Expira en 1 hora

      // Guardar token en la base de datos
      const { error: insertError } = await supabase
        .from('password_reset_tokens')
        .insert({
          email,
          token,
          expires_at: expiresAt.toISOString()
        });

      if (insertError) {
        console.error('[DEBUG] Error guardando token:', insertError);
        return { success: false, message: 'Error generando token de recuperación' };
      }

      // Enviar email usando nuestro servicio personalizado
      const resetUrl = `${window.location.origin}/reset-password?token=${token}`;
      
      // Por ahora, usar el idioma español (puedes pasarlo como parámetro)
      const emailResult = await EmailService.sendPasswordResetEmail(email, resetUrl, 'es');

      if (emailResult.success) {
        return { 
          success: true, 
          message: 'Se ha enviado un email con el enlace de recuperación' 
        };
      } else {
        console.error('[DEBUG] Error enviando email personalizado:', emailResult.message);
        // Si falla el email personalizado, mostrar la URL manualmente (solo para desarrollo)
        console.log('[DEBUG] URL de recuperación generada:', resetUrl);
        
        return { 
          success: true, 
          message: `Token generado pero no se pudo enviar el email. URL: ${resetUrl}` 
        };
      }

    } catch (error) {
      console.error('[DEBUG] Error en requestPasswordReset:', error);
      return { success: false, message: 'Error inesperado' };
    }
  }

  // Verificar token
  static async verifyToken(token: string): Promise<{ success: boolean; email?: string; message: string }> {
    try {
      const { data, error } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return { success: false, message: 'Token inválido o expirado' };
      }

      return { success: true, email: data.email, message: 'Token válido' };

    } catch (error) {
      console.error('[DEBUG] Error verificando token:', error);
      return { success: false, message: 'Error verificando token' };
    }
  }

  // Actualizar contraseña
  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Usar la función de base de datos para actualizar la contraseña
      const { data, error } = await supabase.rpc('reset_user_password', {
        reset_token: token,
        new_password: newPassword
      });

      if (error) {
        console.error('[DEBUG] Error llamando función de reset:', error);
        return { success: false, message: 'Error actualizando contraseña' };
      }

      if (data && data.success) {
        return { success: true, message: data.message || 'Contraseña actualizada exitosamente' };
      } else {
        return { success: false, message: data?.message || 'Error actualizando contraseña' };
      }

    } catch (error) {
      console.error('[DEBUG] Error en resetPassword:', error);
      return { success: false, message: 'Error inesperado' };
    }
  }

  // Limpiar tokens expirados
  private static async cleanupExpiredTokens(): Promise<void> {
    try {
      const { error } = await supabase
        .from('password_reset_tokens')
        .delete()
        .or('expires_at.lt.' + new Date().toISOString() + ',used.eq.true');

      if (error) {
        console.error('[DEBUG] Error limpiando tokens expirados:', error);
      }
    } catch (error) {
      console.error('[DEBUG] Error en cleanupExpiredTokens:', error);
    }
  }
} 