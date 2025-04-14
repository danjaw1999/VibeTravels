import { supabase } from '@/db/supabase.client';
import type { SupabaseClient } from '@/db/supabase.client';
import type { LoginCommand, RegisterUserCommand, UserDTO } from '@/types';

export class AuthService {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.client = client ?? supabase;
  }

  /**
   * Server-side login that sets cookies for authentication
   */
  async serverLogin(command: LoginCommand): Promise<{ user: UserDTO | null; accessToken?: string; refreshToken?: string }> {
    try {
      const { data: authData, error: signInError } = await this.client.auth.signInWithPassword({
        email: command.email,
        password: command.password,
      });

      if (signInError || !authData.user) {
        console.error('Error signing in:', signInError);
        return { user: null };
      }

      const { data: user, error } = await this.client
        .from('users')
        .select('id, email, profile_description, created_at')
        .eq('id', authData.user.id)
        .single();

      if (error || !user) {
        console.error('Error fetching user:', error);
        return { user: null };
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          profile_description: user.profile_description,
          createdAt: user.created_at
        },
        accessToken: authData.session?.access_token,
        refreshToken: authData.session?.refresh_token
      };
    } catch (error) {
      console.error('Error in serverLogin:', error);
      return { user: null };
    }
  }

  /**
   * Client-side login that persists session in localStorage
   */
  async login(command: LoginCommand): Promise<UserDTO | null> {
    try {
      const { data: authData, error: signInError } = await this.client.auth.signInWithPassword({
        email: command.email,
        password: command.password,
      });

      if (signInError || !authData.user) {
        console.error('Error signing in:', signInError);
        return null;
      }

      const { data: user, error } = await this.client
        .from('users')
        .select('id, email, profile_description, created_at')
        .eq('id', authData.user.id)
        .single();

      if (error || !user) {
        console.error('Error fetching user:', error);
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        profile_description: user.profile_description,
        createdAt: user.created_at
      };
    } catch (error) {
      console.error('Error in login:', error);
      return null;
    }
  }

  async register(command: RegisterUserCommand): Promise<UserDTO | null> {
    try {
      const { data: authData, error: signUpError } = await this.client.auth.signUp({
        email: command.email,
        password: command.password,
      });

      if (signUpError || !authData.user) {
        console.error('Error signing up:', signUpError);
        return null;
      }

      const { data: user, error } = await this.client
        .from('users')
        .select('id, email, profile_description, created_at')
        .eq('id', authData.user.id)
        .single();

      if (error || !user) {
        console.error('Error fetching user:', error);
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        profile_description: user.profile_description,
        createdAt: user.created_at
      };
    } catch (error) {
      console.error('Error in register:', error);
      return null;
    }
  }

  async getUser(client?: SupabaseClient): Promise<UserDTO | null> {
    try {
      const supabaseClient = client ?? this.client;
      const { data: session } = await supabaseClient.auth.getSession();
      if (!session.session) {
        return null;
      }

      const { data: user, error } = await supabaseClient
        .from('users')
        .select('id, email, profile_description, created_at')
        .eq('id', session.session.user.id)
        .single();

      if (error || !user) {
        console.error('Error fetching user:', error);
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        profile_description: user.profile_description,
        createdAt: user.created_at
      };
    } catch (error) {
      console.error('Error in getUser:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    await this.client.auth.signOut();
  }
}