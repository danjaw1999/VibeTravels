import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .email("Nieprawidłowy format adresu email")
    .min(1, "Email jest wymagany")
    .refine(async () => {
      // TODO: Add check for existing email in database
      return true;
    }, "Ten adres email jest już zajęty"),
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
    .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
    .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Hasło musi zawierać co najmniej jeden znak specjalny (!@#$%^&*(),.?":{}|<>)'),
  profileDescription: z
    .string()
    .max(1000, "Opis profilu nie może przekraczać 1000 znaków")
    .optional()
    .transform((val) => val || ""),
});

export type RegisterCommand = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email").min(1, "Email jest wymagany"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export type LoginCommand = z.infer<typeof loginSchema>;
