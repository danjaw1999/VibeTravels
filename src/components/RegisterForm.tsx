import { useState, useCallback, useTransition } from "react";
import { useRegister } from "@/hooks/useRegister";
import { registerSchema } from "@/lib/schemas/auth.schema";
import type { RegisterCommand } from "@/lib/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Loader2, UserPlus } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const RegisterForm = () => {
	const { register, isLoading, error: submitError } = useRegister();
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
		(name: keyof RegisterCommand, value: string) => {
			startTransition(() => {
				try {
					registerSchema.shape[name].parse(value);
					setValidationErrors((prev) => ({ ...prev, [name]: "" }));
				} catch (err) {
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
			// Validate all fields before submission
			registerSchema.parse(formData);
			await register(formData);
		} catch (err) {
			// Error is handled by the hook
		}
	};

	const hasErrors = Object.values(validationErrors).some(Boolean);

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
								className={`pl-8 ${validationErrors.email ? "border-destructive" : ""}`}
							/>
						</div>
						{validationErrors.email && (
							<p id="email-error" className="text-sm text-destructive">
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
								aria-describedby={
									validationErrors.password ? "password-error" : undefined
								}
								className={`pl-8 ${validationErrors.password ? "border-destructive" : ""}`}
							/>
						</div>
						{validationErrors.password && (
							<p id="password-error" className="text-sm text-destructive">
								{validationErrors.password}
							</p>
						)}
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
								className={`pl-8 min-h-[80px] ${
									validationErrors.profileDescription
										? "border-destructive"
										: ""
								}`}
							/>
						</div>
						{validationErrors.profileDescription && (
							<p id="description-error" className="text-sm text-destructive">
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
					Klikając "Utwórz konto", akceptujesz nasze
					<a
						href="/terms"
						className="underline underline-offset-4 hover:text-primary ml-1"
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
