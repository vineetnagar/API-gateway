import { redis } from "./redis.js";
import { pickTarget } from "./loadBalancer.js";
import {
  isAvailable,
  beginAttempt,
  recordSuccess,
  recordFailure,
} from "./backendPool.js";
import {
  BadGatewayError,
  GatewayTimeoutError,
  ServiceUnavailableError,
} from "../errors/AppError.js";

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 100;
const ATTEMPT_TIMEOUT_MS = 2000;
const TOTAL_BUDGET_MS = 5000;
const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS ?? 10);
const RETRYABLE_STATUS = new Set([502, 503, 504]);

const SKIP_REQUEST_HEADERS = [
  "host",
  "connection",
  "content-length",
  "accept-encoding",
  "x-api-key",
];
const SKIP_RESPONSE_HEADERS = [
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-encoding",
  "content-length",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cacheEnabled = (req) => req.method === "GET" && CACHE_TTL_SECONDS > 0;
const cacheKey = (req) => `cache:${req.apiKey.id}:${req.originalUrl}`;

const buildHeaders = (req) => {
  const headers = { ...req.headers };
  SKIP_REQUEST_HEADERS.forEach((name) => delete headers[name]);
  headers["x-forwarded-for"] = req.ip;
  return headers;
};

const classify = (err) => {
  const code = err?.cause?.code ?? err?.code;
  return ["ECONNREFUSED", "ENOTFOUND", "ECONNRESET"].includes(code)
    ? new BadGatewayError()
    : new GatewayTimeoutError();
};

const toEntry = (upstreamRes, body) => {
  const headers = {};
  upstreamRes.headers.forEach((value, name) => {
    if (!SKIP_RESPONSE_HEADERS.includes(name)) headers[name] = value;
  });
  return {
    status: upstreamRes.status,
    headers,
    body: body.toString("base64"),
  };
};

const sendEntry = (res, entry, cacheStatus) => {
  Object.entries(entry.headers).forEach(([name, value]) =>
    res.set(name, value),
  );
  res.set("X-Cache", cacheStatus);
  res.status(entry.status).send(Buffer.from(entry.body, "base64"));
};

const isCacheable = (req, upstreamRes) => {
  if (!cacheEnabled(req) || upstreamRes.status !== 200) return false;
  if (upstreamRes.headers.has("set-cookie")) return false;
  const control = upstreamRes.headers.get("cache-control") ?? "";
  return !/no-store|private/i.test(control);
};

const readCache = async (req) => {
  if (!cacheEnabled(req)) return null;
  try {
    const raw = await redis.get(cacheKey(req));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("[cache] read failed:", err.message);
    return null;
  }
};

const writeCache = async (req, entry) => {
  try {
    await redis.set(
      cacheKey(req),
      JSON.stringify(entry),
      "EX",
      CACHE_TTL_SECONDS,
    );
  } catch (err) {
    console.error("[cache] write failed:", err.message);
  }
};

export const forwardSafe = async (route, req, res, next) => {
  try {
    let attempts = 0;
    req.attempts = 0;
    const cached = await readCache(req);
    if (cached) return sendEntry(res, cached, "HIT");

    const started = Date.now();
    const tried = new Set();
    let lastError = null;
    let success = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const remaining = TOTAL_BUDGET_MS - (Date.now() - started);
      if (remaining <= 0) break;

      const target = pickTarget(route, (t) => isAvailable(t) && !tried.has(t));
      if (!target) break;
      tried.add(target);
      beginAttempt(target);

      attempts++;
      req.attempts = attempts;

      try {
        const url =
          target + route.rewriteTo + req.originalUrl.slice(route.path.length);

        const upstreamRes = await fetch(url, {
          method: req.method,
          headers: buildHeaders(req),
          signal: AbortSignal.timeout(Math.min(ATTEMPT_TIMEOUT_MS, remaining)),
        });
        const body = Buffer.from(await upstreamRes.arrayBuffer());

        if (upstreamRes.status >= 500) recordFailure(target);
        else recordSuccess(target);

        if (RETRYABLE_STATUS.has(upstreamRes.status)) {
          lastError = new BadGatewayError();
        } else {
          success = { upstreamRes, body };
        }

        req.backend = target;
      } catch (err) {
        recordFailure(target);
        lastError = classify(err);
      }

      if (success) break;

      if (attempt < MAX_ATTEMPTS - 1) {
        req.log?.warn(
          {
            attempt: req.attempts,
            backend: target,
            err: lastError,
          },
          "Backend attempt failed, retrying",
        );

        await sleep(BASE_DELAY_MS * 2 ** attempt + Math.random() * 50);
      }
    }

    if (success) {
      const entry = toEntry(success.upstreamRes, success.body);
      sendEntry(res, entry, cacheEnabled(req) ? "MISS" : "BYPASS");
      if (isCacheable(req, success.upstreamRes)) writeCache(req, entry);
      return;
    }

    if (tried.size === 0) {
      res.set("Retry-After", "5");
      return next(new ServiceUnavailableError());
    }
    next(lastError ?? new BadGatewayError());
  } catch (err) {
    next(err);
  }
};
