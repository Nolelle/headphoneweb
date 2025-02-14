import { NextResponse } from "next/server";
import pool from "@/db/helpers/db";

export async function PUT(request: Request) {
  try {
    const { sessionId, cartItemId, quantity } = await request.json();
    console.log("Cart update API received request:", {
      sessionId,
      cartItemId,
      quantity
    });

    // Validate input and convert cartItemId to a number if it's a string
    if (!sessionId || !cartItemId || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Ensure cartItemId is a valid number
    const parsedCartItemId = parseInt(cartItemId.toString(), 10);
    if (isNaN(parsedCartItemId)) {
      return NextResponse.json(
        { error: "Invalid cart item ID" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verify cart item exists and belongs to session
      const verifyResult = await client.query(
        `SELECT ci.cart_item_id 
         FROM cart_items ci
         JOIN cart_session cs ON ci.session_id = cs.session_id
         WHERE cs.user_identifier = $1 
         AND ci.cart_item_id = $2`,
        [sessionId, parsedCartItemId]
      );

      if (verifyResult.rows.length === 0) {
        throw new Error("Cart item not found or doesn't belong to session");
      }

      // Update quantity
      await client.query(
        `UPDATE cart_items ci
         SET quantity = $1
         FROM cart_session cs
         WHERE ci.session_id = cs.session_id
         AND cs.user_identifier = $2
         AND ci.cart_item_id = $3`,
        [quantity, sessionId, parsedCartItemId]
      );

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
      return NextResponse.json({ items: result.rows });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update cart"
      },
      { status: 500 }
    );
  }
}
