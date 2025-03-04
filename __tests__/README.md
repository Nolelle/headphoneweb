# Unit Testing Guide

This guide provides information on how to write and run unit tests for the headphoneweb application.

## Running Tests

To run all tests:
```bash
npm run test
```

To run tests in watch mode (tests re-run automatically when files change):
```bash
npm run test:watch
```

To run tests with coverage report:
```bash
npm run test
```
(Coverage is enabled by default in our configuration)

## Test Structure

Tests are organized in the `__tests__` directory, following a structure that mirrors the application:

- `__tests__/components/` - Tests for React components
- `__tests__/api/` - Tests for API endpoints
- `__tests__/utils/` - Tests for utility functions

## Writing Tests

### Component Tests

For testing React components, we use React Testing Library. Example:

```tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComponentName } from '@/app/components/path/to/component';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

### API Route Tests

For testing API routes, we mock dependencies and test the handler functions directly:

```tsx
import { POST } from '@/app/api/route-path/route';
import { NextResponse } from 'next/server';

// Mock dependencies
jest.mock('dependency-to-mock', () => ({
  // Mocked implementation
}));

describe('API Route', () => {
  it('should handle request correctly', async () => {
    const request = {
      json: jest.fn().mockResolvedValue({ /* request data */ }),
    };

    const response = await POST(request as unknown as Request);
    
    // Assert on response
    expect(response.status).toBe(expectedStatus);
  });
});
```

### Utility Function Tests

For utility functions, tests should be simple and focused:

```tsx
import { utilityFunction } from '@/lib/utils';

describe('utilityFunction', () => {
  it('should work correctly', () => {
    const result = utilityFunction(input);
    expect(result).toEqual(expectedOutput);
  });
});
```

## Mocking

### Common Mocks

- Next.js router is mocked in `__tests__/setup.ts`
- File imports like images are mocked in `__mocks__/fileMock.js`

### Creating Custom Mocks

For module mocking:

```tsx
jest.mock('module-name', () => ({
  functionName: jest.fn(),
}));
```

For specific function mocking:

```tsx
jest.spyOn(object, 'method').mockImplementation(() => mockReturnValue);
```

## Best Practices

1. Keep tests independent - one test should not depend on another
2. Mock external dependencies to ensure unit tests remain focused and fast
3. Test the component's behavior, not its implementation details
4. Use descriptive test names that follow the pattern "it should..."
5. Group related tests using describe blocks
6. Test both success and error paths

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Next.js Applications](https://nextjs.org/docs/testing)