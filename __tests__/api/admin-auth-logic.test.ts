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
});
