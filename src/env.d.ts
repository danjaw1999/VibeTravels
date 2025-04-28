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
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
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
