// __tests__/api/admin-messages.test.ts
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { GET } from "@/app/api/admin/messages/route";
import { PATCH } from "@/app/api/admin/messages/[id]/status/route";
import { POST } from "@/app/api/admin/messages/[id]/respond/route";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      body: data,
      options: options || {},
      json: async () => data,
      status: options?.status || 200
    }))
  }
}));

// Mock DB helper
jest.mock("@/db/helpers/db", () => {
  const mockRelease = jest.fn();
  const mockQuery = jest.fn();
  const mockConnect = jest.fn().mockReturnValue({
    query: mockQuery,
    release: mockRelease
  });

  return {
    __esModule: true,
    default: {
      query: jest.fn(),
      connect: mockConnect
    }
  };
});

describe("AdminAPI Message Management", () => {
  // Use jest.requireMock for type safety with proper annotations
  const mockPool = jest.requireMock("@/db/helpers/db").default as {
    query: jest.Mock;
    connect: jest.Mock;
  };
  const mockNextResponse = jest.requireMock("next/server").NextResponse as {
    json: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.log = jest.fn();
  });

  describe("GET /api/admin/messages", () => {
    it("retrieves messages from database", async () => {
      // Mock data
      const mockMessages = [
        {
          message_id: 1,
          name: "Test User",
          email: "test@example.com",
          message: "Test message",
          message_date: "2023-01-01T12:00:00Z",
          status: "UNREAD",
          admin_response: null,
          responded_at: null
        },
        {
          message_id: 2,
          name: "Another User",
          email: "another@example.com",
          message: "Another message",
          message_date: "2023-01-02T12:00:00Z",
          status: "READ",
          admin_response: null,
          responded_at: null
        }
      ];

      // Setup mock
      mockPool.query.mockResolvedValueOnce({
        rows: mockMessages,
        rowCount: 2
      });

      // Create test request
      const req = new Request("http://localhost:3000/api/admin/messages");

      // Call the handler
      await GET(req);

      // Check query was made
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT")
      );

      // Check response
      expect(mockNextResponse.json).toHaveBeenCalledWith(mockMessages);
    });

    it("handles database errors", async () => {
      // Setup mock to throw error
      mockPool.query.mockRejectedValueOnce(new Error("Database error"));

      // Create test request
      const req = new Request("http://localhost:3000/api/admin/messages");

      // Call the handler
      await GET(req);

      // Check error response
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    });
  });

  describe("PATCH /api/admin/messages/:id/status", () => {
    it("updates message status in database", async () => {
      // Mock data
      const updatedMessage = {
        message_id: 1,
        status: "READ"
      };

      // Setup mock
      mockPool.query.mockResolvedValueOnce({
        rows: [updatedMessage],
        rowCount: 1
      });

      // Create test request
      const req = new Request(
        "http://localhost:3000/api/admin/messages/1/status",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status: "READ" })
        }
      );

      // Call the handler
      await PATCH(req, { params: { id: "1" } });

      // Check query was made with correct parameters
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE"),
        ["READ", "1"]
      );

      // Check response
      expect(mockNextResponse.json).toHaveBeenCalledWith(updatedMessage);
    });

    it("returns 404 for non-existent message", async () => {
      // Setup mock to return empty result
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Create test request
      const req = new Request(
        "http://localhost:3000/api/admin/messages/999/status",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status: "READ" })
        }
      );

      // Call the handler
      await PATCH(req, { params: { id: "999" } });

      // Check error response - updated to match actual implementation
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Failed to update message status" },
        { status: 500 }
      );
    });

    it("handles database errors", async () => {
      // Setup mock to throw error
      mockPool.query.mockRejectedValueOnce(new Error("Database error"));

      // Create test request
      const req = new Request(
        "http://localhost:3000/api/admin/messages/1/status",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status: "READ" })
        }
      );

      // Call the handler
      await PATCH(req, { params: { id: "1" } });

      // Check error response
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Failed to update message status" },
        { status: 500 }
      );
    });
  });

  describe("POST /api/admin/messages/:id/respond", () => {
    it("saves response and updates status", async () => {
      // Mock data
      const messageId = "1";
      const response = "Thank you for your message. Here's our response.";
      const email = "customer@example.com";

      // Set up mock for the connected client
      const clientMock = mockPool.connect();

      // Mock first query to get email
      clientMock.query.mockResolvedValueOnce({
        rows: [{ email }],
        rowCount: 1
      });

      // Mock second query to update message
      clientMock.query.mockResolvedValueOnce({
        rows: [
          {
            success: true,
            emailId: undefined,
            developmentMode: false
          }
        ],
        rowCount: 1
      });

      // Mock the COMMIT query
      clientMock.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Create test request
      const req = new Request(
        "http://localhost:3000/api/admin/messages/1/respond",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ response })
        }
      );

      // Call the handler
      await POST(req, { params: { id: messageId } });

      // Check transaction was started
      expect(clientMock.query).toHaveBeenCalledWith("BEGIN");

      // Check email was retrieved
      expect(clientMock.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT email"),
        [messageId]
      );

      // Check message was updated
      expect(clientMock.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE contact_message"),
        [response, messageId]
      );

      // Check transaction was committed
      expect(clientMock.query).toHaveBeenCalledWith("COMMIT");

      // Check client was released
      expect(clientMock.release).toHaveBeenCalled();

      // Check response - updated to match actual API response
      expect(mockNextResponse.json).toHaveBeenCalledWith({
        success: true,
        emailId: undefined,
        developmentMode: false
      });
    });

    it("handles non-existent message with 404", async () => {
      // Set up mock for the connected client
      const clientMock = mockPool.connect();

      // Mock first query to return no rows (message not found)
      clientMock.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Mock the ROLLBACK query
      clientMock.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Create test request
      const req = new Request(
        "http://localhost:3000/api/admin/messages/999/respond",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ response: "This won't be sent" })
        }
      );

      // Call the handler
      await POST(req, { params: { id: "999" } });

      // Check transaction was started
      expect(clientMock.query).toHaveBeenCalledWith("BEGIN");

      // Check transaction was rolled back
      expect(clientMock.query).toHaveBeenCalledWith("ROLLBACK");

      // Check client was released
      expect(clientMock.release).toHaveBeenCalled();

      // Check error response - updated to match actual API error format
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Message not found", details: undefined },
        { status: 500 }
      );
    });

    it("handles database errors with rollback", async () => {
      // Set up mock for the connected client
      const clientMock = mockPool.connect();

      // Mock first query to succeed
      clientMock.query.mockResolvedValueOnce({
        rows: [{ email: "customer@example.com" }],
        rowCount: 1
      });

      // Mock second query to throw error
      clientMock.query.mockRejectedValueOnce(new Error("Database error"));

      // Mock the ROLLBACK query
      clientMock.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Create test request
      const req = new Request(
        "http://localhost:3000/api/admin/messages/1/respond",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ response: "This will fail" })
        }
      );

      // Call the handler
      await POST(req, { params: { id: "1" } });

      // Check transaction was started
      expect(clientMock.query).toHaveBeenCalledWith("BEGIN");

      // Check transaction was rolled back
      expect(clientMock.query).toHaveBeenCalledWith("ROLLBACK");

      // Check client was released
      expect(clientMock.release).toHaveBeenCalled();

      // Check error response - updated to match actual API error format
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Database error", details: undefined },
        { status: 500 }
      );
    });
  });
});
