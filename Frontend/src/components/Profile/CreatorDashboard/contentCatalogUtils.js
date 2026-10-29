export function mapContentToCatalog(content, { categoryName, mediaType: mediaTypeOverride } = {}) {
  const type = String(content.type || '').toLowerCase();
  const mediaUrl = content.mediaUrl || '';
  const mediaType = mediaTypeOverride
    || content.mediaAssetId?.mediaType
    || (type === 'video' || type === 'image' ? type : null);
  const category = content.categoryIds?.[0];

  return {
    id: content._id,
    type,
    title: content.title || '',
    description: content.description || '',
    status: content.status || 'draft',
    views: Number(content.viewCount) || 0,
    category: categoryName ?? category?.name ?? '',
    categoryId: category?._id || category || '',
    mediaUrl,
    mediaType,
    thumbnail: content.thumbnailUrl || (mediaType === 'image' ? mediaUrl : ''),
  };
}
