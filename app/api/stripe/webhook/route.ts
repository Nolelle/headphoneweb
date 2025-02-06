// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import pool from "@/db/helpers/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16"
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    // Get the raw body
    const body = await request.text();

    // Get headers using the async headers() function
    const headersList = await headers();
    const stripeSignature = headersList.get("stripe-signature");

    if (!stripeSignature) {
      console.error("No stripe signature found in webhook request");
      return NextResponse.json(
        { error: "No stripe signature found" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        stripeSignature,
        webhookSecret
      );
    } catch (err) {
      console.error("Error verifying webhook signature:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle different webhook events
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("Processing successful payment:", paymentIntent.id);

      // Begin database transaction
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Parse the metadata string back to an object
        const orderItems = JSON.parse(
          paymentIntent.metadata.order_items || "[]"
        );
        console.log("Order items:", orderItems);

        // Create order record
        const orderResult = await client.query(
          `INSERT INTO "ORDER" (
            total_price, 
            status, 
            payment_intent_id,
            email,
            metadata
          ) VALUES ($1, $2, $3, $4, $5) RETURNING order_id`,
          [
            paymentIntent.amount / 100,
            "paid",
            paymentIntent.id,
            paymentIntent.receipt_email,
            JSON.stringify(paymentIntent.metadata)
          ]
        );

        const orderId = orderResult.rows[0].order_id;
        console.log("Created order:", orderId);

        // Create order items and update stock
        for (const item of orderItems) {
          // Insert order item
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
              paymentIntent.amount / 100 / item.quantity
            ]
          );

          // Update stock quantity
          const stockResult = await client.query(
            `UPDATE headphones 
             SET stock_quantity = stock_quantity - $1 
             WHERE product_id = $2
             RETURNING stock_quantity`,
            [item.quantity, item.id]
          );

          console.log(
            `Updated stock for product ${item.id}, new quantity: ${stockResult.rows[0]?.stock_quantity}`
          );
        }

        // Create payment record
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
            paymentIntent.id,
            "succeeded",
            paymentIntent.amount_received! / 100,
            JSON.stringify(paymentIntent.payment_method)
          ]
        );

        await client.query("COMMIT");
        console.log("Transaction committed successfully");
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("Database transaction failed:", err);
        throw err;
      } finally {
        client.release();
      }
    }

    // Return a 200 response to acknowledge receipt of the event
    return NextResponse.json({
      received: true,
      type: event.type
    });
  } catch (err) {
    console.error("Webhook handler failed:", err);
    return NextResponse.json(
      {
        error: "Webhook handler failed",
        message: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}
