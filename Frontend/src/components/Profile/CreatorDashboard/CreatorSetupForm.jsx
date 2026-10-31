import { useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import useFilePreviewUrl from "./useFilePreviewUrl.js";

const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;

export default function CreatorSetupForm({
  creator,
  user,
  onSubmit,
  isSaving,
  error,
  onRefreshStatus,
}) {
  const [profile, setProfile] = useState(() => ({
    displayName: creator?.displayName || user?.name || user?.username || "",
    tagline: creator?.tagline || "",
    about: creator?.about || "",
  }));
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [localError, setLocalError] = useState("");
  const avatarPreview = useFilePreviewUrl(avatarFile);
  const bannerPreview = useFilePreviewUrl(bannerFile);
  const avatarUrl = avatarPreview || creator?.avatar || "";
  const bannerUrl = bannerPreview || creator?.banner || "";
  const isPending = creator?.applicationStatus === "pending";
  const isRejected = creator?.applicationStatus === "rejected";

  const updateField = (field) => (event) => {
    setProfile((current) => ({ ...current, [field]: event.target.value }));
  };

  const chooseImage = (event, setFile, label) => {
    const file = event.currentTarget.files?.[0] || null;
    event.currentTarget.value = "";
    if (file && file.size > MAX_PROFILE_IMAGE_BYTES) {
      setLocalError(`${label} must be 5 MB or smaller.`);
      return;
    }
    setLocalError("");
    setFile(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setLocalError("");
    const saved = await onSubmit({
      profile: {
        displayName: profile.displayName.trim(),
        tagline: profile.tagline.trim(),
        about: profile.about.trim(),
      },
      avatarFile,
      bannerFile,
    });
    if (saved) {
      setAvatarFile(null);
      setBannerFile(null);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-white">
      <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70 shadow-xl">
        <div className="border-b border-slate-800 px-6 py-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Creator setup</p>
          <h1 className="mt-2 text-2xl font-bold">
            {isPending ? "Complete your creator channel" : isRejected ? "Update your channel application" : "Create your creator channel"}
          </h1>
          {isPending && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-amber-200">
              <span>Your application is waiting for admin approval.</span>
              <button
                type="button"
                onClick={onRefreshStatus}
                className="rounded-md border border-amber-300/30 px-2.5 py-1 text-xs font-semibold hover:bg-white/5"
              >
                Check status
              </button>
            </div>
          )}
          {isRejected && (
            <p className="mt-3 text-sm text-amber-200">Update your channel details and resubmit for review. Your Creator ID stays the same.</p>
          )}
        </div>

        <form onSubmit={submit} className="space-y-6 px-6 py-6 sm:px-8">
          <div>
            <label htmlFor="creator-channel-name" className="mb-1.5 block text-sm font-medium text-slate-300">
              Channel name / username
            </label>
            <input
              id="creator-channel-name"
              value={profile.displayName}
              onChange={updateField("displayName")}
              maxLength={100}
              minLength={2}
              required
              disabled={isSaving}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-60"
              placeholder="For example, Pixel Studio"
            />
          </div>

          <div>
            <label htmlFor="creator-id" className="mb-1.5 block text-sm font-medium text-slate-300">
              Permanent Creator ID
            </label>
            {creator?.creatorId ? (
              <input
                id="creator-id"
                value={`@${creator.creatorId}`}
                readOnly
                aria-describedby="creator-id-help"
                className="w-full cursor-not-allowed rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-cyan-300 outline-none"
              />
            ) : (
              <p className="rounded-lg border border-dashed border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-400">
                Generated automatically when you create your channel
              </p>
            )}
            <p id="creator-id-help" className="mt-1.5 text-xs text-slate-500">
              A unique ID based on your channel name plus numbers. It is saved to your account and cannot be changed.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="creator-tagline" className="mb-1.5 block text-sm font-medium text-slate-300">Tagline</label>
              <input
                id="creator-tagline"
                value={profile.tagline}
                onChange={updateField("tagline")}
                maxLength={160}
                disabled={isSaving}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-60"
                placeholder="A short line about your channel"
              />
              <p className="mt-1 text-right text-xs text-slate-500">{profile.tagline.length}/160</p>
            </div>
            <div>
              <label htmlFor="creator-about" className="mb-1.5 block text-sm font-medium text-slate-300">About your channel</label>
              <textarea
                id="creator-about"
                value={profile.about}
                onChange={updateField("about")}
                maxLength={2000}
                rows={4}
                disabled={isSaving}
                className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-60"
                placeholder="Tell viewers what you create and what they can expect."
              />
              <p className="mt-1 text-right text-xs text-slate-500">{profile.about.length}/2000</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <span className="mb-2 block text-sm font-medium text-slate-300">Avatar image</span>
              <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950 p-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Creator avatar preview" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-slate-400"><Camera size={22} /></div>
                )}
                <label className="cursor-pointer text-sm font-semibold text-cyan-300 hover:text-cyan-200">
                  {avatarFile?.name || (creator?.avatar ? "Change avatar" : "Choose avatar")}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isSaving}
                    onChange={(event) => chooseImage(event, setAvatarFile, "Avatar")}
                    className="sr-only"
                  />
                </label>
              </div>
              <p className="mt-1 text-xs text-slate-500">JPEG, PNG, or WebP; maximum 5 MB.</p>
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium text-slate-300">Background image</span>
              <div className="relative flex h-[88px] items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Creator banner preview" className="absolute inset-0 h-full w-full object-cover opacity-70" />
                ) : (
                  <ImagePlus className="text-slate-500" size={24} />
                )}
                <label className="relative z-10 cursor-pointer rounded-lg bg-slate-950/80 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-slate-950">
                  {bannerFile?.name || (creator?.banner ? "Change background" : "Choose background")}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isSaving}
                    onChange={(event) => chooseImage(event, setBannerFile, "Background image")}
                    className="sr-only"
                  />
                </label>
              </div>
              <p className="mt-1 text-xs text-slate-500">JPEG, PNG, or WebP; maximum 5 MB.</p>
            </div>
          </div>

          {(localError || error) && (
            <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {localError || error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-lg bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-500 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
          >
            {isSaving ? "Saving channel details and images..." : isPending ? "Save profile" : isRejected ? "Resubmit application" : "Create creator channel"}
          </button>
          {!creator && <p className="text-xs text-slate-500">Your channel and permanent Creator ID are created before review. Publishing unlocks after approval.</p>}
        </form>
      </section>
    </main>
  );
}
