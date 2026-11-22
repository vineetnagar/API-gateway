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

export class BadGatewayError extends ApError {
  constructor(message = "Upstream service unavailable") {
    super(message, 502, "BAD_GATEWAY");
  }
}

export class GatewayTimeoutError extends AppError {
  constructor(message = " Upstream service timed out") {
    super(message, 504, "GATEWAY_TIMEOUT");
  }
}
