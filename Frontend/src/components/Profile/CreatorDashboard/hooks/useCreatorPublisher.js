import { useState } from 'react';
import { createContent, uploadMedia, waitForMediaUpload } from '../../../../api/mediaApi.js';
import { mapContentToCatalog } from '../contentCatalogUtils.js';

const emptyUpload = { uploadId: null, assetId: null, mediaType: null };

export default function useCreatorPublisher({ categories, setContentCatalog, showToast }) {
  const [form, setForm] = useState({
    type: 'video',
    title: '',
    description: '',
    mediaFile: null,
    thumbnailFile: null,
    categoryId: '',
    publishMode: 'public',
  });
  const [mediaUpload, setMediaUpload] = useState(emptyUpload);
  const [thumbnailUpload, setThumbnailUpload] = useState(emptyUpload);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const updateForm = (field) => (value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetMediaUploadState = () => setMediaUpload(emptyUpload);
  const resetThumbnailUploadState = () => setThumbnailUpload(emptyUpload);

  const handlePublishAsset = async (event) => {
    event.preventDefault();
    const mediaFile = form.mediaFile instanceof File ? form.mediaFile : null;

    if (!form.title.trim()) {
      showToast('A title or post text is required.', 'red');
      return;
    }
    if (form.type !== 'tweet' && form.description.length > 5000) {
      showToast('Description must be 5,000 characters or fewer.', 'red');
      return;
    }
    if (form.type !== 'tweet' && !mediaFile) {
      showToast('Select a local image or video file first.', 'red');
      return;
    }
    if (form.type === 'video' && !(form.thumbnailFile instanceof File)) {
      showToast('Choose a thumbnail image for the video.', 'red');
      return;
    }

    setIsPublishing(true);
    setUploadStatus('Preparing upload');
    let failedUploadKind = null;

    try {
      let mediaAssetId = mediaUpload.assetId;
      let verifiedMediaType = mediaUpload.mediaType;
      if (!mediaAssetId && mediaFile) {
        let uploadId = mediaUpload.uploadId;
        if (!uploadId) {
          const queued = await uploadMedia(mediaFile);
          uploadId = queued.uploadId;
          setMediaUpload((current) => ({ ...current, uploadId }));
        }

        setUploadStatus('Checking for exact and similar media');
        failedUploadKind = 'media';
        const verified = await waitForMediaUpload(uploadId, setUploadStatus);
        failedUploadKind = null;
        if (verified.reviewPending) {
          throw new Error('Possible duplicate: this upload is waiting for moderator review.');
        }

        const expectedType = form.type === 'video'
          ? 'video'
          : form.type === 'image'
            ? 'image'
            : null;
        if (expectedType && verified.mediaType !== expectedType) {
          throw new Error(`Choose a supported ${expectedType} file for this post.`);
        }

        mediaAssetId = verified._id;
        verifiedMediaType = verified.mediaType || null;
        setMediaUpload({ uploadId: null, assetId: mediaAssetId, mediaType: verifiedMediaType });
      }

      const attachmentMediaType = verifiedMediaType || (mediaFile
        ? (mediaFile.type.startsWith('video/') ? 'video' : 'image')
        : null);
      let thumbnailAssetId = null;
      if (form.type === 'video') {
        thumbnailAssetId = thumbnailUpload.assetId;
        if (!thumbnailAssetId) {
          let uploadId = thumbnailUpload.uploadId;
          if (!uploadId) {
            const queued = await uploadMedia(form.thumbnailFile);
            uploadId = queued.uploadId;
            setThumbnailUpload((current) => ({ ...current, uploadId }));
          }

          setUploadStatus('Verifying video thumbnail');
          failedUploadKind = 'thumbnail';
          const verified = await waitForMediaUpload(uploadId, setUploadStatus);
          failedUploadKind = null;
          if (verified.reviewPending) {
            throw new Error('The thumbnail is waiting for duplicate review. Try again after review.');
          }
          if (verified.mediaType !== 'image') {
            throw new Error('Choose a supported image file for the video thumbnail.');
          }

          thumbnailAssetId = verified._id;
          setThumbnailUpload({ uploadId: null, assetId: thumbnailAssetId, mediaType: 'image' });
        }
      }

      const apiType = form.type === 'tweet'
        ? 'Tweet'
        : form.type === 'video'
          ? 'Video'
          : 'Image';
      setUploadStatus(form.publishMode === 'public' ? 'Publishing verified content' : 'Saving draft');
      const content = await createContent({
        type: apiType,
        title: form.type === 'tweet' ? form.title.trim().slice(0, 200) : form.title.trim(),
        description: form.type === 'tweet' ? form.title.trim() : form.description.trim(),
        mediaAssetId,
        thumbnailAssetId,
        categoryIds: form.type !== 'tweet' && form.categoryId ? [form.categoryId] : [],
        publish: form.publishMode === 'public',
      });

      const categoryName = categories.find((category) => category._id === form.categoryId)?.name || '';
      const newItem = mapContentToCatalog(content, {
        categoryName,
        mediaType: form.type === 'tweet' ? attachmentMediaType : form.type,
      });
      setContentCatalog((items) => [newItem, ...items.filter((item) => item.id !== newItem.id)]);

      setForm((current) => ({
        ...current,
        title: '',
        description: '',
        mediaFile: null,
        thumbnailFile: null,
        categoryId: '',
      }));
      setMediaUpload(emptyUpload);
      setThumbnailUpload(emptyUpload);
      setUploadStatus('');
      showToast(form.publishMode === 'public' ? 'Content published.' : 'Draft saved.', 'green');
    } catch (error) {
      if (['duplicate', 'failed'].includes(error.uploadStatus)) {
        if (failedUploadKind === 'thumbnail') {
          setThumbnailUpload(emptyUpload);
        } else {
          setMediaUpload(emptyUpload);
        }
      }
      setUploadStatus('');
      showToast(error.message || 'Content upload failed.', 'red');
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    ...form,
    setContentType: updateForm('type'),
    setFormTitle: updateForm('title'),
    setFormDescription: updateForm('description'),
    setMediaFile: updateForm('mediaFile'),
    setThumbnailFile: updateForm('thumbnailFile'),
    setSelectedCategoryId: updateForm('categoryId'),
    setPublishMode: updateForm('publishMode'),
    isPublishing,
    uploadStatus,
    resetMediaUploadState,
    resetThumbnailUploadState,
    handlePublishAsset,
  };
}
