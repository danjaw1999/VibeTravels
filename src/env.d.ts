/// <reference types="astro/client" />

import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from './db/supabase';

declare namespace App {
  interface Locals {
    supabase: SupabaseClient;
    user: User | null;
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type AnimationValue = {
  opacity?: number;
  scale?: number;
  transform?: string;
  duration?: string;
  easing?: string;
};

declare module 'astro:transitions' {
  interface TransitionAnimationValue {
    old: AnimationValue;
    new: AnimationValue;
  }
}
