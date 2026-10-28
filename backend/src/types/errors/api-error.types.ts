// Stable error envelope consumed by both the frontend API client and tests.
export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};
