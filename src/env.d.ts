/// <reference types="astro/client" />

import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "./db/supabase";

declare namespace App {
  interface Locals {
    supabase: SupabaseClient;
    user: User | null;
  }
}

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly PUBLIC_SITE_URL: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly OPENAI_API_KEY: string;
  readonly PEXELS_API_KEY: string;
  readonly PUBLIC_ENV_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface AnimationValue {
  opacity?: number;
  scale?: number;
  transform?: string;
  duration?: string;
  easing?: string;
}

declare module "astro:transitions" {
  interface TransitionAnimationValue {
    old: AnimationValue;
    new: AnimationValue;
  }
}
