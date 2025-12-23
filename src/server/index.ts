import * as Sentry from "@sentry/node";
import { backendCredentials } from "../helpers/domain.js";
import { ensureIndices } from "./db.js";
import { nodeEnv } from "./index-html.js";
import { startServer } from "./server.js";

const sentryDsn = backendCredentials().SENTRY_DSN;

if (sentryDsn && !sentryDsn.includes("dummy") && !sentryDsn.includes("x@x")) {
  Sentry.init({
    dsn: sentryDsn,
    environment: nodeEnv,
    maxBreadcrumbs: 50,
    tracesSampleRate: 1.0,
    integrations: [
      new Sentry.Integrations.LocalVariables({
        captureAllExceptions: true,
      }),
    ],
  });
  console.log("Sentry initialized");
} else {
  console.log("Sentry disabled (no valid DSN)");
}

await ensureIndices();
await startServer();
