"use client";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { ReactNode } from "react";

interface StripeProviderProps {
  children: ReactNode;
  options?: {
    clientSecret?: string;
    appearance?: {
      theme?: "night" | "flat" | "stripe";
      variables?: Record<string, string>;
    };
  };
}

export function StripeProvider({ children, options }: StripeProviderProps) {
  return (
    <Elements
      stripe={getStripe()}
      options={options}
    >
      {children}
    </Elements>
  );
}
