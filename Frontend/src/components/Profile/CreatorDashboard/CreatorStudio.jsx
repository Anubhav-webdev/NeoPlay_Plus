import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import CreatorIdentity from './CreatorIdentity.jsx';
import CreatorAnalytics from './CreatorAnalytics.jsx';
import UploadContentForm from './UploadContentForm.jsx';
import CreatorContentCatalog from './CreatorContentCatalog.jsx';
import CreatorComments from './CreatorComments.jsx';
import SubscriptionsModal from './SubscriptionsModal.jsx';
import useCreatorCatalogActions from './hooks/useCreatorCatalogActions.js';
import useCreatorProfile from './hooks/useCreatorProfile.js';
import useCreatorPublisher from './hooks/useCreatorPublisher.js';
import useCreatorStudioData from './hooks/useCreatorStudioData.js';
import useCreatorSubscriptions from './hooks/useCreatorSubscriptions.js';

const TYPE_ACCENT = {
  video: { text: 'text-blue-400', bg: 'bg-blue-950/30', border: 'border-blue-500/30' },
  image: { text: 'text-green-400', bg: 'bg-green-950/30', border: 'border-green-500/30' },
  tweet: { text: 'text-purple-400', bg: 'bg-purple-950/30', border: 'border-purple-500/30' },
};

const TOAST_TONE = {
  purple: 'bg-purple-950/90 border-purple-500/50 text-purple-200',
  blue: 'bg-blue-950/90 border-blue-500/50 text-blue-200',
  green: 'bg-green-950/90 border-green-500/50 text-green-200',
  red: 'bg-red-950/90 border-red-500/50 text-red-200',
};

export default function CreatorStudio({ creator, user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogTab, setCatalogTab] = useState('all');
  const [commentTab, setCommentTab] = useState('all');
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, tone = 'purple') => {
    window.clearTimeout(toastTimerRef.current);
    setToast({ message, tone });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);

  const data = useCreatorStudioData(user, showToast);
  const profile = useCreatorProfile(creator, user, showToast);
  const publisher = useCreatorPublisher({
    categories: data.categories,
    setContentCatalog: data.setContentCatalog,
    showToast,
  });
  const catalog = useCreatorCatalogActions({
    categories: data.categories,
    setContentCatalog: data.setContentCatalog,
    showToast,
  });
  const subscriptions = useCreatorSubscriptions(showToast);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredCatalog = useMemo(() => data.contentCatalog.filter((item) => (
    (catalogTab === 'all' || item.type === catalogTab)
      && item.title.toLowerCase().includes(normalizedSearch)
  )), [catalogTab, data.contentCatalog, normalizedSearch]);

  const filteredComments = useMemo(() => data.comments.filter((comment) => (
    commentTab === 'all' || comment.type === commentTab
  )), [commentTab, data.comments]);

  return (
    <div className="cd-root relative min-h-screen overflow-x-hidden bg-transparent pb-12 font-sans text-slate-100 selection:bg-purple-500/30 all-font">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[600px] bg-gradient-to-b from-purple-950/15 via-blue-950/5 to-transparent" />
      <div className="pointer-events-none absolute -left-[10%] top-[20%] z-0 h-[500px] w-[500px] rounded-full bg-purple-600/5 blur-[140px]" />
      <div className="pointer-events-none absolute -right-[10%] top-[40%] z-0 h-[500px] w-[500px] rounded-full bg-cyan-600/5 blur-[140px]" />

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed right-6 top-6 z-[60] flex items-center gap-2 rounded-xl border px-4 py-3 text-[11px] font-bold uppercase tracking-widest shadow-2xl backdrop-blur-md ${TOAST_TONE[toast.tone] || TOAST_TONE.purple}`}
          >
            <Check className="h-3.5 w-3.5 animate-pulse" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        <CreatorIdentity
          channelIdentity={profile.channelIdentity}
          creatorId={creator.creatorId}
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

        <CreatorAnalytics
          analytics={data.analytics}
          onManageSubscriptions={subscriptions.openSubscriptions}
          isLoadingSubscriptions={subscriptions.isLoading}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <UploadContentForm
              contentType={publisher.type}
              setContentType={publisher.setContentType}
              formTitle={publisher.title}
              setFormTitle={publisher.setFormTitle}
              formDescription={publisher.description}
              setFormDescription={publisher.setFormDescription}
              mediaFile={publisher.mediaFile}
              setMediaFile={publisher.setMediaFile}
              thumbnailFile={publisher.thumbnailFile}
              setThumbnailFile={publisher.setThumbnailFile}
              resetThumbnailUploadState={publisher.resetThumbnailUploadState}
              categories={data.categories}
              selectedCategoryId={publisher.categoryId}
              setSelectedCategoryId={publisher.setSelectedCategoryId}
              publishMode={publisher.publishMode}
              setPublishMode={publisher.setPublishMode}
              resetMediaUploadState={publisher.resetMediaUploadState}
              handlePublishAsset={publisher.handlePublishAsset}
              isPublishing={publisher.isPublishing}
              uploadStatus={publisher.uploadStatus}
            />
          </div>

          <div className="lg:col-span-2">
            <CreatorContentCatalog
              catalogTab={catalogTab}
              setCatalogTab={setCatalogTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredCatalog={filteredCatalog}
              editingItemId={catalog.editingItemId}
              startEditingAsset={catalog.startEditingAsset}
              handleDeleteAsset={catalog.handleDeleteAsset}
              deletingContentId={catalog.deletingContentId}
              handlePublishDraft={catalog.handlePublishDraft}
              publishingContentId={catalog.publishingContentId}
              editFormState={catalog.editFormState}
              setEditFormState={catalog.setEditFormState}
              editFileInputRef={catalog.editFileInputRef}
              editMediaFile={catalog.editMediaFile}
              handleEditMediaFileChange={catalog.handleEditMediaFileChange}
              editUploadStatus={catalog.editUploadStatus}
              isSavingEdit={catalog.isSavingEdit}
              editThumbnailFile={catalog.editThumbnailFile}
              handleEditThumbnailFileChange={catalog.handleEditThumbnailFileChange}
              categories={data.categories}
              saveEditedAsset={catalog.saveEditedAsset}
              cancelEditingAsset={catalog.cancelEditingAsset}
              typeAccent={TYPE_ACCENT}
            />
          </div>
        </div>

        <CreatorComments
          commentTab={commentTab}
          setCommentTab={setCommentTab}
          filteredComments={filteredComments}
          submitReplyToComment={data.submitReplyToComment}
        />
      </main>

      <SubscriptionsModal
        isOpen={subscriptions.isOpen}
        setIsOpen={subscriptions.setIsOpen}
        subscriptions={subscriptions.subscriptions}
        isLoading={subscriptions.isLoading}
        unsubscribingCreatorId={subscriptions.unsubscribingCreatorId}
        onUnsubscribe={subscriptions.unsubscribe}
      />
    </div>
  );
}
