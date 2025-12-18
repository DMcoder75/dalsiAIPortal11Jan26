-- Insert API Key record for Guest User (640c26ce-6541-42c3-b369-f4f75faeab7d)
-- This guest user has an internal API key but was missing the api_keys table entry
-- Key Hash is SHA256 of the entire plain API key

INSERT INTO api_keys (
  id,
  user_id,
  key_hash,
  key_prefix,
  name,
  is_active,
  scopes,
  rate_limit_per_minute,
  rate_limit_per_hour,
  rate_limit_per_day,
  total_requests,
  total_tokens_used,
  total_cost_usd,
  subscription_tier,
  environment,
  is_internal,
  created_at,
  updated_at
) VALUES (
  '34b058f1-7ed0-472f-9510-78a4be3de153',
  '640c26ce-6541-42c3-b369-f4f75faeab7d',
  'fc2e6fd3a06cc34b188083b6e8a00ca489ad5c4b8d0309b082c669c0efc7acf1',
  'sk-dalsi-73',
  'Guest User Portal Key',
  true,
  '["ai.chat", "ai.code", "ai.image", "ai.video"]',
  60,
  1000,
  10000,
  0,
  0,
  0.000000,
  'free',
  'production',
  true,
  '2025-12-13T11:37:45.398540+00',
  '2025-12-13T11:37:45.398540+00'
);

-- Verify the insert
SELECT * FROM api_keys WHERE user_id = '640c26ce-6541-42c3-b369-f4f75faeab7d';
