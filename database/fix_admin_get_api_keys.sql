-- Fix admin_get_api_keys function
-- The issue is likely with the column names or return type

DROP FUNCTION IF EXISTS admin_get_api_keys();

CREATE OR REPLACE FUNCTION admin_get_api_keys()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  key_prefix TEXT,
  name TEXT,
  is_active BOOLEAN,
  subscription_tier TEXT,
  total_requests BIGINT,
  total_tokens_used BIGINT,
  total_cost_usd NUMERIC,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  rate_limit_per_minute INTEGER,
  rate_limit_per_hour INTEGER,
  rate_limit_per_day INTEGER,
  user_email TEXT,
  user_first_name TEXT,
  user_last_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.id,
    ak.user_id,
    ak.key_prefix,
    ak.name,
    ak.is_active,
    ak.subscription_tier,
    COALESCE(ak.total_requests, 0)::BIGINT as total_requests,
    COALESCE(ak.total_tokens_used, 0)::BIGINT as total_tokens_used,
    COALESCE(ak.total_cost_usd, 0)::NUMERIC as total_cost_usd,
    ak.last_used_at,
    ak.created_at,
    ak.rate_limit_per_minute,
    ak.rate_limit_per_hour,
    ak.rate_limit_per_day,
    COALESCE(u.email, '')::TEXT as user_email,
    COALESCE(u.first_name, '')::TEXT as user_first_name,
    COALESCE(u.last_name, '')::TEXT as user_last_name
  FROM public.api_keys ak
  LEFT JOIN public.users u ON ak.user_id = u.id
  ORDER BY ak.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_get_api_keys() TO anon;
GRANT EXECUTE ON FUNCTION admin_get_api_keys() TO authenticated;

COMMENT ON FUNCTION admin_get_api_keys() IS 'Get all API keys with user info for admin - Fixed version';
