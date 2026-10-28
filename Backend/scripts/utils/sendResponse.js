import ApiResponse from "./ApiResponse.js";

export default function sendResponse(res, statusCode, message, data = null) {
  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, message, data));
}
