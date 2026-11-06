export function serializeContentWithThumbnail(content, cloudinary) {
  const value = content.toObject ? content.toObject() : content;
  const thumbnailUrl =
    value.thumbnailUrl ||
    value.thumbnailAssetId?.secureUrl ||
    (value.type === "Video" && value.mediaPublicId
      ? cloudinary.url(value.mediaPublicId, {
          resource_type: "video",
          format: "jpg",
          transformation: [{ start_offset: "0" }],
        })
      : null);
  return { ...value, thumbnailUrl };
}

export function serializeContentReference(item, cloudinary) {
  const content = item.contentId;
  if (!content) return item;
  const itemValue = item.toObject ? item.toObject() : item;
  return {
    ...itemValue,
    contentId: serializeContentWithThumbnail(content, cloudinary),
  };
}
