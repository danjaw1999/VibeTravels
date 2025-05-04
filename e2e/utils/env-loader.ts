import { config } from "dotenv";
import * as path from "node:path";
import * as fs from "node:fs";

export function loadEnvironmentVariables() {
  const testEnvPath = path.resolve(process.cwd(), ".env.integration");
  if (fs.existsSync(testEnvPath)) {
    config({ path: testEnvPath });
    return;
  }

  // Jeśli nie, spróbuj załadować .env
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    config({ path: envPath });
    return;
  }
}

/**
 * Funkcja logująca dostępne zmienne środowiskowe dla celów debugowania
 * @param context Nazwa kontekstu dla celów logowania
 */
export function logEnvironmentVariables(context = "default") {
  console.log(`[${context}] Available environment variables:`, {
    PUBLIC_E2E_USERNAME: !!process.env.PUBLIC_E2E_USERNAME,
    PUBLIC_E2E_USERNAME_ID: !!process.env.PUBLIC_E2E_USERNAME_ID,
    PUBLIC_E2E_PASSWORD_EXISTS: !!process.env.PUBLIC_E2E_PASSWORD,
    PUBLIC_SUPABASE_URL_EXISTS: !!process.env.PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_KEY_EXISTS: !!process.env.PUBLIC_SUPABASE_KEY,
  });
}

/**
 * Funkcja zwracająca URL Supabase, sprawdzając różne możliwe nazwy zmiennych środowiskowych
 */
export function getSupabaseUrl(): string {
  return process.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || "";
}

/**
 * Funkcja zwracająca klucz Supabase, sprawdzając różne możliwe nazwy zmiennych środowiskowych
 */
export function getSupabaseKey(): string {
  return process.env.PUBLIC_SUPABASE_KEY || process.env.PUBLIC_SUPABASE_KEY || "";
}
