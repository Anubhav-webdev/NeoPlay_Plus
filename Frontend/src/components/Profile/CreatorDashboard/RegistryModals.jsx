import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function RegistryModals({
  activeModal,
  setActiveModal,
  following,
  isLoadingFollowing,
  unsubscribingCreatorId,
  handleUnfollowTarget,
}) {
  return (
    <AnimatePresence>
      {activeModal === 'following' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setActiveModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md rounded-[28px] border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              aria-label="Close subscriptions"
              className="absolute right-5 top-5 text-slate-500 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-300">Your subscriptions</h3>

            {isLoadingFollowing ? (
              <p role="status" className="py-6 text-center text-xs text-slate-400">Loading your subscriptions...</p>
            ) : following.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">You are not subscribed to any creators yet.</p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {following.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 transition-colors hover:border-cyan-500/30">
                    <div className="flex min-w-0 items-center gap-3">
                      {channel.avatar ? (
                        <img src={channel.avatar} alt={`${channel.name} profile photo`} className="h-9 w-9 flex-shrink-0 rounded-xl border border-slate-800 object-cover" />
                      ) : (
                        <span aria-hidden="true" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-slate-300">
                          {channel.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <p className="truncate text-xs font-bold text-slate-200">{channel.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnfollowTarget(channel.id)}
                      disabled={Boolean(unsubscribingCreatorId)}
                      className="flex-shrink-0 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 transition-all hover:border-red-500/50 hover:bg-red-950/40 hover:text-red-300 disabled:cursor-wait disabled:opacity-50"
                    >
                      {String(unsubscribingCreatorId) === String(channel.id) ? 'Saving...' : 'Unsubscribe'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
