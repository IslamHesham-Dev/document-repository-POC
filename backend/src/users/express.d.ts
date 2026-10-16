import type { CurrentUser } from "./user-context.types.js";

declare global {
  namespace Express {
    interface Request {
      currentUser?: CurrentUser;
    }
  }
}

export {};
