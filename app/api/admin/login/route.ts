import pool from "@/db/helpers/db";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    console.log("Received login request:", { username, password });

    const result = await pool.query(
      "SELECT admin_id, password_hash FROM admin WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      console.log("User not found in the database");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const admin = result.rows[0];
    console.log("Retrieved admin user:", admin);

    const validPassword = await bcrypt.compare(password, admin.password_hash);
    console.log("Password comparison result:", validPassword);

    if (!validPassword) {
      console.log("Invalid password");
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
