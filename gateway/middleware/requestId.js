import crypto from "crypto";

export const requestIdForEachRequest = (req, res, next) => {
  const id = crypto.randomUUID();

  req.requestId = id;
  res.setHeader("x-request-id", id);

  next();
};
