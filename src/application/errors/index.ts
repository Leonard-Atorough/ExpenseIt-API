export class AppError extends Error {
  code: number | string;
  constructor(message: string, code: number | string = 500) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed") {
    super(message, 400);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  static fromZodErrors(errors: any): ValidationError {
    const message = errors;
    return new ValidationError(message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflict") {
    super(message, 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Internal Server Error") {
    super(message, 500);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad Request") {
    super(message, 400);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = "Service Unavailable") {
    super(message, 503);
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = "Request Timeout") {
    super(message, 504);
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class UnknownError extends AppError {
  constructor(message: string = "An unknown error occurred") {
    super(message, 500);
    Object.setPrototypeOf(this, UnknownError.prototype);
  }
}

export class PrismaError extends AppError {
  constructor(message: string, code: string) {
    super(message, code);
    Object.setPrototypeOf(this, PrismaError.prototype);
  }
}
