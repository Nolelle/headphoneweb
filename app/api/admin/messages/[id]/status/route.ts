// app/api/admin/messages/[id]/status/route.ts
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import pool from "@/db/helpers/db";

// Update the PATCH handler to work with Next.js 15 Promise-based params
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Extract the message ID from params (Next.js 15 makes params a Promise)
  const { id: messageId } = await params;

  try {
    const { status } = await request.json();

    // Validate status value to match the contact_message table constraints
    if (!["UNREAD", "READ", "RESPONDED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Update message status in database
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const query = `
        UPDATE contact_message
        SET 
          status = $1,
          updated_at = NOW()
        WHERE message_id = $2
        RETURNING *
      `;

      const result = await client.query(query, [status, messageId]);

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Message not found" },
          { status: 404 }
        );
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: result.rows[0]
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error updating message status:", err);
      return NextResponse.json(
        {
          error: "Failed to update message status",
          details: err instanceof Error ? err.message : String(err)
        },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error parsing request:", err);
    return NextResponse.json(
      {
        error: "Invalid request data",
        details: err instanceof Error ? err.message : String(err)
      },
      { status: 400 }
    );
  }
}
