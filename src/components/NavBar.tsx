import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, Menu, X, Home, MapIcon, PlusCircle, User as UserIcon, LogOut, Sun, Moon } from "lucide-react";
import { Link } from "@/components/ui/link";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@supabase/supabase-js";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { useTheme } from "@/hooks/useTheme";

interface NavBarProps {
  initialUser?: User | null;
}

export default function NavBar({ initialUser }: NavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const isAuthEnabled = isFeatureEnabled("auth");
  const isProfileEnabled = isFeatureEnabled("profile");
  const { theme, toggleTheme, isMounted } = useTheme();

  useEffect(() => {
    if (initialUser) {
      setUser({
        id: initialUser.id,
        email: initialUser.email || null,
      });
    }
    setInitialLoadComplete(true);
  }, [initialUser, setUser]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const userIsAuthenticated = initialUser != null || (initialLoadComplete && isAuthenticated);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" || e.key === "Enter") {
      closeMenu();
    }
  };

  return (
    <header className="bg-background border-b sticky top-0 z-40" data-testid="navbar">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center" data-testid="navbar-logo">
            <span className="font-bold text-lg text-primary">VibeTravels</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            className={`p-2 rounded-md hover:bg-accent transition-opacity duration-200 ${
              isMounted ? "opacity-100" : "opacity-0"
            }`}
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            type="button"
            aria-hidden={!isMounted}
            tabIndex={isMounted ? 0 : -1}
            data-testid="mobile-theme-toggle"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            className="p-2 rounded-md relative z-50"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            type="button"
            data-testid={isMenuOpen ? "close-menu-button" : "open-menu-button"}
          >
            {isMenuOpen ? (
              <X size={24} className="transition-transform duration-300 ease-in-out" />
            ) : (
              <Menu size={24} className="transition-transform duration-300 ease-in-out" />
            )}
          </button>
        </div>

        {/* Desktop menu */}
        <nav className="hidden md:flex items-center space-x-4" data-testid="desktop-menu">
          <Link href="/" className="flex items-center px-3 py-2 rounded-md hover:bg-accent" data-testid="home-link">
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link
            href="/travel-notes"
            className="flex items-center px-3 py-2 rounded-md hover:bg-accent"
            data-testid="places-link"
          >
            <MapIcon className="mr-2 h-4 w-4" />
            <span>Places</span>
          </Link>
          {userIsAuthenticated && (
            <Link
              href="/travel-notes/new"
              className="flex items-center px-3 py-2 rounded-md hover:bg-accent"
              data-testid="add-place-link"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              <span>Add Place</span>
            </Link>
          )}

          {isLoading ? (
            <div className="w-24 h-9 animate-pulse bg-muted rounded-md" data-testid="loading-indicator" />
          ) : userIsAuthenticated && isAuthEnabled ? (
            <div className="flex items-center space-x-2" data-testid="logged-in-menu">
              {isProfileEnabled && (
                <Link
                  href="/profile"
                  className="flex items-center px-3 py-2 rounded-md hover:bg-accent"
                  data-testid="profile-link"
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              )}
              <Button
                variant="outline"
                size="default"
                onClick={handleLogout}
                disabled={isLoading}
                data-testid="logout-button"
                className="flex items-center"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </Button>
              <button
                className={`p-2 rounded-md hover:bg-accent transition-opacity duration-200 ${
                  isMounted ? "opacity-100" : "opacity-0"
                }`}
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                type="button"
                aria-hidden={!isMounted}
                tabIndex={isMounted ? 0 : -1}
                data-testid="desktop-theme-toggle"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          ) : isAuthEnabled ? (
            <div className="flex items-center space-x-2" data-testid="guest-menu">
              <Link
                href="/login"
                className="flex items-center px-3 py-2 rounded-md hover:bg-accent"
                data-testid="login-link"
              >
                <LogIn className="mr-2 h-4 w-4" />
                <span>Login</span>
              </Link>
              <Button asChild data-testid="register-button">
                <Link href="/register">Sign up</Link>
              </Button>
              <button
                className={`p-2 rounded-md hover:bg-accent transition-opacity duration-200 ${
                  isMounted ? "opacity-100" : "opacity-0"
                }`}
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                type="button"
                aria-hidden={!isMounted}
                tabIndex={isMounted ? 0 : -1}
                data-testid="desktop-theme-toggle"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          ) : null}
        </nav>
      </div>

      {/* Mobile menu content */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-4/5 max-w-xs z-50 bg-background shadow-xl md:hidden transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        data-testid="mobile-menu"
      >
        <div className="p-4 h-full flex flex-col">
          <div className="mb-4 pb-2 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              onClick={closeMenu}
              className="p-2 rounded-md hover:bg-accent"
              aria-label="Close menu"
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex flex-col space-y-3 flex-grow">
            <Link
              href="/"
              className="flex items-center p-2 rounded-md hover:bg-accent transition-colors"
              onClick={closeMenu}
              data-testid="mobile-home-link"
            >
              <Home className="mr-2 h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link
              href="/travel-notes"
              className="flex items-center p-2 rounded-md hover:bg-accent transition-colors"
              onClick={closeMenu}
              data-testid="mobile-places-link"
            >
              <MapIcon className="mr-2 h-4 w-4" />
              <span>Places</span>
            </Link>
            {userIsAuthenticated && (
              <Link
                href="/travel-notes/new"
                className="flex items-center p-2 rounded-md hover:bg-accent transition-colors"
                onClick={closeMenu}
                data-testid="mobile-add-place-link"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>Add Place</span>
              </Link>
            )}
          </nav>

          {userIsAuthenticated && isAuthEnabled ? (
            <div className="mt-auto pt-4 border-t space-y-3">
              {isProfileEnabled && (
                <Link
                  href="/profile"
                  className="flex items-center p-2 rounded-md hover:bg-accent transition-colors"
                  onClick={closeMenu}
                  data-testid="mobile-profile-link"
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              )}
              <Button
                variant="outline"
                size="default"
                onClick={(e) => {
                  closeMenu();
                  handleLogout();
                }}
                disabled={isLoading}
                data-testid="mobile-logout-button"
                className="w-full justify-center"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          ) : isAuthEnabled ? (
            <div className="mt-auto pt-4 border-t space-y-3">
              <Link
                href="/login"
                className="flex items-center p-2 rounded-md hover:bg-accent transition-colors"
                onClick={closeMenu}
                data-testid="mobile-login-link"
              >
                <LogIn className="mr-2 h-4 w-4" />
                <span>Login</span>
              </Link>
              <Button
                asChild
                className="w-full justify-center"
                data-testid="mobile-register-button"
                onClick={closeMenu}
              >
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile menu backdrop */}
      <div
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMenu}
        onKeyDown={handleBackdropKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Close menu"
      />
    </header>
  );
}
