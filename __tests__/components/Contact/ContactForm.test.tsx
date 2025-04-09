import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactForm from "@/app/components/Contact/ContactForm";
import "@testing-library/jest-dom";
import { expect, jest } from "@jest/globals";

describe("ContactForm Component", () => {
  it("submits form with valid input", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true })
    });

    render(<ContactForm />);

    await userEvent.type(screen.getByTestId("name-input"), "Test User");
    await userEvent.type(screen.getByTestId("email-input"), "test@example.com");
    await userEvent.type(screen.getByTestId("message-input"), "Test message");

    await userEvent.click(screen.getByTestId("send-button"));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/contact",
      expect.any(Object)
    );
    expect(screen.getByText("Message Sent Successfully!")).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    render(<ContactForm />);

    await userEvent.click(screen.getByTestId("send-button"));

    expect(screen.getByText("All fields are required")).toBeInTheDocument();
  });

  it("handles server errors gracefully", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "Server error" })
    });

    render(<ContactForm />);

    await userEvent.type(screen.getByTestId("name-input"), "Test User");
    await userEvent.type(screen.getByTestId("email-input"), "test@example.com");
    await userEvent.type(screen.getByTestId("message-input"), "Test message");

    await userEvent.click(screen.getByTestId("send-button"));

    expect(screen.getByText("Server error")).toBeInTheDocument();
  });

  it("validates email format", async () => {
    render(<ContactForm />);

    await userEvent.type(screen.getByTestId("name-input"), "Test User");
    await userEvent.type(screen.getByTestId("email-input"), "invalid-email");
    await userEvent.type(screen.getByTestId("message-input"), "Test message");

    await userEvent.click(screen.getByTestId("send-button"));

    expect(screen.getByTestId("email-input")).toBeInvalid();
    expect(
      screen.queryByText("Message Sent Successfully!")
    ).not.toBeInTheDocument();
  });

  it("validates message length", async () => {
    render(<ContactForm />);

    await userEvent.type(screen.getByTestId("name-input"), "Test User");
    await userEvent.type(screen.getByTestId("email-input"), "test@example.com");
    await userEvent.type(screen.getByTestId("message-input"), "Too short"); // 9 characters

    await userEvent.click(screen.getByTestId("send-button"));

    await waitFor(() => {
      expect(
        screen.getByText("Message must be at least 10 characters long")
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText("Message Sent Successfully!")
    ).not.toBeInTheDocument();
  });

  it("disables the submit button during submission", async () => {
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: jest.fn().mockResolvedValue({ success: true })
              }),
            1000
          )
        )
    );

    render(<ContactForm />);

    await userEvent.type(screen.getByTestId("name-input"), "Test User");
    await userEvent.type(screen.getByTestId("email-input"), "test@example.com");
    await userEvent.type(screen.getByTestId("message-input"), "Test message");

    const submitButton = screen.getByTestId("send-button");
    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText("Sending...")).toBeInTheDocument();

    // Verify the sending-button state
    await waitFor(() => {
      expect(screen.getByTestId("sending-button")).toBeInTheDocument();
    });
  });
});
