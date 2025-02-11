import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Create response that will clear the cookie
    const response = NextResponse.json({ success: true });

    // Clear the admin session cookie
    response.cookies.delete("admin_session");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
