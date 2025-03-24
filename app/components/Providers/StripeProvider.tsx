"use client";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/app/lib/stripe";
import { ReactNode } from "react";
import { StripeElementsOptions } from "@stripe/stripe-js";

interface StripeProviderProps {
  children: ReactNode;
  options?: StripeElementsOptions;
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
