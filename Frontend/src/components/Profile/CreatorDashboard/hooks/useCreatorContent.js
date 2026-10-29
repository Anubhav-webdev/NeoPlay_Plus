import { useState, useEffect, useRef } from 'react';
import {
  getMyContent,
  getContentCategories,
  createContent,
  publishContentRecord,
  archiveContent,
  updateContentRecord,
  uploadMedia,
  waitForMediaUpload,
} from '../../../../api/mediaApi';

export function useCreatorContent(showToast) {
  const [catalogTab, setCatalogTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [contentCatalog, setContentCatalog] = useState([]);
  const [categories, setCategories] = useState([]);

  // Upload Form Pipeline States
  const [contentType, setContentType] = useState('video');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [pendingThumbnailUploadId, setPendingThumbnailUploadId] = useState(null);
  const [verifiedThumbnailAssetId, setVerifiedThumbnailAssetId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [publishMode, setPublishMode] = useState('public');
  const [uploadedFilesArray, setUploadedFilesArray] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [pendingUploadId, setPendingUploadId] = useState(null);
  const [verifiedMediaAssetId, setVerifiedMediaAssetId] = useState(null);

  // Edit Engine States
  const [editingItemId, setEditingItemId] = useState(null);
  const [editFormState, setEditFormState] = useState({});
  const [editMediaFile, setEditMediaFile] = useState(null);
  const [editThumbnailFile, setEditThumbnailFile] = useState(null);
  const [editThumbnailPendingUploadId, setEditThumbnailPendingUploadId] = useState(null);
  const [editThumbnailAssetId, setEditThumbnailAssetId] = useState(null);
  const [editPendingUploadId, setEditPendingUploadId] = useState(null);
  const [editVerifiedMediaAssetId, setEditVerifiedMediaAssetId] = useState(null);
  const [editUploadStatus, setEditUploadStatus] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingContentId, setDeletingContentId] = useState(null);
  const [publishingContentId, setPublishingContentId] = useState(null);
  const editFileInputRef = useRef(null);

  // Load Content Catalog
  useEffect(() => {
    const controller = new AbortController();
    getMyContent({ signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return;
        setContentCatalog(
          items.map((content) => {
            const type = content.type.toLowerCase();
            return {
              id: content._id,
              type,
              title: content.title,
              description: content.description || '',
              status: content.status || 'published',
              views: content.viewCount || 0,
              likes: 0,
              commentsCount: 0,
              date: content.createdAt ? new Date(content.createdAt).toLocaleDateString() : '',
              category: content.categoryIds?.[0]?.name || '',
              categoryId: content.categoryIds?.[0]?._id || '',
              thumbnailAssetId: content.thumbnailAssetId?._id || content.thumbnailAssetId || '',
              isSubscriberOnly: false,
              mediaUrl: content.mediaUrl || '',
              thumbnail: type === 'video' ? content.thumbnailUrl || '' : content.thumbnailUrl || content.mediaUrl || '',
              images: type === 'image' && content.mediaUrl ? [content.mediaUrl] : [],
            };
          })
        );
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          showToast(error.message || 'Could not load your content.', 'red');
        }
      });
    return () => controller.abort();
  }, [showToast]);

  // Load Content Categories
  useEffect(() => {
    const controller = new AbortController();
    getContentCategories({ signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted) setCategories(items || []);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          showToast(error.message || 'Could not load content categories.', 'red');
        }
      });
    return () => controller.abort();
  }, [showToast]);

  const resetMediaUploadState = () => {
    setVerifiedMediaAssetId(null);
    setPendingUploadId(null);
  };

  const resetThumbnailUploadState = () => {
    setVerifiedThumbnailAssetId(null);
    setPendingThumbnailUploadId(null);
  };

  const handlePublishAsset = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return showToast('A title or post text is required.', 'red');
    if (contentType !== 'tweet' && formDescription.length > 5000) {
      return showToast('Description must be 5,000 characters or fewer.', 'red');
    }
    if (contentType !== 'tweet' && !(uploadedFilesArray[0] instanceof File)) {
      return showToast('Select a local image or video file first.', 'red');
    }
    if (contentType === 'video' && !(thumbnailFile instanceof File)) {
      return showToast('Choose a thumbnail image for the video.', 'red');
    }

    setIsPublishing(true);
    setUploadStatus('Preparing upload');
    try {
      let mediaAssetId = verifiedMediaAssetId;
      if (!mediaAssetId && uploadedFilesArray[0] instanceof File) {
        let uploadId = pendingUploadId;
        if (!uploadId) {
          const queuedUpload = await uploadMedia(uploadedFilesArray[0]);
          uploadId = queuedUpload.uploadId;
          setPendingUploadId(uploadId);
        }
        setUploadStatus('Checking for exact and similar media');
        const verifiedUpload = await waitForMediaUpload(uploadId, setUploadStatus);
        if (verifiedUpload.reviewPending) {
          throw new Error('Possible duplicate: this upload is waiting for moderator review.');
        }
        mediaAssetId = verifiedUpload._id;
        setVerifiedMediaAssetId(mediaAssetId);
        setPendingUploadId(null);
      }

      let thumbnailAssetId = null;
      if (contentType === 'video' && thumbnailFile) {
        thumbnailAssetId = verifiedThumbnailAssetId;
        if (!thumbnailAssetId) {
          let uploadId = pendingThumbnailUploadId;
          if (!uploadId) {
            const queuedUpload = await uploadMedia(thumbnailFile);
            uploadId = queuedUpload.uploadId;
            setPendingThumbnailUploadId(uploadId);
          }
          setUploadStatus('Verifying video thumbnail');
          const verifiedUpload = await waitForMediaUpload(uploadId, setUploadStatus);
          if (verifiedUpload.reviewPending) {
            throw new Error('The thumbnail is waiting for duplicate review. Try again after review.');
          }
          if (verifiedUpload.mediaType !== 'image') {
            throw new Error('Choose a supported image file for the video thumbnail.');
          }
          thumbnailAssetId = verifiedUpload._id;
          setVerifiedThumbnailAssetId(thumbnailAssetId);
          setPendingThumbnailUploadId(null);
        }
      }

      const type = contentType === 'tweet' ? 'Tweet' : contentType === 'video' ? 'Video' : 'Image';
      setUploadStatus(publishMode === 'public' ? 'Publishing verified content' : 'Saving draft');
      const content = await createContent({
        type,
        title: contentType === 'tweet' ? formTitle.trim().slice(0, 200) : formTitle.trim(),
        description: contentType === 'tweet' ? formTitle.trim() : formDescription.trim(),
        mediaAssetId,
        thumbnailAssetId,
        categoryIds: contentType !== 'tweet' && selectedCategoryId ? [selectedCategoryId] : [],
        publish: publishMode === 'public',
      });

      const newAsset = {
        id: content._id,
        type: contentType,
        title: content.title,
        description: content.description || '',
        status: content.status || (publishMode === 'public' ? 'published' : 'draft'),
        views: content.viewCount || 0,
        likes: 0,
        commentsCount: 0,
        date: 'Just now',
        category: categories.find((category) => category._id === selectedCategoryId)?.name || '',
        isSubscriberOnly: false,
        mediaUrl: content.mediaUrl || '',
        thumbnail: content.thumbnailUrl || (contentType === 'image' ? content.mediaUrl : ''),
        images: contentType === 'image' ? [content.mediaUrl] : [],
      };

      setContentCatalog((items) => [newAsset, ...items.filter((item) => item.id !== newAsset.id)]);
      setFormTitle('');
      setFormDescription('');
      setUploadedFilesArray([]);
      setVerifiedMediaAssetId(null);
      setPendingUploadId(null);
      setThumbnailFile(null);
      setVerifiedThumbnailAssetId(null);
      setPendingThumbnailUploadId(null);
      setSelectedCategoryId('');
      setUploadStatus('');
      showToast(publishMode === 'public' ? 'Content published.' : 'Draft saved.', 'green');
    } catch (error) {
      if (['duplicate', 'failed'].includes(error.uploadStatus)) {
        setPendingUploadId(null);
        setVerifiedMediaAssetId(null);
        setPendingThumbnailUploadId(null);
        setVerifiedThumbnailAssetId(null);
      }
      setUploadStatus('');
      showToast(error.message || 'Content upload failed.', 'red');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishDraft = async (id) => {
    setPublishingContentId(id);
    try {
      const published = await publishContentRecord(id);
      setContentCatalog((items) =>
        items.map((item) => (item.id === id ? { ...item, status: published.status || 'published' } : item))
      );
      showToast('Draft published.', 'green');
    } catch (error) {
      showToast(error.message || 'Could not publish this draft.', 'red');
    } finally {
      setPublishingContentId(null);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm('Archive this content? It will no longer be publicly listed.')) return;
    setDeletingContentId(id);
    try {
      await archiveContent(id);
      setContentCatalog((items) => items.filter((item) => item.id !== id));
      showToast('Content archived.', 'green');
    } catch (error) {
      showToast(error.message || 'Could not archive content.', 'red');
    } finally {
      setDeletingContentId(null);
    }
  };

  const startEditingAsset = (asset) => {
    setEditingItemId(asset.id);
    setEditFormState({ ...asset });
    setEditMediaFile(null);
    setEditThumbnailFile(null);
    setEditThumbnailPendingUploadId(null);
    setEditThumbnailAssetId(null);
    setEditPendingUploadId(null);
    setEditVerifiedMediaAssetId(null);
    setEditUploadStatus('');
  };

  const cancelEditingAsset = () => {
    setEditingItemId(null);
    setEditFormState({});
    setEditMediaFile(null);
    setEditThumbnailFile(null);
    setEditThumbnailPendingUploadId(null);
    setEditThumbnailAssetId(null);
    setEditPendingUploadId(null);
    setEditVerifiedMediaAssetId(null);
    setEditUploadStatus('');
  };

  const saveEditedAsset = async () => {
    if (!editFormState.title?.trim()) {
      showToast('Content title or post text is required.', 'red');
      return;
    }
    setIsSavingEdit(true);
    setEditUploadStatus(editMediaFile ? 'Preparing replacement media' : 'Saving changes');
    let editUploadKind = null;
    try {
      let mediaAssetId = editVerifiedMediaAssetId;
      if (editMediaFile && !mediaAssetId) {
        let uploadId = editPendingUploadId;
        if (!uploadId) {
          const queuedUpload = await uploadMedia(editMediaFile);
          uploadId = queuedUpload.uploadId;
          setEditPendingUploadId(uploadId);
        }
        setEditUploadStatus('Verifying replacement media');
        editUploadKind = 'media';
        const verifiedUpload = await waitForMediaUpload(uploadId, setEditUploadStatus);
        editUploadKind = null;
        if (verifiedUpload.reviewPending) {
          setEditUploadStatus('Possible duplicate: waiting for moderator review. Save again after review.');
          throw new Error('Possible duplicate: replacement media is waiting for moderator review.');
        }
        mediaAssetId = verifiedUpload._id;
        setEditVerifiedMediaAssetId(mediaAssetId);
        setEditPendingUploadId(null);
      }

      let thumbnailAssetId = editThumbnailAssetId;
      if (editFormState.type === 'video' && editThumbnailFile && !thumbnailAssetId) {
        let uploadId = editThumbnailPendingUploadId;
        if (!uploadId) {
          const queuedUpload = await uploadMedia(editThumbnailFile);
          uploadId = queuedUpload.uploadId;
          setEditThumbnailPendingUploadId(uploadId);
        }
        setEditUploadStatus('Verifying replacement thumbnail');
        editUploadKind = 'thumbnail';
        const verifiedThumbnail = await waitForMediaUpload(uploadId, setEditUploadStatus);
        editUploadKind = null;
        if (verifiedThumbnail.reviewPending) {
          throw new Error('The thumbnail is waiting for duplicate review. Try again after review.');
        }
        if (verifiedThumbnail.mediaType !== 'image') {
          throw new Error('Choose a supported image file for the video thumbnail.');
        }
        thumbnailAssetId = verifiedThumbnail._id;
        setEditThumbnailAssetId(thumbnailAssetId);
        setEditThumbnailPendingUploadId(null);
      }

      const payload = {
        title: editFormState.title.trim(),
        description: editFormState.type === 'tweet' ? editFormState.title.trim() : (editFormState.description || '').trim(),
        categoryIds: editFormState.type !== 'tweet' && editFormState.categoryId ? [editFormState.categoryId] : [],
        ...(mediaAssetId ? { mediaAssetId } : {}),
        ...(thumbnailAssetId ? { thumbnailAssetId } : {}),
      };

      const updated = await updateContentRecord(editingItemId, payload);
      setContentCatalog((items) =>
        items.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                title: updated.title,
                description: updated.description || '',
                status: updated.status || item.status,
                categoryId: editFormState.categoryId || '',
                category: categories.find((category) => category._id === editFormState.categoryId)?.name || '',
                mediaUrl: updated.mediaUrl || '',
                thumbnail: updated.thumbnailUrl || (item.type === 'image' ? updated.mediaUrl || '' : ''),
                thumbnailAssetId: updated.thumbnailAssetId || item.thumbnailAssetId || '',
                images: item.type === 'image' && updated.mediaUrl ? [updated.mediaUrl] : [],
              }
            : item
        )
      );
      cancelEditingAsset();
      showToast('Content updated.', 'green');
    } catch (error) {
      if (['duplicate', 'failed'].includes(error.uploadStatus)) {
        if (editUploadKind === 'thumbnail') {
          setEditThumbnailPendingUploadId(null);
          setEditThumbnailAssetId(null);
        } else {
          setEditPendingUploadId(null);
          setEditVerifiedMediaAssetId(null);
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

  const handleEditMediaFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setEditMediaFile(file);
    setEditPendingUploadId(null);
    setEditVerifiedMediaAssetId(null);
    setEditUploadStatus('');
  };

  const handleEditThumbnailFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setEditThumbnailFile(file);
    setEditThumbnailPendingUploadId(null);
    setEditThumbnailAssetId(null);
    setEditUploadStatus('');
  };

  const filteredCatalog = contentCatalog.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = catalogTab === 'all' ? true : item.type === catalogTab;
    return matchesSearch && matchesTab;
  });

  return {
    catalogTab, setCatalogTab,
    searchQuery, setSearchQuery,
    contentType, setContentType,
    formTitle, setFormTitle,
    formDescription, setFormDescription,
    uploadedFilesArray, setUploadedFilesArray,
    thumbnailFile, setThumbnailFile,
    categories, selectedCategoryId, setSelectedCategoryId,
    publishMode, setPublishMode,
    isPublishing, uploadStatus,
    filteredCatalog, editingItemId,
    editFormState, setEditFormState,
    editFileInputRef, editMediaFile, editThumbnailFile,
    editUploadStatus, isSavingEdit,
    publishingContentId, deletingContentId,
    resetMediaUploadState, resetThumbnailUploadState,
    handlePublishAsset, handlePublishDraft, handleDeleteAsset,
    startEditingAsset, cancelEditingAsset, saveEditedAsset,
    handleEditMediaFileChange, handleEditThumbnailFileChange,
  };
}