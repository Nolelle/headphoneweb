"use client";
import React, { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutForm";
import { useCart } from "../Cart/CartContext";
import { Card } from "../ui/card";
import { useRouter } from "next/navigation";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function Checkout() {
  const { items } = useCart();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
      return;
    }

    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/stripe/payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            items: items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
              name: item.name
            }))
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create payment intent");
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error("Payment Intent creation failed:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [items, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(0_0%_3.9%)]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(0_0%_98%)]"></div>
          <p className="text-[hsl(0_0%_98%)]">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(0_0%_3.9%)]">
        <Card className="p-6 bg-[hsl(0_0%_14.9%)] border-[hsl(0_0%_14.9%)]">
          <p className="text-[hsl(0_62.8%_30.6%)]">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[hsl(220_70%_50%)] text-[hsl(0_0%_98%)] rounded-md"
          >
            Try Again
          </button>
        </Card>
      </div>
    );
  }

  const appearance = {
    theme: "night" as const,
    variables: {
      colorPrimary: "#3b82f6",
      colorBackground: "#1f2937",
      colorText: "#f9fafb",
      colorDanger: "#ef4444"
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(0_0%_3.9%)]">
      <div className="container mx-auto px-4 py-8">
        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance
            }}
          >
            <CheckoutForm />
          </Elements>
        )}
      </div>
    </div>
  );
}
