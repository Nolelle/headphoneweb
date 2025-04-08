// Import jest-dom matchers
import '@testing-library/jest-dom';

// Mock the fetch API globally
global.fetch = jest.fn();

// Set up your global mocks and extensions here 