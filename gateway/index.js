import "dotenv/config";
import express from "express";
import { prisma } from "./lib/prisma.js";
import { createProxyMiddleware } from "http-proxy-middleware";
import routes from "./routes/gatewayRoute.js";
import adminRouter from "./routes/adminRoute.js";
import authenticate from "./middleware/authenticate.js";
import authorize from "./middleware/authorize.js";
import {
  NotFoundError,
  BadGatewayError,
  GatewayTimeoutError,
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
routes.forEach((route) => {
  app.use(
    route.path,
    createProxyMiddleware({
      pathFilter: route.path,
      target: route.target,
      changeOrigin: true,
      pathRewrite: { [`^${route.path}`]: route.rewriteTo },
      proxyTimeout: 5000,
      timeout: 5000,
      on: {
        error: (err, req, res, next) => {
          if (res.headersSent) return;
          req.next(toAppError(err));
        },
      },
    }),
  );
});

app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});
app.use(errorHandler);

app.listen(PORT, () => console.log(`server started on PORT ${PORT}`));
