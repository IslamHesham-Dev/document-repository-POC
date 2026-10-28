// Expected failures carry an HTTP status and stable machine-readable code.
// Next: error.middleware.ts converts this internal object to the public shape.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  public constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}
