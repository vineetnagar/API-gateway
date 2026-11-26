export class AppError extends Error {
  constructor(message, statusCode, code, details) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input", details) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have access to this resource.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class TooManyRequestError extends AppError {
  constructor(message = "Too many request frequently, wait a minute") {
    super(message, 429, "RATE_LIMITED");
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "No Backend is available right now") {
    super(message, 503, "SERVICE_UNAVAILABLE");
  }
}
export class BadGatewayError extends AppError {
  constructor(message = "Upstream service unavailable") {
    super(message, 502, "BAD_GATEWAY");
  }
}

export class GatewayTimeoutError extends AppError {
  constructor(message = " Upstream service timed out") {
    super(message, 504, "GATEWAY_TIMEOUT");
  }
}
