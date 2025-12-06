# Authentication Changes Analysis

## 📋 Key Findings from Integration Guide

### 1. **JWT Authentication System**
The platform now uses **JWT (JSON Web Token)** authentication for portal users.

### 2. **Dual Authentication Strategy**

| User Type | Authentication Method | Use Case |
|-----------|----------------------|----------|
| **Portal Users** | JWT (JSON Web Token) | Interactive web sessions |
| **External API Users** | API Keys | Server-to-server integrations |

### 3. **Authentication Endpoints**

**Base URL**: `https://api.neodalsi.com`

#### Endpoint 1: User Login
- **URL**: `/api/auth/login`
- **Method**: POST
- **Request**: `{ "email": "user@example.com", "password": "password" }`
- **Response**: JWT token + user profile

#### Endpoint 2: Verify Token
- **URL**: `/api/auth/verify`
- **Method**: POST
- **Header**: `Authorization: Bearer <token>`
- **Response**: User information from token payload

#### Endpoint 3: Refresh Token
- **URL**: `/api/auth/refresh`
- **Method**: POST
- **Header**: `Authorization: Bearer <token>`
- **Response**: New JWT token with extended expiration

### 4. **JWT Token Characteristics**
- **Expiration**: 24 hours from issuance
- **Type**: `access_token`
- **Contains**:
  - User ID (UUID)
  - Email address
  - Subscription tier
  - Authorized scopes (e.g., `ai.chat`, `ai.code`, `ai.image`, `ai.video`)
  - Issued-at timestamp (`iat`)
  - Expiration timestamp (`exp`)

### 5. **Token Usage**
- Include JWT in Authorization header: `Authorization: Bearer <token>`
- Token is stateless (no database lookup needed)
- Server verifies signature using secret key
- Extracts user information from token payload

---

## 🔄 Database Schema Changes

### **Users Table** (`public.users`)

**Current Schema**:
```sql
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  password_hash text,                    -- bcrypt hashed password
  first_name text,
  last_name text,
  company_name text,
  phone text,
  avatar_url text,
  email_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'support')),
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  selected_ai_model_id uuid,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise', 'custom')),
  billing_address jsonb,
  tax_id text,
  vat_number text
);
```

**Key Points**:
- ✅ Uses `password_hash` (bcrypt)
- ✅ Has `email` field (unique)
- ✅ Has `status` field ('active', 'suspended', 'deleted')
- ✅ Has `subscription_tier` field
- ✅ Has `last_login` field

**Integration Guide Says**:
- Table name is `public.users` (not `portal_users`)
- Password hashing uses **bcrypt**
- Authentication checks `status = 'active'`

---

## ⚠️ Current Code Issues

### 1. **Wrong Table Reference**
The integration guide mentions the code was querying `portal_users` which doesn't exist.
**Fix**: Use `public.users` table

### 2. **No JWT Implementation**
Current code uses simple session tokens, not JWT.
**Fix**: Implement JWT authentication

### 3. **Password Hashing**
Current code uses SHA-256, but should use **bcrypt**.
**Fix**: Update to bcrypt

### 4. **Authentication Flow**
Current flow:
1. User logs in
2. Generate random session token
3. Store in `user_sessions` table
4. Verify by querying database

**Should be** (JWT flow):
1. User logs in via `/api/auth/login`
2. Backend verifies credentials and generates JWT
3. Frontend stores JWT in localStorage
4. For authenticated requests, include JWT in Authorization header
5. Backend verifies JWT signature (no database lookup)

---

## 🎯 Required Changes

### 1. **Create JWT Authentication Service**
- Call `/api/auth/login` endpoint
- Store JWT token in localStorage
- Include token in Authorization header for API calls
- Implement token refresh logic
- Handle token expiration

### 2. **Update User Authentication**
- Remove custom `auth.js` (session-based)
- Create new `jwtAuth.js` service
- Update login/logout flow
- Update authentication context

### 3. **Password Hashing**
- Backend should use bcrypt (already done on API side)
- Frontend just sends plain password to `/api/auth/login`
- No client-side hashing needed

### 4. **Update API Calls**
- Add Authorization header with JWT token
- Handle 401 Unauthorized (token expired)
- Implement automatic token refresh

### 5. **Admin Authentication**
- Keep separate admin system (using `a_users` table)
- Admin uses RPC functions (already implemented)
- Portal users use JWT

---

## 📝 Implementation Plan

### Phase 1: Create JWT Auth Service
1. Create `src/lib/jwtAuth.js`
2. Implement login, verify, refresh functions
3. Store/retrieve JWT from localStorage

### Phase 2: Update Authentication Context
1. Update or create new AuthContext
2. Replace session-based auth with JWT
3. Add token refresh logic

### Phase 3: Update API Integration
1. Add Authorization header to all API calls
2. Handle token expiration
3. Implement automatic refresh

### Phase 4: Update UI Components
1. Update login form to use JWT auth
2. Update protected routes
3. Add token expiration handling

### Phase 5: Testing
1. Test login/logout
2. Test token refresh
3. Test expired token handling
4. Test API calls with JWT

---

## 🔐 Security Improvements

### With JWT:
- ✅ Industry standard authentication
- ✅ Stateless (no database lookups)
- ✅ Cryptographically signed
- ✅ Built-in expiration
- ✅ Contains user claims
- ✅ Better performance

### Bcrypt Password Hashing:
- ✅ Salting (prevents rainbow table attacks)
- ✅ Cost factor (resists brute-force)
- ✅ One-way function (cannot decrypt)

---

## 📊 Summary

**Current State**:
- ❌ Using session tokens (not JWT)
- ❌ SHA-256 password hashing (should be bcrypt)
- ❌ Database lookup for every auth check
- ❌ No token expiration
- ❌ Not using official API endpoints

**Target State**:
- ✅ JWT authentication
- ✅ Bcrypt password hashing (on API side)
- ✅ Stateless authentication
- ✅ 24-hour token expiration
- ✅ Using official `/api/auth/*` endpoints
- ✅ Authorization header with Bearer token

---

**Next Steps**: Implement JWT authentication service and update all authentication code to use the official API endpoints.
