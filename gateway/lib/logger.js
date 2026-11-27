import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  redact: {
    paths: [
      "req.headers.x-api-key",
      "req.headers.x-admin-secret",
      "req.headers.authorization",
    ],

    censor: "[REDACTED]",
  },

  timestamp: pino.stdTimeFunctions.isoTime,
});
