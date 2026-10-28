// Public contract for the lightweight process-liveness endpoint.
export type HealthResponse = {
  status: "ok";
  timestamp: string;
};
