import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess } from '../../../redux/slices/authSlice.js';
import {
  applyAsCreator,
  getMyCreatorProfile,
  updateMyCreatorProfile,
  uploadCreatorProfileImage,
} from '../../../api/mediaApi.js';
import CreatorStudio from './CreatorStudio.jsx';
import CreatorSetupForm from './CreatorSetupForm.jsx';
import '../../../App.css';

export default function CreatorDashboard() {
  const dispatch = useDispatch();
  const { user, initialized } = useSelector((state) => state.auth);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [creatorProfileUnavailable, setCreatorProfileUnavailable] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    const controller = new AbortController();

    getMyCreatorProfile({ signal: controller.signal })
      .then((profile) => {
        if (controller.signal.aborted) return;
        setCreator(profile);
        setError('');
        setCreatorProfileUnavailable(false);
        if (profile?.applicationStatus === 'approved' && user.role !== 'creator') {
          const updatedUser = { ...user, role: 'creator' };
          localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
          dispatch(loginSuccess(updatedUser));
        }
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) {
          setCreatorProfileUnavailable(true);
          setError(loadError.message || 'Could not load creator status.');
        }
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
  if (creator?.applicationStatus === 'approved') {
    return <CreatorStudio creator={creator} user={user} />;
  }
  if (creatorProfileUnavailable && !creator) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-white">
        <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 sm:p-8">
          <h1 className="text-xl font-bold">Could not load your creator status</h1>
          <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => {
              setCreatorProfileUnavailable(false);
              setLoading(true);
              setRefreshKey((key) => key + 1);
            }}
            className="mt-5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold hover:bg-cyan-500"
          >
            Retry
          </button>
        </section>
      </main>
    );
  }

  const handleSetupSubmit = async ({ profile, avatarFile, bannerFile }) => {
    setSubmitting(true);
    setError('');
    let setupSaved = false;
    try {
      let updatedCreator = creator?.applicationStatus === 'pending'
        ? await updateMyCreatorProfile(profile)
        : await applyAsCreator(profile);
      setupSaved = true;
      setCreator(updatedCreator);

      for (const [imageType, file] of [['avatar', avatarFile], ['banner', bannerFile]]) {
        if (!file) continue;
        updatedCreator = await uploadCreatorProfileImage(file, imageType);
        setCreator(updatedCreator);
      }
      return true;
    } catch (submitError) {
      const message = submitError.message || 'Could not save your creator setup.';
      setError(setupSaved
        ? `Your channel details are saved, but an image could not be uploaded: ${message}`
        : message);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  if (creator?.applicationStatus === 'suspended') {
    return <main className="mx-auto max-w-2xl px-4 py-12 text-sm text-amber-200">This creator account is suspended. Contact support for assistance.</main>;
  }

  return (
    <CreatorSetupForm
      creator={creator}
      user={user}
      onSubmit={handleSetupSubmit}
      isSaving={submitting}
      error={error}
      onRefreshStatus={() => {
        setLoading(true);
        setRefreshKey((key) => key + 1);
      }}
    />
  );
}
