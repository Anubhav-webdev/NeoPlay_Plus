import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import IdentitySuite from './CreatorIdentity';
import MetricArchitecture from './CreatorAnalytics';
import UploadContentForm from './UploadContentForm';
import ContentCatalogStream from './ContentCatalogStream';
import DiagnosticMatrix from './DiagnosticMatrix';

import { useCreatorProfile } from './hooks/useCreatorProfile';
import { useCreatorContent } from './hooks/useCreatorContent';
import { getMyCreatorAnalytics } from '../../../api/mediaApi'
import { getMyCreatorComments, addCommentReply } from '../../../api/commentsApi';

export default function CreatorStudioView({ creator, user }) {
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, tone = 'purple') => {
    setToast({ message, tone });
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const profile = useCreatorProfile(user, showToast);
  const content = useCreatorContent(showToast);

  const [analytics, setAnalytics] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentTab, setCommentTab] = useState('all');

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getMyCreatorAnalytics({ signal: controller.signal }),
      getMyCreatorComments({ signal: controller.signal }),
    ])
      .then(([creatorAnalytics, creatorComments]) => {
        if (controller.signal.aborted) return;
        setAnalytics(creatorAnalytics);
        setComments(
          creatorComments.map((comment) => {
            const ownReplies =
              comment.replies?.filter(
                (reply) => String(reply.userId?._id || reply.userId) === String(user.id || user._id)
              ) || [];
            const author = comment.userId || {};
            return {
              id: comment._id,
              type: comment.contentId?.type?.toLowerCase() || '',
              author: author.name || author.username || 'User',
              handle: author.username ? `@${author.username}` : '',
              avatar: author.avatar || '',
              text: comment.text,
              assetTitle: comment.contentId?.title || 'Published content',
              replyText: ownReplies.at(-1)?.text || '',
              replyAvatar: ownReplies.at(-1)?.userId?.avatar || creator.avatar || '',
            };
          })
        );
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          showToast(error.message || 'Could not load creator analytics and comments.', 'red');
        }
      });

    return () => controller.abort();
  }, [showToast, user, creator.avatar]);

  const submitReplyToComment = async (commentId, replyString) => {
    if (!replyString.trim()) return;
    try {
      const reply = await addCommentReply(commentId, replyString.trim());
      setComments((current) =>
        current.map((comment) => (comment.id === commentId ? { ...comment, replyText: reply.text } : comment))
      );
      showToast('Reply posted.', 'blue');
    } catch (error) {
      showToast(error.message || 'Could not post reply.', 'red');
    }
  };

  const filteredComments = comments.filter((comment) => {
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
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-purple-950/15 via-blue-950/5 to-transparent pointer-events-none z-0" />
      <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-purple-600/5 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] bg-cyan-600/5 blur-[140px] rounded-full pointer-events-none z-0" />

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 relative z-10">
        <IdentitySuite
          channelIdentity={profile.channelIdentity}
          setChannelIdentity={profile.setChannelIdentity}
          isEditingProfileText={profile.isEditingProfileText}
          setIsEditingProfileText={profile.setIsEditingProfileText}
          wallpaperInputRef={profile.wallpaperInputRef}
          avatarInputRef={profile.avatarInputRef}
          executeProfileImageUpload={profile.executeProfileImageUpload}
          onSaveProfile={profile.handleSaveCreatorProfile}
          isSavingProfile={profile.isSavingProfile}
          isUploadingProfileImage={profile.isUploadingProfileImage}
        />

        <MetricArchitecture analytics={analytics} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <UploadContentForm
              contentType={content.contentType} setContentType={content.setContentType}
              formTitle={content.formTitle} setFormTitle={content.setFormTitle}
              formDescription={content.formDescription} setFormDescription={content.setFormDescription}
              uploadedFilesArray={content.uploadedFilesArray} setUploadedFilesArray={content.setUploadedFilesArray}
              thumbnailFile={content.thumbnailFile} setThumbnailFile={content.setThumbnailFile}
              resetThumbnailUploadState={content.resetThumbnailUploadState}
              categories={content.categories} selectedCategoryId={content.selectedCategoryId}
              setSelectedCategoryId={content.setSelectedCategoryId}
              publishMode={content.publishMode} setPublishMode={content.setPublishMode}
              resetMediaUploadState={content.resetMediaUploadState}
              handlePublishAsset={content.handlePublishAsset}
              isPublishing={content.isPublishing} uploadStatus={content.uploadStatus}
            />
          </div>

          <div className="lg:col-span-2">
            <ContentCatalogStream
              catalogTab={content.catalogTab} setCatalogTab={content.setCatalogTab}
              searchQuery={content.searchQuery} setSearchQuery={content.setSearchQuery}
              filteredCatalog={content.filteredCatalog} editingItemId={content.editingItemId}
              startEditingAsset={content.startEditingAsset} handleDeleteAsset={content.handleDeleteAsset}
              handlePublishDraft={content.handlePublishDraft} publishingContentId={content.publishingContentId}
              deletingContentId={content.deletingContentId}
              editFormState={content.editFormState} setEditFormState={content.setEditFormState}
              editFileInputRef={content.editFileInputRef}
              editMediaFile={content.editMediaFile}
              editThumbnailFile={content.editThumbnailFile}
              handleEditThumbnailFileChange={content.handleEditThumbnailFileChange}
              categories={content.categories}
              handleEditMediaFileChange={content.handleEditMediaFileChange}
              editUploadStatus={content.editUploadStatus}
              isSavingEdit={content.isSavingEdit}
              saveEditedAsset={content.saveEditedAsset} cancelEditingAsset={content.cancelEditingAsset}
              typeAccent={typeAccent}
            />
          </div>
        </div>

        <DiagnosticMatrix
          creatorAvatar={profile.channelIdentity.avatar}
          commentTab={commentTab} setCommentTab={setCommentTab}
          filteredComments={filteredComments} submitReplyToComment={submitReplyToComment}
        />
      </div>
    </div>
  );
}