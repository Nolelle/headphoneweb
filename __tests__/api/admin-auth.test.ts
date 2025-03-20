// __tests__/api/admin-auth.test.ts
import { jest, expect, describe, it, beforeEach } from "@jest/globals";
import { POST as loginPOST } from "@/app/api/admin/login/route";
import { POST as logoutPOST } from "@/app/api/admin/logout/route";

// Mock NextResponse
jest.mock("next/server", () => {
  const mockSetCookie = jest.fn();
  return {
    NextResponse: {
      json: jest.fn((data, options) => ({
        body: data,
        options: options || {},
        cookies: {
          set: mockSetCookie,
          delete: jest.fn()
        },
        json: async () => data,
        status: options?.status || 200
      }))
    }
  };
});

// Mock bcrypt with both compare and hash functions
jest.mock("bcrypt", () => ({
  compare: jest
    .fn()
    .mockImplementation((plaintext, hash) =>
      Promise.resolve(plaintext === "admin123")
    ),
  hash: jest
    .fn()
    .mockImplementation((str, salt) => Promise.resolve(`hashed_${str}`))
}));

// Mock db pool
jest.mock("@/db/helpers/db", () => ({
  __esModule: true,
  default: {
    query: jest.fn()
  }
}));

describe("AdminAPI Authentication", () => {
  // Use jest.requireMock for type safety
  const mockPool = jest.requireMock("@/db/helpers/db").default;
  const mockBcrypt = jest.requireMock("bcrypt");
  const mockNextResponse = jest.requireMock("next/server").NextResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.log = jest.fn();
  });

  describe("POST /api/admin/login", () => {
    it("should create a session for valid login", async () => {
      // Mock DB response with a valid admin user
      mockPool.query.mockResolvedValueOnce({
        rows: [{ admin_id: 1, password_hash: "hashedpassword" }],
        rowCount: 1
      });

      // Mock bcrypt to return true for valid password
      mockBcrypt.compare.mockResolvedValueOnce(true);

      // Create test request
      const req = new Request("http://localhost:3000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: "admin",
          password: "admin123"
        })
      });

      // Call the handler
      await loginPOST(req);

      // Check DB was queried with correct username
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        ["admin"]
      );

      // Check password was compared
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        "admin123",
        "hashedpassword"
      );

      // Check response contains success flag
      expect(mockNextResponse.json).toHaveBeenCalledWith({ success: true });

      // Check cookie was set
      const cookieSet = mockNextResponse.json().cookies.set;
      expect(cookieSet).toHaveBeenCalledWith(
        "admin_session",
        "1",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "strict"
        })
      );
    });

    it("should reject invalid credentials with 401", async () => {
      // Mock DB response with no user found
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Create test request
      const req = new Request("http://localhost:3000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: "wrongadmin",
          password: "wrongpassword"
        })
      });

      // Call the handler
      await loginPOST(req);

      // Check response has error and 401 status
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    });

    it("should reject when password doesn't match", async () => {
      // Mock DB response with a valid user
      mockPool.query.mockResolvedValueOnce({
        rows: [{ admin_id: 1, password_hash: "hashedpassword" }],
        rowCount: 1
      });

      // Mock bcrypt to return false for invalid password
      mockBcrypt.compare.mockResolvedValueOnce(false);

      // Create test request
      const req = new Request("http://localhost:3000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: "admin",
          password: "wrongpassword"
        })
      });

      // Call the handler
      await loginPOST(req);

      // Check response has error and 401 status
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    });

    it("should handle server errors", async () => {
      // Mock DB query to throw error
      mockPool.query.mockRejectedValueOnce(new Error("Database error"));

      // Create test request
      const req = new Request("http://localhost:3000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: "admin",
          password: "admin123"
        })
      });

      // Call the handler
      await loginPOST(req);

      // Check response has error and 500 status
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: "Login failed" },
        { status: 500 }
      );
    });
  });

  describe("POST /api/admin/logout", () => {
    it("should invalidate the session", async () => {
      // Create test request
      const req = new Request("http://localhost:3000/api/admin/logout", {
        method: "POST"
      });

      // Mock NextResponse.json to include a cookie delete method
      mockNextResponse.json.mockImplementationOnce((data: any) => ({
        cookies: {
          set: jest.fn(),
          delete: jest.fn()
        },
        body: data
      }));

      // Call the handler - don't actually send the request
      const response = await logoutPOST();

      // Check cookie was deleted
      expect(response.cookies.delete).toHaveBeenCalledWith("admin_session");

      // Check success response
      expect(mockNextResponse.json).toHaveBeenCalledWith({ success: true });
    });
  });
});
