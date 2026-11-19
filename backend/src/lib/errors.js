// Small error class so route handlers can throw and one middleware formats the response.
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const validation = (msg) => new ApiError(400, 'VALIDATION_ERROR', msg);
export const notFound = (msg) => new ApiError(404, 'NOT_FOUND', msg);
export const conflict = (code, msg) => new ApiError(409, code, msg);
