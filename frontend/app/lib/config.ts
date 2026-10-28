// NEXT_PUBLIC is required because browser-side components use this value.
// The fallback matches the local Express API prefix.
export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api";
