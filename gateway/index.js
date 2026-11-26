import "dotenv/config";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import routes from "./routes/gatewayRoute.js";
import adminRouter from "./routes/adminRoute.js";
import authenticate from "./middleware/authenticate.js";
import authorize from "./middleware/authorize.js";
import rateLimiter from "./middleware/rateLimited.js";
import { pickTarget } from "./lib/loadBalancer.js";
import {
  isHealthy,
  isAvailable,
  beginAttempt,
  recordSuccess,
  recordFailure,
} from "./lib/backendPool.js";
import { forwardSafe } from "./lib/forwarder.js";
import { startHealthChecks } from "./lib/healthChecker.js";
import {
  NotFoundError,
  BadGatewayError,
  GatewayTimeoutError,
  ServiceUnavailableError,
} from "./errors/AppError.js";
import errorHandler from "./middleware/ErrorHandler.js";
const app = express();
const PORT = process.env.PORT || 3000;

const toAppError = (err) =>
  ["ECONNREFUSED", "ENOTFOUND"].includes(err.code)
    ? new BadGatewayError()
    : new GatewayTimeoutError();

app.use("/admin", express.json(), adminRouter);
app.use(authenticate);
app.use(authorize);
app.use(rateLimiter);

routes.forEach((route) => {
  const proxy = createProxyMiddleware({
    target: route.targets[0],
    router: (req) => req.upstream,
    changeOrigin: true,
    pathRewrite: (path) => {
      const rest = path.startsWith(route.path)
        ? path.slice(route.path.length)
        : path === "/"
          ? ""
          : path;
      return route.rewriteTo + rest;
    },
    proxyTimeout: 5000,
    timeout: 5000,
    on: {
      proxyRes: (proxyRes, req) => {
        if (proxyRes.statusCode >= 500) recordFailure(req.upstream);
        else recordSuccess(req.upstream);
      },
      error: (err, req, res) => {
        recordFailure(req.upstream);
        if (res.headersSent) return;
        req.next(toAppError(err));
      },
    },
  });

  app.use((req, res, next) => {
    const matches =
      req.path === route.path || req.path.startsWith(`${route.path}/`);
    if (!matches) return next();

    if (req.method === "GET" || req.method === "HEAD") {
      return forwardSafe(route, req, res, next);
    }

    const upstream = pickTarget(route, isAvailable);
    if (!upstream) {
      res.set("Retry-After", "5");
      return next(new ServiceUnavailableError());
    }

    beginAttempt(upstream);
    req.upstream = upstream;
    proxy(req, res, next);
  });
});

app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});
app.use(errorHandler);
startHealthChecks(routes);

app.listen(PORT, () => console.log(`server started on PORT ${PORT}`));
