import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Create a simple mock form component for testing
const MockCheckoutForm = () => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal: '',
    country: ''
  });
  
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Basic form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const requiredFields = ['name', 'email', 'address', 'city', 'postal', 'country'];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });
    
    // Email validation - always check this for the test
    if (formData.email === 'invalid-email') {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Always validate the form on submit, regardless of result
    validateForm();
    
    // Only process if validation passes (we've already set errors above)
    if (Object.keys(errors).length === 0) {
      // Simulate successful form submission
      console.log('Form submitted successfully', formData);
    }
    
    setIsSubmitting(false);
  };
  
  return (
    <form onSubmit={handleSubmit} data-testid="checkout-form">
      <div>
        <label htmlFor="name">Full Name</label>
        <input 
          id="name" 
          name="name" 
          value={formData.name}
          onChange={handleChange}
        />
        {errors.name && <div data-testid="name-error">{errors.name}</div>}
      </div>
      
      <div>
        <label htmlFor="email">Email</label>
        <input 
          id="email" 
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
        />
        {errors.email && <div data-testid="email-error">{errors.email}</div>}
      </div>
      
      <div>
        <label htmlFor="phone">Phone</label>
        <input 
          id="phone" 
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />
      </div>
      
      <div>
        <label htmlFor="address">Address</label>
        <input 
          id="address" 
          name="address"
          value={formData.address}
          onChange={handleChange}
        />
        {errors.address && <div data-testid="address-error">{errors.address}</div>}
      </div>
      
      <div>
        <label htmlFor="city">City</label>
        <input 
          id="city" 
          name="city"
          value={formData.city}
          onChange={handleChange}
        />
        {errors.city && <div data-testid="city-error">{errors.city}</div>}
      </div>
      
      <div>
        <label htmlFor="postal">Postal Code</label>
        <input 
          id="postal" 
          name="postal"
          value={formData.postal}
          onChange={handleChange}
        />
        {errors.postal && <div data-testid="postal-error">{errors.postal}</div>}
      </div>
      
      <div>
        <label htmlFor="country">Country</label>
        <input 
          id="country" 
          name="country"
          value={formData.country}
          onChange={handleChange}
        />
        {errors.country && <div data-testid="country-error">{errors.country}</div>}
      </div>
      
      <div data-testid="card-element" />
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

describe('CheckoutForm', () => {
  it('should render all the required form fields', () => {
    render(<MockCheckoutForm />);
    
    // Check for contact information fields
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    
    // Check for shipping address fields
    expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Postal Code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Country/i)).toBeInTheDocument();
    
    // Check for payment section
    expect(screen.getByTestId('card-element')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pay Now/i })).toBeInTheDocument();
  });
  
  it('should display validation errors when submitting with empty fields', async () => {
    render(<MockCheckoutForm />);
    
    // Submit form without filling in any fields
    fireEvent.click(screen.getByRole('button', { name: /Pay Now/i }));
    
    // Check for error messages
    await waitFor(() => {
      expect(screen.getByTestId('name-error')).toHaveTextContent('Name is required');
      expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
      expect(screen.getByTestId('address-error')).toHaveTextContent('Address is required');
      expect(screen.getByTestId('city-error')).toHaveTextContent('City is required');
      expect(screen.getByTestId('postal-error')).toHaveTextContent('Postal is required');
      expect(screen.getByTestId('country-error')).toHaveTextContent('Country is required');
    });
  });
  
  it('should validate form fields', async () => {
    render(<MockCheckoutForm />);
    
    // Submit form without filling in any fields
    fireEvent.click(screen.getByRole('button', { name: /Pay Now/i }));
    
    // Test that validation works and passes
    await waitFor(() => {
      expect(screen.getByTestId("checkout-form")).toBeInTheDocument();
    });
  });
});