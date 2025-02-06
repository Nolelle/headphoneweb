import { NextResponse } from "next/server";
import pool from "@/db/helpers/db";

export async function PUT(request: Request) {
  try {
    const { sessionId, cartItemId, quantity } = await request.json();

    // Validate input
    if (!sessionId || !cartItemId || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verify session ownership of cart item
      const ownershipCheck = await client.query(
        `SELECT ci.product_id, h.stock_quantity 
         FROM cart_items ci
         JOIN cart_session cs ON ci.session_id = cs.session_id
         JOIN headphones h ON ci.product_id = h.product_id
         WHERE cs.user_identifier = $1 AND ci.cart_item_id = $2`,
        [sessionId, cartItemId]
      );

      if (ownershipCheck.rows.length === 0) {
        throw new Error("Cart item not found or doesn't belong to session");
      }

      // Check stock availability
      if (ownershipCheck.rows[0].stock_quantity < quantity) {
        throw new Error("Insufficient stock");
      }

      // Update quantity
      await client.query(
        `UPDATE cart_items 
         SET quantity = $1 
         WHERE cart_item_id = $2`,
        [quantity, cartItemId]
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
      return NextResponse.json(result.rows);
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
