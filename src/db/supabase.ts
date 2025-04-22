import type { AstroCookies } from "astro";
import {
  createBrowserClient,
  createServerClient,
  parseCookieHeader,
  type CookieOptions,
  type CookieOptionsWithName,
} from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLIC_KEY = import.meta.env.PUBLIC_SUPABASE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    cookieOptions,
    cookies: {
      // @ts-expect-error - correct implementation per Supabase docs
      getAll() {
        const cookieHeader = context.headers.get("Cookie") ?? "";
        return parseCookieHeader(cookieHeader);
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

export const createSupabaseAdminInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookieOptions,
    cookies: {
      // @ts-expect-error - correct implementation per Supabase docs
      getAll() {
        const cookieHeader = context.headers.get("Cookie") ?? "";
        return parseCookieHeader(cookieHeader);
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

export const createSupabaseClient = () => {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
