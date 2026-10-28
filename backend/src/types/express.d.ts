import type { CurrentUser } from "./users/user-context.types.js";

// Express declaration merging makes the verified POC identity available as
// request.currentUser in controllers and middleware with full type safety.

declare global {
  namespace Express {
    interface Request {
      currentUser?: CurrentUser;
    }
  }
}

export {};
