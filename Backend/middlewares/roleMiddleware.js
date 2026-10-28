import Creator from "../models/Creator.js";
import ApiError from "../scripts/utils/ApiError.js";
import asyncHandler from "../scripts/utils/asyncHandler.js";

// Restrict endpoints to users with one of the listed account roles.
export function allowRoles(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to do that"));
    }
    return next();
  };
}

// Creator publishing requires an approved creator application, not just a role.
export const requireApprovedCreator = asyncHandler(async (req, res, next) => {
  const creator = await Creator.findOne({
    userId: req.user?._id,
    applicationStatus: "approved",
  });
  if (!creator)
    throw new ApiError(403, "An approved creator account is required");
  req.creator = creator;
  next();
});
