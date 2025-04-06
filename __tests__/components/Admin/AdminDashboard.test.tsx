import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminDashboard from "@/app/components/Admin/AdminDashboard";

describe("AdminDashboard", () => {
  const mockMessages = [
    {
      message_id: 1,
      name: "John Smith",
      email: "john@example.com",
      message: "Test message",
      message_date: "2023-01-01T12:00:00Z",
      status: "UNREAD"
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches and displays messages", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockMessages)
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
      expect(screen.getByText("Test message")).toBeInTheDocument();
      expect(screen.getByText("UNREAD")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/admin/messages");
  });

  it("toggles message read status", async () => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockMessages)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest
          .fn()
          .mockResolvedValue({
            status: "READ",
            updated_at: "2023-01-02T12:00:00Z"
          })
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("UNREAD")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Mark as Read"));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/messages/1/status",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "READ" })
      })
    );
  });

  it("sends response to message", async () => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockMessages)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          message: {
            admin_response: "Test response",
            status: "RESPONDED",
            responded_at: "2023-01-02T12:00:00Z"
          },
          emailSent: true
        })
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("response-textarea")).toBeInTheDocument();
    });

    await userEvent.type(
      screen.getByTestId("response-textarea"),
      "Test response"
    );
    await userEvent.click(screen.getByText("Send Response"));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/messages/1/respond",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: "Test response" })
      })
    );
  });
});
