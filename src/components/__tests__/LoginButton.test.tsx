import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginButton from "../LoginButton";

// Mock the auth store
vi.mock("@/store/authStore", () => ({
	useAuthStore: vi.fn(() => ({
		user: null,
		logout: vi.fn(),
		setUser: vi.fn(),
	})),
}));

// Mock fetch
global.fetch = vi.fn();

// Import the mocked function to be able to modify its implementation
import { useAuthStore } from "@/store/authStore";

type MockFn = ReturnType<typeof vi.fn>;

describe("LoginButton", () => {
	beforeEach(() => {
		vi.resetAllMocks();

		// Default implementation for fetch mock
		(global.fetch as MockFn).mockResolvedValue({
			ok: true,
			json: vi.fn().mockResolvedValue({}),
		});

		// Reset window.location.href mock
		Object.defineProperty(window, "location", {
			value: { href: "" },
			writable: true,
		});
	});

	it("renders login link when user is not logged in", () => {
		// Setup auth store to return null for user
		(useAuthStore as MockFn).mockReturnValue({
			user: null,
			logout: vi.fn(),
			setUser: vi.fn(),
		});

		render(<LoginButton initialUser={null} />);

		const loginLink = screen.getByRole("link", { name: /login/i });
		expect(loginLink).toBeInTheDocument();
		expect(loginLink.getAttribute("href")).toBe("/login");
	});

	it("renders logout button when user is logged in", () => {
		// Setup auth store to return a user
		(useAuthStore as MockFn).mockReturnValue({
			user: { id: "123", email: "test@example.com" },
			logout: vi.fn(),
			setUser: vi.fn(),
		});

		render(
			<LoginButton initialUser={{ id: "123", email: "test@example.com" }} />,
		);

		const logoutButton = screen.getByRole("button", { name: /logout/i });
		expect(logoutButton).toBeInTheDocument();
	});

	it("calls logout API and redirects when logout button is clicked", async () => {
		// Setup mocks
		const logoutMock = vi.fn();
		(useAuthStore as MockFn).mockReturnValue({
			user: { id: "123", email: "test@example.com" },
			logout: logoutMock,
			setUser: vi.fn(),
		});

		render(
			<LoginButton initialUser={{ id: "123", email: "test@example.com" }} />,
		);

		// Click the logout button
		const logoutButton = screen.getByRole("button", { name: /logout/i });
		fireEvent.click(logoutButton);

		// Verify fetch was called with correct params
		expect(global.fetch).toHaveBeenCalledWith("/api/auth/logout", {
			method: "POST",
		});

		// Wait for async operations
		await vi.waitFor(() => {
			// Verify logout was called
			expect(logoutMock).toHaveBeenCalled();

			// Verify redirect
			expect(window.location.href).toBe("/login");
		});
	});
});
