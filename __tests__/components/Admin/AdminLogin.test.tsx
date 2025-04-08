import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminLogin from "@/app/admin/login/page";

// Mock the fetch API
global.fetch = jest.fn();

// Store original window.location
const originalLocation = window.location;

describe("AdminLogin Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock for window.location
    delete window.location;
    window.location = {
      href: "",
      // Add other properties that might be used
      assign: jest.fn(),
      replace: jest.fn()
    } as unknown as Location;
  });

  // Restore window.location after tests
  afterAll(() => {
    window.location = originalLocation;
  });

  it("renders the login form correctly", () => {
    render(<AdminLogin />);

    // Check for form elements
    expect(screen.getByText("Admin Login")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("updates input values when user types", () => {
    render(<AdminLogin />);

    // Get input elements
    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");

    // Type in the inputs
    fireEvent.change(usernameInput, { target: { value: "admin" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    // Check if inputs have the correct values
    expect(usernameInput).toHaveValue("admin");
    expect(passwordInput).toHaveValue("password123");
  });

  it("submits the form and redirects on successful login", async () => {
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    render(<AdminLogin />);

    // Fill form fields
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "admin" }
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" }
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    // Check loading state
    expect(screen.getByText("Signing in...")).toBeInTheDocument();

    // Wait for the fetch call to resolve
    await waitFor(() => {
      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "password123" })
      });

      // Verify redirect
      expect(window.location.href).toBe("/admin/dashboard");
    });
  });

  it("displays an error message on failed login", async () => {
    // Mock failed fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Invalid credentials" })
    });

    render(<AdminLogin />);

    // Fill form fields
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "admin" }
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpassword" }
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    // Wait for the fetch call to resolve and check that the error message is displayed
    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    // The href should remain empty since no redirect should occur
    expect(window.location.href).toBe("");
  });

  it("handles network error during login", async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network failure")
    );

    render(<AdminLogin />);

    // Fill form fields
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "admin" }
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" }
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    // Wait for the fetch call to reject
    await waitFor(() => {
      // Check that the error message is displayed
      expect(screen.getByText("Login failed")).toBeInTheDocument();
    });

    // The href should remain empty since no redirect should occur
    expect(window.location.href).toBe("");
  });

  it("disables the submit button during form submission", async () => {
    // Mock a slow response to check button state
    (global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true })
            });
          }, 100);
        })
    );

    render(<AdminLogin />);

    // Fill form fields and submit
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "admin" }
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" }
    });

    const submitButton = screen.getByRole("button", { name: "Sign in" });
    fireEvent.click(submitButton);

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled();
    expect(screen.getByText("Signing in...")).toBeInTheDocument();

    // Wait for the fetch to resolve
    await waitFor(() => {
      expect(window.location.href).toBe("/admin/dashboard");
    });
  });
});
