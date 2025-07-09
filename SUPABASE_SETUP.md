# Configuración de Supabase para Recuperación de Contraseñas

## Problema
El error 500 al intentar recuperar contraseñas indica un problema de configuración en Supabase.

## Solución

### 1. Habilitar Proveedor de Email
1. Ve a tu dashboard de Supabase
2. Navega a **Authentication** > **Providers**
3. Asegúrate de que **Email** esté habilitado
4. En **Email Templates**, verifica que **Reset Password** esté configurado

### 2. Configurar URLs de Redirección
1. Ve a **Authentication** > **URL Configuration**
2. En **Site URL**, agrega tu URL de producción (ej: `https://tuapp.vercel.app`)
3. En **Redirect URLs**, agrega:
   - `http://localhost:5173` (para desarrollo)
   - `https://tuapp.vercel.app` (para producción)
   - `https://tuapp.vercel.app/auth/callback`

### 3. Configurar Email Templates
1. Ve a **Authentication** > **Email Templates**
2. Selecciona **Reset Password**
3. Personaliza el template si es necesario
4. Asegúrate de que el enlace de redirección sea correcto

### 4. Verificar Variables de Entorno
Asegúrate de que tu archivo `.env` tenga:
```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

### 5. Configurar SMTP (Opcional)
Si quieres usar tu propio servidor SMTP:
1. Ve a **Authentication** > **Email Templates**
2. Configura tu servidor SMTP
3. Prueba el envío de emails

## Debugging
Si el problema persiste:
1. Revisa los logs de Supabase en el dashboard
2. Verifica que el email esté registrado en la base de datos
3. Prueba con un email diferente
4. Verifica que no haya límites de rate limiting

## Nota
Supabase tiene límites de rate limiting para el envío de emails. Si envías demasiados emails de recuperación en poco tiempo, puede fallar. 