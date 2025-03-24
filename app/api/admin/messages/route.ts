// app/api/admin/messages/route.ts
import { NextResponse } from "next/server";
import pool from "@/db/helpers/db";

// GET /api/admin/messages - Fetch all messages
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT 
        message_id,
        name,
        email,
        message,
        message_date,
        status,
        admin_response,
        responded_at
       FROM contact_message 
       ORDER BY message_date DESC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
