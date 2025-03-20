import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StripeProvider } from "@/app/components/Providers/StripeProvider";
import { getStripe } from "@/lib/stripe";
jest.mock("@stripe/react-stripe-js", () => ({
  Elements: jest.fn(({ children }) => <div data-testid="stripe-elements">{children}</div>)
}));

jest.mock("@/lib/stripe", () => ({
  getStripe: jest.fn(() => ({ mockStripe: true }))
}));

describe("StripeProvider Component", () => {
  it("renders the Elements provider correctly", () => {
    render(
      <StripeProvider>
        <div data-testid="child-component">Test Child</div>
      </StripeProvider>
    );
    expect(screen.getByTestId("stripe-elements")).toBeInTheDocument();
    expect(screen.getByTestId("child-component")).toBeInTheDocument();
  });

  it("calls getStripe function to get the Stripe instance", () => {
    render(<StripeProvider><div /></StripeProvider>);
    expect(getStripe).toHaveBeenCalled();
  });
});
