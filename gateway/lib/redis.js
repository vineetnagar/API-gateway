import Redis from "ioredis";
export const redis = new Redis(process.env.REDIS_URL);

redis.on("connect", () => {
  console.log("Redis connecting...");
});

redis.on("ready", () => {
  console.log("Redis connected successfully");
});

redis.on("error", (err) => {
  console.log("Redis connection failed", err.message);
});
