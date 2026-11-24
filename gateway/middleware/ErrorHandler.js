import { AppError } from "../errors/AppError.js";

const errorHandler = (err, req, res) => {
  if (res.headersSent) return next(err);

  const isKnown = err instanceof AppError;

  if (!isKnown) console.error(err);

  (res.status(isKnown ? err.statusCode : 500),
    json({
      error: {
        code: isKnown ? err.code : "INTERNAL_ERROR",
        message: isKnown ? err.message : "Something went wrong",
        ...(isKnown && err.details && { details: err.details }),
      },
    }));
};

export default errorHandler;
