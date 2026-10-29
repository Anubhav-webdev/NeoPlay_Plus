import { motion } from "framer-motion";
import { UploadCloud, Video, Image as ImageIcon } from "lucide-react";
import { FiTwitter } from "react-icons/fi";
import useFilePreviewUrl from "./useFilePreviewUrl.js";
import {
  IMAGE_UPLOAD_ACCEPT,
  MEDIA_UPLOAD_ACCEPT,
  VIDEO_UPLOAD_ACCEPT,
} from "../../../constants/mediaTypes.js";

export default function UploadContentForm({
  contentType,
  setContentType,
  formTitle,
  setFormTitle,
  formDescription,
  setFormDescription,
  uploadedFilesArray,
  setUploadedFilesArray,
  thumbnailFile,
  setThumbnailFile,
  resetThumbnailUploadState,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  publishMode,
  setPublishMode,
  resetMediaUploadState,
  handlePublishAsset,
  isPublishing,
  uploadStatus,
}) {
  const thumbnailPreview = useFilePreviewUrl(thumbnailFile);

  const handleTypeTabSwitch = (type) => {
    setContentType(type);
    setUploadedFilesArray([]);
    setThumbnailFile(null);
    resetMediaUploadState();
    resetThumbnailUploadState();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      setUploadedFilesArray([file]);
      resetMediaUploadState();
    }
  };

  const handleThumbnailChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      setThumbnailFile(file);
      resetThumbnailUploadState();
    }
  };

  const isTweet = contentType === "tweet";
  const acceptedFiles = contentType === "video"
    ? VIDEO_UPLOAD_ACCEPT
    : contentType === "image"
      ? IMAGE_UPLOAD_ACCEPT
      : MEDIA_UPLOAD_ACCEPT;
  const selectedFile = uploadedFilesArray[0];

  return (
    <div className="relative rounded-[24px] border border-slate-800/60 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-xl">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-bold tracking-tight text-white">
        <UploadCloud className="h-5 w-5 text-purple-500" />
        Create content
      </h3>

      <div className="mb-5 grid grid-cols-3 gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950 p-1">
        {["video", "image", "tweet"].map((type) => (
          <button
            key={type}
            type="button"
            disabled={isPublishing}
            onClick={() => handleTypeTabSwitch(type)}
            className={`flex items-center justify-center gap-1 rounded-lg py-2 text-[10px] font-extrabold uppercase tracking-wider transition-all ${
              contentType === type
                ? type === "video"
                  ? "bg-blue-600 text-white"
                  : type === "image"
                    ? "bg-green-600 text-white"
                    : "bg-purple-600 text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {type === "video" && <Video className="h-3 w-3" />}
            {type === "image" && <ImageIcon className="h-3 w-3" />}
            {type === "tweet" && <FiTwitter className="h-3 w-3" />}
            {type}
          </button>
        ))}
      </div>

      <form onSubmit={handlePublishAsset} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {isTweet ? "Post text" : "Title"}
          </label>
          {isTweet ? (
            <textarea
              value={formTitle}
              maxLength={5000}
              onChange={(event) => setFormTitle(event.target.value)}
              placeholder="Write your post..."
              disabled={isPublishing}
              className="h-24 w-full resize-none rounded-xl border border-slate-800/80 bg-slate-950 p-3 text-xs text-slate-200 transition-colors focus:border-purple-500 focus:outline-none disabled:opacity-60"
            />
          ) : (
            <input
              type="text"
              value={formTitle}
              maxLength={200}
              onChange={(event) => setFormTitle(event.target.value)}
              placeholder="Add a title for your content..."
              disabled={isPublishing}
              className="w-full rounded-xl border border-slate-800/80 bg-slate-950 p-3 text-xs text-slate-200 transition-colors focus:border-purple-500 focus:outline-none disabled:opacity-60"
            />
          )}
        </div>

        {!isTweet && (
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Description <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              value={formDescription}
              maxLength={5000}
              onChange={(event) => setFormDescription(event.target.value)}
              placeholder="Tell viewers what this video or image is about..."
              disabled={isPublishing}
              className="h-24 w-full resize-y rounded-xl border border-slate-800/80 bg-slate-950 p-3 text-xs text-slate-200 transition-colors focus:border-purple-500 focus:outline-none disabled:opacity-60"
            />
            <p className="mt-1 text-right text-[10px] text-slate-600">{formDescription.length}/5000</p>
          </div>
        )}

        <motion.div
          key={contentType}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {isTweet ? "Optional attachment" : contentType === "video" ? "Video file" : "Image file"}
          </label>
          <label className="group flex min-h-24 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950 p-3 text-center transition-colors hover:border-purple-500/50">
            <UploadCloud className="mb-1 h-5 w-5 text-slate-600 transition-colors group-hover:text-purple-400" />
            <span className="text-[10px] font-medium tracking-wide text-slate-400">
              {isTweet ? "Select an image or video attachment" : `Select a ${contentType}`}
            </span>
            {selectedFile && <span className="mt-1 break-all text-[10px] font-bold text-purple-400">{selectedFile.name}</span>}
            <input
              type="file"
              accept={acceptedFiles}
              onChange={handleFileChange}
              disabled={isPublishing}
              className="hidden"
            />
          </label>
          <p className="text-[10px] text-slate-500">
            {isTweet ? "Attachments are verified before they are stored." : "Media is checked for duplicates before publishing."}
          </p>
        </motion.div>

        {contentType === "video" && (
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Video thumbnail <span className="text-purple-300">(required)</span>
            </label>
            <label className="group flex min-h-20 w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-800 bg-slate-950 p-3 transition-colors hover:border-purple-500/50">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Selected video thumbnail preview" className="h-16 w-28 rounded-lg object-cover" />
              ) : (
                <span className="flex h-16 w-28 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-slate-600">
                  <ImageIcon className="h-5 w-5" />
                </span>
              )}
              <span className="min-w-0 text-[10px] font-medium text-slate-400">
                <span className="block font-bold text-slate-200">{thumbnailFile ? thumbnailFile.name : "Choose a thumbnail image"}</span>
                <span className="mt-1 block">Use a clear 16:9 image to represent your video.</span>
              </span>
              <input
                type="file"
                accept={IMAGE_UPLOAD_ACCEPT}
                onChange={handleThumbnailChange}
                disabled={isPublishing}
                className="hidden"
              />
            </label>
          </div>
        )}

        {!isTweet && (
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Category</label>
            <select
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
              disabled={isPublishing}
              className="w-full rounded-xl border border-slate-800/80 bg-slate-950 p-3 text-xs text-slate-200 focus:border-purple-500 focus:outline-none disabled:opacity-60"
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Visibility</label>
          <select
            value={publishMode}
            onChange={(event) => setPublishMode(event.target.value)}
            disabled={isPublishing}
            className="w-full rounded-xl border border-slate-800/80 bg-slate-950 p-3 text-xs text-slate-200 focus:border-purple-500 focus:outline-none disabled:opacity-60"
          >
            <option value="public">Public — visible to everyone</option>
            <option value="draft">Draft — only you can see it</option>
          </select>
        </div>

        {uploadStatus && <p role="status" aria-live="polite" className="text-xs text-purple-300">{uploadStatus}</p>}

        {isPublishing && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4 animate-pulse text-purple-400" />
                <span className="text-[11px] font-bold text-slate-200">{publishMode === "public" ? "Publishing content..." : "Saving draft..."}</span>
              </div>
              <span className="text-[10px] font-semibold text-purple-400">Please wait</span>
            </div>
            <div role="progressbar" aria-label="Saving content" aria-valuetext="Upload in progress" className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <motion.div className="h-full w-1/3 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
            </div>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isPublishing}
          className="mt-2 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-purple-950/20 transition-all hover:from-purple-500 hover:to-indigo-500 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
        >
          {isPublishing ? "Processing..." : publishMode === "public" ? "Publish content" : "Save draft"}
        </button>
      </form>
    </div>
  );
}
