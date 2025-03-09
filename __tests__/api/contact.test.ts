// Import Jest utilities first
import { jest, expect, describe, it, beforeEach } from "@jest/globals";

// Import the module to test after mocks are set up
import { POST } from "@/app/api/contact/route";

// Define response types
interface ContactMessageResponse {
  success?: boolean;
  messageId?: number;
  error?: string;
}

interface ApiResponse {
  body: ContactMessageResponse;
  options?: { status?: number };
  json: () => Promise<ContactMessageResponse>;
  status: number;
}

// Mock NextResponse
jest.mock("next/server", () => {
  const mockJson = jest.fn(
    (
      body: ContactMessageResponse,
      options?: { status?: number }
    ): ApiResponse => ({
      body,
      options,
      json: async () => body,
      status: options?.status || 200
    })
  );
  return {
    NextResponse: {
      json: mockJson
    }
  };
});

// Mock DB helper inline to avoid hoisting issues
jest.mock("@/db/helpers/db", () => ({
  default: {
    query: jest.fn().mockResolvedValue({ rows: [{ message_id: 1 }] })
  }
}));

// Add Mock Request class
class MockRequest {
  constructor(url, options) {
    this.url = url;
    this.method = options.method || "GET";
    this.headers = options.headers || {};
    this.body = options.body || null;
  }

  async json() {
    return JSON.parse(this.body);
  }
}

global.Request = MockRequest;

// Test suite
describe("Contact API Route", () => {
  let mockQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    // Access the mocked query function directly from the mock
    mockQuery = jest.requireMock("@/db/helpers/db").default.query;
  });

  it("saves valid contact messages", async () => {
    const req = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        message: "Test message"
      })
    });

    const response = (await POST(req)) as ApiResponse;
    const result = await response.json();

    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [
      "Test User",
      "test@example.com",
      "Test message"
    ]);
    expect(result).toEqual({ success: true, messageId: 1 });
    expect(response.status).toBe(201);
  });

  it("validates required fields", async () => {
    const req = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Test User",
        email: "", // Missing email
        message: "Test message"
      })
    });

    const response = (await POST(req)) as ApiResponse;
    const result = await response.json();

    expect(result).toEqual({ error: "Email and message are required" });
    expect(response.status).toBe(400);
  });
});
