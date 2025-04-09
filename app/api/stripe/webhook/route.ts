// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Stripe } from "stripe";
import pool from "@/db/helpers/db";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-02-24.acacia"
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable");
}

// Helper for structured webhook logging
const logWebhook = (message: string, details?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  const logPrefix = `[STRIPE_WEBHOOK ${timestamp}]`;

  if (details) {
    console.log(`${logPrefix} ${message}`, details);
  } else {
    console.log(`${logPrefix} ${message}`);
  }
};

export async function POST(request: Request) {
  logWebhook("Webhook request received");

  const requestUrl = request.url;
  logWebhook("Webhook URL", { url: requestUrl });

  try {
    const body = await request.text();
    const headersList = await headers();
    const stripeSignature = headersList.get("stripe-signature");

    if (!stripeSignature) {
      logWebhook("Error: No stripe signature found in webhook request");
      return NextResponse.json(
        { error: "No stripe signature found" },
        { status: 400 }
      );
    }

    logWebhook("Stripe signature present", {
      signatureLength: stripeSignature.length
    });

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        stripeSignature,
        webhookSecret as string
      );
      logWebhook("Webhook signature verified successfully");
    } catch (err) {
      logWebhook("Error verifying webhook signature", {
        error: err instanceof Error ? err.message : String(err),
        signatureHeader: stripeSignature.substring(0, 20) + "..." // Log part of the signature safely
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    logWebhook("Processing webhook event", {
      type: event.type,
      id: event.id,
      apiVersion: event.api_version
    });

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      logWebhook("Processing successful payment", {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        hasMetadata: !!paymentIntent.metadata?.order_items
      });

      // Get the payment method to access billing details
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(
          paymentIntent.payment_method as string
        );
        logWebhook("Retrieved payment method", {
          paymentMethodId: paymentIntent.payment_method,
          paymentType: paymentMethod.type,
          hasEmail: !!paymentMethod.billing_details?.email
        });

        const email = paymentMethod.billing_details.email;

        const client = await pool.connect();
        logWebhook("Acquired database connection");

        try {
          await client.query("BEGIN");
          logWebhook("Started database transaction");

          let orderItems;
          try {
            orderItems = JSON.parse(paymentIntent.metadata.order_items || "[]");
            logWebhook("Parsed order items", { itemCount: orderItems.length });
          } catch (parseError) {
            logWebhook("Error parsing order items from metadata", {
              error:
                parseError instanceof Error
                  ? parseError.message
                  : String(parseError),
              metadata: paymentIntent.metadata
            });
            throw new Error(
              "Invalid order items data in payment intent metadata"
            );
          }

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
          logWebhook("Created order record", { orderId });

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
            logWebhook("Created order item", {
              orderId,
              productId: item.id,
              quantity: item.quantity
            });

            // Update stock quantity
            const stockResult = await client.query(
              `UPDATE headphones 
               SET stock_quantity = stock_quantity - $1 
               WHERE product_id = $2
               RETURNING stock_quantity`,
              [item.quantity, item.id]
            );

            logWebhook("Updated product stock", {
              productId: item.id,
              newStock: stockResult.rows[0]?.stock_quantity,
              decreased: item.quantity
            });
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
          logWebhook("Created payment record", {
            orderId,
            paymentId: paymentIntent.id
          });

          await client.query("COMMIT");
          logWebhook("Transaction committed successfully");
        } catch (err) {
          await client.query("ROLLBACK");
          logWebhook("Database transaction failed", {
            error: err instanceof Error ? err.message : String(err)
          });
          throw err;
        } finally {
          client.release();
          logWebhook("Database connection released");
        }
      } catch (paymentMethodError) {
        logWebhook("Error retrieving payment method", {
          error:
            paymentMethodError instanceof Error
              ? paymentMethodError.message
              : String(paymentMethodError),
          paymentMethodId: paymentIntent.payment_method
        });
        throw paymentMethodError;
      }
    } else {
      logWebhook("Ignoring non-payment-success event", { type: event.type });
    }

    logWebhook("Webhook processed successfully");
    return NextResponse.json({ received: true, type: event.type });
  } catch (err) {
    logWebhook("Webhook handler failed", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    });

    return NextResponse.json(
      {
        error: "Webhook handler failed",
        message: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}
