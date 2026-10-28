
import { motion } from "framer-motion";
import { UploadCloud, Video, Image as ImageIcon } from "lucide-react";
import { FiTwitter } from "react-icons/fi";
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
  uploadedFilesArray,
  setUploadedFilesArray,
  resetMediaUploadState,
  handlePublishAsset,
  isPublishing,
  uploadStatus,
}) {
  const handleTypeTabSwitch = (type) => {
    setContentType(type);
    setUploadedFilesArray([]);
    resetMediaUploadState();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      setUploadedFilesArray([file]);
      resetMediaUploadState();
    }
  };

  const isTweet = contentType === "tweet";

  const acceptedFiles =
    contentType === "video"
      ? VIDEO_UPLOAD_ACCEPT
      : contentType === "image"
        ? IMAGE_UPLOAD_ACCEPT
        : MEDIA_UPLOAD_ACCEPT;

  const selectedFile = uploadedFilesArray[0];

  return (
    <div className="relative rounded-[24px] border border-slate-800/60 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-xl">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-bold tracking-tight text-white">
        <UploadCloud className="h-5 w-5 text-purple-500" />
        Upload Media Content
      </h3>

      {/* Content Type Tabs */}
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
        {/* Title or Post Text */}
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {isTweet ? "Post text" : "Content title"}
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

        {/* File Upload */}
        <motion.div
          key={contentType}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {isTweet ? "Optional verified attachment" : "Media file"}
          </label>

          <label className="group flex min-h-24 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950 p-3 text-center transition-colors hover:border-purple-500/50">
            <UploadCloud className="mb-1 h-5 w-5 text-slate-600 transition-colors group-hover:text-purple-400" />

            <span className="text-[10px] font-medium tracking-wide text-slate-400">
              {isTweet
                ? "Select an image or video attachment"
                : `Select a ${contentType}`}
            </span>

            {selectedFile && (
              <span className="mt-1 break-all text-[10px] font-bold text-purple-400">
                {selectedFile.name}
              </span>
            )}

            <input
              type="file"
              accept={acceptedFiles}
              onChange={handleFileChange}
              disabled={isPublishing}
              className="hidden"
            />
          </label>

          <p className="text-[10px] text-slate-500">
            {isTweet
              ? "Attachments are verified before they are stored."
              : "The upload is checked for duplicates before it can be published."}
          </p>
        </motion.div>

        {/* Upload Status */}
        {uploadStatus && (
          <p
            role="status"
            aria-live="polite"
            className="text-xs text-purple-300"
          >
            {uploadStatus}
          </p>
        )}

        {/* Animated Progress Bar */}
        {isPublishing && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4 animate-pulse text-purple-400" />
                <span className="text-[11px] font-bold text-slate-200">
                  Publishing content...
                </span>
              </div>

              <span className="text-[10px] font-semibold text-purple-400">
                Please wait
              </span>
            </div>

            <div
              role="progressbar"
              aria-label="Publishing progress"
              aria-valuetext="Publishing in progress"
              className="h-2 w-full overflow-hidden rounded-full bg-slate-800"
            >
              <motion.div
                className="h-full w-1/3 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400"
                animate={{ x: ["-100%", "300%"] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>

            <p className="text-[10px] text-slate-500">
              Please keep this page open while your content is being processed.
            </p>
          </motion.div>
        )}

        {/* Publish Button */}
        <button
          type="submit"
          disabled={isPublishing}
          className="mt-2 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-purple-950/20 transition-all hover:from-purple-500 hover:to-indigo-500 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
        >
          {isPublishing ? "Processing..." : "Publish Content"}
        </button>
      </form>
    </div>
  );
}
