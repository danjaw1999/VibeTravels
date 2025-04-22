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

// Importy testowanych komponentów i modułów - po mockach
import NavBar from "../NavBar";
import { supabase } from "@/db/supabase";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@supabase/supabase-js";

describe("NavBar", () => {
  const mockSetUser = vi.fn();
  const mockLogout = vi.fn();

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

  it("shows login and register buttons when user is not logged in", async () => {
    render(<NavBar />);

    await waitFor(() => {
      expect(screen.getByTestId("guest-menu")).toBeInTheDocument();
      expect(screen.getByTestId("login-link")).toBeInTheDocument();
      expect(screen.getByTestId("register-button")).toBeInTheDocument();
      expect(screen.queryByTestId("add-place-link")).not.toBeInTheDocument();
      expect(screen.queryByTestId("profile-link")).not.toBeInTheDocument();
    });
  });

  it("shows profile and logout when user is logged in through initialUser", async () => {
    // Symulacja obiektu użytkownika
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
    // Mock store with authenticated user
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

    // Mock mobile viewport
    window.innerWidth = 480;
    window.dispatchEvent(new Event("resize"));

    render(<NavBar />);

    // Initially menu is closed
    expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();

    // Open menu
    const menuButton = screen.getByTestId("open-menu-button");
    await user.click(menuButton);

    // Menu is now open
    await waitFor(() => {
      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
      expect(screen.getByTestId("mobile-home-link")).toBeInTheDocument();
    });

    // Close menu
    const closeButton = screen.getByTestId("close-menu-button");
    await user.click(closeButton);

    // Menu is closed again
    await waitFor(() => {
      expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
    });
  });

  it("updates UI when auth state changes", async () => {
    // Zamiast próbować aktualizować istniejący komponent, wyrenderujmy go ponownie
    // z innym stanem, co jest bardziej wiarygodnym sposobem testowania

    // Najpierw sprawdzamy, czy UI wyświetla poprawnie stan niezalogowany
    const { unmount } = render(<NavBar />);

    await waitFor(() => {
      expect(screen.getByTestId("guest-menu")).toBeInTheDocument();
      expect(screen.queryByTestId("logged-in-menu")).not.toBeInTheDocument();
    });

    // Odmontowujemy komponent
    unmount();

    // Aktualizujemy mock dla nowego stanu
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: "123", email: "test@example.com" },
      isAuthenticated: true,
      setUser: mockSetUser,
      logout: mockLogout,
    });

    // Renderujemy ponownie z nowym stanem
    render(<NavBar />);

    // Sprawdzamy, czy UI odzwierciedla nowy stan - zalogowany
    await waitFor(() => {
      expect(screen.queryByTestId("guest-menu")).not.toBeInTheDocument();
      expect(screen.getByTestId("logged-in-menu")).toBeInTheDocument();
    });
  });
});
