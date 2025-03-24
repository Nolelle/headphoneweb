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

// PATCH /api/admin/messages/[id]/status - Update message status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const messageId = params.id;

    const result = await pool.query(
      `UPDATE contact_message 
       SET status = $1
       WHERE message_id = $2
       RETURNING *`,
      [status, messageId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating message status:", error);
    return NextResponse.json(
      { error: "Failed to update message status" },
      { status: 500 }
    );
  }
}

// POST /api/admin/messages/[id]/respond - Respond to a message
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { response } = await request.json();
    const messageId = params.id;

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get the message to get the email address
      const messageResult = await client.query(
        `SELECT email FROM contact_message WHERE message_id = $1`,
        [messageId]
      );

      if (messageResult.rows.length === 0) {
        throw new Error("Message not found");
      }

      // Update the message with the response
      const result = await client.query(
        `UPDATE contact_message 
         SET admin_response = $1,
             responded_at = CURRENT_TIMESTAMP,
             status = 'RESPONDED'
         WHERE message_id = $2
         RETURNING *`,
        [response, messageId]
      );

      // Here you would typically send the email
      // For now we'll just log it
      console.log(`Would send email to: ${messageResult.rows[0].email}`);
      console.log(`Response: ${response}`);

      await client.query("COMMIT");
      return NextResponse.json(result.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error responding to message:", error);
    return NextResponse.json(
      { error: "Failed to send response" },
      { status: 500 }
    );
  }
}
