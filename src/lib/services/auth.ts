import type { LoginFormData, SignupFormData } from "../types/auth";

class AuthError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json();
    throw new AuthError(response.status, error.error || "Authentication failed");
  }
  return response.json();
}

export const authService = {
  login: async (data: LoginFormData) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  signup: async (formData: SignupFormData) => {
    const { email, password, profileDescription } = formData;
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, profileDescription }),
    });
    return handleResponse(response);
  },
};
