import { NextResponse } from "next/server";
import Stripe from "stripe";

// Define a type for cart items
interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia"
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received request body:", body);

    const { items } = body;

    if (!items?.length) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // Calculate total amount in cents
    const amount = Math.round(
      items.reduce((sum: number, item: CartItem) => {
        return sum + item.price * item.quantity;
      }, 0) * 100
    );

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true
      },
      metadata: {
        order_items: JSON.stringify(
          items.map((item: CartItem) => ({
            id: item.product_id,
            quantity: item.quantity,
            name: item.name
          }))
        )
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error("Payment intent error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
