import { POST } from "@/app/api/contact/route";
import pool from "@/db/helpers/db";

// Mock the database pool
jest.mock("@/db/helpers/db", () => ({
  query: jest.fn()
}));

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      data,
      status: options?.status || 200
    }))
  }
}));

describe("Contact API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Silence console.error
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error
    jest.restoreAllMocks();
  });

  it("should return 400 if email is missing", async () => {
    const request = {
      json: jest.fn().mockResolvedValue({
        name: "Test User",
        message: "This is a test message"
      })
    };
    const response = await POST(request as unknown as Request);
    expect(response.status).toBe(400);
    expect(response.data.error).toBe("Email and message are required");
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("should return 400 if message is missing", async () => {
    const request = {
      json: jest.fn().mockResolvedValue({
        name: "Test User",
        email: "test@example.com"
      })
    };
    const response = await POST(request as unknown as Request);
    expect(response.status).toBe(400);
    expect(response.data.error).toBe("Email and message are required");
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("should successfully insert a valid contact message", async () => {
    const mockMessageId = 123;
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ message_id: mockMessageId }]
    });
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        name: "Test User",
        email: "test@example.com",
        message: "This is a test message"
      })
    };
    const response = await POST(mockRequest as unknown as Request);
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.messageId).toBe(mockMessageId);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO contact_message"),
      ["Test User", "test@example.com", "This is a test message"]
    );
  });

  it("should handle database errors", async () => {
    (pool.query as jest.Mock).mockRejectedValue(new Error("Database error"));
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        name: "Test User",
        email: "test@example.com",
        message: "This is a test message"
      })
    };
    const response = await POST(mockRequest as unknown as Request);
    expect(response.status).toBe(500);
    expect(response.data.error).toBe("Failed to save message");
  });
});
