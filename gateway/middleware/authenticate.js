import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { getPrefix, hashKey } from "../services/KeyService.js";
import { UnauthorizedError } from "../errors/AppError.js";
const authenticate = async (req, res, next) => {
  const INVALID_KEY = "Invalid API key";
  try {
    const apiKey = req.get("x-api-key");
    if (!apiKey) {
      throw new UnauthorizedError(INVALID_KEY);
    }

    const record = await prisma.apiKey.findFirst({
      where: { keyPrefix: getPrefix(apiKey) },
    });

    if (!record) throw new UnauthorizedError(INVALID_KEY);

    const incoming = Buffer.from(hashKey(apiKey), "hex");
    const stored = Buffer.from(record.keyHash, "hex");

    if (
      incoming.length !== stored.length ||
      !crypto.timingSafeEqual(incoming, stored)
    ) {
      throw new UnauthorizedError(INVALID_KEY);
    }

    if (!record.isActive) throw new UnauthorizedError(INVALID_KEY);
    if (record.expiresAt && record.expiresAt <= new Date()) {
      throw new UnauthorizedError(INVALID_KEY);
    }

    req.apiKey = {
      id: record.id,
      customerId: record.customerId,
      allowedPaths: record.allowedPaths,
      rateLimitPerMinute: record.rateLimitPerMinute,
    };
    console.log("API KEY DETAILS:", req.apiKey);

    prisma.apiKey
      .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
