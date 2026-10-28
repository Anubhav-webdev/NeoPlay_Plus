// Keep successful responses predictable for frontend API clients.
export default class ApiResponse {
  constructor(statusCode, message, data = null) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }
}
