import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LoginForm from "../LoginForm";
import { useAuth } from "@/hooks/useAuth";

// Mock the useAuth hook
vi.mock("@/hooks/useAuth", () => ({
	useAuth: vi.fn(),
}));

describe("LoginForm", () => {
	const mockLogin = vi.fn();
	const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockUseAuth.mockReturnValue({
			login: mockLogin,
			error: null,
			isLoading: false,
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("renders the login form", () => {
		render(<LoginForm redirectTo="/dashboard" />);

		expect(screen.getByTestId("login-form")).toBeInTheDocument();
		expect(screen.getByTestId("login-title")).toHaveTextContent(
			"Witaj ponownie",
		);
		expect(screen.getByTestId("login-description")).toHaveTextContent(
			"Zaloguj się do swojego konta",
		);
		expect(screen.getByTestId("email-input")).toBeInTheDocument();
		expect(screen.getByTestId("password-input")).toBeInTheDocument();
		expect(screen.getByTestId("login-submit-button")).toHaveTextContent(
			"Zaloguj się",
		);
		expect(screen.getByTestId("reset-password-link")).toHaveAttribute(
			"href",
			"/auth/reset-password",
		);
		expect(screen.getByTestId("register-link")).toHaveAttribute(
			"href",
			"/register",
		);
	});

	it("disables the submit button when loading", () => {
		mockUseAuth.mockReturnValue({
			login: mockLogin,
			error: null,
			isLoading: true,
		});

		render(<LoginForm redirectTo="/dashboard" />);

		const submitButton = screen.getByTestId("login-submit-button");
		expect(submitButton).toBeDisabled();
		expect(submitButton).toHaveTextContent("Logowanie...");
	});

	it("shows an error message when the API returns an error", () => {
		const errorMessage = "Invalid credentials";
		mockUseAuth.mockReturnValue({
			login: mockLogin,
			error: errorMessage,
			isLoading: false,
		});

		render(<LoginForm redirectTo="/dashboard" />);

		expect(screen.getByTestId("login-error")).toHaveTextContent(errorMessage);
	});

	it("submits the form with correct data", async () => {
		// Mock window.location.href
		const originalLocation = window.location;

		// Instead of using delete, redefine window.location
		Object.defineProperty(window, "location", {
			writable: true,
			value: { href: "" },
		});

		// Mock successful login
		mockLogin.mockResolvedValueOnce({});

		render(<LoginForm redirectTo="/dashboard" />);

		// Fill form
		fireEvent.change(screen.getByTestId("email-input"), {
			target: { value: "test@example.com" },
		});

		fireEvent.change(screen.getByTestId("password-input"), {
			target: { value: "password123" },
		});

		// Submit form
		fireEvent.click(screen.getByTestId("login-submit-button"));

		// Check if login was called with correct params
		await waitFor(() => {
			expect(mockLogin).toHaveBeenCalledWith({
				email: "test@example.com",
				password: "password123",
			});
		});

		// Check if redirect happened
		await waitFor(() => {
			expect(window.location.href).toBe("/dashboard");
		});

		// Restore window.location
		Object.defineProperty(window, "location", {
			writable: true,
			value: originalLocation,
		});
	});

	it("handles form validation correctly", async () => {
		render(<LoginForm redirectTo="/dashboard" />);

		// Submit empty form
		fireEvent.click(screen.getByTestId("login-submit-button"));

		// Login should not be called
		await waitFor(() => {
			expect(mockLogin).not.toHaveBeenCalled();
		});
	});
});
