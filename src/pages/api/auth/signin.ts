import type { APIRoute } from "astro";
import { AuthService } from "@/lib/services/auth.service";
import { supabase } from '@/db/supabase.client';

export const POST = (async ({ request, cookies, redirect }) => {
  try {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return new Response("Email and password are required", { status: 400 });
    }

    // Use the auth service with supabase client directly
    const authService = new AuthService(supabase);
    const result = await authService.serverLogin({ email, password });
    console.log("result", result);

    if (!result.user) {
      return new Response("Invalid credentials", { status: 401 });
    }

    // Set cookies for server-side authentication
    if (result.accessToken) {
      cookies.set("sb-access-token", result.accessToken, {
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });
    }
    
    if (result.refreshToken) {
      cookies.set("sb-refresh-token", result.refreshToken, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });
    }

    return redirect("/welcome");
  } catch (error) {
    console.error("Login error:", error);
    return new Response("An error occurred during login", { status: 500 });
  }
}) satisfies APIRoute;