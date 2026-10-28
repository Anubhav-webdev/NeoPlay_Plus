// Consistent HTTP errors let the final middleware return safe API messages.
export default class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}
