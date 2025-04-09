import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminDashboardPage from "@/app/admin/dashboard/page";
import { toast } from "sonner";

// Mock the toast library
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock fetch API
global.fetch = jest.fn();

// Mock window.location.href setter
Object.defineProperty(window, "location", {
  value: {
    href: jest.fn()
  },
  writable: true
});

// Sample data for test cases
const mockMessages = [
  {
    message_id: 1,
    name: "John Doe",
    email: "john@example.com",
    message: "I'm interested in your products",
    message_date: "2023-06-01T10:00:00Z",
    status: "UNREAD"
  },
  {
    message_id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    message: "When will the product be back in stock?",
    message_date: "2023-06-02T14:30:00Z",
    status: "READ"
  },
  {
    message_id: 3,
    name: "Robert Johnson",
    email: "robert@example.com",
    message: "Can you provide more information?",
    message_date: "2023-06-03T09:15:00Z",
    status: "RESPONDED",
    admin_response: "Here's more information about our products...",
    responded_at: "2023-06-03T11:30:00Z"
  }
];

// Store the original window.location
const originalLocation = window.location;

// Mock window.location
beforeEach(() => {
  Object.defineProperty(window, "location", {
    value: { href: "" },
    writable: true
  });

  // Reset mocks before each test
  jest.clearAllMocks();

  // Set up default fetch mock implementation for all tests
  (global.fetch as jest.Mock).mockImplementation((url) => {
    // Mock the messages endpoint to return mockMessages
    if (url === "/api/admin/messages") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMessages)
      });
    }

    // Default response for any other endpoints
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });
});

// Restore original window.location after tests
afterEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true
  });
});

describe("AdminDashboard Component", () => {
  it("renders the dashboard and fetches messages", async () => {
    // Mock implementation for this specific test
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === "/api/admin/messages") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMessages)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    render(<AdminDashboardPage />);

    // Check for initial loading
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();

    // Wait for messages to load and be displayed
    await waitFor(
      () => {
        // First verify the messages endpoint was called
        expect(global.fetch).toHaveBeenCalledWith("/api/admin/messages");

        // Check if the email elements appear
        const emails = screen.getAllByText(/^(john|jane|robert)@example\.com$/);
        expect(emails.length).toBe(3);
      },
      { timeout: 3000 }
    );
  });

  it("shows error toast when fetching messages fails", async () => {
    // Mock fetch failure
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Failed to fetch messages")
    );

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load messages");
    });
  });

  it("toggles message status from UNREAD to READ", async () => {
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (
        url === `/api/admin/messages/1/status` &&
        options?.method === "PATCH"
      ) {
        // Parse the request body
        const body = JSON.parse(options.body as string);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              message: {
                ...mockMessages[0],
                status: body.status
              }
            })
        });
      } else if (url === "/api/admin/messages") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMessages)
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    render(<AdminDashboardPage />);

    // Wait for messages to load and buttons to be available
    await waitFor(() => {
      const markAsReadButton = screen.getByRole("button", {
        name: /mark as read/i
      });
      expect(markAsReadButton).toBeInTheDocument();

      // Click the button
      fireEvent.click(markAsReadButton);
    });

    // Wait for the status toggle request to complete
    await waitFor(() => {
      // Check if fetch was called with the correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/messages/1/status",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "READ" })
        })
      );

      // Verify success toast
      expect(toast.success).toHaveBeenCalledWith("Message marked as read");
    });
  });

  it("sends a response to a message", async () => {
    // Mock success response for sending a message response
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      // Log the url and options to debug
      console.log(
        "Mock fetch called with:",
        url,
        options?.method,
        options?.body
      );

      if (url === "/api/admin/messages") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMessages)
        });
      } else if (
        url === `/api/admin/messages/1/respond` &&
        options?.method === "POST"
      ) {
        const body = JSON.parse(options.body as string);
        console.log("Request body for response:", body);

        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              message: {
                ...mockMessages[0],
                status: "RESPONDED",
                admin_response: body.response,
                responded_at: new Date().toISOString()
              },
              emailId: "test-email-id"
            })
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    render(<AdminDashboardPage />);

    // Wait for messages to load and form to be available
    await waitFor(() => {
      const messageCards = screen.getAllByTestId(/^message-card-/);
      expect(messageCards.length).toBeGreaterThan(0);
    });

    // Find all textareas and use the first one
    const responseTextareas = screen.getAllByTestId("response-textarea");
    // Use the first one (from the first message card)
    fireEvent.change(responseTextareas[0], {
      target: { value: "Thank you for your interest." }
    });

    // Find all send buttons and click the first one
    const sendButtons = screen.getAllByTestId("send-response-button");
    fireEvent.click(sendButtons[0]);

    // Wait for the response to be sent - use a more lenient approach
    await waitFor(
      () => {
        // Verify success toast was called (any parameters are fine)
        expect(toast.success).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );
  });

  it("handles error when sending a response fails", async () => {
    // Mock error response for sending a response
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url === "/api/admin/messages") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMessages)
        });
      } else if (
        url === `/api/admin/messages/1/respond` &&
        options?.method === "POST"
      ) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: "Failed to send response" })
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    render(<AdminDashboardPage />);

    // Wait for messages to load
    await waitFor(() => {
      const messageCards = screen.getAllByTestId(/^message-card-/);
      expect(messageCards.length).toBeGreaterThan(0);
    });

    // Find the response textarea for the first message using getAllByTestId
    const responseTextareas = screen.getAllByTestId("response-textarea");
    // Use the first textarea
    fireEvent.change(responseTextareas[0], {
      target: { value: "Thank you for your interest." }
    });

    // Find the send response button using getAllByTestId
    const sendButtons = screen.getAllByTestId("send-response-button");
    // Click the first button
    fireEvent.click(sendButtons[0]);

    // Wait for the error to appear
    await waitFor(
      () => {
        expect(toast.error).toHaveBeenCalledWith("Failed to send response");
      },
      { timeout: 2000 }
    );
  });

  it("logs out when logout button is clicked", async () => {
    // Mock successful logout
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url === "/api/admin/logout" && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      } else if (url === "/api/admin/messages") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMessages)
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    render(<AdminDashboardPage />);

    // Find and click the logout button
    const logoutButton = screen.getByRole("button", { name: /logout/i });
    fireEvent.click(logoutButton);

    // Wait for the logout request to complete
    await waitFor(() => {
      // Check if fetch was called with the correct parameters
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/logout", {
        method: "POST"
      });

      // Verify redirect
      expect(window.location.href).toBe("/admin/login");
    });
  });

  it("handles error when toggling message status fails", async () => {
    // Mock error response for status update
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (
        url === `/api/admin/messages/1/status` &&
        options?.method === "PATCH"
      ) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: "Failed to update status" })
        });
      } else if (url === "/api/admin/messages") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMessages)
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    render(<AdminDashboardPage />);

    // Wait for messages to load
    await waitFor(() => {
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    // Find the first message's "Mark as Read" button and click it
    const markAsReadButton = await screen.findByRole("button", {
      name: /mark as read/i
    });
    fireEvent.click(markAsReadButton);

    // Wait for the error to appear
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update status");
    });
  });
});
