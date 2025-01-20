import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2022-11-15"
});

type Data = {
  clientSecret?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
): Promise<void> {
  if (req.method === "POST") {
    try {
      const { amount } = req.body;

      if (!amount) {
        res.status(400).json({ error: "Amount is required" });
        return;
      }

      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount, // Amount in cents
        currency: "usd",
        payment_method_types: ["card"]
      });

      res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
