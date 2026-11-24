import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { generateApiKey } from "../services/KeyService.js";
import {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
} from "../errors/AppError.js";

const adminRouter = Router();

const createAPIKey = async (req, res, next) => {
  try {
    const secret = process.env.ADMIN_SECRET;
    if (!secret || req.get("x-admin-secret") !== secret) {
      throw new UnauthorizedError("Invalid admin secret");
    }

    const { customerId, allowedPaths } = req.body ?? {};

    if (!Number.isInteger(customerId)) {
      throw new ValidationError("customerId must be whole number.");
    }

    if (
      !Array.isArray(allowedPaths) ||
      allowedPaths.length === 0 ||
      !allowedPaths.every((p) => typeof p === "string" && p.startsWith("/"))
    ) {
      throw new ValidationError(
        "allowedPaths must be a non-empty list of paths starting with /",
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) throw new NotFoundError("Customer not found");

    const { key, prefix, hash } = generateApiKey();

    await prisma.apiKey.create({
      data: {
        customerId,
        keyHash: hash,
        keyPrefix: prefix,
        allowedPath,
      },
    });

    res.set("Cache-Control", "no-store");
    res.status(201).json({
      key,
      prefix,
      allowedPaths,
      note: "Copy this key now. You will not see it again.",
    });
  } catch (error) {
    next(error);
  }
};
adminRouter.post("/keys", createAPIKey);

export default adminRouter;
