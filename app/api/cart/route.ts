import { NextResponse } from "next/server";
import pool from "@/db/helpers/db";

// Get cart items
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get or create cart session
    const sessionResult = await pool.query(
      `INSERT INTO cart_session (user_identifier)
       VALUES ($1)
       ON CONFLICT (user_identifier) DO UPDATE 
       SET last_modified = CURRENT_TIMESTAMP
       RETURNING session_id`,
      [sessionId]
    );

    const session_id = sessionResult.rows[0].session_id;

    // Get cart items with product details
    const result = await pool.query(
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

    return NextResponse.json({ items: result.rows });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// Add item to cart
export async function POST(request: Request) {
  try {
    const { sessionId, productId, quantity } = await request.json();

    // Validate input
    if (!sessionId || !productId || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get or create session
      const sessionResult = await client.query(
        `INSERT INTO cart_session (user_identifier)
         VALUES ($1)
         ON CONFLICT (user_identifier) DO UPDATE 
         SET last_modified = CURRENT_TIMESTAMP
         RETURNING session_id`,
        [sessionId]
      );

      const session_id = sessionResult.rows[0].session_id;

      // Check stock
      const stockResult = await client.query(
        "SELECT stock_quantity FROM headphones WHERE product_id = $1",
        [productId]
      );

      if (stockResult.rows.length === 0) {
        throw new Error("Product not found");
      }

      if (stockResult.rows[0].stock_quantity < quantity) {
        throw new Error("Insufficient stock");
      }

      // Add or update cart item
      await client.query(
        `INSERT INTO cart_items (session_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (session_id, product_id) 
         DO UPDATE SET quantity = EXCLUDED.quantity`,
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
