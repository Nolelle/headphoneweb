// app/api/contact/route.ts
import pool from "@/db/helpers/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { name, email, message } = body;

    // Sanitize inputs by trimming whitespace
    name = name ? name.trim() : name;
    email = email ? email.trim() : email;
    message = message ? message.trim() : message;

    // Convert email to lowercase for normalization
    email = email ? email.toLowerCase() : email;

    // Validate required fields
    if (!email || !message) {
      return NextResponse.json(
        { error: "Email and message are required" },
        { status: 400 }
      );
    }

    // Insert into database
    const query = `
      INSERT INTO contact_message (name, email, message)
      VALUES ($1, $2, $3)
      RETURNING message_id
    `;

    const result = await pool.query(query, [name, email, message]);

    return NextResponse.json(
      { success: true, messageId: result.rows[0].message_id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving contact message:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}
