import { useState } from "react";
import { useLogin } from "@/hooks/useLogin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, LogIn } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface LoginFormProps {
	redirectTo: string;
}

export default function LoginForm({ redirectTo }: LoginFormProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [formError, setFormError] = useState<string | null>(null);
	const { login, isLoading, error } = useLogin();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email || !password) {
			setFormError("Email i hasło są wymagane");
			return;
		}
		setFormError(null);
		await login({ email, password }, redirectTo);
	};

	return (
		<Card className="w-full max-w-md shadow-lg">
			<CardHeader className="space-y-1">
				<CardTitle className="text-2xl font-bold text-center">
					Logowanie
				</CardTitle>
				<CardDescription className="text-center">
					Wprowadź swoje dane, aby się zalogować
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-6">
					{(error || formError) && (
						<Alert variant="destructive" className="mb-4">
							<AlertDescription>{error || formError}</AlertDescription>
						</Alert>
					)}

					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<div className="relative">
							<Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								placeholder="twoj@email.com"
								disabled={isLoading}
								className="pl-8"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="password">Hasło</Label>
						<div className="relative">
							<Lock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								placeholder="••••••••"
								disabled={isLoading}
								className="pl-8"
							/>
						</div>
					</div>

					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Logowanie...
							</>
						) : (
							<>
								<LogIn className="mr-2 h-4 w-4" />
								Zaloguj się
							</>
						)}
					</Button>
				</form>
			</CardContent>
			<CardFooter className="flex justify-center">
				<p className="px-8 text-center text-sm text-muted-foreground">
					Klikając "Zaloguj się", akceptujesz nasze
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
}
