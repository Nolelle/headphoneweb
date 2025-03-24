import pool from "@/db/helpers/db";

export async function PUT(request: Request) {
  try {
    // Try to read and parse the request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error("PUT /api/cart/update - Failed to parse request body:", e);
      return new Response(
        JSON.stringify({
          error: "Invalid request: Could not parse JSON body",
          items: []
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const { sessionId, cartItemId, quantity } = body;
    console.log("Cart update API received request:", {
      sessionId: sessionId ? `${sessionId.substring(0, 8)}...` : undefined,
      cartItemId,
      quantity
    });

    // Validate input and convert cartItemId to a number if it's a string
    if (!sessionId || !cartItemId || !quantity) {
      console.error("PUT /api/cart/update - Missing required fields:", {
        hasSessionId: !!sessionId,
        hasCartItemId: !!cartItemId,
        hasQuantity: !!quantity
      });
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          items: []
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Ensure cartItemId is a valid number
    const parsedCartItemId = parseInt(cartItemId.toString(), 10);
    if (isNaN(parsedCartItemId)) {
      console.error(
        `PUT /api/cart/update - Invalid cart item ID: ${cartItemId}`
      );
      return new Response(
        JSON.stringify({
          error: "Invalid cart item ID",
          items: []
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
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
        console.error(
          `PUT /api/cart/update - Cart item not found: sessionId=${sessionId.substring(
            0,
            8
          )}..., cartItemId=${parsedCartItemId}`
        );
        await client.query("ROLLBACK");
        return new Response(
          JSON.stringify({
            error: "Cart item not found or doesn't belong to session",
            items: []
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
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
      console.log(
        `PUT /api/cart/update - Successfully updated item, returned ${result.rows.length} items`
      );

      // Ensure we always return a valid items array
      const items = result.rows || [];
      return new Response(JSON.stringify({ items }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: "Failed to update cart item",
        items: [] // Always include empty items array
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
