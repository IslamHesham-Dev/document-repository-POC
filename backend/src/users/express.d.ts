import type { CurrentUser } from "./types/user-context.types.js";

declare global {
  namespace Express {
    interface Request {
      currentUser?: CurrentUser;
    }
  }
}

export {};
