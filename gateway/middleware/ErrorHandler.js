import { AppError } from "../errors/AppError.js";

const errorHandler = (err, req, res, next) => {
  try {
    if (res.headersSent) return next(err);

    const isKnown = err instanceof AppError;

    if (!isKnown) {
      req.log.error({ err }, "Unexpected application error");
    }
    (res.status(isKnown ? err.statusCode : 500),
      res.json({
        error: {
          code: isKnown ? err.code : "INTERNAL_ERROR",
          message: isKnown ? err.message : "Something went wrong",
          ...(isKnown && err.details && { details: err.details }),
        },
      }));

    next();
  } catch (error) {
    next(error);
  }
};

export default errorHandler;
