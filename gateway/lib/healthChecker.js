import { recordCheck } from "./backendPool.js";

const INTERVAL_MS = 5000;
const TIMEOUT_MS = 2000;

const check = async (target) => {
  try {
    const res = await fetch(`${target}/health`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    recordCheck(target, res.ok);
  } catch {
    recordCheck(target, false);
  }
};

export const startHealthChecks = (routes) => {
  const targets = [...new Set(routes.flatMap((route) => route.targets))];
  const runAll = () => Promise.all(targets.map(check));

  runAll();
  const timer = setInterval(runAll, INTERVAL_MS);
  timer.unref();
};
