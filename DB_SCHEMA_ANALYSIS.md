# Dalsiai Portal - Database Schema Analysis

## Overview
The Dalsiai Portal uses a comprehensive PostgreSQL database hosted on Supabase. The schema is designed to support an AI-powered platform with user management, chat functionality, API access, billing, and analytics.

## Core Tables

### 1. User Management

#### `a_users` (Admin Users)
- **Purpose**: Administrative user accounts
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `username` (text, unique) - Admin username
  - `password_hash` (text) - Hashed password
  - `full_name` (text) - Admin full name
  - `email` (text) - Admin email
  - `role` (text) - 'admin' or 'super_admin'
  - `is_active` (boolean) - Account status
  - `last_login` (timestamp) - Last login time
  - `last_login_ip` (inet) - Last login IP address
  - `created_at`, `updated_at` (timestamp) - Audit timestamps

#### `users` (Regular Users - Referenced but not shown in schema)
- **Purpose**: Regular user accounts
- **Referenced by**: Multiple tables (api_keys, chats, blog_posts, etc.)
- **Expected Fields**: id, email, password_hash, created_at, etc.

### 2. AI Models & Chat

#### `ai_models`
- **Purpose**: Store available AI models
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `name` (text) - Model name
  - `version` (text) - Model version
  - `type` (text) - 'text' or 'multimodal'
  - `capabilities` (jsonb) - Model capabilities
  - `pricing` (jsonb) - Pricing information
  - `is_active` (boolean) - Availability status
  - `requires_subscription` (boolean) - Subscription requirement

#### `chats`
- **Purpose**: User chat sessions
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `user_id` (UUID, FK) - Reference to users
  - `title` (text) - Chat title
  - `model_type` (text) - 'dalsi-ai' or 'dalsi-aivi'
  - `is_shared` (boolean) - Share status
  - `share_token` (text, unique) - Share token
  - `selected_model_id` (UUID, FK) - Reference to ai_models
  - `created_at`, `updated_at` (timestamp)

### 3. API Management

#### `api_keys`
- **Purpose**: API key management for users
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `user_id` (UUID, FK) - User reference
  - `key_hash` (text, unique) - Hashed API key
  - `key_prefix` (text) - Key prefix for display
  - `name` (text) - Key name
  - `is_active` (boolean) - Active status
  - `scopes` (jsonb) - Permissions: "ai.chat", "ai.code", "ai.image"
  - `rate_limit_per_minute` (integer) - Default: 60
  - `rate_limit_per_hour` (integer) - Default: 1000
  - `rate_limit_per_day` (integer) - Default: 10000
  - `total_requests` (integer) - Cumulative requests
  - `total_tokens_used` (bigint) - Token usage
  - `total_cost_usd` (numeric) - Cost tracking
  - `last_used_at` (timestamp) - Last usage time
  - `last_used_ip` (inet) - Last usage IP
  - `last_used_endpoint` (text) - Last endpoint used
  - `subscription_tier` (text) - 'free', 'pro', 'enterprise'
  - `expires_at` (timestamp) - Expiration date
  - `allowed_ips` (ARRAY) - IP whitelist
  - `environment` (text) - 'production' or 'development'
  - `webhook_url` (text) - Webhook endpoint
  - `is_internal` (boolean) - Internal key flag
  - `revoked_at`, `revoked_by`, `revoke_reason` - Revocation info

#### `api_key_revocations`
- **Purpose**: Track API key revocation history
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `api_key_id` (UUID, FK) - Reference to api_keys
  - `user_id` (UUID, FK) - User who owned the key
  - `revoked_by` (UUID, FK) - Admin who revoked it
  - `revoke_reason` (text) - Reason for revocation
  - `revoke_type` (text) - 'manual' or 'automatic'
  - `ip_address` (inet) - Revocation IP
  - `user_agent` (text) - Browser/client info
  - `revoked_at` (timestamp)

#### `api_products`
- **Purpose**: Define API products/endpoints
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `name` (text, unique) - Product name
  - `display_name` (text) - Display name
  - `description` (text) - Product description
  - `category` (text) - Product category
  - `base_price_usd` (numeric) - Base pricing
  - `price_per_1k_tokens` (numeric) - Token-based pricing
  - `max_tokens_per_request` (integer) - Default: 2048
  - `endpoints` (ARRAY) - Available endpoints
  - `required_scopes` (ARRAY) - Required permissions
  - `required_subscription_tier` (text) - Minimum tier
  - `is_active` (boolean) - Availability
  - `is_public` (boolean) - Public access

#### `api_usage_logs`
- **Purpose**: Track API usage and analytics
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `user_id` (UUID, FK) - User reference
  - `api_key_id` (UUID, FK) - API key used
  - `endpoint` (text) - Endpoint called
  - `method` (text) - HTTP method
  - `status_code` (integer) - Response status
  - `response_time_ms` (integer) - Response time
  - `request_size_bytes` (integer) - Request size
  - `response_size_bytes` (integer) - Response size
  - `ip_address` (inet) - Client IP
  - `tokens_used` (integer) - Tokens consumed
  - `cost_usd` (numeric) - Cost of request
  - `subscription_tier` (text) - User's tier
  - `error_message` (text) - Error details
  - `request_metadata` (jsonb) - Additional metadata
  - `user_agent` (text) - Client info
  - `rate_limit_remaining` (integer) - Remaining quota
  - `rate_limit_reset` (timestamp) - Reset time
  - `created_at` (timestamp)

### 4. Billing & Subscriptions

#### `user_subscriptions` (Referenced but schema not shown)
- **Purpose**: User subscription management
- **Referenced by**: billing_invoices

#### `billing_invoices`
- **Purpose**: Invoice management
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `user_id` (UUID, FK) - User reference
  - `subscription_id` (UUID, FK) - Subscription reference
  - `invoice_number` (text, unique) - Invoice number
  - `amount` (numeric) - Base amount
  - `tax_amount` (numeric) - Tax amount
  - `total_amount` (numeric) - Total amount
  - `currency` (text) - Default: 'USD'
  - `status` (text) - 'pending', 'paid', 'failed', 'refunded'
  - `due_date` (timestamp) - Payment due date
  - `paid_at` (timestamp) - Payment date
  - `payment_method` (text) - Payment method
  - `payment_reference` (text) - Reference ID
  - `amount_paid` (numeric) - Amount paid
  - `pdf_url` (text) - Invoice PDF URL
  - `created_at` (timestamp)

### 5. Content Management

#### `blog_posts`
- **Purpose**: Blog post management
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `title` (text) - Post title
  - `slug` (text, unique) - URL slug
  - `content` (text) - Post content
  - `excerpt` (text) - Short excerpt
  - `featured_image` (text) - Image URL
  - `author_id` (UUID, FK) - Author reference
  - `status` (text) - 'draft', 'published', 'archived'
  - `published_at` (timestamp) - Publication date
  - `seo_title` (text) - SEO title
  - `seo_description` (text) - SEO description
  - `tags` (ARRAY) - Post tags
  - `created_at`, `updated_at` (timestamp)

#### `faqs`
- **Purpose**: Frequently asked questions
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `question` (text) - FAQ question
  - `answer` (text) - FAQ answer
  - `category` (text) - FAQ category
  - `order_index` (integer) - Display order
  - `is_published` (boolean) - Publication status
  - `created_at`, `updated_at` (timestamp)

### 6. Contact & Support

#### `contact_submissions`
- **Purpose**: Contact form submissions
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `name` (text) - Submitter name
  - `email` (text) - Submitter email
  - `company` (text) - Company name
  - `phone` (text) - Phone number
  - `subject` (text) - Subject
  - `message` (text) - Message content
  - `type` (text) - 'general', 'sales', 'support', 'partnership'
  - `status` (text) - 'new', 'in_progress', 'resolved', 'closed'
  - `assigned_to` (UUID, FK) - Assigned admin
  - `created_at`, `updated_at` (timestamp)

### 7. Email Marketing

#### `email_campaigns`
- **Purpose**: Email campaign management
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `name` (text) - Campaign name
  - `subject` (text) - Email subject
  - `content` (text) - Email content
  - `template_id` (text) - Template reference
  - `status` (text) - 'draft', 'scheduled', 'sent', 'cancelled'
  - `scheduled_at` (timestamp) - Schedule time
  - `sent_at` (timestamp) - Send time
  - `recipient_count` (integer) - Recipients
  - `open_count` (integer) - Opens
  - `click_count` (integer) - Clicks
  - `created_at` (timestamp)

### 8. Analytics & Conversion Tracking

#### `conversion_funnel_detailed`
- **Purpose**: Track user conversion funnel steps
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `user_id` (UUID, FK) - User reference
  - `step_name` (text) - Step in funnel:
    - 'guest_created'
    - 'first_message_sent'
    - 'friction_shown'
    - 'friction_dismissed'
    - 'sign_in_clicked'
    - 'account_created'
    - 'first_paid_message'
    - 'subscription_purchased'
  - `step_order` (integer) - Step sequence
  - `completed_at` (timestamp) - Completion time
  - `time_from_previous_step_seconds` (integer) - Time delta
  - `session_id` (text) - Session identifier
  - `ip_address` (inet) - User IP
  - `user_agent` (text) - Browser info
  - `referral_code` (text) - Referral code
  - `metadata` (jsonb) - Additional data
  - `created_at` (timestamp)

#### `cohort_analysis`
- **Purpose**: Cohort-based analytics
- **Key Fields**:
  - `id` (UUID) - Primary key
  - `cohort_date` (date) - Cohort date
  - `cohort_type` (text) - 'daily', 'weekly', 'monthly'
  - `cohort_size` (integer) - Cohort size
  - `conversion_count` (integer) - Conversions
  - `conversion_rate` (numeric) - Conversion %
  - `avg_days_to_conversion` (numeric) - Average days
  - `avg_messages_before_conversion` (numeric) - Message count
  - `conversion_by_source` (jsonb) - By source breakdown
  - `conversion_by_tier` (jsonb) - By tier breakdown
  - `revenue_generated` (numeric) - Revenue
  - `metadata` (jsonb) - Additional data
  - `created_at`, `updated_at` (timestamp)

### 9. Feature Management

#### `feature_flags` (Schema partially shown)
- **Purpose**: Feature flag management
- **Likely Fields**: id, name, is_enabled, created_at, etc.

## Key Relationships

```
users
├── api_keys (1:N)
│   ├── api_key_revocations (1:N)
│   └── api_usage_logs (1:N)
├── chats (1:N)
├── blog_posts (1:N, as author)
├── contact_submissions (1:N, as assigned_to)
└── conversion_funnel_detailed (1:N)

ai_models
└── chats (1:N)

user_subscriptions
└── billing_invoices (1:N)

api_keys
├── api_key_revocations (1:N)
└── api_usage_logs (1:N)
```

## Data Types Used

- **UUID**: Unique identifiers (gen_random_uuid() or uuid_generate_v4())
- **text**: Variable-length strings
- **numeric**: Decimal numbers (pricing, costs)
- **bigint**: Large integers (token counts)
- **integer**: Regular integers
- **boolean**: True/false values
- **timestamp with time zone**: Timestamped events
- **date**: Date-only values
- **inet**: IP addresses
- **ARRAY**: Array types (tags, scopes, endpoints)
- **jsonb**: JSON binary data (capabilities, pricing, metadata)

## Constraints & Validation

- **UNIQUE constraints**: Ensure uniqueness (username, email, slug, invoice_number, etc.)
- **CHECK constraints**: Validate enum values (role, type, status, etc.)
- **FOREIGN KEY constraints**: Maintain referential integrity
- **DEFAULT values**: Automatic defaults for timestamps, booleans, etc.

## Database Connection Details

- **Provider**: Supabase (PostgreSQL)
- **URL**: https://uhgypnlikwtfxnkixjzp.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZ3lwbmxpa3d0Znhua2l4anpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDM0NTAsImV4cCI6MjA3NTAxOTQ1MH0.AYgnsycrrRTwR56B7HJSgKGg6Hjf4G04ytFm2OGziO0

## Summary

The database schema is comprehensive and well-structured for an AI platform with:
- **User Management**: Admin and regular users
- **AI Services**: Multiple models, chat management
- **API Access**: Key management, usage tracking, rate limiting
- **Monetization**: Subscriptions, invoicing, tier-based access
- **Analytics**: Conversion tracking, cohort analysis
- **Content**: Blog posts, FAQs
- **Support**: Contact submissions, email campaigns
- **Security**: API key revocation, IP whitelisting, audit logs
