import mongoose from "mongoose";
import ApiError from "./ApiError.js";

export default function validateObjectId(id, label = "id") {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return id;
}
