import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '@/app/components/ui/button';

describe('Button Component', () => {
  it('renders button with default variant and size', () => {
    render(<Button>Test Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /test button/i });
    
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('bg-primary');
    expect(buttonElement).toHaveClass('h-10');
  });

  it('renders button with custom variant', () => {
    render(<Button variant="destructive">Destructive Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /destructive button/i });
    
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('bg-destructive');
  });

  it('renders button with custom size', () => {
    render(<Button size="sm">Small Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /small button/i });
    
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('h-9');
  });

  it('renders as child when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const linkElement = screen.getByRole('link', { name: /link button/i });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', '/test');
    expect(linkElement).toHaveClass('bg-primary');
  });

  it('applies custom className', () => {
    render(<Button className="test-custom-class">Custom Class Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /custom class button/i });
    
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('test-custom-class');
  });
});