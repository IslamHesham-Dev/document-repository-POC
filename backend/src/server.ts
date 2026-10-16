import { app } from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.backendPort, () => {
  console.log(`Backend listening on http://localhost:${env.backendPort}`);
});

function shutDown(signal: string): void {
  console.log(`${signal} received. Closing the HTTP server.`);
  server.close((error) => {
    if (error) {
      console.error("Failed to close the HTTP server cleanly.", error);
      process.exit(1);
    }

    process.exit(0);
  });
}

process.on("SIGINT", () => shutDown("SIGINT"));
process.on("SIGTERM", () => shutDown("SIGTERM"));
