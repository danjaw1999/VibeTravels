import { useState, useCallback, useTransition } from "react";
import { registerSchema } from "@/lib/schemas/auth.schema";
import type { RegisterCommand } from "@/lib/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Loader2, UserPlus, Check, X } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { navigate } from "astro:transitions/client";

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

export const RegisterForm = () => {
	const { signup, isLoading, error: submitError } = useAuth();
	const [isPending, startTransition] = useTransition();
	const [formData, setFormData] = useState<RegisterCommand>({
		email: "",
		password: "",
		profileDescription: "",
	});
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

	const validateField = useCallback(
		async (name: keyof RegisterCommand, value: string) => {
			startTransition(() => {
				try {
					// Dla emaila używamy tylko podstawowej walidacji synchronicznej
					if (name === "email") {
						if (!value) {
							setValidationErrors((prev) => ({
								...prev,
								[name]: "Email jest wymagany",
							}));
						} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
							setValidationErrors((prev) => ({
								...prev,
								[name]: "Nieprawidłowy format adresu email",
							}));
						} else {
							setValidationErrors((prev) => ({ ...prev, [name]: "" }));
						}
						return;
					}

					// Dla pozostałych pól używamy normalnej walidacji Zod
					const fieldSchema = registerSchema.shape[name];
					const result = fieldSchema.safeParse(value);

					if (!result.success) {
						setValidationErrors((prev) => ({
							...prev,
							[name]:
								result.error.errors[0]?.message || "Nieprawidłowa wartość",
						}));
					} else {
						setValidationErrors((prev) => ({ ...prev, [name]: "" }));
					}
				} catch (err) {
					console.error(`Validation error for ${name}:`, err);
					if (err instanceof Error) {
						setValidationErrors((prev) => ({ ...prev, [name]: err.message }));
					}
				}
			});
		},
		[],
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			const { name, value } = e.target;
			setFormData((prev) => ({ ...prev, [name]: value }));
			validateField(name as keyof RegisterCommand, value);
		},
		[validateField],
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			// Asynchroniczna walidacja całego formularza przed wysłaniem
			const result = await registerSchema.parseAsync(formData);
			await signup(result);
			navigate("/");
		} catch (err) {
			// Error is handled by the hook
			console.error("Validation error:", err);
		}
	};

	const hasErrors = Object.values(validationErrors).some(Boolean);
	const passwordStrength = passwordRequirements.filter((req) =>
		req.regex.test(formData.password),
	).length;

	const getPasswordStrengthColor = () => {
		if (passwordStrength === 0) return "bg-destructive";
		if (passwordStrength < 3) return "bg-orange-500";
		if (passwordStrength < 5) return "bg-yellow-500";
		return "bg-green-500";
	};

	return (
		<Card className="w-full max-w-md shadow-lg">
			<CardHeader className="space-y-1">
				<CardTitle className="text-2xl font-bold text-center">
					Rejestracja
				</CardTitle>
				<CardDescription className="text-center">
					Utwórz konto, aby rozpocząć swoją podróż
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
								name="email"
								placeholder="twoj@email.com"
								value={formData.email}
								onChange={handleChange}
								disabled={isLoading}
								required
								aria-invalid={!!validationErrors.email}
								aria-describedby={
									validationErrors.email ? "email-error" : undefined
								}
								className={cn(
									"pl-8",
									validationErrors.email &&
										"border-destructive focus-visible:ring-destructive",
								)}
							/>
						</div>
						{validationErrors.email && (
							<p
								id="email-error"
								className="text-sm text-destructive flex items-center gap-1"
							>
								<X className="h-4 w-4" />
								{validationErrors.email}
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
								name="password"
								placeholder="••••••••"
								value={formData.password}
								onChange={handleChange}
								disabled={isLoading}
								required
								aria-invalid={!!validationErrors.password}
								aria-describedby="password-requirements"
								className={cn(
									"pl-8",
									validationErrors.password &&
										"border-destructive focus-visible:ring-destructive",
								)}
							/>
						</div>

						<div id="password-requirements" className="space-y-2">
							<div className="h-1 w-full bg-muted rounded-full overflow-hidden">
								<div
									className={cn(
										"h-full transition-all duration-300",
										getPasswordStrengthColor(),
									)}
									style={{ width: `${(passwordStrength / 5) * 100}%` }}
								/>
							</div>

							<div className="grid grid-cols-2 gap-2 text-sm">
								{passwordRequirements.map((req) => (
									<div
										key={req.id}
										className={cn(
											"flex items-center gap-1",
											req.regex.test(formData.password)
												? "text-green-500"
												: "text-muted-foreground",
										)}
									>
										{req.regex.test(formData.password) ? (
											<Check className="h-3 w-3" />
										) : (
											<X className="h-3 w-3" />
										)}
										{req.label}
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="profileDescription">
							Opis profilu (opcjonalnie)
						</Label>
						<div className="relative">
							<User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Textarea
								id="profileDescription"
								name="profileDescription"
								placeholder="Opowiedz coś o sobie"
								value={formData.profileDescription || ""}
								onChange={handleChange}
								disabled={isLoading}
								aria-invalid={!!validationErrors.profileDescription}
								aria-describedby={
									validationErrors.profileDescription
										? "description-error"
										: undefined
								}
								className={cn(
									"pl-8 min-h-[80px]",
									validationErrors.profileDescription &&
										"border-destructive focus-visible:ring-destructive",
								)}
							/>
						</div>
						{validationErrors.profileDescription && (
							<p
								id="description-error"
								className="text-sm text-destructive flex items-center gap-1"
							>
								<X className="h-4 w-4" />
								{validationErrors.profileDescription}
							</p>
						)}
					</div>

					<Button
						type="submit"
						disabled={isLoading || isPending || hasErrors}
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
					Klikając "Utwórz konto", akceptujesz nasze{" "}
					<a
						href="/terms"
						className="underline underline-offset-4 hover:text-primary"
					>
						Warunki korzystania
					</a>
					<span className="mx-1">i</span>
					<a
						href="/privacy"
						className="underline underline-offset-4 hover:text-primary"
					>
						Politykę prywatności
					</a>
					.
				</p>
			</CardFooter>
		</Card>
	);
};
