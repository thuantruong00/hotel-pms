/**
 * Domain error with a stable error code. The error middleware converts it to
 * the standard `{ error: { code, message } }` response.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(code: string, message: string, details?: unknown) {
    return new AppError(400, code, message, details);
  }
  static unauthorized(code = "UNAUTHENTICATED", message = "Authentication is required") {
    return new AppError(401, code, message);
  }
  static forbidden(
    code = "FORBIDDEN",
    message = "You do not have permission to perform this operation",
  ) {
    return new AppError(403, code, message);
  }
  static notFound(code: string, message: string) {
    return new AppError(404, code, message);
  }
  static conflict(code: string, message: string, details?: unknown) {
    return new AppError(409, code, message, details);
  }
  static unprocessable(code: string, message: string, details?: unknown) {
    return new AppError(422, code, message, details);
  }
}

export const isAppError = (err: unknown): err is AppError => err instanceof AppError;
