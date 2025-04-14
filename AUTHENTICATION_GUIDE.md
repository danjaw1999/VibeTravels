# VibeTravels Authentication Guide

This guide explains how authentication is implemented in the VibeTravels application and how to properly use it.

## Authentication Architecture

The application uses Supabase for authentication with a dual-mode approach:

1. **Server-side Authentication**: Uses HTTP cookies for persistent sessions
   - Secure, httpOnly cookies store authentication tokens
   - Used by Astro pages and API endpoints via middleware

2. **Client-side Authentication**: Uses localStorage for client components
   - Managed by the Supabase client in `src/db/supabase.client.ts`
   - Used by React components and hooks

## Key Components

### 1. Middleware (`src/middleware/index.ts`)

- Runs on every request to initialize the Supabase client in `context.locals`
- Retrieves the current user session and makes it available to all routes

### 2. Auth Service (`src/lib/services/auth.service.ts`)

- Central service for all authentication operations
- Handles login, logout, registration, and user profile management
- Includes:
  - `login()`: Client-side authentication (sets localStorage)
  - `serverLogin()`: Server-side authentication (returns tokens for cookies)
  - `register()`: User registration
  - `getUser()`: Get current user profile
  - `logout()`: Clear all authentication data

### 3. Login Hook (`src/hooks/useLogin.ts`)

- Used by client-side login forms
- Sets up dual-mode authentication (both localStorage AND cookies)
- Redirects after successful login

## Authentication Flow

### Login Process

1. User submits login credentials via a form using `useLogin()` hook
2. Direct Supabase authentication occurs, setting localStorage session
3. A server API call is made to `/api/auth/login` to set secure cookies
4. User is redirected to the requested page

### Session Validation

1. Middleware checks for valid session on every request
2. Client components use Supabase client to check authentication status
3. All authenticated API calls use the session from `context.locals.supabase`

### Creating Travel Notes (or other authenticated actions)

1. User fills the form and submits
2. `useCreateTravelNote` hook checks authentication status with `AuthService`
3. If authenticated, the action proceeds using the Supabase client
4. If not authenticated, user is redirected to login

## Debugging Authentication

Visit `/api/auth/debug-auth` to see your current authentication status. This endpoint shows:

- Whether you have valid Supabase session
- Whether authentication cookies are present
- User ID and token status

## Troubleshooting

### Authentication issues on client-side

If you encounter "Please log in" errors even when logged in:

1. Check `/api/auth/debug-auth` to verify session status
2. Inspect browser localStorage for `sb-<project>-auth-token`
3. Check that cookies are set properly in browser developer tools
4. Try logging out completely and logging in again

### Fix session issues

If cookies and localStorage are out of sync:

```typescript
// In browser console:
await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'your-email@example.com',
    password: 'your-password'
  })
});
```

## Security Considerations

- Cookies use `httpOnly` to prevent JavaScript access
- Both client and server authentication methods use the same underlying Supabase mechanisms
- Critical operations have server-side validation 