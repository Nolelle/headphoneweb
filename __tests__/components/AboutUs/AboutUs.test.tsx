// __tests__/components/AboutUs/AboutUs.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AboutUs from "@/app/components/AboutUs/AboutUs";

// Mock window.scrollTo
global.scrollTo = jest.fn();

describe("AboutUs Component", () => {
  it("renders the about us section correctly", () => {
    render(<AboutUs />);
    
    // Check heading and content
    expect(screen.getByText("About Us")).toBeInTheDocument();
    expect(screen.getByText(/Founded in 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/Headphone Plus emerged/i)).toBeInTheDocument();
  });

  it("shows scroll to top button when scrolled down", () => {
    // Create a test environment where scrollY is > 300
    Object.defineProperty(window, 'pageYOffset', { value: 350, configurable: true });
    
    render(<AboutUs />);
    
    // Trigger scroll event
    fireEvent.scroll(window);
    
    // Check if scroll to top button appears
    const scrollButton = screen.getByRole("button", { name: /Scroll to top/i });
    expect(scrollButton).toBeInTheDocument();
    
    // Test the button click
    fireEvent.click(scrollButton);
    
    // Verify scrollTo was called
    expect(global.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
  
  it("does not show scroll to top button when at the top", () => {
    // Reset pageYOffset
    Object.defineProperty(window, 'pageYOffset', { value: 0, configurable: true });
    
    render(<AboutUs />);
    
    // The button should not be visible
    const scrollButton = screen.queryByRole("button", { name: /Scroll to top/i });
    expect(scrollButton).not.toBeInTheDocument();
  });
});