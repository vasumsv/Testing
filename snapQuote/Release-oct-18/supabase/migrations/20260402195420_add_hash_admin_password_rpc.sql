/*
  # Add hash_admin_password RPC Function

  Creates a helper function to hash passwords using bcrypt (via pgcrypto),
  used by the admin-set-password edge function when changing passwords.
*/

CREATE OR REPLACE FUNCTION hash_admin_password(p_password text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT crypt(p_password, gen_salt('bf', 10));
$$;
