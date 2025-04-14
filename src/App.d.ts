/// <reference types="astro/client" />

import type { SupabaseClient } from './db/supabase.client';
import type { User } from '@supabase/supabase-js';

declare namespace App {
  interface Locals {
    supabase: SupabaseClient;
    user: User | null;
  }
} 