import { useState, useEffect } from "react";
import { supabase } from "@/db/supabase";
import { Button } from "@/components/ui/button";
import { LogIn, Menu, X, Home, MapIcon, PlusCircle, User } from "lucide-react";
import LogoutButton from "./LoginButton";
import { Link } from "@/components/ui/link";

export default function NavBar() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Check if user is authenticated
		const checkAuth = async () => {
			try {
				const { data } = await supabase.auth.getSession();
				setIsLoggedIn(!!data.session);
			} catch (error) {
				console.error("Auth check error:", error);
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();

		// Listen for auth changes
		const { data: authListener } = supabase.auth.onAuthStateChange(
			(event, session) => {
				setIsLoggedIn(!!session);
			},
		);

		return () => {
			// Cleanup listener on unmount
			authListener?.subscription.unsubscribe();
		};
	}, []);

	const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
	const closeMenu = () => setIsMenuOpen(false);

	return (
		<header className="bg-background border-b sticky top-0 z-40">
			<div className="container mx-auto px-4 py-3 flex items-center justify-between">
				{/* Logo and brand name */}
				<div className="flex items-center">
					<Link href="/" className="flex items-center">
						<span className="font-bold text-lg text-primary">VibeTravels</span>
					</Link>
				</div>

				{/* Mobile menu button */}
				<button
					className="md:hidden p-2 rounded-md"
					onClick={toggleMenu}
					aria-label={isMenuOpen ? "Close menu" : "Open menu"}
					type="button"
				>
					{isMenuOpen ? <X size={24} /> : <Menu size={24} />}
				</button>

				{/* Desktop menu */}
				<nav className="hidden md:flex items-center space-x-4">
					<Link
						href="/"
						className="flex items-center px-3 py-2 rounded-md hover:bg-accent"
					>
						<Home className="mr-2 h-4 w-4" />
						<span>Home</span>
					</Link>
					<Link
						href="/travel-notes"
						className="flex items-center px-3 py-2 rounded-md hover:bg-accent"
					>
						<MapIcon className="mr-2 h-4 w-4" />
						<span>Miejsca</span>
					</Link>
					{isLoggedIn && (
						<Link
							href="/travel-notes/new"
							className="flex items-center px-3 py-2 rounded-md hover:bg-accent"
						>
							<PlusCircle className="mr-2 h-4 w-4" />
							<span>Dodaj miejsce</span>
						</Link>
					)}

					{isLoading ? (
						<div className="w-24 h-9 animate-pulse bg-muted rounded-md" />
					) : isLoggedIn ? (
						<div className="flex items-center space-x-2">
							<Link
								href="/profile"
								className="flex items-center px-3 py-2 rounded-md hover:bg-accent"
							>
								<User className="mr-2 h-4 w-4" />
								<span>Profil</span>
							</Link>
							<LogoutButton variant="outline" size="default" />
						</div>
					) : (
						<div className="flex items-center space-x-2">
							<Link
								href="/login"
								className="flex items-center px-3 py-2 rounded-md hover:bg-accent"
							>
								<LogIn className="mr-2 h-4 w-4" />
								<span>Zaloguj</span>
							</Link>
							<Button asChild>
								<Link href="/register">Zarejestruj się</Link>
							</Button>
						</div>
					)}
				</nav>
			</div>

			{/* Mobile menu */}
			{isMenuOpen && (
				<div className="md:hidden container mx-auto px-4 py-4 bg-background border-t">
					<nav className="flex flex-col space-y-3">
						<Link
							href="/"
							className="flex items-center p-2 rounded-md hover:bg-accent"
							onClick={closeMenu}
						>
							<Home className="mr-2 h-4 w-4" />
							<span>Home</span>
						</Link>
						<Link
							href="/travel-notes"
							className="flex items-center p-2 rounded-md hover:bg-accent"
							onClick={closeMenu}
						>
							<MapIcon className="mr-2 h-4 w-4" />
							<span>Miejsca</span>
						</Link>
						{isLoggedIn && (
							<Link
								href="/travel-notes/new"
								className="flex items-center p-2 rounded-md hover:bg-accent"
								onClick={closeMenu}
							>
								<PlusCircle className="mr-2 h-4 w-4" />
								<span>Dodaj miejsce</span>
							</Link>
						)}

						{isLoading ? (
							<div className="w-full h-9 animate-pulse bg-muted rounded-md" />
						) : isLoggedIn ? (
							<>
								<Link
									href="/profile"
									className="flex items-center p-2 rounded-md hover:bg-accent"
									onClick={closeMenu}
								>
									<User className="mr-2 h-4 w-4" />
									<span>Profil</span>
								</Link>
								<LogoutButton variant="outline" size="default" />
							</>
						) : (
							<>
								<Link
									href="/login"
									className="flex items-center p-2 rounded-md hover:bg-accent"
									onClick={closeMenu}
								>
									<LogIn className="mr-2 h-4 w-4" />
									<span>Zaloguj</span>
								</Link>
								<Button asChild className="w-full">
									<Link href="/register" onClick={closeMenu}>
										Zarejestruj się
									</Link>
								</Button>
							</>
						)}
					</nav>
				</div>
			)}
		</header>
	);
}
