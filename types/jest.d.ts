// This file extends the Jest types to include the matchers from jest-dom
import "@testing-library/jest-dom";

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveBeenCalledWith(...args: unknown[]): R;
    }

    interface Expect {
      stringContaining(str: string): unknown;
      any(
        constructor: Record<string, unknown> | ((...args: unknown[]) => unknown)
      ): unknown;
    }
  }
}

export {};
