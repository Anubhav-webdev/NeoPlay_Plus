import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess } from '../../../redux/slices/authSlice.js';
import { applyAsCreator, getMyCreatorProfile } from '../../../api/mediaApi.js';
import CreatorStudio from './CreatorStudio.jsx';
import '../../../App.css';

export default function CreatorDashboard() {
  const dispatch = useDispatch();
  const { user, initialized } = useSelector((state) => state.auth);
  const [creator, setCreator] = useState(null);
  const [displayName, setDisplayName] = useState(user?.name || user?.username || '');
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

  const handleApplication = async (event) => {
    event.preventDefault();
    const name = displayName.trim();
    if (name.length < 2) {
      setError('Channel name must be at least 2 characters.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      setCreator(await applyAsCreator(name));
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
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setRefreshKey((key) => key + 1);
              }}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold hover:bg-cyan-500"
            >
              Check application status
            </button>
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
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
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-semibold hover:bg-cyan-500 disabled:cursor-wait disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : creator ? 'Apply again' : 'Create creator channel'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
