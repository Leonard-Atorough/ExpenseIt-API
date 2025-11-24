export {};

declare global {
  namespace Express {
    interface Request {
      payload?: Record<string, any>;
    }
  }
}
