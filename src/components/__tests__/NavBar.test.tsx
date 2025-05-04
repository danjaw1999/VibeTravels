// Importy dla Vitest
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mockowanie modułów - musi być przed importami tych modułów
vi.mock("@/store/authStore", () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    setUser: vi.fn(),
    logout: vi.fn(),
  })),
}));

vi.mock("@/db/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
  },
}));

vi.mock("@/lib/featureFlags", () => ({
  isFeatureEnabled: vi.fn((feature: string) => feature === "auth" || feature === "profile"),
}));

vi.mock("@/hooks/useTheme", () => ({
  useTheme: vi.fn(() => ({
    theme: "dark",
    toggleTheme: vi.fn(),
    isMounted: true,
  })),
}));

// Importy testowanych komponentów i modułów - po mockach
import NavBar from "../NavBar";
import { supabase } from "@/db/supabase";
import { useAuthStore } from "@/store/authStore";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { useTheme } from "@/hooks/useTheme";
import type { User } from "@supabase/supabase-js";

describe("NavBar", () => {
  const mockSetUser = vi.fn();
  const mockLogout = vi.fn();
  const mockToggleTheme = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    // Domyślna implementacja dla getSession - użytkownik nie jest zalogowany
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    // Reset Zustand store mock
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      isAuthenticated: false,
      setUser: mockSetUser,
      logout: mockLogout,
    });

    // Reset window size to desktop
    window.innerWidth = 1024;
    window.dispatchEvent(new Event("resize"));

    // Enable auth feature by default
    vi.mocked(isFeatureEnabled).mockImplementation((feature: string) => feature === "auth" || feature === "profile");

    // Default theme implementation
    vi.mocked(useTheme).mockReturnValue({
      theme: "dark",
      toggleTheme: mockToggleTheme,
      isMounted: true,
    });
  });

  it("renders the navbar with logo and links", async () => {
    render(<NavBar />);

    // Brand name
    expect(screen.getByTestId("navbar-logo")).toBeInTheDocument();
    expect(screen.getByText("VibeTravels")).toBeInTheDocument();

    // Standard links
    await waitFor(() => {
      expect(screen.getByTestId("home-link")).toBeInTheDocument();
      expect(screen.getByTestId("places-link")).toBeInTheDocument();
    });
  });

  it("shows theme toggle button with correct initial state", async () => {
    render(<NavBar />);

    // Check desktop theme toggle
    const desktopThemeButton = screen.getByTestId("desktop-theme-toggle");
    expect(desktopThemeButton).toBeInTheDocument();
    expect(desktopThemeButton).toHaveClass("opacity-100"); // Button is visible when mounted

    await userEvent.click(desktopThemeButton);
    expect(mockToggleTheme).toHaveBeenCalled();

    // Check mobile theme toggle
    const mobileThemeButton = screen.getByTestId("mobile-theme-toggle");
    expect(mobileThemeButton).toBeInTheDocument();
    expect(mobileThemeButton).toHaveClass("opacity-100");
  });

  it("hides theme toggle buttons when not mounted", async () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: "dark",
      toggleTheme: mockToggleTheme,
      isMounted: false,
    });

    render(<NavBar />);

    const desktopThemeButton = screen.getByTestId("desktop-theme-toggle");
    expect(desktopThemeButton).toHaveClass("opacity-0");
    expect(desktopThemeButton).toHaveAttribute("aria-hidden", "true");
    expect(desktopThemeButton).toHaveAttribute("tabIndex", "-1");

    const mobileThemeButton = screen.getByTestId("mobile-theme-toggle");
    expect(mobileThemeButton).toHaveClass("opacity-0");
    expect(mobileThemeButton).toHaveAttribute("aria-hidden", "true");
    expect(mobileThemeButton).toHaveAttribute("tabIndex", "-1");
  });

  it("shows login and register buttons when user is not logged in and auth is enabled", async () => {
    render(<NavBar />);

    await waitFor(() => {
      expect(screen.getByTestId("guest-menu")).toBeInTheDocument();
      expect(screen.getByTestId("login-link")).toBeInTheDocument();
      expect(screen.getByTestId("register-button")).toBeInTheDocument();
      expect(screen.queryByTestId("add-place-link")).not.toBeInTheDocument();
      expect(screen.queryByTestId("profile-link")).not.toBeInTheDocument();
    });
  });

  it("does not show auth-related elements when auth is disabled", async () => {
    vi.mocked(isFeatureEnabled).mockImplementation(() => false);
    render(<NavBar />);

    await waitFor(() => {
      expect(screen.queryByTestId("guest-menu")).not.toBeInTheDocument();
      expect(screen.queryByTestId("login-link")).not.toBeInTheDocument();
      expect(screen.queryByTestId("register-button")).not.toBeInTheDocument();
      expect(screen.queryByTestId("logged-in-menu")).not.toBeInTheDocument();
      expect(screen.queryByTestId("profile-link")).not.toBeInTheDocument();
    });
  });

  it("shows profile and logout when user is logged in through initialUser", async () => {
    vi.mocked(isFeatureEnabled).mockImplementation((feature: string) => feature === "auth" || feature === "profile");

    const mockUser = {
      id: "123",
      email: "test@example.com",
    } as User;

    render(<NavBar initialUser={mockUser} />);

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "123",
          email: "test@example.com",
        })
      );
      expect(screen.getByTestId("logged-in-menu")).toBeInTheDocument();
      expect(screen.getByTestId("add-place-link")).toBeInTheDocument();
      expect(screen.getByTestId("profile-link")).toBeInTheDocument();
      expect(screen.queryByTestId("login-link")).not.toBeInTheDocument();
      expect(screen.queryByTestId("register-button")).not.toBeInTheDocument();
    });
  });

  it("shows profile and logout when user is logged in through authStore", async () => {
    vi.mocked(isFeatureEnabled).mockImplementation((feature: string) => feature === "auth" || feature === "profile");

    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: "123", email: "test@example.com" },
      isAuthenticated: true,
      setUser: mockSetUser,
      logout: mockLogout,
    });

    render(<NavBar />);

    await waitFor(() => {
      expect(screen.getByTestId("logged-in-menu")).toBeInTheDocument();
      expect(screen.getByTestId("add-place-link")).toBeInTheDocument();
      expect(screen.getByTestId("profile-link")).toBeInTheDocument();
      expect(screen.queryByTestId("login-link")).not.toBeInTheDocument();
      expect(screen.queryByTestId("register-button")).not.toBeInTheDocument();
    });
  });

  it("toggles mobile menu on small screens", async () => {
    const user = userEvent.setup();

    window.innerWidth = 480;
    window.dispatchEvent(new Event("resize"));

    render(<NavBar />);

    const mobileMenu = screen.getByTestId("mobile-menu");
    expect(mobileMenu).toHaveClass("translate-x-full");
    expect(mobileMenu).not.toHaveClass("translate-x-0");

    const menuButton = screen.getByTestId("open-menu-button");
    await user.click(menuButton);

    await waitFor(() => {
      expect(screen.getByTestId("mobile-menu")).toHaveClass("translate-x-0");
      expect(screen.getByTestId("mobile-menu")).not.toHaveClass("translate-x-full");
      expect(screen.getByTestId("mobile-home-link")).toBeInTheDocument();
    });

    const closeButton = screen.getByTestId("close-menu-button");
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.getByTestId("mobile-menu")).toHaveClass("translate-x-full");
      expect(screen.getByTestId("mobile-menu")).not.toHaveClass("translate-x-0");
    });
  });

  it("closes mobile menu when clicking menu items", async () => {
    const user = userEvent.setup();
    window.innerWidth = 480;
    window.dispatchEvent(new Event("resize"));

    render(<NavBar />);

    // Open menu
    const menuButton = screen.getByTestId("open-menu-button");
    await user.click(menuButton);

    // Click a menu item
    const homeLink = screen.getByTestId("mobile-home-link");
    await user.click(homeLink);

    // Check if menu is closed
    await waitFor(() => {
      expect(screen.getByTestId("mobile-menu")).toHaveClass("translate-x-full");
      expect(screen.getByTestId("mobile-menu")).not.toHaveClass("translate-x-0");
    });
  });

  it("updates UI when auth state changes", async () => {
    const { unmount } = render(<NavBar />);

    await waitFor(() => {
      expect(screen.getByTestId("guest-menu")).toBeInTheDocument();
      expect(screen.queryByTestId("logged-in-menu")).not.toBeInTheDocument();
    });

    unmount();

    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: "123", email: "test@example.com" },
      isAuthenticated: true,
      setUser: mockSetUser,
      logout: mockLogout,
    });

    render(<NavBar />);

    await waitFor(() => {
      expect(screen.queryByTestId("guest-menu")).not.toBeInTheDocument();
      expect(screen.getByTestId("logged-in-menu")).toBeInTheDocument();
    });
  });

  it("does not show profile link when profile feature is disabled", async () => {
    vi.mocked(isFeatureEnabled).mockImplementation((feature: string) => feature === "auth");

    const mockUser = {
      id: "123",
      email: "test@example.com",
    } as User;

    render(<NavBar initialUser={mockUser} />);

    await waitFor(() => {
      expect(screen.queryByTestId("profile-link")).not.toBeInTheDocument();
      expect(screen.queryByTestId("mobile-profile-link")).not.toBeInTheDocument();
      expect(screen.getByTestId("logged-in-menu")).toBeInTheDocument();
      expect(screen.getByTestId("logout-button")).toBeInTheDocument();
    });
  });
});
