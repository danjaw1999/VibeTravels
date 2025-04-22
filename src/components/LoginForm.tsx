import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema } from "@/lib/types/auth";
import type { LoginFormData } from "@/lib/types/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import AuthInput from "./AuthInput";

interface LoginFormProps {
	redirectTo: string;
}

export default function LoginForm({ redirectTo }: LoginFormProps) {
	const { login, error: apiError, isLoading } = useAuth();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data: LoginFormData) => {
		try {
			await login(data);

			window.location.href = redirectTo;
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<Card className="w-full max-w-md" data-testid="login-form">
			<CardHeader className="space-y-1">
				<CardTitle className="text-2xl text-center" data-testid="login-title">
					Witaj ponownie
				</CardTitle>
				<CardDescription
					className="text-center"
					data-testid="login-description"
				>
					Zaloguj się do swojego konta
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="space-y-4"
					method="POST"
					action="javascript:void(0);"
					data-testid="login-form-element"
				>
					{apiError && (
						<div
							className="p-3 text-sm font-medium text-destructive-foreground bg-destructive/10 rounded-md"
							data-testid="login-error"
						>
							{apiError}
						</div>
					)}

					<AuthInput
						id="email"
						label="Email"
						type="email"
						error={errors.email?.message}
						autoComplete="email"
						disabled={isLoading}
						placeholder="jankowalski@example.com"
						data-testid="email-input"
						{...register("email")}
					/>

					<AuthInput
						id="password"
						label="Hasło"
						type="password"
						error={errors.password?.message}
						autoComplete="current-password"
						disabled={isLoading}
						placeholder="••••••••"
						data-testid="password-input"
						{...register("password")}
					/>

					<div className="flex items-center justify-end">
						<a
							href="/auth/reset-password"
							className="text-sm font-medium text-primary hover:text-primary/90 transition-colors"
							data-testid="reset-password-link"
						>
							Nie pamiętasz hasła?
						</a>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="w-full px-4 py-2 text-sm font-medium text-white bg-black hover:bg-black/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						data-testid="login-submit-button"
					>
						{isLoading ? "Logowanie..." : "Zaloguj się"}
					</button>
				</form>
			</CardContent>
			<CardFooter className="flex justify-center">
				<p className="text-sm text-muted-foreground">
					Nie masz jeszcze konta?{" "}
					<a
						href="/register"
						className="font-medium text-primary hover:text-primary/90 transition-colors"
						data-testid="register-link"
					>
						Zarejestruj się
					</a>
				</p>
			</CardFooter>
		</Card>
	);
}
