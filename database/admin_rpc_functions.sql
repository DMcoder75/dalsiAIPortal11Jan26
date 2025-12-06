-- Admin RPC Functions
-- Functions for admin users to query and manage data

-- Function to get all users (for admin)
CREATE OR REPLACE FUNCTION admin_get_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  subscription_tier TEXT,
  created_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.subscription_tier,
    u.created_at,
    u.last_login,
    u.status
  FROM public.users u
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_get_users() TO anon;
GRANT EXECUTE ON FUNCTION admin_get_users() TO authenticated;

-- Function to get all API keys (for admin)
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
    ak.total_requests,
    ak.total_tokens_used,
    ak.total_cost_usd,
    ak.last_used_at,
    ak.created_at,
    ak.rate_limit_per_minute,
    ak.rate_limit_per_hour,
    ak.rate_limit_per_day,
    u.email as user_email,
    u.first_name as user_first_name,
    u.last_name as user_last_name
  FROM public.api_keys ak
  LEFT JOIN public.users u ON ak.user_id = u.id
  ORDER BY ak.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_get_api_keys() TO anon;
GRANT EXECUTE ON FUNCTION admin_get_api_keys() TO authenticated;

-- Function to get API usage logs (for admin)
CREATE OR REPLACE FUNCTION admin_get_api_logs(
  p_limit INTEGER DEFAULT 500,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  endpoint TEXT,
  method TEXT,
  status_code INTEGER,
  response_time_ms INTEGER,
  tokens_used INTEGER,
  cost_usd NUMERIC,
  ip_address INET,
  created_at TIMESTAMPTZ,
  user_email TEXT,
  user_first_name TEXT,
  user_last_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.user_id,
    al.endpoint,
    al.method,
    al.status_code,
    al.response_time_ms,
    al.tokens_used,
    al.cost_usd,
    al.ip_address,
    al.created_at,
    u.email as user_email,
    u.first_name as user_first_name,
    u.last_name as user_last_name
  FROM public.api_usage_logs al
  LEFT JOIN public.users u ON al.user_id = u.id
  WHERE (p_user_id IS NULL OR al.user_id = p_user_id)
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_get_api_logs(INTEGER, UUID) TO anon;
GRANT EXECUTE ON FUNCTION admin_get_api_logs(INTEGER, UUID) TO authenticated;

-- Function to get subscriptions (for admin)
CREATE OR REPLACE FUNCTION admin_get_subscriptions(
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  tier TEXT,
  status TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  auto_renew BOOLEAN,
  payment_method TEXT,
  amount_paid NUMERIC,
  billing_cycle TEXT,
  created_at TIMESTAMPTZ,
  user_email TEXT,
  user_first_name TEXT,
  user_last_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.tier,
    s.status,
    s.start_date,
    s.end_date,
    s.auto_renew,
    s.payment_method,
    s.amount_paid,
    s.billing_cycle,
    s.created_at,
    u.email as user_email,
    u.first_name as user_first_name,
    u.last_name as user_last_name
  FROM public.subscriptions s
  LEFT JOIN public.users u ON s.user_id = u.id
  WHERE (p_user_id IS NULL OR s.user_id = p_user_id)
  ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_get_subscriptions(UUID) TO anon;
GRANT EXECUTE ON FUNCTION admin_get_subscriptions(UUID) TO authenticated;

-- Function to get friction events (for admin)
CREATE OR REPLACE FUNCTION admin_get_friction_events(
  p_limit INTEGER DEFAULT 500,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  event_type TEXT,
  friction_tier TEXT,
  trigger_reason TEXT,
  user_action TEXT,
  converted BOOLEAN,
  session_id TEXT,
  created_at TIMESTAMPTZ,
  user_email TEXT,
  user_first_name TEXT,
  user_last_name TEXT,
  user_subscription_tier TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fe.id,
    fe.user_id,
    fe.event_type,
    fe.friction_tier,
    fe.trigger_reason,
    fe.user_action,
    fe.converted,
    fe.session_id,
    fe.created_at,
    u.email as user_email,
    u.first_name as user_first_name,
    u.last_name as user_last_name,
    u.subscription_tier as user_subscription_tier
  FROM public.friction_events fe
  LEFT JOIN public.users u ON fe.user_id = u.id
  WHERE (p_user_id IS NULL OR fe.user_id = p_user_id)
  ORDER BY fe.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_get_friction_events(INTEGER, UUID) TO anon;
GRANT EXECUTE ON FUNCTION admin_get_friction_events(INTEGER, UUID) TO authenticated;

-- Function to get dashboard stats (for admin)
CREATE OR REPLACE FUNCTION admin_get_dashboard_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_api_keys BIGINT,
  total_api_calls BIGINT,
  total_cost NUMERIC,
  today_api_calls BIGINT,
  today_cost NUMERIC
) AS $$
DECLARE
  v_today_start TIMESTAMPTZ;
BEGIN
  v_today_start := date_trunc('day', now());
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.users)::BIGINT as total_users,
    (SELECT COUNT(*) FROM public.api_keys WHERE is_active = true)::BIGINT as total_api_keys,
    (SELECT COUNT(*) FROM public.api_usage_logs)::BIGINT as total_api_calls,
    (SELECT COALESCE(SUM(cost_usd), 0) FROM public.api_usage_logs) as total_cost,
    (SELECT COUNT(*) FROM public.api_usage_logs WHERE created_at >= v_today_start)::BIGINT as today_api_calls,
    (SELECT COALESCE(SUM(cost_usd), 0) FROM public.api_usage_logs WHERE created_at >= v_today_start) as today_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_get_dashboard_stats() TO anon;
GRANT EXECUTE ON FUNCTION admin_get_dashboard_stats() TO authenticated;

-- Function to get analytics data (for admin)
CREATE OR REPLACE FUNCTION admin_get_analytics(
  p_days_ago INTEGER DEFAULT 7
)
RETURNS TABLE (
  endpoint TEXT,
  tokens_used INTEGER,
  cost_usd NUMERIC,
  created_at TIMESTAMPTZ,
  user_email TEXT
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  v_start_date := now() - (p_days_ago || ' days')::INTERVAL;
  
  RETURN QUERY
  SELECT 
    al.endpoint,
    al.tokens_used,
    al.cost_usd,
    al.created_at,
    u.email as user_email
  FROM public.api_usage_logs al
  LEFT JOIN public.users u ON al.user_id = u.id
  WHERE al.created_at >= v_start_date
  ORDER BY al.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_get_analytics(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION admin_get_analytics(INTEGER) TO authenticated;

-- Comments
COMMENT ON FUNCTION admin_get_users() IS 'Get all users for admin dashboard';
COMMENT ON FUNCTION admin_get_api_keys() IS 'Get all API keys with user info for admin';
COMMENT ON FUNCTION admin_get_api_logs(INTEGER, UUID) IS 'Get API usage logs, optionally filtered by user';
COMMENT ON FUNCTION admin_get_subscriptions(UUID) IS 'Get subscriptions, optionally filtered by user';
COMMENT ON FUNCTION admin_get_friction_events(INTEGER, UUID) IS 'Get friction events, optionally filtered by user';
COMMENT ON FUNCTION admin_get_dashboard_stats() IS 'Get dashboard statistics for admin';
COMMENT ON FUNCTION admin_get_analytics(INTEGER) IS 'Get analytics data for specified number of days';
