import { useAuthStore } from "@/store/authStore";
import { LogIn, LogOut } from "lucide-react";
import { useEffect } from "react";

export default function LoginButton({ initialUser }: { initialUser: any }) {
	const { user, logout, setUser } = useAuthStore();

	const handleLogout = async () => {
		try {
			await fetch("/api/auth/logout", { method: "POST" });
			logout();
			window.location.href = "/login";
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	useEffect(() => {
		if (initialUser) {
			setUser(initialUser);
		}
	}, [initialUser, setUser]);

	if (user) {
		return (
			<div className="flex flex-row items-center gap-2 justify-center">
				<button
					type="button"
					onClick={handleLogout}
					className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-white bg-black hover:bg-black/80 rounded-md transition-colors duration-200"
					aria-label="Logout"
				>
					<LogOut className="size-3.5" />
					<span className="hidden md:inline">Logout</span>
				</button>
			</div>
		);
	}

	return (
		<a
			href="/login"
			className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-white bg-black hover:bg-black/80 rounded-md transition-colors duration-200"
			aria-label="Login"
		>
			<LogIn className="size-3.5" />
			<span className="hidden md:inline">Login</span>
		</a>
	);
}
