import { useState, useRef, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { loginSuccess } from '../../../redux/slices/authSlice';
import "../../../App.css";

import IdentitySuite from '../../Profile/CreatorDashboard/CreatorIdentity';
import MetricArchitecture from '../../Profile/CreatorDashboard/CreatorAnalytics';
import UploadContentForm from '../../Profile/CreatorDashboard/UploadContentForm';
import ContentCatalogStream from '../../Profile/CreatorDashboard/ContentCatalogStream';
import DiagnosticMatrix from '../../Profile/CreatorDashboard/DiagnosticMatrix';
import RegistryModals from '../../Profile/CreatorDashboard/RegistryModals';
import {
  addCommentReply,
  getMyCreatorComments,
} from '../../../api/commentsApi';
import {
  archiveContent,
  applyAsCreator,
  createContent,
  getMyCreatorAnalytics,
  getMyCreatorProfile,
  getMyContent,
  updateContentRecord,
  uploadMedia,
  waitForMediaUpload,
} from '../../../api/mediaApi';

function CreatorStudio({ creator, user }) {
  // Global States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [catalogTab, setCatalogTab] = useState('all');
  const [commentTab, setCommentTab] = useState('all');
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  // Edit State Engine
  const [editingItemId, setEditingItemId] = useState(null);
  const [editFormState, setEditFormState] = useState({});
  const editFileInputRef = useRef(null);

  // Identity States
  const [channelIdentity, setChannelIdentity] = useState({
    name: creator.displayName,
    tagline: "",
    about: "",
    username: user.username ? `@${user.username}` : "",
    isVerified: true,
    avatar: creator.avatar || "",
    wallpaper: "",
  });
  const [isEditingProfileText, setIsEditingProfileText] = useState(false);
  const avatarInputRef = useRef(null);
  const wallpaperInputRef = useRef(null);

  // Data Arrays
  const [followers] = useState([]);
  const [following, setFollowing] = useState([]);

  // Form Pipeline Pipeline States
  const [contentType, setContentType] = useState('video');
  const [formTitle, setFormTitle] = useState('');
  const [uploadedFilesArray, setUploadedFilesArray] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [pendingUploadId, setPendingUploadId] = useState(null);
  const [verifiedMediaAssetId, setVerifiedMediaAssetId] = useState(null);
  const [editMediaFile, setEditMediaFile] = useState(null);
  const [editPendingUploadId, setEditPendingUploadId] = useState(null);
  const [editVerifiedMediaAssetId, setEditVerifiedMediaAssetId] = useState(null);
  const [editUploadStatus, setEditUploadStatus] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingContentId, setDeletingContentId] = useState(null);

  const [contentCatalog, setContentCatalog] = useState([]);
  const [comments, setComments] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // --- ACTIONS ENGINE HANDLERS ---
  const showToast = useCallback((message, tone = 'purple') => {
    setToast({ message, tone });
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getMyContent({ signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return;
        setContentCatalog(items.map((content) => {
          const type = content.type.toLowerCase();
          return {
            id: content._id,
            type,
            title: content.title,
            views: content.viewCount || 0,
            likes: 0,
            commentsCount: 0,
            date: content.createdAt
              ? new Date(content.createdAt).toLocaleDateString()
              : '',
            category: content.categoryIds?.[0]?.name || '',
            isSubscriberOnly: false,
            mediaUrl: content.mediaUrl || '',
            thumbnail: content.thumbnailUrl || content.mediaUrl || '',
            images: type === 'image' && content.mediaUrl ? [content.mediaUrl] : [],
          };
        }));
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          showToast(error.message || 'Could not load your content.', 'red');
        }
      });
    return () => controller.abort();
  }, [showToast]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getMyCreatorAnalytics({ signal: controller.signal }),
      getMyCreatorComments({ signal: controller.signal }),
    ])
      .then(([creatorAnalytics, creatorComments]) => {
        if (controller.signal.aborted) return;
        setAnalytics(creatorAnalytics);
        setComments(creatorComments.map((comment) => {
          const ownReplies = comment.replies?.filter((reply) =>
            String(reply.userId?._id || reply.userId) === String(user.id || user._id)
          ) || [];
          const author = comment.userId || {};
          return {
            id: comment._id,
            type: comment.contentId?.type?.toLowerCase() || "",
            author: author.name || author.username || "User",
            handle: author.username ? `@${author.username}` : "",
            text: comment.text,
            assetTitle: comment.contentId?.title || "Published content",
            replyText: ownReplies.at(-1)?.text || "",
          };
        }));
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          showToast(error.message || "Could not load creator analytics and comments.", "red");
        }
      });
    return () => controller.abort();
  }, [showToast, user]);

  const handleUnfollowTarget = (id) => {
    if (window.confirm("Remove this connection?")) {
      setFollowing(following.filter(item => item.id !== id));
      showToast("Connection removed", "red");
    }
  };

  const executeProfileImageUpload = (e, targetProperty) => {
    const file = e.target.files[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setChannelIdentity(prev => ({ ...prev, [targetProperty]: localUrl }));
      showToast("Profile media updated", "purple");
    }
  };

  const handlePublishAsset = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return showToast("Content context required!", "red");
    if (contentType !== 'tweet' && !(uploadedFilesArray[0] instanceof File)) {
      return showToast("Select a local image or video file first.", "red");
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
          throw new Error("Possible duplicate: this upload is waiting for moderator review.");
        }
        mediaAssetId = verifiedUpload._id;
        setVerifiedMediaAssetId(mediaAssetId);
        setPendingUploadId(null);
      }

      const type = contentType === 'tweet'
        ? 'Tweet'
        : contentType === 'video'
          ? 'Video'
          : 'Image';
      setUploadStatus('Publishing verified content');
      const content = await createContent({
        type,
        title: contentType === 'tweet' ? formTitle.trim().slice(0, 200) : formTitle.trim(),
        description: contentType === 'tweet' ? formTitle.trim() : '',
        mediaAssetId,
        publish: true,
      });
      const newAsset = {
        id: content._id,
        type: contentType,
        title: content.title,
        views: content.viewCount || 0,
        likes: 0,
        commentsCount: 0,
        date: "Just now",
        category: '',
        isSubscriberOnly: false,
        mediaUrl: content.mediaUrl || '',
        thumbnail: content.thumbnailUrl || content.mediaUrl || '',
        images: contentType === 'image' ? [content.mediaUrl] : [],
      };

      setContentCatalog((items) => [newAsset, ...items.filter((item) => item.id !== newAsset.id)]);
      setFormTitle('');
      setUploadedFilesArray([]);
      setVerifiedMediaAssetId(null);
      setPendingUploadId(null);
      setUploadStatus('');
      showToast("Verified content published.", "green");
    } catch (error) {
      if (["duplicate", "failed"].includes(error.uploadStatus)) {
        setPendingUploadId(null);
        setVerifiedMediaAssetId(null);
      }
      setUploadStatus('');
      showToast(error.message || "Content upload failed.", "red");
    } finally {
      setIsPublishing(false);
    }
  };

  const resetMediaUploadState = () => {
    setVerifiedMediaAssetId(null);
    setPendingUploadId(null);
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm("Archive this content? It will no longer be publicly listed.")) return;
    setDeletingContentId(id);
    try {
      await archiveContent(id);
      setContentCatalog((items) => items.filter((item) => item.id !== id));
      showToast("Content archived.", "green");
    } catch (error) {
      showToast(error.message || "Could not archive content.", "red");
    } finally {
      setDeletingContentId(null);
    }
  };

  const startEditingAsset = (asset) => {
    setEditingItemId(asset.id);
    setEditFormState({ ...asset });
    setEditMediaFile(null);
    setEditPendingUploadId(null);
    setEditVerifiedMediaAssetId(null);
    setEditUploadStatus('');
  };

  const cancelEditingAsset = () => {
    setEditingItemId(null);
    setEditFormState({});
    setEditMediaFile(null);
    setEditPendingUploadId(null);
    setEditVerifiedMediaAssetId(null);
    setEditUploadStatus('');
  };

  const saveEditedAsset = async () => {
    if (!editFormState.title?.trim()) {
      showToast("Content title or post text is required.", "red");
      return;
    }
    setIsSavingEdit(true);
    setEditUploadStatus(editMediaFile ? "Preparing replacement media" : "Saving changes");
    try {
      let mediaAssetId = editVerifiedMediaAssetId;
      if (editMediaFile && !mediaAssetId) {
        let uploadId = editPendingUploadId;
        if (!uploadId) {
          const queuedUpload = await uploadMedia(editMediaFile);
          uploadId = queuedUpload.uploadId;
          setEditPendingUploadId(uploadId);
        }
        setEditUploadStatus("Verifying replacement media");
        const verifiedUpload = await waitForMediaUpload(uploadId, setEditUploadStatus);
        if (verifiedUpload.reviewPending) {
          setEditUploadStatus("Possible duplicate: waiting for moderator review. Save again after review.");
          throw new Error("Possible duplicate: replacement media is waiting for moderator review.");
        }
        mediaAssetId = verifiedUpload._id;
        setEditVerifiedMediaAssetId(mediaAssetId);
        setEditPendingUploadId(null);
      }

      const payload = {
        title: editFormState.title.trim(),
        ...(editFormState.type === 'tweet'
          ? { description: editFormState.title.trim() }
          : {}),
        ...(mediaAssetId ? { mediaAssetId } : {}),
      };
      const updated = await updateContentRecord(editingItemId, payload);
      setContentCatalog((items) => items.map((item) => item.id === editingItemId
        ? {
          ...item,
          title: updated.title,
          mediaUrl: updated.mediaUrl || '',
          thumbnail: updated.thumbnailUrl || updated.mediaUrl || '',
          images: item.type === 'image' && updated.mediaUrl ? [updated.mediaUrl] : [],
        }
        : item));
      cancelEditingAsset();
      showToast("Content updated.", "green");
    } catch (error) {
      if (["duplicate", "failed"].includes(error.uploadStatus)) {
        setEditPendingUploadId(null);
        setEditVerifiedMediaAssetId(null);
      }
      if (!error.uploadStatus && !error.message?.includes("waiting for moderator review")) {
        setEditUploadStatus(error.message || "Could not save changes.");
      }
      showToast(error.message || "Could not save changes.", "red");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleEditMediaFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditMediaFile(file);
    setEditPendingUploadId(null);
    setEditVerifiedMediaAssetId(null);
    setEditUploadStatus('');
  };

  const submitReplyToComment = async (commentId, replyString) => {
    if (!replyString.trim()) return;
    try {
      const reply = await addCommentReply(commentId, replyString.trim());
      setComments((current) => current.map((comment) => (
        comment.id === commentId ? { ...comment, replyText: reply.text } : comment
      )));
      showToast("Reply posted.", "blue");
    } catch (error) {
      showToast(error.message || "Could not post reply.", "red");
    }
  };

  // Filters Engine Mappings
  const filteredCatalog = contentCatalog.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = catalogTab === 'all' ? true : item.type === catalogTab;
    return matchesSearch && matchesTab;
  });

  const filteredComments = comments.filter(comment => {
    if (commentTab === 'all') return true;
    return comment.type === commentTab;
  });

  const typeAccent = {
    video: { text: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/30' },
    image: { text: 'text-green-400', bg: 'bg-green-950/30', border: 'border-green-500/30' },
    tweet: { text: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-500/30' },
  };

  const toastTone = {
    purple: 'bg-purple-950/90 border-purple-500/50 text-purple-200',
    blue: 'bg-blue-950/90 border-blue-500/50 text-blue-200',
    green: 'bg-green-950/90 border-green-500/50 text-green-200',
    red: 'bg-red-950/90 border-red-500/50 text-red-200',
  };

  return (
    <div className="cd-root bg-transparent text-slate-100 min-h-screen relative overflow-x-hidden font-sans selection:bg-purple-500/30 select-none pb-12 all-font">

      {/* AMBIENT GLOW CHASSIS */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-purple-950/15 via-blue-950/5 to-transparent pointer-events-none z-0" />
      <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-purple-600/5 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] bg-cyan-600/5 blur-[140px] rounded-full pointer-events-none z-0" />

      {/* SYSTEM TOAST PIPELINE */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[60] px-4 py-3 border rounded-xl shadow-2xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 backdrop-blur-md ${toastTone[toast.tone] || toastTone.purple}`}
          >
            <Check className="w-3.5 h-3.5 animate-pulse" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CORE FRAMEWORK CONTAINER LINKS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 relative z-10">
        
        <IdentitySuite 
          channelIdentity={channelIdentity}
          setChannelIdentity={setChannelIdentity}
          isEditingProfileText={isEditingProfileText}
          setIsEditingProfileText={setIsEditingProfileText}
          wallpaperInputRef={wallpaperInputRef}
          avatarInputRef={avatarInputRef}
          executeProfileImageUpload={executeProfileImageUpload}
        />

        <MetricArchitecture 
          analytics={analytics}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <UploadContentForm 
              contentType={contentType} setContentType={setContentType}
              formTitle={formTitle} setFormTitle={setFormTitle}
              uploadedFilesArray={uploadedFilesArray} setUploadedFilesArray={setUploadedFilesArray}
              resetMediaUploadState={resetMediaUploadState}
              handlePublishAsset={handlePublishAsset}
              isPublishing={isPublishing} uploadStatus={uploadStatus}
            />
          </div>

          <div className="lg:col-span-2">
            <ContentCatalogStream 
              catalogTab={catalogTab} setCatalogTab={setCatalogTab}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              filteredCatalog={filteredCatalog} editingItemId={editingItemId}
              startEditingAsset={startEditingAsset} handleDeleteAsset={handleDeleteAsset}
              deletingContentId={deletingContentId}
              editFormState={editFormState} setEditFormState={setEditFormState}
              editFileInputRef={editFileInputRef}
              editMediaFile={editMediaFile}
              handleEditMediaFileChange={handleEditMediaFileChange}
              editUploadStatus={editUploadStatus}
              isSavingEdit={isSavingEdit}
              saveEditedAsset={saveEditedAsset} cancelEditingAsset={cancelEditingAsset}
              typeAccent={typeAccent}
            />
          </div>
        </div>

        <DiagnosticMatrix 
          commentTab={commentTab} setCommentTab={setCommentTab}
          filteredComments={filteredComments} submitReplyToComment={submitReplyToComment}
        />

      </div>

      <RegistryModals 
        activeModal={activeModal} setActiveModal={setActiveModal}
        followers={followers} following={following}
        handleUnfollowTarget={handleUnfollowTarget}
      />
    </div>
  );
}

export default function CreatorDashboard() {
  const dispatch = useDispatch();
  const { user, initialized } = useSelector((state) => state.auth);
  const [creator, setCreator] = useState(null);
  const [displayName, setDisplayName] = useState(user?.name || user?.username || '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) return undefined;
    const controller = new AbortController();
    getMyCreatorProfile({ signal: controller.signal })
      .then((profile) => {
        if (controller.signal.aborted) return;
        setCreator(profile);
        setError('');
        if (profile?.applicationStatus === 'approved' && user.role !== 'creator') {
          const updatedUser = { ...user, role: 'creator' };
          localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
          dispatch(loginSuccess(updatedUser));
        }
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) setError(loadError.message || 'Could not load creator status.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [dispatch, refreshKey, user]);

  if (!initialized) {
    return <main className="mx-auto max-w-3xl p-8 text-center text-slate-300">Checking your account...</main>;
  }
  if (!user) return <Navigate to="/signup" replace />;
  if (loading) {
    return <main className="mx-auto max-w-3xl p-8 text-center text-slate-300">Loading creator account...</main>;
  }
  if (creator?.applicationStatus === 'approved') return <CreatorStudio creator={creator} user={user} />;

  const handleApplication = async (event) => {
    event.preventDefault();
    if (displayName.trim().length < 2) {
      setError('Channel name must be at least 2 characters.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const application = await applyAsCreator(displayName.trim());
      setCreator(application);
    } catch (submitError) {
      setError(submitError.message || 'Could not submit your creator application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-white">
      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Creator setup</p>
        <h1 className="mt-2 text-2xl font-bold">Create your creator channel</h1>
        {creator?.applicationStatus === 'pending' ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-slate-300">
              Your application for <strong>{creator.displayName}</strong> is waiting for admin approval. Uploading and publishing will be available after approval.
            </p>
            <button type="button" onClick={() => { setLoading(true); setRefreshKey((key) => key + 1); }} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold hover:bg-cyan-500">
              Check application status
            </button>
          </div>
        ) : creator?.applicationStatus === 'suspended' ? (
          <p className="mt-5 text-sm text-amber-200">This creator account is suspended. Contact support for assistance.</p>
        ) : (
          <form onSubmit={handleApplication} className="mt-5 space-y-4">
            {creator?.applicationStatus === 'rejected' && (
              <p className="text-sm text-amber-200">Your previous application was declined. Update your channel name to apply again.</p>
            )}
            <label className="block text-sm font-medium text-slate-300" htmlFor="creator-display-name">
              Channel name
            </label>
            <input
              id="creator-display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={100}
              minLength={2}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              placeholder="Enter your creator channel name"
            />
            <p className="text-xs text-slate-400">Your application is reviewed before creator uploads are enabled.</p>
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <button type="submit" disabled={submitting} className="rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold hover:bg-cyan-500 disabled:cursor-wait disabled:opacity-60">
              {submitting ? 'Submitting...' : creator ? 'Apply again' : 'Create creator channel'}
            </button>
          </form>
        )}
        {error && creator?.applicationStatus && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      </section>
    </main>
  );
}