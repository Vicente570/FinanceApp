-- Tabla para tokens de recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas por email y token
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Función para limpiar tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens 
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Política RLS (Row Level Security)
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción de tokens
CREATE POLICY "Allow token creation" ON password_reset_tokens
  FOR INSERT WITH CHECK (true);

-- Política para permitir lectura de tokens válidos
CREATE POLICY "Allow token verification" ON password_reset_tokens
  FOR SELECT USING (expires_at > NOW() AND used = FALSE);

-- Política para permitir actualización de tokens usados
CREATE POLICY "Allow token usage" ON password_reset_tokens
  FOR UPDATE USING (true); 