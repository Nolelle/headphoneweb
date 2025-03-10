// __tests__/components/Hero/MainPageHero.test.tsx
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import MainPageHero from "@/app/components/Hero/MainPageHero";

describe("MainPageHero Component", () => {
  it("renders the hero section correctly", () => {
    render(<MainPageHero />);
    
    // Check heading content
    expect(screen.getByText(/Elevate Your/i)).toBeInTheDocument();
    expect(screen.getByText(/Listening/i)).toBeInTheDocument();
    expect(screen.getByText(/Experience/i)).toBeInTheDocument();
    
    // Check descriptive text
    expect(screen.getByText(/Discover the cutting-edge technology/i)).toBeInTheDocument();
    
    // Check if CTA button exists and has proper text
    const ctaButton = screen.getByRole("link", { name: /Learn more about Bone\+!/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute("href", "/#headphone");
    
    // Check if image is present
    const heroImage = screen.getByAltText("Headphones");
    expect(heroImage).toBeInTheDocument();
  });
});