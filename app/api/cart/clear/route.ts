// app/api/cart/clear/route.ts
import { NextResponse } from "next/server";
import pool from "@/db/helpers/db";

export async function DELETE(request: Request) {
  try {
    const { sessionId } = await request.json();

    // Validate input
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Delete all cart items for the session
      await client.query(
        `DELETE FROM cart_items ci
         USING cart_session cs
         WHERE ci.session_id = cs.session_id
         AND cs.user_identifier = $1`,
        [sessionId]
      );

      await client.query("COMMIT");
      return NextResponse.json({ success: true });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to clear cart"
      },
      { status: 500 }
    );
  }
}
