import pool from "@/db/helpers/db";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    console.log("Received login request:", { username, password });
    console.log("Attempting login with username:", username);

    const result = await pool.query(
      "SELECT admin_id, password_hash FROM admin WHERE username = $1",
      [username]
    );
    console.log("Database query completed. Found rows:", result.rows.length);

    if (result.rows.length === 0) {
      console.log("User not found in the database");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const admin = result.rows[0];
    console.log("Found admin user with ID:", admin.admin_id);
    console.log("Stored password hash:", admin.password_hash);

    const validPassword = await bcrypt.compare(password, admin.password_hash);
    console.log("Password comparison result:", validPassword);
    console.log("Password validation result:", validPassword);

    if (!validPassword) {
      console.log("Password validation failed");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Set a secure HTTP-only cookie for auth using NextResponse.cookies
    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_session", admin.admin_id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 // 24 hours
    });

    console.log("Login successful, set admin session cookie");
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
