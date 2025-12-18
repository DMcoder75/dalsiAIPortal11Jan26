# DalSiAI Portal - Developer Guide

## Quick Reference

### Project Overview

The DalSiAI Portal is a React-based web application featuring an advanced chat interface with AI capabilities. The Experience page serves as the main hub where users can interact with AI models, manage conversations, and access various AI-powered tools.

### Key Components

**Experience.jsx** - The main Experience page component that orchestrates the entire chat interface. This component manages user authentication state, conversation history, message handling, and UI state. It integrates with the backend API for all conversation operations and uses Firebase Auth for user authentication.

**AuthModal.jsx** - The authentication modal component that handles user login and registration. It supports email/password authentication, Google OAuth, and guest-to-user migration. The modal displays appropriate forms based on the user's action (sign in vs. sign up).

**ConversationHistory.jsx** - A reusable component that displays the user's conversation history in the left sidebar. It groups conversations by date, displays message counts, and provides actions for conversation selection and deletion.

### API Integration

All conversation operations use the backend API at `https://api.neodalsi.com`. The conversation service (`/src/lib/conversationService.js`) provides wrapper functions for all API calls. Each request requires a valid JWT token obtained from the Supabase session.

**Key Functions**:
- `getUserConversations(userId, token)` - Retrieves all conversations for a user
- `createConversation(userId, token, title)` - Creates a new conversation
- `deleteConversation(chatId, token)` - Deletes a conversation
- `saveMessage(chatId, userId, token, message, role)` - Saves a message to a conversation

### State Management

The Experience component uses React hooks for state management. Key state variables include `chatHistory` for storing conversations, `currentChat` for the selected conversation, `messages` for the current conversation's messages, and `showAuthModal` for controlling the authentication modal visibility.

### Authentication Flow

**Guest Users**: Guest users receive an API key stored in sessionStorage. They can send messages and create conversations, but their data is stored separately and transferred to their user account upon signup.

**Authenticated Users**: After login, users receive a JWT token from the backend. This token is used to authenticate all API requests. The token is automatically managed by Supabase and included in the Authorization header.

**Guest Migration**: When a guest signs up, the backend automatically migrates their conversations and messages to their new user account. The frontend passes the guest API key during registration to enable this process.

### Development Workflow

To start development, clone the repository and install dependencies with `npm install`. Run the development server with `npm run dev` to test changes locally. The application uses Vite for fast development builds.

For production builds, use `npm run build` to create an optimized bundle. The build output is placed in the `dist` directory and can be deployed to Firebase Hosting using `firebase deploy --only hosting`.

### Important Notes

The Experience page UI/UX design is considered perfect and should not be modified. All changes should focus on backend functionality and integration. The three-column layout with specific sidebar widths (left: w-56, right: w-64) must be preserved.

When adding new features, ensure they integrate seamlessly with the existing conversation management system. All user-facing operations should provide appropriate loading states and error handling.

### Common Tasks

**Adding a New Conversation Function**: Import the function from `conversationService.js`, get the user's JWT token from Supabase session, call the function with appropriate parameters, and update the UI state accordingly.

**Debugging API Issues**: Check the browser's Network tab to inspect API requests and responses. Verify that the JWT token is being sent in the Authorization header. Check the backend logs for any errors. Ensure the user is properly authenticated before making API calls.

**Testing Authentication**: Use the browser's DevTools to inspect localStorage and sessionStorage for authentication tokens. Check the Supabase Auth dashboard to verify user creation and authentication status. Test both email/password and Google OAuth flows.

### Deployment

The application is deployed to Firebase Hosting at `https://innate-temple-337717.web.app`. Deployments are triggered automatically when changes are pushed to the main branch, or manually using `firebase deploy --only hosting`.

### Support

For issues or questions, refer to the implementation summary document or check the git commit history for context on specific changes. The code includes logging statements that can help debug issues in production.
