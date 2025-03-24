import pool from "@/db/helpers/db";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const cartItemId = searchParams.get("cartItemId");

    console.log("DELETE /api/cart/remove - Request params:", {
      sessionId: sessionId ? `${sessionId.substring(0, 8)}...` : undefined,
      cartItemId
    });

    if (!sessionId || !cartItemId) {
      console.error("DELETE /api/cart/remove - Missing required parameters:", {
        hasSessionId: !!sessionId,
        hasCartItemId: !!cartItemId
      });
      return new Response(
        JSON.stringify({
          error: "Missing required parameters",
          details: { sessionId: !!sessionId, cartItemId: !!cartItemId },
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

      // Verify the item exists and belongs to the session
      const verifyResult = await client.query(
        `SELECT 1 FROM cart_items ci
         JOIN cart_session cs ON ci.session_id = cs.session_id
         WHERE cs.user_identifier = $1 AND ci.cart_item_id = $2`,
        [sessionId, cartItemId]
      );

      if (verifyResult.rowCount === 0) {
        console.error(
          `DELETE /api/cart/remove - Item not found: sessionId=${sessionId.substring(
            0,
            8
          )}..., cartItemId=${cartItemId}`
        );
        await client.query("ROLLBACK");
        return new Response(
          JSON.stringify({
            error: "Item not found or doesn't belong to session",
            items: []
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Delete the cart item
      const deleteResult = await client.query(
        `DELETE FROM cart_items 
         WHERE cart_item_id = $1 
         AND session_id = (
           SELECT session_id 
           FROM cart_session 
           WHERE user_identifier = $2
         )
         RETURNING cart_item_id`,
        [cartItemId, sessionId]
      );

      console.log(
        `DELETE /api/cart/remove - Deleted items count: ${
          deleteResult.rowCount || 0
        }`
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
      console.log(
        `DELETE /api/cart/remove - Request successful, returned ${result.rows.length} items`
      );

      // Ensure we always return a valid items array
      const items = result.rows || [];
      return new Response(JSON.stringify({ items }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("DELETE /api/cart/remove - Transaction error:", err);
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Cart remove error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: "Failed to remove item from cart",
        details: errorMessage,
        items: []
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
