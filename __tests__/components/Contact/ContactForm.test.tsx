import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactForm from "@/app/components/Contact/ContactForm";
import "@testing-library/jest-dom";
import { expect, jest } from "@jest/globals";

describe("ContactForm Component", () => {
  it("submits form with valid input", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    render(<ContactForm />);

    await userEvent.type(screen.getByLabelText(/name/i), "Test User");
    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/message/i), "Test message");

    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(global.fetch).toHaveBeenCalledWith("/api/contact", expect.any(Object));
    expect(screen.getByText("Message Sent Successfully!")).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    render(<ContactForm />);

    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByText("All fields are required")).toBeInTheDocument();
  });

  it("handles server errors gracefully", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "Server error" }),
    });

    render(<ContactForm />);

    await userEvent.type(screen.getByLabelText(/name/i), "Test User");
    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/message/i), "Test message");

    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByText("Server error")).toBeInTheDocument();
  });

  it("validates email format", async () => {
    render(<ContactForm />);

    await userEvent.type(screen.getByLabelText(/name/i), "Test User");
    await userEvent.type(screen.getByLabelText(/email/i), "invalid-email");
    await userEvent.type(screen.getByLabelText(/message/i), "Test message");

    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(screen.getByLabelText(/email/i)).toBeInvalid();
    expect(screen.queryByText("Message Sent Successfully!")).not.toBeInTheDocument();
  });

  it("validates message length", async () => {
    render(<ContactForm />);

    await userEvent.type(screen.getByLabelText(/name/i), "Test User");
    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/message/i), "Too short"); // 9 characters

    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText("Message must be at least 10 characters long")).toBeInTheDocument();
    });

    expect(screen.queryByText("Message Sent Successfully!")).not.toBeInTheDocument();
  });

  it("disables the submit button during submission", async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true }),
        }), 1000)
      )
    );

    render(<ContactForm />);

    await userEvent.type(screen.getByLabelText(/name/i), "Test User");
    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/message/i), "Test message");

    const submitButton = screen.getByRole("button", { name: /send message/i });
    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText("Sending...")).toBeInTheDocument();
  });
});