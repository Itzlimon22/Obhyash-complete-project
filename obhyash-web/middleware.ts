// Next.js requires the middleware entry point to be named exactly "middleware.ts".
// The actual logic lives in proxy.ts to keep the root clean.
export { proxy as default, config } from './proxy';
