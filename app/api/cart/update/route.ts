// app/api/cart/route.ts
import { NextResponse } from "next/server";
import pool from "@/db/helpers/db";

export async function POST(request: Request) {
  try {
    const { sessionId, productId, quantity } = await request.json();
    console.log("Cart API received request:", {
      sessionId,
      productId,
      quantity
    });

    // Validate input
    if (!sessionId || !productId || !quantity) {
      console.error("Missing required fields:", {
        sessionId,
        productId,
        quantity
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      console.log("Transaction started");

      // Get or create session
      const sessionResult = await client.query(
        `INSERT INTO cart_session (user_identifier)
         VALUES ($1)
         ON CONFLICT (user_identifier) DO UPDATE 
         SET last_modified = CURRENT_TIMESTAMP
         RETURNING session_id`,
        [sessionId]
      );
      console.log("Session result:", sessionResult.rows[0]);

      const session_id = sessionResult.rows[0].session_id;

      // Check stock
      const stockResult = await client.query(
        "SELECT stock_quantity FROM headphones WHERE product_id = $1",
        [productId]
      );
      console.log("Stock check result:", stockResult.rows[0]);

      if (stockResult.rows.length === 0) {
        throw new Error("Product not found");
      }

      if (stockResult.rows[0].stock_quantity < quantity) {
        throw new Error("Insufficient stock");
      }

      // Add or update cart item
      console.log("Adding/updating cart item");
      await client.query(
        `INSERT INTO cart_items (session_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (session_id, product_id) 
         DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
        [session_id, productId, quantity]
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
         JOIN headphones h ON ci.product_id = h.product_id
         WHERE ci.session_id = $1`,
        [session_id]
      );
      console.log("Updated cart items:", result.rows);

      await client.query("COMMIT");
      return NextResponse.json({ items: result.rows });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to add to cart"
      },
      { status: 500 }
    );
  }
}
