-- Función para actualizar la contraseña de un usuario usando un token válido
CREATE OR REPLACE FUNCTION reset_user_password(
  reset_token TEXT,
  new_password TEXT
)
RETURNS JSON AS $$
DECLARE
  token_record RECORD;
  user_record RECORD;
BEGIN
  -- Verificar que el token existe y es válido
  SELECT * INTO token_record 
  FROM password_reset_tokens 
  WHERE token = reset_token 
    AND used = FALSE 
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Token inválido o expirado'
    );
  END IF;
  
  -- Buscar el usuario por email
  SELECT * INTO user_record 
  FROM auth.users 
  WHERE email = token_record.email;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuario no encontrado'
    );
  END IF;
  
  -- Actualizar la contraseña del usuario
  UPDATE auth.users 
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = user_record.id;
  
  -- Marcar el token como usado
  UPDATE password_reset_tokens 
  SET used = TRUE 
  WHERE token = reset_token;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Contraseña actualizada exitosamente'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error inesperado: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION reset_user_password(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION reset_user_password(TEXT, TEXT) TO authenticated; 