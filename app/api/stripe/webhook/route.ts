// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Stripe } from "stripe";
import pool from "@/db/helpers/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia"
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  console.log("Webhook received"); // Add logging

  try {
    const body = await request.text();
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

    console.log("Webhook event type:", event.type); // Add logging

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("Processing successful payment:", paymentIntent.id);

      // Get the payment method to access billing details
      const paymentMethod = await stripe.paymentMethods.retrieve(
        paymentIntent.payment_method as string
      );

      const email = paymentMethod.billing_details.email;

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const orderItems = JSON.parse(
          paymentIntent.metadata.order_items || "[]"
        );

        // Create order record with email from payment method
        const orderResult = await client.query(
          `INSERT INTO "ORDER" (
            total_price, 
            status, 
            payment_intent_id,
            email
          ) VALUES ($1, $2, $3, $4) RETURNING order_id`,
          [paymentIntent.amount / 100, "paid", paymentIntent.id, email]
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

    return NextResponse.json({ received: true, type: event.type });
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
