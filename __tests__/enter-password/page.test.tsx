import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from "@testing-library/react";
import PasswordProtectionPage from "@/app/enter-password/page";

// Mock fetch globally
global.fetch = jest.fn();

describe("PasswordProtectionPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders input field and submit button", () => {
    render(<PasswordProtectionPage />);
    expect(
      screen.getByPlaceholderText("Enter site password")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enter site/i })
    ).toBeInTheDocument();
  });

  test("allows user to type password", () => {
    render(<PasswordProtectionPage />);
    const input = screen.getByPlaceholderText("Enter site password");
    fireEvent.change(input, { target: { value: "securepassword" } });
    expect(input).toHaveValue("securepassword");
  });

  test("shows error message when incorrect password is entered", async () => {
    fetch.mockResolvedValueOnce({ ok: false });

    render(<PasswordProtectionPage />);

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("Enter site password"), {
        target: { value: "wrongpassword" }
      });
      fireEvent.click(screen.getByRole("button", { name: /enter site/i }));
    });

    await waitFor(() => {
      expect(screen.getByText("Invalid password")).toBeInTheDocument();
    });
  });

  test("redirects on successful password verification", async () => {
    delete window.location;
    window.location = { href: "", search: "" };

    fetch.mockResolvedValueOnce({ ok: true });

    render(<PasswordProtectionPage />);

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("Enter site password"), {
        target: { value: "correctpassword" }
      });
      fireEvent.click(screen.getByRole("button", { name: /enter site/i }));
    });

    await waitFor(() => {
      expect(window.location.href).toBe("/");
    });
  });

  test("shows loading state while verifying", async () => {
    // Create a promise we can resolve manually
    let resolvePromise;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    fetch.mockReturnValueOnce(fetchPromise);

    render(<PasswordProtectionPage />);

    act(() => {
      fireEvent.change(screen.getByPlaceholderText("Enter site password"), {
        target: { value: "testing" }
      });
      fireEvent.click(screen.getByRole("button", { name: /enter site/i }));
    });

    // Verify loading state appears before fetch resolves
    expect(screen.getByText("Verifying...")).toBeInTheDocument();

    // Now resolve the fetch promise to complete the test
    await act(async () => {
      resolvePromise({ ok: false });
    });
  });
});
