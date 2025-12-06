# DalSi AI Portal - Setup Complete

## Project Overview

The **DalSi AI Portal** is a comprehensive React-based web application that provides an AI-powered chat interface with multiple specialized AI models. The portal integrates with Supabase for backend services and the NeoDalsi API for AI capabilities.

## Repository Information

- **GitHub Repository**: https://github.com/DMcoder75/dalsiAIPortal21Nov25v_1
- **Local Path**: `/home/ubuntu/dalsiAIPortal21Nov25v_1`
- **Framework**: React 18.2 + Vite 5.4
- **UI Library**: Radix UI + Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **API**: NeoDalsi AI API

## Environment Configuration

### Supabase Configuration

The application is configured with the following Supabase credentials:

```
VITE_SUPABASE_URL=https://uhgypnlikwtfxnkixjzp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZ3lwbmxpa3d0Znhua2l4anpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDM0NTAsImV4cCI6MjA3NTAxOTQ1MH0.AYgnsycrrRTwR56B7HJSgKGg6Hjf4G04ytFm2OGziO0
```

### Database Connection

```
DATABASE_URL="postgresql://postgres:D@lveer@123@db.uhgypnlikwtfxnkixjzp.supabase.co:5432/postgres"
DB_USER=postgres.uhgypnlikwtfxnkixjzp
DB_PASSWORD=D@lveer@123
DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
```

### NeoDalsi API Configuration

- **Base URL**: https://api.neodalsi.com
- **Authentication**: X-API-Key header required
- **Test API Key**: demo_key_UID1
- **User ID**: 76be6b75-ee1c-4be6-abc3-4f3ed078a366

## Database Schema

The application uses a comprehensive Supabase database with the following key tables:

### Core Tables

1. **users** - User accounts and authentication
2. **chats** - Chat sessions with model selection
3. **messages** - Individual chat messages
4. **ai_models** - Available AI models configuration
5. **user_subscriptions** - Subscription tier management

### API Management Tables

1. **api_keys** - API key management with rate limiting
2. **api_usage_logs** - API usage tracking and analytics
3. **api_products** - API product catalog
4. **api_key_revocations** - API key revocation history

### Analytics & Conversion Tables

1. **conversion_funnel_detailed** - User conversion tracking
2. **cohort_analysis** - Cohort-based analytics
3. **friction_events** - Friction UI event tracking

### Content & Support Tables

1. **blog_posts** - Blog content management
2. **faqs** - FAQ management
3. **contact_submissions** - Contact form submissions
4. **email_campaigns** - Email campaign management

### Billing Tables

1. **billing_invoices** - Invoice management
2. **file_uploads** - File storage tracking

## API Endpoints

The application integrates with the following NeoDalsi API endpoints:

### Health & Status
- `GET /dalsiai/health` - API health check

### General Chat
- `POST /dalsiai/generate` - General AI chat with conversation history support

### Specialized AI Services

1. **Healthcare AI**
   - `POST /dalsiai/healthcare/generate` - Medical advice & symptom analysis

2. **Education AI**
   - `POST /dalsiai/edu/generate` - Tutoring & learning assistance

3. **WeatherSense AI**
   - `POST /dalsiai/weathersense/generate` - Weather information & analysis

4. **SuperCoder AI**
   - `POST /dalsiai/supercoder/generate` - Code generation
   - `POST /dalsiai/supercoder/fix` - Code debugging

### Friction Management APIs

1. **Check Friction**
   - `POST /api/friction/check` - Determine if friction UI should show
   - Parameters: user_id, tier, message_count

2. **Log Friction Action**
   - `POST /api/friction/action` - Track user friction interactions
   - Actions: dismissed, accepted, upgraded

### Priority Queue APIs

- `GET /api/queue/status` - Check queue status

### Conversion Analytics APIs

- Track user conversion funnel
- Cohort analysis
- Revenue tracking

## Application Structure

```
dalsiAIPortal21Nov25v_1/
├── src/
│   ├── App.jsx                 # Main application component
│   ├── components/             # React components
│   │   ├── ChatInterface.jsx
│   │   ├── EnhancedChatInterface.jsx
│   │   ├── AuthModal.jsx
│   │   ├── Navigation.jsx
│   │   ├── Footer.jsx
│   │   └── ...
│   ├── pages/                  # Page components
│   │   ├── HomePage.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   └── ...
│   ├── contexts/               # React contexts
│   │   └── AuthContext.jsx
│   ├── lib/                    # Library configurations
│   │   └── supabase.js
│   └── services/               # Service modules
│       └── apiLogging.js
├── public/                     # Static assets
├── database/                   # Database scripts
├── functions/                  # Serverless functions
├── scripts/                    # Utility scripts
└── package.json               # Dependencies
```

## Key Features

1. **Multi-Model AI Chat Interface**
   - DalSi AI (General purpose)
   - DalSi AI Vi (Vision/Multimodal)
   - Specialized models for healthcare, education, weather, coding

2. **User Authentication & Authorization**
   - Supabase Auth integration
   - Email verification
   - Session management

3. **Subscription Tiers**
   - Free tier with message limits
   - Premium tiers with enhanced features
   - Friction UI for conversion optimization

4. **API Key Management**
   - Generate and manage API keys
   - Rate limiting per tier
   - Usage tracking and analytics

5. **Conversion Funnel Tracking**
   - Guest user tracking
   - Friction event logging
   - Cohort analysis

6. **Content Management**
   - Blog posts
   - FAQs
   - Documentation

## Development Server

The application is currently running on:

- **Local URL**: http://localhost:5173/
- **Public URL**: https://5173-i9y3cbymrz7u71u8uhm0e-99700d2e.manus-asia.computer

## Installation & Setup

### Prerequisites
- Node.js 22.13.0
- pnpm package manager

### Steps Completed

1. ✅ Cloned repository from GitHub
2. ✅ Installed dependencies using `pnpm install`
3. ✅ Configured environment variables in `.env`
4. ✅ Verified Supabase connection
5. ✅ Started development server

### Running the Application

```bash
# Navigate to project directory
cd /home/ubuntu/dalsiAIPortal21Nov25v_1

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## API Integration Examples

### Basic Chat Request

```javascript
const response = await fetch('https://api.neodalsi.com/dalsiai/generate', {
  method: 'POST',
  headers: {
    'X-API-Key': 'demo_key_UID1',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "Explain quantum computing in simple terms"
  })
});
```

### Chat with History

```javascript
const response = await fetch('https://api.neodalsi.com/dalsiai/generate', {
  method: 'POST',
  headers: {
    'X-API-Key': 'demo_key_UID1',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "What did we talk about earlier?",
    use_history: true,
    session_id: "user_session_123"
  })
});
```

### Friction Check

```javascript
const response = await fetch('https://api.neodalsi.com/api/friction/check', {
  method: 'POST',
  headers: {
    'X-API-Key': 'demo_key_UID1',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_id: "76be6b75-ee1c-4be6-abc3-4f3ed078a366",
    tier: "free",
    message_count: 20
  })
});
```

## Friction Types

The application supports multiple friction UI types for conversion optimization:

1. **soft_prompt** - Small dismissible banner
2. **banner** - Top banner with CTA
3. **modal** - Center modal with feature list
4. **interstitial** - Full-screen with countdown
5. **hard_limit** - Blocking modal (NOT dismissible)

## Available Presets

API requests support the following presets:

- **balanced** - Default balanced settings
- **precise** - Lower temperature for factual responses
- **creative** - Higher temperature for creative content
- **concise** - Shorter, focused responses

## Next Steps

1. Review the codebase structure and components
2. Test the chat interface functionality
3. Verify Supabase database connections
4. Test API integrations with NeoDalsi endpoints
5. Review and test friction management system
6. Implement any required customizations
7. Test subscription tier functionality
8. Review analytics and conversion tracking

## Documentation Files

The repository includes comprehensive documentation:

- `README.md` - Project overview
- `SETUP_SUMMARY.md` - Initial setup documentation
- `DEPLOYMENT_COMPLETE.md` - Deployment guide
- `CHAT_MANAGEMENT_FEATURES.md` - Chat features documentation
- `GUEST_LOGGING_IMPLEMENTATION.md` - Guest user tracking
- `USAGE_TRACKING_IMPLEMENTATION.md` - Usage analytics
- `CONVERSATION_CONTEXT_IMPLEMENTATION.md` - Context management
- `LOGGING_DIAGNOSTICS_GUIDE.md` - Debugging guide

## Support & Resources

- **API Documentation**: Provided in PDF files
- **Portal Integration Guide**: Comprehensive backend API documentation
- **Database Schema**: Complete schema in `pasted_content.txt`

---

**Status**: ✅ Setup Complete - Application is ready for development and testing
**Date**: November 21, 2025
**Environment**: Sandbox Development Environment
