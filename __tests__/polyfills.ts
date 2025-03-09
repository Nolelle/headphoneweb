// __tests__/polyfills.ts
import { TextEncoder, TextDecoder } from "util";

// Polyfill TextEncoder and TextDecoder for pg library compatibility
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;
