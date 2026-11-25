import { UnauthorizedError, ForbiddenError } from "../errors/AppError.js";

const isPathAllowed = (allowedPaths, requestedPaths) =>
  allowedPaths.some(
    (allowed) =>
      requestedPaths === allowed || requestedPaths.startsWith(`${allowed}/`),
  );
const authorize = async (req, res, next) => {
  try {
    if (!req.apiKey) throw new UnauthorizedError("Invalid API Key");

    const { allowedPaths } = req.apiKey;
    const requestedPath = req.path;

    if (!isPathAllowed(allowedPaths, requestedPath)) {
      throw new ForbiddenError("You do not have access to this resource");
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default authorize;
