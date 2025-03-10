// __tests__/utils/utils.test.ts
import { cn } from "@/lib/utils";

describe("Utility Functions", () => {
  describe("cn", () => {
    it("merges class names correctly", () => {
      const result = cn("class1", "class2");
      expect(result).toBe("class1 class2");
    });

    it("handles conditional classes", () => {
      const result = cn("base", true && "included", false && "excluded");
      expect(result).toBe("base included");
    });

    it("handles undefined values", () => {
      const result = cn("base", undefined, null, "valid");
      expect(result).toBe("base valid");
    });

    it("merges Tailwind classes correctly", () => {
      const result = cn("p-4 text-red-500", "p-6 text-blue-500");
      // Tailwind merge should keep the last conflicting class
      expect(result).toContain("p-6");
      expect(result).toContain("text-blue-500");
      expect(result).not.toContain("p-4");
      expect(result).not.toContain("text-red-500");
    });
  });
});

// __tests__/utils/stripe.test.ts
import { getStripe } from "@/lib/stripe";
import { loadStripe } from "@stripe/stripe-js";

// Mock loadStripe function
jest.mock("@stripe/stripe-js", () => ({
  loadStripe: jest.fn().mockReturnValue("mocked-stripe-instance")
}));

describe("Stripe Utilities", () => {
  beforeEach(() => {
    // Reset the module to clear cached stripe instance
    jest.resetModules();
  });

  it("initializes Stripe with publishable key", () => {
    // Call getStripe
    const stripe = getStripe();

    // Check that loadStripe was called
    expect(loadStripe).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    );

    // Verify the returned instance
    expect(stripe).toBe("mocked-stripe-instance");
  });

  it("reuses the same Stripe instance on multiple calls", () => {
    // Import the module with jest.requireActual to get real implementation
    const { getStripe: actualGetStripe } = jest.requireActual("@/lib/stripe");

    // Override NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for testing
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "test_key";

    // Call getStripe multiple times
    const stripe1 = actualGetStripe();
    const stripe2 = actualGetStripe();

    // loadStripe should be called only once
    expect(loadStripe).toHaveBeenCalledTimes(1);

    // Both calls should return the same instance
    expect(stripe1).toBe(stripe2);
  });
});
