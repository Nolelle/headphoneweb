// @ts-check
// This is a type declaration file and not a test file
// Tell Jest to ignore this file
/** @jest-environment jsdom */
/* istanbul ignore file */

import "@testing-library/jest-dom";

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveValue(value: unknown): R;
      toBeDisabled(): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: unknown[]): R;
      toBe(value: unknown): R;
    }
  }

  interface ExpectStatic {
    objectContaining(params: Record<string, unknown>): unknown;
  }
}
