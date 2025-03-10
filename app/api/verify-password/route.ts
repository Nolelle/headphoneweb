import { NextResponse } from "next/server";

const SITE_PASSWORD = process.env.SITE_PASSWORD || "mypassword"; // Change this in production
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password === SITE_PASSWORD) {
      // Create response first, then set cookie on the response
      const response = NextResponse.json({ success: true });

      // Set cookie on the response object
      response.cookies.set("site_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: new Date(Date.now() + SESSION_DURATION),
        path: "/"
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch (err) {
    console.error("Password verification error:", err);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
