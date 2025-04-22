import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TravelNoteForm from "../TravelNoteForm";

// Mock ResizeObserver
class ResizeObserverMock {
	observe() {
		/* do nothing */
	}
	unobserve() {
		/* do nothing */
	}
	disconnect() {
		/* do nothing */
	}
}

// Assign to global before tests run
global.ResizeObserver = ResizeObserverMock;

// Create a more specific type for the mocked function
type MockedFunction = ReturnType<typeof vi.fn> & {
	mockReturnValue: <T>(val: T) => MockedFunction;
	mockImplementation: <T>(fn: () => Promise<T>) => MockedFunction;
};

// Mock fetch API
global.fetch = vi.fn();

// We don't need to mock navigate from astro:transitions/client anymore
// as we've implemented a fallback in the component

describe("TravelNoteForm", () => {
	beforeEach(() => {
		vi.resetAllMocks();

		// Mock fetch API with successful response
		(global.fetch as unknown as MockedFunction).mockImplementation(() =>
			Promise.resolve({
				ok: true,
				json: () =>
					Promise.resolve({
						data: { id: "123", name: "Test Note" },
					}),
			} as Response),
		);

		// Mock window.location.href
		Object.defineProperty(window, "location", {
			value: { href: "" },
			writable: true,
		});
	});

	it("renders the travel note form correctly", () => {
		render(<TravelNoteForm />);

		expect(screen.getByTestId("travel-note-form")).toBeInTheDocument();
		expect(screen.getByTestId("name-input")).toBeInTheDocument();
		expect(screen.getByTestId("description-input")).toBeInTheDocument();
		expect(screen.getByTestId("is-public-checkbox")).toBeInTheDocument();
		expect(screen.getByTestId("submit-button")).toBeInTheDocument();
	});

	it("validates required fields", async () => {
		// Create form HTML with required fields but empty values
		render(<TravelNoteForm />);
		const user = userEvent.setup();

		// Submit empty form
		await user.click(screen.getByTestId("submit-button"));

		// The form should not submit due to HTML5 validation
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it("submits form with correct data", async () => {
		render(<TravelNoteForm />);
		const user = userEvent.setup();

		// Fill the form
		await user.type(screen.getByTestId("name-input"), "Beautiful Sunset");
		await user.type(
			screen.getByTestId("description-input"),
			"Amazing view of the sunset",
		);

		// Submit the form
		await user.click(screen.getByTestId("submit-button"));

		// Check if fetch was called with correct data
		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/travel-notes",
				expect.any(Object),
			);
			// Now we check for window.location.href instead of the navigate function
			expect(window.location.href).toBe("/travel-notes/123");
		});
	});

	it("displays error message when submission fails", async () => {
		// Mock fetch to return an error
		(global.fetch as unknown as MockedFunction).mockImplementation(() =>
			Promise.resolve({
				ok: false,
				json: () =>
					Promise.resolve({
						message: "Failed to create note",
					}),
			} as Response),
		);

		render(<TravelNoteForm />);
		const user = userEvent.setup();

		// Fill and submit the form
		await user.type(screen.getByTestId("name-input"), "Error Test");
		await user.type(screen.getByTestId("description-input"), "This will fail");
		await user.click(screen.getByTestId("submit-button"));

		// Check for error message
		await waitFor(() => {
			expect(screen.getByTestId("error-message")).toBeInTheDocument();
			expect(screen.getByTestId("error-message")).toHaveTextContent(
				/Failed to create note/,
			);
		});

		// Navigate should not have been called (location.href should not be updated)
		expect(window.location.href).not.toBe("/travel-notes/123");
	});

	it("shows loading state while submitting", async () => {
		// Mock a delayed response
		(global.fetch as unknown as MockedFunction).mockImplementation(
			() =>
				new Promise((resolve) =>
					setTimeout(
						() =>
							resolve({
								ok: true,
								json: () =>
									Promise.resolve({
										data: { id: "123", name: "Test Note" },
									}),
							} as Response),
						100,
					),
				),
		);

		render(<TravelNoteForm />);
		const user = userEvent.setup();

		// Fill the form
		await user.type(screen.getByTestId("name-input"), "Test Note");
		await user.type(screen.getByTestId("description-input"), "This is a test");

		// Submit the form
		await user.click(screen.getByTestId("submit-button"));

		// Button should be in loading state
		expect(screen.getByTestId("submit-button")).toHaveTextContent(
			"Creating...",
		);
		expect(screen.getByTestId("submit-button")).toBeDisabled();

		// Wait for completion
		await waitFor(() => {
			expect(window.location.href).toBe("/travel-notes/123");
		});
	});
});
