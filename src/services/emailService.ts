import { Resend } from 'resend';

// Sistema de emails temporalmente deshabilitado por problemas con Vercel
// TODO: Rehabilitar cuando se resuelva el problema de variables de entorno
console.log('[INFO] Email system temporarily disabled due to Vercel environment variable issues');

// Mock Resend para evitar errores
const resend = {
  emails: {
    send: async () => {
      console.log('[INFO] Email sending disabled - would send email in production');
      return { data: null, error: null };
    }
  }
};

export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  static async sendPasswordResetEmail(email: string, resetUrl: string, language: 'es' | 'en' = 'es'): Promise<{ success: boolean; message: string }> {
    try {
      const subject = language === 'es' 
        ? 'Recuperación de contraseña - FinanceApp' 
        : 'Password Recovery - FinanceApp';

      const html = `
        <div style="background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%); padding: 32px 0; font-family: 'Segoe UI', Arial, sans-serif;">
          <div style="max-width: 420px; margin: 0 auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(80, 80, 180, 0.08); padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 16px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                <span style="font-size: 32px; color: #fff;">🔐</span>
              </div>
              <h1 style="font-size: 1.8rem; font-weight: bold; color: #3b82f6; margin: 0;">FinanceApp</h1>
            </div>
            <h2 style="font-size: 1.2rem; color: #1e293b; margin-bottom: 12px; text-align: center;">
              ${language === 'es' ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}
            </h2>
            <p style="color: #334155; font-size: 1rem; margin-bottom: 24px; text-align: center;">
              ${language === 'es' 
                ? '¡No te preocupes! Haz clic en el botón de abajo para restablecer tu contraseña y seguir gestionando tus finanzas.' 
                : 'Don\'t worry! Click the button below to reset your password and continue managing your finances.'
              }
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${resetUrl}" style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); color: #fff; padding: 12px 32px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 1rem; display: inline-block;">
                ${language === 'es' ? 'Restablecer contraseña' : 'Reset Password'}
              </a>
            </div>
            <p style="color: #64748b; font-size: 0.95rem; text-align: center;">
              ${language === 'es' 
                ? 'Si no solicitaste este cambio, puedes ignorar este correo.' 
                : 'If you didn\'t request this change, you can ignore this email.'
              }
              <br>
              ${language === 'es' 
                ? '¿Necesitas ayuda? Contáctanos en' 
                : 'Need help? Contact us at'
              } 
              <a href="mailto:soporte@financeapp.com" style="color: #8b5cf6;">soporte@financeapp.com</a>
            </p>
            <hr style="margin: 32px 0 16px 0; border: none; border-top: 1px solid #e0e7ef;">
            <p style="color: #94a3b8; font-size: 0.85rem; text-align: center;">
              © 2024 FinanceApp. ${language === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}
            </p>
          </div>
        </div>
      `;

      const { data, error } = await resend.emails.send();

      if (error) {
        console.error('[DEBUG] Error enviando email con Resend:', error);
        return { success: false, message: 'Error enviando email' };
      }

      console.log('[DEBUG] Email enviado exitosamente con Resend:', data);
      return { success: true, message: 'Email enviado exitosamente' };

    } catch (error) {
      console.error('[DEBUG] Error en sendPasswordResetEmail:', error);
      return { success: false, message: 'Error inesperado enviando email' };
    }
  }

  static async sendWelcomeEmail(email: string, username: string, language: 'es' | 'en' = 'es'): Promise<{ success: boolean; message: string }> {
    try {
      const subject = language === 'es' 
        ? '¡Bienvenido a FinanceApp!' 
        : 'Welcome to FinanceApp!';

      const html = `
        <div style="background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%); padding: 32px 0; font-family: 'Segoe UI', Arial, sans-serif;">
          <div style="max-width: 420px; margin: 0 auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(80, 80, 180, 0.08); padding: 32px 24px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 16px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                <span style="font-size: 32px; color: #fff;">🎉</span>
              </div>
              <h1 style="font-size: 1.8rem; font-weight: bold; color: #3b82f6; margin: 0;">FinanceApp</h1>
            </div>
            <h2 style="font-size: 1.2rem; color: #1e293b; margin-bottom: 12px; text-align: center;">
              ${language === 'es' ? '¡Bienvenido!' : 'Welcome!'}
            </h2>
            <p style="color: #334155; font-size: 1rem; margin-bottom: 24px; text-align: center;">
              ${language === 'es' 
                ? `¡Hola ${username}! Gracias por unirte a FinanceApp. Estamos emocionados de ayudarte a gestionar tus finanzas de manera más inteligente.` 
                : `Hello ${username}! Thank you for joining FinanceApp. We're excited to help you manage your finances more intelligently.`
              }
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${window.location.origin}" style="background: linear-gradient(90deg, #3b82f6, #8b5cf6); color: #fff; padding: 12px 32px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 1rem; display: inline-block;">
                ${language === 'es' ? 'Comenzar' : 'Get Started'}
              </a>
            </div>
            <p style="color: #64748b; font-size: 0.95rem; text-align: center;">
              ${language === 'es' 
                ? '¿Tienes preguntas? Contáctanos en' 
                : 'Have questions? Contact us at'
              } 
              <a href="mailto:soporte@financeapp.com" style="color: #8b5cf6;">soporte@financeapp.com</a>
            </p>
            <hr style="margin: 32px 0 16px 0; border: none; border-top: 1px solid #e0e7ef;">
            <p style="color: #94a3b8; font-size: 0.85rem; text-align: center;">
              © 2024 FinanceApp. ${language === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}
            </p>
          </div>
        </div>
      `;

      const { data, error } = await resend.emails.send();

      if (error) {
        console.error('[DEBUG] Error enviando email de bienvenida:', error);
        return { success: false, message: 'Error enviando email de bienvenida' };
      }

      console.log('[DEBUG] Email de bienvenida enviado exitosamente:', data);
      return { success: true, message: 'Email de bienvenida enviado exitosamente' };

    } catch (error) {
      console.error('[DEBUG] Error en sendWelcomeEmail:', error);
      return { success: false, message: 'Error inesperado enviando email de bienvenida' };
    }
  }
} 