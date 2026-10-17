export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.FRONTEND_API_URL ??
  "http://localhost:3000/api";
