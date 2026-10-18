export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: string = "APP_ERROR",
    statusCode: number = 400,
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource tidak ditemukan") {
    super(message, "NOT_FOUND", 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Akses tidak diizinkan") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Anda tidak memiliki hak akses") {
    super(message, "FORBIDDEN", 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Data input tidak valid", details?: unknown) {
    super(message, "VALIDATION_ERROR", 422, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Unit sudah tidak tersedia untuk tanggal tersebut", details?: unknown) {
    super(message, "CONFLICT", 409, details);
  }
}
