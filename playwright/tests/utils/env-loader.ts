import { config } from "dotenv";
import * as path from "node:path";
import * as fs from "node:fs";

/**
 * Funkcja ładująca zmienne środowiskowe z plików .env i .env.test
 */
export function loadEnvironmentVariables() {
  // Najpierw sprawdź, czy istnieje plik .env.test
  const testEnvPath = path.resolve(process.cwd(), ".env.test");
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
    E2E_USERNAME: !!process.env.E2E_USERNAME,
    E2E_USERNAME_ID: !!process.env.E2E_USERNAME_ID,
    E2E_PASSWORD_EXISTS: !!process.env.E2E_PASSWORD,
    SUPABASE_URL_EXISTS: !!process.env.SUPABASE_URL,
    SUPABASE_KEY_EXISTS: !!process.env.SUPABASE_KEY,
  });
}

/**
 * Funkcja zwracająca URL Supabase, sprawdzając różne możliwe nazwy zmiennych środowiskowych
 */
export function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL || process.env.SUPABASE_URL || "";
}

/**
 * Funkcja zwracająca klucz Supabase, sprawdzając różne możliwe nazwy zmiennych środowiskowych
 */
export function getSupabaseKey(): string {
  return process.env.SUPABASE_KEY || process.env.SUPABASE_KEY || "";
}
