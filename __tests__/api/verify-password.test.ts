// __tests__/api/verify-password.test.ts
import {
  jest,
  expect,
  describe,
  it,
  beforeEach,
  afterEach
} from "@jest/globals";
import { POST } from "@/app/api/verify-password/route";

// Mock NextResponse
jest.mock("next/server", () => {
  const mockSetCookie = jest.fn();
  return {
    NextResponse: {
      json: jest.fn(() => ({
        cookies: {
          set: mockSetCookie
        }
      }))
    }
  };
});

describe("Site Password Verification", () => {
  // Store original console.error to restore later
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up environment variable
    process.env.SITE_PASSWORD = "mypassword";
  });

  afterEach(() => {
    // Restore console.error after each test
    console.error = originalConsoleError;
  });

  it("verifies correct password and sets cookie", async () => {
    // Create test request with correct password
    const req = new Request("http://localhost:3000/api/verify-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        password: "mypassword"
      })
    });

    const response = await POST(req);

    // Check response
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith({
      success: true
    });

    // Check that cookie was set
    const cookieSet = require("next/server").NextResponse.json().cookies.set;
    expect(cookieSet).toHaveBeenCalledWith(
      "site_session",
      "authenticated",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "strict",
        path: "/"
      })
    );
  });

  it("rejects incorrect password", async () => {
    // Mock NextResponse.json to handle error case
    require("next/server").NextResponse.json.mockImplementationOnce(
      (data, options) => ({
        body: data,
        options,
        json: async () => data,
        status: options?.status || 200
      })
    );

    // Create test request with wrong password
    const req = new Request("http://localhost:3000/api/verify-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        password: "wrongpassword"
      })
    });

    const response = await POST(req);

    // Check response has error and 401 status
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { error: "Invalid password" },
      { status: 401 }
    );
  });

  it("handles request parsing errors", async () => {
    // Mock console.error to prevent error output in test results
    console.error = jest.fn();

    // Mock NextResponse.json to handle error case
    require("next/server").NextResponse.json.mockImplementationOnce(
      (data, options) => ({
        body: data,
        options,
        json: async () => data,
        status: options?.status || 200
      })
    );

    // Create test request with invalid JSON
    const req = new Request("http://localhost:3000/api/verify-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: "invalid-json{"
    });

    // Mock request.json to throw error
    jest.spyOn(req, "json").mockRejectedValueOnce(new Error("Invalid JSON"));

    const response = await POST(req);

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      "Password verification error:",
      expect.any(Error)
    );

    // Check response has error and 500 status
    expect(require("next/server").NextResponse.json).toHaveBeenCalledWith(
      { error: "An error occurred" },
      { status: 500 }
    );
  });
});
