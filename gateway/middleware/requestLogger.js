import { performance } from "node:perf_hooks";
import { logger } from "../lib/logger.js";

export default function requestLogger(req, res, next) {
  const startTime = performance.now();

  req.log = logger.child({
    requestId: req.requestId,
  });

  let logged = false;

  const writeLog = (aborted = false) => {
    if (logged) return;
    logged = true;

    const duration = Number((performance.now() - startTime).toFixed(2));

    const status = res.statusCode;

    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

    const logData = {
      method: req.method,
      path: req.originalUrl.split("?")[0],
      route: req.routeLabel || "",
      status,
      duration,

      customerId: req.apiKey?.customerId ?? null,
      keyId: req.apiKey?.id ?? null,

      backend: req.backend || null,
      cache: res.getHeader("X-Cache") || "NONE",
      attempts: req.attempts ?? 0,

      ip: req.ip,
      userAgent: req.headers["user-agent"] || null,

      ...(aborted && { aborted: true }),
    };

    req.log[level](logData, "Request completed");
  };

  res.on("finish", () => writeLog(false));

  res.on("close", () => {
    if (!res.writableFinished) {
      writeLog(true);
    }
  });

  next();
}
