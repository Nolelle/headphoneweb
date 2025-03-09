import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event"; // Now installed
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
});