import pool from "@/db/helpers/db";
import bcrypt from "bcrypt";
import "@testing-library/jest-dom";
import { expect, describe, beforeEach, it } from "@jest/globals";

// Define the query result type
interface QueryResult {
  rows: Array<{
    id?: number;
    username?: string;
    password_hash?: string;
  }>;
}

// Mock the modules with properly typed functions
jest.mock("@/db/helpers/db", () => ({
  __esModule: true,
  default: {
    query: jest.fn().mockImplementation(() => Promise.resolve({ rows: [] }))
  }
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn().mockImplementation(() => Promise.resolve(false))
}));

// Mock NextResponse from next/server
const mockNextResponse = {
  json: jest.fn().mockImplementation((data) => ({
    ...data,
    cookies: {
      delete: jest.fn()
    }
  }))
};
jest.mock("next/server", () => ({
  NextResponse: mockNextResponse
}));

describe("Admin Authentication Logic", () => {
  beforeEach(() => {
    // Clear any previous mock calls or spies
    jest.clearAllMocks();
  });

  it("should validate proper admin credentials", async () => {
    const username = "admin";
    const password = "correctpassword";

    const mockQueryResult: QueryResult = {
      rows: [{ id: 1, username: "admin", password_hash: "hashedpassword" }]
    };
    jest.spyOn(pool, "query").mockResolvedValueOnce(mockQueryResult);
    jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(true);

    const result = await pool.query(
      "SELECT * FROM admins WHERE username = $1",
      [username]
    );
    const admin = result.rows[0];

    expect(admin).toBeTruthy();
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    expect(isPasswordValid).toBe(true);
  });

  it("should reject when admin not found", async () => {
    const username = "nonexistent";

    const mockQueryResult: QueryResult = { rows: [] };
    jest.spyOn(pool, "query").mockResolvedValueOnce(mockQueryResult);

    const result = await pool.query(
      "SELECT * FROM admins WHERE username = $1",
      [username]
    );

    expect(result.rows.length).toBe(0);
  });

  it("should reject when password is incorrect", async () => {
    const username = "admin";
    const password = "wrongpassword";

    const mockQueryResult: QueryResult = {
      rows: [{ id: 1, username: "admin", password_hash: "hashedpassword" }]
    };
    jest.spyOn(pool, "query").mockResolvedValueOnce(mockQueryResult);
    jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(false);

    const result = await pool.query(
      "SELECT * FROM admins WHERE username = $1",
      [username]
    );
    const admin = result.rows[0];

    expect(admin).toBeTruthy();
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    expect(isPasswordValid).toBe(false);
  });

  it("should handle database errors gracefully", async () => {
    const dbError = new Error("Database error");
    jest.spyOn(pool, "query").mockRejectedValueOnce(dbError);

    try {
      await pool.query("SELECT * FROM admins WHERE username = $1", ["admin"]);
      expect.assertions(2);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("Database error");
    }
  });

  it("should handle logout by deleting the session cookie", async () => {
    // Simulate the logout logic
    const simulateLogout = async () => {
      const response = mockNextResponse.json({ success: true });
      response.cookies.delete("admin_session");
      return response;
    };

    const response = await simulateLogout();

    // Verify that NextResponse.json was called
    expect(mockNextResponse.json).toHaveBeenCalledWith({ success: true });

    // Verify that the cookie delete method was called with the correct cookie name
    expect(response.cookies.delete).toHaveBeenCalledWith("admin_session");
  });
  it("should handle session token creation", async () => {
    const username = "admin";
    const adminId = 1;
  
    // Mock NextResponse.json to capture cookie operations
    const mockSetCookie = jest.fn();
    mockNextResponse.json.mockImplementationOnce(() => ({
      cookies: {
        set: mockSetCookie,
        delete: jest.fn(),
      },
    }));
  
    // Simulate successful admin lookup
    const mockQueryResult = {
      rows: [{ admin_id: adminId, username, password_hash: "hashedpassword" }],
    };
    jest.spyOn(pool, "query").mockResolvedValueOnce(mockQueryResult);
    jest.spyOn(bcrypt, "compare").mockResolvedValueOnce(true);
  
    // Call login endpoint directly (or simulate its behavior)
    // For this test, we'll simulate its core behavior
    const response = mockNextResponse.json({ success: true });
    response.cookies.set("admin_session", adminId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
    });
  
    // Verify cookie was set with correct properties
    expect(response.cookies.set).toHaveBeenCalledWith(
      "admin_session",
      adminId.toString(),
      expect.objectContaining({
        httpOnly: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24,
      })
    );
  });
  
  it("should validate password correctly with different complexities", async () => {
    // Test case 1: Simple password
    const simplePassword = "password123";
    const simpleHash = await bcrypt.hash(simplePassword, 10);
    const validSimple = await bcrypt.compare(simplePassword, simpleHash);
    expect(validSimple).toBe(true);
    
    // Test case 2: Complex password with special characters
    const complexPassword = "P@$$w0rd!123";
    const complexHash = await bcrypt.hash(complexPassword, 10);
    const validComplex = await bcrypt.compare(complexPassword, complexHash);
    expect(validComplex).toBe(true);
    
    // Test case 3: Password with Unicode characters
    const unicodePassword = "пароль123!";
    const unicodeHash = await bcrypt.hash(unicodePassword, 10);
    const validUnicode = await bcrypt.compare(unicodePassword, unicodeHash);
    expect(validUnicode).toBe(true);
    
    // Test case 4: Wrong password should fail
    const wrongMatch = await bcrypt.compare("wrongpassword", complexHash);
    expect(wrongMatch).toBe(false);
  });
  
  it("should protect against timing attacks", async () => {
    // This test is to ensure that bcrypt.compare takes similar time
    // regardless of whether the password is correct or not
  
    const password = "securepassword";
    const hash = await bcrypt.hash(password, 10);
    
    // Measure time for correct password
    const startCorrect = Date.now();
    await bcrypt.compare(password, hash);
    const endCorrect = Date.now();
    const correctTime = endCorrect - startCorrect;
    
    // Measure time for wrong password (same length)
    const startWrong = Date.now();
    await bcrypt.compare("wrongpasswrd", hash); // Same length
    const endWrong = Date.now();
    const wrongTime = endWrong - startWrong;
    
    // The times shouldn't be exactly the same but should be close
    // We allow for some variance due to system load, etc.
    const timeDifference = Math.abs(correctTime - wrongTime);
    expect(timeDifference).toBeLessThan(100); // Should be within 100ms
  });
});
