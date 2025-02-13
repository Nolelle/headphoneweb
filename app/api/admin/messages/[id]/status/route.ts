// app/api/admin/messages/[id]/status/route.ts
import { NextResponse } from "next/server";
import pool from "@/db/helpers/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();

  try {
    const { status } = await request.json();
    const messageId = params.id;

    // Validate the message ID
    if (!messageId || isNaN(Number(messageId))) {
      return NextResponse.json(
        { error: "Invalid message ID" },
        { status: 400 }
      );
    }

    // Start transaction
    await client.query("BEGIN");

    // Get current message state
    const currentMessage = await client.query(
      `SELECT status FROM contact_message WHERE message_id = $1`,
      [messageId]
    );

    if (currentMessage.rows.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Validate status
    const validStatuses = ["UNREAD", "READ", "RESPONDED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Don't allow changing status of responded messages
    if (currentMessage.rows[0].status === "RESPONDED") {
      return NextResponse.json(
        { error: "Cannot change status of responded messages" },
        { status: 400 }
      );
    }

    // Update message status
    const result = await client.query(
      `UPDATE contact_message 
       SET status = $1
       WHERE message_id = $2
       RETURNING message_id, status, updated_at`,
      [status, messageId]
    );

    await client.query("COMMIT");

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating message status:", error);

    return NextResponse.json(
      { error: "Failed to update message status" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
