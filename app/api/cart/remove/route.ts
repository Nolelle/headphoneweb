import { NextResponse } from "next/server";
import pool from "@/db/helpers/db";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const cartItemId = searchParams.get("cartItemId");

    if (!sessionId || !cartItemId) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          details: { sessionId: !!sessionId, cartItemId: !!cartItemId }
        },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verify the item exists and belongs to the session
      const verifyResult = await client.query(
        `SELECT 1 FROM cart_items ci
         JOIN cart_session cs ON ci.session_id = cs.session_id
         WHERE cs.user_identifier = $1 AND ci.cart_item_id = $2`,
        [sessionId, cartItemId]
      );

      if (verifyResult.rowCount === 0) {
        return NextResponse.json(
          { error: "Item not found or doesn't belong to session" },
          { status: 404 }
        );
      }

      // Delete the cart item
      await client.query(
        `DELETE FROM cart_items 
         WHERE cart_item_id = $1 
         AND session_id = (
           SELECT session_id 
           FROM cart_session 
           WHERE user_identifier = $2
         )`,
        [cartItemId, sessionId]
      );

      // Get updated cart items
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
         JOIN headphones h ON ci.product_id = h.product_id
         WHERE ci.session_id = (
           SELECT session_id 
           FROM cart_session 
           WHERE user_identifier = $1
         )`,
        [sessionId]
      );

      await client.query("COMMIT");

      return NextResponse.json({ items: result.rows });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Cart remove error:", error);
    return NextResponse.json(
      { error: "Failed to remove item from cart" },
      { status: 500 }
    );
  }
}
