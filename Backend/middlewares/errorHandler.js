import ApiError from "../scripts/utils/ApiError.js";

// Hide internal error details in production while preserving useful server logs.
export default function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const statusCode =
    error instanceof ApiError
      ? error.statusCode
      : error.name === "ValidationError"
        ? 400
        : error.name === "CastError"
          ? 400
          : error.code === 11000
            ? 409
            : Number(error.statusCode || error.status) || 500;
  const message =
    error instanceof ApiError
      ? error.message
      : statusCode < 500
        ? error.message
        : "Internal server error";

  if (statusCode >= 500) console.error(error);
  return res.status(statusCode).json({ success: false, message });
}
