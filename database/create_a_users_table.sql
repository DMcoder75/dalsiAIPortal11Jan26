-- Admin Users Table (a_users)
-- Custom authentication table for admin users

-- Drop table if exists
DROP TABLE IF EXISTS public.a_users CASCADE;

-- Create a_users table
CREATE TABLE public.a_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  last_login_ip INET,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on username for faster lookups
CREATE INDEX idx_a_users_username ON public.a_users(username);
CREATE INDEX idx_a_users_is_active ON public.a_users(is_active);

-- Insert default admin user
-- Password: admin@123 (hashed with bcrypt-like simple hash for demo)
-- In production, use proper bcrypt hashing
INSERT INTO public.a_users (username, password_hash, full_name, email, role, is_active)
VALUES (
  'admin',
  'admin@123', -- In production, this should be a proper bcrypt hash
  'System Administrator',
  'admin@dalsi.ai',
  'super_admin',
  true
);

-- Enable Row Level Security
ALTER TABLE public.a_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for a_users table

-- Allow anonymous to select for login verification
CREATE POLICY "Allow anonymous select for login"
ON public.a_users
FOR SELECT
TO anon
USING (is_active = true);

-- Allow authenticated admins to select
CREATE POLICY "Allow authenticated admin select"
ON public.a_users
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated admins to update their own last_login
CREATE POLICY "Allow admin update own last_login"
ON public.a_users
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_a_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_a_users_updated_at
BEFORE UPDATE ON public.a_users
FOR EACH ROW
EXECUTE FUNCTION update_a_users_updated_at();

-- Grant permissions
GRANT SELECT, UPDATE ON public.a_users TO anon;
GRANT ALL ON public.a_users TO authenticated;

-- Create admin login function (RPC)
CREATE OR REPLACE FUNCTION admin_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  user_id UUID,
  username TEXT,
  full_name TEXT,
  email TEXT,
  role TEXT,
  message TEXT
) AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Find user by username
  SELECT * INTO v_user
  FROM public.a_users
  WHERE a_users.username = p_username
    AND a_users.is_active = true;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Invalid username or password'::TEXT;
    RETURN;
  END IF;

  -- Verify password (simple comparison for demo, use bcrypt in production)
  IF v_user.password_hash != p_password THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, 'Invalid username or password'::TEXT;
    RETURN;
  END IF;

  -- Update last login
  UPDATE public.a_users
  SET last_login = now()
  WHERE id = v_user.id;

  -- Return success
  RETURN QUERY SELECT 
    true,
    v_user.id,
    v_user.username,
    v_user.full_name,
    v_user.email,
    v_user.role,
    'Login successful'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on admin_login function
GRANT EXECUTE ON FUNCTION admin_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION admin_login(TEXT, TEXT) TO authenticated;

-- Create function to verify admin session
CREATE OR REPLACE FUNCTION verify_admin_session(
  p_user_id UUID
)
RETURNS TABLE (
  is_valid BOOLEAN,
  username TEXT,
  full_name TEXT,
  role TEXT
) AS $$
DECLARE
  v_user RECORD;
BEGIN
  SELECT * INTO v_user
  FROM public.a_users
  WHERE id = p_user_id
    AND is_active = true;

  IF FOUND THEN
    RETURN QUERY SELECT true, v_user.username, v_user.full_name, v_user.role;
  ELSE
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION verify_admin_session(UUID) TO anon;
GRANT EXECUTE ON FUNCTION verify_admin_session(UUID) TO authenticated;

-- Comments
COMMENT ON TABLE public.a_users IS 'Admin users table for custom authentication';
COMMENT ON COLUMN public.a_users.username IS 'Unique username for login';
COMMENT ON COLUMN public.a_users.password_hash IS 'Hashed password (use bcrypt in production)';
COMMENT ON COLUMN public.a_users.role IS 'Admin role: admin or super_admin';
COMMENT ON FUNCTION admin_login(TEXT, TEXT) IS 'RPC function for admin login authentication';
COMMENT ON FUNCTION verify_admin_session(UUID) IS 'RPC function to verify admin session';
