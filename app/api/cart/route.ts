import { NextResponse } from "next/server";
import pool from "@/db/helpers/db";

// Helper function to retry database operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 200
): Promise<T> {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error);

      // Only retry if it's a connection error
      if (
        error instanceof Error &&
        (error.message.includes("connection") ||
          error.message.includes("connect") ||
          error.message.includes("timeout"))
      ) {
        if (attempt < maxRetries) {
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      } else {
        // If it's not a connection error, don't retry
        break;
      }
    }
  }
  throw lastError;
}

// Get cart items
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      console.error("GET /api/cart - Missing sessionId");
      return new Response(
        JSON.stringify({ error: "Session ID is required", items: [] }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    console.log(
      `GET /api/cart - Processing request for sessionId: ${sessionId.substring(
        0,
        8
      )}...`
    );

    // Get or create cart session with retry
    const sessionResult = await retryOperation(async () => {
      return await pool.query(
        `INSERT INTO cart_session (user_identifier)
         VALUES ($1)
         ON CONFLICT (user_identifier) DO UPDATE 
         SET last_modified = CURRENT_TIMESTAMP
         RETURNING session_id`,
        [sessionId]
      );
    });

    if (!sessionResult.rows || sessionResult.rows.length === 0) {
      console.error("GET /api/cart - Failed to get or create session");
      return new Response(
        JSON.stringify({
          error: "Database error: Failed to get or create session",
          items: []
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const session_id = sessionResult.rows[0].session_id;
    console.log(`GET /api/cart - Session retrieved, ID: ${session_id}`);

    // Get cart items with product details
    const result = await retryOperation(async () => {
      return await pool.query(
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
    });

    // Make sure we always have an array for items even if rows is undefined
    const items = result.rows || [];
    console.log(`GET /api/cart - Retrieved ${items.length} items`);

    // Return a standard Response to ensure proper content-type
    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching cart:", error);

    // Determine if it's a database connection error
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isConnectionError =
      errorMessage.includes("connect") || errorMessage.includes("connection");

    // Log the full error details
    console.error("Detailed cart fetch error:", {
      message: errorMessage,
      isConnectionError,
      stack: error instanceof Error ? error.stack : "No stack trace",
      time: new Date().toISOString()
    });

    // Always return a valid JSON response with items array
    const errorResponse = {
      error: "Failed to fetch cart",
      details: errorMessage,
      type: isConnectionError ? "connection_error" : "query_error",
      items: [] // Always include empty items array
    };

    // Make sure we're really returning a valid JSON string
    const safeJSONString = JSON.stringify(errorResponse);

    // Extra validation to ensure we have a proper JSON string
    try {
      // Verify the JSON is valid by parsing it
      JSON.parse(safeJSONString);
    } catch (jsonError) {
      console.error("Failed to create valid JSON response:", jsonError);
      // Fallback to a simple guaranteed valid JSON
      return new Response('{"items":[],"error":"Internal server error"}', {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(safeJSONString, {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
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
