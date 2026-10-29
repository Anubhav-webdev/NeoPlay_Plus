import { useRef, useState } from 'react';
import {
  archiveContent,
  publishContentRecord,
  updateContentRecord,
  uploadMedia,
  waitForMediaUpload,
} from '../../../../api/mediaApi.js';

export default function useCreatorCatalogActions({ categories, setContentCatalog, showToast }) {
  const [editingItemId, setEditingItemId] = useState(null);
  const [editFormState, setEditFormState] = useState({});
  const [editMediaFile, setEditMediaFile] = useState(null);
  const [editThumbnailFile, setEditThumbnailFile] = useState(null);
  const [editMediaUpload, setEditMediaUpload] = useState({ uploadId: null, assetId: null });
  const [editThumbnailUpload, setEditThumbnailUpload] = useState({ uploadId: null, assetId: null });
  const [editUploadStatus, setEditUploadStatus] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingContentId, setDeletingContentId] = useState(null);
  const [publishingContentId, setPublishingContentId] = useState(null);
  const editFileInputRef = useRef(null);

  const startEditingAsset = (asset) => {
    setEditingItemId(asset.id);
    setEditFormState({ ...asset });
    setEditMediaFile(null);
    setEditThumbnailFile(null);
    setEditMediaUpload({ uploadId: null, assetId: null });
    setEditThumbnailUpload({ uploadId: null, assetId: null });
    setEditUploadStatus('');
  };

  const cancelEditingAsset = () => {
    setEditingItemId(null);
    setEditFormState({});
    setEditMediaFile(null);
    setEditThumbnailFile(null);
    setEditMediaUpload({ uploadId: null, assetId: null });
    setEditThumbnailUpload({ uploadId: null, assetId: null });
    setEditUploadStatus('');
  };

  const handleEditMediaFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setEditMediaFile(file);
    setEditMediaUpload({ uploadId: null, assetId: null });
    setEditUploadStatus('');
  };

  const handleEditThumbnailFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setEditThumbnailFile(file);
    setEditThumbnailUpload({ uploadId: null, assetId: null });
    setEditUploadStatus('');
  };

  const handlePublishDraft = async (contentId) => {
    setPublishingContentId(contentId);
    try {
      const published = await publishContentRecord(contentId);
      setContentCatalog((items) => items.map((item) => (
        item.id === contentId ? { ...item, status: published.status || 'published' } : item
      )));
      showToast('Draft published.', 'green');
    } catch (error) {
      showToast(error.message || 'Could not publish this draft.', 'red');
    } finally {
      setPublishingContentId(null);
    }
  };

  const handleDeleteAsset = async (contentId) => {
    if (!window.confirm('Archive this content? It will no longer be publicly listed.')) return;
    setDeletingContentId(contentId);
    try {
      await archiveContent(contentId);
      setContentCatalog((items) => items.filter((item) => item.id !== contentId));
      showToast('Content archived.', 'green');
    } catch (error) {
      showToast(error.message || 'Could not archive content.', 'red');
    } finally {
      setDeletingContentId(null);
    }
  };

  const saveEditedAsset = async () => {
    const title = editFormState.title?.trim();
    if (!title) {
      showToast('Content title or post text is required.', 'red');
      return;
    }

    setIsSavingEdit(true);
    setEditUploadStatus(editMediaFile ? 'Preparing replacement media' : 'Saving changes');
    let failedUploadKind = null;

    try {
      let mediaAssetId = editMediaUpload.assetId;
      if (editMediaFile && !mediaAssetId) {
        let uploadId = editMediaUpload.uploadId;
        if (!uploadId) {
          const queued = await uploadMedia(editMediaFile);
          uploadId = queued.uploadId;
          setEditMediaUpload({ uploadId, assetId: null });
        }

        setEditUploadStatus('Verifying replacement media');
        failedUploadKind = 'media';
        const verified = await waitForMediaUpload(uploadId, setEditUploadStatus);
        failedUploadKind = null;
        if (verified.reviewPending) {
          setEditUploadStatus('Possible duplicate: waiting for moderator review. Save again after review.');
          throw new Error('Possible duplicate: replacement media is waiting for moderator review.');
        }

        mediaAssetId = verified._id;
        setEditMediaUpload({ uploadId: null, assetId: mediaAssetId });
      }

      let thumbnailAssetId = editThumbnailUpload.assetId;
      if (editFormState.type === 'video' && editThumbnailFile && !thumbnailAssetId) {
        let uploadId = editThumbnailUpload.uploadId;
        if (!uploadId) {
          const queued = await uploadMedia(editThumbnailFile);
          uploadId = queued.uploadId;
          setEditThumbnailUpload({ uploadId, assetId: null });
        }

        setEditUploadStatus('Verifying replacement thumbnail');
        failedUploadKind = 'thumbnail';
        const verified = await waitForMediaUpload(uploadId, setEditUploadStatus);
        failedUploadKind = null;
        if (verified.reviewPending) {
          throw new Error('The thumbnail is waiting for duplicate review. Try again after review.');
        }
        if (verified.mediaType !== 'image') {
          throw new Error('Choose a supported image file for the video thumbnail.');
        }

        thumbnailAssetId = verified._id;
        setEditThumbnailUpload({ uploadId: null, assetId: thumbnailAssetId });
      }

      const categoryId = editFormState.categoryId || '';
      const payload = {
        title,
        description: editFormState.type === 'tweet'
          ? title
          : (editFormState.description || '').trim(),
        categoryIds: editFormState.type !== 'tweet' && categoryId ? [categoryId] : [],
        ...(mediaAssetId ? { mediaAssetId } : {}),
        ...(thumbnailAssetId ? { thumbnailAssetId } : {}),
      };
      const updated = await updateContentRecord(editingItemId, payload);
      const category = categories.find((item) => item._id === categoryId);
      setContentCatalog((items) => items.map((item) => {
        if (item.id !== editingItemId) return item;
        const mediaUrl = updated.mediaUrl || item.mediaUrl;
        const mediaType = updated.mediaAssetId?.mediaType || item.mediaType;
        return {
          ...item,
          title: updated.title || title,
          description: updated.description || '',
          status: updated.status || item.status,
          categoryId,
          category: category?.name || '',
          mediaUrl,
          mediaType,
          thumbnail: updated.thumbnailUrl || (mediaType === 'image' ? mediaUrl : item.thumbnail),
        };
      }));
      cancelEditingAsset();
      showToast('Content updated.', 'green');
    } catch (error) {
      if (['duplicate', 'failed'].includes(error.uploadStatus)) {
        if (failedUploadKind === 'thumbnail') {
          setEditThumbnailUpload({ uploadId: null, assetId: null });
        } else {
          setEditMediaUpload({ uploadId: null, assetId: null });
        }
      }
      if (!error.uploadStatus && !error.message?.includes('waiting for moderator review')) {
        setEditUploadStatus(error.message || 'Could not save changes.');
      }
      showToast(error.message || 'Could not save changes.', 'red');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return {
    editingItemId,
    editFormState,
    setEditFormState,
    editMediaFile,
    editThumbnailFile,
    editFileInputRef,
    editUploadStatus,
    isSavingEdit,
    deletingContentId,
    publishingContentId,
    startEditingAsset,
    cancelEditingAsset,
    handleEditMediaFileChange,
    handleEditThumbnailFileChange,
    handlePublishDraft,
    handleDeleteAsset,
    saveEditedAsset,
  };
}
