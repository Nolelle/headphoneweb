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
  it("validates email format", async () => {
    render(<ContactForm />);
  
    // Fill form with invalid email
    await userEvent.type(screen.getByLabelText(/name/i), "Test User");
    await userEvent.type(screen.getByLabelText(/email/i), "invalid-email");
    await userEvent.type(screen.getByLabelText(/message/i), "Test message");
  
    // Submit form
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));
  
    // Email should be invalid
    expect(screen.getByLabelText(/email/i)).toBeInvalid();
    // Success message should not appear
    expect(screen.queryByText("Message Sent Successfully!")).not.toBeInTheDocument();
  });
  
  it("validates message length", async () => {
    render(<ContactForm />);
  
    // Fill form with too short message
    await userEvent.type(screen.getByLabelText(/name/i), "Test User");
    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/message/i), "Too short");
  
    // Submit form
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));
  
    // Message should be invalid if there's minLength validation
    expect(screen.getByLabelText(/message/i)).toBeInvalid();
    // Success message should not appear
    expect(screen.queryByText("Message Sent Successfully!")).not.toBeInTheDocument();
  });
  
  it("disables the submit button during submission", async () => {
    // Mock fetch to simulate a slow network
    global.fetch = jest.fn().mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true }),
        }), 1000)
      )
    );
  
    render(<ContactForm />);
  
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/name/i), "Test User");
    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/message/i), "Test message");
  
    // Submit the form
    const submitButton = screen.getByRole("button", { name: /send message/i });
    await userEvent.click(submitButton);
  
    // Button should be disabled with loading text
    expect(submitButton).toBeDisabled();
    expect(screen.getByText("Sending...")).toBeInTheDocument();
  });
});