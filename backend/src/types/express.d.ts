import type { CurrentUser } from "./users/user-context.types.js";

declare global {
  namespace Express {
    interface Request {
      currentUser?: CurrentUser;
    }
  }
}

export {};
