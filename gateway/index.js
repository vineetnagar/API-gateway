import "dotenv/config";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import routes from "./routes/gatewayRoute.js";
import {
  NotFoundError,
  BadGatewayError,
  GatewayTimeoutError,
} from "./errors/AppError.js";
import { errorHandler } from "./middleware/ErrorHandler.js";
const app = express();
const PORT = process.env.PORT || 3000;

const toAppError = (err) =>
  ["ECONNREFUSED", "ENOTFOUND"].includes(err.code)
    ? new BadGatewayError()
    : new GatewayTimeoutError();

routes.forEach((route) => {
  app.use(
    route.path,
    createProxyMiddleware({
      target: route.target,
      changeOrigin: true,
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
app.listen(PORT, () => console.log(`server started on PORT ${PORT}`));
