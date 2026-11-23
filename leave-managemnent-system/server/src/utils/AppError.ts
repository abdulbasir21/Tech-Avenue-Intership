export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly data: unknown;

  constructor(statusCode: number, message: string, code?: string, data: unknown = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
