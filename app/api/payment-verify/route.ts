// app/api/payment-verify/route.ts
import { NextResponse } from "next/server";
import pool from "@/db/helpers/db";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-02-24.acacia"
});

export async function GET(request: Request) {
  try {
    // Get payment intent ID from query params
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get("payment_intent");

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID is required" },
        { status: 400 }
      );
    }

    // First verify the payment status with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return NextResponse.json(
        { error: "Payment intent not found" },
        { status: 404 }
      );
    }

    // Then get the order details from our database
    const client = await pool.connect();
    let clientReleased = false; // Flag to track if client has been released

    try {
      // Start a transaction
      await client.query("BEGIN");

      // Get the order and its payment status
      const orderResult = await client.query(
        `SELECT o.*, p.payment_status
         FROM "ORDER" o
         LEFT JOIN payment p ON o.order_id = p.order_id
         WHERE o.payment_intent_id = $1`,
        [paymentIntentId]
      );

      if (orderResult.rows.length === 0) {
        // If the order doesn't exist but payment is successful, create it
        if (paymentIntent.status === "succeeded") {
          console.log(
            `Creating order for successful payment: ${paymentIntentId}`
          );

          // Variables to track created resources
          let orderId: number | undefined;
          let createdOrder = false;

          try {
            // Extract order items from payment intent metadata
            let orderItems: Array<{
              id: number | string;
              name?: string;
              quantity: number;
              price?: number;
              image_url?: string;
            }> = [];
            try {
              orderItems = JSON.parse(
                paymentIntent.metadata.order_items || "[]"
              );
            } catch (parseError) {
              console.error(
                "Error parsing order items from metadata:",
                parseError
              );
              // Continue with empty order items if parsing fails
            }

            // Get customer email from payment intent
            const email =
              paymentIntent.receipt_email ||
              (paymentIntent.customer
                ? `customer_${paymentIntent.customer}@example.com`
                : "unknown@example.com");

            // Create order record
            const orderResult = await client.query(
              `INSERT INTO "ORDER" (
                total_price, 
                status, 
                payment_intent_id,
                email
              ) VALUES ($1, $2, $3, $4) RETURNING order_id, created_at`,
              [paymentIntent.amount / 100, "paid", paymentIntentId, email]
            );

            orderId = orderResult.rows[0].order_id;
            const createdAt = orderResult.rows[0].created_at;
            console.log(
              `Created order record during verification, ID: ${orderId}`
            );
            createdOrder = true;

            // Try to create payment record, but continue if it fails
            try {
              await client.query(
                `INSERT INTO payment (
                  order_id,
                  stripe_payment_id,
                  payment_status,
                  amount_received,
                  payment_method_details
                ) VALUES ($1, $2, $3, $4, $5)`,
                [
                  orderId,
                  paymentIntentId,
                  "succeeded",
                  paymentIntent.amount / 100,
                  JSON.stringify(paymentIntent.payment_method || {})
                ]
              );
            } catch (paymentError) {
              // Log payment error but continue - the order is more important
              console.error("Error creating payment record:", paymentError);
              console.log(
                "Continuing with order creation despite payment record error"
              );
            }

            // Get order items if we have them
            const itemsDetails = orderItems.map((item) => ({
              name: item.name || "Product",
              quantity: item.quantity || 1,
              price_at_time: item.price || 0,
              image_url: item.image_url || ""
            }));

            // Create order items records if available
            for (const item of orderItems) {
              try {
                await client.query(
                  `INSERT INTO order_items (
                    order_id,
                    product_id,
                    quantity,
                    price_at_time
                  ) VALUES ($1, $2, $3, $4)`,
                  [
                    orderId,
                    item.id,
                    item.quantity,
                    item.price || 0 // Use price if available or 0
                  ]
                );
              } catch (itemError) {
                console.error(
                  `Error adding order item (product_id: ${item.id}):`,
                  itemError
                );
                // Continue with other items if one fails
              }
            }

            await client.query("COMMIT");

            // Return success with the newly created order
            return NextResponse.json({
              success: true,
              order: {
                order_id: orderId,
                payment_intent_id: paymentIntentId,
                email: email,
                status: "paid",
                payment_status: "succeeded",
                stripe_status: paymentIntent.status,
                total_price: paymentIntent.amount / 100,
                items: itemsDetails,
                created_at: createdAt.toISOString(),
                created_by_verification: true
              }
            });
          } catch (createError) {
            console.error(
              "Error creating order during verification:",
              createError
            );

            // If we created an order but failed later, try to return that order
            if (createdOrder && orderId) {
              try {
                console.log("Attempting to commit partial order creation");
                await client.query("COMMIT");

                return NextResponse.json({
                  success: true,
                  order: {
                    order_id: orderId,
                    payment_intent_id: paymentIntentId,
                    email: "customer@example.com",
                    status: "paid",
                    payment_status: "succeeded",
                    stripe_status: paymentIntent.status,
                    total_price: paymentIntent.amount / 100,
                    items: [],
                    created_at: new Date().toISOString(),
                    created_by_verification: true,
                    is_partial: true
                  }
                });
              } catch (commitError) {
                console.error("Failed to commit partial order:", commitError);
                await client.query("ROLLBACK");
              }
            } else {
              await client.query("ROLLBACK");
            }
          }
        }

        // If we got here, we couldn't create an order or payment wasn't successful
        await client.query("ROLLBACK");
        clientReleased = true; // Mark that we're going to release the client

        console.warn(`Order not found for payment_intent: ${paymentIntentId}`);

        // Safely release the client here since we're returning
        try {
          client.release();
        } catch (releaseError) {
          console.warn(
            "Error releasing database client (order not found):",
            releaseError instanceof Error
              ? releaseError.message
              : String(releaseError)
          );
        }

        return NextResponse.json(
          {
            success: false,
            error: "Order not found",
            paymentStatus: paymentIntent.status
          },
          { status: 404 }
        );
      }

      const order = orderResult.rows[0];

      // Get all items in the order
      const itemsResult = await client.query(
        `SELECT oi.*, h.name, h.image_url
         FROM order_items oi
         JOIN headphones h ON oi.product_id = h.product_id
         WHERE oi.order_id = $1`,
        [order.order_id]
      );

      // If payment is successful but not marked in our database, update it
      if (paymentIntent.status === "succeeded" && order.status !== "paid") {
        await client.query(
          `UPDATE "ORDER" 
           SET status = 'paid', 
               updated_at = CURRENT_TIMESTAMP 
           WHERE order_id = $1`,
          [order.order_id]
        );

        await client.query(
          `UPDATE payment 
           SET payment_status = 'succeeded', 
               payment_date = CURRENT_TIMESTAMP 
           WHERE order_id = $1`,
          [order.order_id]
        );
      }

      await client.query("COMMIT");

      // Return the complete order details
      return NextResponse.json({
        success: true,
        order: {
          ...order,
          items: itemsResult.rows,
          stripe_status: paymentIntent.status
        }
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      // Only release if not already released and client exists
      if (!clientReleased) {
        try {
          client.release();
        } catch (releaseError) {
          console.warn(
            "Error releasing database client:",
            releaseError instanceof Error
              ? releaseError.message
              : String(releaseError)
          );
        }
      }
    }
  } catch (error) {
    console.error("Error processing payment success:", error);

    // Get URL params again for the error logs as the outer ones might be out of scope
    const errorSearchParams = new URL(request.url).searchParams;

    // Log detailed diagnostic information
    console.error("Payment verification error details:", {
      paymentIntentId: errorSearchParams.get("payment_intent"),
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : "No stack trace",
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to verify payment",
        paymentId: errorSearchParams.get("payment_intent") || "unknown",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
