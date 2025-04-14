import { useLogout } from "@/hooks/useLogout";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";

interface LogoutButtonProps {
	variant?:
		| "default"
		| "destructive"
		| "outline"
		| "secondary"
		| "ghost"
		| "link";
	size?: "default" | "sm" | "lg" | "icon";
	redirectTo?: string;
}

export default function LogoutButton({
	variant = "default",
	size = "default",
	redirectTo = "/",
}: LogoutButtonProps) {
	const { logout, isLoggingOut } = useLogout();

	const handleLogout = async () => {
		await logout(redirectTo);
	};

	return (
		<Button
			variant={variant}
			size={size}
			onClick={handleLogout}
			disabled={isLoggingOut}
		>
			{isLoggingOut ? (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					Wylogowuję...
				</>
			) : (
				<>
					<LogOut className="mr-2 h-4 w-4" />
					Wyloguj się
				</>
			)}
		</Button>
	);
}
