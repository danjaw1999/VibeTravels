/**
 * Supabase client configuration and exports.
 * This file serves as the single source of truth for Supabase client instances and types.
 */

import { createClient as createSupabaseClient, type SupabaseClient as BaseSupabaseClient, type AuthFlowType } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Export database types for type safety across the application
export type { Database };
export type SupabaseClient = BaseSupabaseClient<Database>;
export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

// Environment variables for Supabase configuration
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl) throw new Error('Missing PUBLIC_SUPABASE_URL');
if (!supabaseAnonKey) throw new Error('Missing PUBLIC_SUPABASE_ANON_KEY');

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create auth options based on environment
const authOptions: {
  autoRefreshToken: boolean;
  persistSession: boolean;
  detectSessionInUrl: boolean;
  flowType: AuthFlowType;
  storage?: typeof localStorage;
  storageKey?: string;
} = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  flowType: 'implicit' as const,
};

// Add storage only in browser environment
if (isBrowser) {
  authOptions.storage = window.localStorage;
  authOptions.storageKey = 'sb-auth-token';
}

/**
 * Main Supabase client instance for client-side operations.
 * Features:
 * - Automatic token refresh
 * - Persistent sessions
 * - Respects Row Level Security (RLS) policies
 * 
 * Use this instance for all standard client-side database operations
 * and authentication in components and services.
 */
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: authOptions,
});

// Listen for auth state changes for debugging
if (isBrowser) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Supabase auth event:', event, session ? `User: ${session.user.id}` : 'No session');
  });
}

/**
 * Admin Supabase client instance with elevated privileges.
 * Features:
 * - Bypasses Row Level Security (RLS)
 * - Has full access to the database
 * 
 * IMPORTANT: Only use this client for admin operations that require
 * bypassing RLS, such as user management or system-wide operations.
 * Never expose this client to the client side.
 */
export const supabaseAdminClient = createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey); 