// app/api/cart/remove/route.ts
import { NextResponse } from "next/server";
import pool from "@/db/helpers/db";

export async function DELETE(request: Request) {
  try {
    const { sessionId, cartItemId } = await request.json();

    // Validate input
    if (!sessionId || !cartItemId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verify session ownership and delete cart item
      const deleteResult = await client.query(
        `DELETE FROM cart_items ci
         USING cart_session cs
         WHERE ci.session_id = cs.session_id
         AND cs.user_identifier = $1
         AND ci.cart_item_id = $2
         RETURNING ci.cart_item_id`,
        [sessionId, cartItemId]
      );

      if (deleteResult.rows.length === 0) {
        throw new Error("Cart item not found or doesn't belong to session");
      }

      // Get updated cart
      const result = await client.query(
        `SELECT 
          ci.cart_item_id,
          ci.product_id,
          h.name,
          h.price,
          ci.quantity,
          h.stock_quantity,
          h.image_url
         FROM cart_items ci
         JOIN cart_session cs ON ci.session_id = cs.session_id
         JOIN headphones h ON ci.product_id = h.product_id
         WHERE cs.user_identifier = $1`,
        [sessionId]
      );

      await client.query("COMMIT");
      return NextResponse.json(result.rows);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to remove from cart"
      },
      { status: 500 }
    );
  }
}
