import { useState } from "react";
import { useCart } from "@/app/components/Cart/CartContext";
import { useStripe, useElements } from "@stripe/react-stripe-js";

export interface PaymentFormData {
  name: string;
  email: string;
  address: string;
}

export function usePayment() {
  const stripe = useStripe();
  const elements = useElements();
  const { items } = useCart();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to create the payment intent
  const createPaymentIntent = async () => {
    try {
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ items })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment intent");
      }

      const data = await response.json();
      return data.clientSecret;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Payment setup failed"
      );
    }
  };

  // Function to handle the payment submission
  const handlePayment = async (formData: PaymentFormData) => {
    if (!stripe || !elements) {
      console.error("Stripe not initialized");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate the card element
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      // Confirm the payment with Stripe
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
          payment_method_data: {
            billing_details: {
              name: formData.name,
              email: formData.email,
              address: {
                line1: formData.address
              }
            }
          }
        }
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Payment successful - redirect will be handled by return_url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createPaymentIntent,
    handlePayment
  };
}
