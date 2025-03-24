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
        // Instead of throwing an error, return a structured JSON response
        await client.query("ROLLBACK");
        client.release();

        console.warn(`Order not found for payment_intent: ${paymentIntentId}`);
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
      client.release();
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
