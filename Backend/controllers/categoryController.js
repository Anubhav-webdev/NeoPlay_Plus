import Category from "../models/Category.js";
import Content from "../models/Content.js";
import ApiError from "../scripts/utils/ApiError.js";
import asyncHandler from "../scripts/utils/asyncHandler.js";
import sendResponse from "../scripts/utils/sendResponse.js";
import validateObjectId from "../scripts/utils/validateObjectId.js";

function toSlug(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  return sendResponse(res, 200, "Categories retrieved", { categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name || name.length > 100)
    throw new ApiError(400, "Category name is required (max 100)");
  const slug = String(req.body.slug || toSlug(name))
    .trim()
    .toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new ApiError(
      400,
      "Slug must contain lowercase letters, numbers, and hyphens"
    );
  }
  const category = await Category.create({ name, slug });
  return sendResponse(res, 201, "Category created", { category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  validateObjectId(req.params.categoryId, "categoryId");
  const category = await Category.findById(req.params.categoryId);
  if (!category) throw new ApiError(404, "Category not found");
  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name || name.length > 100)
      throw new ApiError(400, "Category name is invalid");
    category.name = name;
  }
  if (req.body.slug !== undefined || req.body.name !== undefined) {
    category.slug = String(req.body.slug || toSlug(category.name))
      .trim()
      .toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category.slug)) {
      throw new ApiError(
        400,
        "Slug must contain lowercase letters, numbers, and hyphens"
      );
    }
  }
  await category.save();
  return sendResponse(res, 200, "Category updated", { category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  validateObjectId(req.params.categoryId, "categoryId");
  const category = await Category.findById(req.params.categoryId);
  if (!category) throw new ApiError(404, "Category not found");
  await Content.updateMany(
    { categoryIds: category._id },
    { $pull: { categoryIds: category._id } }
  );
  await category.deleteOne();
  return sendResponse(res, 200, "Category deleted");
});
