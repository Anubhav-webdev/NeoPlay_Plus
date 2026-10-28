import Category from "../models/Category.js";

const DEFAULT_CATEGORIES = [
  ["Study", "study"],
  ["Cartoon", "cartoon"],
  ["Coding", "coding"],
  ["Music", "music"],
  ["Education", "education"],
  ["Gaming", "gaming"],
  ["Science", "science"],
  ["Technology", "technology"],
  ["Entertainment", "entertainment"],
  ["Comedy", "comedy"],
  ["Sports", "sports"],
  ["Art", "art"],
  ["Travel", "travel"],
  ["Food", "food"],
  ["Lifestyle", "lifestyle"],
  ["News", "news"],
  ["Other", "other"],
];

export async function ensureDefaultCategories() {
  await Category.bulkWrite(
    DEFAULT_CATEGORIES.map(([name, slug]) => ({
      updateOne: {
        filter: { slug },
        update: { $setOnInsert: { name, slug } },
        upsert: true,
      },
    })),
    { ordered: false },
  );
}
