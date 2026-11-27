import { logger } from "./logger.js";

const state = new Map();

const FAIL_LIMIT = 3;
const PASS_LIMIT = 2;
const BREAKER_FAILS = 5;
const BREAKER_COOLDOWN_MS = 20000;

const getState = (target) => {
  if (!state.has(target)) {
    state.set(target, {
      healthy: true,
      fails: 0,
      passes: 0,
      breaker: "closed",
      requestFails: 0,
      openedAt: 0,
      trial: false,
    });
  }
  return state.get(target);
};

export const isHealthy = (target) => getState(target).healthy;

export const recordCheck = (target, ok) => {
  const s = getState(target);

  if (ok) {
    s.fails = 0;
    s.passes += 1;
    if (!s.healthy && s.passes >= PASS_LIMIT) {
      s.healthy = true;
      logger.info({ backend: target }, "Backend marked healthy");
    }
  } else {
    s.passes = 0;
    s.fails += 1;
    if (s.healthy && s.fails >= FAIL_LIMIT) {
      s.healthy = false;
      logger.warn({ backend: target }, "Backend marked unhealthy");
    }
  }
};

export const isAvailable = (target) => {
  const s = getState(target);
  if (!s.healthy) return false;
  if (s.breaker === "closed") return true;
  if (s.breaker === "open") {
    return Date.now() - s.openedAt >= BREAKER_COOLDOWN_MS;
  }
  return !s.trial;
};

export const beginAttempt = (target) => {
  const s = getState(target);
  if (s.breaker === "open") s.breaker = "half-open";
  if (s.breaker === "half-open") s.trial = true;
};

export const recordSuccess = (target) => {
  const s = getState(target);
  if (s.breaker !== "closed")
    logger.info({ backend: target }, "Circuit breaker closed");
  s.breaker = "closed";
  s.requestFails = 0;
  s.trial = false;
};

export const recordFailure = (target) => {
  const s = getState(target);
  s.requestFails += 1;
  if (s.breaker === "half-open" || s.requestFails >= BREAKER_FAILS) {
    if (s.breaker !== "open")
      logger.warn({ backend: target }, "Circuit breaker opened");
    s.breaker = "open";
    s.openedAt = Date.now();
    s.trial = false;
  }
};
