import Report from "../models/Report.js";
import Content from "../models/Content.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendResponse from "../utils/sendResponse.js";
import validateObjectId from "../utils/validateObjectId.js";

export const createReport = asyncHandler(async (req, res) => {
  validateObjectId(req.params.contentId, "contentId");
  const content = await Content.findOne({
    _id: req.params.contentId,
    status: "published",
  });
  if (!content) throw new ApiError(404, "Published content not found");
  const allowedReasons = [
    "spam",
    "harassment",
    "hate",
    "violence",
    "copyright",
    "sexual",
    "misinformation",
    "other",
  ];
  if (!allowedReasons.includes(req.body.reason)) {
    throw new ApiError(400, "A valid report reason is required");
  }
  const report = await Report.create({
    reporterId: req.user._id,
    contentId: content._id,
    reason: req.body.reason,
  });
  return sendResponse(res, 201, "Report submitted", { report });
});

export const listReports = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(req.query.limit, 10) || 30)
  );
  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate("reporterId", "name username email")
      .populate("contentId", "title type status creatorId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Report.countDocuments(filter),
  ]);
  return sendResponse(res, 200, "Reports retrieved", {
    reports,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const updateReportStatus = asyncHandler(async (req, res) => {
  validateObjectId(req.params.reportId, "reportId");
  const allowedStatuses = ["pending", "reviewing", "resolved", "dismissed"];
  if (!allowedStatuses.includes(req.body.status)) {
    throw new ApiError(
      400,
      "status must be pending, reviewing, resolved, or dismissed"
    );
  }
  const report = await Report.findByIdAndUpdate(
    req.params.reportId,
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  if (!report) throw new ApiError(404, "Report not found");
  return sendResponse(res, 200, "Report status updated", { report });
});
