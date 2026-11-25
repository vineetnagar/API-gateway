import { redis } from "../lib/redis.js";
import { TooManyRequestError, UnauthorizedError } from "../errors/AppError.js";

const rateLimiter = async (req, res, next) => {
  try {
    if (!req.apiKey) {
      throw new UnauthorizedError("Invalid API Key");
    }

    const { id, rateLimitPerMinute } = req.apiKey;
    console.log("RATE LIMIT:", rateLimitPerMinute);
    const currentTime = Math.floor(Date.now() / 1000);
    const currentBlock = Math.floor(currentTime / 60);
    const secondsUntilReset = 60 - (currentTime % 60);

    const redisKey = `ratelimit:${id}:${currentBlock}`;

    let result;

    try {
      result = await redis.multi().incr(redisKey).expire(redisKey, 70).exec();

      const transactionError = result?.find(
        (commandResult) => commandResult?.[0],
      );

      if (transactionError) {
        throw transactionError[0];
      }
    } catch (error) {
      console.error("Redis is unavailable:", error.message);
      return next();
    }

    const requestCount = result[0][1];
    const remaining = Math.max(0, rateLimitPerMinute - requestCount);

    res.setHeader("X-RateLimit-Limit", rateLimitPerMinute);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", secondsUntilReset);

    if (requestCount > rateLimitPerMinute) {
      res.setHeader("Retry-After", secondsUntilReset);

      throw new TooManyRequestError(
        `Rate limit exceeded. Try again in ${secondsUntilReset} seconds.`,
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default rateLimiter;
