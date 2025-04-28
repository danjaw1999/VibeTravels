import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/lib/schemas/auth.schema";
import type { RegisterCommand } from "@/lib/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Loader2, UserPlus, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface PasswordRequirement {
  id: string;
  regex: RegExp;
  label: string;
}

const passwordRequirements: PasswordRequirement[] = [
  { id: "length", regex: /.{8,}/, label: "Co najmniej 8 znaków" },
  { id: "uppercase", regex: /[A-Z]/, label: "Jedna wielka litera" },
  { id: "lowercase", regex: /[a-z]/, label: "Jedna mała litera" },
  { id: "digit", regex: /[0-9]/, label: "Jedna cyfra" },
  {
    id: "special",
    regex: /[!@#$%^&*(),.?":{}|<>]/,
    label: "Jeden znak specjalny",
  },
];

// Define a specific type for the form
interface RegisterFormData {
  email: string;
  password: string;
  profileDescription?: string;
}

export const RegisterForm = () => {
  const { signup, isLoading, error: submitError } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      profileDescription: "",
    },
  });

  const password = watch("password", "");
  const passwordStrength = passwordRequirements.filter((req) => req.regex.test(password)).length;

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-destructive";
    if (passwordStrength < 3) return "bg-orange-500";
    if (passwordStrength < 5) return "bg-yellow-500";
    return "bg-green-500";
  };

  const onSubmit = handleSubmit(async (data: RegisterFormData) => {
    try {
      await signup(data as RegisterCommand);
      window.location.href = "/";
    } catch (err) {
      // Error is handled by the hook
      console.error("Submission error:", err);
    }
  });

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Rejestracja</CardTitle>
        <CardDescription className="text-center">Utwórz konto, aby rozpocząć swoją podróż</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          {submitError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="twoj@email.com"
                disabled={isLoading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={cn("pl-8", errors.email && "border-destructive focus-visible:ring-destructive")}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive flex items-center gap-1">
                <X className="h-4 w-4" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <div className="relative">
              <Lock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                disabled={isLoading}
                aria-invalid={!!errors.password}
                aria-describedby="password-requirements"
                className={cn("pl-8", errors.password && "border-destructive focus-visible:ring-destructive")}
                {...register("password")}
              />
            </div>

            <div id="password-requirements" className="space-y-2">
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-300", getPasswordStrengthColor())}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {passwordRequirements.map((req) => (
                  <div
                    key={req.id}
                    className={cn(
                      "flex items-center gap-1",
                      req.regex.test(password) ? "text-green-500" : "text-muted-foreground"
                    )}
                  >
                    {req.regex.test(password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {req.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profileDescription">Opis profilu (opcjonalnie)</Label>
            <div className="relative">
              <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="profileDescription"
                placeholder="Opowiedz coś o sobie"
                disabled={isLoading}
                aria-invalid={!!errors.profileDescription}
                aria-describedby={errors.profileDescription ? "description-error" : undefined}
                className={cn(
                  "pl-8 min-h-[80px]",
                  errors.profileDescription && "border-destructive focus-visible:ring-destructive"
                )}
                {...register("profileDescription")}
              />
            </div>
            {errors.profileDescription && (
              <p id="description-error" className="text-sm text-destructive flex items-center gap-1">
                <X className="h-4 w-4" />
                {errors.profileDescription.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || isSubmitting || Object.keys(errors).length > 0}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tworzenie konta...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Utwórz konto
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="px-8 text-center text-sm text-muted-foreground">
          Klikając &quot;Utwórz konto&quot;, akceptujesz nasze{" "}
          <a href="/terms" className="underline underline-offset-4 hover:text-primary">
            Warunki korzystania
          </a>
          <span className="mx-1">i</span>
          <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
            Politykę prywatności
          </a>
          .
        </p>
      </CardFooter>
    </Card>
  );
};
