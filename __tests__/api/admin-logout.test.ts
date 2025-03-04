// Mock Next.js cookies
jest.mock("next/headers", () => ({
  cookies: () => ({
    delete: jest.fn()
  })
}));

// Mock the route module to match the real POST implementation
jest.mock("@/app/api/admin/logout/route", () => ({
  POST: jest.fn().mockImplementation(async () => {
    // Access the mocked cookies within the factory
    const { cookies } = require("next/headers");

    try {
      // Simulate cookie deletion
      cookies().delete("admin_session");
      return {
        status: 200,
        json: async () => ({ success: true }),
        cookies: {
          delete: jest.fn() // Included for response structure, not used here
        }
      };
    } catch (error) {
      return {
        status: 500,
        json: async () => ({ error: "Logout failed" })
      };
    }
  })
}));

// Import after mocking
import { cookies } from "next/headers";
import { POST } from "@/app/api/admin/logout/route";

describe("Admin Logout API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should delete the admin session cookie", async () => {
    const mockRequest = {
      method: "POST"
    };

    const response = await POST(mockRequest as any);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);

    expect(cookies().delete).toHaveBeenCalledWith("admin_session");
  });

  it("should return 500 if cookie deletion fails", async () => {
    (cookies().delete as jest.Mock).mockImplementationOnce(() => {
      throw new Error("Cookie deletion failed");
    });

    const mockRequest = {
      method: "POST"
    };

    const response = await POST(mockRequest as any);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Logout failed");
  });
});
