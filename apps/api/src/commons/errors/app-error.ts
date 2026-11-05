export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "MALFORMED_BODY"
  | "UNSUPPORTED_MEDIA"
  | "UNAUTHORIZED"
  | "INVALID_CREDENTIALS"
  | "FORBIDDEN"
  | "CORS_NOT_ALLOWED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "ACCOUNT_LOCKED"
  | "QUOTA_EXCEEDED"
  | "TOO_MANY_REQUESTS"
  | "GENERATION_FAILED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_SERVER_ERROR";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(statusCode: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(400, "BAD_REQUEST", message);
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown, message = "Validation failed") {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class UnsupportedMediaError extends AppError {
  constructor(message = "Only JPEG, PNG and WebP images are supported") {
    super(415, "UNSUPPORTED_MEDIA", message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(409, "CONFLICT", message);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = "Payload too large") {
    super(413, "PAYLOAD_TOO_LARGE", message);
  }
}

export class AccountLockedError extends AppError {
  constructor(message: string, retryAfterSeconds: number) {
    super(429, "ACCOUNT_LOCKED", message, { retryAfterSeconds });
  }
}

export class QuotaExceededError extends AppError {
  constructor(limit: number, resetsAt: Date) {
    super(429, "QUOTA_EXCEEDED", `Daily generation limit of ${limit} reached`, {
      limit,
      resetsAt: resetsAt.toISOString(),
    });
  }
}

export class GenerationFailedError extends AppError {
  constructor(message = "Image generation failed, please try again") {
    super(502, "GENERATION_FAILED", message);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable") {
    super(503, "SERVICE_UNAVAILABLE", message);
  }
}
